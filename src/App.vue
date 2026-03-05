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
        addModalPreferredIndex = contextMenu.targetIndex;
        hideContextMenu();
      "
      @app-center="
        appCenterVisible = true;
        appCenterPreferredIndex = contextMenu.targetIndex;
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
      :preferred-index="addModalPreferredIndex"
      :add-app="addApp"
      :update-app="updateApp"
      :show-toast="showToast"
    />
    <AppCenter
      :model-value="appCenterVisible"
      @update:model-value="appCenterVisible = $event"
      :preferred-index="appCenterPreferredIndex"
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
import { DEFAULT_APPS, STORAGE_KEY, MAX_APPS, GRID_COLS, GRID_ROWS } from "./config";
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
const addModalPreferredIndex = ref<number | null>(null);
const appCenterPreferredIndex = ref<number | null>(null);
const appCenterVisible = ref(false);
const settingsDrawerVisible = ref(false);
const contextMenu = reactive<{
  visible: boolean;
  x: number;
  y: number;
  targetIndex: number | null;
  targetApp: { index: number; app: AppItem } | null;
}>({ visible: false, x: 0, y: 0, targetIndex: null, targetApp: null });
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
  if (i < 0 || i >= MAX_APPS) return true;
  if (apps.value[i]) return true;
  for (let j = 0; j < apps.value.length; j++) {
    const prev = apps.value[j];
    if (!prev) continue;
    const pw = prev.width || 1;
    const ph = prev.height || 1;
    for (let r = 0; r < ph; r++) {
      for (let c = 0; c < pw; c++) {
        if (j + r * GRID_COLS + c === i) return true;
      }
    }
  }
  return false;
}

function canPlaceAt(i: number, w: number, h: number): boolean {
  const col = i % GRID_COLS;
  const row = Math.floor(i / GRID_COLS);
  if (col + w > GRID_COLS || row + h > GRID_ROWS) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (isCellOccupied(i + r * GRID_COLS + c)) return false;
    }
  }
  return true;
}

/** 从 center 开始向外扩展，生成候选索引（按切比雪夫距离由近到远） */
function* candidatesAround(center: number): Generator<number> {
  const centerRow = Math.floor(center / GRID_COLS);
  const centerCol = center % GRID_COLS;
  const maxRadius = Math.max(centerRow, GRID_ROWS - 1 - centerRow, centerCol, GRID_COLS - 1 - centerCol);
  for (let r = 0; r <= maxRadius; r++) {
    for (let row = Math.max(0, centerRow - r); row <= Math.min(GRID_ROWS - 1, centerRow + r); row++) {
      for (let col = Math.max(0, centerCol - r); col <= Math.min(GRID_COLS - 1, centerCol + r); col++) {
        if (Math.max(Math.abs(row - centerRow), Math.abs(col - centerCol)) === r) {
          yield row * GRID_COLS + col;
        }
      }
    }
  }
}

function addApp(payload: AddAppPayload): boolean {
  const { name, url, iconDataUrl, iconUrl, type, widgetId, width, height, preferredIndex } = payload;
  const appDef = type === "widget" || type === "app" ? APPS.find((a) => a.id === widgetId) : null;
  const w = (type === "widget" || type === "app") && appDef ? (appDef.width ?? width ?? 1) : (width ?? 1);
  const h = height ?? appDef?.height ?? 1;

  if (apps.value.filter(Boolean).length >= MAX_APPS) {
    showToast("已达到 100 个应用上限");
    return false;
  }

  let idx = -1;
  if (typeof preferredIndex === "number") {
    for (const i of candidatesAround(preferredIndex)) {
      if (canPlaceAt(i, w, h)) {
        idx = i;
        break;
      }
    }
  }
  if (idx === -1) {
    for (let i = 0; i < MAX_APPS; i++) {
      if (canPlaceAt(i, w, h)) {
        idx = i;
        break;
      }
    }
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
    height: h,
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
  // if (!confirm("确定要删除该应用吗？")) return;
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
  contextMenu.targetIndex = index;
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
  contextMenu.targetIndex = null;
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
