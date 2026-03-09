import clock from "./clock";
import bookmarks from "./bookmarks";
import search from "./search";
import notes from "./notes";
import type { AppDef } from "@/types";

export const APP_MAP: Record<string, AppDef> = {
  clock: clock,
  bookmarks: bookmarks,
  search: search,
  notes: notes,
};

export const APPS = Object.values(APP_MAP);
