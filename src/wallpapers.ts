import { WALLPAPER_IMAGES } from "virtual:wallpapers";

export function getWallpaperImageUrls(): string[] {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return WALLPAPER_IMAGES.map((name) => chrome.runtime.getURL(`wallpapers/${name}`));
  }
  return WALLPAPER_IMAGES.map((name) => `/wallpapers/${name}`);
}
