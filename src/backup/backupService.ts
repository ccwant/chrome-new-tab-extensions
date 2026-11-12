import type { AlarmItem } from "@/newtab/apps/alarm-clock/types";
import { computeNextAlarmTimestamp } from "@/newtab/apps/alarm-clock/schedule";
import { BACKUP_SCHEMA_VERSION, type NewTabBackupFile } from "./types";

function collectLocalStorage(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        out[key] = value;
      }
    }
  }
  return out;
}

async function collectChromeStorageSync(): Promise<Record<string, unknown>> {
  return chrome.storage.sync.get(null);
}

/** 导出当前扩展新标签页相关的全部配置 */
export async function exportAllConfig(): Promise<NewTabBackupFile> {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    extensionVersion: typeof __VERSION__ !== "undefined" ? __VERSION__ : "unknown",
    localStorage: collectLocalStorage(),
    chromeStorageSync: await collectChromeStorageSync(),
  };
}

function parseBackupFile(text: string): NewTabBackupFile {
  const data = JSON.parse(text) as NewTabBackupFile;
  if (!data || typeof data !== "object") {
    throw new Error("文件格式无效");
  }
  if (data.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`不支持的备份版本：${data.schemaVersion}`);
  }
  if (!data.localStorage || typeof data.localStorage !== "object") {
    throw new Error("缺少 localStorage 数据");
  }
  if (!data.chromeStorageSync || typeof data.chromeStorageSync !== "object") {
    throw new Error("缺少 chrome.storage.sync 数据");
  }
  return data;
}

async function applyChromeStorageSync(syncData: Record<string, unknown>) {
  await chrome.storage.sync.set(syncData);
}

function applyLocalStorage(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Failed to restore localStorage key:", key, e);
    }
  }
}

/** 导入后根据闹钟配置重新注册 chrome.alarms */
async function rescheduleChromeAlarmsFromSync() {
  const stored = await chrome.storage.sync.get(["alarmClock"]);
  const list = (stored.alarmClock || []) as AlarmItem[];
  if (!Array.isArray(list)) return;

  for (const item of list) {
    await chrome.alarms.clear(item.id);
  }

  const hasEnabled = list.some((x) => x.enable);
  await chrome.action.setBadgeText({ text: hasEnabled ? "ON" : "" });

  for (const alarm of list) {
    if (!alarm.enable) continue;
    if (alarm.type === 1) {
      chrome.alarms.create(alarm.id, { when: computeNextAlarmTimestamp(alarm.time) });
    } else {
      chrome.alarms.create(alarm.id, { delayInMinutes: alarm.minutes });
    }
  }
}

/** 将备份还原到本地与 sync 存储，并重建闹钟调度 */
export async function importAllConfig(fileText: string): Promise<void> {
  const backup = parseBackupFile(fileText);
  applyLocalStorage(backup.localStorage);
  await applyChromeStorageSync(backup.chromeStorageSync);
  await rescheduleChromeAlarmsFromSync();
}

export function downloadBackupJson(backup: NewTabBackupFile) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = backup.exportedAt.replace(/[:.]/g, "-").slice(0, 19);
  const a = document.createElement("a");
  a.href = url;
  a.download = `newtab-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
