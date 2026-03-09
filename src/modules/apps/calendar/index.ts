import Widget from "./Widget.vue";
import type { AppDef } from "@/types";

export default {
  id: "calendar",
  name: "日历组件",
  type: "widget",
  description: "显示当月日历及全年节假日信息",
  width: 4,
  height: 2,
  component: Widget,
} as AppDef;
