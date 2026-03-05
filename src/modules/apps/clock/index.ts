import ClockWidget from "./ClockWidget.vue";
import type { AppDef } from "@/types";

export const clockApp: AppDef = {
  id: "clock",
  name: "时间小组件",
  type: "widget",
  description: "显示当前时间，宽度占 3 个格子。",
  width: 3,
  height: 1,
  component: ClockWidget,
};
