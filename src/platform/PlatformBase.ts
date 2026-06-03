/**
 * 平台抽象层接口。
 * 核心逻辑（engine/data/ui）只依赖此接口，绝不直接调用 tt.* / wx.*。
 * H5 / 抖音 / 微信 各提供一份实现，M2 接入小游戏时只新增实现文件，不动核心代码。
 */
export interface Platform {
  /** 平台标识 */
  readonly name: 'web' | 'douyin' | 'weixin';

  /** 持久化存档 */
  save(key: string, value: unknown): Promise<void>;
  /** 读取存档，无则返回 null */
  load<T>(key: string): Promise<T | null>;

  /** 进入前台（小游戏切回时触发，用于恢复 BGM 等） */
  onShow(callback: () => void): void;
  /** 进入后台（用于暂停 BGM、保存进度等） */
  onHide(callback: () => void): void;

  /** 分享（H5 走 Web Share / 降级；小游戏走 onShareAppMessage） */
  share(options: ShareOptions): void;
}

export interface ShareOptions {
  readonly title: string;
  readonly imageUrl?: string;
}
