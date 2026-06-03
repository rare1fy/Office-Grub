# 《牛马厨房》小游戏适配 & 分包预备方案

> 版本：v1.0
> 作用：在 H5 阶段就提前规划抖音/微信小游戏的分包结构与适配抽象，避免 M2 阶段返工。
> 状态：H5 当前可玩；本文件为 M2（小游戏接入）的施工蓝图，部分为"提前预留"。

---

## 1. 设计原则：核心逻辑与平台彻底解耦

游戏代码分两层，从第一行就这么组织：

```
核心逻辑层（平台无关，纯 TS）        平台层（按平台各一份实现）
├─ engine/   游戏状态、结算          ├─ platform/PlatformBase.ts  接口定义
├─ data/     符号/配方/数值          ├─ platform/web.ts           H5 实现（当前）
├─ ui/       PixiJS 渲染            ├─ platform/douyin.ts        抖音实现（M2）
                                    └─ platform/weixin.ts        微信实现（M2）
```

**铁律**：`engine/` `data/` `ui/` 里**禁止**出现任何 `tt.*` / `wx.*` / `window.*`（渲染必需的除外）。所有平台能力（存档、广告、分享、登录、生命周期）只能通过 `Platform` 接口调用。

### Platform 接口（M2 落地，此处先定契约）

```ts
interface Platform {
  // 存档
  save(key: string, value: unknown): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  // 生命周期
  onShow(cb: () => void): void;
  onHide(cb: () => void): void;
  // 分享（小游戏）
  share(opts: { title: string; imageUrl?: string }): void;
  // 广告（可选，商业化阶段）
  showRewardedAd?(): Promise<boolean>;
}
```

- `web.ts`：存档用 `localStorage`，生命周期用 `visibilitychange`，分享用 Web Share API/降级。
- `douyin.ts`：`tt.setStorage` / `tt.onShow` / `tt.onShareAppMessage` / `tt.createRewardedVideoAd`。
- `weixin.ts`：`wx.setStorage` / `wx.onShow` / `wx.onShareAppMessage` / `wx.createRewardedVideoAd`。

---

## 2. 分包结构（提前规划）

本游戏资源极少（Emoji + 纯代码），首包压力小。但仍按小游戏规范预留分包，养成习惯：

```
首包（main，启动必需，目标 ≤ 2MB）
├─ 启动 / Loading 场景
├─ engine 核心逻辑
├─ data/config.json（全局配置，小）
└─ 平台适配层

分包 A（subpackage-data，按需）
├─ data/symbols.json   全量符号表
├─ data/combos.json    全量配方
└─ data/items.json     道具表

分包 B（subpackage-art，上线换图集时用）
└─ Twemoji 图集（若启用，替换系统 emoji）
```

> 由于当前用系统 emoji + JSON 数据极小，实际首包可能根本无需分包。**预留结构**的意义是：当 M1 把符号补到 100 个、若决定接 Twemoji 图集时，目录已就位，改个 loader 即可。

### 数据懒加载约定

- `config.json` 进首包（启动即需）。
- `symbols/combos/items.json` 可在 Loading 阶段异步加载（小游戏用 `tt.loadSubpackage` / `wx.loadSubpackage`，H5 用动态 import）。
- 加载完成前显示 Loading 进度，满足"首屏 3 秒出画面"。

---

## 3. PixiJS 在小游戏环境的适配要点

PixiJS 渲染本身**不依赖 DOM**，渲染到 Canvas（纯 WebGL）。小游戏适配只需补几个全局 Web API 的桩：

| PixiJS 触碰的 API | 小游戏替代 | 由谁补 |
|---|---|---|
| canvas 创建 | `tt.createCanvas()` / `wx.createCanvas()` | 适配层直接传入 |
| `new Image()` | `tt.createImage()` / `wx.createImage()` | adapter |
| `navigator` / `window` / `devicePixelRatio` | 桩对象 | adapter |
| 触摸事件 | `onTouchStart` 等转 pointer | adapter |
| `requestAnimationFrame` | 小游戏内置 | adapter |

- 微信：用官方 `weapp-adapter`。
- 抖音：用字节官方小游戏适配层。
- **不需要模拟整棵 DOM 树**，只补上述全局 API 即可。

### M2 接入步骤（清单）

1. 引入对应平台 adapter（先 import adapter，再 import pixi）。
2. 把 `app.init({ view })` 的 view 改为平台 `createCanvas()` 产物。
3. 把 `window.innerWidth/Height` 改为 `getSystemInfoSync()` 的屏幕尺寸（已封装到 Platform）。
4. 实现 `douyin.ts` / `weixin.ts` 的 Platform 接口。
5. 接入侧边栏 / onShow / onHide / 分享。
6. 配置分包，用平台构建工具导出，开发者工具上传审核。

---

## 4. 提前避坑清单

- ✅ 渲染分辨率：`resolution` 用 `Math.min(dpr, 2)`，小游戏高 DPR 设备别无限拉高，省内存。
- ✅ 字体：emoji 走系统字体，中文走系统字体，**不内嵌字体文件**（省包体 + 避免字体授权问题）。
- ✅ 禁止 `setInterval` 漏清；所有定时器/ticker 回调在场景销毁时移除（已在 popText 等处用 `app.ticker.remove`）。
- ✅ 不用多线程 Worker（小游戏环境限制多）。
- ✅ 网络请求（若有）必须 https/wss，域名提前在平台后台登记白名单。
- ✅ 所有 `tt.*`/`wx.*` 异步 API 不在初始化阶段同步阻塞等待。

---

## 5. 当前进度对照

| 项 | 状态 |
|---|---|
| 核心逻辑/数据/渲染解耦 | ✅ engine/data/ui 已分离，无平台 API 污染 |
| Platform 接口 | ⏳ M2 落地（本文件已定契约） |
| 分包结构 | ⏳ 预留（数据 JSON 已独立成文件，可直接懒加载） |
| 抖音/微信 adapter | ⏳ M2 |
| emoji 系统字体方案 | ✅ 当前即用，零包体 |

> H5 阶段先把游戏做好玩；本文件保证 M2 接小游戏时"按图施工"，不推倒重来。
