<template>
  <div class="app-center-detail">
    <div class="app-center-detail-main">
      <div class="app-center-detail-icon">{{ appIcon }}</div>
      <div class="app-center-detail-name">{{ app.name }}</div>
      <div class="app-center-detail-desc">{{ app.description || "" }}</div>
    </div>
    <div class="app-center-detail-footer">
      <button type="button" class="app-center-detail-btn" @click="addWidget">添加</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getAppIcon } from "./utils";
import type { AppDef, AddAppPayload } from "@/types";

const props = defineProps<{
  app: AppDef;
  addApp: (p: AddAppPayload) => boolean;
  showToast: (msg: string) => void;
  onAddSuccess?: () => void;
}>();

const appIcon = computed(() => getAppIcon(props.app));

function addWidget() {
  const payload: AddAppPayload = {
    name: props.app.name,
    url: "",
    iconDataUrl: "",
    type: props.app.type,
    widgetId: props.app.id,
    width: props.app.width,
    height: props.app.height,
  };
  const ok = props.addApp(payload);
  if (ok) {
    props.showToast("小组件已添加");
    props.onAddSuccess?.();
  }
}
</script>

<style lang="scss" scoped>
.app-center-detail {
  flex: 1;
  display: flex;
  flex-direction: column;

  &-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 24px 24px;
  }

  &-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    background: var(--theme-accent-bg);
    border-radius: 18px;
    margin-bottom: 16px;
  }

  &-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--theme-text);
    margin-bottom: 8px;
  }

  &-desc {
    font-size: 14px;
    color: var(--theme-text-muted);
    line-height: 1.5;
    text-align: center;
  }

  &-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px 24px 24px;
  }

  &-btn {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    background: linear-gradient(135deg, var(--theme-accent-solid), #3b82f6);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition:
      opacity 0.2s,
      transform 0.15s;

    &:hover {
      opacity: 0.9;
      transform: scale(1.02);
    }
  }
}
</style>
