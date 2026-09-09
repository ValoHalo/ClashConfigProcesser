'use strict';

function runFullBehaviorTests(h, api, fx, loadScript, scriptFile) {
  const node = (name, extra = {}) => ({
    name,
    type: 'ss',
    server: 'node.example.net',
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'placeholder',
    ...extra,
  });
  const withHosts = (proxies, hosts) => ({
    proxies,
    hosts,
    dns: { listen: '0.0.0.0:1053', 'proxy-server-nameserver': ['127.0.0.1:1053'] },
  });
  const customApi = (proxies) =>
    loadScript(scriptFile, (code) =>
      code.replace('const customizeProxies = [];', `const customizeProxies = ${JSON.stringify(proxies)};`),
    );
  const withOptions = (options, fn) => {
    const saved = { ...api.ruleOptionsEnable };
    Object.assign(api.ruleOptionsEnable, options);
    try {
      fn();
    } finally {
      Object.assign(api.ruleOptionsEnable, saved);
    }
  };

  h.section('全量版 · 倍率与节点引用');
  for (const [name, expected] of [
    ['JP 0.5x', '低倍率节点'],
    ['JP 0.50倍', '低倍率节点'],
    ['JP x0.05', '低倍率节点'],
    ['JP 0x', '低倍率节点'],
    ['JP 0.51x', null],
    ['JP 0.59x', null],
    ['JP v0.5', null],
    ['JP 1.99x', null],
    ['2x JP', '高倍率节点'],
    ['JP*3', '高倍率节点'],
    ['JP x2.5', '高倍率节点'],
  ]) {
    h.test(`倍率识别：${name}`, () => {
      const rates = api
        .getMatchedRegions(name)
        .filter((r) => /倍率节点$/.test(r.name))
        .map((r) => r.name);
      h.assertDeep(rates, expected ? [expected] : []);
    });
  }
  h.test('过滤低倍率时保留 0.59x 节点', () =>
    withOptions({ 过滤低倍率节点: true }, () => {
      const out = api.main({ proxies: [node('JP 0.59x'), node('JP 0.5x')] });
      h.assertEqual(out.proxies.filter((p) => p.type === 'ss').length, 1);
      h.assert(out.proxies.some((p) => p.name.includes('0.59x')));
    }),
  );
  h.test('节点与策略组重名时分配唯一名称并更新 dialer-proxy', () => {
    const out = api.main({
      proxies: [node('默认代理'), node('节点-默认代理'), node('JP relay', { 'dialer-proxy': '默认代理' })],
    });
    const names = [...out.proxies, ...out['proxy-groups']].map((p) => p.name);
    h.assertEqual(new Set(names).size, names.length);
    const target = out.proxies.find((p) => p.name.includes('relay'))['dialer-proxy'];
    h.assert(target !== '默认代理');
    h.assert(out.proxies.some((p) => p.name === target));
  });
  h.test('自定义节点内部引用随名称标准化更新', () => {
    const out = customApi([node('JP custom'), node('US custom', { 'dialer-proxy': 'JP custom' })]).main(
      fx.minimalSubscription(),
    );
    const target = out.proxies.find((p) => p.name.includes('US custom'))['dialer-proxy'];
    h.assertEqual(target, '🇯🇵 JP custom');
  });
  h.test('拒绝节点循环中转引用', () => {
    h.assertThrows(
      () => api.main({ proxies: [node('JP a', { 'dialer-proxy': 'JP b' }), node('JP b', { 'dialer-proxy': 'JP a' })] }),
      /循环/,
    );
  });
  h.test('拒绝自定义节点不存在的中转目标', () => {
    h.assertThrows(
      () => customApi([node('JP custom', { 'dialer-proxy': 'missing' })]).main(fx.minimalSubscription()),
      /引用不存在/,
    );
  });

  h.section('全量版 · DNS 参数与依赖');
  h.test('剥离 DNS 路由选择器时保留所有键值参数', () => {
    for (const suffix of ['h3=true&ecs=192.0.2.0/24', 'old-group&h3=true&ecs=192.0.2.0/24']) {
      h.assertEqual(
        api.stripDnsSuffix(`https://resolver.example.net/dns-query#${suffix}`),
        'https://resolver.example.net/dns-query#h3=true&ecs=192.0.2.0/24',
      );
    }
  });
  h.test('公共 DNS 仅按主机名和 IP 识别', () => {
    for (const address of [
      'https://resolver.example.net/dns-query?upstream=8.8.8.8',
      'https://dns.google.customer.example.net/dns-query',
    ]) {
      const cfg = fx.minimalSubscription();
      cfg.dns = { 'proxy-server-nameserver': [address] };
      h.assertDeep(api.main(cfg).dns['proxy-server-nameserver'], [address]);
    }
  });
  h.test('公共 IPv6 的展开形式也被识别', () => {
    const cfg = fx.minimalSubscription();
    cfg.dns = { 'proxy-server-nameserver': ['tls://[2606:4700:4700:0:0:0:0:1111]:853'] };
    h.assert(!api.main(cfg).dns['proxy-server-nameserver'].some((d) => d.includes('2606:')));
  });
  h.test('保留 DNS policy 需要的订阅规则集，移除缺失依赖', () => {
    const cfg = fx.minimalSubscription();
    cfg['rule-providers'] = { airport_domains: { type: 'inline', behavior: 'domain', payload: ['+.example.net'] } };
    cfg['proxy-groups'] = [{ name: 'old-group', type: 'select', proxies: [cfg.proxies[0].name] }];
    cfg.dns = {
      'nameserver-policy': {
        'rule-set:airport_domains': 'https://resolver.example.net/dns-query#old-group&ecs=192.0.2.0/24',
        'rule-set:missing': 'https://resolver.example.net/dns-query',
        'keep.example.net': 'https://resolver.example.net/dns-query#默认代理&h3=true',
      },
    };
    const out = api.main(cfg);
    h.assertDeep(out['rule-providers'].airport_domains, cfg['rule-providers'].airport_domains);
    h.assertEqual(
      out.dns['nameserver-policy']['rule-set:airport_domains'],
      'https://resolver.example.net/dns-query#ecs=192.0.2.0/24',
    );
    h.assert(!('rule-set:missing' in out.dns['nameserver-policy']));
    h.assertEqual(out.dns['nameserver-policy']['keep.example.net'], cfg.dns['nameserver-policy']['keep.example.net']);
  });
  h.test('订阅 DNS 规则集与内置规则集重名时隔离名称和下载路径', () => {
    const cfg = fx.minimalSubscription();
    cfg['rule-providers'] = {
      ai: {
        type: 'http',
        behavior: 'domain',
        format: 'mrs',
        path: './ruleset/ai.mrs',
        url: 'https://rules.example.net/ai.mrs',
      },
    };
    cfg.dns = { 'nameserver-policy': { 'rule-set:ai': 'https://resolver.example.net/dns-query' } };
    const out = api.main(cfg);
    const key = Object.keys(out.dns['nameserver-policy']).find((k) => k !== 'rule-set:cn');
    const provider = out['rule-providers'][key.slice('rule-set:'.length)];
    h.assert(key !== 'rule-set:ai');
    h.assertEqual(provider.url, cfg['rule-providers'].ai.url);
    h.assert(provider.path !== out['rule-providers'].ai.path);
  });
  h.test('DNS 策略中的订阅节点选择器随重命名更新', () => {
    const cfg = {
      proxies: [node('JP node')],
      dns: { 'nameserver-policy': { 'site.example.net': 'https://resolver.example.net/dns-query#JP node&h3=true' } },
    };
    h.assertEqual(
      api.main(cfg).dns['nameserver-policy']['site.example.net'],
      'https://resolver.example.net/dns-query#🇯🇵 JP node&h3=true',
    );
  });
  h.test('hosts 本地 DNS 触发条件区分端口', () => {
    const cfg = withHosts([node('JP node')], { 'node.example.net': '192.0.2.1' });
    cfg.dns['proxy-server-nameserver'] = ['127.0.0.1:2053'];
    h.assertEqual(api.main(cfg).proxies[0].server, 'node.example.net');
  });

  h.section('全量版 · hosts 与传输参数');
  h.test('hosts 匹配采用更具体的域名和单层通配优先', () => {
    const cases = [
      [{ '.example.net': '192.0.2.1', '*.example.net': '192.0.2.2' }, 'a.example.net'],
      [{ '+.example.net': '192.0.2.1', '+.b.example.net': '192.0.2.2' }, 'a.b.example.net'],
      [{ '+.example.net': '192.0.2.1', 'x.*.example.net': '192.0.2.2' }, 'x.b.example.net'],
    ];
    for (const [hosts, server] of cases)
      h.assertEqual(api.applyHostsToProxies([node('JP node', { server })], hosts)[0].server, '192.0.2.2');
  });
  h.test('hosts 映射循环明确报错', () => {
    h.assertThrows(
      () =>
        api.main(
          withHosts([node('JP node')], {
            'node.example.net': 'other.example.net',
            'other.example.net': 'node.example.net',
          }),
        ),
      /循环/,
    );
  });
  h.test('TLS 节点改写地址时保留隐式服务器名和显式服务器名', () => {
    for (const [type, field] of [
      ['trojan', 'sni'],
      ['vmess', 'servername'],
      ['vless', 'servername'],
      ['anytls', 'sni'],
      ['hysteria2', 'sni'],
    ]) {
      const cfg = withHosts([node('JP node', { type, tls: true })], { 'node.example.net': '192.0.2.1' });
      let out = api.main(cfg);
      h.assertEqual(out.proxies[0].server, '192.0.2.1');
      h.assertEqual(out.proxies[0][field], 'node.example.net');
      cfg.proxies[0][field] = 'explicit.example.net';
      out = api.main(cfg);
      h.assertEqual(out.proxies[0][field], 'explicit.example.net');
    }
  });
  h.test('WS 和 gRPC 保留原始 Host、authority 与 TLS 默认值', () => {
    for (const network of ['ws', 'grpc', 'xhttp']) {
      const proxy = node('🇯🇵 JP node', {
        type: 'vless',
        tls: true,
        network,
        'ws-opts': { headers: { Host: 'front.example.net' }, path: '/path' },
      });
      const cfg = withHosts([proxy], { 'node.example.net': '192.0.2.1' });
      const out = api.main(cfg);
      h.assertDeep(out.proxies[0], proxy);
      h.assertEqual(out.hosts['node.example.net'], '192.0.2.1');
    }
  });
  h.test('显式节点 DNS 的规则集策略保留自身依赖和附加参数', () => {
    const cfg = fx.minimalSubscription();
    cfg['rule-providers'] = { airport: { type: 'inline', behavior: 'domain', payload: ['+.example.com'] } };
    cfg.dns = {
      'proxy-server-nameserver-policy': {
        'rule-set:airport': ['https://resolver.example.net/dns-query#removed&h3=true'],
      },
    };
    const out = api.main(cfg);
    h.assertDeep(out.dns['proxy-server-nameserver-policy']['rule-set:airport'], [
      'https://resolver.example.net/dns-query#h3=true',
    ]);
    h.assertDeep(out['rule-providers'].airport, cfg['rule-providers'].airport);
  });
  h.test('含 x 的普通名称不被当成倍率前缀', () => {
    h.assert(!api.getMatchedRegions('JP box0.5').some((r) => r.name === '低倍率节点'));
  });
  h.test('保留传输层域名时仍保留 hosts 别名目标的私有 DNS 策略', () => {
    const cfg = withHosts([node('JP WS', { network: 'ws' })], { 'node.example.net': 'alias.example.net' });
    cfg.dns['nameserver-policy'] = { 'alias.example.net': 'https://resolver.example.net/dns-query' };
    cfg.dns['fake-ip-filter'] = ['alias.example.net'];
    const out = api.main(cfg);
    h.assertEqual(out.proxies[0].server, 'node.example.net');
    h.assertEqual(out.hosts['node.example.net'], 'alias.example.net');
    h.assertEqual(
      out.dns['proxy-server-nameserver-policy']['alias.example.net'],
      cfg.dns['nameserver-policy']['alias.example.net'],
    );
    h.assert(out.dns['fake-ip-filter'].includes('alias.example.net'));
  });
  h.test('同名自建节点可引用订阅节点作为中转', () => {
    const out = customApi([node('JP shared', { 'dialer-proxy': 'JP shared' })]).main({ proxies: [node('JP shared')] });
    const custom = out.proxies.find((proxy) => proxy.name.includes('自建-'));
    h.assertEqual(custom['dialer-proxy'], '🇯🇵 JP shared');
  });
  h.test('IPv6 回环 DNS 与通配监听使用相同端口时匹配', () => {
    const cfg = withHosts([node('JP IPv6')], { 'node.example.net': '192.0.2.1' });
    cfg.dns.listen = '[::]:1053';
    cfg.dns['proxy-server-nameserver'] = ['udp://[::1]:1053'];
    h.assertEqual(api.main(cfg).proxies[0].server, '192.0.2.1');
  });
  h.test('hosts 多地址保留全部 IPv4/IPv6 并交给内核选择', () => {
    const addresses = ['192.0.2.1', '2001:db8::1'];
    const cfg = withHosts([node('JP node', { 'ip-version': 'ipv6-prefer' })], {
      'node.example.net': 'alias.example.net',
      'alias.example.net': addresses,
    });
    const out = api.main(cfg);
    h.assertEqual(out.proxies[0].server, 'node.example.net');
    h.assertDeep(out.hosts['node.example.net'], addresses);
    h.assertEqual(out.proxies[0]['ip-version'], 'ipv6-prefer');
  });

  h.section('全量版 · 规则顺序与默认策略');
  h.test('广告及 OneDrive 进程规则优先于国内直连规则', () => {
    const out = api.main(fx.minimalSubscription());
    const index = (rule) => out.rules.indexOf(rule);
    h.assertEqual(out.rules[0], 'RULE-SET,private,直连');
    h.assert(index('RULE-SET,adblockmihomo,AdBlock') < index('RULE-SET,geolocation-cn,直连'));
    h.assert(index('PROCESS-NAME,OneDrive.exe,OneDrive') < index('RULE-SET,geolocation-cn,直连'));
    h.assert(index('RULE-SET,adblockmihomo,AdBlock') < index('PROCESS-NAME,OneDrive.exe,OneDrive'));
  });
  h.test('关闭广告及 OneDrive 后不留下对应规则', () =>
    withOptions({ AdBlock: false, OneDrive: false }, () => {
      const out = api.main(fx.minimalSubscription());
      h.assert(!out.rules.some((r) => r.endsWith(',AdBlock') || r.endsWith(',OneDrive')));
    }),
  );
  h.test('default-selected 同步为候选列表首项', () => {
    const out = api.main(fx.minimalSubscription());
    for (const group of out['proxy-groups'].filter((g) => g['default-selected'])) {
      h.assertEqual(group.proxies[0], group['default-selected']);
    }
  });
  h.test('生成过程不修改订阅对象，连续调用结果一致', () => {
    const cfg = withHosts([node('JP node', { type: 'trojan' })], { 'node.example.net': '192.0.2.1' });
    const before = JSON.stringify(cfg);
    const first = api.main(cfg);
    h.assertEqual(JSON.stringify(cfg), before);
    h.assertDeep(api.main(cfg), first);
  });
}

module.exports = { runFullBehaviorTests };
