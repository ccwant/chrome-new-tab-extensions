<template>
  <Dialog
    :model-value="modelValue"
    title="更换壁纸"
    modal-class="wallpaper-picker"
    :z-index="110"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="picker-inner">
      <aside class="picker-sidebar">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          {{ cat.label }}
        </div>
      </aside>
      <div class="picker-content">
        <div v-if="activeCategory === 'solid'" class="wallpaper-grid">
          <div
            v-for="(bg, idx) in WALLPAPER_BACKGROUND.solid"
            :key="'s-' + idx"
            class="wallpaper-item"
            :class="{ selected: currentType === 'solid' && currentIndex === idx }"
            :style="{ background: bg }"
            @click="select('solid', idx)"
          >
            <span v-if="currentType === 'solid' && currentIndex === idx" class="check">✓</span>
          </div>
        </div>
        <div v-else class="wallpaper-grid">
          <div
            v-for="(url, idx) in imageUrls"
            :key="'i-' + idx"
            class="wallpaper-item wallpaper-item--image"
            :class="{ selected: currentType === 'image' && currentIndex === idx }"
            :style="{ backgroundImage: `url(${url})` }"
            @click="select('image', idx)"
          >
            <span v-if="currentType === 'image' && currentIndex === idx" class="check">✓</span>
          </div>
          <div v-if="imageUrls.length === 0" class="empty-hint">
            将图片放入 <code>public/wallpapers</code> 文件夹
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { WALLPAPER_BACKGROUND } from "@/config";
import { getWallpaperImageUrls } from "@/wallpapers";
import Dialog from "@/components/Dialog/index.vue";
import { WallpaperType } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  currentType: WallpaperType;
  currentIndex: number;
}>();

watch(
  () => props.modelValue,
  (v) => {
    if (v) activeCategory.value = props.currentType;
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "select", type: WallpaperType, index: number): void;
}>();

const categories = [
  { id: "solid" as const, label: "纯色" },
  { id: "image" as const, label: "图片" },
];

const activeCategory = ref<"solid" | "image">("solid");

const imageUrls = getWallpaperImageUrls();

function close() {
  emit("update:modelValue", false);
}

function select(type: WallpaperType, index: number) {
  emit("select", type, index);
  close();
}
</script>

<style lang="scss">
.modal.wallpaper-picker {
  width: 640px;
  max-width: 640px;
  max-height: 75vh;
  padding: 0;
}
</style>

<style lang="scss" scoped>
.picker-inner {
  flex: 1;
  height: 75vh;
  display: flex;
  overflow: hidden;
}

.picker-sidebar {
  flex-shrink: 0;
  width: 100px;
  border-right: 1px solid var(--theme-border);
  padding: 12px 0;
}

.category-item {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--theme-text);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--theme-hover);
  }

  &.active {
    background: var(--theme-accent-bg);
    color: var(--theme-accent-solid);
  }
}

.picker-content {
  flex: 1;
  min-height: 0;
  padding: 20px;
  overflow-y: auto;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wallpaper-item {
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 3px solid transparent;
    border-radius: 12px;
    pointer-events: none;
  }

  &:hover {
    transform: scale(1.02);
  }

  &.selected::after {
    border-color: var(--theme-accent-solid);
  }

  &--image {
    background-size: cover;
    background-position: center;
  }

  .check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--theme-accent-solid);
    color: white;
    border-radius: 50%;
    font-size: 14px;
  }
}

.empty-hint {
  grid-column: 1 / -1;
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--theme-text-muted);

  code {
    background: var(--theme-hover);
    padding: 2px 6px;
    border-radius: 4px;
  }
}
</style>
