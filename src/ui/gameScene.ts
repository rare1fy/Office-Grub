import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { THEME } from './theme';
import { GameState } from '../engine/gameState';
import { SYMBOL_MAP, type Cell } from '../engine/settle';
import { CONFIG } from '../data/config';
import type { SymbolDef } from '../data/types';

const { DESIGN_WIDTH: W, DESIGN_HEIGHT: H } = THEME;

/** 创建一个圆角面板 */
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

export class GameScene {
  readonly root = new Container();
  private game = new GameState();
  private slotLayer = new Container();
  private hudLayer = new Container();
  private overlayLayer = new Container();
  private cellTexts: Text[] = [];
  private cellNodes: Container[] = [];

  private demandText!: Text;
  private coinsText!: Text;
  private periodText!: Text;
  private freshFill!: Graphics;
  private freshText!: Text;
  private spinButton!: Container;
  private busy = false;

  // 老虎机布局
  private readonly slotX = 40;
  private readonly slotY = 320;
  private readonly slotW = W - 80;
  private cellSize = 0;
  private gap = 12;

  constructor(private app: Application) {
    this.root.addChild(this.buildBackground());
    this.root.addChild(this.slotLayer);
    this.root.addChild(this.hudLayer);
    this.root.addChild(this.overlayLayer);
    this.buildHud();
    this.buildSlot();
    this.buildSpinButton();
    this.showChoices();
  }

  private buildBackground(): Graphics {
    const g = new Graphics();
    g.beginFill(THEME.bg);
    g.drawRect(0, 0, W, H);
    g.endFill();
    return g;
  }

  private buildHud(): void {
    // 顶部标题条
    const title = makeText('🍖 牛马厨房', 44, THEME.textDark);
    title.anchor.set(0.5, 0);
    title.position.set(W / 2, 24);
    this.hudLayer.addChild(title);

    const sub = makeText('转一次=营业一天 · 凑够胃口才能活', 22, THEME.accent);
    sub.anchor.set(0.5, 0);
    sub.position.set(W / 2, 78);
    this.hudLayer.addChild(sub);

    // 数据面板
    const infoPanel = panel(W - 80, 120, THEME.panel, THEME.panelBorder);
    infoPanel.position.set(40, 120);
    this.hudLayer.addChild(infoPanel);

    this.periodText = makeText('', 26, THEME.textDark);
    this.periodText.position.set(64, 140);
    this.hudLayer.addChild(this.periodText);

    this.coinsText = makeText('', 30, THEME.green);
    this.coinsText.position.set(64, 178);
    this.hudLayer.addChild(this.coinsText);

    this.demandText = makeText('', 26, THEME.red);
    this.demandText.anchor.set(1, 0);
    this.demandText.position.set(W - 64, 140);
    this.hudLayer.addChild(this.demandText);

    // 新鲜感条
    const freshBg = new Graphics();
    freshBg.beginFill(0xe0e0e0);
    freshBg.drawRoundedRect(0, 0, W - 200, 28, 14);
    freshBg.endFill();
    freshBg.position.set(64, 218);
    this.hudLayer.addChild(freshBg);

    this.freshFill = new Graphics();
    this.freshFill.position.set(64, 218);
    this.hudLayer.addChild(this.freshFill);

    this.freshText = makeText('', 20, THEME.textDark);
    this.freshText.anchor.set(1, 0.5);
    this.freshText.position.set(W - 64, 232);
    this.hudLayer.addChild(this.freshText);

    this.refreshHud();
  }

  private refreshHud(): void {
    const g = this.game;
    this.periodText.text = `📅 第 ${g.period} 周期  Day ${g.dayInPeriod}/${CONFIG.daysPerPeriod}`;
    this.coinsText.text = `💰 营业额 ${g.totalCoins}`;
    this.demandText.text = `🎯 胃口 ${g.demand}`;

    const ratio = Math.max(0, Math.min(1, g.freshness / CONFIG.freshness.max));
    const barW = W - 200;
    this.freshFill.clear();
    const color = ratio > 0.4 ? THEME.freshBar : THEME.red;
    this.freshFill.beginFill(color);
    this.freshFill.drawRoundedRect(0, 0, barW * ratio, 28, 14);
    this.freshFill.endFill();
    this.freshText.text = `😋 新鲜感 ${Math.max(0, g.freshness)}`;
  }

  private buildSlot(): void {
    const { cols, rows } = CONFIG;
    this.cellSize = (this.slotW - this.gap * (cols - 1) - 24) / cols;

    const slotH = this.cellSize * rows + this.gap * (rows - 1) + 24;
    const bg = panel(this.slotW, slotH, THEME.slotBg, THEME.panelBorder, 20);
    bg.position.set(this.slotX, this.slotY);
    this.slotLayer.addChild(bg);

    for (let i = 0; i < cols * rows; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const node = new Container();
      const x = this.slotX + 12 + c * (this.cellSize + this.gap);
      const y = this.slotY + 12 + r * (this.cellSize + this.gap);
      node.position.set(x, y);

      const cellBg = new Graphics();
      cellBg.lineStyle(3, THEME.cellBorder);
      cellBg.beginFill(THEME.cellBg);
      cellBg.drawRoundedRect(0, 0, this.cellSize, this.cellSize, 12);
      cellBg.endFill();
      node.addChild(cellBg);

      const emoji = makeText('', this.cellSize * 0.5, THEME.textDark);
      emoji.anchor.set(0.5);
      emoji.position.set(this.cellSize / 2, this.cellSize / 2 - 6);
      node.addChild(emoji);

      const out = makeText('', 18, THEME.accent);
      out.anchor.set(0.5);
      out.position.set(this.cellSize / 2, this.cellSize - 14);
      node.addChild(out);

      this.slotLayer.addChild(node);
      this.cellNodes.push(node);
      this.cellTexts.push(emoji);
      // 把产出文本存到 node 上方便后续访问
      (node as unknown as { outText: Text }).outText = out;
    }
  }

  private buildSpinButton(): void {
    const btn = new Container();
    const w = W - 120;
    const h = 88;
    const g = new Graphics();
    g.lineStyle(5, 0xffffff);
    g.beginFill(THEME.accent);
    g.drawRoundedRect(0, 0, w, h, 44);
    g.endFill();
    btn.addChild(g);
    const label = makeText('🍳 开张营业', 36, THEME.textLight);
    label.anchor.set(0.5);
    label.position.set(w / 2, h / 2);
    btn.addChild(label);
    btn.position.set(60, H - 160);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', () => this.onSpin());
    this.hudLayer.addChild(btn);
    this.spinButton = btn;
  }

  private renderCells(cells: Cell[]): void {
    cells.forEach((cell, i) => {
      const def = SYMBOL_MAP.get(cell.symbolId);
      const emoji = this.cellTexts[i];
      const out = (this.cellNodes[i] as unknown as { outText: Text }).outText;
      if (def) {
        emoji.text = cell.destroyed ? '✨' : def.emoji;
        out.text = cell.output > 0 ? `+${cell.output}` : '';
      }
    });
  }

  private async onSpin(): Promise<void> {
    if (this.busy || this.game.isGameOver()) return;
    this.busy = true;
    this.spinButton.alpha = 0.5;

    // 简易转动动画：快速随机刷新几帧
    for (let f = 0; f < 8; f++) {
      const temp = this.game.spin();
      this.renderCells(temp.map((c) => ({ ...c, output: 0 })));
      await this.delay(40);
    }

    const { cells, result } = this.game.businessDay();
    this.renderCells(cells);
    this.refreshHud();

    if (result.total > 0) this.popText(`+${result.total} 💰`, THEME.green);

    await this.delay(600);

    if (this.game.isGameOver()) {
      this.showGameOver();
      this.busy = false;
      return;
    }

    if (this.game.periodFinished) {
      const passed = this.game.checkPeriod();
      if (!passed) {
        this.showGameOver();
        this.busy = false;
        return;
      }
      this.popText(`✅ 第${this.game.period - 1}周期达标！`, THEME.green);
      await this.delay(700);
      this.refreshHud();
      this.showChoices();
    }

    this.spinButton.alpha = 1;
    this.busy = false;
  }

  /** 三选一弹窗 */
  private showChoices(): void {
    this.overlayLayer.removeChildren();
    const choices = this.game.rollChoices(3);

    const mask = new Graphics();
    mask.beginFill(0x000000, 0.5);
    mask.drawRect(0, 0, W, H);
    mask.endFill();
    this.overlayLayer.addChild(mask);

    const titleY = 360;
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

    // 跳过按钮
    const skip = new Container();
    const sg = new Graphics();
    sg.beginFill(0xbdbdbd);
    sg.drawRoundedRect(0, 0, 200, 56, 28);
    sg.endFill();
    skip.addChild(sg);
    const sl = makeText('跳过', 26, THEME.textLight);
    sl.anchor.set(0.5);
    sl.position.set(100, 28);
    skip.addChild(sl);
    skip.position.set((W - 200) / 2, titleY + cardH + 30);
    skip.eventMode = 'static';
    skip.cursor = 'pointer';
    skip.on('pointertap', () => this.overlayLayer.removeChildren());
    this.overlayLayer.addChild(skip);
  }

  private buildChoiceCard(def: SymbolDef, w: number, h: number): Container {
    const card = new Container();
    const border = THEME.faction[def.faction] ?? THEME.panelBorder;
    const g = panel(w, h, THEME.panel, border, 18);
    card.addChild(g);

    const emoji = makeText(def.emoji, 72, THEME.textDark);
    emoji.anchor.set(0.5);
    emoji.position.set(w / 2, 60);
    card.addChild(emoji);

    const name = makeText(def.name, 26, THEME.textDark);
    name.anchor.set(0.5);
    name.position.set(w / 2, 116);
    card.addChild(name);

    const rarityColor = def.rarity === 'rare' ? THEME.accent : def.rarity === 'uncommon' ? THEME.green : 0x9e9e9e;
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

    const reason = this.game.freshness <= 0 ? '食客吃腻了，全跑光了…' : '营业额没达标，被房东赶走了…';
    const t2 = makeText(reason, 24, THEME.textDark);
    t2.anchor.set(0.5);
    t2.position.set(W / 2, H / 2 - 40);
    this.overlayLayer.addChild(t2);

    const t3 = makeText(`坚持了 ${this.game.period} 个周期`, 28, THEME.textDark);
    t3.anchor.set(0.5);
    t3.position.set(W / 2, H / 2 + 10);
    this.overlayLayer.addChild(t3);

    const btn = new Container();
    const g = new Graphics();
    g.beginFill(THEME.accent);
    g.drawRoundedRect(0, 0, 240, 72, 36);
    g.endFill();
    btn.addChild(g);
    const bl = makeText('🔄 再开一家', 30, THEME.textLight);
    bl.anchor.set(0.5);
    bl.position.set(120, 36);
    btn.addChild(bl);
    btn.position.set((W - 240) / 2, H / 2 + 70);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', () => this.restart());
    this.overlayLayer.addChild(btn);
  }

  private restart(): void {
    this.game = new GameState();
    this.overlayLayer.removeChildren();
    this.cellTexts.forEach((t) => (t.text = ''));
    this.cellNodes.forEach((n) => ((n as unknown as { outText: Text }).outText.text = ''));
    this.refreshHud();
    this.showChoices();
  }

  private popText(str: string, color: number): void {
    const t = makeText(str, 48, color);
    t.anchor.set(0.5);
    t.position.set(W / 2, this.slotY - 40);
    this.hudLayer.addChild(t);
    let life = 0;
    const tick = () => {
      life += this.app.ticker.deltaMS;
      t.y -= 0.5;
      t.alpha = Math.max(0, 1 - life / 900);
      if (life > 900) {
        this.app.ticker.remove(tick);
        t.destroy();
      }
    };
    this.app.ticker.add(tick);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
