import ClockWidget from "./ClockWidget.vue";
import type { AppDef } from "@/types";

export default {
  id: "clock",
  name: "时间小组件",
  type: "widget",
  description: "显示当前时间，宽度占 3 个格子。",
  width: 4,
  height: 2,
  component: ClockWidget,
} as AppDef;
