import Widget from "./Widget.vue";
import type { AppDef } from "@/types";

export default {
  id: "custom",
  name: "自定义组件",
  type: "widget",
  description: "自定义组件",
  width: 4,
  height: 2,
  component: Widget,
} as AppDef;
