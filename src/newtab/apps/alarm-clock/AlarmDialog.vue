<template>
  <BaseDialog
    v-model="innerVisible"
    title="闹钟设置"
    modal-class="alarm-clock-dialog"
    :append-to-body="true"
  >
    <template #default>
      <div class="alarm-clock-dialog__body">
        <div class="alarm-clock-dialog__tabs">
          <button
            type="button"
            class="alarm-clock-dialog__tab"
            :class="{ 'alarm-clock-dialog__tab--active': localType === 1 }"
            @click="localType = 1"
          >
            添加闹钟
          </button>
          <button
            type="button"
            class="alarm-clock-dialog__tab"
            :class="{ 'alarm-clock-dialog__tab--active': localType === 2 }"
            @click="localType = 2"
          >
            定时任务
          </button>
        </div>

        <div v-if="localType === 1" class="alarm-clock-dialog__form">
          <label class="alarm-clock-dialog__field">
            <span class="alarm-clock-dialog__label">时间</span>
            <input v-model="localTime" type="time" class="alarm-clock-dialog__input" />
          </label>
          <label class="alarm-clock-dialog__field alarm-clock-dialog__field--inline">
            <span class="alarm-clock-dialog__label">每天重复</span>
            <input v-model="localRepeat" type="checkbox" />
          </label>
        </div>
        <div v-else class="alarm-clock-dialog__form">
          <label class="alarm-clock-dialog__field">
            <span class="alarm-clock-dialog__label">倒计时（分钟）</span>
            <input
              v-model.number="localMinutes"
              type="number"
              min="1"
              class="alarm-clock-dialog__input"
            />
          </label>
          <label class="alarm-clock-dialog__field alarm-clock-dialog__field--inline">
            <span class="alarm-clock-dialog__label">重复</span>
            <input v-model="localRepeat" type="checkbox" />
          </label>
        </div>
      </div>
    </template>

    <template #footer>
      <button
        v-if="mode === 'edit'"
        type="button"
        class="alarm-clock-dialog__btn alarm-clock-dialog__btn--plain"
        @click="handleDelete"
      >
        删除
      </button>
      <div class="alarm-clock-dialog__footer-right">
        <button
          type="button"
          class="alarm-clock-dialog__btn alarm-clock-dialog__btn--plain"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="button"
          class="alarm-clock-dialog__btn alarm-clock-dialog__btn--primary"
          @click="handleConfirm"
        >
          确定
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseDialog from "@/components/Dialog/index.vue";

interface AlarmItemLike {
  id: string;
  type: 1 | 2;
  time: string;
  minutes: number;
  repeat: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  item?: AlarmItemLike | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", payload: AlarmItemLike): void;
  (e: "delete", id: string): void;
}>();

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const localType = ref<1 | 2>(1);
const localTime = ref("08:00");
const localMinutes = ref(1);
const localRepeat = ref(true);

const isCreate = computed(() => props.mode === "create");

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return;
    if (props.item && !isCreate.value) {
      localType.value = props.item.type;
      localTime.value = props.item.time || "08:00";
      localMinutes.value = props.item.minutes || 1;
      localRepeat.value = props.item.repeat;
    } else {
      localType.value = 1;
      localTime.value = "08:00";
      localMinutes.value = 1;
      localRepeat.value = true;
    }
  },
  { immediate: true }
);

function handleCancel() {
  emit("update:modelValue", false);
}

function handleConfirm() {
  if (localType.value === 2 && (!localMinutes.value || localMinutes.value <= 0)) {
    localMinutes.value = 1;
  }

  const payload: AlarmItemLike = {
    id: props.item?.id || "",
    type: localType.value,
    time: localType.value === 1 ? localTime.value : "",
    minutes: localType.value === 1 ? 0 : localMinutes.value,
    repeat: localRepeat.value,
  };
  emit("submit", payload);
  emit("update:modelValue", false);
}

function handleDelete() {
  emit("delete", props.item?.id || "");
  emit("update:modelValue", false);
}
</script>

<style scoped lang="scss">
.alarm-clock-dialog__body {
  padding: 8px 18px 0;
  width: 320px;
}

.alarm-clock-dialog__tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.alarm-clock-dialog__tab {
  flex: 1;
  padding: 6px 0;
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  color: #666;
}

.alarm-clock-dialog__tab--active {
  background: #dededf;
  color: #1d39c4;
  font-weight: 500;
}

.alarm-clock-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alarm-clock-dialog__field {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.alarm-clock-dialog__field--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.alarm-clock-dialog__label {
  margin-bottom: 4px;
  color: #555;
}

.alarm-clock-dialog__input {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  font-size: 12px;
}

.alarm-clock-dialog__footer-right {
  display: flex;
  gap: 8px;
}

.alarm-clock-dialog__btn {
  min-width: 56px;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.alarm-clock-dialog__btn--plain {
  background-color: transparent;
  color: #666;
}

.alarm-clock-dialog__btn--primary {
  background-color: #2f54eb;
  color: #fff;
}

.alarm-clock-dialog__btn--primary:hover {
  background-color: #1d39c4;
}
</style>
