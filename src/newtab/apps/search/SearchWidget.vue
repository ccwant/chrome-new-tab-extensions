<template>
  <div class="search-widget">
    <div class="search-box">
      <Popover
        :model-value="engineMenuOpen"
        placement="bottom-start"
        :append-to-body="true"
        @update:model-value="engineMenuOpen = $event"
      >
        <button class="search-engine" type="button" @click.stop="toggleEngineMenu">
          <span class="search-engine-icon" :title="currentEngine.label">
            <img v-if="typeof currentEngine.icon === 'string'" :src="currentEngine.icon" alt="" />
          </span>
        </button>
        <template #content>
          <ul class="search-engine-menu">
            <li
              v-for="engine in engines"
              :key="engine.id"
              class="search-engine-item"
              @click.stop="setEngine(engine.id)"
            >
              <span class="search-engine-item-icon">
                <img v-if="engine.icon" :src="engine.icon" alt="" />
              </span>
              <span>{{ engine.label }}</span>
            </li>
          </ul>
        </template>
      </Popover>
      <input
        v-model="keyword"
        class="search-input"
        type="text"
        placeholder="搜索内容…"
        @keydown.enter.prevent="doSearch"
      />
      <button class="search-action" type="button" @click="doSearch">🔍</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import Popover from "@/components/Popover/index.vue";

defineOptions({
  inheritAttrs: false,
});

type EngineId = "baidu" | "bing" | "google";

const engines: { id: EngineId; label: string; icon: string; buildUrl: (q: string) => string }[] = [
  {
    id: "baidu",
    label: "Baidu",
    icon: "/images/search/baidu.png",
    buildUrl: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
  },
  {
    id: "bing",
    label: "Bing",
    icon: "/images/search/bing_p_rr_teal_min.png",
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "google",
    label: "Google",
    icon: "/images/search/googleg_alldp.png",
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
];

const activeEngineId = ref<EngineId>("baidu");
const keyword = ref("");
const engineMenuOpen = ref(false);

const currentEngine = computed(() => engines.find((e) => e.id === activeEngineId.value)!);

function toggleEngineMenu() {
  engineMenuOpen.value = !engineMenuOpen.value;
}

function setEngine(id: EngineId) {
  activeEngineId.value = id;
  engineMenuOpen.value = false;
}

function doSearch() {
  const q = keyword.value.trim();
  if (!q) return;
  const url = currentEngine.value.buildUrl(q);
  window.open(url, "_blank", "noopener,noreferrer");
}
</script>

<style lang="scss" scoped>
.search-widget {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-box {
  width: 100%;
  height: 40px;
  border-radius: 20px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  overflow: hidden;
}

.search-engine {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 50px;
  border: none;
  border-right: 1px solid var(--theme-border);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--theme-text);
}

.search-engine-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.search-engine-name {
  font-weight: 500;
}

.search-engine-arrow {
  font-size: 10px;
  color: var(--theme-text-muted);
}

.search-engine-menu {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.search-engine-item {
  padding: 6px 10px;
  font-size: 13px;
  color: var(--theme-text);
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: var(--theme-hover);
  }
}

.search-engine-item-icon {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.search-engine-item {
  padding: 6px 10px;
  font-size: 13px;
  color: var(--theme-text);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--theme-hover);
  }
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  padding: 0 10px;
  font-size: 14px;
  background: transparent;
  color: var(--theme-text);
  outline: none;

  &::placeholder {
    color: var(--theme-text-muted);
  }
}

.search-action {
  width: 50px;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--theme-text-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: var(--theme-accent-bg);
    color: var(--theme-accent-solid);
  }
}
</style>
