import type { SymbolDef } from '../data/types';
import { SYMBOLS } from '../data/symbols';
import { CONFIG } from '../data/config';

/** 符号 id → 定义 的快速查表 */
export const SYMBOL_MAP: Map<string, SymbolDef> = new Map(SYMBOLS.map((s) => [s.id, s]));

/** 网格上的一个格子 */
export interface Cell {
  symbolId: string;
  /** 本轮该格的最终产出（结算后填充） */
  output: number;
  /** 本轮是否被消除（destroy_combo） */
  destroyed: boolean;
}

/** 结算结果 */
export interface SettleResult {
  cells: Cell[];
  /** 本轮总产出 */
  total: number;
  /** 本轮发生的合成（用于动画与回血） */
  spawnedDishes: string[];
}

/** 取 (col,row) 的相邻 8 格索引（用于邻接判定） */
function neighbors(index: number): number[] {
  const { cols, rows } = CONFIG;
  const c = index % cols;
  const r = Math.floor(index / cols);
  const result: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      result.push(nr * cols + nc);
    }
  }
  return result;
}

/** 判断某格相邻是否存在指定 id 的符号 */
function hasNeighbor(cells: Cell[], index: number, ids: string[]): boolean {
  if (ids.length === 0) return false;
  return neighbors(index).some((n) => ids.includes(cells[n].symbolId));
}

/** 统计某格相邻中匹配 ids 的数量 */
function countNeighbor(cells: Cell[], index: number, ids: string[]): number {
  return neighbors(index).filter((n) => ids.includes(cells[n].symbolId)).length;
}

/**
 * 核心结算：遍历所有格子，按其联动规则计算最终产出。
 * counters: 持久计数器（counter 类型符号的永久成长），按符号实例无法追踪，
 * 这里用"符号池层面"的简化：counter 加成累加到一个全局表，按 symbolId 记。
 */
export function settle(cells: Cell[], counters: Map<string, number>): SettleResult {
  // 重置
  cells.forEach((cell) => {
    cell.output = 0;
    cell.destroyed = false;
  });

  const spawnedDishes: string[] = [];
  let globalMultiplier = 1;

  // 第一遍：处理 destroy_combo（合成消除），优先级最高
  cells.forEach((cell, i) => {
    if (cell.destroyed) return;
    const def = SYMBOL_MAP.get(cell.symbolId);
    if (!def) return;
    for (const combo of def.combos) {
      if (combo.kind !== 'destroy_combo') continue;
      // 需要相邻同时存在 needs 里的所有符号
      const allPresent = combo.needs.every((id) => hasNeighbor(cells, i, [id]));
      if (allPresent && combo.target) {
        // 消除自己 + 相邻的 needs 符号
        cell.destroyed = true;
        cell.output = combo.value;
        neighbors(i).forEach((n) => {
          if (combo.needs.includes(cells[n].symbolId)) {
            cells[n].destroyed = true;
          }
        });
        if (!spawnedDishes.includes(combo.target)) spawnedDishes.push(combo.target);
      }
    }
  });

  // 第二遍：基础产出 + 邻接加成 + 计数成长
  cells.forEach((cell, i) => {
    if (cell.destroyed) return;
    const def = SYMBOL_MAP.get(cell.symbolId);
    if (!def) return;

    let out = def.base + (counters.get(cell.symbolId) ?? 0);

    for (const combo of def.combos) {
      switch (combo.kind) {
        case 'adjacency_bonus': {
          if (combo.needs.length === 0) {
            // 给相邻所有格加成（在第三遍统一处理，这里跳过自身）
          } else {
            const cnt = countNeighbor(cells, i, combo.needs);
            out += cnt * combo.value;
          }
          break;
        }
        case 'counter': {
          // 满足 needs（或无需求）时永久成长
          const ok = combo.needs.length === 0 || hasNeighbor(cells, i, combo.needs);
          if (ok) {
            const cur = counters.get(cell.symbolId) ?? 0;
            const add = combo.needs.length === 0 ? combo.value : countNeighbor(cells, i, combo.needs) * combo.value;
            counters.set(cell.symbolId, cur + add);
          }
          break;
        }
        case 'global_rule':
          break;
        default:
          break;
      }
    }
    cell.output = out;
  });

  // 第三遍：处理"给相邻所有格 +value"的群体加成（needs 为空的 adjacency_bonus）
  cells.forEach((cell, i) => {
    if (cell.destroyed) return;
    const def = SYMBOL_MAP.get(cell.symbolId);
    if (!def) return;
    for (const combo of def.combos) {
      if (combo.kind === 'adjacency_bonus' && combo.needs.length === 0 && combo.value !== 0) {
        neighbors(i).forEach((n) => {
          if (!cells[n].destroyed) cells[n].output += combo.value;
        });
      }
    }
  });

  // 第四遍：倍率类（multiply_self / gamble / 全局热搜）
  cells.forEach((cell, i) => {
    if (cell.destroyed) return;
    const def = SYMBOL_MAP.get(cell.symbolId);
    if (!def) return;
    for (const combo of def.combos) {
      if (combo.kind === 'multiply_self') {
        const ok = combo.needs.length === 0 || hasNeighbor(cells, i, combo.needs);
        if (combo.needs.length === 0 && combo.desc.includes('全场')) {
          globalMultiplier *= combo.value; // 上热搜：全场倍率
        } else if (ok) {
          cell.output *= combo.value;
        }
      } else if (combo.kind === 'gamble') {
        if (Math.random() < combo.value) {
          cell.output = cell.output > 0 ? cell.output * 2 : 5;
        }
      }
    }
  });

  // 防止负数产出
  cells.forEach((cell) => {
    if (cell.output < 0) cell.output = 0;
  });

  const total = Math.round(cells.reduce((sum, c) => sum + c.output, 0) * globalMultiplier);
  return { cells, total, spawnedDishes };
}
