import { clockApp } from "./clock";
import { bookmarksApp } from "./bookmarks";
import type { AppDef } from "@/types";

export const APP_MAP: Record<string, AppDef> = {
  clock: clockApp,
  bookmarks: bookmarksApp,
};

export const APPS = Object.values(APP_MAP);
