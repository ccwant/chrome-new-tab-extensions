<template>
  <section class="apps-card">
    <div class="grid-wrapper">
      <div
        ref="gridEl"
        class="apps-grid"
        :class="{ dragging: dragState.fromIndex !== null }"
        :style="{
          width: gridSize.width + 'px',
          height: gridSize.height + 'px',
          minWidth: gridSize.width + 'px',
          minHeight: gridSize.height + 'px',
        }"
      >
        <div
          v-for="(_, idx) in GRID_INDICES"
          :key="idx"
          :class="[
            'app-cell',
            apps[idx]?.width === 2 ? 'app-cell-span-2' : '',
            apps[idx]?.width === 3 ? 'app-cell-span-3' : '',
            apps[idx]?.width === 4 ? 'app-cell-span-4' : '',
            apps[idx]?.width === 5 ? 'app-cell-span-5' : '',
            apps[idx]?.width === 6 ? 'app-cell-span-6' : '',
            apps[idx]?.height === 2 ? 'app-cell-row-span-2' : '',
            isCellCovered(idx) ? 'app-cell-covered' : '',
          ]"
          @contextmenu="(e) => $emit('contextmenu', e, idx, apps[idx])"
          @dragover="onDragover"
          @drop="onDrop"
        >
          <div
            v-if="apps[idx]"
            class="app-card"
            :class="{ dragging: dragState.fromIndex === idx }"
            draggable="true"
            @click="apps[idx]!.type !== 'widget' ? $emit('app-click', apps[idx]!) : undefined"
            @dragstart="(e) => onDragStart(e, idx)"
            @dragend="onDragEnd"
          >
            <component
              v-if="
                apps[idx]!.widgetId && APPS.find((a) => a.id === apps[idx]!.widgetId)?.component
              "
              :is="APPS.find((a) => a.id === apps[idx]!.widgetId)!.component"
              :app="apps[idx]!"
              :name="apps[idx]!.name"
              :add-app="addApp"
              :show-toast="showToast"
            />
            <template v-else>
              <div class="app-icon-wrapper">
                <img
                  v-if="apps[idx]!.iconDataUrl || apps[idx]!.iconUrl"
                  class="app-icon"
                  :src="apps[idx]!.iconDataUrl || apps[idx]!.iconUrl"
                  :alt="apps[idx]!.name"
                />
                <div v-else class="app-initial">
                  {{ (apps[idx]!.name || "A").charAt(0).toUpperCase() }}
                </div>
              </div>
              <div class="app-name">{{ apps[idx]!.name || "应用" }}</div>
            </template>
          </div>
          <div v-else class="app-card app-ghost" />
        </div>
      </div>
      <div
        v-if="dragState.previewIndex !== null && gridEl"
        class="app-cell-preview-overlay"
        :style="previewOverlayStyle"
      />
      <div class="grid-fade" />
      <div class="empty-hint" :style="{ display: isEmpty ? 'flex' : 'none' }" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { APPS } from "../apps/apps";
import { MAX_APPS, GRID_COLS, GRID_ROWS } from "@/config";
import type { AppItem, AddAppPayload } from "@/types";

const GRID_INDICES = Array.from({ length: MAX_APPS }, (_, i) => i);

const props = defineProps<{
  apps: (AppItem | null)[];
  addApp: (payload: AddAppPayload) => boolean;
  showToast: (message: string) => void;
}>();

const emit = defineEmits<{
  "update:apps": [apps: (AppItem | null)[]];
  contextmenu: [e: MouseEvent, index: number, app: AppItem | null];
  "app-click": [app: AppItem];
}>();

const gridSize = ref({
  width: 0,
  height: 0,
});
const gridEl = ref<HTMLElement | null>(null);
const dragState = reactive<{
  fromIndex: number | null;
  offsetX: number;
  offsetY: number;
  previewIndex: number | null;
  previewWidth: number;
  previewHeight: number;
}>({
  fromIndex: null,
  offsetX: 0,
  offsetY: 0,
  previewIndex: null,
  previewWidth: 1,
  previewHeight: 1,
});

const appCount = computed(() => props.apps.filter(Boolean).length);
const isEmpty = computed(() => appCount.value === 0);

function isCellOccupied(i: number): boolean {
  if (props.apps[i]) return true;
  for (let j = 0; j < props.apps.length; j++) {
    const prev = props.apps[j];
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

function isCellCovered(i: number): boolean {
  for (let j = 0; j < props.apps.length; j++) {
    const prev = props.apps[j];
    if (!prev) continue;
    const pw = prev.width || 1;
    const ph = prev.height || 1;
    if (ph <= 1 && pw <= 1) continue;
    for (let r = 0; r < ph; r++) {
      for (let c = 0; c < pw; c++) {
        if (r === 0 && c === 0) continue;
        if (j + r * GRID_COLS + c === i) return true;
      }
    }
  }
  return false;
}

function getIndexFromPosition(clientX: number, clientY: number): number | null {
  if (!gridEl.value) return null;
  const rect = gridEl.value.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const iconLeft = clientX - dragState.offsetX + 10;
  const iconTop = clientY - dragState.offsetY + 10;
  const x = iconLeft - rect.left;
  const y = iconTop - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor((x / rect.width) * GRID_COLS)));
  const row = Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((y / rect.height) * GRID_ROWS)));
  return row * GRID_COLS + col;
}

function canDropAt(targetIndex: number, moved: AppItem): boolean {
  const w = moved.width || 1;
  const h = moved.height || 1;
  const fromIndex = dragState.fromIndex!;
  // 计算当前正在拖拽组件自身占用的所有格子索引，用于在拖拽判断时排除自身
  const selfIndices = new Set<number>();
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      selfIndices.add(fromIndex + r * GRID_COLS + c);
    }
  }
  const isAvailable = (i: number) => !isCellOccupied(i) || selfIndices.has(i);
  const col = targetIndex % GRID_COLS;
  const row = Math.floor(targetIndex / GRID_COLS);
  if (w === 2 && col > GRID_COLS - 2) return false;
  if (w === 3 && col > GRID_COLS - 3) return false;
  if (h === 2 && row > GRID_ROWS - 2) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const idx = targetIndex + r * GRID_COLS + c;
      if (!isAvailable(idx)) return false;
    }
  }
  return true;
}

function onDragStart(e: DragEvent, index: number) {
  const card = e.currentTarget as HTMLElement;
  const rect = card.getBoundingClientRect();
  dragState.fromIndex = index;
  dragState.offsetX = e.clientX - rect.left;
  dragState.offsetY = e.clientY - rect.top;
  dragState.previewIndex = null;
  dragState.previewWidth = 1;
  dragState.previewHeight = 1;
}

function onDragEnd() {
  dragState.fromIndex = null;
  dragState.previewIndex = null;
}

function onDragover(e: DragEvent) {
  if (dragState.fromIndex === null) return;
  const targetIndex = getIndexFromPosition(e.clientX, e.clientY);
  if (targetIndex === null) {
    dragState.previewIndex = null;
    return;
  }
  const moved = props.apps[dragState.fromIndex];
  if (!moved || !canDropAt(targetIndex, moved)) {
    dragState.previewIndex = null;
    return;
  }
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
  dragState.previewIndex = targetIndex;
  dragState.previewWidth = moved.width || 1;
  dragState.previewHeight = moved.height || 1;
}

function onDrop(e: DragEvent) {
  if (dragState.fromIndex === null) return;
  e.preventDefault();
  const targetIndex = getIndexFromPosition(e.clientX, e.clientY);
  if (targetIndex === null || targetIndex === dragState.fromIndex) {
    dragState.fromIndex = null;
    dragState.previewIndex = null;
    return;
  }
  const moved = props.apps[dragState.fromIndex];
  if (!moved || !canDropAt(targetIndex, moved)) {
    dragState.fromIndex = null;
    dragState.previewIndex = null;
    return;
  }
  const next = [...props.apps];
  next[targetIndex] = moved;
  next[dragState.fromIndex] = null;
  dragState.fromIndex = null;
  dragState.previewIndex = null;
  emit("update:apps", next);
}

const previewOverlayStyle = computed(() => {
  if (dragState.previewIndex === null || !gridEl.value) return {};
  const w = dragState.previewWidth || 1;
  const h = dragState.previewHeight || 1;
  const col = dragState.previewIndex % GRID_COLS;
  const row = Math.floor(dragState.previewIndex / GRID_COLS);
  const rect = gridEl.value.getBoundingClientRect();
  const wrapper = gridEl.value.parentElement?.getBoundingClientRect();
  if (!rect.width || !rect.height || !wrapper) return {};
  const cellW = rect.width / GRID_COLS;
  const cellH = rect.height / GRID_ROWS;
  const left = rect.left - wrapper.left + col * cellW;
  const top = rect.top - wrapper.top + row * cellH;
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${cellW * w}px`,
    height: `${cellH * h}px`,
  };
});

function updateGridSize() {
  const height = window.outerHeight - 87 - 20;
  // const cellSite = height / GRID_ROWS;
  const cellSite = 76;
  gridSize.value = {
    width: cellSite * GRID_COLS,
    height: cellSite * GRID_ROWS,
  };
}

onMounted(() => {
  updateGridSize();
  window.addEventListener("resize", updateGridSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateGridSize);
});
</script>

<style lang="scss" scoped>
.apps-card {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.grid-wrapper {
  position: relative;
}

.apps-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(v-bind(GRID_COLS), 1fr);
  grid-template-rows: repeat(v-bind(GRID_ROWS), 1fr);
  gap: 0;
  margin: 10px auto;
  z-index: 1;

  &.dragging::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, var(--theme-grid-border) 1px, transparent 1px),
      linear-gradient(to bottom, var(--theme-grid-border) 1px, transparent 1px);
    background-size:
      calc(100% / v-bind(GRID_COLS)) 100%,
      100% calc(100% / v-bind(GRID_ROWS));
    border-right: 1px solid var(--theme-grid-border);
    border-bottom: 1px solid var(--theme-grid-border);
    opacity: 0.9;
  }
}

.app-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.app-cell-preview-overlay {
  position: absolute;
  pointer-events: none;
  border: 2px solid var(--theme-accent);
  border-radius: 4px;
  z-index: 2;
}

.app-cell-span-2 {
  grid-column: span 2;

  & + .app-cell {
    display: none;
  }
}

.app-cell-span-3 {
  grid-column: span 3;

  & + .app-cell,
  & + .app-cell + .app-cell {
    display: none;
  }
}

.app-cell-span-4 {
  grid-column: span 4;

  & + .app-cell,
  & + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell {
    display: none;
  }
}

.app-cell-span-5 {
  grid-column: span 5;

  & + .app-cell,
  & + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell + .app-cell {
    display: none;
  }
}

.app-cell-span-6 {
  grid-column: span 6;

  & + .app-cell,
  & + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell + .app-cell,
  & + .app-cell + .app-cell + .app-cell + .app-cell + .app-cell {
    display: none;
  }
}

.app-cell-row-span-2 {
  grid-row: span 2;
}

.app-cell-covered {
  display: none;
}

.app-card {
  width: 100%;
  height: 100%;
  border-radius: 0;
  padding: 8px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  text-align: center;
  user-select: none;

  &.dragging {
    opacity: 0.8;
    transform: scale(1.03);
  }

  &-widget {
    justify-content: center;
  }
}

.app-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme-icon-bg);
}

.app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-initial {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-icon-text);
}

.app-name {
  width: 100%;
  font-size: 11px;
  color: var(--theme-app-color);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.app-ghost {
  opacity: 0;
  border: none;
  background: transparent;
}

.empty-hint {
  display: none;
}
</style>
