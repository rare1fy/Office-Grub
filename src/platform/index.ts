import type { Platform } from './PlatformBase';
import { WebPlatform } from './web';

/**
 * 平台工厂：按运行环境返回对应实现。
 * M2 接入小游戏时，在此处探测 tt / wx 并返回 DouyinPlatform / WeixinPlatform。
 */
export function createPlatform(): Platform {
  // M2 预留：
  // if (typeof tt !== 'undefined') return new DouyinPlatform();
  // if (typeof wx !== 'undefined') return new WeixinPlatform();
  return new WebPlatform();
}

export type { Platform } from './PlatformBase';
