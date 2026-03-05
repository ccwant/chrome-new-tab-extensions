<template>
  <div v-if="visible" class="toast visible">
    <span class="toast-dot" />
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  text: string;
}>();
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 12px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 8px 24px var(--theme-shadow);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--theme-text);
  z-index: 60;
  opacity: 0;
  transition: opacity 0.2s;

  &.visible {
    opacity: 1;
  }

  &-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--theme-accent);
  }
}
</style>
