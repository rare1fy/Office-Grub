import type { Platform, ShareOptions } from './PlatformBase';

/** H5 / 浏览器平台实现（当前可玩版本使用） */
export class WebPlatform implements Platform {
  readonly name = 'web' as const;

  async save(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('存档失败：', err);
    }
  }

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.warn('读取存档失败：', err);
      return null;
    }
  }

  onShow(callback: () => void): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') callback();
    });
  }

  onHide(callback: () => void): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') callback();
    });
  }

  share(options: ShareOptions): void {
    const nav = navigator as Navigator & {
      share?: (data: { title: string; url: string }) => Promise<void>;
    };
    if (nav.share) {
      nav.share({ title: options.title, url: location.href }).catch(() => {});
      return;
    }
    console.info('分享（H5 降级，无原生分享）：', options.title);
  }
}
