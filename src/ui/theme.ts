/** 牛马厨房 · 视觉主题（羊了个羊风格：明亮、圆润、高饱和卡通） */
export const THEME = {
  // 设计分辨率（竖屏）
  DESIGN_WIDTH: 720,
  DESIGN_HEIGHT: 1280,

  // 配色
  bg: 0xf6d365, // 主背景暖黄
  bgGradient: 0xfda085, // 渐变橙
  panel: 0xfffbe6, // 面板奶白
  panelBorder: 0xffb74d, // 面板描边橙
  slotBg: 0xfff3d6, // 老虎机底
  cellBg: 0xffffff, // 格子白
  cellBorder: 0xffcc80,
  textDark: 0x5d4037, // 深棕文字
  textLight: 0xffffff,
  accent: 0xff7043, // 强调橙红
  green: 0x66bb6a, // 达标绿
  red: 0xef5350, // 警告红
  freshBar: 0x4fc3f7, // 新鲜感蓝

  // 字体
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',

  // 阵营配色（格子描边/标签）
  faction: {
    food: 0x81c784,
    gross: 0xa1887f,
    worker: 0x64b5f6,
    cyber: 0xba68c8,
    dish: 0xffb74d,
  } as Record<string, number>,
} as const;
