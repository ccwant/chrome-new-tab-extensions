<template>
  <div class="popover-trigger" ref="triggerEl">
    <slot />
  </div>
  <Teleport v-if="appendToBody" to="body">
    <div v-if="modelValue" class="popover-overlay" :style="overlayStyle" @click.stop>
      <slot name="content" />
    </div>
  </Teleport>
  <div
    v-else
    v-if="modelValue"
    class="popover-overlay popover-overlay--inline"
    :class="[`popover--${placement}`]"
    @click.stop
  >
    <slot name="content" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
    appendToBody?: boolean;
    offset?: number;
  }>(),
  {
    placement: "bottom-start",
    appendToBody: false,
    offset: 4,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

const triggerEl = ref<HTMLElement | null>(null);
const overlayStyle = ref<Record<string, string>>({});

function updatePosition() {
  if (!props.appendToBody || !triggerEl.value) return;
  const rect = triggerEl.value.getBoundingClientRect();
  const style: Record<string, string> = { position: "fixed" };
  const offset = props.offset;
  if (props.placement === "bottom-start" || props.placement === "bottom-end") {
    style.top = `${rect.bottom + offset}px`;
  } else {
    style.top = `${rect.top - offset}px`;
  }
  if (props.placement.endsWith("start")) {
    style.left = `${rect.left}px`;
  } else {
    style.left = `${rect.right}px`;
    style.transform = "translateX(-100%)";
  }
  overlayStyle.value = style;
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      document.addEventListener("click", onClickOutside);
    } else {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("click", onClickOutside);
    }
  }
);

onMounted(() => {
  if (props.modelValue) updatePosition();
});

onUnmounted(() => {
  window.removeEventListener("resize", updatePosition);
  window.removeEventListener("scroll", updatePosition, true);
  document.removeEventListener("click", onClickOutside);
});

function onClickOutside(e: MouseEvent) {
  if (triggerEl.value && triggerEl.value.contains(e.target as Node)) return;
  emit("update:modelValue", false);
}
</script>

<style lang="scss" scoped>
.popover-trigger {
  display: inline-flex;
}

.popover-overlay {
  min-width: 120px;
  background: var(--theme-surface);
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
  padding: 4px 0;
  z-index: 80;
}

.popover-overlay--inline {
  position: absolute;
}

.popover--bottom-start {
  transform: translateY(4px);
}

.popover--bottom-end {
  right: 0;
  transform: translateY(4px);
}

.popover--top-start {
  bottom: 100%;
  transform: translateY(-4px);
}

.popover--top-end {
  bottom: 100%;
  right: 0;
  transform: translateY(-4px);
}
</style>

