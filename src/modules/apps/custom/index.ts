import Widget from "./Widget.vue";
import type { AppDef } from "@/types";

export const searchApp: AppDef = {
  id: "notes",
  name: "便签组件",
  type: "widget",
  description: "便签组件",
  width: 4,
  height: 2,
  component: Widget,
};
