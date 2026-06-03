import type { SymbolDef } from './types';

/**
 * 牛马厨房 · 100 符号配置表
 * 设计 DNA 照搬《幸运房东》：3 档稀有度 + 8 机制原型 + 邻接协同滚雪球。
 * 所有数值均为牛马厨房原创，可在此处或导出的 CSV 中定点修改。
 *
 * 数值约定：
 * - base：基础产出（胃口点数）
 * - weight：同稀有度内三选一相对权重
 * - combo.value：含义随 kind 变化（加成/倍率/概率/步长）
 *
 * 稀有度产出基准（参考平衡技能 1.0 / 1.3 / 1.7 倍）：
 * - common 基础 1~3
 * - uncommon 基础 3~6
 * - rare 基础 6~12
 */
export const SYMBOLS: SymbolDef[] = [
  // ============ 阵营一：正经食材 food（联动燃料，30 个） ============
  // -- common --
  { id: 'rice', name: '白米饭', emoji: '🍚', faction: 'food', rarity: 'common', base: 1, weight: 100, combos: [] },
  { id: 'egg', name: '鸡蛋', emoji: '🥚', faction: 'food', rarity: 'common', base: 1, weight: 90, combos: [{ kind: 'adjacency_bonus', needs: ['tomato'], value: 3, desc: '番茄炒蛋，永远的神：相邻番茄+3' }] },
  { id: 'tomato', name: '番茄', emoji: '🍅', faction: 'food', rarity: 'common', base: 1, weight: 90, combos: [{ kind: 'adjacency_bonus', needs: ['egg'], value: 3, desc: '番茄炒蛋：相邻鸡蛋+3' }] },
  { id: 'chili', name: '辣椒', emoji: '🌶️', faction: 'food', rarity: 'common', base: 1, weight: 85, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '够味儿：让相邻所有食材+1' }] },
  { id: 'meat', name: '五花肉', emoji: '🥩', faction: 'food', rarity: 'common', base: 2, weight: 80, combos: [] },
  { id: 'pig_feet', name: '猪蹄', emoji: '🦴', faction: 'food', rarity: 'common', base: 2, weight: 70, combos: [{ kind: 'destroy_combo', needs: ['cattle', 'rice'], value: 30, desc: '隆江猪脚饭：牛马+白米饭一起消除，爆30+回新鲜感', target: 'longjiang' }] },
  { id: 'cabbage', name: '大白菜', emoji: '🥬', faction: 'food', rarity: 'common', base: 1, weight: 90, combos: [{ kind: 'adjacency_bonus', needs: ['poop'], value: 0, desc: '化腐朽为神奇：相邻屎可合成九转大肠', target: 'jiuzhuan' }] },
  { id: 'noodle', name: '面条', emoji: '🍜', faction: 'food', rarity: 'common', base: 2, weight: 80, combos: [] },
  { id: 'bread', name: '面包', emoji: '🍞', faction: 'food', rarity: 'common', base: 1, weight: 85, combos: [] },
  { id: 'corn', name: '玉米', emoji: '🌽', faction: 'food', rarity: 'common', base: 1, weight: 85, combos: [] },
  { id: 'potato', name: '土豆', emoji: '🥔', faction: 'food', rarity: 'common', base: 1, weight: 90, combos: [] },
  { id: 'carrot', name: '胡萝卜', emoji: '🥕', faction: 'food', rarity: 'common', base: 1, weight: 80, combos: [{ kind: 'adjacency_bonus', needs: ['potato'], value: 2, desc: '乱炖：相邻土豆+2' }] },
  { id: 'mushroom', name: '蘑菇', emoji: '🍄', faction: 'food', rarity: 'common', base: 2, weight: 60, combos: [{ kind: 'gamble', needs: [], value: 0.15, desc: '不明蘑菇：15%概率致幻翻倍，否则正常' }] },
  { id: 'shrimp', name: '虾', emoji: '🦐', faction: 'food', rarity: 'common', base: 2, weight: 70, combos: [] },
  { id: 'fish', name: '鱼', emoji: '🐟', faction: 'food', rarity: 'common', base: 2, weight: 70, combos: [] },
  { id: 'garlic', name: '大蒜', emoji: '🧄', faction: 'food', rarity: 'common', base: 1, weight: 75, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '提味：相邻荤菜+1' }] },
  { id: 'onion', name: '洋葱', emoji: '🧅', faction: 'food', rarity: 'common', base: 1, weight: 75, combos: [] },
  { id: 'cheese', name: '芝士', emoji: '🧀', faction: 'food', rarity: 'common', base: 2, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['bread'], value: 3, desc: '芝士面包：相邻面包+3' }] },
  // -- uncommon --
  { id: 'chicken', name: '炸鸡', emoji: '🍗', faction: 'food', rarity: 'uncommon', base: 4, weight: 80, combos: [] },
  { id: 'sushi', name: '寿司', emoji: '🍣', faction: 'food', rarity: 'uncommon', base: 4, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['fish', 'rice'], value: 4, desc: '现握寿司：相邻鱼或饭+4' }] },
  { id: 'hotpot', name: '火锅', emoji: '🍲', faction: 'food', rarity: 'uncommon', base: 3, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: [], value: 2, desc: '一锅乱炖：相邻所有食材+2' }] },
  { id: 'dumpling', name: '饺子', emoji: '🥟', faction: 'food', rarity: 'uncommon', base: 4, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['meat', 'cabbage'], value: 3, desc: '猪肉白菜馅：相邻肉/白菜+3' }] },
  { id: 'crab', name: '螃蟹', emoji: '🦀', faction: 'food', rarity: 'uncommon', base: 5, weight: 50, combos: [] },
  { id: 'taco', name: '塔可', emoji: '🌮', faction: 'food', rarity: 'uncommon', base: 4, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['chili'], value: 4, desc: '魔鬼塔可：相邻辣椒+4' }] },
  { id: 'icecream', name: '冰淇淋', emoji: '🍦', faction: 'food', rarity: 'uncommon', base: 3, weight: 55, combos: [{ kind: 'counter', needs: [], value: 1, desc: '续杯：每次结算自身永久+1' }] },
  { id: 'cake', name: '蛋糕', emoji: '🍰', faction: 'food', rarity: 'uncommon', base: 5, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: ['egg'], value: 2, desc: '现烤：相邻鸡蛋+2' }] },
  { id: 'honey', name: '蜂蜜', emoji: '🍯', faction: 'food', rarity: 'uncommon', base: 3, weight: 45, combos: [{ kind: 'adjacency_bonus', needs: [], value: 2, desc: '甜蜜暴击：相邻甜点+2' }] },
  // -- rare --
  { id: 'lobster', name: '波士顿龙虾', emoji: '🦞', faction: 'food', rarity: 'rare', base: 8, weight: 50, combos: [] },
  { id: 'caviar', name: '鱼子酱', emoji: '🥂', faction: 'food', rarity: 'rare', base: 7, weight: 40, combos: [{ kind: 'adjacency_bonus', needs: [], value: 3, desc: '高端食材：相邻所有食材+3' }] },
  { id: 'wagyu', name: '和牛', emoji: '🥓', faction: 'food', rarity: 'rare', base: 10, weight: 35, combos: [{ kind: 'adjacency_bonus', needs: ['chili', 'garlic'], value: 5, desc: '黑椒和牛粒：相邻辣椒/蒜+5' }] },

  // ============ 阵营二：抽象/恶心系 gross（高风险高回报，20 个） ============
  // -- common --
  { id: 'poop', name: '屎', emoji: '💩', faction: 'gross', rarity: 'common', base: 0, weight: 70, combos: [{ kind: 'destroy_combo', needs: ['cabbage'], value: 25, desc: '九转大肠：吞掉相邻大白菜，化腐朽为神奇爆25', target: 'jiuzhuan' }] },
  { id: 'roach', name: '蟑螂', emoji: '🪳', faction: 'gross', rarity: 'common', base: 1, weight: 60, combos: [{ kind: 'spawn', needs: [], value: 4, desc: '小强生命力：每4轮在符号池繁殖1只' }] },
  { id: 'fly', name: '苍蝇', emoji: '🪰', faction: 'gross', rarity: 'common', base: 0, weight: 65, combos: [{ kind: 'adjacency_bonus', needs: ['poop'], value: 3, desc: '逐臭之夫：相邻屎+3' }] },
  { id: 'gutter_oil', name: '地沟油', emoji: '🛢️', faction: 'gross', rarity: 'common', base: 1, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: [], value: 2, desc: '科技与狠活：相邻食材产出+2（但拉低好评）' }] },
  { id: 'expired', name: '过期食材', emoji: '🥫', faction: 'gross', rarity: 'common', base: 1, weight: 60, combos: [{ kind: 'gamble', needs: [], value: 0.2, desc: '赌一把：20%食物中毒归零，否则×2' }] },
  { id: 'mold', name: '霉菌', emoji: '🦠', faction: 'gross', rarity: 'common', base: 1, weight: 50, combos: [{ kind: 'transform', needs: ['bread'], value: 0, desc: '青霉素？相邻面包时进化成蓝纹奶酪', target: 'bluecheese' }] },
  { id: 'spit', name: '口水', emoji: '💧', faction: 'gross', rarity: 'common', base: 1, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '厨师の馈赠：相邻料理+1' }] },
  // -- uncommon --
  { id: 'durian', name: '榴莲', emoji: '🟢', faction: 'gross', rarity: 'uncommon', base: 5, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: [], value: -1, desc: '臭名远扬：自身+5但相邻-1' }] },
  { id: 'stinky_tofu', name: '臭豆腐', emoji: '🟫', faction: 'gross', rarity: 'uncommon', base: 6, weight: 45, combos: [{ kind: 'multiply_self', needs: ['roach', 'fly'], value: 2, desc: '闻着臭吃着香：相邻虫子时×2' }] },
  { id: 'bluecheese', name: '蓝纹奶酪', emoji: '🧫', faction: 'gross', rarity: 'uncommon', base: 5, weight: 40, combos: [{ kind: 'counter', needs: [], value: 1, desc: '越霉越香：每轮永久+1' }] },
  { id: 'balut', name: '毛蛋', emoji: '🥚', faction: 'gross', rarity: 'uncommon', base: 4, weight: 45, combos: [{ kind: 'transform', needs: [], value: 6, desc: '修罗场：每5轮孵化成炸鸡', target: 'chicken' }] },
  // -- rare --
  { id: 'mystery_meat', name: '不明肉块', emoji: '🍖', faction: 'gross', rarity: 'rare', base: 6, weight: 45, combos: [{ kind: 'gamble', needs: [], value: 0.5, desc: '俄罗斯轮盘：50%概率×3，50%归零' }] },
  { id: 'devil_dish', name: '黑暗料理', emoji: '☠️', faction: 'gross', rarity: 'rare', base: 8, weight: 35, combos: [{ kind: 'multiply_self', needs: ['influencer'], value: 4, desc: '丑得很出片：相邻网红时×4', target: '' }] },

  // ============ 阵营三：社畜/人物系 worker（提供"行为"，25 个） ============
  // -- common --
  { id: 'cattle', name: '牛马', emoji: '🐂', faction: 'worker', rarity: 'common', base: 1, weight: 100, combos: [{ kind: 'destroy_combo', needs: ['pig_feet', 'rice'], value: 30, desc: '牛马的命是隆江猪脚饭给的：三者消除爆30', target: 'longjiang' }] },
  { id: 'intern', name: '实习生', emoji: '🧑‍🎓', faction: 'worker', rarity: 'common', base: 1, weight: 80, combos: [{ kind: 'adjacency_bonus', needs: ['boss'], value: 2, desc: '被压榨：相邻老板时+2（老板高兴）' }] },
  { id: 'courier', name: '外卖员', emoji: '🛵', faction: 'worker', rarity: 'common', base: 1, weight: 75, combos: [{ kind: 'adjacency_bonus', needs: [], value: 0, desc: '跑腿经济：把相邻料理送出去，该料理产出+50%', target: '' }] },
  { id: 'security', name: '保安', emoji: '💂', faction: 'worker', rarity: 'common', base: 1, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['roach', 'fly'], value: 2, desc: '查卫生：每消灭一只虫子+2' }] },
  { id: 'cleaner', name: '保洁阿姨', emoji: '🧹', faction: 'worker', rarity: 'common', base: 1, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['poop', 'gutter_oil'], value: 3, desc: '一尘不染：清理相邻脏东西各+3' }] },
  { id: 'driver', name: '网约车司机', emoji: '🚗', faction: 'worker', rarity: 'common', base: 1, weight: 65, combos: [{ kind: 'counter', needs: [], value: 1, desc: '多接单：每轮永久+1' }] },
  { id: 'streamer_s', name: '小主播', emoji: '🎤', faction: 'worker', rarity: 'common', base: 2, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '探店：相邻料理+1' }] },
  // -- uncommon --
  { id: 'boss', name: '老板', emoji: '👔', faction: 'worker', rarity: 'uncommon', base: 3, weight: 70, combos: [{ kind: 'counter', needs: ['intern', 'cattle'], value: 2, desc: '压榨剩余价值：每个相邻社畜让老板永久+2' }] },
  { id: 'hr', name: 'HR', emoji: '💼', faction: 'worker', rarity: 'uncommon', base: 3, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: ['intern'], value: 4, desc: '画饼：相邻实习生+4' }] },
  { id: 'programmer', name: '程序员', emoji: '🧑‍💻', faction: 'worker', rarity: 'uncommon', base: 4, weight: 60, combos: [{ kind: 'multiply_self', needs: ['coffee'], value: 2, desc: '咖啡续命：相邻咖啡时×2' }] },
  { id: 'guru', name: '成功学大师', emoji: '🧘', faction: 'worker', rarity: 'uncommon', base: 3, weight: 45, combos: [{ kind: 'adjacency_bonus', needs: [], value: 2, desc: '正能量：相邻所有人物+2' }] },
  { id: 'rich2', name: '富二代', emoji: '🤵', faction: 'worker', rarity: 'uncommon', base: 6, weight: 40, combos: [{ kind: 'adjacency_bonus', needs: ['lobster', 'caviar', 'wagyu'], value: 5, desc: '不差钱：相邻高端食材+5' }] },
  // -- rare --
  { id: 'influencer', name: '网红', emoji: '🌟', faction: 'worker', rarity: 'rare', base: 5, weight: 50, combos: [{ kind: 'multiply_self', needs: ['devil_dish', 'jiuzhuan'], value: 3, desc: '黑红也是红：相邻黑暗料理时×3' }] },
  { id: 'capitalist', name: '资本家', emoji: '🎩', faction: 'worker', rarity: 'rare', base: 6, weight: 35, combos: [{ kind: 'counter', needs: [], value: 2, desc: '钱生钱：每轮永久+2' }] },

  // ============ 阵营四：赛博/梗系 cyber（改规则/整活，13 个） ============
  // -- common --
  { id: 'coffee', name: '咖啡', emoji: '☕', faction: 'cyber', rarity: 'common', base: 1, weight: 80, combos: [{ kind: 'adjacency_bonus', needs: ['cattle', 'programmer'], value: 2, desc: '续命神器：相邻社畜+2' }] },
  { id: 'like', name: '点赞', emoji: '👍', faction: 'cyber', rarity: 'common', base: 1, weight: 75, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '好评如潮：相邻料理+1' }] },
  { id: 'dislike', name: '差评', emoji: '👎', faction: 'cyber', rarity: 'common', base: 0, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: [], value: -2, desc: '一星差评：相邻料理-2（除非旁边有网红公关）' }] },
  { id: 'qrcode', name: '二维码', emoji: '🔳', faction: 'cyber', rarity: 'common', base: 1, weight: 60, combos: [{ kind: 'gamble', needs: [], value: 0.3, desc: '扫码有惊喜：30%概率+5' }] },
  { id: 'phone', name: '手机', emoji: '📱', faction: 'cyber', rarity: 'common', base: 1, weight: 65, combos: [{ kind: 'adjacency_bonus', needs: ['like', 'dislike'], value: 2, desc: '刷评论：相邻点赞/差评放大' }] },
  // -- uncommon --
  { id: 'redpacket', name: '红包', emoji: '🧧', faction: 'cyber', rarity: 'uncommon', base: 4, weight: 55, combos: [{ kind: 'gamble', needs: [], value: 0.5, desc: '手气王：50%概率×2' }] },
  { id: 'coupon', name: '满减券', emoji: '🎫', faction: 'cyber', rarity: 'uncommon', base: 3, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: [], value: 2, desc: '薅羊毛：相邻料理+2' }] },
  { id: 'lucky_carp', name: '转发锦鲤', emoji: '🐠', faction: 'cyber', rarity: 'uncommon', base: 2, weight: 40, combos: [{ kind: 'multiply_self', needs: [], value: 2, desc: '玄学：自身基于相邻符号数量×2' }] },
  // -- rare --
  { id: 'hot_search', name: '上热搜', emoji: '🔥', faction: 'cyber', rarity: 'rare', base: 6, weight: 45, combos: [{ kind: 'multiply_self', needs: [], value: 2, desc: '流量爆炸：本轮全场×2' }] },
  { id: 'wooden_fish', name: '电子木鱼', emoji: '🪵', faction: 'cyber', rarity: 'rare', base: 5, weight: 35, combos: [{ kind: 'counter', needs: [], value: 1, desc: '赛博功德：每轮敲一下永久+1' }] },

  // ============ 阵营五：料理产物 dish（合成爆点，主要由合成产生，部分可抽到，约 12 个） ============
  // -- uncommon --
  { id: 'gaijiaofan', name: '盖浇饭', emoji: '🍛', faction: 'dish', rarity: 'uncommon', base: 5, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['cattle'], value: 4, desc: '牛马就爱点盖浇饭：相邻牛马+4' }] },
  { id: 'fried_rice', name: '蛋炒饭', emoji: '🍱', faction: 'dish', rarity: 'uncommon', base: 5, weight: 65, combos: [{ kind: 'adjacency_bonus', needs: ['egg', 'rice'], value: 3, desc: '黄金蛋炒饭：相邻蛋/饭+3' }] },
  { id: 'bbq', name: '烧烤', emoji: '🍢', faction: 'dish', rarity: 'uncommon', base: 6, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: ['beer'], value: 4, desc: '撸串配啤酒：相邻啤酒+4' }] },
  { id: 'beer', name: '啤酒', emoji: '🍺', faction: 'dish', rarity: 'uncommon', base: 3, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['bbq'], value: 3, desc: '人生快事：相邻烧烤+3' }] },
  { id: 'malatang', name: '麻辣烫', emoji: '🥘', faction: 'dish', rarity: 'uncommon', base: 5, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: ['chili'], value: 3, desc: '自选加料：每个相邻辣椒+3' }] },
  // -- rare（合成神菜） --
  { id: 'longjiang', name: '隆江猪脚饭', emoji: '🍖', faction: 'dish', rarity: 'rare', base: 12, weight: 30, combos: [{ kind: 'counter', needs: [], value: 2, desc: '牛马の信仰：每轮永久+2，回新鲜感' }] },
  { id: 'jiuzhuan', name: '九转大肠', emoji: '🌀', faction: 'dish', rarity: 'rare', base: 12, weight: 30, combos: [{ kind: 'multiply_self', needs: ['influencer'], value: 3, desc: '化腐朽为神奇：相邻网红×3' }] },
  { id: 'kobe_steak', name: '神户牛排', emoji: '🥩', faction: 'dish', rarity: 'rare', base: 11, weight: 28, combos: [{ kind: 'adjacency_bonus', needs: ['wagyu', 'rich2'], value: 6, desc: '天价牛排：相邻和牛/富二代+6' }] },
  { id: 'buddha_jump', name: '佛跳墙', emoji: '🍲', faction: 'dish', rarity: 'rare', base: 14, weight: 22, combos: [{ kind: 'adjacency_bonus', needs: [], value: 3, desc: '满汉全席：相邻所有食材+3' }] },
  { id: 'science_dish', name: '科技与狠活套餐', emoji: '🧪', faction: 'dish', rarity: 'rare', base: 10, weight: 30, combos: [{ kind: 'multiply_self', needs: ['gutter_oil'], value: 2, desc: '科技拉满：相邻地沟油×2，免疫差评' }] },
  { id: 'feast', name: '王の宴', emoji: '👑', faction: 'dish', rarity: 'rare', base: 16, weight: 15, combos: [{ kind: 'multiply_self', needs: [], value: 2, desc: '究极满足：相邻料理数≥3时×2' }] },

  // ============ 补充符号（凑齐 100，强化各阵营深度，22 个） ============
  // food 补充
  { id: 'lettuce', name: '生菜', emoji: '🥗', faction: 'food', rarity: 'common', base: 1, weight: 80, combos: [{ kind: 'adjacency_bonus', needs: ['meat'], value: 2, desc: '解腻：相邻荤菜+2' }] },
  { id: 'pepper2', name: '青椒', emoji: '🫑', faction: 'food', rarity: 'common', base: 1, weight: 75, combos: [{ kind: 'adjacency_bonus', needs: ['meat'], value: 2, desc: '青椒肉丝：相邻肉+2' }] },
  { id: 'avocado', name: '牛油果', emoji: '🥑', faction: 'food', rarity: 'uncommon', base: 4, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: ['bread'], value: 3, desc: '中产早餐：相邻面包+3' }] },
  { id: 'truffle', name: '松露', emoji: '🟤', faction: 'food', rarity: 'rare', base: 9, weight: 30, combos: [{ kind: 'adjacency_bonus', needs: [], value: 4, desc: '黑钻：相邻所有食材+4' }] },
  { id: 'pineapple', name: '菠萝', emoji: '🍍', faction: 'food', rarity: 'common', base: 1, weight: 70, combos: [{ kind: 'adjacency_bonus', needs: ['meat'], value: 3, desc: '菠萝咕咾肉：相邻肉+3（争议+话题）' }] },
  // gross 补充
  { id: 'maggot', name: '蛆', emoji: '🐛', faction: 'gross', rarity: 'common', base: 0, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: ['expired'], value: 4, desc: '蛋白质：相邻过期食材+4' }] },
  { id: 'spoiled_milk', name: '坏牛奶', emoji: '🥛', faction: 'gross', rarity: 'common', base: 1, weight: 55, combos: [{ kind: 'transform', needs: [], value: 0, desc: '放久了：每6轮变成酸奶', target: 'yogurt' }] },
  { id: 'yogurt', name: '酸奶', emoji: '🍶', faction: 'gross', rarity: 'uncommon', base: 4, weight: 40, combos: [{ kind: 'counter', needs: [], value: 1, desc: '益生菌：每轮永久+1' }] },
  { id: 'hairy', name: '头发', emoji: '🧶', faction: 'gross', rarity: 'common', base: 0, weight: 50, combos: [{ kind: 'gamble', needs: [], value: 0.25, desc: '吃出头发：25%概率赔偿全单免费（清空回血）' }] },
  // worker 补充
  { id: 'delivery_box', name: '骑手箱', emoji: '📦', faction: 'worker', rarity: 'common', base: 1, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['courier'], value: 3, desc: '装备升级：相邻外卖员+3' }] },
  { id: 'old_employee', name: '老油条', emoji: '🧓', faction: 'worker', rarity: 'common', base: 2, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: ['intern'], value: 2, desc: '带新人：相邻实习生+2' }] },
  { id: 'fired_worker', name: '被裁员工', emoji: '😵', faction: 'worker', rarity: 'common', base: 0, weight: 45, combos: [{ kind: 'transform', needs: [], value: 0, desc: '再就业：每4轮变回牛马', target: 'cattle' }] },
  { id: 'consultant', name: '咨询顾问', emoji: '📊', faction: 'worker', rarity: 'uncommon', base: 4, weight: 45, combos: [{ kind: 'adjacency_bonus', needs: ['boss'], value: 3, desc: 'PPT忽悠：相邻老板+3' }] },
  { id: 'angel', name: '天使投资人', emoji: '😇', faction: 'worker', rarity: 'rare', base: 7, weight: 30, combos: [{ kind: 'multiply_self', needs: ['capitalist', 'rich2'], value: 2, desc: '资本运作：相邻资本家/富二代×2' }] },
  // cyber 补充
  { id: 'vpn', name: '加速器', emoji: '🛰️', faction: 'cyber', rarity: 'common', base: 1, weight: 50, combos: [{ kind: 'adjacency_bonus', needs: ['phone'], value: 2, desc: '网速快：相邻手机+2' }] },
  { id: 'ai_bot', name: 'AI助手', emoji: '🤖', faction: 'cyber', rarity: 'uncommon', base: 4, weight: 45, combos: [{ kind: 'adjacency_bonus', needs: [], value: 1, desc: '自动化：相邻所有符号+1' }] },
  { id: 'meme', name: '表情包', emoji: '😂', faction: 'cyber', rarity: 'common', base: 1, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['hot_search'], value: 4, desc: '玩梗：相邻热搜+4' }] },
  { id: 'crypto', name: '虚拟币', emoji: '🪙', faction: 'cyber', rarity: 'rare', base: 3, weight: 30, combos: [{ kind: 'gamble', needs: [], value: 0.5, desc: '梭哈：50%概率×4，50%归零（暴富或归零）' }] },
  // dish 补充
  { id: 'milk_tea', name: '奶茶', emoji: '🧋', faction: 'dish', rarity: 'uncommon', base: 4, weight: 60, combos: [{ kind: 'adjacency_bonus', needs: ['cattle', 'intern'], value: 3, desc: '续命奶茶：相邻社畜+3' }] },
  { id: 'spicy_strip', name: '辣条', emoji: '🌭', faction: 'dish', rarity: 'common', base: 2, weight: 65, combos: [{ kind: 'adjacency_bonus', needs: ['chili'], value: 2, desc: '童年の味：相邻辣椒+2' }] },
  { id: 'screw_noodle', name: '螺蛳粉', emoji: '🍝', faction: 'dish', rarity: 'rare', base: 9, weight: 30, combos: [{ kind: 'multiply_self', needs: ['stinky_tofu', 'durian'], value: 2, desc: '臭味相投：相邻臭味食材×2' }] },
  { id: 'pearl', name: '珍珠', emoji: '⚫', faction: 'dish', rarity: 'common', base: 1, weight: 55, combos: [{ kind: 'adjacency_bonus', needs: ['milk_tea'], value: 4, desc: '加珍珠：相邻奶茶+4' }] },
];


