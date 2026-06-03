# 🍖 牛马厨房 / Office Grub

> 一个 Roguelike + 老虎机（Slot）黑色幽默吃饭游戏。
> 你是被同质化外卖逼疯的牛马打工人，转动「食材老虎机」凑出花式料理喂饱「胃口」——吃腻了就得换花样，撑不过考核周期就 GAME OVER。

玩法受《Luck Be a Landlord》启发，但**所有数值、符号、美术、文案均为原创**（详见 `docs/LEGAL_COMPLIANCE.md`）。

## 技术栈

- **引擎**：PixiJS v8 + TypeScript + Vite
- **平台**：H5（当前可玩）→ 抖音小游戏 / 微信小游戏（M2 接入，架构已预留）
- **美术**：Emoji + 扁平卡通色块，零重资源，包体极小

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（http://localhost:5173/Office-Grub/）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产产物
npm run sync-data # 把 data/*.csv 同步成 src/data/*.json（改完数值表后运行）
```

## 项目结构

```
src/
├── engine/      核心逻辑（平台无关）：游戏状态机 gameState、结算 settle
├── data/        数据驱动：符号 / 配方 / 道具 / 全局配置（symbols/combos/items/config）
├── ui/          PixiJS 渲染层：gameScene、theme
├── platform/    平台抽象层：PlatformBase 接口 + web 实现（抖音/微信 M2 新增）
└── main.ts      启动入口
data/            可编辑数值表（CSV，改完跑 sync-data）
docs/
├── GDD.md                 游戏设计文档（怎么做好玩）
├── LEGAL_COMPLIANCE.md    开发与法律合规文档（怎么做不踩雷）
└── MINIGAME_PORTING.md    小游戏分包 & 适配预备方案
```

## 数据驱动

所有符号能力 / 联动 / 数值都在 `data/*.csv` 里配置，改完运行 `npm run sync-data` 同步进游戏，无需改代码。

## 里程碑

- **M0（当前）**：可玩核心循环（转动→结算→联动→胃口→三选一→GameOver）+ 数据驱动框架 ✅
- **M1**：补满符号 + 平衡调优 + 表现层打磨
- **M2**：抖音/微信小游戏适配层 + 分包 + 分享/侧边栏 + 存档
- **M3**：上线调优 + 留存钩子

## License

MIT
