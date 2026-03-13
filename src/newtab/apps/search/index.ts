import SearchWidget from "./SearchWidget.vue";
import type { AppDef } from "@/types";

export default {
  id: "search",
  name: "搜索组件",
  type: "widget",
  description: "搜索组件",
  width: 6,
  height: 1,
  component: SearchWidget,
} as AppDef;
