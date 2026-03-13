<template>
  <div class="wallpaper" />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useThemeSettings } from "@/composables/useThemeSettings";
import { getWallpaperImageUrls } from "@/wallpapers";

const { applyToDOM } = useThemeSettings(getWallpaperImageUrls);

onMounted(() => {
  applyToDOM();
});
</script>

<style lang="scss" scoped>
.wallpaper {
  position: absolute;
  background: var(--wall-background);
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  transition:
    background 0.3s,
    transform 0.3s,
    height 0.3s;
  background-size: cover;
  background-position: 50%;
  z-index: 0;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(var(--wall-blur));
    background-color: rgba(0, 0, 0, var(--wall-mask));
  }
}
</style>
