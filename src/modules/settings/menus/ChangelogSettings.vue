<template>
  <div class="changelog-content">
    <div v-html="marked(changelog)"></div>
  </div>
</template>
<script setup lang="ts">
import { marked } from "marked";
const changelog = __CHANGELOG__;
</script>

<style lang="scss" scoped>
.changelog-content {
  pre {
    margin: 0;
    font-size: 12px;
    line-height: normal;
    color: var(--theme-text);
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
