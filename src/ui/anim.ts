import type { Application } from 'pixi.js';

/** 缓出（减速）缓动：用于老虎机刹停的手感 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** 回弹缓动：刹停后轻微过冲再回正 */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** 延时（用于编排时序节奏） */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 基于 PIXI ticker 的补间动画：在 duration 内把进度 0→1 喂给 onUpdate。
 * 用 ticker 而非 setInterval，保证与渲染帧同步、后台标签页自动暂停。
 */
export function tween(
  app: Application,
  duration: number,
  onUpdate: (t: number) => void,
  ease: (t: number) => number = easeOutCubic,
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (): void => {
      elapsed += app.ticker.deltaMS;
      const raw = Math.min(1, elapsed / duration);
      onUpdate(ease(raw));
      if (raw >= 1) {
        app.ticker.remove(tick);
        resolve();
      }
    };
    app.ticker.add(tick);
  });
}
