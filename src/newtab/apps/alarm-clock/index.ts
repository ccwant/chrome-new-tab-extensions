import Widget from "./Widget.vue";
import type { AppDef } from "@/types";

export default {
  id: "alarm-clock",
  name: "闹钟组件",
  type: "widget",
  description: "闹钟组件",
  width: 4,
  height: 2,
  component: Widget,
} as AppDef;
