'use strict';

function runPersonalPolicyTests(h, fx, loadScript, scriptFile) {
  const node = (name, extra = {}) => ({
    name,
    type: 'ss',
    server: 'node.example.net',
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'fixture',
    ...extra,
  });
  const fixture = () => ({ proxies: [node('US 02'), node('JP 01'), node('US 01'), node('HK 01')] });
  const setup = (options = {}) => {
    const api = loadScript(scriptFile);
    Object.assign(api.ruleOptionsEnable, options);
    return api;
  };
  const group = (out, name) => out['proxy-groups'].find((g) => g.name === name);
  const output = (options = {}) => setup(options).main(fixture());

  h.section('个人策略 · 固定出口与更新边界');
  h.test('AI 与 DLsite 默认停止，候选只有指定地区的具体节点', () => {
    const out = output();
    h.assertDeep(group(out, 'AI').proxies, ['REJECT', '🇺🇸 US 01', '🇺🇸 US 02', '🇯🇵 JP 01']);
    h.assertDeep(group(out, 'DLsite').proxies, ['REJECT', '🇯🇵 JP 01']);
    h.assertEqual(group(out, 'AI')['default-selected'], 'REJECT');
    h.assertEqual(group(out, 'AI').interval, 0);
    h.assertEqual(group(out, 'AI').type, 'select');
  });
  h.test('固定出口不受添加所有节点开关影响', () => {
    const out = output({ 分流组添加所有节点: true });
    h.assert(!group(out, 'AI').proxies.some((name) => name.includes('HK') || name === '默认代理'));
  });
  h.test('订阅缺少目标地区时保留停止组与服务规则', () => {
    const out = setup().main({ proxies: [node('HK 01')] });
    h.assertDeep(group(out, 'AI').proxies, ['REJECT']);
    h.assert(out.rules.includes('RULE-SET,ai,AI'));
    h.assertDeep(group(out, 'DLsite').proxies, ['REJECT']);
  });
  h.test('同区备用缺少节点时也停留在停止组', () => {
    const out = setup({ 固定出口同区备用: true }).main({ proxies: [node('HK 01')] });
    h.assertEqual(group(out, 'AI').type, 'select');
    h.assertDeep(group(out, 'AI').proxies, ['REJECT']);
  });
  h.test('关闭固定出口恢复原服务候选和默认地区', () => {
    const out = output({ AI固定出口: false, DLsite固定出口: false });
    h.assertEqual(group(out, 'AI')['default-selected'], '美国');
    h.assert(group(out, 'AI').proxies.includes('默认代理'));
    h.assert(!out.dns['nameserver-policy']['rule-set:ai']);
  });
  h.test('关闭服务不保留个人 DNS 和策略组引用', () => {
    const out = output({ AI: false, DLsite: false });
    h.assert(!group(out, 'AI') && !group(out, 'DLsite'));
    h.assert(!out.dns['nameserver-policy']['rule-set:ai']);
    h.assert(!out.dns['nameserver-policy']['rule-set:dlsite']);
  });
  h.test('指定地区主备按稳定顺序生成，不把 REJECT 当健康备用', () => {
    const out = output({ 固定出口同区备用: true });
    h.assertEqual(group(out, 'AI').type, 'fallback');
    h.assertDeep(group(out, 'AI').proxies, ['🇺🇸 US 01', '🇺🇸 US 02', '🇯🇵 JP 01']);
    h.assertEqual(group(out, 'AI').interval, 400);
  });
  h.test('快速检测只影响个人主备组', () => {
    const out = output({ 固定出口同区备用: true, 快速故障恢复: true });
    h.assertEqual(group(out, 'AI').interval, 120);
    h.assertEqual(group(out, '美国-自动选择').interval, 400);
    h.assertEqual(group(output({ 快速故障恢复: true }), 'AI').interval, 0);
  });
  h.test('节点优先级接受原始名称并限制在目标地区', () => {
    const api = setup({ 固定出口同区备用: true });
    api.personalConfig.fixedExits.AI.priority = ['US 02', 'JP 01', 'HK 01'];
    h.assertDeep(group(api.main(fixture()), 'AI').proxies, ['🇺🇸 US 02', '🇯🇵 JP 01', '🇺🇸 US 01']);
  });
  h.test('固定出口兼容单个地区字符串与单元素列表', () => {
    const api = setup();
    api.personalConfig.fixedExits.AI.region = '美国';
    const scalar = group(api.main(fixture()), 'AI').proxies;
    h.assertDeep(scalar, ['REJECT', '🇺🇸 US 01', '🇺🇸 US 02']);
    api.personalConfig.fixedExits.AI.region = ['美国'];
    h.assertDeep(group(api.main(fixture()), 'AI').proxies, scalar);
  });
  h.test('地区列表顺序控制候选排序，重复地区不重复节点', () => {
    const api = setup();
    api.personalConfig.fixedExits.AI.region = ['日本', '美国', '日本'];
    h.assertDeep(group(api.main(fixture()), 'AI').proxies, ['REJECT', '🇯🇵 JP 01', '🇺🇸 US 01', '🇺🇸 US 02']);
  });
  h.test('地区列表可使用后续地区的节点', () => {
    const api = setup({ 固定出口同区备用: true });
    const out = api.main({ proxies: [node('JP 01'), node('HK 01')] });
    h.assertEqual(group(out, 'AI').type, 'fallback');
    h.assertDeep(group(out, 'AI').proxies, ['🇯🇵 JP 01']);
  });
  h.test('空或未匹配的地区列表保留停止组', () => {
    const api = setup({ 固定出口同区备用: true });
    for (const region of [[], ['未配置地区']]) {
      api.personalConfig.fixedExits.AI.region = region;
      const out = api.main(fixture());
      h.assertEqual(group(out, 'AI').type, 'select');
      h.assertDeep(group(out, 'AI').proxies, ['REJECT']);
    }
  });
  h.test('订阅重排不改变固定出口候选顺序', () => {
    const api = setup();
    const a = fixture();
    const first = group(api.main(a), 'AI').proxies;
    a.proxies.reverse();
    h.assertDeep(group(api.main(a), 'AI').proxies, first);
  });
  h.test('自建节点按地区进入固定出口', () => {
    const api = loadScript(scriptFile, (s) =>
      s.replace('const customizeProxies = [];', 'const customizeProxies = ' + JSON.stringify([node('US own')]) + ';'),
    );
    h.assert(group(api.main(fixture()), 'AI').proxies.includes('🇺🇸 US own'));
  });
  h.test('个人检测明确要求状态码且保持超时/容差', () => {
    const out = output({ 固定出口同区备用: true });
    for (const name of ['AI', '美国-自动选择']) {
      h.assertEqual(group(out, name)['expected-status'], 200);
      h.assertEqual(group(out, name).timeout, 3000);
      h.assertEqual(group(out, name)['max-failed-times'], 2);
    }
    h.assertEqual(group(out, '美国-自动选择').tolerance, 50);
  });

  h.section('个人策略 · DNS 出口与私有解析');
  h.test('默认通用 DNS 只有代理 DoH，服务 DNS 各自绑定出口', () => {
    const out = output();
    h.assertDeep(out.dns.nameserver, [
      'https://cloudflare-dns.com/dns-query#默认代理',
      'https://dns.google/dns-query#默认代理',
    ]);
    h.assertDeep(out.dns['nameserver-policy']['rule-set:ai'], [
      'https://cloudflare-dns.com/dns-query#AI',
      'https://dns.google/dns-query#AI',
    ]);
    h.assert(out.dns['nameserver-policy']['rule-set:dlsite'].every((dns) => dns.endsWith('#DLsite')));
  });
  h.test('兼容解析只加入通用查询，不混入固定出口与节点 DNS', () => {
    const out = output({ DNS兼容解析: true });
    h.assert(out.dns.nameserver.includes('https://v.recipes/dns-cn#DIRECT'));
    h.assert(!out.dns['proxy-server-nameserver'].some((dns) => dns.includes('v.recipes')));
    h.assert(!out.dns['nameserver-policy']['rule-set:ai'].some((dns) => dns.includes('v.recipes')));
  });
  h.test('关闭 DNS 跟随不改变固定组本身', () => {
    const out = output({ DNS跟随固定出口: false });
    h.assertEqual(group(out, 'AI')['default-selected'], 'REJECT');
    h.assert(!out.dns['nameserver-policy']['rule-set:ai']);
  });
  h.test('私有节点 DNS 保持原出口、参数与精确策略', () => {
    const input = fixture();
    input.dns = { 'nameserver-policy': { 'node.example.net': 'https://private.example.org/dns-query#DIRECT&h3=true' } };
    const before = JSON.stringify(input);
    const out = setup().main(input);
    h.assertEqual(
      out.dns['proxy-server-nameserver-policy']['node.example.net'],
      'https://private.example.org/dns-query#DIRECT&h3=true',
    );
    h.assertEqual(JSON.stringify(input), before);
  });
  h.test('自定义 DoH 参数在绑定服务出口时保留', () => {
    const api = setup();
    api.personalConfig.dns.proxy = ['https://resolver.example.net/dns-query#DIRECT&h3=true'];
    const out = api.main(fixture());
    h.assertDeep(out.dns['nameserver-policy']['rule-set:ai'], ['https://resolver.example.net/dns-query#AI&h3=true']);
  });
  h.test('直连 DNS 遵循策略是独立显式选项', () => {
    h.assertEqual(output().dns['direct-nameserver-follow-policy'], false);
    h.assertEqual(output({ 直连DNS遵循策略: true }).dns['direct-nameserver-follow-policy'], true);
  });

  h.section('个人策略 · 大流量软件与下载');
  h.test('下载默认直连，只有手动选择才使用默认代理', () => {
    const out = output();
    h.assertDeep(group(out, '下载更新').proxies, ['直连', '默认代理']);
    h.assertEqual(group(out, '下载更新').type, 'select');
    h.assertEqual(group(out, '下载更新')['default-selected'], '直连');
    h.assertEqual(group(out, '下载更新').interval, 0);
  });
  h.test('下载规则在国内通用规则前，OneDrive 与广告优先级保持', () => {
    const rules = output().rules;
    const dl = rules.indexOf('DOMAIN-SUFFIX,download.windowsupdate.com,下载更新');
    h.assert(dl > rules.indexOf('PROCESS-NAME,OneDrive.exe,OneDrive'));
    h.assert(dl > rules.indexOf('RULE-SET,adblockmihomo,AdBlock'));
    h.assert(dl < rules.indexOf('RULE-SET,geolocation-cn,直连'));
    h.assert(!rules.some((r) => /^PROCESS-NAME,(steam|EpicGamesLauncher|svchost)\.exe,/i.test(r)));
    h.assert(!rules.some((r) => /^DOMAIN-SUFFIX,(microsoft\.com|epicgames\.com|steampowered\.com),下载更新$/.test(r)));
  });
  h.test('关闭下载功能移除本功能规则与组', () => {
    const out = output({ 大流量下载直连: false });
    h.assert(!group(out, '下载更新'));
    h.assert(!out.rules.some((r) => r.endsWith(',下载更新')));
    h.assert(out.rules.includes('RULE-SET,games_cn,直连'));
  });
  h.test('OneDrive 的桌面与 Android 包名都保留', () => {
    const out = output();
    for (const name of [
      'OneDrive.exe',
      'OneDrive.Sync.Service.exe',
      'OneDriveStandaloneUpdater.exe',
      'com.microsoft.skydrive',
    ]) {
      h.assert(out.rules.includes('PROCESS-NAME,' + name + ',OneDrive'));
    }
  });
  h.test('下载组名称与订阅节点重名时仍有唯一引用', () => {
    const api = setup({ 过滤非地区节点: false });
    const out = api.main({ proxies: [...fixture().proxies, node('下载更新')] });
    h.assert(!out.proxies.some((p) => p.name === '下载更新'));
    h.assert(group(out, '下载更新'));
  });
  h.test('下载域名拒绝规则注入，重复域名只生成一次', () => {
    const api = setup();
    api.personalConfig.downloads.domains = ['download.example.net', 'download.example.net'];
    h.assertEqual(
      api.main(fixture()).rules.filter((r) => r === 'DOMAIN-SUFFIX,download.example.net,下载更新').length,
      1,
    );
    api.personalConfig.downloads.domains = ['download.example.net,DIRECT'];
    h.assertThrows(() => api.main(fixture()), /下载域名/);
  });
}
module.exports = { runPersonalPolicyTests };
