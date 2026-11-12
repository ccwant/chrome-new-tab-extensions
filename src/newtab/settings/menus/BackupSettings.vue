<template>
  <div class="backup-settings">
    <p class="backup-desc">
      导出将打包本页全部配置，包括桌面应用布局、主题壁纸、便签、闹钟与 sync
      存储中的其他项。导入会覆盖当前配置，请谨慎操作。
    </p>

    <div class="backup-actions">
      <button type="button" class="backup-btn backup-btn--primary" :disabled="busy" @click="onExport">
        {{ exportLabel }}
      </button>
      <label class="backup-btn backup-btn--plain backup-import-label">
        <input
          ref="fileInputRef"
          type="file"
          accept="application/json,.json"
          class="backup-file-input"
          :disabled="busy"
          @change="onFileSelected"
        />
        {{ importLabel }}
      </label>
    </div>

    <p v-if="message" class="backup-message" :class="{ 'backup-message--error': isError }">
      {{ message }}
    </p>

    <div v-if="lastExportInfo" class="backup-meta">
      <div class="backup-meta-row">
        <span class="backup-meta-label">上次导出</span>
        <span>{{ lastExportInfo.time }}</span>
      </div>
      <div class="backup-meta-row">
        <span class="backup-meta-label">localStorage 项</span>
        <span>{{ lastExportInfo.localCount }}</span>
      </div>
      <div class="backup-meta-row">
        <span class="backup-meta-label">sync 项</span>
        <span>{{ lastExportInfo.syncCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  downloadBackupJson,
  exportAllConfig,
  importAllConfig,
} from "@/backup/backupService";

const busy = ref(false);
const message = ref("");
const isError = ref(false);
const exportLabel = ref("导出配置");
const importLabel = ref("导入配置");
const fileInputRef = ref<HTMLInputElement | null>(null);

const lastExportInfo = ref<{
  time: string;
  localCount: number;
  syncCount: number;
} | null>(null);

function clearMessage() {
  message.value = "";
  isError.value = false;
}

function showSuccess(text: string) {
  message.value = text;
  isError.value = false;
}

function showError(text: string) {
  message.value = text;
  isError.value = true;
}

async function onExport() {
  if (busy.value) return;
  busy.value = true;
  exportLabel.value = "导出中…";
  clearMessage();
  try {
    const backup = await exportAllConfig();
    downloadBackupJson(backup);
    lastExportInfo.value = {
      time: new Date(backup.exportedAt).toLocaleString(),
      localCount: Object.keys(backup.localStorage).length,
      syncCount: Object.keys(backup.chromeStorageSync).length,
    };
    showSuccess("配置已导出。若已下载文件，请妥善保存。");
  } catch (e) {
    showError(e instanceof Error ? e.message : "导出失败");
  } finally {
    busy.value = false;
    exportLabel.value = "导出配置";
  }
}

async function onFileSelected(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || busy.value) return;

  if (
    !window.confirm(
      "导入将覆盖当前桌面布局、主题、便签、闹钟等全部配置，是否继续？"
    )
  ) {
    return;
  }

  busy.value = true;
  importLabel.value = "导入中…";
  clearMessage();
  try {
    const text = await file.text();
    await importAllConfig(text);
    showSuccess("配置已还原，即将刷新页面以应用更改。");
    window.setTimeout(() => window.location.reload(), 800);
  } catch (e) {
    showError(e instanceof Error ? e.message : "导入失败");
  } finally {
    busy.value = false;
    importLabel.value = "导入配置";
  }
}
</script>

<style lang="scss" scoped>
.backup-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 14px;
  color: var(--theme-text);
}

.backup-desc {
  margin: 0;
  line-height: 1.6;
  color: var(--theme-text-muted);
  font-size: 13px;
}

.backup-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.backup-btn {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--theme-border);
  cursor: pointer;
  user-select: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--theme-accent-solid);
    border-color: transparent;
    color: #fff;

    &:hover:not(:disabled) {
      filter: brightness(0.95);
    }
  }

  &--plain {
    background: var(--theme-hover);
    color: var(--theme-text);

    &:hover:not(:disabled) {
      background: var(--theme-accent-bg);
    }
  }
}

.backup-import-label {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.backup-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.backup-message {
  margin: 0;
  font-size: 13px;
  color: var(--theme-accent-solid);

  &--error {
    color: #cf1322;
  }
}

.backup-meta {
  padding-top: 12px;
  border-top: 1px solid var(--theme-border);
  font-size: 12px;
  color: var(--theme-text-muted);
}

.backup-meta-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.backup-meta-label {
  color: var(--theme-text-muted);
}
</style>
