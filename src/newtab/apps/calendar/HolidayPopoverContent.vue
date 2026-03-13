<template>
  <div class="calendar-popover-content">
    <div class="popover-title">{{ info.name }}</div>
    <div class="popover-date">{{ info.date }}</div>
    <div class="popover-tag">
      {{ info.holiday ? "法定节假日" : "调休上班日" }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface HolidayInfo {
  date: string;
  days: number;
  holiday: boolean;
  name: string;
}

defineProps<{
  info: HolidayInfo;
}>();
</script>

<style lang="scss" scoped>
.calendar-popover-content {
  padding: 6px 8px;
}

.popover-title {
  font-weight: 600;
  font-size: 11px;
  margin-bottom: 2px;
}

.popover-date {
  font-size: 10px;
  color: var(--theme-text-muted);
  margin-bottom: 4px;
}

.popover-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  background: rgba(248, 113, 113, 0.12);
  color: #f97373;
}
</style>

