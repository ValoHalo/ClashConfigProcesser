/**
 * mihomo配置覆写脚本（全量版）
 * 作者：AIsouler
 * 源仓库：https://github.com/AIsouler/MyClash
 * 脚本链接：https://raw.githubusercontent.com/AIsouler/MyClash/main/Script/mihomoScript.js
 * 友情推荐，非常好用、省电且内存占用低的代理软件：https://github.com/appshubcc/Bettbox
 */

// 本修改版脚本链接：https://raw.githubusercontent.com/ValoHalo/ClashConfigProcesser/refs/heads/modified/Script/mihomoScript.js

// --- 静态配置区域 ---

// 适配 Bettbox 自定义配置参数
const Compatible_With_Bettbox = { ruleOptionsEnable: true };

/**
 * 自定义配置选项
 * true = 启用
 * false = 禁用
 */
const ruleOptionsEnable = {
  // 基础策略组
  手动选择: true, // 是否启用手动选择策略组
  自动选择: true, // 是否启用自动选择策略组
  负载均衡: true, // 是否启用负载均衡策略组

  // 以下为分流策略配置
  FCM: true, // GoogleFCM服务
  YouTube: true, // YouTube视频平台
  Google: true, // Google服务
  AI: true, // 国外AI服务
  Microsoft: true, // Microsoft服务
  Apple: true, // Apple服务
  Telegram: true, // Telegram通讯软件
  Steam: true, // Steam游戏平台
  TikTok: false, // TikTok视频平台
  Twitter: true, // Twitter社交平台
  Instagram: true, // Instagram社交平台
  Netflix: true, // Netflix视频平台
  Emby: false, // Emby媒体服务
  PikPak: true, // PikPak网盘服务
  Spotify: false, // Spotify音乐服务
  Crypto: false, // 加密货币相关服务
  EHentai: true, // E-Hentai网站
  AdBlock: true, // 广告拦截
  OneDrive: true, // OneDrive进程，包括PC和移动端相关进程
  DLsite: true, // 日本平台，会根据用户IP调整支付方式和部分内容

  // 以下为非分流策略配置
  生成地区自动选择组: true, // 是否生成地区自动选择策略组
  生成地区负载均衡组: true, // 是否为各地区生成负载均衡策略组
  隐藏地区手动选择组: false, // 是否隐藏地区手动选择策略组
  生成倍率组: true, // 是否生成低倍率/高倍率策略组
  分流组添加所有节点: false, // 是否为分流策略组添加所有节点
  过滤低倍率节点: false, // 是否过滤低倍率节点
  过滤高倍率节点: false, // 是否过滤高倍率节点
  过滤非地区节点: true, // 是否过滤非地区节点
  屏蔽国外QUIC: false, // 是否屏蔽国外QUIC流量；默认交给 Mihomo 规则匹配处理
  代理IPV4优先: false, // 是否将订阅节点统一为 IPv4 优先（与“代理IPV6优先”同时开启时不生效）
  代理IPV6优先: false, // 是否将订阅节点统一为 IPv6 优先（与“代理IPV4优先”同时开启时不生效）
  链式代理: false, // 是否启用链式代理（自定义节点作为落地节点，经“链式中转”策略组中转）

  // 个人出口与解析策略
  AI固定出口: true, // AI 仅使用本组手动选定的节点；首次使用需选择节点
  DLsite固定出口: true, // DLsite 仅使用本组手动选定的节点；首次使用需选择节点
  固定出口同区备用: false, // 固定出口在 region 指定的地区范围内按顺序回退，首选恢复后会回切
  快速故障恢复: false, // 仅缩短个人主备组的检测周期
  DNS跟随固定出口: true, // 固定服务的 DNS 查询经该服务的出口发送
  DNS兼容解析: false, // 通用解析额外启用兼容解析器，与其他解析器并发查询
  直连DNS遵循策略: false, // 直连查询也使用 nameserver-policy（含其中指定的代理）
  大流量下载直连: true, // 下载与更新域名使用独立策略组，默认直连
};

// 个人参数。region 支持单个地区或地区列表。节点优先级填写完整节点名称；其余按地区顺序、节点名称排序。Bettbox 开关见 ruleOptionsEnable。
const personalConfig = {
  serviceDefaults: { FCM: '直连', OneDrive: '直连', AI: '美国' },
  fixedExits: {
    AI: { option: 'AI固定出口', region: ['美国', '日本'], priority: [] },
    DLsite: { option: 'DLsite固定出口', region: '日本', priority: [] },
  },
  health: {
    url: 'https://www.apple.com/library/test/success.html',
    expectedStatus: 200,
    interval: 400,
    timeout: 3000,
    tolerance: 50,
    maxFailedTimes: 2,
    fallbackInterval: 400,
    fastFallbackInterval: 120,
  },
  dns: {
    direct: ['https://dns.alidns.com/dns-query#DIRECT', 'https://doh.pub/dns-query#DIRECT'],
    proxy: ['https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
    compatibility: ['https://v.recipes/dns-cn#DIRECT'],
  },
  directApps: {
    OneDrive: ['OneDrive.exe', 'OneDrive.Sync.Service.exe', 'OneDriveStandaloneUpdater.exe', 'com.microsoft.skydrive'],
  },
  downloads: {
    name: '下载更新',
    // 仅下载域名；商店、账号和更新调度域名继续使用原有分流。
    domains: [
      'steamcontent.com',
      'download.epicgames.com',
      'download2.epicgames.com',
      'download3.epicgames.com',
      'download4.epicgames.com',
      'fastly-download.epicgames.com',
      'epicgames-download1.akamaized.net',
      'dl.delivery.mp.microsoft.com',
      'download.windowsupdate.com',
      'download.nvidia.com',
    ],
  },
};

const privateNetworkRules = ['RULE-SET,private,直连'];

// 国内直连规则
const prefixRules = [
  'RULE-SET,geolocation-cn,直连',
  'RULE-SET,games_cn,直连', // 已包含 steam 下载域名
  'RULE-SET,epicgames,直连',
  'RULE-SET,nvidia_cn,直连',
  'RULE-SET,apple_cn,直连',
  'RULE-SET,microsoft_cn,直连',
  'DOMAIN,fsend.cn,直连',
  'DOMAIN,international-gfe.download.nvidia.com,直连',
];

// 此处添加自定义节点，填入下方[]内（可选，留空则不生成“自建节点”策略组）
// 自定义节点不参与节点过滤与 hosts 改写；与订阅节点（标准化后）重名时自动添加“自建-”前缀
// 示例：
// const customizeProxies = [
//   {
//     name: '自建-日本-01',
//     type: 'vmess',
//     server: '5.6.7.8',
//     port: 443,
//     uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
//     alterId: 0,
//     cipher: 'auto',
//     tls: true,
//     servername: 'example.com',
//     network: 'ws',
//     'ws-opts': {
//       path: '/path',
//       headers: { Host: 'example.com' },
//     },
//   },
// ];
const customizeProxies = [];

// 链式代理启用时，自定义节点的 dialer-proxy 引用目标
const dialerProxyName = '链式中转';

// 定义全局排除节点的正则表达式，用于排除非地区节点
const excludeFilter =
  /群|返利|循环|官网|客服|网站|网址|获取|订阅|流量|到期|机场|下次|版本|官址|备用|过期|已用|联系|邮箱|工单|贩卖|通知|倒卖|防止|国内|地址|频道|电报|无法|说明|使用|提示|访问|支持|教程|关注|更新|作者|加入|超时|收藏|优惠|福利|邀请|好友|失联|选择|剩余|公益|发布|DIZTNA|通路|登录|禁止|定时|渠道|牢记|永久|余额|阁下|本站|刷新|导航|建议|重置|以下|过滤|⚠️|@|t\.me\/\+|\bexpire\b|\bhttps?:\/\/|\.com|\btraffic\b/iu;

// 屏蔽国外QUIC
const blockForeignQuic = [
  'AND,((NETWORK,UDP),(DST-PORT,443),(NOT,((OR,((RULE-SET,cn_additional),(RULE-SET,cn_ip,no-resolve)))))),REJECT',
];

// 直连节点
const directProxies = [
  {
    name: '🇨🇳 直连 | 双栈',
    type: 'direct',
  },
  {
    name: '🇨🇳 直连 | IPv4优先',
    type: 'direct',
    'ip-version': 'ipv4-prefer',
  },
  {
    name: '🇨🇳 直连 | IPv6优先',
    type: 'direct',
    'ip-version': 'ipv6-prefer',
  },
  {
    name: '🇨🇳 直连 | 仅IPv4',
    type: 'direct',
    'ip-version': 'ipv4',
  },
  {
    name: '🇨🇳 直连 | 仅IPv6',
    type: 'direct',
    'ip-version': 'ipv6',
  },
];

// 定义地区策略组
const regionDefinitions = [
  {
    name: '香港',
    flag: '🇭🇰',
    regex: /🇭🇰|香港|(?<![A-Za-z])HKG?(?![A-Za-z])|hong\s*kong/i,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png',
  },
  {
    name: '日本',
    flag: '🇯🇵',
    regex: /🇯🇵|日本|东京|大阪|京都|(?<![A-Za-z])JPN?(?![A-Za-z])|japan/i,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png',
  },
  {
    name: '美国',
    flag: '🇺🇸',
    regex:
      /🇺🇸|美国|纽约|洛杉矶|旧金山|芝加哥|休斯顿|迈阿密|西雅图|波士顿|华盛顿|拉斯维加斯|圣何塞|圣地亚哥|(?<![A-Za-z])USA?(?![A-Za-z])|america|united\s*states/i,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png',
  },
  {
    name: '新加坡',
    flag: '🇸🇬',
    regex: /🇸🇬|新加坡|狮城|(?<![A-Za-z])SGP?(?![A-Za-z])|singapore/i,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png',
  },
  {
    name: '台湾省',
    flag: '🇹🇼',
    regex: /🇹🇼|台湾|台北|高雄|(?<![A-Za-z])TWN?(?![A-Za-z])|taiwan/i,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png',
  },
];

// 定义倍率策略组
const lowRateRegionName = '低倍率节点';
const highRateRegionName = '高倍率节点';

// 倍率必须带有 x、倍或乘号；先提取完整数值，再判断阈值。
function getProxyRate(name) {
  const match = name.match(
    /(?:^|[^\dA-Za-z.])(\d+(?:\.\d+)?)\s*[*×✕✖⨯⨉x倍](?=$|[^\dA-Za-z.])|(?:[*×✕✖⨯⨉]|(?<![A-Za-z])x)\s*(\d+(?:\.\d+)?)(?=$|[^\dA-Za-z.])/i,
  );
  return match ? Number(match[1] === undefined ? match[2] : match[1]) : null;
}

const rateRegionDefinitions = [
  {
    name: lowRateRegionName,
    matches: (name) => {
      const rate = getProxyRate(name);
      return rate !== null
        ? rate <= 0.5
        : /低倍|免费|(?<![A-Za-z])free(?![A-Za-z])|^(?!.*(?:客户端|软件)).*下载/i.test(name);
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Available_1.png',
  },
  {
    name: highRateRegionName,
    matches: (name) => {
      const rate = getProxyRate(name);
      return rate !== null && rate >= 2;
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Airport.png',
  },
];

// 全部策略组定义（地区 + 倍率），统一用于节点匹配与归类
const allRegionDefinitions = [...regionDefinitions, ...rateRegionDefinitions];

// Rule Providers 通用配置
const ruleProviderCommonDomain = {
  type: 'http',
  format: 'mrs',
  interval: 86400,
  behavior: 'domain',
};
const ruleProviderCommonIpcidr = {
  type: 'http',
  format: 'mrs',
  interval: 86400,
  behavior: 'ipcidr',
};

// 定义基础 Rule Providers
const baseRuleProviders = {
  // --- 直连规则集 ---

  private: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/private.mrs',
    path: './ruleset/private.mrs',
    'path-in-bundle': 'geo/geosite/private.mrs',
  },
  private_ip: {
    ...ruleProviderCommonIpcidr,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/private.mrs',
    path: './ruleset/private_ip.mrs',
    'path-in-bundle': 'geo/geoip/private.mrs',
  },
  games_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-games@cn.mrs',
    path: './ruleset/category-games@cn.mrs',
    'path-in-bundle': 'geo/geosite/category-games@cn.mrs',
  },
  epicgames: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/epicgames.mrs',
    path: './ruleset/epicgames.mrs',
    'path-in-bundle': 'geo/geosite/epicgames.mrs',
  },
  nvidia_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/nvidia@cn.mrs',
    path: './ruleset/nvidia@cn.mrs',
    'path-in-bundle': 'geo/geosite/nvidia@cn.mrs',
  },
  apple_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/apple@cn.mrs',
    path: './ruleset/apple@cn.mrs',
    'path-in-bundle': 'geo/geosite/apple@cn.mrs',
  },
  microsoft_cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/microsoft@cn.mrs',
    path: './ruleset/microsoft@cn.mrs',
    'path-in-bundle': 'geo/geosite/microsoft@cn.mrs',
  },
  'geolocation-cn': {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-cn.mrs',
    path: './ruleset/geolocation-cn.mrs',
    'path-in-bundle': 'geo/geosite/geolocation-cn.mrs',
  },
  cn_ip: {
    ...ruleProviderCommonIpcidr,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/cn.mrs',
    path: './ruleset/cn_ip.mrs',
    'path-in-bundle': 'geo/geoip/cn.mrs',
  },

  // --- 代理规则集 ---

  'geolocation-!cn': {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/geolocation-!cn.mrs',
    path: './ruleset/geolocation-!cn.mrs',
    'path-in-bundle': 'geo/geosite/geolocation-!cn.mrs',
  },

  // --- 其他规则集 ---

  fakeip_filter: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/fakeip-filter.mrs',
    path: './ruleset/fakeip-filter.mrs',
    'path-in-bundle': 'geo/geosite/fakeip-filter.mrs',
  },
  cn_additional: {
    ...ruleProviderCommonDomain,
    url: 'https://static-file-global.353355.xyz/rules/cn-additional-list.mrs',
    path: './ruleset/cn-additional-list.mrs',
    'path-in-bundle': 'geo/geosite/cn.mrs',
  },
  cn: {
    ...ruleProviderCommonDomain,
    url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/cn.mrs',
    path: './ruleset/cn.mrs',
    'path-in-bundle': 'geo/geosite/cn.mrs',
  },
};

// 策略组公共配置
const groupBaseOption = {
  interval: personalConfig.health.interval,
  timeout: personalConfig.health.timeout,
  url: personalConfig.health.url,
  'expected-status': personalConfig.health.expectedStatus,
  lazy: true,
  'max-failed-times': personalConfig.health.maxFailedTimes,
  'empty-fallback': 'REJECT',
};

// select策略组通用配置
const selectBaseOption = {
  ...groupBaseOption,
  type: 'select',
};

// url-test策略组通用配置
const urlTestBaseOption = {
  ...groupBaseOption,
  type: 'url-test',
  tolerance: personalConfig.health.tolerance,
  'exclude-type': 'DIRECT',
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png',
  hidden: true,
};

// load-balance策略组通用配置
const loadBalanceBaseOption = {
  ...groupBaseOption,
  type: 'load-balance',
  strategy: 'sticky-sessions',
  'exclude-type': 'DIRECT',
  icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Round_Robin.png',
  hidden: true,
};

// 定义基础策略组
const baseGroups = [
  {
    name: '手动选择',
    baseOption: selectBaseOption,
    includeAll: true,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png',
  },
  {
    name: '自动选择',
    baseOption: urlTestBaseOption,
    includeAll: true,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Auto.png',
  },
  {
    name: '负载均衡',
    baseOption: loadBalanceBaseOption,
    includeAll: true,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Round_Robin.png',
  },
];

// 定义分流策略组配置
const serviceConfigs = [
  ...baseGroups,
  {
    name: 'FCM',
    baseOption: selectBaseOption,
    direct: true,
    defaultSelected: '直连',
    providers: {
      googlefcm: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/googlefcm.mrs',
        path: './ruleset/googlefcm.mrs',
        'path-in-bundle': 'geo/geosite/googlefcm.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/MiToverG422/Qure@master/IconSet/Color/fcm.png',
    rules: ['RULE-SET,googlefcm,FCM'],
  },
  {
    name: 'YouTube',
    baseOption: selectBaseOption,
    providers: {
      youtube: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/youtube.mrs',
        path: './ruleset/youtube.mrs',
        'path-in-bundle': 'geo/geosite/youtube.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png',
    rules: ['RULE-SET,youtube,YouTube'],
  },
  {
    name: 'Google',
    baseOption: selectBaseOption,
    providers: {
      google: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/google.mrs',
        path: './ruleset/google.mrs',
        'path-in-bundle': 'geo/geosite/google.mrs',
      },
      google_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/google.mrs',
        path: './ruleset/google_ip.mrs',
        'path-in-bundle': 'geo/geoip/google.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google_Search.png',
    rules: ['RULE-SET,google,Google', 'RULE-SET,google_ip,Google,no-resolve'],
  },
  {
    name: 'OneDrive',
    baseOption: selectBaseOption,
    direct: true,
    defaultSelected: '直连',
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/OneDrive.png',
    rules: personalConfig.directApps.OneDrive.map((name) => 'PROCESS-NAME,' + name + ',OneDrive'),
  },
  {
    name: 'DLsite',
    baseOption: selectBaseOption,
    providers: {
      dlsite: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/geo/geosite/dlsite.mrs',
        path: './ruleset/dlsite.mrs',
        'path-in-bundle': 'geo/geosite/dlsite.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Available_Alt.png',
    rules: ['RULE-SET,dlsite,DLsite'],
  },
  {
    name: 'AI',
    baseOption: selectBaseOption,
    defaultSelected: '美国',
    providers: {
      ai: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-ai-!cn.mrs',
        path: './ruleset/ai.mrs',
        'path-in-bundle': 'geo/geosite/category-ai-!cn.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png',
    rules: ['RULE-SET,ai,AI'],
  },
  {
    name: 'Microsoft',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      github: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/github.mrs',
        path: './ruleset/github.mrs',
        'path-in-bundle': 'geo/geosite/github.mrs',
      },
      microsoft: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/microsoft.mrs',
        path: './ruleset/microsoft.mrs',
        'path-in-bundle': 'geo/geosite/microsoft.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Microsoft.png',
    rules: ['RULE-SET,github,默认代理', 'RULE-SET,microsoft,Microsoft'],
  },
  {
    name: 'Apple',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      apple: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/apple.mrs',
        path: './ruleset/apple.mrs',
        'path-in-bundle': 'geo/geosite/apple.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Apple.png',
    rules: ['RULE-SET,apple,Apple'],
  },
  {
    name: 'Telegram',
    baseOption: selectBaseOption,
    providers: {
      telegram: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/telegram.mrs',
        path: './ruleset/telegram.mrs',
        'path-in-bundle': 'geo/geosite/telegram.mrs',
      },
      telegram_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/telegram.mrs',
        path: './ruleset/telegram_ip.mrs',
        'path-in-bundle': 'geo/geoip/telegram.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png',
    rules: ['RULE-SET,telegram,Telegram', 'RULE-SET,telegram_ip,Telegram,no-resolve'],
  },
  {
    name: 'Steam',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      steam: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/steam.mrs',
        path: './ruleset/steam.mrs',
        'path-in-bundle': 'geo/geosite/steam.mrs',
      },
      steam_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/steam.mrs',
        path: './ruleset/steam_ip.mrs',
        'path-in-bundle': 'geo/geoip/steam.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Steam.png',
    rules: ['RULE-SET,steam,Steam', 'RULE-SET,steam_ip,Steam,no-resolve'],
  },
  {
    name: 'TikTok',
    baseOption: selectBaseOption,
    defaultSelected: '日本',
    providers: {
      tiktok: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/tiktok.mrs',
        path: './ruleset/tiktok.mrs',
        'path-in-bundle': 'geo/geosite/tiktok.mrs',
      },
      tiktok_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/tiktok.mrs',
        path: './ruleset/tiktok_ip.mrs',
        'path-in-bundle': 'geo/geoip/tiktok.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/TikTok.png',
    rules: ['RULE-SET,tiktok,TikTok', 'RULE-SET,tiktok_ip,TikTok,no-resolve'],
  },
  {
    name: 'Twitter',
    baseOption: selectBaseOption,
    providers: {
      twitter: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/twitter.mrs',
        path: './ruleset/twitter.mrs',
        'path-in-bundle': 'geo/geosite/twitter.mrs',
      },
      twitter_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/twitter.mrs',
        path: './ruleset/twitter_ip.mrs',
        'path-in-bundle': 'geo/geoip/twitter.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Twitter.png',
    rules: ['RULE-SET,twitter,Twitter', 'RULE-SET,twitter_ip,Twitter,no-resolve'],
  },
  {
    name: 'Instagram',
    baseOption: selectBaseOption,
    providers: {
      instagram: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/instagram.mrs',
        path: './ruleset/instagram.mrs',
        'path-in-bundle': 'geo/geosite/instagram.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Instagram.png',
    rules: ['RULE-SET,instagram,Instagram'],
  },
  {
    name: 'Netflix',
    baseOption: selectBaseOption,
    providers: {
      netflix: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/netflix.mrs',
        path: './ruleset/netflix.mrs',
        'path-in-bundle': 'geo/geosite/netflix.mrs',
      },
      netflix_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/netflix.mrs',
        path: './ruleset/netflix_ip.mrs',
        'path-in-bundle': 'geo/geoip/netflix.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Netflix.png',
    rules: ['RULE-SET,netflix,Netflix', 'RULE-SET,netflix_ip,Netflix,no-resolve'],
  },
  {
    name: 'Emby',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      emby: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/666OS/rules@release/mihomo/domain/Emby.mrs',
        path: './ruleset/emby.mrs',
        'path-in-bundle': 'geo/geosite/category-emby.mrs',
      },
      emos: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/binaryu/emos-proxy-rule@main/rules/emos-mihomo.mrs',
        path: './ruleset/emos.mrs',
        'path-in-bundle': 'geo/geosite/category-emby.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Emby.png',
    rules: [
      'RULE-SET,emby,Emby',
      'RULE-SET,emos,Emby',
      'DOMAIN-SUFFIX,mb3admin.com,Emby',
      'DOMAIN-SUFFIX,nubebelle.com,Emby',
      'DOMAIN-KEYWORD,emby,Emby',
      'PROCESS-NAME,com.mb.android,Emby',
      'PROCESS-NAME,tv.emby.embyatv,Emby',
      'PROCESS-NAME,com.hush.yamby,Emby',
      'PROCESS-NAME,com.jellycine.app,Emby',
      'PROCESS-NAME,com.mountains.hills,Emby',
      'PROCESS-NAME,RodelPlayer.App.exe,Emby',
      'PROCESS-NAME,com.feifeiduck.capyplayer,Emby',
    ],
  },
  {
    name: 'PikPak',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      pikpak: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/pikpak.mrs',
        path: './ruleset/pikpak.mrs',
        'path-in-bundle': 'geo/geosite/pikpak.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/lige47/QuanX-icon-rule@main/icon/03CNSoft/pikpak.png',
    rules: ['RULE-SET,pikpak,PikPak'],
  },
  {
    name: 'Spotify',
    baseOption: selectBaseOption,
    direct: true,
    providers: {
      spotify: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/spotify.mrs',
        path: './ruleset/spotify.mrs',
        'path-in-bundle': 'geo/geosite/spotify.mrs',
      },
      spotify_ip: {
        ...ruleProviderCommonIpcidr,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geoip/spotify.mrs',
        path: './ruleset/spotify_ip.mrs',
        'path-in-bundle': 'geo/geoip/spotify.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Spotify.png',
    rules: ['RULE-SET,spotify,Spotify', 'RULE-SET,spotify_ip,Spotify,no-resolve'],
  },
  {
    name: 'Crypto',
    baseOption: selectBaseOption,
    defaultSelected: '日本',
    providers: {
      cryptocurrency: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/category-cryptocurrency.mrs',
        path: './ruleset/cryptocurrency.mrs',
        'path-in-bundle': 'geo/geosite/category-cryptocurrency.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/lige47/QuanX-icon-rule@main/icon/04ProxySoft/Bitcoin.png',
    rules: ['RULE-SET,cryptocurrency,Crypto'],
  },
  {
    name: 'EHentai',
    baseOption: selectBaseOption,
    defaultSelected: '美国',
    providers: {
      ehentai: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/appshubcc/bett-rules@meta/geo/geosite/ehentai.mrs',
        path: './ruleset/ehentai.mrs',
        'path-in-bundle': 'geo/geosite/ehentai.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/lige47/QuanX-icon-rule@main/icon/04ProxySoft/exhentai.png',
    rules: ['RULE-SET,ehentai,EHentai', 'DOMAIN-SUFFIX,hanime1.me,EHentai', 'DOMAIN-SUFFIX,iwara.tv,EHentai'],
  },
  {
    name: 'AdBlock',
    baseOption: selectBaseOption,
    reject: true,
    providers: {
      adblockmihomo: {
        ...ruleProviderCommonDomain,
        url: 'https://fastly.jsdelivr.net/gh/217heidai/adblockfilters@main/rules/adblockmihomo.mrs',
        path: './ruleset/adblockmihomo.mrs',
        'path-in-bundle': 'geo/geosite/category-ads-all.mrs',
      },
    },
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Advertising.png',
    rules: ['RULE-SET,adblockmihomo,AdBlock'],
  },
];

// ---节点过滤、重命名及验证---

/**
 * 节点匹配缓存，避免重复执行正则
 */
const regionMatchCache = new Map();
function getMatchedRegions(proxyName) {
  if (regionMatchCache.has(proxyName)) {
    return regionMatchCache.get(proxyName);
  }

  const regions = allRegionDefinitions.filter((region) =>
    region.matches ? region.matches(proxyName) : region.regex.test(proxyName),
  );
  regionMatchCache.set(proxyName, regions);

  return regions;
}

/**
 * 标准化节点名称：补全地区国旗、折叠多余空格，并预缓存匹配结果
 */
const flagRegex = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
function normalizeProxyName(proxy) {
  const originalName = proxy.name;

  const flag = originalName.match(flagRegex)?.[0];

  const nameWithoutFlag = (flag ? originalName.replace(flag, '') : originalName).replace(/\s+/g, ' ').trim();

  const matchedRegions = getMatchedRegions(originalName);

  const regionFlag = flag || matchedRegions.find((region) => region.flag)?.flag;

  const normalizedName = regionFlag ? `${regionFlag} ${nameWithoutFlag}` : nameWithoutFlag;

  if (normalizedName !== originalName) {
    regionMatchCache.set(normalizedName, matchedRegions);
  }

  return normalizedName === originalName ? proxy : { ...proxy, name: normalizedName };
}

/**
 * 修复 dialer-proxy 引用：目标被重命名则更新，被移除或不存在则删除引用
 */
function fixDialerProxy(proxy, renameMap, normalizedProxyNames) {
  const target = proxy['dialer-proxy'];
  if (!target) return proxy;

  if (renameMap.has(target)) {
    return { ...proxy, 'dialer-proxy': renameMap.get(target) };
  }

  if (normalizedProxyNames.has(target)) {
    return proxy;
  }

  const copy = { ...proxy };
  delete copy['dialer-proxy'];
  return copy;
}

/**
 * 读取代理 IP 版本偏好：仅其中一个开关开启时返回对应偏好，
 * 同时开启或同时关闭时返回 null（不应用任何偏好，节点保持原样）
 */
function getIpVersionPreference() {
  const ipv4PreferEnabled = ruleOptionsEnable.代理IPV4优先;
  const ipv6PreferEnabled = ruleOptionsEnable.代理IPV6优先;

  if (ipv4PreferEnabled && !ipv6PreferEnabled) return 'ipv4-prefer';
  if (ipv6PreferEnabled && !ipv4PreferEnabled) return 'ipv6-prefer';
  return null;
}

/**
 * 过滤并标准化节点：剔除内置/信息节点、按配置过滤、去重、修复 dialer-proxy 引用，空列表时抛错
 */
function filterAndNormalizeProxies(config, renameMap = new Map()) {
  regionMatchCache.clear();

  const filterLowRateProxiesEnabled = ruleOptionsEnable.过滤低倍率节点;
  const filterHighRateProxiesEnabled = ruleOptionsEnable.过滤高倍率节点;
  const filterNonRegionProxiesEnabled = ruleOptionsEnable.过滤非地区节点;

  const originalProxies = config.proxies || [];
  if (!Array.isArray(originalProxies)) throw new Error('proxies 必须为节点数组');
  for (const proxy of originalProxies) {
    if (!proxy || typeof proxy.name !== 'string' || !proxy.name.trim()) {
      throw new Error('每个代理节点必须包含非空名称');
    }
  }

  const filteredRawProxies = originalProxies.filter((proxy) => {
    const type = String(proxy.type ?? '').toLowerCase();
    if (type === 'direct' || type === 'reject' || type === 'rematch') return false;

    const matchedRegions = getMatchedRegions(proxy.name);
    if (filterLowRateProxiesEnabled && matchedRegions.some((r) => r.name === lowRateRegionName)) return false;
    if (filterHighRateProxiesEnabled && matchedRegions.some((r) => r.name === highRateRegionName)) return false;

    if (!filterNonRegionProxiesEnabled) return true;

    const isRegionProxy = matchedRegions.some((region) => regionDefinitions.includes(region));

    return isRegionProxy || !excludeFilter.test(proxy.name);
  });

  // 标准化后发生名称碰撞时保留原名，避免自动补旗或折叠空格导致节点丢失。
  const normalizedCandidates = filteredRawProxies.map((rawProxy) => ({
    rawProxy,
    normalized: normalizeProxyName(rawProxy),
  }));
  const normalizedNameCounts = normalizedCandidates.reduce((counts, { normalized }) => {
    counts.set(normalized.name, (counts.get(normalized.name) || 0) + 1);
    return counts;
  }, new Map());

  const reservedNames = getReservedProxyNames();
  const candidateNames = new Set(
    normalizedCandidates.flatMap(({ rawProxy, normalized }) => [rawProxy.name, normalized.name]),
  );

  // 最终名称仍完全相同时去重（保留首个同名节点）
  const normalizedProxies = [];
  const uniqueNames = new Set();

  for (const { rawProxy, normalized } of normalizedCandidates) {
    let resolved =
      normalizedNameCounts.get(normalized.name) > 1 && normalized.name !== rawProxy.name ? rawProxy : normalized;
    if (renameMap.has(rawProxy.name)) continue;
    if (reservedNames.has(resolved.name)) {
      const baseName = `节点-${resolved.name}`;
      let name = baseName;
      for (let index = 2; candidateNames.has(name) || uniqueNames.has(name) || reservedNames.has(name); index++) {
        name = `${baseName}-${index}`;
      }
      resolved = { ...resolved, name };
    }
    if (resolved.name !== rawProxy.name) {
      renameMap.set(rawProxy.name, resolved.name);
    }
    if (!uniqueNames.has(resolved.name)) {
      uniqueNames.add(resolved.name);
      normalizedProxies.push(resolved);
    }
  }

  const normalizedProxyNames = new Set(normalizedProxies.map((p) => p.name));

  const filteredProxies = normalizedProxies.map((proxy) => fixDialerProxy(proxy, renameMap, normalizedProxyNames));

  if (!filteredProxies.length) {
    throw new Error('配置文件中未找到任何代理节点，请使用机场提供的配置文件进行覆写');
  }

  const ipVersionPreference = getIpVersionPreference();
  if (ipVersionPreference) {
    return filteredProxies.map((proxy) =>
      proxy['ip-version'] === ipVersionPreference ? proxy : { ...proxy, 'ip-version': ipVersionPreference },
    );
  }

  return filteredProxies;
}

function getReservedProxyNames() {
  return new Set([
    'DIRECT',
    'REJECT',
    'REJECT-DROP',
    'PASS',
    'COMPATIBLE',
    'GLOBAL',
    '默认代理',
    '漏网之鱼',
    '直连',
    '自建节点',
    '链式落地',
    personalConfig.downloads.name,
    dialerProxyName,
    ...directProxies.map((proxy) => proxy.name),
    ...serviceConfigs.map((service) => service.name),
    ...[...allRegionDefinitions.map((region) => region.name), '其他节点'].flatMap((name) => [
      name,
      `${name}-自动选择`,
      `${name}-负载均衡`,
    ]),
  ]);
}

// ---构建地区组和倍率组---

/**
 * 构建地区策略组，可附带自动选择组和负载均衡组
 */
function createRegionGroup(name, icon, proxies) {
  const generateRegionAutoSelectEnabled = ruleOptionsEnable.生成地区自动选择组;
  const generateRegionLoadBalanceEnabled = ruleOptionsEnable.生成地区负载均衡组;
  const hideManualSelectGroupEnabled = ruleOptionsEnable.隐藏地区手动选择组;
  const generatedGroups = [];
  const selectProxies = [];

  if (generateRegionAutoSelectEnabled) {
    const urlTestName = `${name}-自动选择`;
    generatedGroups.push({
      ...urlTestBaseOption,
      name: urlTestName,
      proxies,
    });
    selectProxies.push(urlTestName);
  }

  if (generateRegionLoadBalanceEnabled) {
    const loadBalanceName = `${name}-负载均衡`;
    generatedGroups.push({
      ...loadBalanceBaseOption,
      name: loadBalanceName,
      proxies,
    });
    selectProxies.push(loadBalanceName);
  }

  generatedGroups.push({
    ...selectBaseOption,
    name,
    icon,
    proxies: [...selectProxies, ...proxies],
    hidden: hideManualSelectGroupEnabled,
  });

  return generatedGroups;
}

/**
 * 将节点按地区/倍率归类，构建地区策略组、倍率策略组与“其他节点”组
 */
function buildRegionGroups(filteredProxies, customProxies) {
  const generateRateGroupEnabled = ruleOptionsEnable.生成倍率组;

  const regionGroups = Object.fromEntries(allRegionDefinitions.map(({ name }) => [name, []]));
  const otherProxies = [];

  for (const proxy of [...filteredProxies, ...customProxies]) {
    const matchedRegions = getMatchedRegions(proxy.name);
    const isRegionProxy = matchedRegions.some((region) => regionDefinitions.includes(region));

    for (const region of matchedRegions) {
      regionGroups[region.name].push(proxy.name);
    }

    if (!isRegionProxy) {
      otherProxies.push(proxy.name);
    }
  }

  const generatedRegionGroups = allRegionDefinitions
    .filter((r) => regionGroups[r.name].length > 0 && (generateRateGroupEnabled || !rateRegionDefinitions.includes(r)))
    .flatMap((r) => createRegionGroup(r.name, r.icon, regionGroups[r.name]));

  if (otherProxies.length > 0) {
    generatedRegionGroups.push(
      ...createRegionGroup(
        '其他节点',
        'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/World_Map.png',
        otherProxies,
      ),
    );
  }

  return generatedRegionGroups;
}

// ---构建自定义节点组---

/**
 * 处理自定义节点：标准化名称、与订阅节点重名时添加“自建-”前缀、内部去重，
 * 并构建“自建节点”策略组。
 * 自定义节点不参与订阅节点过滤，也不参与 hosts 改写及 DNS 域名处理。
 */
function buildCustomizeGroups(filteredProxies, customizeList = customizeProxies, subscriptionRenames = new Map()) {
  const chainEnabled = ruleOptionsEnable.链式代理;

  if (!customizeList.length) {
    if (chainEnabled) {
      throw new Error('启用失败，请在脚本中添加自定义节点后尝试');
    }
    return { customProxies: [], customProxyNames: [], customGroup: null };
  }

  const usedNames = new Set([...getReservedProxyNames(), ...filteredProxies.map((p) => p.name)]);
  const customRenames = new Map();
  const customPrefix = '自建-';
  let customProxies = [];

  for (const proxy of customizeList) {
    const normalized = normalizeProxyName(proxy);
    let name = normalized.name;
    while (usedNames.has(name)) {
      name = normalizeProxyName({ name: `${customPrefix}${name}` }).name.replace(`${customPrefix} `, customPrefix);
    }
    usedNames.add(name);
    if (!customRenames.has(proxy.name)) customRenames.set(proxy.name, name);

    let customProxy = name === normalized.name ? normalized : { ...normalized, name };
    if (chainEnabled && customProxy['dialer-proxy'] !== dialerProxyName) {
      customProxy = { ...customProxy, 'dialer-proxy': dialerProxyName };
    }
    customProxies.push(customProxy);
  }

  if (!chainEnabled) {
    customProxies = customProxies.map((proxy) => {
      const target = proxy['dialer-proxy'];
      const renamed =
        subscriptionRenames.get(target) ||
        (filteredProxies.some((item) => item.name === target) ? target : customRenames.get(target));
      return renamed && renamed !== target ? { ...proxy, 'dialer-proxy': renamed } : proxy;
    });
  }
  const customProxyNames = customProxies.map((p) => p.name);

  const customGroup = {
    ...selectBaseOption,
    name: chainEnabled ? '链式落地' : '自建节点',
    proxies: customProxyNames,
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Server.png',
  };

  return {
    customProxies,
    customProxyNames,
    customGroup,
  };
}

// ---构建基础策略组和分流策略组---

/**
 * 构建基础/分流策略组/部分节点组、GLOBAL 组与规则集，并汇总分流规则
 */
/** 个人服务出口只引用具体节点，地区外节点与嵌套自动选择组不进入候选。 */
function buildFixedExit(svc, proxies) {
  const settings = personalConfig.fixedExits[svc.name];
  if (!settings || !ruleOptionsEnable[settings.option]) return null;
  const regions = Array.isArray(settings.region) ? settings.region : [settings.region];
  const priority = settings.priority.map((name) => normalizeProxyName({ name }).name);
  const names = proxies
    .map((proxy) => {
      const matchedRegions = getMatchedRegions(proxy.name);
      return {
        name: proxy.name,
        regionIndex: regions.findIndex((name) => matchedRegions.some((region) => region.name === name)),
      };
    })
    .filter((proxy) => proxy.regionIndex >= 0)
    .sort((a, b) => {
      const left = priority.indexOf(a.name);
      const right = priority.indexOf(b.name);
      const order = (left < 0 ? priority.length : left) - (right < 0 ? priority.length : right);
      return order || a.regionIndex - b.regionIndex || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    })
    .map((proxy) => proxy.name);
  const fallback = ruleOptionsEnable.固定出口同区备用 && names.length > 0;
  return {
    ...selectBaseOption,
    name: svc.name,
    icon: svc.icon,
    type: fallback ? 'fallback' : 'select',
    proxies: fallback ? names : ['REJECT', ...names],
    interval: fallback
      ? ruleOptionsEnable.快速故障恢复
        ? personalConfig.health.fastFallbackInterval
        : personalConfig.health.fallbackInterval
      : 0,
    ...(fallback ? {} : { 'default-selected': 'REJECT' }),
  };
}

function dnsThroughProxy(address, proxy) {
  const [base, ...suffixes] = address.split('#');
  const parameters = suffixes
    .join('&')
    .split('&')
    .filter((part) => part.includes('='));
  return base + '#' + [proxy, ...parameters].join('&');
}

function buildFunctionalGroups(filteredProxies, generatedRegionGroups, customizeInfo) {
  const blockForeignQuicEnabled = ruleOptionsEnable.屏蔽国外QUIC;
  const addAllNodesToServiceGroupsEnabled = ruleOptionsEnable.分流组添加所有节点;
  const chainEnabled = ruleOptionsEnable.链式代理;
  const hideManualSelectGroupEnabled = ruleOptionsEnable.隐藏地区手动选择组;

  const functionalGroups = [];
  const functionalRules = [];
  const adblockRules = [];
  const processRules = [];
  const downloadRules = [];
  const serviceDnsPolicies = {};
  const finalRuleProviders = { ...baseRuleProviders };

  if (!blockForeignQuicEnabled) {
    delete finalRuleProviders.cn_additional;
  }

  const { customProxyNames = [], customGroup = null } = customizeInfo || {};
  const filteredProxyNames = filteredProxies.map((p) => p.name);
  const allProxiesNames = [...customProxyNames, ...filteredProxyNames];
  const groupNamesOfSelect = generatedRegionGroups.filter((g) => g.type === 'select').map((g) => g.name);
  const baseGroupNames = baseGroups.filter((g) => ruleOptionsEnable[g.name]).map((g) => g.name);
  const customGroupNames = customGroup ? [customGroup.name] : [];

  functionalGroups.push({
    ...selectBaseOption,
    name: '默认代理',
    proxies: [...groupNamesOfSelect, ...baseGroupNames, ...customGroupNames],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png',
  });

  for (const svc of serviceConfigs) {
    if (!ruleOptionsEnable[svc.name]) continue;

    Object.assign(finalRuleProviders, svc.providers || {});
    for (const rule of svc.rules || []) {
      if (svc.name === 'AdBlock') adblockRules.push(rule);
      else if (rule.startsWith('PROCESS-')) processRules.push(rule);
      else functionalRules.push(rule);
    }

    const fixedExit = buildFixedExit(svc, [...filteredProxies, ...(customizeInfo.customProxies || [])]);
    if (fixedExit) {
      functionalGroups.push(fixedExit);
      if (ruleOptionsEnable.DNS跟随固定出口) {
        for (const [providerName, provider] of Object.entries(svc.providers || {})) {
          if (provider.behavior === 'domain') {
            serviceDnsPolicies['rule-set:' + providerName] = personalConfig.dns.proxy.map((dns) =>
              dnsThroughProxy(dns, svc.name),
            );
          }
        }
      }
      continue;
    }

    let groupProxies = [];
    if (svc.includeAll) {
      groupProxies = [...allProxiesNames];
    } else if (svc.reject) {
      groupProxies = ['REJECT', 'REJECT-DROP', 'PASS'];
    } else {
      groupProxies = !addAllNodesToServiceGroupsEnabled
        ? ['默认代理', ...customGroupNames, ...baseGroupNames, ...groupNamesOfSelect, ...(svc.direct ? ['直连'] : [])]
        : [
            '默认代理',
            ...customGroupNames,
            ...baseGroupNames,
            ...groupNamesOfSelect,
            ...allProxiesNames,
            ...(svc.direct ? ['直连'] : []),
          ];
    }

    const preferred = Object.prototype.hasOwnProperty.call(personalConfig.serviceDefaults, svc.name)
      ? personalConfig.serviceDefaults[svc.name]
      : svc.defaultSelected;
    const defaultSelected = groupProxies.includes(preferred)
      ? preferred
      : preferred !== undefined
        ? '默认代理'
        : undefined;

    if (defaultSelected !== undefined) {
      groupProxies = [defaultSelected, ...groupProxies.filter((name) => name !== defaultSelected)];
    }

    functionalGroups.push({
      ...svc.baseOption,
      name: svc.name,
      icon: svc.icon,
      proxies: groupProxies,
      ...(defaultSelected !== undefined && {
        'default-selected': defaultSelected,
      }),
    });
  }

  functionalGroups.push({
    ...selectBaseOption,
    name: '漏网之鱼',
    proxies: ['默认代理', '直连', ...groupNamesOfSelect],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Stack.png',
  });

  if (ruleOptionsEnable.大流量下载直连) {
    functionalGroups.push({
      ...selectBaseOption,
      name: personalConfig.downloads.name,
      proxies: ['直连', '默认代理'],
      'default-selected': '直连',
      interval: 0,
      icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Download.png',
    });
    for (const domain of new Set(personalConfig.downloads.domains)) {
      if (!/^[a-z0-9.-]+$/i.test(domain) || !domain.includes('.') || domain.startsWith('.')) {
        throw new Error('下载域名应为不含通配符、端口或路径的域名');
      }
      downloadRules.push('DOMAIN-SUFFIX,' + domain + ',' + personalConfig.downloads.name);
    }
  }

  if (customGroup) {
    functionalGroups.push(customGroup);
  }

  const chainGroup =
    chainEnabled && customGroup
      ? {
          ...selectBaseOption,
          name: dialerProxyName,
          proxies: filteredProxyNames,
          icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bypass.png',
        }
      : null;

  const directGroup = {
    ...selectBaseOption,
    name: '直连',
    proxies: [...directProxies.map((p) => p.name)],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/China.png',
    hidden: hideManualSelectGroupEnabled,
  };

  const globalGroup = {
    ...selectBaseOption,
    name: 'GLOBAL',
    proxies: [
      ...functionalGroups.map((g) => g.name),
      ...(chainGroup ? [chainGroup.name] : []),
      directGroup.name,
      ...generatedRegionGroups.map((g) => g.name),
    ],
    icon: 'https://fastly.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png',
  };

  return {
    globalGroup,
    functionalGroups,
    functionalRules,
    adblockRules,
    processRules,
    downloadRules,
    serviceDnsPolicies,
    finalRuleProviders,
    chainGroup,
    directGroup,
  };
}

// ---dns和hosts相关处理---

// 常见的公共 DNS，用于过滤订阅中的公共 DNS
const commonDnsList = [
  // IPv4（国内）
  '223.5.5.5',
  '223.6.6.6',
  '119.29.29.29',
  '1.12.12.12',
  '120.53.53.53',
  '114.114.114.114',
  '180.76.76.76',
  '1.2.4.8',
  '116.116.116.116',
  '101.226.4.6',
  '123.125.81.6',
  '180.184.1.1',
  '180.184.2.2',

  // IPv6（国内）
  '2400:3200::1',
  '2400:3200:baba::1',
  '2402:4e00::',
  '2400:da00::6666',

  // IPv4（国外）
  '1.1.1.1',
  '1.0.0.1',
  '8.8.8.8',
  '8.8.4.4',
  '9.9.9.9',
  '149.112.112.112',
  '208.67.222.222',
  '208.67.220.220',
  '94.140.14.14',
  '94.140.15.15',
  '76.76.2.0',
  '76.76.10.0',
  '185.228.168.9',
  '185.228.169.9',
  '77.88.8.8',
  '77.88.8.1',
  '156.154.70.1',
  '156.154.71.1',

  // IPv6（国外）
  '2606:4700:4700::1111',
  '2606:4700:4700::1001',
  '2001:4860:4860::8888',
  '2001:4860:4860::8844',
  '2620:fe::fe',
  '2620:fe::9',
  '2620:119:35::35',
  '2620:119:53::53',
  '2a10:50c0::bad1:ff',
  '2a10:50c0::bad2:ff',
  '2a10:50c0::ad1:ff',
  '2a10:50c0::ad2:ff',
  '2a0d:2a00:1::2',
  '2a0d:2a00:2::2',
  '2a02:6b8::feed:0ff',
  '2a02:6b8:0:1::feed:0ff',
  '2610:a1:1018::1',
  '2610:a1:1019::1',

  // 公共解析服务的主机名及其子域
  'alidns.com',
  'doh.pub',
  'dot.pub',
  'dns.pub',
  'dnspod.cn',
  'dnspod.com',
  'dns.baidu.com',
  'dns.google',
  'dns.cloudflare.com',
  'cloudflare-dns.com',
  'quad9.net',
  'opendns.com',
  'nextdns.io',
  'adguard.com',
  'adguard-dns.com',
];

// 展开 IPv6 后按地址比较，DNS 路径、参数及相似域名不参与公共解析器判定。
function normalizeDnsHost(host) {
  host = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host.includes(':')) return host;
  const parts = host.split('::');
  if (parts.length > 2) return host;
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts.length > 1 && parts[1] ? parts[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  const words = parts.length === 2 && missing > 0 ? [...left, ...Array(missing).fill('0'), ...right] : left;
  return words.length === 8 && words.every((word) => /^[0-9a-f]{1,4}$/.test(word))
    ? words.map((word) => parseInt(word, 16).toString(16)).join(':')
    : host;
}

function parseDnsEndpoint(value) {
  const address = String(value).trim().split('#')[0];
  const schemeMatch = address.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : 'udp';
  let authority = (schemeMatch ? address.slice(schemeMatch[0].length) : address).split(/[/?]/)[0];
  authority = authority.slice(authority.lastIndexOf('@') + 1);
  const bracket = authority.match(/^\[([^\]]+)\](?::(\d+))?$/);
  const hostPort = authority.match(/^([^:]+):(\d+)$/);
  const host = bracket ? bracket[1] : hostPort ? hostPort[1] : authority;
  const port = bracket ? bracket[2] : hostPort ? hostPort[2] : undefined;
  return {
    host: normalizeDnsHost(host),
    port: Number(port || { https: 443, http: 80, tls: 853, quic: 853 }[scheme] || 53),
    scheme,
  };
}

const commonDnsHosts = commonDnsList.map(normalizeDnsHost);
function isPublicDns(dns) {
  const { host, scheme } = parseDnsEndpoint(dns);
  if (scheme === 'system' || host === 'system') return true;
  return commonDnsHosts.some(
    (known) => host === known || (!known.includes(':') && !/^\d/.test(known) && host.endsWith(`.${known}`)),
  );
}

// 国内外 DNS 定义
const chinaDNS = personalConfig.dns.direct;
const foreignDNS = personalConfig.dns.proxy.map((dns) => dnsThroughProxy(dns, '默认代理'));

/**
 * 反向域名树：逐级优先精确标签，再匹配 *，最后匹配 .；+. 同时注册自身和子域。
 */
function createHostsLookup(hosts) {
  const makeNode = () => ({ children: new Map(), value: undefined });
  const root = makeNode();
  const insert = (parts, value) => {
    let node = root;
    for (let index = parts.length - 1; index >= 0; index--) {
      if (!node.children.has(parts[index])) node.children.set(parts[index], makeNode());
      node = node.children.get(parts[index]);
    }
    node.value = value;
  };
  for (const [pattern, value] of Object.entries(hosts)) {
    const values = (Array.isArray(value) ? value : [value]).filter((item) => typeof item === 'string' && item.trim());
    if (!values.length) continue;
    const parts = pattern.toLowerCase().split('.');
    if (parts[0] === '+') {
      insert(parts.slice(1), values);
      parts[0] = '';
    }
    insert(parts, values);
  }
  const search = (node, parts, index) => {
    if (!node) return undefined;
    if (index < 0) return node.value;
    return (
      search(node.children.get(parts[index]), parts, index - 1) ||
      search(node.children.get('*'), parts, index - 1) ||
      node.children.get('')?.value
    );
  };
  return (domain) => {
    const parts = domain.toLowerCase().split('.');
    return search(root, parts, parts.length - 1);
  };
}

/**
 * 判断域名规则（精确/通配）是否匹配节点域名集合，忽略大小写
 */
function matchDomainPattern(pattern, domains) {
  pattern = pattern.toLowerCase();

  // 精确匹配
  if (!pattern.includes('*') && !pattern.startsWith('+.') && !pattern.startsWith('.')) {
    return typeof domains === 'string'
      ? domains.toLowerCase() === pattern
      : [...domains].some((d) => d.toLowerCase() === pattern);
  }

  // 通配匹配：统一转为数组遍历（字符串时直接构建单元素数组，避免 Set 中转）
  const domainList = typeof domains === 'string' ? [domains.toLowerCase()] : [...domains].map((d) => d.toLowerCase());

  // +.example.com
  if (pattern.startsWith('+.')) {
    const suffix = pattern.slice(2);
    return domainList.some((domain) => domain === suffix || domain.endsWith(`.${suffix}`));
  }

  // .example.com
  if (pattern.startsWith('.')) {
    const suffix = pattern.slice(1);
    return domainList.some((domain) => domain !== suffix && domain.endsWith(`.${suffix}`));
  }

  // *.example.com、example.*.com 等
  const patternParts = pattern.split('.');
  return domainList.some((domain) => {
    const domainParts = domain.split('.');
    return (
      patternParts.length === domainParts.length &&
      patternParts.every((part, index) => part === '*' || part === domainParts[index])
    );
  });
}

/**
 * 单地址 hosts 改写为节点 server；多地址保存为节点精确 hosts，由内核按 IP 偏好选择。
 * 地址改写保留 TLS 身份；域名映射循环会报错。
 */
function applyHostsToProxies(proxies, hosts, retainedHosts = {}) {
  if (!hosts || typeof hosts !== 'object' || Array.isArray(hosts)) return proxies;
  const lookup = createHostsLookup(hosts);
  const cache = new Map();
  const resolve = (server) => {
    const key = server.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    const seen = new Set();
    let current = server;
    while (true) {
      const domain = current.toLowerCase();
      if (seen.has(domain)) throw new Error(`hosts 域名映射存在循环：${server}`);
      seen.add(domain);
      const values = lookup(domain);
      if (!values) {
        const result = { server: current };
        cache.set(key, result);
        return result;
      }
      if (values.length > 1) {
        const result = { addresses: [...values] };
        cache.set(key, result);
        return result;
      }
      current = values[0];
    }
  };
  return proxies.map((proxy) => {
    if (typeof proxy.server !== 'string') return proxy;
    const resolved = resolve(proxy.server);
    if (resolved.addresses) {
      retainedHosts[proxy.server] = [...resolved.addresses];
      return proxy;
    }
    if (resolved.server === proxy.server) return proxy;
    // WS、gRPC 等传输及插件可能从 server 派生 Host/authority，交由 hosts 保留原始传输身份。
    if ((proxy.network && proxy.network !== 'tcp') || proxy.plugin) {
      retainedHosts[proxy.server] = resolved.server;
      return proxy;
    }
    const mapped = { ...proxy, server: resolved.server };
    const type = String(proxy.type || '').toLowerCase();
    const usesTls = proxy.tls || ['trojan', 'hysteria', 'hysteria2', 'tuic', 'anytls'].includes(type);
    const field = type === 'vmess' || type === 'vless' ? 'servername' : 'sni';
    if (usesTls && !proxy[field]) mapped[field] = proxy.server;
    return mapped;
  });
}

/**
 * DNS 后缀中的键值参数独立保留；节点 DNS 仅保留 DIRECT，业务 DNS 可引用生成后的策略组。
 */
function stripDnsSuffix(dns, validNames = new Set(), renameMap = new Map()) {
  if (typeof dns !== 'string') return '';
  const str = dns.trim();
  const hashIndex = str.indexOf('#');
  if (hashIndex === -1) return str;
  const suffix = str
    .slice(hashIndex + 1)
    .split('&')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      if (part.includes('=')) return true;
      return part.toLowerCase() === 'direct' || validNames.has(renameMap.get(part) || part);
    })
    .map((part) => (part.includes('=') ? part : renameMap.get(part) || part));
  return str.slice(0, hashIndex) + (suffix.length ? `#${suffix.join('&')}` : '');
}

/**
 * 保存 DNS 策略依赖的规则集；同名规则集使用独立名称与缓存路径。
 */
function createDnsPolicyBuilder(config, finalRuleProviders, validNames, renameMap) {
  const originalProviders = config['rule-providers'] || {};
  const providerNames = new Map();
  const paths = new Set(
    Object.values(finalRuleProviders)
      .map((provider) => provider.path)
      .filter(Boolean),
  );
  const copyProvider = (sourceName) => {
    if (providerNames.has(sourceName)) return providerNames.get(sourceName);
    const original = originalProviders[sourceName];
    const provider = original || finalRuleProviders[sourceName];
    if (!provider || !['domain', 'classical'].includes(provider.behavior)) return null;
    if (!original) return sourceName;
    let name = sourceName === '__proto__' ? `dns-${sourceName}` : sourceName;
    for (let index = 1; Object.prototype.hasOwnProperty.call(finalRuleProviders, name); index++) {
      name = `dns-${sourceName}${index === 1 ? '' : `-${index}`}`;
    }
    const copy = { ...provider };
    if (copy.type === 'http' && (!copy.path || paths.has(copy.path))) {
      const extension = ['mrs', 'text'].includes(copy.format) ? copy.format : 'yaml';
      const stem = `./ruleset/${encodeURIComponent(name)}`;
      copy.path = `${stem}.${extension}`;
      for (let index = 2; paths.has(copy.path); index++) copy.path = `${stem}-${index}.${extension}`;
    }
    if (copy.proxy) {
      const target = renameMap.get(copy.proxy) || copy.proxy;
      if (validNames.has(target)) copy.proxy = target;
      else delete copy.proxy;
    }
    if (copy.path) paths.add(copy.path);
    finalRuleProviders[name] = copy;
    providerNames.set(sourceName, name);
    return name;
  };
  return (policy, nodePolicy = false) => {
    const result = Object.create(null);
    for (const [pattern, dns] of Object.entries(policy)) {
      if (pattern === 'rule-set:cn' && !nodePolicy) continue;
      const values = (Array.isArray(dns) ? dns : [dns])
        .map((value) => stripDnsSuffix(value, nodePolicy ? new Set() : validNames, nodePolicy ? new Map() : renameMap))
        .filter(Boolean);
      if (!values.length) continue;
      let key = pattern;
      if (pattern.startsWith('rule-set:')) {
        const names = pattern
          .slice(9)
          .split(',')
          .map((name) => copyProvider(name.trim()))
          .filter(Boolean);
        if (!names.length) continue;
        key = `rule-set:${[...new Set(names)].join(',')}`;
      }
      result[key] = Array.isArray(dns) ? [...new Set(values)] : values[0];
    }
    return result;
  };
}

/**
 * 构建 DNS 与 hosts：从节点域名 policy 提取服务商私有 DNS，并按 hosts 改写节点 server
 */
function buildDnsAndHostsConfig(
  config,
  filteredProxies,
  finalRuleProviders,
  validNames,
  renameMap,
  serviceDnsPolicies = {},
) {
  const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const originalDnsConfig = isPlainObject(config.dns) ? config.dns : {};
  const originalNameserverPolicy = isPlainObject(originalDnsConfig['nameserver-policy'])
    ? originalDnsConfig['nameserver-policy']
    : {};
  const originalProxyServerNameserverPolicy = isPlainObject(originalDnsConfig['proxy-server-nameserver-policy'])
    ? originalDnsConfig['proxy-server-nameserver-policy']
    : {};

  const proxyServerNameservers = Array.isArray(originalDnsConfig['proxy-server-nameserver'])
    ? originalDnsConfig['proxy-server-nameserver']
    : [];
  const listenValue = originalDnsConfig.listen;
  const listen = typeof listenValue === 'string' && listenValue.trim() ? parseDnsEndpoint(listenValue) : null;
  const isLocalListener = (dns) => {
    if (!listen) return false;
    const endpoint = parseDnsEndpoint(dns);
    if (!['udp', 'tcp'].includes(endpoint.scheme) || endpoint.port !== listen.port) return false;
    return (
      endpoint.host === listen.host ||
      (listen.host === '0.0.0.0' && endpoint.host === '127.0.0.1') ||
      (listen.host === '0:0:0:0:0:0:0:0' && endpoint.host === '0:0:0:0:0:0:0:1')
    );
  };
  const shouldRewriteByHosts = proxyServerNameservers.length === 1 && isLocalListener(proxyServerNameservers[0]);
  const retainedHosts = {};
  const mappedProxies = shouldRewriteByHosts
    ? applyHostsToProxies(filteredProxies, config.hosts, retainedHosts)
    : filteredProxies;

  // 原节点域名（改写前）
  const originalProxyDomains = new Set(
    filteredProxies.filter((proxy) => typeof proxy.server === 'string').map((proxy) => proxy.server.toLowerCase()),
  );

  // 合并改写前/后的节点域名；未执行 hosts 改写时两者一致，直接复用原域名集合避免冗余操作
  const proxyDomains = shouldRewriteByHosts
    ? new Set([
        ...originalProxyDomains,
        ...Object.values(retainedHosts)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((value) => typeof value === 'string')
          .map((value) => value.toLowerCase()),
        ...mappedProxies.filter((proxy) => typeof proxy.server === 'string').map((proxy) => proxy.server.toLowerCase()),
      ])
    : originalProxyDomains;

  const matchesProxyDomain = (pattern) => {
    const normalized = pattern.toLowerCase();
    return !normalized.includes('*') && !normalized.startsWith('+.') && !normalized.startsWith('.')
      ? proxyDomains.has(normalized)
      : matchDomainPattern(normalized, proxyDomains);
  };
  const isCommonDns = (dns) => isPublicDns(dns) || isLocalListener(dns);
  const buildPolicy = createDnsPolicyBuilder(config, finalRuleProviders, validNames, renameMap);
  const nameserverPolicy = buildPolicy(originalNameserverPolicy);

  // 订阅显式提供的节点专用 DNS 可以直接沿用；普通 nameserver 不提升为节点 DNS。
  const explicitProxyDns = proxyServerNameservers
    .map((dns) => stripDnsSuffix(dns))
    .filter((dns) => dns.length > 0 && !isCommonDns(dns));

  // 从 nameserver-policy 与已有节点专用 policy 中提取匹配实际节点域名的服务商私有 DNS。
  const proxyServerPolicy = {};
  for (const [domain, dns] of Object.entries({
    ...originalNameserverPolicy,
    ...originalProxyServerNameserverPolicy,
  })) {
    if (!matchesProxyDomain(domain)) continue;

    const privateValues = (Array.isArray(dns) ? dns : [dns])
      .map((dns) => stripDnsSuffix(dns))
      .filter((value) => value.length > 0 && !isCommonDns(value));
    if (privateValues.length === 0) continue;

    proxyServerPolicy[domain] = Array.isArray(dns) ? privateValues : privateValues[0];
  }

  const explicitRuleSetPolicy = Object.fromEntries(
    Object.entries(originalProxyServerNameserverPolicy)
      .filter(([pattern]) => pattern.startsWith('rule-set:'))
      .map(([pattern, dns]) => [
        pattern,
        (Array.isArray(dns) ? dns : [dns]).filter((value) => typeof value === 'string' && !isCommonDns(value)),
      ]),
  );
  const retainedRuleSetPolicy = buildPolicy(explicitRuleSetPolicy, true);

  const policyDns = Object.values(proxyServerPolicy).flatMap((dns) => (Array.isArray(dns) ? dns : [dns]));
  const privateDNS = [...new Set([...explicitProxyDns, ...policyDns])];
  Object.assign(proxyServerPolicy, retainedRuleSetPolicy);

  // 遍历原配置中的 fake-ip-filter，保留与节点域名匹配的条目
  // 部分机场的节点域名需走真实 IP 解析，避免 fake-ip 导致节点无法连接
  const originalFakeIpFilter = Array.isArray(originalDnsConfig['fake-ip-filter'])
    ? originalDnsConfig['fake-ip-filter']
    : [];
  const proxyFakeIpFilter = originalFakeIpFilter.filter((pattern) => {
    const p = String(pattern);
    return matchesProxyDomain(p);
  });

  const dns = {
    enable: true,
    ipv6: true,
    'use-hosts': true,
    'cache-algorithm': 'arc',
    'use-system-hosts': true,
    'enhanced-mode': 'fake-ip',
    'fake-ip-range': '198.18.0.1/15',
    'fake-ip-range6': '2001:2::1/48',
    'fake-ip-filter': ['rule-set:private', 'rule-set:fakeip_filter', 'rule-set:geolocation-cn', ...proxyFakeIpFilter],
    'proxy-server-nameserver': [...(privateDNS.length > 0 ? privateDNS : chinaDNS)],
    ...(Object.keys(proxyServerPolicy).length > 0 && {
      'proxy-server-nameserver-policy': proxyServerPolicy,
    }),
    'default-nameserver': ['223.5.5.5', '119.29.29.29'],
    nameserver: [...foreignDNS, ...(ruleOptionsEnable.DNS兼容解析 ? personalConfig.dns.compatibility : [])],
    'nameserver-policy': {
      ...nameserverPolicy,
      'rule-set:cn': [...chinaDNS],
      ...serviceDnsPolicies,
    },
    'direct-nameserver': [...chinaDNS],
    'direct-nameserver-follow-policy': ruleOptionsEnable.直连DNS遵循策略,
  };

  const hosts = {
    ...retainedHosts,
    'dns.alidns.com': ['223.5.5.5', '223.6.6.6'],
    'doh.pub': ['1.12.12.12', '120.53.53.53'],
    'dns.cloudflare.com': ['1.1.1.1', '1.0.0.1'],
    'dns.google': ['8.8.8.8', '8.8.4.4'],

    // 解决谷歌商店无法下载的问题
    'services.googleapis.cn': 'services.googleapis.com',

    // 屏蔽哔哩哔哩PCDN，解决访问视频/直播卡顿问题
    '+.mcdn.bilivideo.com': ['0.0.0.0'],
    '+.mcdn.bilivideo.cn': ['0.0.0.0'],
    '+.edge.mountaintoys.cn': ['0.0.0.0'],
    '+.h2.smtcdns.net': ['0.0.0.0'],
  };

  return { dns, hosts, proxies: mappedProxies };
}

function validateProxyGraph(proxies, groups) {
  const builtins = new Set(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE']);
  const graph = new Map();
  for (const item of [...proxies, ...groups]) {
    if (builtins.has(item.name) || graph.has(item.name)) throw new Error(`节点或策略组名称重复：${item.name}`);
    graph.set(item.name, item.proxies || (item['dialer-proxy'] ? [item['dialer-proxy']] : []));
  }
  const visited = new Set();
  const visiting = new Set();
  const visit = (name) => {
    if (builtins.has(name) || visited.has(name)) return;
    if (!graph.has(name)) throw new Error(`节点或策略组引用不存在：${name}`);
    if (visiting.has(name)) throw new Error(`节点或策略组存在循环引用：${name}`);
    visiting.add(name);
    for (const target of graph.get(name)) visit(target);
    visiting.delete(name);
    visited.add(name);
  };
  for (const name of graph.keys()) visit(name);
}

// --- 主入口 ---

/**
 * 主入口：覆写机场订阅配置，生成完整 mihomo 配置
 */
function main(config) {
  const newConfig = {};

  const renameMap = new Map();
  const filteredProxies = filterAndNormalizeProxies(config, renameMap);

  const { customProxies, customProxyNames, customGroup } = buildCustomizeGroups(
    filteredProxies,
    customizeProxies,
    renameMap,
  );

  const generatedRegionGroups = buildRegionGroups(filteredProxies, customProxies);

  const {
    globalGroup,
    functionalGroups,
    functionalRules,
    adblockRules,
    processRules,
    downloadRules,
    serviceDnsPolicies,
    finalRuleProviders,
    chainGroup,
    directGroup,
  } = buildFunctionalGroups(filteredProxies, generatedRegionGroups, { customProxyNames, customProxies, customGroup });

  const validNames = new Set([
    'DIRECT',
    'REJECT',
    'REJECT-DROP',
    'PASS',
    'COMPATIBLE',
    'RULES',
    globalGroup.name,
    ...filteredProxies.map((proxy) => proxy.name),
    ...customProxyNames,
    ...functionalGroups.map((group) => group.name),
    ...generatedRegionGroups.map((group) => group.name),
    directGroup.name,
    ...directProxies.map((proxy) => proxy.name),
    ...(chainGroup ? [chainGroup.name] : []),
  ]);
  const {
    dns,
    hosts,
    proxies: mappedProxies,
  } = buildDnsAndHostsConfig(config, filteredProxies, finalRuleProviders, validNames, renameMap, serviceDnsPolicies);

  newConfig['dns'] = dns;
  newConfig['hosts'] = hosts;
  newConfig['ipv6'] = true;
  newConfig['mode'] = 'rule';
  newConfig['log-level'] = 'info';
  newConfig['bind-address'] = '*';
  newConfig['unified-delay'] = true;
  newConfig['tcp-concurrent'] = true;
  newConfig['keep-alive-interval'] = 60;
  newConfig['find-process-mode'] = 'strict';

  newConfig['profile'] = {
    'store-selected': true,
    'store-fake-ip': true,
  };

  newConfig['ntp'] = {
    enable: true,
    'write-to-system': false,
    server: 'ntp.aliyun.com',
    port: 123,
    interval: 60,
  };

  newConfig['tun'] = {
    enable: true,
    stack: 'system',
    'auto-route': true,
    'strict-route': true,
    'auto-redirect': true,
    'auto-detect-interface': true,
    'dns-hijack': ['any:53', 'tcp://any:53'],
  };

  newConfig['proxies'] = [...customProxies, ...mappedProxies, ...directProxies];
  newConfig['proxy-groups'] = [
    globalGroup,
    ...functionalGroups,
    ...(chainGroup ? [chainGroup] : []),
    directGroup,
    ...generatedRegionGroups,
  ];
  newConfig['rule-providers'] = finalRuleProviders;

  newConfig['rules'] = [
    ...privateNetworkRules,
    ...adblockRules,
    ...processRules,
    ...downloadRules,
    ...prefixRules,
    ...(ruleOptionsEnable.屏蔽国外QUIC ? blockForeignQuic : []),
    ...functionalRules,

    // 兜底规则
    'RULE-SET,geolocation-!cn,默认代理',
    'RULE-SET,cn_ip,直连',
    'RULE-SET,private_ip,直连',
    'MATCH,漏网之鱼',
  ];

  validateProxyGraph(newConfig.proxies, newConfig['proxy-groups']);
  return newConfig;
}
