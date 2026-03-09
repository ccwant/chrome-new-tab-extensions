<template>
  <div class="note-widget" @click="openDialog">
    <ul class="note-list">
      <li v-for="(note, index) in simpleNotes" :key="note.id" class="note-item">
        <span class="note-text">{{
          note.title || (note.content || "").split("\n")[0] || `便签 ${index + 1}`
        }}</span>
      </li>
      <li v-if="simpleNotes.length === 0" class="note-empty">点击这里添加第一条便签</li>
    </ul>
  </div>

  <NotesDialog
    :model-value="dialogVisible"
    :notes="notes"
    :active-index="activeIndex"
    @update:model-value="dialogVisible = $event"
    @update:active-index="(i) => (activeIndex = i)"
    @add-note="addNote"
    @delete-note="deleteNote"
    @update-note="updateNote"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import NotesDialog from "./NotesDialog.vue";

defineOptions({
  inheritAttrs: false,
});

interface NoteItem {
  id: string;
  title: string;
  content: string;
}

const STORAGE_KEY = "newtab_notes_v1";

const notes = reactive<NoteItem[]>([]);
const dialogVisible = ref(false);
const activeIndex = ref(0);

// 展示5条
const simpleNotes = computed(() => {
  return notes.slice(0, 5);
});

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw) as NoteItem[];
    if (Array.isArray(arr)) {
      notes.splice(0, notes.length, ...arr);
    }
  } catch {
    // ignore
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

function openDialog() {
  dialogVisible.value = true;
  if (!notes.length) addNote();
}

function addNote() {
  const n: NoteItem = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title: "",
    content: "",
  };
  notes.unshift(n);
  activeIndex.value = 0;
}

function deleteNote() {
  if (!notes.length || activeIndex.value < 0) return;
  notes.splice(activeIndex.value, 1);
  if (activeIndex.value >= notes.length) activeIndex.value = notes.length - 1;
}

function updateNote(index: number, payload: Partial<NoteItem>) {
  const note = notes[index];
  if (!note) return;
  Object.assign(note, payload);
}

onMounted(() => {
  loadNotes();
  if (!notes.length) {
    // 初次使用保持空列表，由用户主动新增
  }
});

watch(
  notes,
  () => {
    saveNotes();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.note-widget {
  width: 100%;
  height: 100%;
  background-color: var(--theme-surface);
  padding: 8px 0;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: pointer;
}

.note-list {
  margin: 0;
  padding: 0;
  list-style: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--theme-text);
  border-bottom: 1px solid var(--theme-border);
  padding: 3px 10px;

  &:last-child {
    border-bottom: none;
  }
}

.note-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.note-empty {
  font-size: 12px;
  color: var(--theme-text-muted);
}
</style>
