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
});
