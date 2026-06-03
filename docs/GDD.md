# 《牛马厨房 / Office Grub》游戏设计文档（GDD）

> 版本：v1.0
> 类型：Roguelike + 老虎机（Slot）构筑
> 平台：H5（当前可玩） / 抖音小游戏 / 微信小游戏（M2 接入）
> 引擎：PixiJS v8 + TypeScript + Vite。小游戏环境下 PixiJS 自动退回 WebGL（小游戏不支持 WebGPU），渲染可用。
> 屏幕：竖屏，开发分辨率 720 × 1280
> 美术：羊了个羊式扁平卡通色块 + Emoji 符号

---

## 0. 一句话定位

你是一个被同质化外卖逼疯的牛马打工人，靠转动「食材老虎机」凑出花式料理喂饱自己的「胃口」。
吃来吃去都是那几样会让你**腻**（胃口需求递增），唯有不断解锁、合成更离谱的新菜才能活下去。
撑不过考核周期 → 餐馆倒闭 / 你被吃腻的生活击垮 → GAME OVER。

---

## 1. 核心循环（Core Loop）

```
转动老虎机（= 营业一天，消耗体力/直接推进天数）
   ↓
5×4 共 20 格落入符号（从玩家符号池随机抽取）
   ↓
结算：逐格计算产出 → 检测相邻联动（合成 / 协同 / 消除）
   ↓
累加本日「营业额（钱）」
   ↓
每营业 N 天 = 一个考核周期 → 结算「胃口需求」
   ├─ 达标：进入三选一（加符号 / 加道具 / 删符号）→ 继续
   └─ 不达标：GAME OVER（被吃腻的生活打倒）
```

- **转盘一次 = 营业一天**：完美复刻原作「转一次 = 交一次房租倒计时推进」。
- **胃口需求**：等价于原作「房租」，指数递增，是唯一压力源。
- **三选一构筑**：等价于原作三选一，符号**永久**进入符号池（核心：产出恒定，可滚雪球）。
- **新鲜感**：作为「全局加分/回血修正」而非「单符号产出衰减」，详见第 4 章——既承载主题，又不破坏滚雪球手感。

---

## 2. 与《幸运房东》的映射关系（设计 DNA 对照）

| 幸运房东 | 牛马厨房 | 说明 |
|---|---|---|
| 转动老虎机 | 营业一天（转一次） | 同 |
| 房租（递增付费墙） | 胃口需求（递增） | 指数曲线照搬 |
| 房租倒计时（每 N 转结算） | 考核周期（每 N 天结算） | 同 |
| 符号池（永久、可删） | 菜谱池（永久、可删） | 同 |
| 符号产出恒定 | 符号产出恒定 | **关键：不做单符号衰减** |
| 三选一加符号 | 三选一加菜谱 | 同 |
| Common/Uncommon/Rare | 打工人级/小有名气级/网红爆款级 | 三档稀有度 |
| Items（全局规则修改） | 厨具/作弊道具 | 同 |
| 删除符号 | 删除菜谱（花钱） | 同 |
| 符号协同（邻接/繁殖/转化/吞噬） | 同 + 消除（隆江猪脚饭） | 8 大机制原型 |

---

## 3. 数值骨架

### 3.1 老虎机

- 网格：5 列 × 4 行 = 20 格。
- 每次转动从「符号池」无放回随机抽 20 个填满（池不足 20 时允许重复，照搬原作）。
- 初始符号池：5~6 个基础符号（见数值表 starter）。

### 3.2 胃口需求曲线（付费墙，指数递增）

```
胃口需求(周期 n) = ceil( BASE × GROWTH^(n-1) , 取整到"好看"刻度 )
BASE   = 25
GROWTH = 1.55
```

| 周期 | 原始值 | 取整展示值 |
|---|---|---|
| 1 | 25 | 25 |
| 2 | 38.75 | 40 |
| 3 | 60.0 | 60 |
| 4 | 93.1 | 95 |
| 5 | 144.3 | 150 |
| 6 | 223.7 | 225 |
| 7 | 346.7 | 350 |
| 8 | 537.4 | 540 |
| 9 | 833.0 | 850 |
| 10 | 1291 | 1300 |

> 全部写入 `data/appetite.csv`，可在 Excel 直接改 BASE / GROWTH / 每周期覆盖值。

### 3.3 考核节奏

- 每个考核周期 = 5 个营业日（转 5 次）。
- 周期内每天产出累加到「本期营业额」。
- 第 5 天结束时与「胃口需求」比较，达标进入三选一。
- 后期周期天数可配置（如 boss 周期缩短为 3 天）。

### 3.4 稀有度与三选一权重

| 稀有度 | 名称 | 三选一基础权重 |
|---|---|---|
| common | 打工人级 | 70 |
| uncommon | 小有名气级 | 25 |
| rare | 网红爆款级 | 5 |

> 权重写入 `data/config.json`，可调。后期周期可提升高稀有度权重。

---

## 4. 新鲜感系统（主题核心，不破坏滚雪球）

**设计原则**：符号产出永远恒定（学原作），新鲜感是一条**全局状态条**，承载「吃腻」主题。

- **freshness**：全局新鲜感，0~100，初始 100。
- 每营业一天，freshness **固定下降**（baseDecay，默认 6/天）。
- 当日产出的「钱」 = Σ符号产出 × 新鲜感系数（freshnessMult）。
  - `freshnessMult = 0.5 + 0.5 × (freshness / 100)`（满鲜 1.0×，0 鲜 0.5×，不归零、不阉割滚雪球，只是打折）。
- **回血**：本局**首次**合成某道料理 → freshness 回升（按料理稀有度：common +8 / uncommon +15 / rare +30）。重复合成不回血但也不扣。
- **猎奇加成**：标记为 `weird=true` 的料理（九转大肠、分不清等）回血翻倍，强化整活导向。
- freshness 触底（=0）不直接死，只是产出打 5 折；真正的失败仍是「胃口需求不达标」。

> 全部参数（baseDecay、系数公式参数、各稀有度回血量）写入 `data/config.json`。

---

## 5. 8 大机制原型（符号设计的乐高积木）

所有 100 个符号都由这 8 种 `effect.type` 组合而成，便于配置化与平衡：

| type | 含义 | 参数示例 |
|---|---|---|
| `flat` | 固定产出 N | `{value: 1}` |
| `adjacent` | 相邻特定标签符号时，自身或对方 +N | `{tags:["food"], bonus:2, target:"self"}` |
| `breed` | 每 N 天生成一个新符号到池 | `{spawn:"cockroach", everyDays:5}` |
| `destroy` | 消耗相邻符号，自身产出×M 或转化 | `{consumeTags:["intestine"], mult:5}` |
| `transform` | 满足相邻条件 → 自身变成另一符号 | `{requires:["pig_trotter","rice"], into:"longjiang"}` |
| `gamble` | P 概率爆 N，否则 0/负 | `{chance:0.1, jackpot:30, fail:0}` |
| `counter` | 每次触发自身永久 +N（成长） | `{growth:1}` |
| `globalRule` | （道具专用）修改全局规则 | `{rule:"weird_immune_review"}` |

> 字段定义见第 7 章数据结构，符号表见 `data/symbols.csv`。

---

## 6. 符号阵营与命名体系

| 阵营 tag | 中文 | 定位 |
|---|---|---|
| `food` | 正经食材 | 基础产出 / 联动燃料 |
| `gross` | 抽象恶心系 | 高风险高回报 / 黑色幽默 |
| `worker` | 社畜人物系 | 行为效果 / 跨界联动 |
| `cyber` | 赛博梗系 | 改规则 / buff / 整活 |
| `dish` | 料理（合成产物） | 高产出爆点 |
| `myth` | 玄学系 | 概率 / 功德 / 水逆 |

完整 100 符号 + 配方 + 道具见 `docs/SYMBOLS.md` 与 `data/*.csv`。

---

## 7. 数据结构（可配置契约）

### 7.1 符号 Symbol（`data/symbols.csv` → `symbols.json`）

```ts
interface Symbol {
  id: string;          // 唯一 id，英文蛇形
  name: string;        // 中文名
  emoji: string;       // 显示用 emoji（可多个拼接）
  rarity: 'common' | 'uncommon' | 'rare';
  tags: string[];      // 阵营 + 功能标签，逗号分隔
  baseValue: number;   // 基础产出
  effectType: string;  // 8 大原型之一，空=纯 flat
  effectParams: object;// JSON 字符串，原型参数
  weird: boolean;      // 是否猎奇（影响新鲜感回血）
  desc: string;        // 文案/梗
}
```

### 7.2 配方 Combo（`data/combos.csv` → `combos.json`）

```ts
interface Combo {
  id: string;
  name: string;          // 料理名
  emoji: string;
  rarity: string;
  kind: 'merge' | 'eliminate' | 'synergy'; // 合成/消除/协同
  inputs: string[];      // 需要相邻的符号 id（逗号分隔）
  adjacency: 'orthogonal' | 'any'; // 相邻判定（四方向/八方向）
  output?: string;       // merge/transform 产物符号 id
  payout: number;        // 直接结算的钱
  freshGain: number;     // 触发回新鲜感
  weird: boolean;
  desc: string;
}
```

### 7.3 道具 Item（`data/items.csv` → `items.json`）

```ts
interface Item {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  rule: string;          // globalRule 规则 key
  params: object;
  desc: string;
}
```

### 7.4 全局配置（`data/config.json`）

```jsonc
{
  "grid": { "cols": 5, "rows": 4 },
  "appetite": { "base": 25, "growth": 1.55 },
  "period": { "daysPerPeriod": 5 },
  "freshness": {
    "start": 100, "max": 100, "baseDecay": 6,
    "multBase": 0.5, "multRange": 0.5,
    "gainCommon": 8, "gainUncommon": 15, "gainRare": 30,
    "weirdMultiplier": 2
  },
  "draftWeights": { "common": 70, "uncommon": 25, "rare": 5 },
  "starterPool": ["rice","egg","worker","chili","coffee"],
  "removeCost": 20
}
```

> **可组合配置原则**：联动 = combos.csv 里一行；符号能力 = symbols.csv 里 effectType+effectParams；
> 你在 Excel 改任意一行/格，运行 `npm run sync-data` 即同步进游戏，无需改代码。

---

## 8. 美术与表现（羊了个羊 + Emoji）

- **整体**：扁平、高饱和、圆角卡片、厚描边、轻投影。参考"羊了个羊"的清新麻将块质感。
- **符号**：每个符号 = 一张圆角色块卡片（按阵营配底色）+ 居中大 Emoji + 底部中文小字。
- **阵营配色**：food 黄绿 / gross 褐绿 / worker 蓝灰 / cyber 紫 / dish 橙红 / myth 金。
- **Emoji 渲染**：用系统 emoji（MVP）；上线可换 Twemoji 图集统一多端样式。
- **反馈**：转动有节奏停格；合成/消除有放大+粒子+飘字；周期结算有"老板验收"演出。

---

## 9. UI 布局（720 × 1280 竖屏）

```
┌─────────────────────────┐ 0
│  顶栏：💰营业额 / 🎯胃口需求 / 📅天数  │  ~120px
├─────────────────────────┤
│   新鲜感条 freshness  ▓▓▓▓░░  │  ~60px
├─────────────────────────┤
│                         │
│      5 × 4 老虎机网格      │  ~720px
│      （格子 ~128px）       │
│                         │
├─────────────────────────┤
│  飘字 / 结算演出区          │  ~160px
├─────────────────────────┤
│      [ 营业（转动） ]       │  ~200px
│   符号池数量 / 删除 / 道具    │
└─────────────────────────┘ 1280
```

---

## 10. 里程碑

- **M0（本次）**：工程骨架 + 数据驱动框架 + 可玩核心循环（转动→结算→联动→胃口→三选一→GameOver）+ 一批可配置数据。
- **M1**：补满 100 符号 + 全部联动平衡；表现层打磨（粒子/演出）。
- **M2**：抖音/微信小游戏适配层 + 分享/侧边栏；存档。
- **M3**：上线调优、留存钩子（神级 combo 分享动画）。

---

## 11. 合规备注

- 不直接抄原作精确数值表与文案；本作数值/符号/文案全为原创结构化设计。
- 恶心系符号走 Q 版 emoji，不写实；不点名真实品牌/食安事件；不做博彩/开箱诱导（gamble 符号为玩法机制，无真实货币）。
