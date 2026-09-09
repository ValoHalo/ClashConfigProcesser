'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { loadScript } = require('./lib/loader');
const { BettboxCore, defaultCorePath, testDirectory, cleanProxyEnvironment } = require('./lib/bettbox-core');
const { fixtures, freePort, request } = require('./lib/network-fixtures');
const YAML = require('yaml');

async function main() {
  fs.accessSync(defaultCorePath(), fs.constants.R_OK);
  const fx = await fixtures();
  const core = new BettboxCore(defaultCorePath(), testDirectory('policies'));
  const mixedPort = await freePort();
  const controllerPort = await freePort();
  const secret = crypto.randomUUID();
  const healthUrl = `http://health.example.net:${fx.origin.port}/health`;
  const result = {
    core: core.binary,
    scriptSha256: crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.resolve('Script/mihomoScript.js')))
      .digest('hex'),
    coreSha256: crypto.createHash('sha256').update(fs.readFileSync(core.binary)).digest('hex'),
    tests: [],
  };
  function build(options = {}, subscription = fx.subscription()) {
    const api = loadScript('Script/mihomoScript.js', (code) =>
      code.replace(
        'const privateNetworkRules =',
        `personalConfig.health.url = ${JSON.stringify(healthUrl)};
personalConfig.health.fastFallbackInterval = 2;
personalConfig.dns.proxy = [${JSON.stringify(`http://dns.example.net:${fx.origin.port}/dns-query`)}];
personalConfig.dns.direct = [${JSON.stringify(`127.0.0.1:${fx.udpPort}#DIRECT`)}];
const privateNetworkRules =`,
      ),
    );
    Object.assign(api.ruleOptionsEnable, options);
    const cfg = api.main(subscription);
    for (const [name, provider] of Object.entries(cfg['rule-providers'])) {
      const special = {
        private: ['+.private.example.net'],
        ai: ['+.ai-fixture.example.net'],
        dlsite: ['+.dl-fixture.example.net'],
        cn: ['+.domestic.example.net'],
        'geolocation-cn': ['+.domestic.example.net', '+.windowsupdate.com'],
        'geolocation-!cn': ['+.example.net'],
        adblockmihomo: ['+.blocked.example.net'],
        microsoft: ['+.login.microsoftonline.com'],
        steam: ['+.steampowered.com'],
      };
      cfg['rule-providers'][name] = {
        type: 'inline',
        behavior: provider.behavior,
        payload:
          provider.behavior === 'ipcidr'
            ? ['192.0.2.0/24']
            : special[name] || ['+.unused-' + name + '.example.invalid'],
      };
    }
    Object.assign(cfg, {
      'mixed-port': mixedPort,
      'bind-address': '127.0.0.1',
      'allow-lan': false,
      tun: { enable: false },
      ipv6: false,
      ntp: { enable: false },
      'external-controller': '127.0.0.1:' + controllerPort,
      secret,
    });
    cfg.dns.ipv6 = false;
    cfg.dns['use-system-hosts'] = false;
    for (const name of [
      'health.example.net',
      'dns.example.net',
      'ai-fixture.example.net',
      'dl-fixture.example.net',
      'app-fixture.example.net',
      'store.steampowered.com',
      'download.windowsupdate.com',
      'login.microsoftonline.com',
      'domestic.example.net',
      'blocked.example.net',
    ])
      cfg.hosts[name] = '127.0.0.1';
    return cfg;
  }
  async function apiRequest(route, method = 'GET', body) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: controllerPort,
          path: route,
          method,
          headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
          agent: false,
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString();
            if (res.statusCode >= 400) return reject(new Error('Controller ' + res.statusCode + ': ' + text));
            try {
              resolve(text ? JSON.parse(text) : null);
            } catch (e) {
              reject(e);
            }
          });
        },
      );
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Controller timeout')));
      req.end(body === undefined ? undefined : JSON.stringify(body));
    });
  }
  const url = (name, pathname = '/route') => `http://${name}:${fx.origin.port}${pathname}`;
  const route = async (name) => {
    const response = await request({ proxyPort: mixedPort, url: url(name) });
    assert.equal(response.status, 200);
    return JSON.parse(response.body).route;
  };
  async function expectFailure(target) {
    let response;
    try {
      response = await request({ proxyPort: mixedPort, url: target });
    } catch (error) {
      assert(
        ['ECONNRESET', 'ECONNREFUSED', 'EPIPE', 'ERR_STREAM_PREMATURE_CLOSE'].includes(error.code),
        'Unexpected request error: ' + error.message,
      );
      return;
    }
    assert.notEqual(response.status, 200, 'Failed route must not produce a successful response');
  }
  const selected = async (name) => (await core.call('getProxies'))[name].now;
  async function until(check, timeout = 12000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await check()) return;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Timed health check condition was not met');
  }
  async function test(name, fn) {
    const start = Date.now();
    await fn();
    result.tests.push({ name, passed: true, ms: Date.now() - start });
    console.log('PASS ' + name);
  }
  async function childRequest(binary, target) {
    return new Promise((resolve, reject) => {
      const code = `const http=require('http'); const u=new URL(process.argv[2]); const r=http.get({host:'127.0.0.1',port:Number(process.argv[1]),path:u.href,headers:{Host:u.host},agent:false},s=>{let b='';s.on('data',c=>b+=c);s.on('end',()=>{console.log(JSON.stringify({status:s.statusCode,body:b}));});});r.setTimeout(5000,()=>r.destroy(new Error('timeout')));r.on('error',e=>{console.error(e.message);process.exitCode=1;});`;
      const proc = spawn(binary, ['-e', code, String(mixedPort), target], {
        env: cleanProxyEnvironment(),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '',
        stderr = '';
      proc.stdout.on('data', (b) => (stdout += b));
      proc.stderr.on('data', (b) => (stderr += b));
      proc.on('error', reject);
      proc.on('exit', (c) => {
        if (c !== 0) reject(new Error(stderr));
        else resolve(JSON.parse(stdout));
      });
    });
  }
  try {
    await core.start();
    await test('Bettbox loads full generated configuration with loopback-only listeners', async () => {
      await core.load(build());
      const proxies = await core.call('getProxies');
      assert.equal(proxies.AI.now, 'REJECT');
      assert.equal(proxies.DLsite.now, 'REJECT');
      assert.equal(proxies['下载更新'].now, '直连');
      const runtime = await apiRequest('/configs');
      assert.equal(runtime['mixed-port'], mixedPort);
      assert.equal(runtime.tun.enable, false);
      assert.equal(runtime['allow-lan'], false);
    });
    await test('Strict exits route AI and DLsite to independently selected concrete nodes', async () => {
      await core.select('AI', '🇺🇸 US 01');
      await core.select('DLsite', '🇯🇵 JP 01');
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
      assert.equal(await route('dl-fixture.example.net'), 'JP 01');
      await core.select('美国', '🇺🇸 US 02');
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
    });
    await test('AI can select a Japanese node independently of its regional group', async () => {
      await core.select('AI', '🇯🇵 JP 01');
      assert.equal(await route('ai-fixture.example.net'), 'JP 01');
      await core.select('默认代理', '香港');
      await core.select('香港', '🇭🇰 HK 01');
      assert.equal(await route('ai-fixture.example.net'), 'JP 01');
      await core.select('AI', '🇺🇸 US 01');
    });
    await test('Strict node failure does not use another live node', async () => {
      fx.states.get('US 01').online = false;
      const before = fx.seen.length;
      await expectFailure(url('ai-fixture.example.net'));
      assert.equal(await selected('AI'), '🇺🇸 US 01');
      assert(!fx.seen.slice(before).some((r) => r.kind === 'http' && ['US 02', 'JP 01'].includes(r.route)));
      fx.states.get('US 01').online = true;
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
    });
    await test('Subscription reorder preserves selected node through Bettbox selected-map', async () => {
      const input = fx.subscription();
      input.proxies.reverse();
      await core.load(build({}, input), { AI: '🇺🇸 US 01' });
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
    });
    await test('Removed selected node and stale legacy region both fall to REJECT', async () => {
      const input = fx.subscription();
      input.proxies = input.proxies.filter((p) => p.name !== 'US 01');
      await core.load(build({}, input), { AI: '🇺🇸 US 01' });
      assert.equal(await selected('AI'), 'REJECT');
      await core.load(build(), { AI: '美国' });
      assert.equal(await selected('AI'), 'REJECT');
    });
    await test('New DNS transports follow AI selection; existing DoH connections persist until rebuilt', async () => {
      await core.select('AI', '🇺🇸 US 01');
      await core.select('默认代理', '香港');
      await core.select('香港', '🇭🇰 HK 01');
      for (const [suffix, node] of [
        ['one', 'US 01'],
        ['two', 'US 02'],
      ]) {
        await core.select('AI', '🇺🇸 ' + node);
        if (suffix === 'two') {
          await apiRequest('/dns/query?name=reused.ai-fixture.example.net&type=A');
          assert(
            fx.seen.some((r) => r.kind === 'dns' && r.name === 'reused.ai-fixture.example.net' && r.route === 'US 01'),
          );
          await core.load(build(), { AI: '🇺🇸 US 02', 默认代理: '香港', 香港: '🇭🇰 HK 01' });
        }
        const name = suffix + '.ai-fixture.example.net';
        const answer = await apiRequest('/dns/query?name=' + name + '&type=A');
        assert(
          fx.seen.some((r) => r.kind === 'dns' && r.name === name && r.route === node),
          JSON.stringify({ answer, dns: fx.seen.filter((r) => r.kind === 'dns').slice(-8) }),
        );
      }
    });
    await test('Node domain uses retained private DNS independently of AI DNS', async () => {
      const input = fx.subscription();
      input.proxies[0].server = 'private-node.example.net';
      input.dns = { 'nameserver-policy': { 'private-node.example.net': `127.0.0.1:${fx.udpPort}#DIRECT` } };
      await core.load(build({}, input), { AI: '🇺🇸 US 01' });
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
      assert(
        fx.seen.some((r) => r.kind === 'dns' && r.name === 'private-node.example.net' && r.route === 'DIRECT-UDP'),
      );
    });
    await test('Fallback responds to expected-status failures and primary recovery', async () => {
      await core.load(build({ 固定出口同区备用: true, 快速故障恢复: true }));
      await apiRequest('/group/AI/delay?url=' + encodeURIComponent(healthUrl) + '&timeout=1500');
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
      fx.states.get('US 01').healthStatus = 503;
      await until(async () => (await selected('AI')) === '🇺🇸 US 02');
      assert.equal(await route('ai-fixture.example.net'), 'US 02');
      fx.states.get('US 01').healthStatus = 200;
      await until(async () => (await selected('AI')) === '🇺🇸 US 01');
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
    });
    await test('Fallback can use Japan when all US candidates fail', async () => {
      fx.states.get('US 01').online = false;
      fx.states.get('US 02').online = false;
      await apiRequest('/group/AI/delay?url=' + encodeURIComponent(healthUrl) + '&timeout=1500');
      assert.equal(await route('ai-fixture.example.net'), 'JP 01');
      assert.equal(await selected('AI'), '🇯🇵 JP 01');
    });
    await test('Fallback never leaves the allowed regions when all candidates fail', async () => {
      fx.states.get('JP 01').online = false;
      await assert.rejects(
        apiRequest('/group/AI/delay?url=' + encodeURIComponent(healthUrl) + '&timeout=1500'),
        /Controller 504.*all proxies timeout/,
      );
      await expectFailure(url('ai-fixture.example.net'));
      assert(['🇺🇸 US 01', '🇺🇸 US 02', '🇯🇵 JP 01'].includes(await selected('AI')));
      fx.states.get('US 01').online = true;
      fx.states.get('US 02').online = true;
      fx.states.get('JP 01').online = true;
    });
    await test('Download domain is direct while account traffic keeps its service route', async () => {
      await core.load(build(), { 默认代理: '香港', 香港: '🇭🇰 HK 01', Microsoft: '默认代理' });
      assert.equal(await route('download.windowsupdate.com'), 'DIRECT');
      assert.equal(await route('login.microsoftonline.com'), 'HK 01');
      await core.select('下载更新', '默认代理');
      assert.equal(await route('download.windowsupdate.com'), 'HK 01');
      await core.select('下载更新', '直连');
    });
    await test('Real Windows process matching isolates OneDrive from ordinary Node requests', async () => {
      if (process.platform !== 'win32') throw new Error('Windows process test requires Windows');
      const binary = path.join(core.directory, 'OneDrive.exe');
      fs.copyFileSync(process.execPath, binary);
      const one = await childRequest(binary, url('app-fixture.example.net'));
      assert.equal(one.status, 200);
      assert.equal(JSON.parse(one.body).route, 'DIRECT');
      const normal = await childRequest(process.execPath, url('app-fixture.example.net'));
      assert.equal(normal.status, 200);
      assert.equal(JSON.parse(normal.body).route, 'HK 01');
    });
    await test('App override remains manual and disabling the feature removes process routing', async () => {
      const binary = path.join(core.directory, 'OneDrive.exe');
      await core.select('OneDrive', '默认代理');
      assert.equal(JSON.parse((await childRequest(binary, url('app-fixture.example.net'))).body).route, 'HK 01');
      await core.load(build({ OneDrive: false }), { 默认代理: '香港', 香港: '🇭🇰 HK 01' });
      assert.equal(JSON.parse((await childRequest(binary, url('app-fixture.example.net'))).body).route, 'HK 01');
    });
    await test('Direct download failure does not activate the proxy alternative', async () => {
      await core.load(build(), { 默认代理: '香港', 香港: '🇭🇰 HK 01' });
      const closedPort = await freePort();
      const target = 'http://download.windowsupdate.com:' + closedPort + '/route';
      const before = fx.seen.length;
      await expectFailure(target);
      assert.equal(await selected('下载更新'), '直连');
      assert(!fx.seen.slice(before).some((item) => item.kind === 'connect' && item.target.endsWith(':' + closedPort)));
    });
    await test('Existing stream survives selecting a new fixed node for new connections', async () => {
      await core.load(build(), { AI: '🇺🇸 US 01' });
      let req, response;
      const chunks = [];
      try {
        await new Promise((resolve, reject) => {
          const target = new URL(url('ai-fixture.example.net', '/hold'));
          req = http.get(
            { host: '127.0.0.1', port: mixedPort, path: target.href, headers: { Host: target.host }, agent: false },
            (res) => {
              response = res;
              res.on('data', (chunk) => chunks.push(chunk.toString()));
              res.on('error', () => {});
              resolve();
            },
          );
          req.on('error', reject);
          req.setTimeout(4000, () => req.destroy(new Error('Stream timeout')));
        });
        await until(async () => chunks.length >= 1, 4000);
        await core.select('AI', '🇺🇸 US 02');
        assert.equal(await route('ai-fixture.example.net'), 'US 02');
        await until(async () => chunks.length >= 3, 4000);
        assert(!response.destroyed);
        assert(
          chunks
            .join('')
            .trim()
            .split('\n')
            .every((line) => JSON.parse(line).route === 'US 01'),
        );
      } finally {
        req?.destroy();
        response?.destroy();
      }
    });
    await test('A closed and reopened network endpoint reconnects without changing the fixed node', async () => {
      await core.load(build(), { AI: '🇺🇸 US 01' });
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
      const endpoint = fx.proxies.find((item) => item.name === 'US 01');
      await endpoint.close();
      await expectFailure(url('ai-fixture.example.net'));
      assert.equal(await selected('AI'), '🇺🇸 US 01');
      await new Promise((resolve) => endpoint.server.listen(endpoint.port, '127.0.0.1', resolve));
      assert.equal(await route('ai-fixture.example.net'), 'US 01');
    });
    await test('Cold core restart restores the client selection map and reconnects', async () => {
      const saved = { AI: '🇺🇸 US 02', DLsite: '🇯🇵 JP 01', 默认代理: '香港', 香港: '🇭🇰 HK 01' };
      await core.stop();
      await core.start();
      await core.load(build(), saved);
      assert.equal(await route('ai-fixture.example.net'), 'US 02');
      assert.equal(await route('dl-fixture.example.net'), 'JP 01');
    });
    result.passed = true;
  } catch (e) {
    result.passed = false;
    result.error = e.stack;
    console.error(e);
    console.error(core.logs.slice(-4500));
    process.exitCode = 1;
  } finally {
    await core.stop();
    await fx.close();
    const copiedClient = path.join(core.directory, 'OneDrive.exe');
    if (fs.existsSync(copiedClient)) fs.unlinkSync(copiedClient);
    fs.writeFileSync(path.resolve('.test-runtime/core-results.json'), JSON.stringify(result, null, 2));
    console.log('Bettbox runtime: ' + result.tests.length + ' passed; complete=' + result.passed);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
