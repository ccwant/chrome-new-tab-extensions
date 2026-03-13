<template>
  <div class="clock-widget">
    <div class="widget-clock-time">{{ time }}</div>
    <div class="widget-clock-date">{{ date }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { Solar } from "lunar-javascript";

defineOptions({
  inheritAttrs: false,
});

function formatTime(): string {
  return dayjs().format("HH:mm:ss");
}

function formatDate(): string {
  const d = dayjs();
  const monthDay = d.format("M月D日");
  const weekday = d.locale("zh-cn").format("dddd");
  const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
  const lunar = solar.getLunar();
  const lunarStr = lunar.getMonthInChinese() + "月" + lunar.getDayInChinese();
  return `${monthDay} ${weekday} ${lunarStr}`;
}

const time = ref(formatTime());
const date = ref(formatDate());
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    time.value = formatTime();
    date.value = formatDate();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.clock-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.widget-clock-time {
  margin-top: -5px;
  font-size: 72px;
  font-weight: 700;
  font-family: "HarmonyOS_Sans";
  color: var(--theme-app-color);
  transition: font 0.2s;
}

.widget-clock-date {
  font-size: 14px;
  color: var(--theme-app-color);
}
</style>
