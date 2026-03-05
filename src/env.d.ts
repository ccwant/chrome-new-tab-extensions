/// <reference types="vite/client" />

declare const __CHANGELOG__: string;
declare const __VERSION__: string;
declare const __DISPLAY_NAME__: string;
declare const __AUTHOR__: string;
declare const __GITHUB_URL__: string;

declare module "virtual:wallpapers" {
  export const WALLPAPER_IMAGES: string[];
}

declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }
  export interface Lunar {
    getMonthInChinese(): string;
    getDayInChinese(): string;
  }
}

interface ChromeBookmarkNode {
  id: string;
  parentId?: string;
  title?: string;
  url?: string;
  children?: ChromeBookmarkNode[];
}

declare const chrome: {
  runtime: { id: string; getURL(path: string): string };
  bookmarks?: {
    getTree(cb: (tree: ChromeBookmarkNode[]) => void): void;
    getSubTree(id: string, cb: (nodes: ChromeBookmarkNode[]) => void): void;
    create(opts: { parentId: string; title: string }, cb?: () => void): void;
    update(id: string, opts: { title?: string; url?: string }, cb?: () => void): void;
    remove(id: string, cb?: () => void): void;
    removeTree(id: string, cb?: () => void): void;
    move(id: string, opts: { parentId: string; index: number }, cb?: () => void): void;
  };
};
