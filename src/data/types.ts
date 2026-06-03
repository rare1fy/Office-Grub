/**
 * 牛马厨房 - 核心数据类型定义
 * 所有玩法数值/联动规则均由 data/ 下的配置驱动，便于在 Excel/JSON 中定点修改。
 */

/** 符号稀有度（照搬原作三档结构 + 平衡技能的权重分布） */
export type Rarity = 'common' | 'uncommon' | 'rare';

/** 符号阵营（用于联动分组与美术分色） */
export type Faction =
  | 'food' // 正经食材
  | 'gross' // 抽象/恶心系
  | 'worker' // 社畜/人物系
  | 'cyber' // 赛博/梗系
  | 'dish'; // 料理（合成产物）

/** 联动效果的类型（8 大机制原型，源自原作设计 DNA） */
export type EffectKind =
  | 'adjacency_bonus' // 邻接加成：相邻特定符号时，给自己或对方加产出
  | 'multiply_self' // 自身倍率：满足条件时自身产出 ×N
  | 'spawn' // 繁殖：每隔 N 轮在符号池新增符号
  | 'destroy_combo' // 摧毁合成：消耗相邻符号 → 产出爆分（隆江猪脚饭）
  | 'transform' // 转化升级：满足条件时自身变成另一个符号
  | 'gamble' // 概率：X% 概率爆高分 / 归零
  | 'counter' // 计数成长：每次触发自身永久 +N
  | 'global_rule'; // 全局规则修改（道具）

/** 单条联动规则（可组合，一个符号可挂多条） */
export interface ComboRule {
  /** 规则类型 */
  kind: EffectKind;
  /** 触发所需的相邻符号 id 列表（destroy_combo/adjacency 用）；空表示无条件 */
  needs: string[];
  /** 数值参数：加成值 / 倍率 / 概率(0-1) / 计数步长，含义随 kind 而定 */
  value: number;
  /** 人类可读的梗描述（也用于 UI tooltip） */
  desc: string;
  /** transform/destroy 产出的目标符号 id（可选） */
  target?: string;
}

/** 一个符号的完整定义 */
export interface SymbolDef {
  /** 唯一 id（英文，代码引用用） */
  id: string;
  /** 显示名（中文梗名） */
  name: string;
  /** 显示用 emoji */
  emoji: string;
  /** 阵营 */
  faction: Faction;
  /** 稀有度 */
  rarity: Rarity;
  /** 基础产出（每次结算的基础"营业额/胃口"） */
  base: number;
  /** 三选一抽取权重（同稀有度内的相对概率） */
  weight: number;
  /** 联动规则（可为空数组） */
  combos: ComboRule[];
}

/** 道具定义（全局规则修改，对应原作 Items） */
export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  weight: number;
  desc: string;
}
