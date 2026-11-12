import dayjs from "dayjs";

/** 距下一次到达该钟点还有多少分钟（不足则视为次日，与创建/编辑闹钟时的算法一致） */
export function computeMinutesUntilAlarmTime(time: string): number {
  const t = time || dayjs().format("HH:mm");
  const fullTime = dayjs().format(`YYYY-MM-DD ${t}:00`);
  const diffMinute = dayjs(fullTime).startOf("minute").diff(dayjs().startOf("minute"), "minute");
  return diffMinute > 0 ? diffMinute : 24 * 60 + diffMinute;
}

/** 下一次触发的绝对时间戳（毫秒），重复提醒时用 when 排程避免 delayInMinutes 漂移 */
export function computeNextAlarmTimestamp(time: string): number {
  const t = time || dayjs().format("HH:mm");
  const base = dayjs().format(`YYYY-MM-DD ${t}:00`);
  let target = dayjs(base).startOf("minute");
  if (!target.isAfter(dayjs())) {
    target = target.add(1, "day");
  }
  return target.valueOf();
}
