/**
 * 牛马厨房 · 全局玩法配置（单一货币：胃口）
 *
 * 照搬《幸运房东》核心循环：
 * - 拉一次杆 = 营业一天，产出「胃口」累加进总胃口。
 * - 每营业 daysPerPeriod 天 = 一次需求结算（等价房租）：总胃口 ≥ 需求则扣除继续，否则游戏结束。
 * - 需求指数递增，构成唯一压力来源。
 * - 符号池 < 格子数时，多余格子留空（开局只有 5 个白米饭，大量空格）。
 *
 * 全部数值可在此处定点修改。
 */
export interface GameConfig {
  /** 老虎机格子：列 × 行 */
  readonly cols: number;
  readonly rows: number;
  /** 每个结算周期的营业天数（拉杆次数） */
  readonly daysPerPeriod: number;
  /** 开局初始符号池（5 个白米饭，基础胃口各 +1，对应原版开局 5 枚硬币） */
  readonly startingSymbols: readonly string[];
  /** 三选一抽取的稀有度权重 */
  readonly rarityWeights: Readonly<Record<'common' | 'uncommon' | 'rare', number>>;
  /** 每过一个周期 rare 权重的提升量（让 build 后期更易成型） */
  readonly rareWeightGrowthPerPeriod: number;
  /** 胃口需求曲线：需求 = demandBase * demandGrowth^(period-1)，向上取整 */
  readonly demandBase: number;
  readonly demandGrowth: number;
  /** 删除符号的费用 */
  readonly removeCostBase: number;
}

export const CONFIG: GameConfig = {
  cols: 5,
  rows: 4,
  daysPerPeriod: 5,
  startingSymbols: ['rice', 'rice', 'rice', 'rice', 'rice'],
  rarityWeights: { common: 60, uncommon: 30, rare: 10 },
  rareWeightGrowthPerPeriod: 1.5,
  demandBase: 25,
  demandGrowth: 1.55,
  removeCostBase: 5,
};

/** 格子总数 */
export const SLOT_COUNT = CONFIG.cols * CONFIG.rows;

/** 计算第 period 个周期的胃口需求（period 从 1 开始） */
export function demandForPeriod(period: number): number {
  return Math.ceil(CONFIG.demandBase * Math.pow(CONFIG.demandGrowth, period - 1));
}
