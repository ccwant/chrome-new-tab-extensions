/** 备份文件格式版本，导入时用于兼容校验 */
export const BACKUP_SCHEMA_VERSION = 1;

export interface NewTabBackupFile {
  schemaVersion: number;
  exportedAt: string;
  extensionVersion: string;
  /** localStorage 键值（值为原始字符串） */
  localStorage: Record<string, string>;
  /** chrome.storage.sync 中的全部配置项 */
  chromeStorageSync: Record<string, unknown>;
}
