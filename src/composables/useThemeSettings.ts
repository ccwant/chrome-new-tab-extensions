import { ref, watch } from "vue";
import { WALLPAPER_BACKGROUND, DEFAULT_WALLPAPER } from "@/config";
import { ThemeSettings } from "@/types";

const STORAGE_KEY = "newtab_theme_settings_v2";

const defaultSettings: ThemeSettings = DEFAULT_WALLPAPER;

function loadSettings(): ThemeSettings {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem("newtab_theme_settings_v1");
      if (raw) {
        const old = JSON.parse(raw) as {
          maskOpacity?: number;
          blur?: number;
          wallpaperIndex?: number;
        };
        const migrated: ThemeSettings = {
          maskOpacity:
            typeof old.maskOpacity === "number" ? old.maskOpacity : defaultSettings.maskOpacity,
          blur: typeof old.blur === "number" ? old.blur : defaultSettings.blur,
          wallpaperType: "solid",
          wallpaperIndex:
            typeof old.wallpaperIndex === "number"
              ? old.wallpaperIndex
              : defaultSettings.wallpaperIndex,
        };
        return migrated;
      }
      return { ...defaultSettings };
    }
    const parsed = JSON.parse(raw) as Partial<ThemeSettings> & { wallpaperIndex?: number };
    const type =
      parsed.wallpaperType === "solid" || parsed.wallpaperType === "image"
        ? parsed.wallpaperType
        : defaultSettings.wallpaperType;
    return {
      maskOpacity:
        typeof parsed.maskOpacity === "number" ? parsed.maskOpacity : defaultSettings.maskOpacity,
      blur: typeof parsed.blur === "number" ? parsed.blur : defaultSettings.blur,
      wallpaperType: type,
      wallpaperIndex:
        typeof parsed.wallpaperIndex === "number"
          ? parsed.wallpaperIndex
          : defaultSettings.wallpaperIndex,
    };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(s: ThemeSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error("Failed to save theme settings", e);
  }
}

const settings = ref<ThemeSettings>(loadSettings());

watch(settings, (v) => saveSettings(v), { deep: true });

function applyToDOM(getImageUrls?: () => string[]) {
  document.documentElement.style.setProperty("--wall-blur", `${settings.value.blur}px`);
  document.documentElement.style.setProperty("--wall-mask", String(settings.value.maskOpacity));
  document.documentElement.style.setProperty(
    "--wall-background",
    getWallpaperBackground(getImageUrls?.() ?? [])
  );
}

function getWallpaperBackground(imageUrls: string[]): string {
  const { wallpaperType, wallpaperIndex } = settings.value;
  if (wallpaperType === "solid") {
    const list = WALLPAPER_BACKGROUND.solid;
    const idx = Math.max(0, Math.min(wallpaperIndex, list.length - 1));
    return list[idx];
  }
  if (wallpaperType === "image" && imageUrls.length > 0) {
    const idx = Math.max(0, Math.min(wallpaperIndex, imageUrls.length - 1));
    return `url(${imageUrls[idx]})`;
  }
  return WALLPAPER_BACKGROUND.solid[1];
}

export function useThemeSettings(getImageUrls?: () => string[]) {
  const apply = () => applyToDOM(getImageUrls);

  return { settings, applyToDOM: apply, getWallpaperBackground };
}
