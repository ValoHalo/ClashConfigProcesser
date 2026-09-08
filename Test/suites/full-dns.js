'use strict';

function runFullDnsTests(h, api, meta, fx) {
  // ---------------- DNS 与 hosts ----------------
  h.section('集成测试 · DNS 与 hosts');
  h.test('节点 DNS 只使用脚本允许的私有 DNS 来源', () => {
    const cfg = fx.typicalSubscription();
    // 移除 listen 触发条件，避免 listen 地址被当作公共 DNS 过滤干扰本用例
    delete cfg.dns.listen;
    cfg.dns['nameserver'] = ['8.8.8.8', 'https://ordinary.example-dns.com/dns-query#proxy'];
    cfg.dns['proxy-server-nameserver'] = ['223.5.5.5', 'https://private-proxy.example-dns.com/dns-query#proxy'];
    const out = api.main(cfg);
    h.assertEqual(out.dns.enable, true);
    h.assertEqual(out.dns['enhanced-mode'], 'fake-ip');
    h.assert(
      out.dns['proxy-server-nameserver'].includes('https://private-proxy.example-dns.com/dns-query'),
      '应保留 proxy-server-nameserver 中的私有 DNS',
    );
    if (meta.full) {
      h.assert(
        !out.dns['proxy-server-nameserver'].includes('https://ordinary.example-dns.com/dns-query'),
        '全量版不应把普通 nameserver 提升为节点 DNS',
      );
    } else {
      h.assert(
        out.dns['proxy-server-nameserver'].includes('https://ordinary.example-dns.com/dns-query'),
        '精简版沿用上游的 nameserver 提取逻辑',
      );
    }
    h.assert(!out.dns['proxy-server-nameserver'].includes('8.8.8.8'), '公共 DNS 应被过滤');
    h.assert(!out.dns['proxy-server-nameserver'].includes('223.5.5.5'), 'proxy-server-nameserver 公共 DNS 应被过滤');
    h.assert(!out.dns['proxy-server-nameserver'].some((d) => d.includes('#')), '私有 DNS 不应含 # 后缀');
  });
  h.test('私有 DNS 后缀处理：非 direct 剥离、direct 整条保留（含参数、忽略大小写）', () => {
    const cfg = fx.typicalSubscription();
    // 非 direct 后缀 → 剥离
    cfg.dns['proxy-server-nameserver-policy']['hk1.example.com'] = ['https://private.example-dns.com/dns-query#proxy'];
    // direct 后缀 → 整条保留（含附加参数、忽略大小写）
    cfg.dns['nameserver'] = [
      'https://private.example-dns.com/dns-query#direct',
      'https://private.example-dns.com/dns-query#direct&ecs=2.2.2.2',
    ];
    const out = api.main(cfg);
    h.assertDeep(out.dns['proxy-server-nameserver-policy']['hk1.example.com'], [
      'https://private.example-dns.com/dns-query',
    ]);
    const nodeDns = out.dns['proxy-server-nameserver'];
    if (meta.full) {
      h.assert(!nodeDns.includes('https://private.example-dns.com/dns-query#direct'), '普通 nameserver 不应提升');
      h.assert(
        !nodeDns.includes('https://private.example-dns.com/dns-query#direct&ecs=2.2.2.2'),
        '普通 nameserver 不应提升',
      );
    } else {
      h.assert(nodeDns.includes('https://private.example-dns.com/dns-query#direct'), '应保留 #direct 后缀');
      h.assert(
        nodeDns.includes('https://private.example-dns.com/dns-query#direct&ecs=2.2.2.2'),
        '应整条保留 #direct 及附加参数',
      );
    }
  });
  h.test('节点域名对应 nameserver-policy 与 proxy-server-nameserver-policy 被保留', () => {
    const cfg = fx.typicalSubscription();
    // 补充 nameserver-policy 来源，验证其与 proxy-server-nameserver-policy 合并后一起保留
    cfg.dns['nameserver-policy'] = {
      'jp1.example.com': 'https://private-ns.example-dns.com/dns-query',
      'unrelated-ns.com': 'https://foo-ns.com/dns-query',
    };
    const out = api.main(cfg);
    h.assertDeep(out.dns['proxy-server-nameserver-policy'], {
      // 来自 proxy-server-nameserver-policy
      'hk1.example.com': 'https://private.example-dns.com/dns-query',
      '+.example.com': ['https://other-dns.com/dns-query'],
      // 来自 nameserver-policy
      'jp1.example.com': 'https://private-ns.example-dns.com/dns-query',
    });
    if (meta.full) {
      h.assertEqual(
        out.dns['nameserver-policy']['jp1.example.com'],
        'https://private-ns.example-dns.com/dns-query',
        '全量版应同时保留订阅原始 nameserver-policy',
      );
      h.assert(out.dns['proxy-server-nameserver'].includes('https://private-ns.example-dns.com/dns-query'));
    }
  });
  if (meta.full) {
    h.test('无匹配节点 policy 时使用国内 DNS 解析节点域名', () => {
      const cfg = fx.minimalSubscription();
      cfg.dns = {
        nameserver: ['https://ordinary.example-dns.com/dns-query'],
        'nameserver-policy': {
          'unrelated.example.com': 'https://provider.example-dns.com/dns-query',
        },
      };
      const out = api.main(cfg);
      h.assertDeep(out.dns['proxy-server-nameserver'], [
        'https://dns.alidns.com/dns-query#DIRECT',
        'https://doh.pub/dns-query#DIRECT',
      ]);
      h.assert(!('proxy-server-nameserver-policy' in out.dns), '不应生成无关节点 policy');
    });
  }
  h.test('节点私有 DNS 保留 DIRECT 参数、过滤公共解析器并去重', () => {
    const cfg = fx.minimalSubscription();
    const direct = 'https://provider.example.net/dns-query#direct&ecs=2.2.2.2';
    cfg.dns = {
      nameserver: ['https://ordinary.example.net/dns-query'],
      'proxy-server-nameserver': [direct, '223.5.5.5'],
      'nameserver-policy': {
        'a.example.com': [direct, '8.8.8.8'],
        'b.example.com': 'https://second.example.net/dns-query#directxxx',
      },
    };
    const out = api.main(cfg);
    h.assertDeep(out.dns['proxy-server-nameserver'], [direct, 'https://second.example.net/dns-query']);
    h.assertDeep(out.dns['proxy-server-nameserver-policy'], {
      'a.example.com': [direct],
      'b.example.com': 'https://second.example.net/dns-query',
    });
    h.assertDeep(out.dns['nameserver-policy']['a.example.com'], cfg.dns['nameserver-policy']['a.example.com']);
  });
  h.test('相同私有 DNS 的节点精确策略保持原有作用范围', () => {
    const cfg = fx.minimalSubscription();
    cfg.dns = {
      'nameserver-policy': {
        'a.example.com': 'https://provider.example.net/dns-query',
        'b.example.com': 'https://provider.example.net/dns-query',
      },
    };
    const out = api.main(cfg);
    h.assertDeep(out.dns['proxy-server-nameserver-policy'], cfg.dns['nameserver-policy']);
    h.assertDeep(out.dns['proxy-server-nameserver'], ['https://provider.example.net/dns-query']);
  });
  h.test('节点 hosts 映射改写为 server，不再复制 hosts', () => {
    const out = api.main(fx.typicalSubscription());
    const p = out.proxies.find((x) => x.name === '🇭🇰 香港 01 | 中转');
    h.assertEqual(p.server, '10.0.0.1', 'hosts 映射的节点 server 应被改写');
    h.assert(!('hk1.example.com' in out.hosts), '映射后的节点 hosts 不应复制到新配置');
    h.assert(!('www.unrelated.com' in out.hosts), '无关 hosts 应被过滤');
    h.assertDeep(out.hosts['dns.google'], ['8.8.8.8', '8.8.4.4']);
  });
  h.test('fake-ip-filter 保留匹配条目并过滤无关条目', () => {
    // 节点域名（精确/后缀/通配）保留，无关条目与 rule-set 被过滤，默认条目置于头部
    const out = api.main(fx.typicalSubscription());
    const f = out.dns['fake-ip-filter'];
    h.assert(f.includes('hk1.example.com'), '精确匹配的节点域名应保留');
    h.assert(f.includes('+.example.com'), '后缀匹配的节点域名应保留');
    h.assert(f.includes('*.example.com'), '通配匹配的节点域名应保留');
    h.assert(!f.includes('www.unrelated.com'), '无关条目应被过滤');
    h.assert(!f.includes('rule-set:unrelated'), 'rule-set 条目应被过滤');
    h.assertEqual(f[0], 'rule-set:private');
    h.assertEqual(f[1], 'rule-set:fakeip_filter');
    // hosts 映射目标域名场景：保留目标域名对应的条目
    const f2 = api.main(fx.hostsMappedSubscription()).dns['fake-ip-filter'];
    h.assert(f2.includes('+.example-apt.com'), '节点 hosts 映射目标域名对应的条目应保留');
    h.assert(!f2.includes('+.unrelated-filter.com'), '与节点无关的条目应被过滤');
  });
  h.test('hosts 改写触发条件不满足时跳过改写', () => {
    const find = (cfg) => api.main(cfg).proxies.find((x) => x.name === '🇭🇰 香港 01 | 中转');
    // proxy-server-nameserver 长度不为 1（含多个 DNS，其中一个包含 listen 值）→ 不触发
    let cfg = fx.typicalSubscription();
    cfg.dns['proxy-server-nameserver'] = ['8.8.8.8', '198.18.0.1:53'];
    h.assertEqual(find(cfg).server, 'hk1.example.com', 'proxy-server-nameserver 长度不为 1 时不应改写');
    // 长度为 1 但不包含 listen 值 → 不触发
    cfg = fx.typicalSubscription();
    cfg.dns['proxy-server-nameserver'] = ['8.8.8.8'];
    h.assertEqual(find(cfg).server, 'hk1.example.com', '未命中触发条件时不应改写');
    // listen 缺失或为空字符串 → 不触发，且空串不当作私有 DNS 保留
    for (const listen of [undefined, '']) {
      cfg = fx.typicalSubscription();
      if (listen === undefined) delete cfg.dns.listen;
      else cfg.dns.listen = listen;
      const out = api.main(cfg);
      h.assertEqual(find(cfg).server, 'hk1.example.com', 'listen 缺失/为空时不应改写');
      h.assert(!out.dns['proxy-server-nameserver'].includes(''), '不应将空串当作私有 DNS 保留');
    }
  });
  h.test('无 dns/hosts 输入时生成默认配置', () => {
    const cfg = fx.typicalSubscription();
    delete cfg.dns;
    delete cfg.hosts;
    const out = api.main(cfg);
    h.assertEqual(out.dns.enable, true);
    h.assertDeep(out.hosts['dns.google'], ['8.8.8.8', '8.8.4.4']);
  });
}

module.exports = { runFullDnsTests };
