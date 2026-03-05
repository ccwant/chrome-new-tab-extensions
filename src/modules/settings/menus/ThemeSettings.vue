<template>
  <div class="theme-settings">
    <div class="field">
      <label class="field-label">遮罩浓度</label>
      <div class="slider-row">
        <input
          v-model.number="settings.maskOpacity"
          type="range"
          min="0"
          max="0.9"
          step="0.05"
          class="slider"
        />
        <span class="slider-value">{{ Math.round(settings.maskOpacity * 100) }}%</span>
      </div>
    </div>
    <div class="field">
      <label class="field-label">模糊度</label>
      <div class="slider-row">
        <input
          v-model.number="settings.blur"
          type="range"
          min="0"
          max="20"
          step="1"
          class="slider"
        />
        <span class="slider-value">{{ settings.blur }}px</span>
      </div>
    </div>
    <div class="field">
      <label class="field-label">壁纸</label>
      <div
        class="wallpaper-preview"
        :style="{ background: previewBackground }"
        @click="$emit('open-wallpaper-picker')"
      >
        <span class="wallpaper-preview-btn">更换壁纸</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useThemeSettings } from "@/composables/useThemeSettings";
import { getWallpaperImageUrls } from "@/wallpapers";

defineEmits<{ (e: "open-wallpaper-picker"): void }>();

const { settings, applyToDOM, getWallpaperBackground } = useThemeSettings(getWallpaperImageUrls);

const previewBackground = computed(() => getWallpaperBackground(getWallpaperImageUrls()));

watch(settings, () => applyToDOM(), { deep: true });
</script>

<style lang="scss" scoped>
.theme-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--theme-text);
    margin-bottom: 8px;
  }
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--theme-border);
  border-radius: 3px;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--theme-accent-solid);
    cursor: pointer;
  }
}

.slider-value {
  font-size: 12px;
  color: var(--theme-text-muted);
  min-width: 36px;
}

.wallpaper-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;

  &:hover .wallpaper-preview-btn {
    background: rgba(0, 0, 0, 0.5);
  }
}

.wallpaper-preview-btn {
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 5px;
  color: white;
  background: rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition: background 0.2s;
}
</style>
