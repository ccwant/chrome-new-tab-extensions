<template>
  <Dialog
    :model-value="modelValue"
    :title="editApp ? '编辑应用' : '新增应用'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="modal-form">
      <div class="field">
        <div class="field-label">
          <span>应用名称</span>
        </div>
        <input
          v-model="shortcutForm.name"
          class="field-input"
          type="text"
          placeholder="例如：GitHub、Google 邮箱"
        />
      </div>
      <div class="field">
        <div class="field-label">
          <span>链接地址</span>
          <span class="field-hint">支持 http / https</span>
        </div>
        <input
          v-model="shortcutForm.url"
          class="field-input"
          type="url"
          placeholder="例如：https://github.com"
        />
      </div>
      <div class="field">
        <div class="field-label">
          <span>应用图标</span>
          <span class="field-hint">可选</span>
        </div>
        <IconUpload v-model="shortcutForm.iconUrls" :limit="1" />
      </div>
    </div>
    <template #footer>
      <button class="button" @click="close">取消</button>
      <button class="button button-primary" @click="submitShortcut">保存</button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import Dialog from "@/components/Dialog/index.vue";
import IconUpload from "@/components/IconUpload/IconUpload.vue";

import type { AddAppPayload, AppItem } from "@/types";

const props = defineProps<{
  modelValue: boolean;
  editApp: { index: number; app: AppItem } | null;
  addApp: (payload: AddAppPayload) => boolean;
  updateApp: (index: number, payload: AddAppPayload) => void;
  showToast: (msg: string) => void;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

function normalizeUrl(url: string): string {
  if (!url) return "";
  const t = String(url).trim();
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}

const shortcutForm = reactive<{
  name: string;
  url: string;
  iconUrls: string[];
}>({ name: "", url: "", iconUrls: [] });

function close() {
  emit("update:modelValue", false);
}

function reset() {
  shortcutForm.name = "";
  shortcutForm.url = "";
  shortcutForm.iconUrls = [];
}

async function submitShortcut() {
  const name = shortcutForm.name.trim();
  const url = shortcutForm.url.trim();
  if (!name) {
    props.showToast("请输入应用名称");
    return;
  }
  if (!url) {
    props.showToast("请输入链接地址");
    return;
  }
  const icon = shortcutForm.iconUrls[0] ?? "";
  const isDataUrl = icon.startsWith("data:");
  const payload: AddAppPayload = {
    name,
    url: normalizeUrl(url),
    iconDataUrl: isDataUrl ? icon : undefined,
    iconUrl: !isDataUrl && icon ? icon : undefined,
  };
  if (props.editApp) {
    props.updateApp(props.editApp.index, payload);
    close();
    props.showToast("应用已更新");
  } else {
    const ok = props.addApp(payload);
    if (ok) {
      close();
      props.showToast("应用已添加");
    }
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      if (props.editApp) {
        shortcutForm.name = props.editApp.app.name;
        shortcutForm.url = props.editApp.app.url;
        shortcutForm.iconUrls = props.editApp.app.iconDataUrl
          ? [props.editApp.app.iconDataUrl]
          : props.editApp.app.iconUrl
            ? [props.editApp.app.iconUrl]
            : [];
      } else {
        reset();
      }
    }
  }
);
</script>

<style lang="scss" scoped>
.modal-form {
  width: 600px;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  &-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 13px;
    color: var(--theme-text);
  }

  &-hint {
    font-size: 11px;
    color: var(--theme-text-muted);
  }

  &-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--theme-border);
    border-radius: 10px;
    font-size: 14px;
    background: var(--theme-surface);
    color: var(--theme-text);

    &::placeholder {
      color: var(--theme-text-muted);
    }
  }
}

.button {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 10px;
  border: 1px solid var(--theme-border-strong);
  background: var(--theme-surface-dim);
  color: var(--theme-text);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &-primary {
    background: linear-gradient(135deg, var(--theme-accent-solid), #3b82f6);
    border-color: transparent;
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
