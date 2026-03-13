export interface AlarmItem {
  id: string;
  type: 1 | 2; // 1: 闹钟, 2: 定时任务
  time: string;
  minutes: number;
  repeat: boolean;
  title: string;
  message: string;
  enable: boolean;
  createdAt?: number;
}
