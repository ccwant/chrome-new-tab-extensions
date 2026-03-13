<template>
  <label class="switch" @click.stop>
    <input
      type="checkbox"
      :checked="modelValue"
      @change="onChange(($event.target as HTMLInputElement).checked)"
    />
    <span class="switch__slider" />
  </label>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "change", value: boolean): void;
}>();

function onChange(val: boolean) {
  emit("update:modelValue", val);
  emit("change", val);
}
</script>

<style scoped lang="scss">
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch__slider {
  position: relative;
  width: 32px;
  height: 18px;
  background-color: #d1d5db;
  border-radius: 999px;
  transition: background-color 0.2s;
}

.switch__slider::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 2px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.switch input:checked + .switch__slider {
  background-color: #22c55e;
}

.switch input:checked + .switch__slider::before {
  transform: translateX(14px);
}
</style>

