<template>
  <Dialog
    v-model="visible"
    :title="`${year} 年全年日历`"
    modal-class="calendar-dialog"
    append-to-body
  >
    <div class="calendar-dialog-body">
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
      <div class="calendar-year-grid">
        <div v-for="month in 12" :key="month" class="calendar-month-block">
          <div class="calendar-month-title">{{ month }} 月</div>
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
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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
  background: rgba(234, 179, 8, 0.9);
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
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--theme-text);
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
  background: #ef4444;
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
  background: rgba(234, 179, 8, 0.12);
  color: #eab308;
}

.day-weekend-overtime {
  background: rgba(248, 113, 113, 0.22);
}

.day-today {
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.9);
}
</style>
