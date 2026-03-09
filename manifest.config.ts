import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Hello World New Tab",
  version: "1.0.0",
  description: "用 hello world 替换新标签页内容。",
  permissions: ["bookmarks", "favicon"],
  chrome_url_overrides: {
    newtab: "newtab.html",
  },
  web_accessible_resources: [
    {
      resources: ["wallpapers/*"],
      matches: ["<all_urls>"],
    },
  ],
  host_permissions: ["https://date.appworlds.cn/*"],
});
