/**
 * 牛马厨房 · 全局玩法配置（胃口压力系统 + 经济曲线）
 * 设计 DNA 照搬《幸运房东》房租机制：转一次=营业一天，每 N 天结算胃口需求，指数递增。
 * 所有数值可在此处定点修改。
 */

export interface GameConfig {
  /** 老虎机格子：列 × 行 */
  readonly cols: number;
  readonly rows: number;
  /** 每个"考核周期"包含的营业天数（转动次数） */
  readonly daysPerPeriod: number;
  /** 初始符号池（开局自带的符号 id） */
  readonly startingSymbols: readonly string[];
  /** 三选一抽取的稀有度权重（参考平衡技能 60/25/10 结构，去掉 epic/legendary） */
  readonly rarityWeights: Readonly<Record<'common' | 'uncommon' | 'rare', number>>;
  /** 后期每过一个周期，rare 权重的提升量（让 build 后期更容易成型） */
  readonly rareWeightGrowthPerPeriod: number;
  /** 胃口需求曲线参数：需求 = base * growth^(period-1)，向上取整 */
  readonly demandBase: number;
  readonly demandGrowth: number;
  /** 删除符号的费用（每次递增） */
  readonly removeCostBase: number;
  /** 新鲜感（全局压力条）相关 */
  readonly freshness: {
    /** 初始新鲜感 */
    readonly start: number;
    /** 上限 */
    readonly max: number;
    /** 每营业一天消耗 */
    readonly costPerDay: number;
    /** 首次合成新料理回血 */
    readonly newDishReward: number;
  };
}

export const CONFIG: GameConfig = {
  cols: 5,
  rows: 4,
  daysPerPeriod: 5,
  startingSymbols: ['rice', 'rice', 'egg', 'cattle', 'cattle', 'coffee', 'chili', 'meat'],
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  rareWeightGrowthPerPeriod: 1.5,
  demandBase: 25,
  demandGrowth: 1.55,
  removeCostBase: 5,
  freshness: {
    start: 30,
    max: 50,
    costPerDay: 2,
    newDishReward: 8,
  },
};

/** 计算第 period 个考核周期的胃口需求（period 从 1 开始） */
export function demandForPeriod(period: number): number {
  return Math.ceil(CONFIG.demandBase * Math.pow(CONFIG.demandGrowth, period - 1));
}
