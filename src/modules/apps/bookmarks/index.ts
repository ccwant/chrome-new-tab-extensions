import BookmarksCard from "./BookmarksCard.vue";
import type { AppDef } from "@/types";

export const bookmarksApp: AppDef = {
  id: "bookmarks",
  name: "书签",
  type: "app",
  description: "点击查看和管理浏览器书签",
  width: 1,
  height: 1,
  component: BookmarksCard,
};

export { default as BookmarksCard } from "./BookmarksCard.vue";
export { default as BookmarksModal } from "./BookmarksModal.vue";
