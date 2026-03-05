import type { Component } from "vue";

export type WallpaperType = "solid" | "image";

export interface ThemeSettings {
  maskOpacity: number;
  blur: number;
  wallpaperType: WallpaperType;
  wallpaperIndex: number;
}

export interface AppItem {
  id: string;
  name: string;
  url: string;
  iconDataUrl: string;
  iconUrl?: string;
  type: "shortcut" | "widget" | "app";
  widgetId: string | null;
  width: number;
  height: number;
}

export interface AddAppPayload {
  name: string;
  url?: string;
  iconDataUrl?: string;
  iconUrl?: string;
  type?: string;
  widgetId?: string;
  width?: number;
  height?: number;
}

export interface AppDef {
  id: string;
  name: string;
  type: string;
  description?: string;
  url?: string;
  iconDataUrl?: string;
  width?: number;
  height?: number;
  component: Component;
}
