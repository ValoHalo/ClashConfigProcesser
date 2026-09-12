# ClashConfigProcesser

基于 [Mihomo](https://github.com/MetaCubeX/mihomo/tree/Alpha) 的配置文件与覆写脚本，提供全量版和精简版。

主要特性：

- 内置多种分流策略与地区策略
- 自动排除无效地区节点
- 自动识别节点倍率并分类
- 从匹配节点域名的服务商 `nameserver-policy` 提取私有 DoH，用于节点域名解析
- 国内规则集定向使用直连 DoH，默认解析使用代理 DoH；实际泄露情况仍取决于客户端、系统和路由设置
- 支持 Bettbox 图形化配置管理

友情推荐：
[Bettbox](https://github.com/appshubcc/Bettbox) —— 一款轻量、省电、低内存占用的代理客户端。

**覆写脚本已适配 Bettbox，可通过图形界面自定义启用策略组及配置选项，获得更灵活的使用体验，具体效果请查看下方效果预览图。**

---

## 覆写脚本

### 注意事项

> [!IMPORTANT]
>
> ⚠️该脚本仅用于覆写机场提供的配置文件，请勿用于覆写自行编写的配置
>
> ⚠️脚本已解决部分机场抽象DNS导致无法解析节点或者使用脚本覆写导致解析出来节点延迟高的问题，请务必关闭代理软件的DNS覆写功能

### 脚本功能

- ✅ 解决机场私有 DNS 或节点域名 hosts 映射导致的节点解析问题（单地址 hosts 映射写入节点 `server`，多地址保留为节点精确 hosts）
- ✅ 根据节点匹配情况动态生成地区策略组
- ✅ 支持自定义是否生成地区自动选择策略组
- ✅ 支持自定义是否生成地区负载均衡策略组
- ✅ 支持自定义是否隐藏地区手动选择策略组
- ✅ 支持自定义是否生成 高/低 倍率节点组
- ✅ 支持自定义是否将全部节点加入分流策略组
- ✅ 支持自定义是否过滤低倍率节点
- ✅ 支持自定义是否过滤高倍率节点
- ✅ 支持自定义是否过滤非地区节点
- ✅ 支持自定义是否屏蔽国外 QUIC 流量
- ✅ 支持自定义是否将订阅节点统一为 IPv4/IPv6 优先（同时开启时不生效）
- ✅ 支持在脚本中配置自定义节点（自动生成“自建节点”策略组，与订阅节点重名时自动添加“自建-”前缀）
- ✅ 支持链式代理（将自定义节点作为落地节点，经“链式中转”策略组通过订阅节点中转；启用后自动为自定义节点添加 `dialer-proxy`）
- ✅ 全量修改版不主动开启 LAN、外部控制器或 Web UI

### 使用方法（脚本）

复制以下任意一个链接或者复制完整代码后按如图所示步骤导入到代理客户端，以 [Bettbox](https://github.com/appshubcc/Bettbox) 为例

- [mihomoScript.js（全量版）](/Script/mihomoScript.js)，复制下面这个链接使用👇👇👇

```txt
https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Script/mihomoScript.js
```

- [Script.js（精简版）](/Script/Script.js)，仅包含少量分流策略组，复制下面这个链接使用👇👇👇

```txt
https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Script/Script.js
```

|                                                                                                    |
| -------------------------------------------------------------------------------------------------- |
| ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/import.webp) |

## 全量版配置行为

- 节点 DNS 来源为订阅显式提供的 `proxy-server-nameserver`，以及匹配节点域名的 DNS policy；过滤公共解析器，普通 `nameserver` 不提升为节点 DNS。
- 有私有解析器时使用这些解析器作为节点 DNS；没有时使用国内 DoH。有效的 `nameserver-policy` 及其引用的订阅规则集保留；失效的规则集引用和策略组选择器会被清理。节点精确策略不扩展为父域通配策略；DNS 的 `ecs`、`h3` 等键值参数独立保留。
- hosts 改写要求单一节点 DNS 与监听地址及端口一致，支持 IPv4/IPv6 回环地址对应通配监听。单地址改写保留 TLS 服务器名；WS、gRPC 等传输配置保留原节点地址及精确 hosts；多地址保留完整 IPv4/IPv6 列表，由内核按节点 IP 偏好选择。循环映射会报错。
- 默认启用 OneDrive（默认直连）、DLsite、地区负载均衡和完整广告规则；默认关闭 TikTok、Emby、Spotify、Crypto和国外 QUIC 屏蔽。
- 全量版与精简版均内置常见学术网站的直连规则，覆盖知网、万方、维普、Elsevier / ScienceDirect、Springer / Nature、Wiley、IEEE、ACM、ASCE、arXiv、PubMed、Web of Science，以及 DOI、Crossref 和 ORCID；匹配域名及其子域名，使用“直连”策略组。
- 分流顺序为私有网络、广告拦截、专属进程、下载更新、国内与学术网站直连、服务分流和兜底规则。OneDrive 的进程规则优先于国内域名直连规则。
- 策略组的默认选项同时放在候选列表首位；订阅节点与策略组重名时分配独立名称并同步引用，自定义节点的内部中转引用也随重命名更新。不存在的自定义中转目标及循环引用会报错。
- 倍率由带 `x`、`倍` 或乘号的完整数值判定：低倍率 ≤0.5，高倍率 ≥2；`0.59x` 不属于低倍率节点。
- 健康检查使用 Apple 测试页，预期 HTTP 200，间隔 400 秒、超时 3000 毫秒、失败检查阈值 2、自动选择容差 50 毫秒。国内与直连 DNS 使用 DoH，直连解析不加入系统 DNS。
- 端口、LAN、控制器和 Web UI 由客户端管理。Bettbox 的脚本自定义选项可覆盖脚本中的同名默认开关；客户端的 DNS 覆写也会影响最终 DNS，使用脚本 DNS 时应关闭客户端 DNS 覆写。

## 个人策略

全量版默认启用 AI 和 DLsite 固定出口。首次导入后，请在 `AI` 中选择美国或日本节点，在 `DLsite` 中选择日本节点。两个组初始为 `REJECT`；原选节点消失或旧选择不在候选列表时，也会回到该停止项。固定出口直接引用具体节点，地区组的选择不会改变它。

固定节点不保证服务商提供固定公网 IP。地区识别沿用节点名称；实际出口以线路提供的地址为准。

| Bettbox 开关     | 默认值 | 行为                                                             |
| ---------------- | ------ | ---------------------------------------------------------------- |
| AI固定出口       | 开     | AI 列出美国和日本节点，手动选择后保持该节点                      |
| DLsite固定出口   | 开     | DLsite 仅列出日本节点，手动选择后保持该节点                      |
| 固定出口同区备用 | 关     | 在配置的候选地区内按顺序回退，多地区时可跨地区；首选恢复后会回切 |
| 快速故障恢复     | 关     | 个人主备组的检测周期从 400 秒改为 120 秒；严格固定组不定时换节点 |
| DNS跟随固定出口  | 开     | AI、DLsite 规则集的 DoH 查询使用各自服务组                       |
| DNS兼容解析      | 关     | 通用 DNS 额外加入 v.recipes，和其他解析器并发查询                |
| 直连DNS遵循策略  | 关     | 直连 DNS 查询也应用 nameserver-policy，包括其中指定的代理        |
| 大流量下载直连   | 开     | 下载域名进入“下载更新”，默认直连，可手动改走默认代理             |

关闭某个服务的固定出口开关后，该服务恢复完整候选列表。关闭服务本身时，同时移除本服务的个人出口与专用 DNS 策略。

详细参数位于 `Script/mihomoScript.js` 顶部的 `personalConfig`：服务默认值、各服务候选地区与节点优先级、探测参数、DNS 地址、OneDrive 进程名和下载域名。`region` 接受单个地区（如 `'日本'`）或地区列表（如 `['美国', '日本']`）。`priority` 填写完整节点名，优先于地区顺序；其余节点按地区列表顺序、同地区节点名称排序。严格固定模式仍由策略组选择具体节点。

### DNS 与测速

- 节点域名使用订阅的专用或私有 DNS；已有匹配策略和连接参数保留。
- 普通代理查询默认使用 Cloudflare 官方 DoH 端点和 Google DoH，经默认代理发出。
- 固定服务的规则集 DNS 经对应服务组发出；订阅已有的精确域名策略继续保留。
- 国内及直连解析默认使用阿里和腾讯 DoH。
- 同组解析器列表并发查询，排列顺序不表示主备关系。
- 切换节点后，DNS 缓存和已建立的 DoH 连接可能继续使用原结果或原连接。需要立即更新 DNS 出口时，重新加载配置；仅清空 DNS 缓存不一定重建 DoH 连接。
- 使用脚本 DNS 时关闭客户端 DNS 覆写。保持脚本测速 URL，或将客户端测速 URL 与脚本的预期状态码一起修改；Apple 测试页为 200，generate_204 端点为 204。
- 失败阈值触发健康检查；是否切换取决于组类型。客户端的手动延迟检测与按预期状态码执行的定时健康检查可能采用不同的判定。

### 下载与同步

OneDrive 的进程规则包含 Windows 主进程、同步服务、更新程序及 Android 包名 `com.microsoft.skydrive`，默认使用直连策略。关闭 OneDrive 开关后，这些进程规则一起移除。

“下载更新”包含 Steam 内容下载、Epic 下载服务器、Windows/商店安装包和 NVIDIA 驱动下载域名。商店和账号域名保留原有分流；不按 `steam.exe`、`EpicGamesLauncher.exe` 或 `svchost.exe` 整体直连。直连失败时仍保持直连，改走代理需要手动选择。

下载规则位于广告规则和专属进程规则之后、国内通用规则之前。规则来源参考 Microsoft 的 Windows 11 端点文档与 Epic 的服务域名文档。Steam 与 NVIDIA 的其他流量继续使用上游规则集。

### 按需连通性检查

在电脑上可以使用显式代理端口检查一个 URL。命令不读取系统代理或 HTTP_PROXY；每次请求独立建连，校验证书，并限制响应体读取量。

```bash
node Tools/probe-proxy.js --proxy http://127.0.0.1:33333 --url https://www.apple.com/library/test/success.html --count 3 --expect-status 200
node Tools/probe-proxy.js --direct --url https://www.microsoft.com --count 3
```

将端口替换为客户端实际监听端口。结果包含 HTTP 状态、建连、TLS、首字节和总耗时；401、403 或重定向只表示本次 HTTP 响应，不能据此认定账号功能或完整业务可用。该检查不参与自动换节点。

## 配置文件

配置文件与脚本实现效果基本一致，但功能存在限制。

### 限制

- 不支持自定义启用/禁用配置项
- 无法根据节点匹配情况动态生成策略组
- 使用私有 DNS 或 hosts 节点域名映射的机场需要手动写入配置中
- 未匹配地区的策略组将回退至 REJECT

### 使用方法（配置）

复制以下任意一个链接或者复制完整代码后导入代理客户端

- [mihomoConfig.yaml（全量版）](/Config/mihomoConfig.yaml)，复制下面这个链接使用👇👇👇

```txt
https://raw.githubusercontent.com/AIsouler/MyClash/main/Config/mihomoConfig.yaml
```

- [mihomoConfigLite.yaml（精简版）](/Config/mihomoConfigLite.yaml)，仅包含少量分流策略组，复制下面这个链接使用👇👇👇

```txt
https://raw.githubusercontent.com/AIsouler/MyClash/main/Config/mihomoConfigLite.yaml
```

## 本地测试工具

安装依赖后，可以把原始订阅 YAML 处理成脚本覆写后的最终配置：

```powershell
npm ci
npm run process-config -- input.yaml output.yaml
```

默认使用全量版脚本，也可以指定精简版：

```powershell
npm run process-config -- input.yaml output.yaml --script Script/Script.js
```

运行语法检查、脱敏的配置生成回归测试、ES2020 检查，以及 QuickJS 与 Node 的完整配置对照：

```powershell
npm run check
```

依赖由根目录的 `package-lock.json` 统一锁定，`Test` 为 npm workspace。只运行 Node 测试可使用 `npm run test:node`。CI 在 Windows 和 Linux 上运行完整检查；缺少兼容性检查依赖时会报错。

## 功能说明

- 仅适用于使用 [mihomo 内核](https://github.com/MetaCubeX/mihomo/tree/Alpha) 的代理客户端

- 全量修改版包含个人 DNS、服务策略组和网络暴露设置；精简版及静态配置主要跟随上游

- DNS 配置和路由规则配套使用；在 Windows 上仍建议关闭智能多宿主解析，或在代理软件中开启 [严格路由](https://wiki.metacubex.one/config/inbound/tun/#strict-route)。回归测试只验证配置生成行为，不代表所有环境均不会发生 DNS 泄露

- 规则采用 `rule-set` 模式，按需添加规则集，告别臃肿的 geodata，减少内存占用

- 规则以 `domain` 与 `ipcidr` 行为为主，相比 `classical` 查询效率更高

- 自动排除非国家或地区的信息节点

- 自动识别节点倍率，并分别归类为独立节点组：
  - 高倍率节点（倍率 ≥2）
  - 低倍率节点（倍率 ≤0.5）

## 内置策略组

> - 若不需要某个分流策略组，可在脚本中将 `ruleOptionsEnable` 对应值设为 `false`

- `默认代理`
- `手动选择`
- `自动选择`
- `负载均衡`
- `FCM`
- `YouTube`
- `Google`
- `OneDrive`
- `DLsite`
- `AI`
- `Microsoft`
- `Apple`
- `Telegram`
- `Steam`
- `TikTok`
- `Instagram`
- `Netflix`
- `Twitter`
- `Emby`
- `PikPak`
- `Spotify`
- `Crypto`
- `EHentai`
- `AdBlock`
- `直连` （可自定义 `双栈/IPv4优先/IPv6优先/仅IPv4/仅IPv6`）
- `漏网之鱼`
- `自建节点/链式落地` （仅添加了自定义节点时生成）
- `链式中转` （仅启用链式代理且配置自定义节点时生成）

## 内置节点组

> - 所有组均为手动选择（select），内部可包含对应的自动选择和负载均衡策略组
> - 未匹配到地区组的节点将归类至 「其他节点」

- `香港`
- `日本`
- `美国`
- `新加坡`
- `台湾省`
- `低倍率节点`
- `高倍率节点`
- `其他节点`

## 效果预览

- 客户端： [Bettbox](https://github.com/appshubcc/Bettbox)

|                                                                                                   |                                                                                                   |                                                                                                   |                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_1.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_2.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_3.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_4.webp) |
| ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_5.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_6.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_7.webp) | ![img](https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/modified/Image/IMG_8.webp) |

## 致谢

感谢以下项目以及所有上游项目

- [dahaha-365/YaNet](https://github.com/dahaha-365/YaNet/blob/main/Mihomo/global_script.js)

- [YiXuanZX/rules](https://github.com/YiXuanZX/rules)

- [appshubcc/bett-rules](https://github.com/appshubcc/bett-rules)

- [217heidai/adblockfilters](https://github.com/217heidai/adblockfilters)

- [Koolson/Qure](https://github.com/Koolson/Qure)
