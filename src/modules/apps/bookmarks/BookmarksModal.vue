<template>
  <Dialog :model-value="visible" title="书签" @update:model-value="handleUpdate">
    <div class="bookmarks-modal-body">
      <div class="bookmarks-folders">
        <div v-if="folders.length === 0" class="bookmarks-empty">暂无书签目录</div>
        <div
          v-for="{ node, depth } in folders"
          v-else
          :key="node.id"
          class="bookmarks-folder-item"
          :class="{ selected: currentFolder?.id === node.id }"
          :style="{ paddingLeft: `${8 + depth * 12}px` }"
          @click="onFolderClick(node)"
          @dblclick.prevent.stop="onFolderDblClick(node)"
        >
          <button
            v-if="hasChildFolders(node)"
            type="button"
            class="bookmarks-folder-expand"
            @click.stop="toggleExpand(node)"
          >
            {{ expandedIds.has(node.id) ? "▼" : "▶" }}
          </button>
          <span v-else class="bookmarks-folder-expand no-expand">·</span>
          <span class="bookmarks-folder-label">{{ getFolderName(node) }}</span>
        </div>
      </div>
      <div class="bookmarks-content">
        <div class="bookmarks-content-header">
          <button type="button" class="bookmarks-add-folder-btn" @click="addFolder">
            + 新增文件夹
          </button>
        </div>
        <div class="bookmarks-content-list">
          <div v-if="contentItems.length === 0" class="bookmarks-empty">此目录为空</div>
          <div
            v-for="child in contentItems"
            v-else
            :key="child.id"
            class="bookmarks-list-row"
            :class="child.isFolder ? 'bookmarks-list-row-folder' : 'bookmarks-list-row-link'"
            draggable="true"
            :data-id="child.id"
            @click="onContentClick($event, child)"
          >
            <div class="bookmarks-list-main">
              <span v-if="child.isFolder" class="bookmarks-row-icon">📁</span>
              <img
                v-else-if="getFaviconUrl(child.url)"
                class="bookmarks-row-favicon"
                :src="getFaviconUrl(child.url)"
                alt=""
              />
              <span class="bookmarks-row-title">
                {{ child.isFolder ? getFolderName(child) : child.title || child.url || "未命名" }}
              </span>
            </div>
            <div
              class="bookmarks-row-menu-wrap"
              @mouseenter="showMenu(child.id)"
              @mouseleave="scheduleMenuHide"
            >
              <button type="button" class="bookmarks-row-menu-btn" aria-label="操作">⋮</button>
              <div
                class="bookmarks-row-menu"
                :class="{ visible: activeMenuId === child.id }"
                @click.stop
                @mouseenter="showMenu(child.id)"
                @mouseleave="scheduleMenuHide"
              >
                <template v-if="child.isFolder">
                  <button v-if="!ROOT_IDS.has(child.id)" type="button" @click="renameFolder(child)">
                    重命名
                  </button>
                  <button type="button" @click="deleteFolder(child)">删除</button>
                </template>
                <template v-else>
                  <button v-if="addApp" type="button" @click="addBookmarkToApps(child)">
                    添加到应用
                  </button>
                  <button type="button" @click="editBookmark(child)">编辑</button>
                  <button type="button" @click="deleteBookmark(child)">删除</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import Dialog from "@/components/Dialog/index.vue";

const FOLDER_NAMES: Record<string, string> = {
  "1": "书签栏",
  "2": "其他书签",
  "3": "移动设备书签",
};
const ROOT_IDS = new Set(["1", "2", "3"]);

interface BookmarkNode {
  id: string;
  parentId?: string;
  title?: string;
  url?: string;
  children?: BookmarkNode[];
}

function getFolderName(node: BookmarkNode): string {
  if (node.id && FOLDER_NAMES[node.id]) return FOLDER_NAMES[node.id];
  return node.title || "未命名文件夹";
}

function getFaviconUrl(url: string | undefined): string {
  if (!url || typeof url !== "string") return "";
  try {
    if (typeof chrome === "undefined" || !chrome.runtime) return "";
    const faviconUrl = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`);
    faviconUrl.searchParams.set("pageUrl", url);
    faviconUrl.searchParams.set("size", "64");
    return faviconUrl.toString();
  } catch {
    return "";
  }
}

function hasChildFolders(node: BookmarkNode): boolean {
  return !!(node.children && node.children.some((c) => c.children));
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    addApp?: ((p: Record<string, unknown>) => boolean) | null;
    showToast?: ((msg: string) => void) | null;
  }>(),
  { addApp: null, showToast: null }
);
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const visible = ref(false);
const treeRoots = ref<BookmarkNode[] | null>(null);
const folders = ref<{ node: BookmarkNode; depth: number }[]>([]);
const currentFolder = ref<BookmarkNode | null>(null);
const contentItems = ref<(BookmarkNode & { isFolder: boolean })[]>([]);
const expandedIds = reactive(new Set<string>());
const allFoldersFlat = ref<{ node: BookmarkNode; depth: number }[]>([]);
const folderClickTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const activeMenuId = ref<string | null>(null);
const menuHideTimer = ref<ReturnType<typeof setTimeout> | null>(null);

function collectFolders(
  nodes: BookmarkNode[] | undefined,
  list: { node: BookmarkNode; depth: number }[] = [],
  depth = 0
): { node: BookmarkNode; depth: number }[] {
  if (!nodes) return list;
  for (const node of nodes) {
    if (node.children) {
      list.push({ node, depth });
      collectFolders(node.children, list, depth + 1);
    }
  }
  return list;
}

function collectWithExpand(
  nodes: BookmarkNode[] | undefined,
  list: { node: BookmarkNode; depth: number }[] = [],
  depth = 0
): { node: BookmarkNode; depth: number }[] {
  if (!nodes) return list;
  for (const node of nodes) {
    if (node.children) {
      list.push({ node, depth });
      if (expandedIds.has(node.id)) {
        collectWithExpand(node.children, list, depth + 1);
      }
    }
  }
  return list;
}

function clearMenuHideTimer() {
  if (menuHideTimer.value) {
    clearTimeout(menuHideTimer.value);
    menuHideTimer.value = null;
  }
}

function scheduleMenuHide() {
  clearMenuHideTimer();
  menuHideTimer.value = setTimeout(() => {
    activeMenuId.value = null;
    menuHideTimer.value = null;
  }, 150);
}

function showMenu(id: string) {
  clearMenuHideTimer();
  activeMenuId.value = id;
}

function expandAncestors(node: BookmarkNode) {
  const idToNode = new Map<string, BookmarkNode>();
  allFoldersFlat.value.forEach((f) => idToNode.set(f.node.id, f.node));
  let id: string | undefined = node.parentId;
  while (id && id !== "0") {
    expandedIds.add(id);
    const parent = idToNode.get(id);
    id = parent ? parent.parentId : undefined;
  }
}

function selectFolder(node: BookmarkNode) {
  currentFolder.value = node;
  expandAncestors(node);
  folders.value = collectWithExpand(treeRoots.value ?? undefined);
  const children = node.children || [];
  contentItems.value = children.map((child) => ({
    ...child,
    isFolder: !!child.children,
  }));
}

function toggleExpand(node: BookmarkNode) {
  if (expandedIds.has(node.id)) {
    expandedIds.delete(node.id);
  } else {
    expandedIds.add(node.id);
  }
  folders.value = collectWithExpand(treeRoots.value ?? undefined);
}

function onFolderClick(node: BookmarkNode) {
  if (folderClickTimer.value) clearTimeout(folderClickTimer.value);
  folderClickTimer.value = setTimeout(() => {
    folderClickTimer.value = null;
    selectFolder(node);
  }, 200);
}

function onFolderDblClick(node: BookmarkNode) {
  if (folderClickTimer.value) {
    clearTimeout(folderClickTimer.value);
    folderClickTimer.value = null;
  }
  if (!hasChildFolders(node)) return;
  toggleExpand(node);
}

function loadTree() {
  if (typeof chrome === "undefined" || !chrome.bookmarks) return;
  chrome.bookmarks.getTree((tree: BookmarkNode[]) => {
    if (!tree?.[0]?.children) return;
    const roots = tree[0].children!;
    treeRoots.value = roots;
    if (expandedIds.size === 0) {
      roots.forEach((r) => expandedIds.add(r.id));
    }
    allFoldersFlat.value = collectFolders(roots);
    folders.value = collectWithExpand(roots);
    if (!currentFolder.value && folders.value[0]) {
      selectFolder(folders.value[0].node);
    } else if (currentFolder.value) {
      chrome.bookmarks!.getSubTree(currentFolder.value.id, (nodes: BookmarkNode[]) => {
        if (nodes?.[0]) selectFolder(nodes[0]);
      });
    }
  });
}

function addFolder() {
  const title = prompt("文件夹名称", "新文件夹");
  if (title == null || !title.trim() || !currentFolder.value) return;
  chrome.bookmarks!.create({ parentId: currentFolder.value.id, title: title.trim() }, loadTree);
}

function renameFolder(node: BookmarkNode) {
  const title = prompt("文件夹名称", getFolderName(node));
  if (title == null || !title.trim()) return;
  chrome.bookmarks!.update(node.id, { title: title.trim() }, loadTree);
}

function deleteFolder(node: BookmarkNode) {
  if (!confirm("确定删除该文件夹？其内书签将被移除。")) return;
  chrome.bookmarks!.removeTree(node.id, loadTree);
}

function editBookmark(node: BookmarkNode) {
  const newTitle = prompt("标题", node.title || "");
  const newUrl = prompt("链接", node.url || "");
  if (newTitle == null || newUrl == null) return;
  chrome.bookmarks!.update(node.id, { title: newTitle.trim(), url: newUrl.trim() }, loadTree);
}

function deleteBookmark(node: BookmarkNode) {
  if (!confirm("确定删除该书签？")) return;
  chrome.bookmarks!.remove(node.id, loadTree);
}

function addBookmarkToApps(child: BookmarkNode) {
  if (!props.addApp) return;
  const ok = props.addApp({
    name: child.title || child.url || "未命名",
    url: child.url || "",
    iconDataUrl: "",
    iconUrl: getFaviconUrl(child.url),
  });
  if (ok) props.showToast?.("已添加到应用");
}

function onContentClick(e: MouseEvent, child: BookmarkNode & { isFolder: boolean }) {
  if ((e.target as Element).closest(".bookmarks-row-menu-wrap")) return;
  if (child.isFolder) selectFolder(child);
  else window.open(child.url, "_blank", "noopener,noreferrer");
}

function close() {
  visible.value = false;
  emit("update:modelValue", false);
}

function handleUpdate(v: boolean) {
  visible.value = v;
  emit("update:modelValue", v);
}

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v;
    if (v) loadTree();
  }
);

onMounted(() => {
  visible.value = props.modelValue;
  if (props.modelValue) loadTree();
});
</script>

<style lang="scss" scoped>
.bookmarks-modal-body {
  width: 720px;
  height: 75vh;
  display: flex;
  flex-direction: row;
  border-top: 1px solid var(--theme-border);
}

.bookmarks-folders {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--theme-border);
  padding: 12px 0;
}

.bookmarks-folder-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--theme-text);
  cursor: pointer;
  transition: background 0.2s;

  &:hover,
  &.selected {
    background: var(--theme-hover-light);
  }

  &.selected {
    font-weight: 600;
  }
}

.bookmarks-folder-expand {
  width: 20px;
  flex-shrink: 0;
  border: none;
  background: none;
  color: var(--theme-text-muted);
  font-size: 10px;
  cursor: pointer;
  padding: 0;

  &.no-expand {
    opacity: 0.5;
  }
}

.bookmarks-folder-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.bookmarks-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bookmarks-content-header {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 5px;
  border-bottom: 1px solid var(--theme-border);
}

.bookmarks-add-folder-btn {
  padding: 6px 8px;
  font-size: 12px;
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  background: var(--theme-surface-dim);
  color: var(--theme-text);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--theme-hover);
  }
}

.bookmarks-content-list {
  flex: 1;
  overflow-y: auto;
}

.bookmarks-empty {
  padding: 24px;
  text-align: center;
  color: var(--theme-text-muted);
  font-size: 13px;
}

.bookmarks-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--theme-hover-light);
  }

  &-folder {
    font-weight: 500;
  }

  &-link {
    .bookmarks-row-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
  }
}

.bookmarks-list-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.bookmarks-row-icon {
  font-size: 16px;
}

.bookmarks-row-favicon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 4px;
}

.bookmarks-row-title {
  font-size: 13px;
  color: var(--theme-text);
}

.bookmarks-row-menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.bookmarks-row-menu-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--theme-text-muted);
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;

  &:hover {
    background: var(--theme-hover);
    color: var(--theme-text);
  }
}

.bookmarks-row-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  min-width: 120px;
  padding: 4px 0;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 10px;
  box-shadow: 0 4px 12px var(--theme-shadow);
  z-index: 10;
  display: none;

  &.visible {
    display: block;
  }

  button {
    display: block;
    width: 100%;
    padding: 8px 14px;
    text-align: left;
    font-size: 12px;
    border: none;
    background: none;
    color: var(--theme-text);
    cursor: pointer;

    &:hover {
      background: var(--theme-hover);
    }
  }
}
</style>
