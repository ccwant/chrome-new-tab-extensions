<template>
  <div
    v-if="modelValue"
    class="modal-backdrop active"
    :style="zIndex ? { zIndex } : undefined"
    @click="handleBackdropClick"
    @contextmenu.prevent.stop
  >
    <div class="modal glass" :class="modalClass" role="dialog" @click.stop>
      <template v-if="useStructured">
        <div class="modal-header">
          <slot name="header" :close="close">
            <span v-if="title" class="modal-title">{{ title }}</span>
            <button class="modal-close" @click="close">×</button>
          </slot>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer" />
        </div>
      </template>
      <template v-else>
        <slot />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    zIndex?: number;
    title?: string;
    modalClass?: string;
  }>(),
  { zIndex: undefined, title: undefined, modalClass: "" }
);
const slots = useSlots();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const useStructured = computed(() => props.title != null || !!slots.header || !!slots.footer);

function close() {
  emit("update:modelValue", false);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.modelValue) close();
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) close();
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  z-index: 50;

  &.active {
    display: flex;
  }
}

.modal {
  border-radius: 20px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border-strong);
  box-shadow: 0 32px 90px var(--theme-shadow);
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;

  &.glass {
    position: relative;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: rgba(255, 255, 255, 0.7);

    &::before {
      position: absolute;
      left: 0px;
      top: 0px;
      z-index: -1;
      width: 100%;
      content: "";
      height: 100%;
      backdrop-filter: blur(21px);
      background-color: rgba(255, 255, 255, 0.5);
    }
  }

  &-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px;
  }

  &-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--theme-text);
  }

  &-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(148, 163, 184, 0.15);
    color: var(--theme-text-muted);
    font-size: 20px;
    border-radius: 10px;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;

    &:hover {
      background: var(--theme-hover);
      color: var(--theme-text);
    }
  }

  &-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 18px;
  }

  &-footer {
    padding: 18px;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
