# 2026-09-09 验证记录

环境：Windows，Node.js v24.15.0，本机已安装的 BettboxCore.exe。所有额外内核实例使用独立目录、动态回环端口及独立控制器口令，TUN 关闭。

## 结果

| 验证 | 结果 |
| --- | --- |
| Node、ES2020、QuickJS | 259 项通过，0 项失败 |
| 按需探测工具的本地网络测试 | 6 项通过 |
| 本机 Bettbox 内核行为 | 16 项通过 |
| 实际订阅配置解析 | 严格固定、主备、DNS 兼容、关闭个人服务策略四种模式通过 |
| 配置解析负向对照 | 含失效节点引用的配置按预期被拒绝 |
| 实际订阅联网 | 美国、日本候选节点基础 HTTPS 可用；默认 DNS 组合查询通过 |
| 完整规则集加载 | 33 个规则集，2916373 字节 |
| 原订阅 | 内容保持不变 |
| 原客户端 | 原 PID 24736 继续监听 127.0.0.1:33333；系统代理设置保持不变 |

默认配置生成 31 个节点、48 个策略组、50 条规则和 33 个规则集。AI、DLsite 沿用原组名；下载使用“下载更新”组。

## 行为覆盖

- Bettbox loads full generated configuration with loopback-only listeners：通过。
- Strict exits route AI and DLsite to independently selected concrete nodes：通过。
- Strict node failure does not use another live node：通过。
- Subscription reorder preserves selected node through Bettbox selected-map：通过。
- Removed selected node and stale legacy region both fall to REJECT：通过。
- New DNS transports follow AI selection; existing DoH connections persist until rebuilt：通过。
- Node domain uses retained private DNS independently of AI DNS：通过。
- Fallback responds to expected-status failures and primary recovery：通过。
- Fallback never crosses region when both local candidates fail：通过。
- Download domain is direct while account traffic keeps its service route：通过。
- Real Windows process matching isolates OneDrive from ordinary Node requests：通过。
- App override remains manual and disabling the feature removes process routing：通过。
- Direct download failure does not activate the proxy alternative：通过。
- Existing stream survives selecting a new fixed node for new connections：通过。
- A closed and reopened network endpoint reconnects without changing the fixed node：通过。
- Cold core restart restores the client selection map and reconnects：通过。

Windows 进程测试将 Node 复制为测试目录内的 OneDrive.exe，和普通 node.exe 对照。两者均显式访问测试实例，分别命中直连与默认代理；真实 OneDrive 未被启动或更改。

## DNS 对照

下表是同一实际订阅出口、两个域名的最近一轮冷 DNS 缓存查询；每个模式内第二个域名可能复用已建立的 DoH 连接。数值不是稳定性能排名。

| 模式 | 两个域名的查询时间 | 有效回答 |
| --- | --- | --- |
| legacy-cloudflare | 1982 ms / 153 ms | 2/2 |
| cloudflare | 822 ms / 152 ms | 2/2 |
| google | 873 ms / 185 ms | 2/2 |
| combined | 757 ms / 141 ms | 2/2 |
| compatibility | 1174 ms / 135 ms | 2/2 |

此前一轮旧 Cloudflare 地址出现超时，后续复测恢复。因此未将单轮超时判定为端点永久失效。默认采用官方 cloudflare-dns.com 端点与 Google 并发查询；兼容解析保持为可选项。

## 验证边界

- 服务联网探测仅检查公开 URL 的 HTTPS 响应，未验证登录、支付或完整 AI 对话。
- 定时健康检查在回环服务上使用缩短周期验证；正式配置仍为 400 秒，快速主备为 120 秒。
- 已有 DoH 连接可能继续使用原节点；本机验证重新加载配置后新建连接使用新出口。
- Windows 实际进程识别已经验证。Android 包名有配置生成测试，未执行 Android 真机测试。
- 已验证网络端点关闭/恢复、内核重启、连接持续性；未切换用户的物理 Wi-Fi 或移动网络。
- 本地检查已完成；未运行远程 CI，未提交或推送代码。

## 对应文件校验值

- Script/mihomoScript.js SHA-256：`99b9ba598a88628354916da7bf356418bcfbf69b2ef178ecc67a91ee5d17f953`
- BettboxCore.exe SHA-256：`2d55212be2c3a1af944677fc2a9a57ec178d58765e3ce44e9a41f949db9e0058`

命令与复现条件见 Test/README.md。详细原始结果保留在本地被 Git 忽略的 .test-runtime 目录。
