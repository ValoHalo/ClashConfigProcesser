'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const YAML = require('yaml');
const { performance } = require('node:perf_hooks');
const { loadScript } = require('./lib/loader');
const { BettboxCore, defaultCorePath, testDirectory } = require('./lib/bettbox-core');
const { freePort } = require('./lib/network-fixtures');
const { probe } = require('../Tools/probe-proxy');

async function main() {
  const args = process.argv.slice(2),
    options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--subscription', '--download-proxy'].includes(args[i]) || !args[i + 1])
      throw new Error('Usage: --subscription <local.yaml> --download-proxy <http://127.0.0.1:port>');
    options[args[i].slice(2)] = args[i + 1];
  }
  if (!options.subscription || !options['download-proxy'])
    throw new Error('An explicit local subscription and download proxy are required');
  const source = fs.readFileSync(path.resolve(options.subscription));
  const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
  const cfg = loadScript('Script/mihomoScript.js').main(YAML.parse(source.toString()));
  const directory = testDirectory('live');
  const core = new BettboxCore(defaultCorePath(), directory);
  const mixedPort = await freePort(),
    controllerPort = await freePort(),
    secret = crypto.randomUUID();
  const report = {
    timestamp: new Date().toISOString(),
    coreSha256: crypto.createHash('sha256').update(fs.readFileSync(core.binary)).digest('hex'),
    providers: { count: 0, bytes: 0 },
    checks: [],
    availableServices: {},
    dns: [],
  };
  fs.mkdirSync(path.join(directory, 'rules'), { recursive: true });
  const cache = path.resolve('.test-runtime/live-rule-cache');
  fs.mkdirSync(cache, { recursive: true });
  async function getController(route) {
    return new Promise((resolve, reject) => {
      const req = http.get(
        {
          host: '127.0.0.1',
          port: controllerPort,
          path: route,
          headers: { Authorization: 'Bearer ' + secret },
          agent: false,
        },
        (res) => {
          let text = '';
          res.on('data', (b) => (text += b));
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error('Controller HTTP ' + res.statusCode));
            try {
              resolve(JSON.parse(text));
            } catch (e) {
              reject(e);
            }
          });
        },
      );
      req.on('error', reject);
      req.setTimeout(15000, () => req.destroy(new Error('Controller timeout')));
    });
  }
  try {
    await core.start();
    const providers = Object.entries(cfg['rule-providers']);
    let next = 0;
    const downloads = await Promise.allSettled(
      Array.from({ length: 3 }, async () => {
        while (next < providers.length) {
          const [name, provider] = providers[next++];
          if (provider.type !== 'http') continue;
          const key = crypto.createHash('sha256').update(provider.url).digest('hex');
          const cached = path.join(cache, key + '.bin');
          let bytes;
          if (fs.existsSync(cached) && Date.now() - fs.statSync(cached).mtimeMs < 3600000)
            bytes = fs.readFileSync(cached);
          else {
            let response;
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                response = await probe({
                  url: provider.url,
                  proxy: options['download-proxy'],
                  timeout: 25000,
                  maxBytes: 32 * 1024 * 1024,
                  includeBody: true,
                });
                if (response.status === 200 && !response.truncated) break;
              } catch {
                response = null;
              }
            }
            if (!response || response.status !== 200 || response.truncated)
              throw new Error('A rule provider could not be downloaded');
            bytes = response.body;
            fs.writeFileSync(cached, bytes);
          }
          const file = path.join(directory, 'rules', encodeURIComponent(name) + '.' + (provider.format || 'yaml'));
          fs.writeFileSync(file, bytes);
          cfg['rule-providers'][name] = {
            type: 'file',
            behavior: provider.behavior,
            format: provider.format,
            path: file,
          };
          report.providers.count++;
          report.providers.bytes += bytes.length;
        }
      }),
    );
    const failedDownload = downloads.find((item) => item.status === 'rejected');
    if (failedDownload) throw failedDownload.reason;
    console.log('Local rule providers ready: ' + report.providers.count);
    Object.assign(cfg, {
      'mixed-port': mixedPort,
      'external-controller': '127.0.0.1:' + controllerPort,
      secret,
      'bind-address': '127.0.0.1',
      'allow-lan': false,
      tun: { enable: false },
      ntp: { enable: false },
    });
    // Live probes below are explicit and bounded; timed checks are covered by the controlled core suite.
    for (const group of cfg['proxy-groups']) group.interval = 0;
    const selected = {};
    await core.load(cfg, selected);
    for (const [group, region] of [
      ['AI', '美国'],
      ['DLsite', '日本'],
    ]) {
      const candidates = cfg['proxy-groups']
        .find((g) => g.name === group)
        .proxies.filter((n) => n !== 'REJECT')
        .slice(0, 3);
      let available = false;
      for (let i = 0; i < candidates.length; i++) {
        const node = candidates[i];
        await core.select(group, node);
        await core.select(region, node);
        await core.select('默认代理', region);
        selected[group] = node;
        selected[region] = node;
        selected['默认代理'] = region;
        try {
          const check = await probe({
            url: 'https://www.apple.com/library/test/success.html',
            proxy: 'http://127.0.0.1:' + mixedPort,
            timeout: 12000,
          });
          report.checks.push({ case: group + ' candidate ' + (i + 1), ...check });
          if (check.status === 200) {
            available = true;
            break;
          }
        } catch {
          report.checks.push({ case: group + ' candidate ' + (i + 1), error: 'Connection did not complete' });
        }
      }
      report.availableServices[group] = available;
      console.log(group + ' connection: ' + (available ? 'available' : 'not available among tested candidates'));
      if (available) {
        const target = group === 'AI' ? 'https://chatgpt.com/robots.txt' : 'https://www.dlsite.com/';
        try {
          report.checks.push({
            case: group + ' HTTPS reachability',
            ...(await probe({ url: target, proxy: 'http://127.0.0.1:' + mixedPort, timeout: 15000 })),
          });
        } catch {
          report.checks.push({ case: group + ' HTTPS reachability', error: 'Connection did not complete' });
        }
      }
    }
    if (selected.AI) {
      selected['默认代理'] = '美国';
      await core.load(cfg, selected);
    }
    const modes = {
      'legacy-cloudflare': ['https://dns.cloudflare.com/dns-query#默认代理'],
      cloudflare: ['https://cloudflare-dns.com/dns-query#默认代理'],
      google: ['https://dns.google/dns-query#默认代理'],
      combined: ['https://cloudflare-dns.com/dns-query#默认代理', 'https://dns.google/dns-query#默认代理'],
      compatibility: [
        'https://cloudflare-dns.com/dns-query#默认代理',
        'https://dns.google/dns-query#默认代理',
        'https://v.recipes/dns-cn#DIRECT',
      ],
    };
    for (const [mode, nameservers] of Object.entries(modes)) {
      cfg.dns.nameserver = nameservers;
      await core.load(cfg, selected);
      for (const name of ['www.wikipedia.org', 'www.mozilla.org']) {
        await core.call('flushDnsCache');
        for (const temperature of ['cold', 'warm']) {
          const start = performance.now();
          try {
            const answer = await getController('/dns/query?name=' + encodeURIComponent(name) + '&type=A');
            report.dns.push({
              mode,
              target: name,
              cache: temperature,
              ms: Math.round(performance.now() - start),
              status: answer.Status,
              answers: (answer.Answer || []).length,
            });
          } catch {
            report.dns.push({
              mode,
              target: name,
              cache: temperature,
              ms: Math.round(performance.now() - start),
              error: 'DNS query failed',
            });
          }
        }
      }
      console.log('DNS comparison recorded: ' + mode);
    }
    report.sourceUnchanged =
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(options.subscription)))
        .digest('hex') === sourceHash;
    if (!report.sourceUnchanged) throw new Error('Source subscription changed unexpectedly');
    report.connectionsPassed = report.availableServices.AI === true && report.availableServices.DLsite === true;
    report.defaultDnsPassed = report.dns
      .filter((item) => item.mode === 'combined')
      .every((item) => !item.error && item.status === 0 && item.answers > 0);
    report.passed = report.connectionsPassed && report.defaultDnsPassed && report.sourceUnchanged;
    report.completed = true;
    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    report.completed = false;
    report.error = error.message;
    fs.writeFileSync(path.join(directory, 'core.log'), core.logs);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await core.stop();
    const configPath = path.join(directory, 'config.yaml');
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    fs.writeFileSync(path.resolve('.test-runtime/live-results.json'), JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify(
        {
          completed: report.completed,
          sourceUnchanged: report.sourceUnchanged,
          checks: report.checks,
          dns: report.dns,
        },
        null,
        2,
      ),
    );
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
