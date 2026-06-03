import { defineConfig } from 'vite';

// GitHub Pages 部署在 https://<user>.github.io/Office-Grub/ 下，
// 因此 base 必须设为仓库名路径，否则资源 404。
export default defineConfig({
  base: '/Office-Grub/',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
