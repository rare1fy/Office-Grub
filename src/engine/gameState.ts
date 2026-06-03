import type { Rarity, SymbolDef, ItemDef } from '../data/types';
import { SYMBOLS } from '../data/symbols';
import { ITEMS } from '../data/items';
import { CONFIG, SLOT_COUNT, demandForPeriod } from '../data/config';
import { settle, EMPTY, type Cell, type SettleResult } from './settle';

/** 加权随机：从候选中按 weight 抽一个 */
function weightedPick<T extends { weight: number }>(pool: T[]): T | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1];
}

/** 先抽稀有度，再在该稀有度内按权重抽符号 */
function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = weights.common + weights.uncommon + weights.rare;
  let r = Math.random() * total;
  if ((r -= weights.common) <= 0) return 'common';
  if ((r -= weights.uncommon) <= 0) return 'uncommon';
  return 'rare';
}

/** Fisher–Yates 洗牌（返回新数组，不改原数组） */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type GamePhase = 'choosing' | 'spinning' | 'settled' | 'gameover';

/** 一次营业（拉杆）的完整结果，供 UI 分步播放动画 */
export interface DayResult {
  /** 落定后的格子（含产出，空格 symbolId 为 EMPTY） */
  cells: Cell[];
  result: SettleResult;
  /** 入账前的总胃口 */
  appetiteBefore: number;
  /** 入账后的总胃口 */
  appetiteAfter: number;
  /** 本次拉杆后是否到了需求结算时点 */
  rentDue: boolean;
}

/** 需求结算结果 */
export interface RentResult {
  /** 本次需要交的胃口需求 */
  demand: number;
  /** 是否达标 */
  passed: boolean;
  /** 达标后剩余胃口 */
  remaining: number;
}

/** 游戏全局状态：单一货币「胃口」 */
export class GameState {
  symbolPool: string[] = [];
  counters: Map<string, number> = new Map();
  items: string[] = [];

  period = 1;
  dayInPeriod = 0;
  /** 总胃口（唯一货币，持久累计） */
  appetite = 0;
  phase: GamePhase = 'choosing';
  lastResult: SettleResult | null = null;

  constructor() {
    this.symbolPool = [...CONFIG.startingSymbols];
  }

  /** 当前周期的胃口需求（等价房租） */
  get demand(): number {
    return demandForPeriod(this.period);
  }

  isGameOver(): boolean {
    return this.phase === 'gameover';
  }

  /** 距离下次需求结算还剩几天 */
  get daysUntilRent(): number {
    return CONFIG.daysPerPeriod - this.dayInPeriod;
  }

  /** 当前稀有度权重（随周期推进，rare 权重提升） */
  private currentWeights(): Record<Rarity, number> {
    const w = { ...CONFIG.rarityWeights };
    w.rare += (this.period - 1) * CONFIG.rareWeightGrowthPerPeriod;
    return w;
  }

  /**
   * 老虎机落定：洗牌符号池，取前 SLOT_COUNT 个填入格子，
   * 池中符号不足时剩余格子留空（EMPTY）。复刻原版「牌库逐渐填满」手感。
   */
  spin(): Cell[] {
    const shuffled = shuffle(this.symbolPool);
    const cells: Cell[] = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const id = shuffled[i] ?? EMPTY;
      cells.push({ symbolId: id, output: 0, destroyed: false });
    }
    return cells;
  }

  /** 营业一天：拉杆落定 + 结算 + 胃口入账 + 推进天数 */
  businessDay(): DayResult {
    const appetiteBefore = this.appetite;
    const cells = this.spin();
    const result = settle(cells, this.counters);
    this.lastResult = result;
    this.appetite += result.total;
    this.dayInPeriod += 1;
    this.phase = 'settled';
    return {
      cells,
      result,
      appetiteBefore,
      appetiteAfter: this.appetite,
      rentDue: this.dayInPeriod >= CONFIG.daysPerPeriod,
    };
  }

  /**
   * 需求结算（等价交房租）：总胃口 ≥ 需求则扣除、需求涨价、进入下一周期；
   * 否则游戏结束。这是唯一的失败判定。
   */
  settleRent(): RentResult {
    const demand = this.demand;
    const passed = this.appetite >= demand;
    if (passed) {
      this.appetite -= demand;
      this.period += 1;
      this.dayInPeriod = 0;
      this.phase = 'choosing';
    } else {
      this.phase = 'gameover';
    }
    return { demand, passed, remaining: this.appetite };
  }

  /** 生成三选一候选符号 */
  rollChoices(count = 3): SymbolDef[] {
    const weights = this.currentWeights();
    const choices: SymbolDef[] = [];
    const used = new Set<string>();
    let guard = 0;
    while (choices.length < count && guard++ < 100) {
      const rarity = rollRarity(weights);
      const pool = SYMBOLS.filter((s) => s.rarity === rarity && !used.has(s.id));
      const pick = weightedPick(pool);
      if (pick) {
        used.add(pick.id);
        choices.push(pick);
      }
    }
    return choices;
  }

  /** 加入符号到池 */
  addSymbol(id: string): void {
    this.symbolPool.push(id);
  }

  /** 当前符号池按 id 聚合的数量（用于符号库展示） */
  poolCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const id of this.symbolPool) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  /** 生成道具候选 */
  rollItemChoices(count = 2): ItemDef[] {
    const choices: ItemDef[] = [];
    const used = new Set<string>(this.items);
    let guard = 0;
    while (choices.length < count && guard++ < 50) {
      const pick = weightedPick(ITEMS.filter((it) => !used.has(it.id)));
      if (!pick) break;
      used.add(pick.id);
      choices.push(pick);
    }
    return choices;
  }
}
