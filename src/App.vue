<template>
  <div class="page" @contextmenu="onDesktopContextMenu">
    <AppGrid
      :apps="apps"
      :add-app="addApp"
      :show-toast="showToast"
      @update:apps="onAppsUpdate"
      @contextmenu="onAppContextMenu"
      @app-click="onAppClick"
    />

    <ContextMenu
      :visible="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :target-app="contextMenu.targetApp"
      @delete="deleteApp"
      @edit="openEditModal"
      @add="
        addModalVisible = true;
        editAppTarget = null;
        hideContextMenu();
      "
      @app-center="
        appCenterVisible = true;
        hideContextMenu();
      "
      @settings="
        settingsDrawerVisible = true;
        hideContextMenu();
      "
    />

    <AddModal
      :model-value="addModalVisible"
      @update:model-value="addModalVisible = $event"
      :edit-app="editAppTarget"
      :add-app="addApp"
      :update-app="updateApp"
      :show-toast="showToast"
    />
    <AppCenter
      :model-value="appCenterVisible"
      @update:model-value="appCenterVisible = $event"
      :add-app="addApp"
      :show-toast="showToast"
    />
    <Toast :visible="toast.visible" :text="toast.text" />
    <SettingsDrawer v-model="settingsDrawerVisible" />

    <Wallpaper />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { APPS } from "./modules/apps/apps";
import { DEFAULT_APPS, STORAGE_KEY, MAX_APPS } from "./config";
import AddModal from "./modules/add/AddModal.vue";
import AppCenter from "./modules/app-center/AppCenter.vue";
import AppGrid from "./modules/grid/AppGrid.vue";
import ContextMenu from "./modules/context-menu/ContextMenu.vue";
import Toast from "./components/Toast.vue";
import SettingsDrawer from "./modules/settings/SettingsDrawer.vue";
import type { AppItem, AddAppPayload } from "./types";
import Wallpaper from "./modules/wallpaper/index.vue";

const apps = ref<(AppItem | null)[]>(new Array(MAX_APPS).fill(null));
const addModalVisible = ref(false);
const editAppTarget = ref<{ index: number; app: AppItem } | null>(null);
const appCenterVisible = ref(false);
const settingsDrawerVisible = ref(false);
const contextMenu = reactive<{
  visible: boolean;
  x: number;
  y: number;
  targetApp: { index: number; app: AppItem } | null;
}>({ visible: false, x: 0, y: 0, targetApp: null });
const toast = reactive({ visible: false, text: "" });

function showToast(message: string) {
  toast.text = message;
  toast.visible = true;
  setTimeout(() => (toast.visible = false), 2200);
}

function onAppsUpdate(newApps: (AppItem | null)[]) {
  apps.value = newApps;
  saveApps();
}

function loadApps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const items = Array.isArray(parsed) ? parsed : [];

    if (items.length === 0) {
      DEFAULT_APPS.forEach((d) => {
        const app = APPS.find((a) => a.id === d.widgetId);
        if (!app) return;
        apps.value[d.index] = {
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          name: app.name,
          url: app.url || "",
          iconDataUrl: app.iconDataUrl || "",
          type: app.type as AppItem["type"],
          widgetId: app.id,
          width: app.width || 1,
          height: app.height || 1,
        };
      });
      saveApps();
      return;
    }

    const next = new Array(MAX_APPS).fill(null) as (AppItem | null)[];
    items.forEach((item: Record<string, unknown>) => {
      if (!item) return;
      const idx =
        typeof item.index === "number" && item.index >= 0 && item.index < MAX_APPS
          ? item.index
          : -1;
      if (idx >= 0) {
        next[idx] = {
          id: item.id as string,
          name: item.name as string,
          url: (item.url as string) || "",
          iconDataUrl: (item.iconDataUrl as string) || "",
          iconUrl: item.iconUrl as string | undefined,
          type: (item.type as AppItem["type"]) || "shortcut",
          widgetId: (item.widgetId as string | null) || null,
          width: (item.width as number) || 1,
          height: (item.height as number) || 1,
        };
      }
    });
    apps.value = next;
  } catch (e) {
    console.error("Failed to load apps", e);
  }
}

function saveApps() {
  const toSave = apps.value.map((app, index) => (app ? { ...app, index } : null)).filter(Boolean);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save apps", e);
  }
}

function isCellOccupied(i: number): boolean {
  if (apps.value[i]) return true;
  for (let j = 0; j < i; j++) {
    const prev = apps.value[j];
    if (!prev) continue;
    const pw = prev.width || 1;
    if (pw > 1 && j + pw > i) return true;
  }
  return false;
}

function addApp(payload: AddAppPayload): boolean {
  const { name, url, iconDataUrl, iconUrl, type, widgetId, height } = payload;
  const appDef = type === "widget" || type === "app" ? APPS.find((a) => a.id === widgetId) : null;
  const w = appDef && (appDef.width === 2 || appDef.width === 3) ? appDef.width! : 1;

  if (apps.value.filter(Boolean).length >= MAX_APPS) {
    showToast("已达到 100 个应用上限");
    return false;
  }

  let idx = -1;
  if (w === 2) {
    for (let i = 0; i < MAX_APPS - 1; i++) {
      if (isCellOccupied(i) || isCellOccupied(i + 1)) continue;
      if (i % 10 > 8) continue;
      idx = i;
      break;
    }
  } else if (w === 3) {
    for (let i = 0; i < MAX_APPS - 2; i++) {
      if (isCellOccupied(i) || isCellOccupied(i + 1) || isCellOccupied(i + 2)) continue;
      if (i % 10 > 7) continue;
      idx = i;
      break;
    }
  } else {
    idx = apps.value.findIndex((a, i) => {
      if (a) return false;
      for (let j = 0; j < i; j++) {
        const prev = apps.value[j];
        if (!prev) continue;
        const pw = prev.width || 1;
        if (pw > 1 && j + pw > i) return false;
      }
      return true;
    });
  }
  if (idx === -1) {
    showToast("已达到 100 个应用上限");
    return false;
  }

  const next = [...apps.value];
  next[idx] = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
    url: url || "",
    iconDataUrl: iconDataUrl || "",
    iconUrl: iconUrl || "",
    type: (type as AppItem["type"]) || "shortcut",
    widgetId: widgetId || null,
    width: w,
    height: height || 1,
  };
  apps.value = next;
  saveApps();
  return true;
}

function removeApp(index: number) {
  const next = [...apps.value];
  next[index] = null;
  apps.value = next;
  saveApps();
}

function updateApp(index: number, payload: AddAppPayload) {
  const app = apps.value[index];
  if (!app) return;
  const next = [...apps.value];
  next[index] = {
    ...app,
    name: payload.name ?? app.name,
    url: payload.url ?? app.url,
    iconDataUrl: payload.iconDataUrl ?? app.iconDataUrl,
    iconUrl: payload.iconUrl ?? app.iconUrl,
  };
  apps.value = next;
  saveApps();
}

function openEditModal() {
  const { targetApp } = contextMenu;
  if (targetApp?.app.type === "shortcut") {
    editAppTarget.value = targetApp;
    addModalVisible.value = true;
  }
  hideContextMenu();
}

function deleteApp() {
  const { index } = contextMenu.targetApp ?? {};
  if (index == null) return;
  if (!confirm("确定要删除该应用吗？")) return;
  removeApp(index);
  hideContextMenu();
  showToast("已删除");
}

function onAppContextMenu(e: MouseEvent, index: number, app: AppItem | null) {
  e.preventDefault();
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  if (app) contextMenu.targetApp = { index, app };
  else contextMenu.targetApp = null;
}

function onAppClick(app: AppItem) {
  if (app.type !== "shortcut") return;
  if (!app.url) {
    showToast("该应用还没有配置链接");
    return;
  }
  const url = /^https?:\/\//i.test(app.url) ? app.url : "https://" + app.url;
  window.open(url, "_blank", "noopener,noreferrer");
}

function onDesktopContextMenu(e: MouseEvent) {
  if (
    (e.target as Element).closest(".modal-backdrop") ||
    (e.target as Element).closest(".context-menu") ||
    (e.target as Element).closest(".drawer-backdrop")
  ) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.targetApp = null;
}

function hideContextMenu() {
  contextMenu.visible = false;
}

onMounted(() => {
  loadApps();
  document.addEventListener("click", hideContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("click", hideContextMenu);
});
</script>
<style lang="scss" scoped>
.page {
  height: 100vh;
  width: 100vw;
  cursor: default;
}
</style>
