<template>
  <BaseDialog v-model="innerVisible" title="闹钟任务" modal-class="alarm-center-dialog">
    <template #default>
      <div class="alarm-center__body">
        <div class="alarm-center__header">
          <span class="alarm-center__subtitle">全部闹钟与定时任务</span>
          <button class="alarm-center__add-btn" type="button" @click="handleCreate">+</button>
        </div>

        <ul class="alarm-center__list">
          <li v-if="!items.length" class="alarm-center__empty">暂无任务，点击右上角 + 新建</li>
          <li
            v-for="item in items"
            :key="item.id"
            class="alarm-center__item"
            @click="handleEdit(item)"
          >
            <div class="alarm-center__item-main">
              <span class="alarm-center__title">
                <template v-if="item.type === 1">
                  {{ item.time }}
                </template>
                <template v-else> {{ item.minutes }} 分钟 </template>
              </span>
            </div>
            <Switch :model-value="item.enable" @change="onToggle(item, $event)" />
          </li>
        </ul>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseDialog from "@/components/Dialog/index.vue";
import Switch from "@/components/Switch/index.vue";

interface AlarmItemLike {
  id: string;
  type: 1 | 2;
  time: string;
  minutes: number;
  repeat: boolean;
  title: string;
  message: string;
  enable: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  items: AlarmItemLike[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "create"): void;
  (e: "edit", item: AlarmItemLike): void;
  (e: "toggle", payload: { id: string; enable: boolean }): void;
}>();

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

function handleCreate() {
  emit("create");
}

function handleEdit(item: AlarmItemLike) {
  emit("edit", item);
}

function onToggle(item: AlarmItemLike, checked: boolean) {
  emit("toggle", { id: item.id, enable: checked });
}
</script>

<style scoped lang="scss">
.alarm-center__body {
  width: 320px;
  height: 400px;
}

.alarm-center__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  background-color: #dededf;
  padding: 6px 12px;
  border-radius: 6px;
}

.alarm-center__subtitle {
  font-size: 12px;
  color: #666;
}

.alarm-center__add-btn {
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

.alarm-center__add-btn:hover {
  background: #1d39c4;
}

.alarm-center__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 260px;
  overflow-y: auto;
}

.alarm-center__empty {
  padding: 8px 0;
  font-size: 12px;
  color: #9ca3af;
}

.alarm-center__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
}

.alarm-center__item + .alarm-center__item {
  border-top: 1px solid rgba(148, 163, 184, 0.3);
}

.alarm-center__item-main {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.alarm-center__title {
  font-size: 16px;
  font-weight: 500;
  color: #111827;
}

.alarm-center__desc {
  font-size: 12px;
  color: #6b7280;
}
</style>
