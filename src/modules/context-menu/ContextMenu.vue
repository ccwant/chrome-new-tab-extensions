<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @click.stop
  >
    <template v-if="targetApp">
      <div
        v-if="targetApp.app.type === 'shortcut'"
        class="context-menu-item"
        @click="$emit('edit')"
      >
        编辑
      </div>
      <div class="context-menu-item" @click="$emit('delete')">删除应用</div>
    </template>
    <template v-else>
      <div class="context-menu-item" @click="$emit('add')">新增应用</div>
      <div class="context-menu-item" @click="$emit('app-center')">应用中心</div>
      <div class="context-menu-item" @click="$emit('settings')">设置</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AppItem } from "@/types";

defineProps<{
  visible: boolean;
  x: number;
  y: number;
  targetApp: { index: number; app: AppItem } | null;
}>();

defineEmits<{
  delete: [];
  edit: [];
  add: [];
  "app-center": [];
  settings: [];
}>();
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  z-index: 40;
  min-width: 140px;
  padding: 4px 0;
  border-radius: 10px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 4px 12px var(--theme-shadow);

  &-item {
    padding: 8px 14px;
    font-size: 12px;
    color: var(--theme-text);
    cursor: pointer;
    user-select: none;

    &:hover {
      background: var(--theme-hover);
    }
  }
}
</style>
