<template>
  <div class="bookmarks-card-click" @click="modalVisible = true">
    <div class="app-icon-wrapper">书</div>
    <div class="app-name">{{ name || "书签" }}</div>
  </div>
  <BookmarksModal
    :model-value="modalVisible"
    @update:model-value="modalVisible = $event"
    :add-app="addApp"
    :show-toast="showToast"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import BookmarksModal from "./BookmarksModal.vue";

withDefaults(
  defineProps<{
    name?: string;
    addApp?: ((p: Record<string, unknown>) => boolean) | null;
    showToast?: ((msg: string) => void) | null;
  }>(),
  { name: "书签", addApp: null, showToast: null }
);

const modalVisible = ref(false);
</script>

<style lang="scss" scoped>
.bookmarks-card-click {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  justify-content: center;
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
  .app-name {
    width: 100%;
    font-size: 11px;
    color: var(--theme-app-color);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>
