<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="drawer-backdrop"
        :class="{ 'drawer-backdrop--no-mask': !mask }"
        @click="$emit('update:modelValue', false)"
      >
        <div class="drawer-panel" :style="{ width: width }" @click.stop>
          <div v-if="$slots.header || title" class="drawer-header">
            <slot name="header">
              <span class="drawer-title">{{ title }}</span>
              <button class="drawer-close" @click="$emit('update:modelValue', false)">×</button>
            </slot>
          </div>
          <div class="drawer-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string;
    mask?: boolean;
  }>(),
  { title: "", width: "420px", mask: true }
);

defineEmits<{ (e: "update:modelValue", v: boolean): void }>();
</script>

<style lang="scss" scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  justify-content: flex-end;

  &--no-mask {
    background: transparent;
  }
}

.drawer-panel {
  max-width: 100vw;
  height: 100%;
  background: var(--theme-surface);
  border-left: 1px solid var(--theme-border);
  box-shadow: -4px 0 24px var(--theme-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--theme-border);
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text);
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--theme-text-muted);
  font-size: 20px;
  cursor: pointer;
  border-radius: 8px;

  &:hover {
    background: var(--theme-hover);
    color: var(--theme-text);
  }
}

.drawer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s;

  .drawer-panel {
    transition: transform 0.25s ease;
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  .drawer-panel {
    transform: translateX(100%);
  }
}
</style>
