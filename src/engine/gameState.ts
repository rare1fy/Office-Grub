import type { Rarity, SymbolDef, ItemDef } from '../data/types';
import { SYMBOLS } from '../data/symbols';
import { ITEMS } from '../data/items';
import { CONFIG, demandForPeriod } from '../data/config';
import { settle, type Cell, type SettleResult } from './settle';

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

export type GamePhase = 'spinning' | 'choosing' | 'settled' | 'gameover' | 'win';

/** 游戏全局状态 */
export class GameState {
  symbolPool: string[] = [];
  counters: Map<string, number> = new Map();
  items: string[] = [];
  discoveredDishes: Set<string> = new Set();

  period = 1;
  dayInPeriod = 0;
  totalCoins = 0; // 当前周期累计营业额
  freshness: number;
  phase: GamePhase = 'choosing';
  lastResult: SettleResult | null = null;

  constructor() {
    this.symbolPool = [...CONFIG.startingSymbols];
    this.freshness = CONFIG.freshness.start;
  }

  get demand(): number {
    return demandForPeriod(this.period);
  }

  isGameOver(): boolean {
    return this.phase === 'gameover';
  }

  /** 当前稀有度权重（随周期推进，rare 权重提升） */
  private currentWeights(): Record<Rarity, number> {
    const w = { ...CONFIG.rarityWeights };
    w.rare += (this.period - 1) * CONFIG.rareWeightGrowthPerPeriod;
    return w;
  }

  /** 老虎机：从符号池随机填满 5×4 */
  spin(): Cell[] {
    const slots = CONFIG.cols * CONFIG.rows;
    const cells: Cell[] = [];
    for (let i = 0; i < slots; i++) {
      const id = this.symbolPool[Math.floor(Math.random() * this.symbolPool.length)] ?? 'rice';
      cells.push({ symbolId: id, output: 0, destroyed: false });
    }
    return cells;
  }

  /** 营业一天：转动 + 结算 + 推进胃口 */
  businessDay(): { cells: Cell[]; result: SettleResult } {
    const cells = this.spin();
    const result = settle(cells, this.counters);
    this.lastResult = result;
    this.totalCoins += result.total;
    this.dayInPeriod += 1;

    // 新鲜感：消耗 + 新菜回血
    const fresh = CONFIG.freshness;
    this.freshness -= fresh.costPerDay;
    for (const dishId of result.spawnedDishes) {
      if (!this.discoveredDishes.has(dishId)) {
        this.discoveredDishes.add(dishId);
        this.freshness = Math.min(fresh.max, this.freshness + fresh.newDishReward);
      }
    }
    if (this.freshness <= 0) {
      this.phase = 'gameover';
    }
    return { cells, result };
  }

  /** 一个考核周期是否结束 */
  get periodFinished(): boolean {
    return this.dayInPeriod >= CONFIG.daysPerPeriod;
  }

  /** 结算考核：达标进入下一周期，不达标 game over */
  checkPeriod(): boolean {
    const passed = this.totalCoins >= this.demand;
    if (passed) {
      this.period += 1;
      this.dayInPeriod = 0;
      this.totalCoins = 0;
      this.phase = 'choosing';
    } else {
      this.phase = 'gameover';
    }
    return passed;
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
