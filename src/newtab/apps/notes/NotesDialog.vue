<template>
  <Dialog
    :model-value="modelValue"
    title="便签"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="note-dialog-body">
      <aside class="note-sidebar">
        <div class="note-sidebar-header">
          <button class="note-add-btn" type="button" @click.stop="$emit('add-note')">+ 新增</button>
        </div>
        <div class="note-sidebar-list">
          <div
            v-for="(note, index) in notes"
            :key="note.id"
            class="note-sidebar-item"
            :class="{ active: index === activeIndex }"
            @click="$emit('update:activeIndex', index)"
          >
            <div class="note-sidebar-title">
              {{ note.title || (note.content || "").split("\n")[0] || `便签 ${index + 1}` }}
            </div>
            <div class="note-sidebar-preview">{{ note.content }}</div>
          </div>
          <div v-if="notes.length === 0" class="note-sidebar-empty">
            暂无便签，点击左上角「新增」开始记录。
          </div>
        </div>
      </aside>
      <section class="note-editor" v-if="currentNote">
        <input
          :value="currentNote.title"
          class="note-title-input"
          type="text"
          placeholder="标题（可选）"
          @input="onTitleInput"
        />
        <textarea
          :value="currentNote.content"
          class="note-content-input"
          placeholder="在这里记录你的想法、清单或备忘。"
          @input="onContentInput"
        />
        <div class="note-editor-footer">
          <button class="note-delete-btn" type="button" @click="$emit('delete-note')">删除</button>
        </div>
      </section>
      <section v-else class="note-editor note-editor-empty">还没有选中的便签。</section>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Dialog from "@/components/Dialog/index.vue";

interface NoteItem {
  id: string;
  title: string;
  content: string;
}

const props = defineProps<{
  modelValue: boolean;
  notes: NoteItem[];
  activeIndex: number;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "update:activeIndex", v: number): void;
  (e: "add-note"): void;
  (e: "delete-note"): void;
  (e: "update-note", index: number, payload: Partial<NoteItem>): void;
}>();

const currentNote = computed<NoteItem | null>(() => props.notes[props.activeIndex] ?? null);

function onTitleInput(e: Event) {
  if (!currentNote.value) return;
  const value = (e.target as HTMLInputElement).value;
  emit("update-note", props.activeIndex, { title: value });
}

function onContentInput(e: Event) {
  if (!currentNote.value) return;
  const value = (e.target as HTMLTextAreaElement).value;
  emit("update-note", props.activeIndex, { content: value });
}
</script>

<style lang="scss" scoped>
.note-dialog-body {
  display: flex;
  width: 720px;
  height: 50vh;
}

.note-sidebar {
  width: 220px;
  border-right: 1px solid var(--theme-border);
  display: flex;
  flex-direction: column;
}

.note-sidebar-header {
  padding: 0 20px;
  height: 46px;
  border-bottom: 1px solid var(--theme-border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.note-add-btn {
  width: 100%;
  font-size: 13px;
  border-radius: 8px;
  border: 1px dashed var(--theme-border-strong);
  background: var(--theme-surface-dim);
  color: var(--theme-text);
  cursor: pointer;

  &:hover {
    background: var(--theme-hover);
  }
}

.note-sidebar-list {
  flex: 1;
  overflow-y: auto;
}

.note-sidebar-item {
  padding: 8px 12px;
  cursor: pointer;

  &.active {
    background: var(--theme-accent-bg);
  }
}

.note-sidebar-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
}

.note-sidebar-preview {
  margin-top: 2px;
  font-size: 11px;
  color: var(--theme-text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: left;
}

.note-sidebar-empty {
  padding: 12px;
  font-size: 12px;
  color: var(--theme-text-muted);
}

.note-editor {
  flex: 1;
  padding: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-title-input {
  height: 46px;
  border: none;
  border-bottom: 1px solid var(--theme-border);
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--theme-text);
  outline: none;
}

.note-content-input {
  flex: 1;
  border: none;
  padding: 10px;
  font-size: 13px;
  line-height: 1.6;
  background: transparent;
  color: var(--theme-text);
  resize: none;
  outline: none;
}

.note-editor-footer {
  display: flex;
  justify-content: flex-end;
}

.note-delete-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--theme-border);
  background: var(--theme-surface-dim);
  color: var(--theme-text-muted);
  cursor: pointer;

  &:hover {
    background: var(--theme-hover);
    color: var(--theme-text);
  }
}

.note-editor-empty {
  align-items: center;
  justify-content: center;
  color: var(--theme-text-muted);
  font-size: 13px;
}
</style>
