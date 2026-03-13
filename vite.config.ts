import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config";
import { define } from "./define.config";
import WallpaperPlugin from "./wallpaper.plugin";

export default defineConfig({
  define,
  plugins: [WallpaperPlugin(), vue(), crx({ manifest })],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, "src/ui/newtab/index.html"),
        popup: resolve(__dirname, "src/ui/action-popup/index.html"),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api", "color-functions"], // 抑制 legacy JS API 的弃用警告
      },
    },
  },
});
