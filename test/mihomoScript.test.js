const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const YAML = require('yaml');

const rootDir = path.resolve(__dirname, '..');
const processConfigPath = path.join(rootDir, 'Tools', 'process-config.js');

function processConfig(config) {
  const result = spawnSync(process.execPath, [processConfigPath, '-', '-'], {
    cwd: rootDir,
    input: YAML.stringify(config),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  return YAML.parse(result.stdout);
}

function createProxy(name, server) {
  return {
    name,
    type: 'ss',
    server,
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'test',
  };
}

test('restores private DNS policies that match proxy server domains', () => {
  const privateAirportDns = [
    'https://10.0.0.61:8080/dns-query',
    'https://10.0.0.62:8080/dns-query',
  ];
  const dedicatedProxyDns = ['https://10.0.0.54:8443/dns-query'];

  const output = processConfig({
    proxies: [
      createProxy('HK Test', 'hk01.private-airport.example'),
      createProxy('JP Test', 'jp.node-provider.example'),
    ],
    dns: {
      // 普通 nameserver 不应被当作节点专用 DNS。
      nameserver: ['https://10.0.0.99:8443/dns-query'],
      'proxy-server-nameserver': [
        'https://10.0.0.53:8443/dns-query',
        'https://dns.google/dns-query',
      ],
      'nameserver-policy': {
        '+.private-airport.example': privateAirportDns,
        '+.unrelated.example': ['https://10.0.0.55:8443/dns-query'],
      },
      'proxy-server-nameserver-policy': {
        '+.node-provider.example': dedicatedProxyDns,
        '+.unused-provider.example': ['https://10.0.0.56:8443/dns-query'],
      },
    },
  });

  assert.deepEqual(output.dns['proxy-server-nameserver-policy'], {
    '+.private-airport.example': privateAirportDns,
    '+.node-provider.example': dedicatedProxyDns,
  });
  assert.deepEqual(output.dns['proxy-server-nameserver'], ['https://10.0.0.53:8443/dns-query']);

  // 原始普通域名策略仍保留在 nameserver-policy，不影响订阅本来的解析行为。
  assert.deepEqual(output.dns['nameserver-policy']['+.unrelated.example'], [
    'https://10.0.0.55:8443/dns-query',
  ]);
});

test('omits proxy server policy when the subscription has no matching entry', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
    dns: {
      'nameserver-policy': {
        '+.unrelated.example': ['https://10.0.0.55:8443/dns-query'],
      },
    },
  });

  assert.equal(Object.hasOwn(output.dns, 'proxy-server-nameserver-policy'), false);
  assert.equal(Object.hasOwn(output.dns, 'proxy-server-nameserver'), false);
});

test('activates a matching proxy policy with DNS supplied only by that policy', () => {
  const policyDns = [
    'https://10.0.0.61:8080/dns-query',
    'https://10.0.0.62:8080/dns-query',
  ];
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk01.private-airport.example')],
    dns: {
      'nameserver-policy': {
        '+.private-airport.example': policyDns,
      },
    },
  });

  assert.deepEqual(output.dns['proxy-server-nameserver'], policyDns);
  assert.deepEqual(output.dns['proxy-server-nameserver-policy'], {
    '+.private-airport.example': policyDns,
  });
});

test('uses the selected direct and proxied DNS layout', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
  });

  assert.deepEqual(output.dns.nameserver, [
    'https://dns.cloudflare.com/dns-query#默认代理',
    'https://dns.google/dns-query#默认代理',
    'https://v.recipes/dns-cn#DIRECT',
  ]);
  assert.deepEqual(output.dns['direct-nameserver'], [
    'https://dns.alidns.com/dns-query#DIRECT',
    'https://doh.pub/dns-query#DIRECT',
  ]);
  assert.equal(output.dns.ipv6, true);
  assert.equal(output.ipv6, true);
  assert.equal(Object.hasOwn(output.dns, 'fake-ip-range6'), false);
  assert.equal(Object.hasOwn(output.dns, 'fallback'), false);
  assert.equal(Object.hasOwn(output.dns, 'fallback-filter'), false);
});

test('does not emit the redundant Steam CN provider', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
  });

  assert.equal(Object.hasOwn(output['rule-providers'], 'steam_cn'), false);
  assert.equal(Object.hasOwn(output['rule-providers'], 'cn_additional'), false);
  assert.equal(Object.hasOwn(output['rule-providers'], 'dlsite'), true);
  assert.equal(Object.hasOwn(output['rule-providers'], 'ehentai'), true);
});

test('does not override QUIC routing decisions', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
  });

  assert.equal(output.rules.some((rule) => rule.includes('DST-PORT,443')), false);
});

test('keeps every default selection inside its generated group', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
  });

  for (const group of output['proxy-groups']) {
    if (group['default-selected'] !== undefined) {
      assert.equal(
        group.proxies.includes(group['default-selected']),
        true,
        `${group.name} selects missing proxy ${group['default-selected']}`,
      );
    }
  }
});

test('normalizes proxy flags without creating duplicate names', () => {
  const output = processConfig({
    proxies: [
      createProxy('HK 01', 'hk01.example.com'),
      createProxy('🇭🇰 HK 01', 'hk02.example.com'),
      createProxy('HK 02', 'hk03.example.com'),
    ],
  });
  const proxyNames = output.proxies.slice(0, 3).map((proxy) => proxy.name);

  assert.deepEqual(proxyNames, ['HK 01', '🇭🇰 HK 01', '🇭🇰 HK 02']);
  assert.equal(new Set(proxyNames).size, proxyNames.length);
});

test('preserves personal groups without enabling listener or controller exposure', () => {
  const output = processConfig({
    proxies: [createProxy('HK Test', 'hk.example.com')],
  });
  const groupNames = output['proxy-groups'].map((group) => group.name);
  const groupsByName = new Map(output['proxy-groups'].map((group) => [group.name, group]));

  assert.equal(groupNames.includes('OneDrive'), true);
  assert.equal(groupNames.includes('DLsite'), true);
  assert.equal(groupsByName.get('OneDrive').type, 'select');
  assert.equal(groupsByName.get('DLsite').type, 'select');
  for (const disabledGroup of ['TikTok', 'Emby', 'Spotify', 'Crypto']) {
    assert.equal(groupNames.includes(disabledGroup), false, `${disabledGroup} should remain disabled`);
  }
  assert.equal(groupNames.includes('香港-负载均衡'), true);
  assert.equal(Object.hasOwn(output['rule-providers'], 'adblockmihomo'), true);
  assert.equal(Object.hasOwn(output['rule-providers'], 'adblockmihomolite'), false);
  assert.deepEqual(output.hosts['+.h2.smtcdns.net'], ['0.0.0.0']);

  for (const key of ['mixed-port', 'allow-lan', 'external-controller', 'external-ui', 'external-ui-url']) {
    assert.equal(Object.hasOwn(output, key), false, `${key} should not be generated`);
  }
});
