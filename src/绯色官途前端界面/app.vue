<template>
  <div class="app-container" :class="themeClass" :style="{ aspectRatio: aspectRatioStyle }">
    <!-- 左侧常驻导航栏 -->
    <aside class="sidebar-nav" :class="{ 'startup-mode': isStartupMode }">
      <nav class="nav-list">
        <router-link
          v-for="navRoute in navRoutes"
          :key="navRoute.path"
          :to="navRoute.path"
          class="nav-item"
          :class="[{ active: isActive(navRoute.path) }, `nav-${String(navRoute.name || '')}`]"
          :title="navRoute.meta?.title as string | undefined"
        >
          <i class="fas" :class="navRoute.meta?.icon"></i>
          <span v-if="!isStartupMode && getNavBadge(String(navRoute.name || ''))" class="nav-badge">
            {{ getNavBadge(String(navRoute.name || '')) }}
          </span>
        </router-link>
      </nav>
    </aside>

    <!-- 右侧主内容区 -->
    <div class="main-wrapper">
      <!-- 顶部信息栏 -->
      <header class="app-header" :class="{ 'startup-mode': isStartupMode }">
        <!-- 正常模式：左侧显示政治气候 -->
        <div v-if="!isStartupMode" class="header-left">
          <h1 class="app-title">
            <span v-if="政治气候 !== '无'" class="title-text">{{ 政治气候 }}</span>
            <span v-else class="title-text">狂飙年代</span>
          </h1>
        </div>
        <!-- 开局模式：左侧留空 -->
        <div v-else class="header-left"></div>

        <!-- 正常模式：中间显示日期时间地点 -->
        <div v-if="!isStartupMode && 时空舆情.当前日期.年" class="header-center">
          <span class="date-display">
            <i class="far fa-calendar-alt"></i>
            {{ 时空舆情.当前日期.年 }}年{{ 时空舆情.当前日期.月 }}月{{ 时空舆情.当前日期.日 }}日
            <template v-if="时空舆情.当前日期.星期 !== '无'">{{ 时空舆情.当前日期.星期 }}</template>
          </span>
          <span v-if="时空舆情.当前时间 !== '无'" class="time-display">
            <i class="far fa-clock"></i>
            {{ 时空舆情.当前时间 }}
          </span>
          <span v-if="时空舆情.当前地点 && 时空舆情.当前地点 !== '无'" class="location-display">
            <i class="fas fa-map-marker-alt"></i>
            {{ 时空舆情.当前地点 }}
          </span>
        </div>
        <!-- 开局模式：中间居中显示"开局设置" -->
        <div v-else-if="isStartupMode" class="header-center startup-title">
          <h1 class="startup-title-text">开局设置</h1>
        </div>
        <!-- 无日期时的占位 -->
        <div v-else class="header-center"></div>

        <div class="header-right">
          <!-- 正常模式才显示玩家信息和人物统计 -->
          <template v-if="!isStartupMode">
            <span v-if="个人档案.基本信息.姓名 !== '无'" class="player-info">
              <span class="player-name">{{ 个人档案.基本信息.姓名 }}</span>
              <span class="player-rank">{{ 个人档案.现任职务.级别 || '待定' }}</span>
            </span>
            <router-link v-if="人物总数 > 0" to="/characters" class="char-count clickable">
              <i class="fas fa-users"></i>
              {{ 人物总数 }}
            </router-link>
          </template>
          <!-- MVU重试解析按钮 -->
          <button
            class="mvu-retry-btn"
            :class="{
              parsing: mvuSettings.isParsingInProgress,
              minimized: isDialogMinimized,
              startup: isStartupMode && !isDialogMinimized && !mvuSettings.isParsingInProgress,
            }"
            :title="mvuRetryButtonTitle"
            aria-label="重试变量解析"
            @click="handleMvuRetry"
          >
            <i v-if="isDialogMinimized" class="fas fa-window-restore minimized-icon"></i>
            <i v-else-if="mvuSettings.isParsingInProgress" class="fas fa-stop-circle abort-icon"></i>
            <i v-else-if="isStartupMode" class="fas fa-magic startup-icon"></i>
            <i v-else class="fas fa-sync-alt"></i>
          </button>
          <!-- 设置按钮 -->
          <router-link to="/settings" class="settings-btn" title="设置">
            <i class="fas fa-cog"></i>
          </router-link>
        </div>
      </header>

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
          <button class="btn-discard" @click="discardChanges"><i class="fas fa-undo"></i> 放弃</button>
          <button class="btn-save" @click="saveAll"><i class="fas fa-save"></i> 保存</button>
        </div>
      </div>
    </Transition>

    <!-- 全局角色抽屉 -->
    <CharacterDrawer v-model="characterDrawerOpen" :character-name="currentCharacterName" />

    <!-- MVU确认弹窗 -->
    <MvuConfirmDialog
      ref="mvuConfirmDialogRef"
      v-model="mvuSettings.showConfirmDialog"
      v-model:is-minimized="isDialogMinimized"
      :pending-data="mvuSettings.pendingUpdate"
      @confirm="handleMvuConfirm"
      @cancel="handleMvuCancel"
    />

    <!-- 生成拦截确认弹窗 -->
    <Modal
      v-model="mvuSettings.showBlockConfirm"
      title="操作确认"
      icon="fas fa-exclamation-triangle"
      size="sm"
      :close-on-overlay="false"
      :close-on-esc="false"
      :show-close="false"
    >
      <div class="block-confirm-content">
        <p>{{ mvuSettings.blockConfirmMessage }}</p>
      </div>
      <template #footer>
        <div class="block-confirm-actions">
          <button class="btn-cancel" @click="handleBlockCancel"><i class="fas fa-times"></i> 取消发送</button>
          <button class="btn-confirm" @click="handleBlockConfirm"><i class="fas fa-check"></i> 确认发送</button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CharacterDrawer } from './components/character';
import { Modal } from './components/common';
import { MvuConfirmDialog } from './components/mvu';
import { routes, startupRoutes } from './router';
import { useCharacterDrawer, useGameData, useMvuSettings, useUiSettings } from './stores';

const route = useRoute();
const router = useRouter();
const gameData = useGameData();
const characterDrawerStore = useCharacterDrawer();
const mvuSettings = useMvuSettings();
const uiSettings = useUiSettings();

// 开局模式检测
const isStartupMode = computed(() => gameData.isStartupMode);

// 阻止 watch 自动跳转的标志（当手动导航到特定页面时）
const skipAutoNavigation = ref(false);

// MVU确认弹窗相关
const mvuConfirmDialogRef = ref<InstanceType<typeof MvuConfirmDialog> | null>(null);
const isDialogMinimized = ref(false);

const loading = computed(() => gameData.loading);
const initialized = computed(() => gameData.initialized);
const isDirty = computed(() => gameData.isDirty);

// 全局角色抽屉状态
const characterDrawerOpen = computed({
  get: () => characterDrawerStore.isOpen,
  set: val => {
    if (!val) characterDrawerStore.close();
  },
});
const currentCharacterName = computed(() => characterDrawerStore.currentCharacter || '');

const 时空舆情 = computed(() => gameData.时空舆情);
const 个人档案 = computed(() => gameData.个人档案);
const 政治气候 = computed(() => 时空舆情.value.政治气候);
const 人物总数 = computed(() => gameData.人物总数);

// MVU按钮提示文本
const mvuRetryButtonTitle = computed(() => {
  if (isDialogMinimized.value) {
    return '点击恢复变量更新确认弹窗';
  }
  if (mvuSettings.isParsingInProgress) {
    return `点击中断解析 (${mvuSettings.parsingProgress || '解析中...'})`;
  }
  // 0层时显示不同的提示
  if (isStartupMode.value) {
    return '生成开局变量';
  }
  return '重试额外模型解析';
});

// 根据开局模式切换导航路由
const navRoutes = computed(() => (isStartupMode.value ? startupRoutes : routes));
const currentRoute = computed(() => {
  const allNavRoutes = isStartupMode.value ? startupRoutes : routes;
  return allNavRoutes.find(r => r.path === route.path);
});
const themeClass = computed(() => {
  const theme = currentRoute.value?.meta?.theme || 'default';
  return theme !== 'default' ? `theme-${theme}` : '';
});

// 动态宽长比
const aspectRatioStyle = computed(() => uiSettings.getAspectRatioCss());

function getNavBadge(name: string): number | null {
  switch (name) {
    case 'characters':
      return gameData.人物总数 || null;
    case 'romance':
      return gameData.绯色对象列表.length || null;
    case 'assets-secrets': {
      // 资产暗账：统计把柄+政治地雷+人情债数量
      const secrets = gameData.暗账;
      const count =
        Object.keys(secrets.被握把柄).length +
        Object.keys(secrets.手握把柄).length +
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

async function saveAll() {
  await gameData.saveData();
}

async function discardChanges() {
  await gameData.discardChanges();
}

// MVU重试解析
function handleMvuRetry() {
  // 如果弹窗处于最小化状态，恢复弹窗
  if (isDialogMinimized.value) {
    isDialogMinimized.value = false;
    return;
  }
  mvuSettings.retryParsing();
}

// MVU确认更新
function handleMvuConfirm(updateBlock: string) {
  mvuSettings.confirmUpdate(true, updateBlock);
  // 确认后跳转到全量变量页面，方便用户查看和编辑
  router.push('/variables');
}

// MVU取消更新
function handleMvuCancel() {
  mvuSettings.confirmUpdate(false);
}

// 生成拦截确认
function handleBlockConfirm() {
  mvuSettings.confirmGenerationBlock(true);
}

// 生成拦截取消
function handleBlockCancel() {
  mvuSettings.confirmGenerationBlock(false);
}

// 监听开局模式变化，自动导航到对应页面
watch(
  isStartupMode,
  (isStartup, wasStartup) => {
    // 如果已经手动导航，跳过自动跳转
    if (skipAutoNavigation.value) {
      return;
    }
    if (isStartup && !wasStartup) {
      // 进入开局模式，导航到开局信息页
      router.push('/startup-info');
    } else if (!isStartup && wasStartup) {
      // 离开开局模式，导航到仪表盘
      router.push('/');
    }
  },
  { immediate: false },
);

onMounted(async () => {
  await gameData.loadData();
  gameData.setupEventListeners();
  // 初始化MVU设置
  await mvuSettings.initialize();

  // 检查是否需要跳转到全量变量页（确认更新后）
  // 注意：标志会在 Variables.vue 页面加载时才清除，避免多次刷新时丢失
  const api = (window.parent as any)?.ScarletMvu;
  if (api?.getShouldNavigateToVariables?.()) {
    console.info('[绯色官途] 检测到确认更新后需要跳转到全量变量页');
    // 不在这里清除标志！让 Variables.vue 页面加载后再清除
    // 设置标志阻止 watch 自动跳转
    skipAutoNavigation.value = true;
    router.push('/variables');
    // 延迟后重置标志，以便之后的模式切换仍能正常工作
    setTimeout(() => {
      skipAutoNavigation.value = false;
    }, 500);
    return;
  }

  // 根据当前模式导航到正确的初始页面
  if (isStartupMode.value) {
    router.push('/startup-info');
  }
});
</script>

<style lang="scss" scoped>
// ═══ 根容器 - 左右分栏 ═══
// 使用 aspect-ratio 控制高度，避免使用 vh 单位
.app-container {
  display: flex;
  width: 100%;
  // aspect-ratio 现在通过内联样式动态设置，可在设置页面调整
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
  &.nav-romance i {
    color: var(--color-romance);
  }
  &.nav-faction i {
    color: #27ae60;
  }
  &.nav-assets-secrets i {
    color: #e67e22; // 橙色 - 资产暗账
  }
  &.nav-opportunities i {
    color: #1abc9c;
  }
  &.nav-variables i,
  &.nav-variables-startup i {
    color: #7f8c8d;
  }
  // 开局模式特有图标颜色
  &.nav-startup-info i {
    color: var(--color-romance-light);
  }

  &.active i {
    color: var(--color-romance) !important;
  }
}

// ═══ 开局模式导航栏样式 ═══
.sidebar-nav.startup-mode {
  .nav-list {
    padding-top: var(--spacing-md);
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

  // 开局模式header样式
  &.startup-mode {
    background: linear-gradient(180deg, rgba(196, 30, 58, 0.08) 0%, rgba(22, 25, 34, 0.95) 100%);
    border-bottom-color: rgba(196, 30, 58, 0.2);
  }
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

  .location-display i {
    color: #3498db;
  }

  // 开局模式标题样式
  &.startup-title {
    flex: 1;
    justify-content: center;
  }
}

// 开局设置标题
.startup-title-text {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  background: var(--color-romance-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: 2px;
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
  text-decoration: none;
  transition: all var(--transition-fast);

  i {
    color: var(--color-gold);
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      background: var(--color-bg-card);
      color: var(--color-text-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

// ═══ MVU重试解析按钮 ═══
.mvu-retry-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-gold);
  border-radius: var(--radius-md);
  color: var(--color-gold);
  transition: all var(--transition-fast);
  cursor: pointer;

  &:hover {
    background: rgba(216, 166, 87, 0.15);
    transform: scale(1.05);
  }

  // 解析中状态 - 红色停止图标 + 脉冲动画
  &.parsing {
    border-color: var(--color-danger);
    background: rgba(255, 107, 107, 0.15);
    cursor: pointer;

    .abort-icon {
      color: var(--color-danger);
      animation: pulse-abort 1s ease-in-out infinite;
    }

    &:hover {
      background: rgba(255, 107, 107, 0.25);
      transform: scale(1.05);
    }
  }

  // 最小化状态 - 蓝色恢复图标 + 跳动动画
  &.minimized {
    border-color: var(--color-info);
    background: rgba(122, 162, 247, 0.15);

    .minimized-icon {
      color: var(--color-info);
      animation: bounce-restore 1.5s ease-in-out infinite;
    }

    &:hover {
      background: rgba(122, 162, 247, 0.25);
      transform: scale(1.05);
    }
  }

  // 开局模式 - 紫色魔法图标 + 闪烁动画
  &.startup {
    border-color: var(--color-romance);
    background: rgba(196, 30, 58, 0.15);

    .startup-icon {
      color: var(--color-romance);
      animation: sparkle-startup 2s ease-in-out infinite;
    }

    &:hover {
      background: rgba(196, 30, 58, 0.25);
      transform: scale(1.05);
    }
  }
}

// 中止按钮脉冲动画
@keyframes pulse-abort {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

// 恢复按钮跳动动画
@keyframes bounce-restore {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-2px);
  }
}

// 开局按钮闪烁动画
@keyframes sparkle-startup {
  0%,
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  25% {
    opacity: 0.9;
    transform: scale(1.05) rotate(-5deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  75% {
    opacity: 0.9;
    transform: scale(1.05) rotate(5deg);
  }
}

// ═══ 设置按钮 ═══
.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-color: var(--color-text-muted);

    i {
      transform: rotate(90deg);
    }
  }

  i {
    transition: transform var(--transition-normal);
  }
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

// ═══ 生成拦截确认对话框 ═══
.block-confirm-content {
  text-align: center;
  padding: 16px 0;

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text);
  }
}

.block-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);

    i {
      font-size: 12px;
    }
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);

    &:hover {
      border-color: var(--color-text-muted);
      color: var(--color-text);
    }
  }

  .btn-confirm {
    background: var(--color-danger);
    border: 1px solid var(--color-danger);
    color: white;

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
