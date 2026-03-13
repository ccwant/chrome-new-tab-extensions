import type { AppDef } from "@/types";

const APP_ICONS: Record<string, string> = {
  clock: "🕐",
  bookmarks: "📑",
};

export function getAppIcon(app: AppDef): string {
  return APP_ICONS[app.id] || "◇";
}
