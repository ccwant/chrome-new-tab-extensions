<template>
  <Dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="app-center">
      <div class="app-center-header">
        <button
          v-if="selectedApp"
          type="button"
          class="app-center-back"
          aria-label="返回"
          @click="selectedApp = null"
        >
          ←
        </button>
        <div v-else class="app-center-title">应用中心</div>
        <button type="button" class="app-center-close" aria-label="关闭" @click="close">×</button>
      </div>
      <AppCenterDetail
        v-if="selectedApp"
        :app="selectedApp"
        :add-app="addApp"
        :show-toast="showToast"
        :on-add-success="close"
      />
      <template v-else>
        <div class="app-center-desc">添加小组件到桌面网格</div>
        <div class="app-center-grid">
          <div
            v-for="app in APPS"
            :key="app.id"
            class="app-center-card"
            role="button"
            tabindex="0"
            @click="selectedApp = app"
            @keydown.enter.space.prevent="selectedApp = app"
          >
            <div class="app-center-card-icon">{{ getAppIcon(app) }}</div>
            <div class="app-center-card-name">{{ app.name }}</div>
          </div>
        </div>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import Dialog from "@/components/Dialog/index.vue";
import AppCenterDetail from "./AppCenterDetail.vue";
import { getAppIcon } from "./utils";
import { APPS } from "@/modules/apps/apps";
import type { AppDef } from "@/types";

import type { AddAppPayload } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  addApp: (p: AddAppPayload) => boolean;
  showToast: (msg: string) => void;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const selectedApp = ref<AppDef | null>(null);

watch(
  () => props.modelValue,
  (v) => {
    if (!v) selectedApp.value = null;
  }
);

function close() {
  emit("update:modelValue", false);
}
</script>

<style lang="scss" scoped>
.app-center {
  width: 680px;
  height: 560px;
  border-radius: 20px;
  padding: 0;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 24px 64px var(--theme-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    background: linear-gradient(180deg, var(--theme-accent-bg) 0%, transparent 100%);
  }

  &-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--theme-text);
  }

  &-back,
  &-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: rgba(148, 163, 184, 0.15);
    color: var(--theme-text);
    font-size: 18px;
    line-height: 1;
    border-radius: 10px;
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;

    &:hover {
      background: var(--theme-hover);
    }
  }

  &-close {
    width: 32px;
    height: 32px;
    font-size: 20px;
    color: var(--theme-text-muted);

    &:hover {
      color: var(--theme-text);
    }
  }

  &-desc {
    padding: 0 24px 16px;
    font-size: 13px;
    color: var(--theme-text-muted);
  }

  &-grid {
    height: 460px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    padding: 16px 24px 24px;
    background: rgba(148, 163, 184, 0.06);
  }

  &-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    gap: 8px;
    padding: 16px 0;
    aspect-ratio: 1;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--theme-hover-light);
    }

    &-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: var(--theme-accent-bg);
      border-radius: 10px;
    }

    &-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--theme-text);
      text-align: center;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}
</style>
