<template>
  <div class="calendar-widget">
    <div class="calendar-header">
      <div class="calendar-title">
        <button class="month-nav" type="button" @click="prevMonth">‹</button>
        <span class="year-month"> {{ currentYear }} 年 {{ currentMonth }} 月 </span>
        <button class="month-nav" type="button" @click="nextMonth">›</button>
        <span class="today-text" @click="goToday">今</span>
      </div>
      <button class="calendar-more" type="button" @click="openDialog">全年</button>
    </div>

    <div class="calendar-week-header">
      <span v-for="w in WEEK_DAYS" :key="w" class="week-cell">{{ w }}</span>
    </div>

    <div class="calendar-days-grid">
      <Popover
        v-for="(cell, idx) in monthCells"
        :key="idx"
        :model-value="!!cell.dateStr && activePopoverDate === cell.dateStr"
        @update:model-value="
          (v) => {
            if (!cell.dateStr) return;
            activePopoverDate = v ? cell.dateStr : null;
          }
        "
        placement="top-start"
        append-to-body
      >
        <template #default>
          <div
            class="day-cell"
            :class="cell.classes"
            @click="
              () => {
                if (!cell.info || !cell.dateStr) return;
                activePopoverDate = activePopoverDate === cell.dateStr ? null : cell.dateStr;
              }
            "
          >
            <span v-if="cell.day" class="day-number">{{ cell.day }}</span>
            <span v-if="cell.hasHolidayDot" class="day-dot day-dot-holiday"></span>
            <span v-if="cell.isWeekendOvertime" class="day-dot day-dot-overtime"></span>
          </div>
        </template>
        <template #content>
          <HolidayPopoverContent v-if="cell.info" :info="cell.info" />
        </template>
      </Popover>
    </div>

    <CalendarDialog v-model="dialogVisible" :year="currentYear" :year-data="yearDataMap" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import CalendarDialog from "./CalendarDialog.vue";
import Popover from "@/components/Popover/index.vue";
import HolidayPopoverContent from "./HolidayPopoverContent.vue";

defineOptions({
  inheritAttrs: false,
});

// 接口文档：https://appworlds.cn/holiday/
// https://date.appworlds.cn/year/{year}

interface YearHolidayItem {
  date: string;
  days: number;
  holiday: boolean;
  name: string;
}
// 周顺序：日、一、二、三、四、五、六（周日在第一列）
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth() + 1);

const dialogVisible = ref(false);
const yearDataMap = ref<Record<string, YearHolidayItem>>({});

type MonthCell = {
  day: number | null;
  classes: any;
  hasHolidayDot: boolean;
  isWeekendOvertime: boolean;
  info?: YearHolidayItem | null;
  dateStr?: string | null;
};

const activePopoverDate = ref<string | null>(null);

const monthCells = computed<MonthCell[]>(() => {
  return buildMonthCells(currentYear.value, currentMonth.value, yearDataMap.value);
});

function buildMonthCells(
  year: number,
  month: number,
  map: Record<string, YearHolidayItem>
): MonthCell[] {
  const firstDate = new Date(year, month - 1, 1);
  // getDay: 0=日,1=一,...,6=六；列顺序同 getDay
  const firstWeekDay = firstDate.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < firstWeekDay; i++) {
    cells.push({
      day: null,
      classes: "day-empty",
      hasHolidayDot: false,
      isWeekendOvertime: false,
      info: null,
      dateStr: null,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const weekday = date.getDay(); // 0=日,6=六
    // 避免 toISOString 受时区影响导致日期前移/后移
    const mStr = String(month).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;
    const special = map[dateStr];

    let type: "normal" | "holiday" | "weekend" | "overtime" = "normal";
    let hasHolidayDot = false;
    let isWeekendOvertime = false;

    if (special) {
      if (special.holiday) {
        type = "holiday";
        hasHolidayDot = true;
      } else {
        // 调休上班日
        type = "overtime";
        // 如果是周末被要求上班，用红色背景强调
        if (weekday === 0 || weekday === 6) {
          isWeekendOvertime = true;
        }
      }
    } else if (weekday === 0 || weekday === 6) {
      // 普通双休日
      type = "weekend";
    }

    const isToday = date.toDateString() === new Date().toDateString();

    const classes = [
      "day-filled",
      `day-type-${type}`,
      isWeekendOvertime ? "day-weekend-overtime" : "",
      isToday ? "day-today" : "",
    ];

    cells.push({
      day: d,
      classes,
      hasHolidayDot,
      isWeekendOvertime,
      info: special || null,
      dateStr,
    });
  }

  return cells;
}

async function fetchYearData() {
  try {
    const resp = await fetch(`/holidays.json`);
    const data = (await resp.json()) as any;

    console.log("-- data", data);
    const map: Record<string, YearHolidayItem> = {};
    for (const item of data) {
      map[item.date] = item;
    }
    yearDataMap.value = map;
  } catch {
    // 忽略错误，仍然可以显示普通日历
  }
}

function openDialog() {
  dialogVisible.value = true;
}

function changeMonth(delta: number) {
  let y = currentYear.value;
  let m = currentMonth.value + delta;
  if (m < 1) {
    m = 12;
    y -= 1;
  } else if (m > 12) {
    m = 1;
    y += 1;
  }
  if (y !== currentYear.value) {
    currentYear.value = y;
    fetchYearData();
  }
  currentMonth.value = m;
}

function prevMonth() {
  changeMonth(-1);
}

function nextMonth() {
  changeMonth(1);
}

function goToday() {
  const now = new Date();
  currentYear.value = now.getFullYear();
  currentMonth.value = now.getMonth() + 1;
}

onMounted(() => {
  fetchYearData();
});
</script>

<style lang="scss" scoped>
.calendar-widget {
  width: 100%;
  height: 100%;
  padding: 8px 10px;
  box-sizing: border-box;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(8px);
  color: var(--theme-app-color);
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.year-month {
  font-weight: 600;
}

.today-text {
  font-size: 10px;
  padding: 0 4px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.5);
  cursor: pointer;
}

.month-nav {
  border: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.4);
  color: var(--theme-app-color);
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.month-nav + .year-month {
  margin: 0 2px;
}

.calendar-more {
  border: none;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  background: rgba(148, 163, 184, 0.18);
  color: var(--theme-app-color);
  cursor: pointer;
}

.calendar-week-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 2px;
}

.week-cell {
  text-align: center;
  font-size: 8px;
  opacity: 0.9;
}

.calendar-days-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 1px;
}

.day-cell {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border-radius: 4px;
  padding: 2px 0;
  position: relative;
}

.day-empty {
  opacity: 0.3;
}

.day-filled {
  position: relative;
}

.day-number {
  line-height: 1.1;
}

.day-dot {
  position: absolute;
  top: 1px;
  right: 2px;
  width: 4px;
  height: 4px;
  border-radius: 999px;
}

.day-dot-holiday {
  background: #f97373;
}

.day-dot-overtime {
  background: #ef4444;
}
.day-type-holiday {
  background: rgba(248, 113, 113, 0.16);
}

.day-type-weekend {
  background: rgba(59, 130, 246, 0.18);
}

.day-type-overtime {
  background: rgba(234, 179, 8, 0.18);
}

.day-weekend-overtime {
  background: rgba(248, 113, 113, 0.25);
}

.day-today {
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.9);
}

</style>
