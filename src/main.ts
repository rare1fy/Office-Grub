import { Application, Container } from 'pixi.js';
import { THEME } from './ui/theme';
import { GameScene } from './ui/gameScene';

const { DESIGN_WIDTH, DESIGN_HEIGHT } = THEME;

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: THEME.bg,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  const mount = document.getElementById('app');
  if (!mount) throw new Error('#app not found');
  mount.appendChild(app.canvas);

  // 设计分辨率舞台，按屏幕等比缩放（contain，保持竖屏比例）
  const stage = new Container();
  app.stage.addChild(stage);

  const scene = new GameScene(app);
  stage.addChild(scene.root);

  function resize(): void {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    const scale = Math.min(sw / DESIGN_WIDTH, sh / DESIGN_HEIGHT);
    const realW = DESIGN_WIDTH * scale;
    const realH = DESIGN_HEIGHT * scale;
    app.renderer.resize(realW, realH);
    stage.scale.set(scale);
    app.canvas.style.width = `${realW}px`;
    app.canvas.style.height = `${realH}px`;
  }

  resize();
  window.addEventListener('resize', resize);
}

bootstrap().catch((err) => {
  console.error('启动失败：', err);
});
