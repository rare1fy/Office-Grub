import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { THEME } from './theme';
import { GameState, type DayResult } from '../engine/gameState';
import { SYMBOL_MAP, EMPTY, type Cell } from '../engine/settle';
import { CONFIG, SLOT_COUNT } from '../data/config';
import type { SymbolDef } from '../data/types';
import { tween, delay, easeOutBack } from './anim';

const { DESIGN_WIDTH: W, DESIGN_HEIGHT: H } = THEME;

/** 一个老虎机格子的可视节点（缓存引用，避免每帧查找） */
interface SlotCell {
  node: Container;
  emoji: Text;
  output: Text;
  glow: Graphics;
}

function panel(w: number, h: number, fill: number, border: number, radius = 16): Graphics {
  const g = new Graphics();
  g.lineStyle(4, border);
  g.beginFill(fill);
  g.drawRoundedRect(0, 0, w, h, radius);
  g.endFill();
  return g;
}

function makeText(str: string, size: number, color: number, bold = true): Text {
  const style = new TextStyle({
    fontFamily: THEME.fontFamily,
    fontSize: size,
    fill: color,
    fontWeight: bold ? '700' : '400',
    align: 'center',
  });
  return new Text(str, style);
}

/** 滚动动画期间用于"刷屏"的随机 emoji 池（视觉用，不影响逻辑） */
const REEL_FACES = ['🍚', '🥚', '🍅', '🌶️', '🥩', '🍜', '💩', '🐂', '☕', '🍗', '🦴', '🥬'];

export class GameScene {
  readonly root = new Container();
  private game = new GameState();

  private slotLayer = new Container();
  private hudLayer = new Container();
  private overlayLayer = new Container();

  private slots: SlotCell[] = [];

  private appetiteText!: Text;
  private demandText!: Text;
  private dayText!: Text;
  private progressFill!: Graphics;

  private spinButton!: Container;
  private spinLabel!: Text;
  private busy = false;

  private readonly slotX = 40;
  private readonly slotY = 340;
  private readonly slotW = W - 80;
  private cellSize = 0;
  private readonly gap = 12;

  constructor(private app: Application) {
    this.root.addChild(this.buildBackground());
    this.root.addChild(this.slotLayer);
    this.root.addChild(this.hudLayer);
    this.root.addChild(this.overlayLayer);
    this.buildHud();
    this.buildSlot();
    this.buildButtons();
    this.refreshHud();
    this.showChoices();
  }

  // ---------------- 静态构建 ----------------

  private buildBackground(): Graphics {
    const g = new Graphics();
    g.beginFill(THEME.bg);
    g.drawRect(0, 0, W, H);
    g.endFill();
    return g;
  }

  private buildHud(): void {
    const title = makeText('🍖 牛马厨房', 44, THEME.textDark);
    title.anchor.set(0.5, 0);
    title.position.set(W / 2, 24);
    this.hudLayer.addChild(title);

    const sub = makeText('拉一次杆 = 营业一天 · 攒够胃口交差', 22, THEME.accent);
    sub.anchor.set(0.5, 0);
    sub.position.set(W / 2, 76);
    this.hudLayer.addChild(sub);

    const infoPanel = panel(W - 80, 150, THEME.panel, THEME.panelBorder);
    infoPanel.position.set(40, 118);
    this.hudLayer.addChild(infoPanel);

    // 胃口（唯一货币，醒目大字）
    this.appetiteText = makeText('', 40, THEME.green);
    this.appetiteText.position.set(64, 136);
    this.hudLayer.addChild(this.appetiteText);

    // 距结算天数
    this.dayText = makeText('', 22, THEME.textDark);
    this.dayText.anchor.set(1, 0);
    this.dayText.position.set(W - 64, 144);
    this.hudLayer.addChild(this.dayText);

    // 需求进度：标签 + 进度条
    this.demandText = makeText('', 24, THEME.red);
    this.demandText.position.set(64, 192);
    this.hudLayer.addChild(this.demandText);

    const barX = 64;
    const barY = 228;
    const barW = W - 128;
    const barBg = new Graphics();
    barBg.beginFill(0xe0e0e0);
    barBg.drawRoundedRect(0, 0, barW, 26, 13);
    barBg.endFill();
    barBg.position.set(barX, barY);
    this.hudLayer.addChild(barBg);

    this.progressFill = new Graphics();
    this.progressFill.position.set(barX, barY);
    this.hudLayer.addChild(this.progressFill);
  }

  private buildSlot(): void {
    const { cols, rows } = CONFIG;
    this.cellSize = (this.slotW - this.gap * (cols - 1) - 24) / cols;
    const slotH = this.cellSize * rows + this.gap * (rows - 1) + 24;

    const bg = panel(this.slotW, slotH, THEME.slotBg, THEME.panelBorder, 20);
    bg.position.set(this.slotX, this.slotY);
    this.slotLayer.addChild(bg);

    for (let i = 0; i < SLOT_COUNT; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const node = new Container();
      node.position.set(
        this.slotX + 12 + c * (this.cellSize + this.gap),
        this.slotY + 12 + r * (this.cellSize + this.gap),
      );

      const cellBg = new Graphics();
      cellBg.lineStyle(3, THEME.cellBorder);
      cellBg.beginFill(THEME.cellBg);
      cellBg.drawRoundedRect(0, 0, this.cellSize, this.cellSize, 12);
      cellBg.endFill();
      node.addChild(cellBg);

      // 命中高亮层（结算时点亮）
      const glow = new Graphics();
      glow.lineStyle(4, THEME.accent);
      glow.drawRoundedRect(0, 0, this.cellSize, this.cellSize, 12);
      glow.alpha = 0;
      node.addChild(glow);

      const emoji = makeText('', this.cellSize * 0.5, THEME.textDark);
      emoji.anchor.set(0.5);
      emoji.position.set(this.cellSize / 2, this.cellSize / 2 - 6);
      node.addChild(emoji);

      const output = makeText('', 20, THEME.accent);
      output.anchor.set(0.5);
      output.position.set(this.cellSize / 2, this.cellSize - 16);
      output.alpha = 0;
      node.addChild(output);

      this.slotLayer.addChild(node);
      this.slots.push({ node, emoji, output, glow });
    }
  }

  private buildButtons(): void {
    // 主按钮：开张营业
    const btn = new Container();
    const w = W - 120;
    const h = 88;
    const g = new Graphics();
    g.lineStyle(5, 0xffffff);
    g.beginFill(THEME.accent);
    g.drawRoundedRect(0, 0, w, h, 44);
    g.endFill();
    btn.addChild(g);
    this.spinLabel = makeText('🍳 开张营业', 36, THEME.textLight);
    this.spinLabel.anchor.set(0.5);
    this.spinLabel.position.set(w / 2, h / 2);
    btn.addChild(this.spinLabel);
    btn.position.set(60, H - 150);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', () => void this.onSpin());
    this.hudLayer.addChild(btn);
    this.spinButton = btn;

    // 符号库按钮
    const lib = new Container();
    const lg = new Graphics();
    lg.lineStyle(3, THEME.panelBorder);
    lg.beginFill(THEME.panel);
    lg.drawRoundedRect(0, 0, 200, 52, 26);
    lg.endFill();
    lib.addChild(lg);
    const ll = makeText('📋 后厨符号库', 24, THEME.textDark);
    ll.anchor.set(0.5);
    ll.position.set(100, 26);
    lib.addChild(ll);
    lib.position.set((W - 200) / 2, H - 56);
    lib.eventMode = 'static';
    lib.cursor = 'pointer';
    lib.on('pointertap', () => this.showLibrary());
    this.hudLayer.addChild(lib);
  }

  // ---------------- HUD 刷新 ----------------

  private refreshHud(): void {
    const g = this.game;
    this.appetiteText.text = `😋 胃口 ${g.appetite}`;
    this.demandText.text = `🎯 本期需求 ${g.demand}`;
    this.dayText.text = `📅 还剩 ${g.daysUntilRent} 天交差`;
    this.drawProgress(g.appetite, g.demand);
  }

  private drawProgress(value: number, demand: number): void {
    const ratio = demand > 0 ? Math.max(0, Math.min(1, value / demand)) : 0;
    const barW = W - 128;
    this.progressFill.clear();
    this.progressFill.beginFill(ratio >= 1 ? THEME.green : THEME.freshBar);
    this.progressFill.drawRoundedRect(0, 0, barW * ratio, 26, 13);
    this.progressFill.endFill();
  }

  // ---------------- 核心：拉杆动画时序 ----------------

  private async onSpin(): Promise<void> {
    if (this.busy || this.game.isGameOver()) return;
    this.busy = true;
    this.setButtonEnabled(false);
    this.clearSlotVisuals();

    // 1) 预先算出本次落定结果（逻辑先行，动画只负责呈现）
    const day = this.game.businessDay();

    // 2) 逐列滚动 + 从左到右依次刹停
    await this.playReelSpin(day.cells);

    // 3) 逐格结算：符号一个个亮起，胃口数字一个个累加
    await this.playSettle(day);

    // 4) 需求结算时点：交差判定
    if (day.rentDue) {
      await delay(350);
      const rent = this.game.settleRent();
      if (!rent.passed) {
        this.showGameOver();
        this.busy = false;
        return;
      }
      await this.playRentPassed(rent.demand);
      this.refreshHud();
      this.showChoices();
      this.busy = false;
      this.setButtonEnabled(true);
      return;
    }

    // 5) 普通天：必出三选一
    await delay(250);
    this.refreshHud();
    this.showChoices();
    this.busy = false;
    this.setButtonEnabled(true);
  }

  /** 逐列滚动并依次刹停：每列高速刷随机 emoji，到时间落到目标符号 */
  private async playReelSpin(finalCells: Cell[]): Promise<void> {
    const { cols, rows } = CONFIG;
    const colStops: Promise<void>[] = [];

    for (let c = 0; c < cols; c++) {
      const colDuration = 600 + c * 160; // 越靠右停得越晚
      const stop = this.spinColumn(c, rows, cols, colDuration, finalCells);
      colStops.push(stop);
    }
    await Promise.all(colStops);
  }

  /** 单列滚动：滚动期间刷随机脸，结束落定目标符号并回弹 */
  private spinColumn(
    col: number,
    rows: number,
    cols: number,
    duration: number,
    finalCells: Cell[],
  ): Promise<void> {
    const indices: number[] = [];
    for (let r = 0; r < rows; r++) indices.push(r * cols + col);

    let lastFlip = 0;
    return tween(
      this.app,
      duration,
      (t) => {
        // 滚动中：以递减频率刷随机脸
        if (t < 1) {
          lastFlip += 1;
          const interval = 1 + Math.floor(t * 4); // 越接近停止刷得越慢
          if (lastFlip % interval === 0) {
            for (const i of indices) {
              const face = REEL_FACES[Math.floor(Math.random() * REEL_FACES.length)];
              this.slots[i].emoji.text = face;
              this.slots[i].emoji.scale.set(1);
            }
          }
        } else {
          // 落定：显示真实符号（空格留白），轻微回弹
          for (const i of indices) {
            const cell = finalCells[i];
            const def = SYMBOL_MAP.get(cell.symbolId);
            this.slots[i].emoji.text = cell.symbolId === EMPTY || !def ? '' : def.emoji;
            this.slots[i].emoji.scale.set(easeOutBack(0.001) + 0.15);
          }
        }
      },
    );
  }

  /** 逐格结算：有产出的格子依次亮起 + 弹出 +N，胃口累加 */
  private async playSettle(day: DayResult): Promise<void> {
    const scoring = day.result.cells
      .map((cell, i) => ({ cell, i }))
      .filter(({ cell }) => cell.output > 0 || cell.destroyed);

    let running = day.appetiteBefore;

    for (const { cell, i } of scoring) {
      const slot = this.slots[i];
      // 高亮闪一下
      await tween(this.app, 140, (t) => {
        slot.glow.alpha = Math.sin(t * Math.PI);
        slot.node.scale.set(1 + 0.12 * Math.sin(t * Math.PI));
        slot.node.pivot.set(this.cellSize / 2, this.cellSize / 2);
        slot.node.position.x = this.nodeBaseX(i) + this.cellSize / 2;
        slot.node.position.y = this.nodeBaseY(i) + this.cellSize / 2;
      });
      slot.node.scale.set(1);

      // 合成消除：符号炸成料理
      if (cell.destroyed) {
        slot.emoji.text = '✨';
      }
      if (cell.output > 0) {
        slot.output.text = `+${cell.output}`;
        slot.output.alpha = 1;
        running += cell.output;
        this.appetiteText.text = `😋 胃口 ${running}`;
        this.drawProgress(running, this.game.demand);
      }
      await delay(70);
    }

    // 合成料理弹幕
    if (day.result.spawnedDishes.length > 0) {
      this.popText('🍱 整出新活了！', THEME.accent);
    }
    // 兜底对齐到真实总值
    this.appetiteText.text = `😋 胃口 ${day.appetiteAfter}`;
    this.drawProgress(day.appetiteAfter, this.game.demand);
  }

  private async playRentPassed(demand: number): Promise<void> {
    this.popText(`✅ 交差！扣除胃口 ${demand}`, THEME.green);
    await delay(800);
  }

  private nodeBaseX(i: number): number {
    const c = i % CONFIG.cols;
    return this.slotX + 12 + c * (this.cellSize + this.gap);
  }

  private nodeBaseY(i: number): number {
    const r = Math.floor(i / CONFIG.cols);
    return this.slotY + 12 + r * (this.cellSize + this.gap);
  }

  private clearSlotVisuals(): void {
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      s.output.text = '';
      s.output.alpha = 0;
      s.glow.alpha = 0;
      s.node.scale.set(1);
      s.node.pivot.set(0, 0);
      s.node.position.set(this.nodeBaseX(i), this.nodeBaseY(i));
    }
  }

  private setButtonEnabled(on: boolean): void {
    this.spinButton.alpha = on ? 1 : 0.5;
    this.spinButton.eventMode = on ? 'static' : 'none';
    this.spinLabel.text = on ? '🍳 开张营业' : '🍳 营业中…';
  }

  // ---------------- 三选一 ----------------

  private showChoices(): void {
    this.overlayLayer.removeChildren();
    const choices = this.game.rollChoices(3);

    const mask = new Graphics();
    mask.beginFill(0x000000, 0.5);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    this.overlayLayer.addChild(mask);

    const titleY = 380;
    const tip = makeText('🛒 进货！选一个加入后厨', 32, THEME.textLight);
    tip.anchor.set(0.5);
    tip.position.set(W / 2, titleY - 60);
    this.overlayLayer.addChild(tip);

    const cardW = 200;
    const cardH = 260;
    const gap = 20;
    const totalW = cardW * 3 + gap * 2;
    const startX = (W - totalW) / 2;

    choices.forEach((def, i) => {
      const card = this.buildChoiceCard(def, cardW, cardH);
      card.position.set(startX + i * (cardW + gap), titleY);
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointertap', () => {
        this.game.addSymbol(def.id);
        this.overlayLayer.removeChildren();
        this.refreshHud();
      });
      this.overlayLayer.addChild(card);
    });

    const skip = this.buildSmallButton('跳过', 0xbdbdbd);
    skip.position.set((W - 200) / 2, titleY + cardH + 30);
    skip.on('pointertap', () => this.overlayLayer.removeChildren());
    this.overlayLayer.addChild(skip);
  }

  private buildChoiceCard(def: SymbolDef, w: number, h: number): Container {
    const card = new Container();
    const border = THEME.faction[def.faction] ?? THEME.panelBorder;
    card.addChild(panel(w, h, THEME.panel, border, 18));

    const emoji = makeText(def.emoji, 72, THEME.textDark);
    emoji.anchor.set(0.5);
    emoji.position.set(w / 2, 60);
    card.addChild(emoji);

    const name = makeText(def.name, 26, THEME.textDark);
    name.anchor.set(0.5);
    name.position.set(w / 2, 116);
    card.addChild(name);

    const rarityColor =
      def.rarity === 'rare' ? THEME.accent : def.rarity === 'uncommon' ? THEME.green : 0x9e9e9e;
    const rarityLabel = def.rarity === 'rare' ? '稀有' : def.rarity === 'uncommon' ? '罕见' : '普通';
    const rar = makeText(`【${rarityLabel}】基础${def.base}`, 18, rarityColor);
    rar.anchor.set(0.5);
    rar.position.set(w / 2, 148);
    card.addChild(rar);

    const descStr = def.combos[0]?.desc ?? '老老实实出工出力';
    const desc = makeText(descStr, 16, THEME.textDark, false);
    desc.anchor.set(0.5, 0);
    desc.position.set(w / 2, 174);
    desc.style.wordWrap = true;
    desc.style.wordWrapWidth = w - 24;
    card.addChild(desc);

    return card;
  }

  // ---------------- 符号库 ----------------

  private showLibrary(): void {
    if (this.busy) return;
    this.overlayLayer.removeChildren();

    const mask = new Graphics();
    mask.beginFill(0x000000, 0.6);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    mask.eventMode = 'static';
    this.overlayLayer.addChild(mask);

    const title = makeText('📋 后厨符号库', 34, THEME.textLight);
    title.anchor.set(0.5);
    title.position.set(W / 2, 80);
    this.overlayLayer.addChild(title);

    const counts = this.game.poolCounts();
    const total = this.game.symbolPool.length;
    const sub = makeText(`共 ${total} 个符号（每次拉杆随机上 ${SLOT_COUNT} 格）`, 20, THEME.textLight, false);
    sub.anchor.set(0.5);
    sub.position.set(W / 2, 122);
    this.overlayLayer.addChild(sub);

    // 网格列出每种符号 + 数量
    const cols = 4;
    const cell = 150;
    const startX = (W - cols * cell) / 2 + cell / 2;
    const startY = 190;
    let idx = 0;
    for (const [id, n] of counts) {
      const def = SYMBOL_MAP.get(id);
      if (!def) continue;
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = startX + c * cell;
      const y = startY + r * 120;

      const e = makeText(def.emoji, 48, THEME.textLight);
      e.anchor.set(0.5);
      e.position.set(x, y);
      this.overlayLayer.addChild(e);

      const label = makeText(`${def.name}×${n}`, 18, THEME.textLight, false);
      label.anchor.set(0.5);
      label.position.set(x, y + 42);
      this.overlayLayer.addChild(label);
      idx++;
    }

    const close = this.buildSmallButton('关闭', THEME.accent);
    close.position.set((W - 200) / 2, H - 130);
    close.on('pointertap', () => this.overlayLayer.removeChildren());
    this.overlayLayer.addChild(close);
  }

  // ---------------- 结束 ----------------

  private showGameOver(): void {
    this.overlayLayer.removeChildren();
    const mask = new Graphics();
    mask.beginFill(0x000000, 0.75);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    this.overlayLayer.addChild(mask);

    const box = panel(W - 120, 360, THEME.panel, THEME.red, 24);
    box.position.set(60, H / 2 - 180);
    this.overlayLayer.addChild(box);

    const t1 = makeText('💀 餐馆倒闭了', 52, THEME.red);
    t1.anchor.set(0.5);
    t1.position.set(W / 2, H / 2 - 110);
    this.overlayLayer.addChild(t1);

    const t2 = makeText('胃口没攒够，交不上差…', 24, THEME.textDark);
    t2.anchor.set(0.5);
    t2.position.set(W / 2, H / 2 - 40);
    this.overlayLayer.addChild(t2);

    const t3 = makeText(`坚持了 ${this.game.period - 1} 个周期`, 28, THEME.textDark);
    t3.anchor.set(0.5);
    t3.position.set(W / 2, H / 2 + 10);
    this.overlayLayer.addChild(t3);

    const btn = this.buildSmallButton('🔄 再开一家', THEME.accent, 240);
    btn.position.set((W - 240) / 2, H / 2 + 70);
    btn.on('pointertap', () => this.restart());
    this.overlayLayer.addChild(btn);
  }

  private restart(): void {
    this.game = new GameState();
    this.overlayLayer.removeChildren();
    this.clearSlotVisuals();
    for (const s of this.slots) s.emoji.text = '';
    this.refreshHud();
    this.showChoices();
    this.busy = false;
    this.setButtonEnabled(true);
  }

  // ---------------- 通用小组件 ----------------

  private buildSmallButton(label: string, fill: number, w = 200): Container {
    const btn = new Container();
    const g = new Graphics();
    g.beginFill(fill);
    g.drawRoundedRect(0, 0, w, 56, 28);
    g.endFill();
    btn.addChild(g);
    const l = makeText(label, 26, THEME.textLight);
    l.anchor.set(0.5);
    l.position.set(w / 2, 28);
    btn.addChild(l);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    return btn;
  }

  private popText(str: string, color: number): void {
    const t = makeText(str, 44, color);
    t.anchor.set(0.5);
    t.position.set(W / 2, this.slotY - 30);
    this.hudLayer.addChild(t);
    let life = 0;
    const tick = (): void => {
      life += this.app.ticker.deltaMS;
      t.y -= 0.5;
      t.alpha = Math.max(0, 1 - life / 1000);
      if (life > 1000) {
        this.app.ticker.remove(tick);
        t.destroy();
      }
    };
    this.app.ticker.add(tick);
  }
}
