import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export default function plugin() {
  const virtualId = "\0virtual:wallpapers";
  return {
    name: "wallpapers-list",
    enforce: "pre" as const,
    resolveId(id: string) {
      if (id === "virtual:wallpapers") return virtualId;
    },
    load(id: string) {
      if (id === virtualId) {
        const dir = resolve(__dirname, "public/wallpapers");
        let files: string[] = [];
        try {
          files = readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
        } catch {
          // folder may not exist
        }
        return `export const WALLPAPER_IMAGES = ${JSON.stringify(files)};`;
      }
    },
  };
}
