<template>
  <Drawer v-model="modelValue" title="设置" :mask="false">
    <div class="drawer-body-inner">
      <aside class="drawer-left">
        <div
          v-for="item in menuItems"
          :key="item.id"
          class="menu-item"
          :class="{ active: activeMenu === item.id }"
          @click="activeMenu = item.id"
        >
          {{ item.label }}
        </div>
      </aside>
      <main class="drawer-right">
        <ThemeSettings
          v-if="activeMenu === 'theme'"
          @open-wallpaper-picker="wallpaperDialogVisible = true"
        />
        <ChangelogSettings v-else-if="activeMenu === 'changelog'" />
        <AboutSettings v-else-if="activeMenu === 'about'" />
      </main>
    </div>
  </Drawer>

  <WallpaperPickerDialog
    v-model="wallpaperDialogVisible"
    :current-type="settings.wallpaperType"
    :current-index="settings.wallpaperIndex"
    @select="onWallpaperSelect"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import Drawer from "@/components/Drawer/index.vue";
import { useThemeSettings } from "@/composables/useThemeSettings";
import ThemeSettings from "./menus/ThemeSettings.vue";
import ChangelogSettings from "./menus/ChangelogSettings.vue";
import AboutSettings from "./menus/AboutSettings.vue";
import WallpaperPickerDialog from "./WallpaperPickerDialog.vue";

const modelValue = defineModel<boolean>({ default: false });

const menuItems = [
  { id: "theme", label: "主题设置" },
  { id: "changelog", label: "更新日志" },
  { id: "about", label: "关于" },
];
const activeMenu = ref("theme");
const wallpaperDialogVisible = ref(false);

const { settings } = useThemeSettings();

function onWallpaperSelect(type: "solid" | "image", index: number) {
  settings.value.wallpaperType = type;
  settings.value.wallpaperIndex = index;
}
</script>

<style lang="scss" scoped>
.drawer-body-inner {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.drawer-left {
  width: 140px;
  flex-shrink: 0;
  border-right: 1px solid var(--theme-border);
  padding: 12px 0;
}

.menu-item {
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

.drawer-right {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
</style>
