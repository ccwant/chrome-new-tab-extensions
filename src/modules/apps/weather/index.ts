import Widget from "./Widget.vue";
import type { AppDef } from "@/types";

export default {
  id: "weather",
  name: "天气组件",
  type: "widget",
  description: "显示未来 15 日天气预报的组件",
  width: 4,
  height: 2,
  component: Widget,
} as AppDef;
