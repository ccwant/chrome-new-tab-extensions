<template>
  <div class="about-content">
    <div class="about-header">
      <div class="about-name">{{ displayName }}</div>
      <div class="about-version">v{{ version }}</div>
    </div>
    <p class="about-desc">
      一款基于 Vue 3 + TypeScript + Vite 构建的 Chrome
      新标签页扩展。支持桌面网格、小组件、自定义壁纸等。
    </p>
    <div class="about-links">
      <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="about-link">
        GitHub 仓库
      </a>
    </div>
    <div class="about-author">
      <span class="about-label">作者</span>
      <span class="about-value">{{ author }}</span>
    </div>
    <div class="about-disclaimer">
      <div class="about-disclaimer-title">免责声明</div>
      <p>
        本项目为开源项目，用于技术学习研究，请勿用于非法用途。本项目中涉及到的图片与字体均为网络资源，部分第三方插件均为网络公开插件，若涉及侵权，请告知我们，我站会在第一时间删除
      </p>
      <p>
        本项目收录的网站信息来自网络和用户自行添加，版权争议与本站无关，导航网站中可能出现的广告与本站无关，请用户自行辨别，如有发现非法，侵权网站，请告知我们，我站会在第一时间删除
      </p>
      <p>使用本软件所产生的任何风险由使用者自行承担，作者及贡献者不承担任何责任。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const version = __VERSION__;
const displayName = __DISPLAY_NAME__;
const author = __AUTHOR__;
const githubUrl = __GITHUB_URL__;
</script>

<style lang="scss" scoped>
.about-content {
  font-size: 14px;
  color: var(--theme-text);
}

.about-header {
  margin-bottom: 16px;
}

.about-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text);
}

.about-version {
  font-size: 12px;
  color: var(--theme-text-muted);
  margin-top: 4px;
}

.about-desc {
  margin: 0 0 20px;
  line-height: 1.6;
  color: var(--theme-text-muted);
}

.about-links {
  margin-bottom: 20px;
}

.about-link {
  color: var(--theme-accent-solid);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.about-author {
  padding-top: 16px;
  border-top: 1px solid var(--theme-border);

  .about-label {
    margin-right: 8px;
    color: var(--theme-text-muted);
  }

  .about-value {
    color: var(--theme-text);
  }
}

.about-disclaimer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--theme-border);
  font-size: 12px;
  color: var(--theme-text-muted);
  line-height: 1.6;

  &-title {
    font-weight: 600;
    color: var(--theme-text);
    margin-bottom: 8px;
  }

  p {
    margin: 0 0 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
