<template>
  <div class="app-container" :class="themeClass">
    <!-- 左侧常驻导航栏 -->
    <aside class="sidebar-nav">
      <nav class="nav-list">
        <router-link
          v-for="route in navRoutes"
          :key="route.path"
          :to="route.path"
          class="nav-item"
          :class="[{ active: isActive(route.path) }, `nav-${route.name}`]"
          :title="route.meta?.title"
        >
          <i class="fas" :class="route.meta?.icon"></i>
          <span v-if="getNavBadge(route.name as string)" class="nav-badge">
            {{ getNavBadge(route.name as string) }}
          </span>
        </router-link>
      </nav>
    </aside>

    <!-- 右侧主内容区 -->
    <div class="main-wrapper">
      <!-- 顶部信息栏 -->
      <header class="app-header">
        <div class="header-left">
          <h1 class="app-title">
            <span class="title-text">绯色官途</span>
            <span v-if="政治气候 !== '无'" class="title-badge">{{ 政治气候 }}</span>
          </h1>
        </div>
        <div v-if="时空舆情.当前日期.年" class="header-center">
          <span class="date-display">
            <i class="far fa-calendar-alt"></i>
            {{ 时空舆情.当前日期.年 }}年{{ 时空舆情.当前日期.月 }}月{{ 时空舆情.当前日期.日 }}日
            <template v-if="时空舆情.当前日期.星期 !== '无'">{{ 时空舆情.当前日期.星期 }}</template>
          </span>
          <span v-if="时空舆情.当前时间 !== '无'" class="time-display">
            <i class="far fa-clock"></i>
            {{ 时空舆情.当前时间 }}
          </span>
        </div>
        <div class="header-right">
          <span v-if="个人档案.基本信息.姓名 !== '无'" class="player-info">
            <span class="player-name">{{ 个人档案.基本信息.姓名 }}</span>
            <span class="player-rank">{{ 个人档案.现任职务.级别 || '待定' }}</span>
          </span>
          <span v-if="人物总数 > 0" class="char-count">
            <i class="fas fa-users"></i>
            {{ 人物总数 }}
          </span>
          <button class="refresh-btn" :disabled="loading" aria-label="刷新" @click="refreshData">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
        </div>
      </header>

      <!-- 面包屑导航 -->
      <div v-if="currentRoute && route.path !== '/'" class="breadcrumb">
        <router-link to="/" class="breadcrumb-item">
          <i class="fas fa-gauge-high"></i>
        </router-link>
        <span class="breadcrumb-sep"><i class="fas fa-chevron-right"></i></span>
        <span class="breadcrumb-item active">
          <i class="fas" :class="currentRoute.meta?.icon"></i>
          <span>{{ currentRoute.meta?.title }}</span>
        </span>
      </div>

      <!-- 主内容区 -->
      <main class="main-content">
        <div v-if="loading && !initialized" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载档案数据...</p>
        </div>
        <router-view v-else v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 脏数据提示 (顶部banner) -->
    <Transition name="slide-down">
      <div v-if="isDirty" class="dirty-banner">
        <i class="fas fa-exclamation-circle"></i>
        <span>您有未保存的更改</span>
        <div class="dirty-actions">
          <button class="btn-discard" @click="discardChanges">
            <i class="fas fa-undo"></i> 放弃
          </button>
          <button class="btn-save" @click="saveAll">
            <i class="fas fa-save"></i> 保存
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { routes } from './router';
import { useGameData } from './stores/useGameData';

const route = useRoute();
const gameData = useGameData();

const loading = computed(() => gameData.loading);
const initialized = computed(() => gameData.initialized);
const isDirty = computed(() => gameData.isDirty);

const 时空舆情 = computed(() => gameData.时空舆情);
const 个人档案 = computed(() => gameData.个人档案);
const 政治气候 = computed(() => 时空舆情.value.政治气候);
const 人物总数 = computed(() => gameData.人物总数);

const navRoutes = routes;
const currentRoute = computed(() => routes.find(r => r.path === route.path));
const themeClass = computed(() => {
  const theme = currentRoute.value?.meta?.theme || 'default';
  return theme !== 'default' ? `theme-${theme}` : '';
});

function getNavBadge(name: string): number | null {
  switch (name) {
    case 'characters':
      return gameData.人物总数 || null;
    case 'romance':
      return gameData.绯色对象列表.length || null;
    case 'secrets': {
      const secrets = gameData.暗账;
      const count =
        Object.keys(secrets.被握把柄).length +
        Object.keys(secrets.政治地雷).length +
        Object.keys(secrets.人情债).length;
      return count || null;
    }
    case 'opportunities': {
      const count = gameData.危机数量 + gameData.机遇数量 + gameData.待办数量;
      return count || null;
    }
    default:
      return null;
  }
}

function isActive(path: string) {
  return route.path === path;
}

async function refreshData() {
  await gameData.loadData();
}

async function saveAll() {
  await gameData.saveData();
}

async function discardChanges() {
  await gameData.discardChanges();
}

onMounted(async () => {
  await gameData.loadData();
  gameData.setupEventListeners();
});
</script>

<style lang="scss" scoped>
// ═══ 根容器 - 左右分栏 ═══
// 使用 aspect-ratio 控制高度，避免使用 vh 单位
.app-container {
  display: flex;
  width: 100%;
  // 使用 aspect-ratio 让高度根据宽度动态调整
  // 16:10 比例适合大多数显示场景
  aspect-ratio: 16 / 10;
  background: var(--color-bg-dark);
  overflow: hidden; // 防止内容溢出根容器
}

// ═══ 左侧导航栏 ═══
.sidebar-nav {
  width: 48px;
  min-width: 48px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto; // 当高度不足时允许滚动

  // 隐藏滚动条但保留功能
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-list {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xs) 0;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 48px;
  height: 44px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: all var(--transition-fast);
  border-left: 3px solid transparent;

  i {
    font-size: 18px;
    transition: color var(--transition-fast);
  }

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }

  &.active {
    background: linear-gradient(90deg, rgba(196, 30, 58, 0.15) 0%, transparent 100%);
    color: var(--color-romance);
    border-left-color: var(--color-romance);
  }

  // ═══ 不同页面的Icon颜色 ═══
  &.nav-dashboard i {
    color: var(--color-gold);
  }
  &.nav-profile i {
    color: #4a90d9;
  }
  &.nav-characters i {
    color: #9b59b6;
  }
  &.nav-relations i {
    color: #3498db;
  }
  &.nav-romance i {
    color: var(--color-romance);
  }
  &.nav-faction i {
    color: #27ae60;
  }
  &.nav-assets i {
    color: #f39c12;
  }
  &.nav-secrets i {
    color: #e74c3c;
  }
  &.nav-opportunities i {
    color: #1abc9c;
  }
  &.nav-variables i {
    color: #7f8c8d;
  }

  &.active i {
    color: var(--color-romance) !important;
  }
}

.nav-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-romance);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// ═══ 右侧主内容区 ═══
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden; // 防止溢出
}

// ═══ 顶部导航栏 ═══
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(180deg, var(--color-bg-card) 0%, rgba(22, 25, 34, 0.95) 100%);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.app-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.title-text {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  background: var(--color-romance-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-badge {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(196, 30, 58, 0.2);
  color: var(--color-romance);
  border-radius: var(--radius-sm);
}

.header-center {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  font-size: 13px;
  color: var(--color-text-secondary);

  i {
    margin-right: 4px;
    color: var(--color-gold);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;

  .player-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .player-rank {
    color: var(--color-gold);
    font-size: 11px;
  }
}

.char-count {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);

  i {
    color: var(--color-gold);
  }
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ═══ 面包屑 ═══
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  font-size: 13px;
  flex-shrink: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  text-decoration: none;

  &:hover:not(.active) {
    color: var(--color-text-secondary);
  }

  &.active {
    color: var(--color-text-primary);
  }
}

.breadcrumb-sep {
  color: var(--color-text-muted);
  font-size: 10px;
}

// ═══ 主内容区 ═══
.main-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: scroll; // 内容区域滚动
  overflow-x: hidden;

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;

    &:hover {
      background: var(--color-text-muted);
    }
  }
}

// ═══ 加载状态 ═══
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%; // 填满可用空间
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-romance);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ═══ 脏数据提示 (顶部banner) ═══
.dirty-banner {
  position: fixed;
  top: 0;
  left: 48px;
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(90deg, rgba(224, 195, 108, 0.15) 0%, rgba(224, 195, 108, 0.05) 100%);
  border-bottom: 1px solid rgba(224, 195, 108, 0.3);
  color: var(--color-warning);
  font-size: 13px;
  z-index: 200;

  .dirty-actions {
    margin-left: auto;
    display: flex;
    gap: var(--spacing-xs);
  }

  .btn-discard {
    padding: 4px 12px;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: 12px;

    &:hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }

  .btn-save {
    padding: 4px 12px;
    background: var(--color-gold);
    border-radius: var(--radius-sm);
    color: var(--color-bg-dark);
    font-size: 12px;
    font-weight: 600;

    &:hover {
      filter: brightness(1.1);
    }
  }
}

// ═══ 过渡动画 ═══
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
