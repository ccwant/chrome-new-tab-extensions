import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Hello World New Tab",
  version: "1.0.0",
  description: "用 hello world 替换新标签页内容。",
  permissions: ["bookmarks", "favicon", "alarms", "notifications", "storage"],
  chrome_url_overrides: {
    newtab: "src/ui/newtab/index.html",
  },
  web_accessible_resources: [
    {
      resources: ["wallpapers/*"],
      matches: ["<all_urls>"],
    },
  ],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  action: {
    default_title: "Drink Water Event",
    default_popup: "src/ui/action-popup/index.html",
  },
  icons: {
    "16": "drink_water16.png",
    "32": "drink_water32.png",
    "48": "drink_water48.png",
    "128": "drink_water128.png",
  },
  host_permissions: ["https://date.appworlds.cn/*"],
});
