<template>
  <Dialog
    v-model="visible"
    :title="dialogTitle"
    modal-class="calendar-dialog"
    append-to-body
  >
    <div class="calendar-dialog-body" :class="{ 'calendar-dialog-body--month': detailMonth !== null }">
      <div class="calendar-legend">
        <span class="legend-item">
          <span class="legend-dot legend-holiday"></span>
          法定节假日
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-rest"></span>
          周末休息日
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-overtime"></span>
          调休上班日
        </span>
        <span class="legend-item">
          <span class="legend-dot legend-today"></span>
          今天
        </span>
      </div>
      <div v-if="detailMonth === null" class="calendar-year-grid">
        <div v-for="month in 12" :key="month" class="calendar-month-block">
          <button
            type="button"
            class="calendar-month-title"
            :title="`查看 ${year} 年 ${month} 月详情`"
            @click="openMonthDetail(month)"
          >
            {{ month }} 月
          </button>
          <div class="calendar-week-header">
            <span v-for="w in WEEK_DAYS" :key="w" class="week-cell">{{ w }}</span>
          </div>
          <div class="calendar-days-grid">
            <Popover
              v-for="(cell, idx) in buildMonthCells(year, month)"
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
                <span class="day-cell" :class="cell.classes" @click.stop="onDayClick(cell)">
                  <span v-if="cell.day" class="day-number">{{ cell.day }}</span>
                  <span v-if="cell.hasHolidayDot" class="day-dot day-dot-holiday"></span>
                  <span v-if="cell.isWeekendOvertime" class="day-dot day-dot-overtime"></span>
                </span>
              </template>
              <template #content>
                <HolidayPopoverContent v-if="cell.info" :info="cell.info" />
              </template>
            </Popover>
          </div>
        </div>
      </div>

      <div v-else class="calendar-month-detail">
        <button type="button" class="calendar-back-btn" @click="closeMonthDetail">‹ 返回全年</button>
        <div class="calendar-month-detail-head">
          <span class="calendar-month-detail-title">{{ year }} 年 {{ detailMonth }} 月</span>
          <span class="calendar-month-detail-meta">共 {{ detailMonthEvents.length }} 条节假日/调休</span>
        </div>
        <div class="calendar-month-detail-layout">
          <div class="calendar-month-detail-cal">
            <div class="calendar-week-header calendar-week-header--detail">
              <span v-for="w in WEEK_DAYS" :key="w" class="week-cell">{{ w }}</span>
            </div>
            <div class="calendar-days-grid calendar-days-grid--detail">
              <Popover
                v-for="(cell, idx) in buildMonthCells(year, detailMonth)"
                :key="idx"
                :model-value="!!cell.dateStr && activePopoverDate === cell.dateStr"
                @update:model-value="
                  (v) => {
                    if (!cell.dateStr) return;
                    activePopoverDate = v ? cell.dateStr : null;
                  }
                "
                placement="top"
                append-to-body
              >
                <template #default>
                  <span
                    class="day-cell day-cell--detail"
                    :class="[cell.classes, cell.day && !cell.info?.name ? 'day-cell--plain' : '']"
                    @click.stop="onDayClick(cell)"
                  >
                    <span v-if="cell.day" class="day-number day-number--detail">{{ cell.day }}</span>
                    <span
                      v-if="cell.info?.name"
                      class="day-holiday-label"
                      :class="cell.info.holiday ? 'day-holiday-label--holiday' : 'day-holiday-label--overtime'"
                    >
                      {{ cell.info.name }}
                    </span>
                  </span>
                </template>
                <template #content>
                  <HolidayPopoverContent v-if="cell.info" :info="cell.info" />
                </template>
              </Popover>
            </div>
          </div>
          <aside class="calendar-month-events">
            <div class="calendar-month-events-title">本月安排</div>
            <ul v-if="detailMonthEvents.length" class="calendar-month-events-list">
              <li
                v-for="item in detailMonthEvents"
                :key="item.date"
                class="calendar-month-events-item"
                :class="item.holiday ? 'is-holiday' : 'is-overtime'"
              >
                <span class="events-item-date">{{ formatEventDate(item.date) }}</span>
                <span class="events-item-name">{{ item.name }}</span>
                <span class="events-item-tag">{{ item.holiday ? "法定节假日" : "调休上班" }}</span>
              </li>
            </ul>
            <p v-else class="calendar-month-events-empty">本月无节假日或调休记录</p>
          </aside>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Dialog from "@/components/Dialog/index.vue";
import Popover from "@/components/Popover/index.vue";
import HolidayPopoverContent from "./HolidayPopoverContent.vue";

interface YearItem {
  date: string;
  days: number;
  holiday: boolean;
  name: string;
}

type DialogCell = {
  day: number | null;
  classes: any;
  hasHolidayDot: boolean;
  isWeekendOvertime: boolean;
  info?: YearItem | null;
  dateStr?: string | null;
};

const props = defineProps<{
  modelValue: boolean;
  year: number;
  yearData: Record<string, YearItem>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

// 周顺序：六、日、一、二、三、四、五（周六在第一列）
// 周顺序：日、一、二、三、四、五、六（周日在第一列）
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const activePopoverDate = ref<string | null>(null);
const detailMonth = ref<number | null>(null);

const dialogTitle = computed(() =>
  detailMonth.value === null ? `${props.year} 年全年日历` : `${props.year} 年 ${detailMonth.value} 月`
);

const detailMonthEvents = computed(() => {
  if (detailMonth.value === null) return [] as YearItem[];
  const prefix = `${props.year}-${String(detailMonth.value).padStart(2, "0")}-`;
  return Object.entries(props.yearData)
    .filter(([date]) => date.startsWith(prefix))
    .map(([, item]) => item)
    .sort((a, b) => a.date.localeCompare(b.date));
});

watch(visible, (open) => {
  if (!open) {
    detailMonth.value = null;
    activePopoverDate.value = null;
  }
});

function openMonthDetail(month: number) {
  activePopoverDate.value = null;
  detailMonth.value = month;
}

function closeMonthDetail() {
  activePopoverDate.value = null;
  detailMonth.value = null;
}

function formatEventDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)} 月 ${Number(d)} 日`;
}

function buildMonthCells(year: number, month: number): DialogCell[] {
  const firstDate = new Date(year, month - 1, 1);
  // getDay: 0=日,1=一,...,6=六；列顺序同 getDay
  const firstWeekDay = firstDate.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: DialogCell[] = [];

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
    const special = props.yearData[dateStr];

    let type: "normal" | "holiday" | "weekend" | "overtime" = "normal";
    let hasHolidayDot = false;
    let isWeekendOvertime = false;

    if (special) {
      if (special.holiday) {
        type = "holiday";
        hasHolidayDot = true;
      } else {
        type = "overtime";
        if (weekday === 0 || weekday === 6) {
          isWeekendOvertime = true;
        }
      }
    } else if (weekday === 0 || weekday === 6) {
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

function onDayClick(cell: DialogCell) {
  if (!cell.info || !cell.dateStr) return;
  activePopoverDate.value = activePopoverDate.value === cell.dateStr ? null : cell.dateStr;
}
</script>

<style lang="scss" scoped>
.calendar-dialog-body {
  padding-top: 4px;
  padding-bottom: 16px;
  height: 55vh;
  width: 600px;

  &--month {
    display: flex;
    flex-direction: column;
    width: 720px;
    height: 62vh;
    min-height: 420px;
  }
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  margin-bottom: 10px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--theme-text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-holiday {
  background: rgba(248, 113, 113, 0.85);
}

.legend-rest {
  background: rgba(59, 130, 246, 0.7);
}

.legend-overtime {
  background: rgba(34, 197, 94, 0.9);
}

.legend-today {
  background: rgba(52, 211, 153, 0.9);
}

.calendar-year-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-bottom: 4px;
}

.calendar-month-block {
  border-radius: 12px;
  border: 1px solid var(--theme-border);
  padding: 8px;
  background: rgba(15, 23, 42, 0.02);
}

.calendar-month-title {
  display: block;
  width: 100%;
  padding: 0;
  margin-bottom: 4px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  color: var(--theme-text);
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    color: var(--theme-accent-solid);
    background: var(--theme-hover);
  }
}

.calendar-back-btn {
  margin-bottom: 8px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-hover);
  color: var(--theme-text);
  cursor: pointer;

  &:hover {
    background: var(--theme-accent-bg);
    color: var(--theme-accent-solid);
  }
}

.calendar-month-detail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.calendar-month-detail-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text);
}

.calendar-month-detail-meta {
  font-size: 12px;
  color: var(--theme-text-muted);
}

.calendar-month-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-month-detail-layout {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.calendar-month-detail-cal {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.calendar-week-header--detail {
  flex-shrink: 0;
}

.calendar-week-header--detail .week-cell {
  font-size: 12px;
  padding: 4px 0;
}

.calendar-days-grid--detail {
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: 4px;
  grid-auto-rows: 1fr;

  :deep(.popover-trigger) {
    display: flex;
    min-height: 0;
    height: 100%;
  }
}

.day-cell--detail {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  border-radius: 8px;
  align-items: stretch;
  justify-content: flex-start;
  padding: 6px 4px;
  box-sizing: border-box;
  text-align: center;
  border: 1px solid var(--theme-border);
}

.day-number--detail {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.day-holiday-label {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  width: 100%;
  font-size: 10px;
  line-height: 1.35;
  word-break: break-all;
}

.day-holiday-label--holiday {
  color: #e85d5d;
}

.day-holiday-label--overtime {
  color: #16a34a;
}

.day-cell--detail.day-cell--plain {
  justify-content: center;
}

.day-cell--detail.day-empty {
  border-color: transparent;
  background: transparent;
}

.calendar-month-events {
  width: 220px;
  flex-shrink: 0;
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.02);
  overflow-y: auto;
}

.calendar-month-events-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--theme-text);
}

.calendar-month-events-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.calendar-month-events-item {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid var(--theme-border);
  font-size: 12px;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.events-item-date {
  color: var(--theme-text-muted);
  font-size: 11px;
}

.events-item-name {
  font-weight: 600;
  color: var(--theme-text);
}

.events-item-tag {
  font-size: 10px;
  color: var(--theme-text-muted);
}

.calendar-month-events-item.is-holiday .events-item-tag {
  color: #f97373;
}

.calendar-month-events-item.is-overtime .events-item-tag {
  color: #22c55e;
}

.calendar-month-events-empty {
  margin: 0;
  font-size: 12px;
  color: var(--theme-text-muted);
  line-height: 1.5;
}

.calendar-week-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  margin-bottom: 2px;
}

.week-cell {
  text-align: center;
  font-size: 10px;
  color: var(--theme-text-muted);
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
}

.day-cell {
  width: 100%;
  min-height: 18px;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
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
  top: 2px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  cursor: pointer;
}

.day-dot-holiday {
  background: #f97373;
}

.day-dot-overtime {
  background: #22c55e;
}

.day-type-holiday {
  background: rgba(248, 113, 113, 0.12);
  color: #f97373;
}

.day-type-weekend {
  background: rgba(59, 130, 246, 0.06);
  color: var(--theme-text);
}

.day-type-overtime {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.day-weekend-overtime {
  background: rgba(34, 197, 94, 0.22);
}

.day-today {
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.9);
}
</style>
