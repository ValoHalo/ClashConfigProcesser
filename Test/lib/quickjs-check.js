/**
 * 用真实 QuickJS 引擎验证 Script/Script.js 与 Script/mihomoScript.js 的兼容性。
 *
 * 覆盖两层验证：
 * 1. 语法解析 + 顶层执行（含所有正则字面量编译）
 * 2. 集成验证：在 QuickJS 上下文实际调用 main() 处理 typicalSubscription 配置，
 *    并将输出 JSON 化回传 Node，与 Node(v8) 引擎跑出的结果做结构性逐字段对照。
 *
 * 由 Test/run-tests.js 调用（npm run test:quickjs，需要先在仓库根目录运行 npm ci）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadScript } = require('./loader');
const { SCRIPT_FILES } = require('./scripts');

const ROOT = path.resolve(__dirname, '..', '..');

/** 尝试加载 quickjs-emscripten；仅「未安装」时返回 null（调用方报告依赖错误） */
function tryLoadQuickJS() {
  try {
    return require('quickjs-emscripten');
  } catch (e) {
    // 其他错误（包损坏、加载失败等）如实抛出，避免被误判为「未安装」而掩盖真实问题
    if (e && e.code === 'MODULE_NOT_FOUND') return null;
    throw e;
  }
}

/** 在 QuickJS 上下文执行代码，返回 { ok, value, error } */
function run(ctx, code, filename) {
  const res = ctx.evalCode(code, filename);
  if (res.error) {
    const errText = String(ctx.dump(res.error));
    res.error.dispose();
    if (res.value) res.value.dispose();
    return { ok: false, error: errText };
  }
  const value = ctx.dump(res.value);
  res.value.dispose();
  return { ok: true, value };
}

/**
 * QuickJS 引擎兼容性验证（异步：需等待 WASM 模块初始化）。
 * 覆盖：语法解析 + 顶层执行、实际调用 main() 并与 Node 引擎对照。
 * 未安装 quickjs-emscripten 时报告依赖错误。
 *
 * @param {object} opts { harness, fixtures }
 */
async function runQuickJSChecks({ harness, fixtures }) {
  const quickjs = tryLoadQuickJS();
  if (!quickjs) {
    throw new Error('QuickJS 依赖未安装，请在仓库根目录运行 npm ci');
  }

  const QuickJS = await quickjs.getQuickJS();

  // ---------- 1. 语法解析 + 顶层执行（含所有正则字面量编译） ----------
  harness.section('QuickJS：语法解析 + 顶层执行');
  for (const rel of SCRIPT_FILES) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    harness.test(`${rel}（${code.split('\n').length} 行）`, () => {
      const ctx = QuickJS.newContext();
      try {
        const r = run(ctx, code, rel);
        harness.assert(r.ok, r.error || 'QuickJS 解析/执行失败');
      } finally {
        ctx.dispose();
      }
    });
  }

  // ---------- 2. 对照多个输入的完整输出 ----------
  const hostCase = {
    proxies: [
      { name: 'JP TLS', type: 'trojan', server: 'node.example.net', port: 443, password: 'placeholder' },
      { name: 'US dual', type: 'trojan', server: 'dual.example.net', port: 443, password: 'placeholder' },
    ],
    dns: { listen: '0.0.0.0:1053', 'proxy-server-nameserver': ['127.0.0.1:1053'] },
    hosts: { 'node.example.net': '192.0.2.1', 'dual.example.net': ['192.0.2.2', '2001:db8::1'] },
  };
  const policyCase = fixtures.minimalSubscription();
  policyCase['rule-providers'] = { airport: { type: 'inline', behavior: 'domain', payload: ['+.example.com'] } };
  policyCase.dns = {
    'nameserver-policy': {
      'rule-set:airport': 'https://resolver.example.net/dns-query#missing&ecs=192.0.2.0/24',
      'a.example.com': 'https://resolver.example.net/dns-query#DIRECT&h3=true',
    },
  };
  const cases = [
    ['典型订阅', fixtures.typicalSubscription()],
    ['最小订阅', fixtures.minimalSubscription()],
    ['TLS 与多地址 hosts', hostCase],
    ['DNS 策略与规则集依赖', policyCase],
    [
      '个人主备与兼容解析',
      fixtures.typicalSubscription(),
      { 固定出口同区备用: true, 快速故障恢复: true, DNS兼容解析: true },
    ],
    [
      '个人开关关闭',
      fixtures.typicalSubscription(),
      { AI固定出口: false, DLsite固定出口: false, 大流量下载直连: false, DNS跟随固定出口: false },
    ],
    ['服务禁用与直连策略', fixtures.typicalSubscription(), { AI: false, DLsite: false, 直连DNS遵循策略: true }],
  ];
  harness.section('QuickJS：main() 完整配置对照');
  for (const rel of SCRIPT_FILES) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const [label, config, options = {}] of cases) {
      harness.test(`${rel}：${label}`, () => {
        const ctx = QuickJS.newContext();
        try {
          const driver = `${code}
Object.assign(ruleOptionsEnable, ${JSON.stringify(options)});
JSON.stringify(main(JSON.parse(${JSON.stringify(JSON.stringify(config))})))`;
          const result = run(ctx, driver, rel);
          harness.assert(result.ok, result.error || 'main() 执行失败');
          const out = JSON.parse(result.value);
          harness.assert(Array.isArray(out.proxies) && out.proxies.length > 0, 'proxies 缺失或为空');
          harness.assert(
            Array.isArray(out['proxy-groups']) && out['proxy-groups'].length > 0,
            'proxy-groups 缺失或为空',
          );
          const nodeApi = loadScript(rel);
          Object.assign(nodeApi.ruleOptionsEnable, options);
          const nodeOut = nodeApi.main(config);
          harness.assertDeep(out, nodeOut, 'QuickJS 与 Node 的完整配置内容必须一致');
        } finally {
          ctx.dispose();
        }
      });
    }
  }
}

module.exports = { runQuickJSChecks };
