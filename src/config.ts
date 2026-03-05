import { ThemeSettings } from "./types";

export const DEFAULT_APPS = [{ index: 22, type: "widget" as const, widgetId: "clock" }];

export const STORAGE_KEY = "custom_newtab_apps_v1";
export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const MAX_APPS = GRID_COLS * GRID_ROWS;

export const DEFAULT_WALLPAPER: ThemeSettings = {
  maskOpacity: 0.04,
  blur: 0,
  wallpaperType: "solid",
  wallpaperIndex: 3,
};

export const WALLPAPER_BACKGROUND = {
  solid: [
    "linear-gradient(0deg, rgb(207, 217, 223) 0%, rgb(226, 235, 240) 100%)",
    "linear-gradient(0deg, rgb(161, 140, 209) 0%, rgb(251, 194, 235) 100%)",
    "linear-gradient(0deg, rgb(251, 194, 235) 0%, rgb(166, 193, 238) 100%)",
    "linear-gradient(120deg, rgb(166, 192, 254) 0%, rgb(246, 128, 132) 100%)",
    "linear-gradient(120deg, rgb(224, 195, 252) 0%, rgb(142, 197, 252) 100%)",
    "linear-gradient(0deg, rgb(134, 143, 150) 0%, rgb(89, 97, 100) 100%)",
  ],
};
