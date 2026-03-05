<template>
  <div class="icon-upload">
    <div
      v-for="(url, idx) in modelValue"
      :key="idx"
      class="icon-item"
    >
      <img :src="url" alt="" class="icon-preview" />
      <button type="button" class="icon-delete" @click="remove(idx)">×</button>
    </div>
    <div
      v-if="showAdd"
      class="icon-add"
      @click="triggerFileInput"
    >
      +
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="icon-input-hidden"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    limit?: number;
  }>(),
  { limit: 1 }
);

const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const showAdd = computed(() => props.modelValue.length < props.limit);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target?.result as string;
    if (dataUrl) {
      const next = [...props.modelValue, dataUrl].slice(0, props.limit);
      emit("update:modelValue", next);
    }
  };
  reader.readAsDataURL(file);
}

function remove(idx: number) {
  const next = props.modelValue.filter((_, i) => i !== idx);
  emit("update:modelValue", next);
}
</script>

<style lang="scss" scoped>
.icon-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-item {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;

  .icon-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .icon-delete {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0;

    &:hover {
      background: rgba(220, 38, 38, 0.9);
    }
  }

  &:hover .icon-delete {
    opacity: 1;
  }
}

.icon-add {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 2px dashed var(--theme-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--theme-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: var(--theme-accent-solid);
    color: var(--theme-accent-solid);
  }
}

.icon-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
