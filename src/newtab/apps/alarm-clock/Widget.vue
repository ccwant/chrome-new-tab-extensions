<template>
  <div class="alarm-clock">
    <div class="alarm-clock__header">
      <span class="alarm-clock__title">闹钟提醒</span>
      <button class="alarm-clock__add-btn" type="button" @click="openCenterDialog">+</button>
    </div>

    <ul class="alarm-clock__list">
      <li v-if="!enabledList.length" class="alarm-clock__empty">暂无启用的闹钟或定时任务</li>
      <li
        v-for="item in enabledList"
        :key="item.id"
        class="alarm-clock__item"
        @click="openEditDialog(item)"
      >
        <span class="alarm-clock__item-tag">
          {{ item.type === 1 ? "闹钟" : "定时任务" }}
        </span>
        <span class="alarm-clock__item-main">
          <template v-if="item.type === 1">
            {{ item.time }}
          </template>
          <template v-else>
            {{ formatCountdown(item) }}
          </template>
        </span>
      </li>
    </ul>

    <AlarmDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :item="editingItem"
      @submit="handleDialogSubmit"
      @delete="handleDialogDelete"
    />

    <ListDialog
      v-model="centerVisible"
      :items="alarmClockList"
      @create="openCreateDialog"
      @edit="handleCenterEdit"
      @toggle="handleCenterToggle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import dayjs from "dayjs";
import AlarmDialog from "./AlarmDialog.vue";
import ListDialog from "./ListDialog.vue";
import type { AlarmItem } from "./types";

defineOptions({
  inheritAttrs: false,
});

const alarmClockList = reactive<AlarmItem[]>([]);
const pendingTimeouts = new Map<string, number>();

const dialogVisible = ref(false);
const centerVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingItem = ref<AlarmItem | null>(null);

const now = ref(Date.now());
let timer: number | undefined;

const enabledList = computed(() => alarmClockList.filter((item) => item.enable));

onMounted(() => {
  load();
  timer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
  chrome.storage.onChanged.addListener(handleStorageChange);
  chrome.alarms.onAlarm.addListener(handleAlarmFired);
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer);
  }
  chrome.storage.onChanged.removeListener(handleStorageChange);
  chrome.alarms.onAlarm.removeListener(handleAlarmFired);
});

async function load() {
  const item = await chrome.storage.sync.get(["alarmClock"]);
  if (item && item.alarmClock && Array.isArray(item.alarmClock)) {
    alarmClockList.push(...(item.alarmClock as AlarmItem[]));
    normalizeTimers();
  }
}

function handleStorageChange(
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) {
  if (areaName !== "sync" || !changes.alarmClock) return;
  const next = (changes.alarmClock.newValue || []) as AlarmItem[];
  // 更新闹钟列表
  alarmClockList.splice(0, alarmClockList.length, ...next);
}

function normalizeTimers() {
  alarmClockList.forEach((entry) => {
    console.log("normalizeTimers entry", entry);
    if (entry.type === 2) {
      chrome.alarms.get(entry.id, (alarm) => {
        console.log("get alarm", alarm);
        if (!alarm) return;
        const scheduled = alarm.scheduledTime;
        const duration = entry.minutes * 60 * 1000;
        const createdAt = scheduled - duration;
        console.log("createdAt", dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss"));
        entry.createdAt = createdAt;
      });
    }
  });
  chrome.storage.sync.set({ alarmClock: Array.from(alarmClockList) });
}

function handleAlarmFired(alarm: chrome.alarms.Alarm) {
  const id = alarm.name;
  if (!id) return;
  const target = alarmClockList.find((x) => x.id === id);
  if (!target) return;

  if (target.repeat) {
    // 重复定时任务：本地立刻重置起点时间，让倒计时从头开始
    target.createdAt = Date.now();
  } else {
    // 一次性任务：本地立刻标记为关闭，和后台逻辑保持一致
    target.enable = false;
  }
}

function openCenterDialog() {
  centerVisible.value = true;
}

function openCreateDialog() {
  dialogMode.value = "create";
  editingItem.value = null;
  dialogVisible.value = true;
}

function openEditDialog(item: AlarmItem) {
  dialogMode.value = "edit";
  editingItem.value = item;
  dialogVisible.value = true;
}

function handleCenterEdit(item: AlarmItem) {
  openEditDialog(item);
}

function handleCenterToggle(payload: { id: string; enable: boolean }) {
  const target = alarmClockList.find((x) => x.id === payload.id);
  if (!target) return;

  target.enable = payload.enable;
  chrome.alarms.clear(target.id);
  clearPendingAlarm(target.id);

  //  闹钟类型需要计算分钟数
  if (target.enable && target.type === 1) {
    const time = target.time || dayjs().format("HH:mm");
    const fullTime = dayjs().format(`YYYY-MM-DD ${time}:00`);
    const diffMinute = dayjs(fullTime).startOf("minute").diff(dayjs().startOf("minute"), "minute");
    const minutes = diffMinute > 0 ? diffMinute : 24 * 60 + diffMinute;
    target.minutes = minutes;
  }

  const hasEnabled = alarmClockList.some((x) => x.enable);
  chrome.action.setBadgeText({ text: hasEnabled ? "ON" : "" });

  if (target.enable) {
    target.createdAt = Date.now();
    setAlarm(target);
  } else {
    chrome.storage.sync.set({ alarmClock: Array.from(alarmClockList) });
  }
}

function handleDialogSubmit(payload: {
  id: string;
  type: 1 | 2;
  time: string;
  minutes: number;
  repeat: boolean;
}) {
  if (dialogMode.value === "create") {
    if (payload.type === 1) {
      createAlarm(payload.time, payload.repeat);
    } else {
      createTask(payload.minutes, payload.repeat);
    }
  } else if (editingItem.value) {
    updateItem(editingItem.value, payload);
  }
  editingItem.value = null;
}

function handleDialogDelete(id: string) {
  const targetId = id || editingItem.value?.id;
  if (!targetId) return;
  const index = alarmClockList.findIndex((x) => x.id === targetId);
  if (index !== -1) {
    const removed = alarmClockList.splice(index, 1)[0];
    chrome.storage.sync.set({ alarmClock: Array.from(alarmClockList) });
    chrome.alarms.clear(removed.id);
    clearPendingAlarm(removed.id);
    const hasEnabled = alarmClockList.some((x) => x.enable);
    if (!hasEnabled) {
      chrome.action.setBadgeText({ text: "" });
    }
  }
  editingItem.value = null;
}

function createAlarm(time: string, repeat: boolean) {
  const id = dayjs().format("YYYYMMDD_HH_mm_ss_SSS");
  const t = time || dayjs().format("HH:mm");
  const fullTime = dayjs().format(`YYYY-MM-DD ${t}:00`);
  const diffMinute = dayjs(fullTime).startOf("minute").diff(dayjs().startOf("minute"), "minute");
  const minutes = diffMinute > 0 ? diffMinute : 24 * 60 + diffMinute;

  const alarm: AlarmItem = {
    id,
    type: 1,
    time: t,
    minutes,
    repeat,
    title: t,
    message: "闹钟响了",
    enable: true,
    createdAt: Date.now(),
  };
  alarmClockList.push(alarm);
  setAlarm(alarm);
}

function createTask(minutes: number, repeat: boolean) {
  const id = dayjs().format("YYYYMMDD_HH_mm_ss_SSS");
  const m = minutes && minutes > 0 ? minutes : 1;

  const alarm: AlarmItem = {
    id,
    type: 2,
    time: "",
    repeat,
    minutes: m,
    title: "定时任务",
    message: `${m}分钟定时任务`,
    enable: true,
    createdAt: Date.now(),
  };
  alarmClockList.push(alarm);
  setAlarm(alarm);
}

function updateItem(
  origin: AlarmItem,
  payload: { id: string; type: 1 | 2; time: string; minutes: number; repeat: boolean }
) {
  const target = alarmClockList.find((x) => x.id === origin.id);
  if (!target) return;

  chrome.alarms.clear(target.id);
  clearPendingAlarm(target.id);

  if (payload.type === 1) {
    const time = payload.time || dayjs().format("HH:mm");
    const fullTime = dayjs().format(`YYYY-MM-DD ${time}:00`);
    const diffMinute = dayjs(fullTime).startOf("minute").diff(dayjs().startOf("minute"), "minute");
    const minutes = diffMinute > 0 ? diffMinute : 24 * 60 + diffMinute;
    target.type = 1;
    target.time = time;
    target.minutes = minutes;
    target.repeat = payload.repeat;
    target.title = time;
    target.message = "闹钟响了";
  } else {
    const m = payload.minutes && payload.minutes > 0 ? payload.minutes : 1;
    target.type = 2;
    target.time = "";
    target.minutes = m;
    target.repeat = payload.repeat;
    target.title = "定时任务";
    target.message = `${m}分钟定时任务`;
  }
  target.enable = true;
  target.createdAt = Date.now();

  setAlarm(target);
}

function setAlarm(alarm: AlarmItem) {
  chrome.action.setBadgeText({ text: "ON" });

  chrome.storage.sync.set({
    alarmClock: Array.from(alarmClockList),
  });

  const pending = pendingTimeouts.get(alarm.id);
  if (pending) {
    clearTimeout(pending);
    pendingTimeouts.delete(alarm.id);
  }

  if (alarm.type === 1) {
    // 只有闹钟类型使用 setTimeout 等到下一分钟的第 0 秒再真正创建 chrome.alarms，
    // 尽量减小闹钟触发的秒级偏差。
    const nowMs = Date.now();
    const msToZero = 60_000 - (nowMs % 60_000);
    console.log("msToZero", msToZero);
    const timeoutId = window.setTimeout(() => {
      pendingTimeouts.delete(alarm.id);
      // 减去1分钟，因为setTimeout会延迟1分钟
      alarm.minutes -= 1;
      createChromeAlarm(alarm);
    }, msToZero);
    pendingTimeouts.set(alarm.id, timeoutId);
    return;
  }
  createChromeAlarm(alarm);
}
function createChromeAlarm(alarm: AlarmItem) {
  console.log("createChromeAlarm", alarm);
  chrome.alarms.create(alarm.id, { delayInMinutes: alarm.minutes });
}

function clearPendingAlarm(id: string) {
  const pending = pendingTimeouts.get(id);
  if (pending) {
    clearTimeout(pending);
    pendingTimeouts.delete(id);
  }
}

function formatCountdown(item: AlarmItem) {
  if (!item.createdAt) {
    return `${item.minutes} 分钟`;
  }
  const end = item.createdAt + item.minutes * 60 * 1000;
  const diff = Math.max(0, end - now.value);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}
</script>

<style lang="scss" scoped>
.alarm-clock {
  width: 100%;
  height: 100%;

  background-color: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
// 标题
.alarm-clock__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 12px;
  border-radius: 12px 12px 0 0;
  background-color: #f0f0f5;

  .alarm-clock__title {
    font-size: 14px;
    font-weight: 600;
    color: #222;
  }

  .alarm-clock__add-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: #2f54eb;
    color: #fff;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .alarm-clock__add-btn:hover {
    background: #1d39c4;
  }
}
// 列表
.alarm-clock__list {
  list-style: none;
  padding: 0 12px;
  margin: 0;
  flex: 1;
  overflow-y: auto;

  .alarm-clock__empty {
    font-size: 12px;
    color: #999;
  }

  .alarm-clock__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
  }

  .alarm-clock__item-tag {
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    color: #555;
    background: #f0f0f5;
    margin-right: 6px;
  }

  .alarm-clock__item-main {
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
      monospace;
    font-size: 14px;
    color: #333;
  }
}
</style>
