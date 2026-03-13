import type { AlarmItem } from "@/newtab/apps/alarm-clock/types";

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const id = alarm.name;
  const stored = await chrome.storage.sync.get(["alarmClock"]);
  const list = (stored.alarmClock || []) as AlarmItem[];
  if (!Array.isArray(list) || !id) return;

  const index = list.findIndex((x) => x.id === id);
  if (index === -1) return;

  const item = list[index] as AlarmItem;

  chrome.notifications.create(item.id, {
    type: "basic",
    iconUrl: "stay_hydrated.png",
    title: item.title || (item.type === 1 ? "闹钟提醒" : "定时任务"),
    message: item.message || "",
    priority: 0,
  });

  // 重复任务：
  if (item.repeat) {
    // 闹钟类型：
    if (item.type === 1) {
      item.minutes = 24 * 60;
    }
    // 定时任务：
    if (item.type === 2) {
      // 每次触发后重置起点时间，让前端倒计时从头开始
      item.createdAt = Date.now();
    }
    chrome.action.setBadgeText({ text: "ON" });
    chrome.alarms.clear(item.id);
    chrome.alarms.create(item.id, { delayInMinutes: item.minutes });
  } else {
    // 一次性任务：触发后关闭
    item.enable = false;
    const hasEnabled = list.some((x) => x.enable);
    if (!hasEnabled) {
      chrome.action.setBadgeText({ text: "" });
    }
  }
  list[index] = item;
  await chrome.storage.sync.set({ alarmClock: list });
});
