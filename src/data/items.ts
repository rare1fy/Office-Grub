import type { ItemDef } from './types';

/**
 * 牛马厨房 · 道具表（全局规则修改，对应原作 Items）
 * 道具不进老虎机，是被动 buff，影响全局结算规则。
 */
export const ITEMS: ItemDef[] = [
  { id: 'old_soup', name: '祖传老汤', emoji: '🍲', rarity: 'common', weight: 100, desc: '所有料理(dish)产出 +1' },
  { id: 'beauty_filter', name: '美颜滤镜', emoji: '✨', rarity: 'common', weight: 90, desc: '所有黑暗料理/恶心系免疫差评扣分' },
  { id: 'paid_poop', name: '带薪拉屎', emoji: '🚽', rarity: 'common', weight: 80, desc: '每轮开局必出 1 个屎符号' },
  { id: 'overtime', name: '996福报', emoji: '🕕', rarity: 'uncommon', weight: 70, desc: '所有社畜产出 +2，但每轮 -2 新鲜感' },
  { id: 'tech_recipe', name: '科技狠活配方表', emoji: '📋', rarity: 'uncommon', weight: 60, desc: '地沟油不再拉低好评，且产出翻倍' },
  { id: 'michelin', name: '米其林轮胎人', emoji: '🛞', rarity: 'rare', weight: 40, desc: '所有 rare 料理产出 ×1.5' },
  { id: 'big_data', name: '大数据杀熟', emoji: '📈', rarity: 'rare', weight: 35, desc: '本轮营业额最高的符号额外 ×2' },
  { id: 'central_kitchen', name: '中央厨房', emoji: '🏭', rarity: 'uncommon', weight: 55, desc: '所有合成料理(destroy_combo)产出 +50%' },
  { id: 'fresh_keeper', name: '保鲜冰柜', emoji: '🧊', rarity: 'common', weight: 75, desc: '每轮新鲜感消耗 -1' },
  { id: 'lucky_cat', name: '招财猫', emoji: '🐱', rarity: 'common', weight: 70, desc: '三选一时高稀有度出现概率 +5%' },
];
