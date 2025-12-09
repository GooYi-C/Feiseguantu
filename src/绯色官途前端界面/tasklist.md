# 绯色官途 · 项目施工指南

> **生成日期**: 2025-12-09 (v2.0 - 整合用户反馈)
> **文档来源**: 整合自 `doc/` 目录下5个开发文档 + 用户反馈14条
> **项目目标**: 为LLM文字游戏"绯色官途"创建完整的前端界面，实现**优雅的全变量展示+便捷的全变量编辑**功能

---

## 📋 目录

1. [Phase 0: 紧急修复与架构调整](#phase-0-紧急修复与架构调整) ✅ 已完成
2. [Phase 1: 基础架构重构](#phase-1-基础架构重构)
3. [Phase 2: 核心功能完善](#phase-2-核心功能完善)
4. [Phase 3: 页面重构与功能整合](#phase-3-页面重构与功能整合) ⭐ 调整
5. [Phase 4: UI/UX优化与交互增强](#phase-4-uiux优化与交互增强) ⭐ 扩展
6. [Phase 5: 体验增强与高级功能](#phase-5-体验增强与高级功能) ⭐ 扩展

---

## 📝 施工日志

### Phase 0 施工记录 (2025-12-09)

**施工状态**: ✅ 已完成

#### 任务 0.1: 数据持久化策略修复 ✅

**完成内容**:

- 创建 `stores/useGameData.ts` 核心数据 Store
- 实现数据源优先级加载: **MVU > 消息楼层变量 > Chat聊天变量**
- 移除 localStorage 备份恢复和角色卡变量支持（根据用户反馈简化）
- 实现 `waitMvuInitialized()` 函数，等待 MVU 的 `VARIABLE_INITIALIZED` 事件后再加载数据
- 新增 `extractStatData()` 函数，正确提取消息楼层变量中的 `stat_data`
- 监听 `Mvu.events.VARIABLE_UPDATE_ENDED` 事件，自动同步前端数据

**用户反馈修正**:

- 移除本地缓存恢复提示（用户不需要）
- 修复 MVU 初始化检测逻辑（检查 `stat_data !== undefined` 而非 `initialized_lorebooks.length > 0`）
- 修复消息楼层变量读取问题（需要提取 `stat_data` 字段）

#### 任务 0.2: 导航交互重构 ✅

**完成内容**:

- 重构 `app.vue` 为左右分栏布局（`<aside>` + `<main>`）
- 左侧固定 48px Icon 导航栏，不同页面 Icon 使用不同颜色
- 移除汉堡菜单、抽屉遮罩
- 顶部 header 显示应用标题、日期时间、玩家信息、刷新按钮
- 添加面包屑导航
- 实现脏数据提示 banner

**用户反馈修正**:

- 为左侧导航栏添加 `overflow-y: auto` 和隐藏滚动条样式，解决页面缩小时导航栏被截断问题

#### 任务 0.3: 页面等高布局与路由重构 ✅

**完成内容**:

- 修改 `router.ts`，移除 `/scene` 路由，将「当前场景」合并到仪表盘
- 将「全量变量」移至导航末尾
- 使用 `aspect-ratio: 16 / 10` 控制整体高度，禁止使用 `vh` 单位
- 右侧内容区 `.main-content` 使用 `overflow-y: scroll` 实现独立滚动
- 删除 `views/Scene.vue` 文件

**iframe 适配修正**:

- 使用 `aspect-ratio` 替代 `vh` 单位
- 设置 `overflow: hidden` 防止内容溢出根容器
- 左侧导航栏 `flex-shrink: 0` 保持固定宽度

#### 修改的文件清单

| 文件路径                | 操作      | 说明                             |
| ----------------------- | --------- | -------------------------------- |
| `stores/useGameData.ts` | 创建/修改 | 核心数据 Store，含数据持久化策略 |
| `stores/index.ts`       | 修改      | 统一导出                         |
| `app.vue`               | 重构      | 左右分栏布局                     |
| `router.ts`             | 修改      | 路由结构调整                     |
| `views/Scene.vue`       | 删除      | 合并到 Dashboard                 |
| `views/Dashboard.vue`   | 修改      | 集成当前场景信息                 |
| `views/*.vue`           | 修改      | 更新 Store 引用                  |

---

## 任务状态说明

| 状态 | 含义               |
| ---- | ------------------ |
| 🔴 P0 | 核心功能，必须完成 |
| 🟡 P1 | 重要功能，应该完成 |
| 🟢 P2 | 优化功能，可以完成 |
| ✅    | 已完成             |
| 🚧    | 进行中             |
| ⏳    | 待开始             |

---

## Phase 0: 紧急修复与架构调整 ✅ 已完成

> **来源**: 用户反馈 - 优先级最高的结构性问题修复
> **完成日期**: 2025-12-09

### 任务 0.1: 数据持久化策略修复 ✅

| 属性         | 值                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- |
| **优先级**   | 🔴 P0 ✅                                                                                        |
| **来源**     | 用户反馈「数据持久化策略修复：当前同时尝试MVU、角色卡变量、聊天变量三种方式，缺乏明确优先级」 |
| **目标文件** | `stores/useGameData.ts`                                                                       |
| **依赖任务** | 无                                                                                            |
| **预计工时** | 2-3小时                                                                                       |

#### 任务描述

当前数据加载同时尝试多种方式，可能导致数据不一致或丢失。需要建立明确的数据源优先级和自动备份机制。

#### 实现要点

- **数据源优先级**: MVU > Chat > Character > Local (localStorage备份)
- **每次保存自动备份到 localStorage**
- **备份包含元数据**: 时间戳、数据源类型、数据版本
- **错误恢复机制**: 主数据源失败时自动回退到备份

#### 代码示例

```typescript
// stores/useGameData.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { klona } from 'klona';
import { GameSchema, type GameData } from './schema';

type DataSource = 'mvu' | 'chat' | 'character' | 'local';

interface BackupMeta {
  timestamp: string;
  source: DataSource;
  version: string;
  chatId?: string;
}

const BACKUP_KEY = 'scarlet_data_backup';
const BACKUP_META_KEY = 'scarlet_backup_meta';

export const useGameData = defineStore('gameData', () => {
  // ═══ State ═══
  const rawData = ref<GameData>(GameSchema.parse({}));
  const loading = ref(false);
  const initialized = ref(false);
  const isDirty = ref(false);
  const lastError = ref<string | null>(null);
  const dataSource = ref<DataSource>('character');

  // ═══ 备份管理 ═══
  function saveToLocalBackup(data: GameData, source: DataSource) {
    try {
      const meta: BackupMeta = {
        timestamp: new Date().toISOString(),
        source,
        version: '1.0',
        chatId: SillyTavern.getCurrentChatId?.() || undefined,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(data));
      localStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));
      console.info('[绯色官途] 数据已备份到 localStorage', meta);
    } catch (e) {
      console.warn('[绯色官途] localStorage 备份失败', e);
    }
  }

  function loadFromLocalBackup(): { data: unknown; meta: BackupMeta | null } | null {
    try {
      const dataStr = localStorage.getItem(BACKUP_KEY);
      const metaStr = localStorage.getItem(BACKUP_META_KEY);
      if (!dataStr) return null;
      return {
        data: JSON.parse(dataStr),
        meta: metaStr ? JSON.parse(metaStr) : null,
      };
    } catch {
      return null;
    }
  }

  // ═══ 数据加载 (优先级: MVU > Chat > Character > Local) ═══
  async function loadData() {
    loading.value = true;
    lastError.value = null;

    try {
      const result = await loadFromBestSource();
      rawData.value = GameSchema.parse(result.data);
      dataSource.value = result.source;
      initialized.value = true;
      isDirty.value = false;

      // 加载成功后备份
      saveToLocalBackup(rawData.value, result.source);

      console.info(`[绯色官途] 从 ${result.source} 加载数据成功`);
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err);
      console.error('[绯色官途] 数据加载失败，尝试从备份恢复', err);

      // 尝试从本地备份恢复
      const backup = loadFromLocalBackup();
      if (backup) {
        try {
          rawData.value = GameSchema.parse(backup.data);
          dataSource.value = 'local';
          initialized.value = true;
          toastr.warning(`数据已从本地备份恢复 (${backup.meta?.timestamp || '未知时间'})`);
        } catch {
          toastr.error('数据加载失败，备份也无效');
        }
      } else {
        toastr.error('数据加载失败');
      }
    } finally {
      loading.value = false;
    }
  }

  async function loadFromBestSource(): Promise<{ data: unknown; source: DataSource }> {
    // 1. 最高优先级: MVU
    try {
      await waitGlobalInitialized('Mvu');
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
      if (mvuData?.stat_data && Object.keys(mvuData.stat_data).length > 0) {
        return { data: mvuData.stat_data, source: 'mvu' };
      }
    } catch { /* MVU 不可用 */ }

    // 2. 聊天变量 (Chat)
    try {
      const chatVars = getVariables({ type: 'chat' });
      if (chatVars && Object.keys(chatVars).length > 0) {
        return { data: chatVars, source: 'chat' };
      }
    } catch { /* 继续尝试 */ }

    // 3. 角色卡变量 (Character)
    try {
      const charVars = getVariables({ type: 'character' });
      if (charVars && Object.keys(charVars).length > 0) {
        return { data: charVars, source: 'character' };
      }
    } catch { /* 继续尝试 */ }

    // 4. 最低优先级: localStorage 备份
    const backup = loadFromLocalBackup();
    if (backup?.data) {
      return { data: backup.data, source: 'local' };
    }

    // 无数据，返回空对象
    return { data: {}, source: 'character' };
  }

  // ═══ 数据保存 ═══
  async function saveData(partial?: Partial<GameData>) {
    loading.value = true;
    try {
      const toSave = partial
        ? { ...klona(rawData.value), ...partial }
        : klona(rawData.value);

      // 根据当前数据源保存
      await saveToSource(toSave, dataSource.value);

      // 同时备份到 localStorage
      saveToLocalBackup(toSave as GameData, dataSource.value);

      if (partial) {
        Object.assign(rawData.value, partial);
      }
      isDirty.value = false;
      toastr.success('保存成功');
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err);
      toastr.error('保存失败');
    } finally {
      loading.value = false;
    }
  }

  async function saveToSource(data: unknown, source: DataSource) {
    switch (source) {
      case 'mvu':
        // MVU 模式下写回 MVU
        await Mvu.setMvuData({ type: 'message', message_id: 'latest' }, { stat_data: data });
        break;
      case 'chat':
        await replaceVariables(data, { type: 'chat' });
        break;
      case 'character':
      case 'local':
      default:
        await replaceVariables(data, { type: 'character' });
        break;
    }
  }

  // ═══ 分区保存 ═══
  async function saveSection<K extends keyof GameData>(key: K) {
    await saveData({ [key]: rawData.value[key] } as Partial<GameData>);
  }

  // ═══ 字段更新 ═══
  function updateField(path: string, value: unknown) {
    _.set(rawData.value, path, value);
    isDirty.value = true;
  }

  // ═══ 放弃更改 ═══
  async function discardChanges() {
    await loadData();
    isDirty.value = false;
    toastr.info('已放弃更改');
  }

  // ═══ 事件监听 ═══
  function setupEventListeners() {
    eventOn(tavern_events.CHAT_CHANGED, () => {
      console.info('[绯色官途] 聊天变化，重新加载');
      loadData();
    });
  }

  return {
    rawData, loading, initialized, isDirty, lastError, dataSource,
    loadData, saveData, saveSection, updateField, discardChanges, setupEventListeners,
    loadFromLocalBackup, saveToLocalBackup,
  };
});
```

#### UX 注意事项

- 数据源切换时显示来源提示（如「数据来自 MVU」）
- 从备份恢复时显示警告提示
- 保存失败时提供重试选项

#### 验收标准

- [x] 数据源优先级正确：MVU > 消息楼层变量 > Chat（根据用户反馈调整）
- [x] 等待 MVU 初始化完成后再加载数据
- [x] 正确提取消息楼层变量中的 stat_data
- [x] 监听 MVU 变量更新事件同步前端数据
- [x] 控制台显示当前数据来源

> **注**: 根据用户反馈，移除了 localStorage 备份和角色卡变量支持，简化数据源策略

---

### 任务 0.2: 导航交互重构 - 左侧常驻Icon导航 ✅

| 属性         | 值                                                                             |
| ------------ | ------------------------------------------------------------------------------ |
| **优先级**   | 🔴 P0                                                                           |
| **来源**     | 用户反馈「取消左上角汉堡抽屉模式，将导航按钮直接置于界面左侧常驻，仅保留Icon」 |
| **目标文件** | `app.vue`、`styles/variables.scss`                                             |
| **依赖任务** | 无                                                                             |
| **预计工时** | 3-4小时                                                                        |

#### 任务描述

当前汉堡菜单抽屉模式操作不便，需改为**左右分栏布局**：左侧固定宽度导航（仅Icon）+ 右侧内容区。

#### 实现要点

- **布局结构**: `<aside class="sidebar-nav">` + `<main class="main-content">`
- **左侧导航**: 固定宽度 48px，仅保留 Icon
- **移除内容**:
  - 汉堡菜单按钮和抽屉遮罩
  - 导航顶部信息（头像、标题、政治氛围、姓名与职级）
  - 导航底部刷新按钮（移至顶部header）
- **Icon配色**: 不同页面提供不同配色，所有icon颜色必须强制不同
- **关键约束**: 使用 `display: flex`，禁止使用 `vh` 单位（遵循iframe适配要求）
- **滚动设计**: 左侧导航固定不滚动，右侧内容区可滚动

#### 代码示例

```vue
<!-- app.vue 重构版 -->
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

<style lang="scss" scoped>
// ═══ 根容器 - 左右分栏 ═══
.app-container {
  display: flex;
  width: 100%;
  // 使用 aspect-ratio 控制高度（禁止vh）
  min-height: 0;
  background: var(--color-bg-dark);
}

// ═══ 左侧导航栏 ═══
.sidebar-nav {
  width: 48px;
  min-width: 48px;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;

  // 隐藏滚动条但保留功能
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
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
  &.nav-dashboard i { color: var(--color-gold); }
  &.nav-profile i { color: #4a90d9; }
  &.nav-characters i { color: #9b59b6; }
  &.nav-relations i { color: #3498db; }
  &.nav-romance i { color: var(--color-romance); }
  &.nav-faction i { color: #27ae60; }
  &.nav-assets i { color: #f39c12; }
  &.nav-secrets i { color: #e74c3c; }
  &.nav-opportunities i { color: #1abc9c; }
  &.nav-variables i { color: #7f8c8d; }

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
  overflow-x: hidden;
  overflow-y: auto;
  min-width: 0;
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

  i { color: var(--color-gold); }
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
}

// ═══ 加载状态 ═══
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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
  to { transform: rotate(360deg); }
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
```

#### UX 注意事项

- 导航项 hover 时显示 tooltip（title 属性）
- 激活状态使用绯红色左侧边框高亮
- 路由切换使用 fade 过渡动画
- 不同页面 icon 颜色强制不同，便于快速识别

#### 验收标准

- [x] 左侧导航固定 48px 宽度
- [x] 仅显示 Icon，无文字
- [x] 不同页面 Icon 颜色不同
- [x] 汉堡菜单及相关代码已移除
- [x] 右侧内容区可独立滚动
- [x] 无横向滚动条
- [x] 左侧导航栏支持滚动（当高度不足时）

---

### 任务 0.3: 页面等高布局与路由重构 ✅

| 属性         | 值                                                                              |
| ------------ | ------------------------------------------------------------------------------- |
| **优先级**   | 🔴 P0 ✅                                                                          |
| **来源**     | 用户反馈「不同分页强制应该等高...左侧导航栏固定不动，始终完全展开，右侧可滚动」 |
| **目标文件** | `router.ts`、`app.vue`、`views/*.vue`                                           |
| **依赖任务** | 任务 0.2                                                                        |
| **预计工时** | 2-3小时                                                                         |

#### 任务描述

当前分页按变量字段结构划分，导致页面长度差异巨大。需要：

1. 所有分页等高（与左侧导航栏一致）
2. 内容多的分页通过右侧滚动浏览
3. 重新设计路由结构，按**逻辑分类与信息量密度**分页

#### 实现要点

- **路由调整**: 将信息量少的页面合并（如「当前场景」合并到「仪表盘」）
- **导航顺序调整**: 全量变量移至末尾（高级用户功能）
- **页面容器**: 使用固定高度容器 + 内部滚动
- **禁止使用 vh**: 使用 `aspect-ratio` 或百分比高度

#### 路由调整建议

```typescript
// router.ts 调整后
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '仪表盘', icon: 'fa-gauge-high', theme: 'default' },
    // 合并「当前场景」信息到仪表盘
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { title: '个人档案', icon: 'fa-id-card', theme: 'profile' },
  },
  {
    path: '/characters',
    name: 'characters',
    component: Characters, // 包含人物库 + 关系网切换
    meta: { title: '人物库', icon: 'fa-users', theme: 'characters' },
  },
  {
    path: '/romance',
    name: 'romance',
    component: Romance,
    meta: { title: '绯色互动', icon: 'fa-heart', theme: 'romance' },
  },
  {
    path: '/faction',
    name: 'faction',
    component: Faction,
    meta: { title: '派系图谱', icon: 'fa-sitemap', theme: 'faction' },
  },
  {
    path: '/assets',
    name: 'assets',
    component: Assets,
    meta: { title: '个人资产', icon: 'fa-coins', theme: 'assets' },
  },
  {
    path: '/secrets',
    name: 'secrets',
    component: Secrets, // 合并「被握把柄」和「手握把柄」
    meta: { title: '暗账', icon: 'fa-user-secret', theme: 'secrets' },
  },
  {
    path: '/opportunities',
    name: 'opportunities',
    component: Opportunities,
    meta: { title: '机遇与危机', icon: 'fa-scale-balanced', theme: 'opportunities' },
  },
  // 全量变量移至末尾（高级功能）
  {
    path: '/variables',
    name: 'variables',
    component: Variables,
    meta: { title: '全量变量', icon: 'fa-database', theme: 'variables' },
  },
];
```

#### 页面等高样式

```scss
// 每个页面 View 的根容器样式
.page-container {
  // 固定高度：与左侧导航一致
  // 使用 calc 基于父容器高度，而非 vh
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-lg);

  // 内容滚动时滚动条样式
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
```

#### 验收标准

- [x] 所有页面高度通过 aspect-ratio 控制
- [x] 内容多的页面支持滚动（overflow-y: scroll）
- [x] 左侧导航栏固定，支持独立滚动
- [x] 「当前场景」已合并到仪表盘（Scene.vue 已删除）
- [x] 「全量变量」移至导航末尾
- [x] 无横向滚动条
- [x] 遵循 iframe 适配要求（禁用 vh 单位）

---

## Phase 1: 基础架构重构

> **说明**: 本阶段任务保留原有设计，已在任务 0.1 中整合数据持久化优化

### 任务 1.1: Store 拆分 - 创建 useCharacters.ts

| 属性         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **优先级**   | 🔴 P0                                               |
| **来源文档** | `架构重构方案.md` 3.1节、`技术实现路径.md` 3.1.3节 |
| **目标文件** | `stores/useCharacters.ts`                          |
| **依赖任务** | 任务 0.1 (useGameData)                             |
| **预计工时** | 1-2小时                                            |

#### 任务描述

创建专门管理人物库的 Store，提供人物 CRUD 操作和分类查询。

#### 实现要点

- 继承 `useGameData` 的 `rawData`
- 提供按类型分组的 computed（绯色对象、靠山、竞争对手、家属）
- 实现 `addCharacter`、`updateCharacter`、`deleteCharacter` 方法
- 姓名校验（不能重复）
- **新增**: 提供 `getCharacterByName` 快速查询（用于角色名悬浮卡片）

#### 代码示例

```typescript
// stores/useCharacters.ts
import { defineStore, storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useGameData } from './useGameData';
import { 人物Schema, type 人物 } from './schema';

export const useCharacters = defineStore('characters', () => {
  const gameData = useGameData();
  const { rawData, isDirty } = storeToRefs(gameData);

  // ═══ Getters ═══
  const 人物库 = computed(() => rawData.value.人物库 || {});
  const 人物列表 = computed(() => Object.entries(人物库.value));
  const 人物总数 = computed(() => 人物列表.value.length);
  const 人物名单 = computed(() => Object.keys(人物库.value));

  // 按类型分组
  const 绯色对象列表 = computed(() =>
    人物列表.value
      .filter(([, p]) => p.绯色关系 || p.角色标签?.includes('绯色对象'))
      .map(([name, p]) => ({ name, ...p }))
  );

  const 靠山列表 = computed(() =>
    人物列表.value
      .filter(([, p]) => p.靠山关系 || p.角色标签?.includes('靠山'))
      .map(([name, p]) => ({ name, ...p }))
  );

  const 竞争对手列表 = computed(() =>
    人物列表.value
      .filter(([, p]) => p.竞争关系 || p.角色标签?.includes('竞争对手'))
      .map(([name, p]) => ({ name, ...p }))
  );

  const 家属列表 = computed(() =>
    人物列表.value
      .filter(([, p]) => p.家庭关系 || p.角色标签?.includes('家属'))
      .map(([name, p]) => ({ name, ...p }))
  );

  // ═══ Actions ═══
  function addCharacter(name: string, data: Partial<人物> = {}) {
    if (人物库.value[name]) {
      toastr.warning(`人物「${name}」已存在`);
      return false;
    }
    rawData.value.人物库[name] = 人物Schema.parse({ 姓名: name, ...data });
    isDirty.value = true;
    return true;
  }

  function updateCharacter(name: string, updates: Partial<人物>) {
    if (!人物库.value[name]) {
      toastr.warning(`人物「${name}」不存在`);
      return false;
    }
    Object.assign(rawData.value.人物库[name], updates);
    isDirty.value = true;
    return true;
  }

  function deleteCharacter(name: string) {
    if (!人物库.value[name]) return false;
    delete rawData.value.人物库[name];
    isDirty.value = true;
    return true;
  }

  function getCharacter(name: string): 人物 | null {
    return 人物库.value[name] || null;
  }

  // 检查角色是否存在于人物库
  function existsInLibrary(name: string): boolean {
    return !!人物库.value[name];
  }

  return {
    人物库, 人物列表, 人物总数, 人物名单,
    绯色对象列表, 靠山列表, 竞争对手列表, 家属列表,
    addCharacter, updateCharacter, deleteCharacter, getCharacter, existsInLibrary,
  };
});
```

#### 验收标准

- [ ] 人物 CRUD 操作正常
- [ ] 分组查询返回正确数据
- [ ] 姓名重复校验有效
- [ ] 操作后正确标记脏数据
- [ ] `existsInLibrary` 可正确判断角色是否在人物库

---

### 任务 1.2: Store 拆分 - 创建 useLocalCache.ts

| 属性         | 值                                                              |
| ------------ | --------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                            |
| **来源文档** | `架构重构方案.md`、`技术实现路径.md` 3.1.4节、`DESIGN.md` 第4节 |
| **目标文件** | `stores/useLocalCache.ts`                                       |
| **依赖任务** | 无                                                              |
| **预计工时** | 1小时                                                           |

#### 任务描述

创建本地缓存管理 Store，用于存储头像、用户设置等不需要同步到 LLM 的数据。

#### 实现要点

- 使用 `localStorage` 存储头像 DataURL
- 头像大小限制（4MB）
- 超出容量时自动清理旧数据
- 提供清空缓存功能

#### 代码示例

```typescript
// stores/useLocalCache.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

const AVATAR_CACHE_KEY = 'scarlet_avatars';
const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // 4MB

export const useLocalCache = defineStore('localCache', () => {
  const avatarCache = ref<Record<string, string>>({});

  function loadCache() {
    try {
      const cached = localStorage.getItem(AVATAR_CACHE_KEY);
      if (cached) avatarCache.value = JSON.parse(cached);
    } catch {
      avatarCache.value = {};
    }
  }

  function saveCache() {
    try {
      localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(avatarCache.value));
    } catch (e) {
      console.warn('[LocalCache] 保存失败，可能超出容量', e);
      pruneOldAvatars();
    }
  }

  function getAvatar(name: string): string | null {
    return avatarCache.value[name] || null;
  }

  function setAvatar(name: string, dataUrl: string): boolean {
    if (dataUrl.length > MAX_AVATAR_SIZE) {
      toastr.warning('图片太大，请压缩后上传');
      return false;
    }
    avatarCache.value[name] = dataUrl;
    saveCache();
    return true;
  }

  function removeAvatar(name: string) {
    delete avatarCache.value[name];
    saveCache();
  }

  function clearAllAvatars() {
    avatarCache.value = {};
    localStorage.removeItem(AVATAR_CACHE_KEY);
    toastr.info('头像缓存已清空');
  }

  function pruneOldAvatars() {
    const entries = Object.entries(avatarCache.value);
    if (entries.length > 10) {
      avatarCache.value = Object.fromEntries(entries.slice(-10));
      saveCache();
    }
  }

  loadCache();

  return { avatarCache, getAvatar, setAvatar, removeAvatar, clearAllAvatars };
});
```

#### 验收标准

- [ ] 头像上传存储成功
- [ ] 刷新页面头像保留
- [ ] 大图片有提示拒绝
- [ ] 清空缓存功能可用

---

### 任务 1.3: 创建 stores/index.ts 统一导出

| 属性         | 值                      |
| ------------ | ----------------------- |
| **优先级**   | 🔴 P0                    |
| **来源文档** | `架构重构方案.md` 3.1节 |
| **目标文件** | `stores/index.ts`       |
| **依赖任务** | 任务 0.1, 1.1, 1.2      |
| **预计工时** | 15分钟                  |

#### 代码示例

```typescript
// stores/index.ts
export { useGameData } from './useGameData';
export { useCharacters } from './useCharacters';
export { useLocalCache } from './useLocalCache';
export { GameSchema, type GameData, type 人物 } from './schema';
```

#### 验收标准

- [ ] 所有 Store 可通过 `@/stores` 统一导入

---

### 任务 1.4: 更新 Views 的 Store 引用

| 属性         | 值                        |
| ------------ | ------------------------- |
| **优先级**   | 🔴 P0                      |
| **来源文档** | `架构重构方案.md` Phase 1 |
| **目标文件** | `views/*.vue`             |
| **依赖任务** | 任务 1.3                  |
| **预计工时** | 1-2小时                   |

#### 任务描述

更新所有 View 组件，使用新拆分的 Store。

#### 需要修改的文件

- `views/Dashboard.vue`
- `views/Characters.vue`
- `views/Relations.vue`
- `views/Variables.vue`
- `views/Romance.vue`
- `views/Profile.vue`
- `views/Secrets.vue`
- `app.vue`

#### 验收标准

- [ ] 所有页面正常渲染
- [ ] 数据加载/保存功能正常
- [ ] 人物操作功能正常
- [ ] 无 TypeScript 错误

---

## Phase 1 续: 基础组件开发

### 任务 1.5: 创建基础组件 - SliderField.vue

| 属性         | 值                                                  |
| ------------ | --------------------------------------------------- |
| **优先级**   | 🔴 P0                                                |
| **来源文档** | `技术实现路径.md` 3.2.2节、`UI_UX设计规范.md` 5.4节 |
| **目标文件** | `components/common/SliderField.vue`                 |
| **依赖任务** | 无                                                  |
| **预计工时** | 1小时                                               |

#### 任务描述

创建可复用的滑条组件，用于 0-100 的数值输入（好感度、信任度、能力值等）。

#### 实现要点

- 支持滑条 + 数字输入框联动
- 支持显示进度条（带颜色分级：高/中/低）
- 支持自定义 min/max/step
- 符合 UI/UX 设计规范的样式

#### 验收标准

- [ ] 滑条和数字框双向绑定
- [ ] 颜色分级正确显示
- [ ] 支持自定义范围

---

### 任务 1.6: 创建基础组件 - ArrayEditor.vue

| 属性         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **优先级**   | 🔴 P0                                               |
| **来源文档** | `技术实现路径.md` 3.2.3节、`功能完善清单.md` 2.1节 |
| **目标文件** | `components/common/ArrayEditor.vue`                |
| **依赖任务** | 无                                                 |
| **预计工时** | 1小时                                              |

#### 任务描述

创建数组编辑器组件，用于编辑角色标签、关键词等数组字段。

#### 实现要点

- 支持添加/删除项目
- 支持预设建议（如常用标签）
- 支持 Enter 快速添加
- Tag 样式显示已有项目

#### 验收标准

- [ ] 添加/删除功能正常
- [ ] 去重校验有效
- [ ] 建议功能可用

---

### 任务 1.7: 创建基础组件 - EnumSelect.vue

| 属性         | 值                                                |
| ------------ | ------------------------------------------------- |
| **优先级**   | 🔴 P0                                              |
| **来源文档** | `架构重构方案.md` 3.2节、`UI_UX设计规范.md` 5.4节 |
| **目标文件** | `components/common/EnumSelect.vue`                |
| **依赖任务** | 无                                                |
| **预计工时** | 30分钟                                            |

#### 任务描述

创建枚举下拉选择组件，用于性别、体系、婚姻状态等枚举字段。

#### 验收标准

- [ ] 下拉选择功能正常
- [ ] 样式符合设计规范

---

### 任务 1.8: 创建基础组件 - Modal.vue

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **优先级**   | 🔴 P0                                         |
| **来源文档** | `UI_UX设计规范.md` 5.6节、`UX_SPEC.md` 第4节 |
| **目标文件** | `components/common/Modal.vue`                |
| **依赖任务** | 无                                           |
| **预计工时** | 1小时                                        |

#### 任务描述

创建通用模态框组件，用于新增人物、确认操作等场景。

#### 实现要点

- 支持遮罩层点击关闭（可配置）
- 支持 Esc 键关闭
- 平滑的淡入淡出动画
- 可配置宽度

#### 验收标准

- [ ] 显示/隐藏动画正常
- [ ] Esc 键关闭有效
- [ ] 遮罩点击可关闭（可配置）

---

### 任务 1.9: 创建基础组件 - ConfirmDialog.vue

| 属性         | 值                                          |
| ------------ | ------------------------------------------- |
| **优先级**   | 🟡 P1                                        |
| **来源文档** | `架构重构方案.md` 3.2节、`UX_SPEC.md` 第4节 |
| **目标文件** | `components/common/ConfirmDialog.vue`       |
| **依赖任务** | 任务 1.8                                    |
| **预计工时** | 30分钟                                      |

#### 任务描述

基于 Modal 创建确认对话框组件，用于危险操作确认。

#### 验收标准

- [ ] 确认/取消回调正确触发
- [ ] 危险模式样式区分明显
- [ ] 危险操作不可点击遮罩关闭

---

## Phase 2: 核心功能完善

### 任务 2.1: 人物编辑表单 - CharacterForm.vue

| 属性         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **优先级**   | 🔴 P0                                               |
| **来源文档** | `功能完善清单.md` 2.1.1节、`技术实现路径.md` 3.3节 |
| **目标文件** | `components/character/CharacterForm.vue`           |
| **依赖任务** | 任务 1.5, 1.6, 1.7                                 |
| **预计工时** | 3-4小时                                            |

#### 任务描述

创建完整的人物编辑表单组件，这是**核心功能缺失**的修复，当前 `editCharacter()` 仅显示 `toastr.info`。

#### 实现要点

- 分段表单：基础信息、数值面板、角色标签、关系模块
- 支持所有基础字段编辑（姓名、性别、年龄、体系、级别、职务、单位、派系等）
- 支持关系模块手风琴展开（官场/绯色/竞争/靠山/家庭）
- 表单校验与错误提示
- 支持创建/编辑两种模式
- **新增**: 年龄红线提示（详见任务 5.3）

#### 验收标准

- [ ] 可编辑所有基础字段
- [ ] 可编辑数值字段（滑条+数字框）
- [ ] 可编辑角色标签（数组）
- [ ] 可展开编辑关系模块
- [ ] 保存后数据正确写入

---

### 任务 2.2: 新增人物弹窗 - AddCharacterModal.vue

| 属性         | 值                                                     |
| ------------ | ------------------------------------------------------ |
| **优先级**   | 🔴 P0                                                   |
| **来源文档** | `功能完善清单.md` 2.1.3节 + 用户反馈「人物库功能修复」 |
| **目标文件** | `components/character/AddCharacterModal.vue`           |
| **依赖任务** | 任务 1.8, 2.1                                          |
| **预计工时** | 1-2小时                                                |

#### 任务描述

替换当前使用 `prompt()` 原生弹窗的新增人物功能，修复**新增功能无响应**的BUG。

#### 实现要点

- 预设模板（官员、绯色对象、家属等）
- 姓名校验（不能重复、不能为空）
- 使用 CharacterForm 组件
- 确保功能可正常响应

#### 验收标准

- [ ] Modal 形式新增人物
- [ ] 模板快速应用
- [ ] 姓名重复校验
- [ ] 创建成功后自动关闭
- [ ] **修复**: 新增功能可正常响应

---

### 任务 2.3: 更新 Characters.vue 集成编辑功能 + 修复筛选BUG

| 属性         | 值                                                            |
| ------------ | ------------------------------------------------------------- |
| **优先级**   | 🔴 P0                                                          |
| **来源文档** | `功能完善清单.md` 2.1.1节 + 用户反馈「修复BUG：筛选功能无效」 |
| **目标文件** | `views/Characters.vue`                                        |
| **依赖任务** | 任务 2.1, 2.2                                                 |
| **预计工时** | 3小时                                                         |

#### 任务描述

更新 Characters.vue，集成新的人物编辑和新增功能，并修复筛选功能失效的BUG。

#### 实现要点

- 将 `editCharacter()` 从 toastr 提示改为打开编辑抽屉
- 将新增人物从 `prompt()` 改为 AddCharacterModal
- 编辑抽屉使用 CharacterForm 组件
- **修复筛选BUG**: 检查筛选逻辑，确保按条件过滤生效
- **卡片样式**: 改为竖向扑克牌样式（详见任务 3.2）
- 保存后刷新列表并提示

#### 代码示例 - 筛选修复

```typescript
// 修复筛选功能
const filteredCharacters = computed(() => {
  let result = 人物列表.value;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(([name, char]) =>
      name.toLowerCase().includes(query) ||
      char.职务?.toLowerCase().includes(query) ||
      char.单位?.toLowerCase().includes(query) ||
      char.角色标签?.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // 类型筛选
  if (filterType.value !== 'all') {
    result = result.filter(([, char]) => {
      switch (filterType.value) {
        case 'romance': return char.绯色关系 || char.角色标签?.includes('绯色对象');
        case 'backer': return char.靠山关系 || char.角色标签?.includes('靠山');
        case 'rival': return char.竞争关系 || char.角色标签?.includes('竞争对手');
        case 'family': return char.家庭关系 || char.角色标签?.includes('家属');
        default: return true;
      }
    });
  }

  // 性别筛选
  if (genderFilter.value !== 'all') {
    result = result.filter(([, char]) => char.性别 === genderFilter.value);
  }

  return result;
});
```

#### 验收标准

- [ ] 点击编辑按钮打开抽屉
- [ ] 表单预填充当前数据
- [ ] 保存后更新显示
- [ ] 新增人物使用 Modal
- [ ] **修复**: 筛选功能正常工作
- [ ] **修复**: 搜索功能正常工作

---

### 任务 2.4: 角色名统一化组件 - CharacterName.vue

| 属性         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **优先级**   | 🔴 P0                                                                     |
| **来源**     | 用户反馈「全站点统一角色名样式规则，区分存在于人物库/不存在、男性/女性」 |
| **目标文件** | `components/common/CharacterName.vue`                                    |
| **依赖任务** | 任务 1.1 (useCharacters)                                                 |
| **预计工时** | 2小时                                                                    |

#### 任务描述

创建统一的角色名显示组件，实现：

1. 区分「存在于人物库」vs「不存在」的角色
2. 区分男性 vs 女性（明显视觉区分）
3. hover 显示核心信息悬浮卡片
4. 点击展开角色详情抽屉

#### 实现要点

- 存在于人物库：可交互，带下划线
- 不存在于人物库：灰色，不可交互
- 男性：蓝色系 | 女性：粉红色系
- hover 悬浮卡片：性别/年龄/职级/关键标签
- 点击后在**当前页面**展开角色详情抽屉（非跳转）

#### 代码示例

```vue
<template>
  <span
    class="character-name"
    :class="{
      'exists': exists,
      'male': gender === '男',
      'female': gender === '女',
      'clickable': exists,
    }"
    @click="handleClick"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    {{ name }}

    <!-- 悬浮卡片 -->
    <Transition name="fade">
      <div v-if="tooltipVisible && exists && character" class="character-tooltip">
        <div class="tooltip-header">
          <span class="tooltip-name">{{ name }}</span>
          <span class="tooltip-gender" :class="gender">{{ gender }}</span>
        </div>
        <div class="tooltip-info">
          <span v-if="character.年龄"><i class="fas fa-calendar"></i> {{ character.年龄 }}岁</span>
          <span v-if="character.级别"><i class="fas fa-medal"></i> {{ character.级别 }}</span>
          <span v-if="character.职务"><i class="fas fa-briefcase"></i> {{ character.职务 }}</span>
        </div>
        <div class="tooltip-tags" v-if="character.角色标签?.length">
          <span v-for="tag in character.角色标签.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCharacters } from '@/stores';

const props = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  (e: 'click', name: string): void;
}>();

const characters = useCharacters();
const tooltipVisible = ref(false);

const exists = computed(() => characters.existsInLibrary(props.name));
const character = computed(() => characters.getCharacter(props.name));
const gender = computed(() => character.value?.性别 || '无');

function handleClick() {
  if (exists.value) {
    emit('click', props.name);
  }
}

function showTooltip() {
  if (exists.value) {
    tooltipVisible.value = true;
  }
}

function hideTooltip() {
  tooltipVisible.value = false;
}
</script>

<style lang="scss" scoped>
.character-name {
  position: relative;
  display: inline;

  &.exists {
    cursor: pointer;
    border-bottom: 1px dashed currentColor;

    &:hover {
      opacity: 0.8;
    }
  }

  &:not(.exists) {
    color: var(--color-text-muted);
    cursor: default;
  }

  // 性别颜色区分
  &.male.exists {
    color: #4a90d9;
  }

  &.female.exists {
    color: #e84393;
  }
}

.character-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  margin-bottom: 8px;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--color-bg-card);
  }
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);

  .tooltip-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .tooltip-gender {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);

    &.男 {
      background: rgba(74, 144, 217, 0.2);
      color: #4a90d9;
    }

    &.女 {
      background: rgba(232, 67, 147, 0.2);
      color: #e84393;
    }
  }
}

.tooltip-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-secondary);

  i {
    margin-right: 4px;
    color: var(--color-gold);
  }
}

.tooltip-tags {
  display: flex;
  gap: 4px;
  margin-top: var(--spacing-xs);

  .tag {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
  }
}
</style>
```

#### 使用位置

需要在以下位置替换原有角色名显示：

- 仪表盘关系索引
- 当前场景在场人物
- 机遇与危机待办事项中的关联人物
- 关系网节点标签
- 绯色互动人物列表
- 所有涉及角色名显示的地方

#### 验收标准

- [ ] 存在于人物库的角色可交互
- [ ] 不存在的角色灰色不可交互
- [ ] 男性蓝色、女性粉色视觉区分
- [ ] hover 显示悬浮信息卡片
- [ ] 点击展开角色详情抽屉

---

### 任务 2.5: 角色详情抽屉 - CharacterDrawer.vue

| 属性         | 值                                                       |
| ------------ | -------------------------------------------------------- |
| **优先级**   | 🔴 P0                                                     |
| **来源**     | 用户反馈「点击后在当前页面展开角色详情抽屉（而非跳转）」 |
| **目标文件** | `components/character/CharacterDrawer.vue`               |
| **依赖任务** | 任务 2.1                                                 |
| **预计工时** | 2小时                                                    |

#### 任务描述

创建角色详情抽屉组件，用于在任意页面快速查看和编辑角色信息。

#### 实现要点

- 从右侧滑入的抽屉样式
- 显示角色完整信息
- 提供「编辑」按钮进入编辑模式
- 支持就地编辑（详见任务 5.5）
- 点击遮罩或 Esc 关闭

#### 验收标准

- [ ] 抽屉从右侧滑入动画
- [ ] 显示角色完整信息
- [ ] 可切换到编辑模式
- [ ] 点击遮罩/Esc 可关闭

---

### 任务 2.6: 创建 SectionAccordion.vue 组件

| 属性         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **优先级**   | 🔴 P0                                               |
| **来源文档** | `架构重构方案.md` 3.3节、`技术实现路径.md` 4.1.1节 |
| **目标文件** | `components/variable/SectionAccordion.vue`         |
| **依赖任务** | 无                                                 |
| **预计工时** | 1小时                                              |

#### 任务描述

创建分区手风琴组件，用于 Variables 页面的分区展示。

#### 验收标准

- [ ] 点击展开/折叠动画流畅
- [ ] 字段计数正确显示
- [ ] 分区保存按钮可用

---

### 任务 2.7: 创建 RecordTable.vue 组件

| 属性         | 值                                                 |
| ------------ | -------------------------------------------------- |
| **优先级**   | 🔴 P0                                               |
| **来源文档** | `技术实现路径.md` 4.1.2节、`架构重构方案.md` 3.2节 |
| **目标文件** | `components/variable/RecordTable.vue`              |
| **依赖任务** | 无                                                 |
| **预计工时** | 2小时                                              |

#### 任务描述

创建 Record 类型表格编辑器，用于人物库、履历、把柄等 Record<string, T> 类型字段的编辑。

#### 实现要点

- 支持分页（大数据量）
- 支持行展开详情
- 支持增删改操作
- 支持键值对编辑

#### 验收标准

- [ ] 分页功能正常
- [ ] 行展开/折叠正常
- [ ] 增删改回调正确触发

---

### 任务 2.8: Variables.vue 完整重构 + 就地编辑

| 属性         | 值                                                       |
| ------------ | -------------------------------------------------------- |
| **优先级**   | 🔴 P0                                                     |
| **来源文档** | `功能完善清单.md` 2.1.2节 + 用户反馈「就地编辑功能增强」 |
| **目标文件** | `views/Variables.vue`                                    |
| **依赖任务** | 任务 2.6, 2.7                                            |
| **预计工时** | 4-6小时                                                  |

#### 任务描述

完整重构 Variables 页面，实现所有 10 个顶级分区的完整编辑功能。

**当前状态**: 仅实现了时空舆情、当前场景、人物库的编辑，其余显示 JSON

#### 需要完善的分区

| 分区       | 字段复杂度 | 实现要点               |
| ---------- | ---------- | ---------------------- |
| 时空舆情   | 简单       | ✅ 已实现               |
| 当前场景   | 简单       | ✅ 已实现               |
| 关系索引   | 简单       | 文本+数组字段          |
| 人物库     | 复杂       | ✅ 部分实现，需完善编辑 |
| 个人档案   | 复杂       | 嵌套对象+多个Record    |
| 派系图谱   | 中等       | 对象+Record            |
| 绯色履历   | 中等       | Record                 |
| 个人资产   | 复杂       | 数值+多个Record        |
| 暗账       | 复杂       | 4个Record子模块        |
| 机遇与危机 | 中等       | 3个Record子模块        |

#### 验收标准

- [ ] 10个分区全部可编辑
- [ ] Record 类型支持增删改
- [ ] 支持分区独立保存
- [ ] 搜索/过滤功能可用

---

### 任务 2.9: 数据导入导出功能

| 属性         | 值                                                                |
| ------------ | ----------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                              |
| **来源文档** | `功能完善清单.md` 2.2.1节、`UX_SPEC.md` 第6节                     |
| **目标文件** | `views/Variables.vue` (添加)、`components/common/ImportModal.vue` |
| **依赖任务** | 任务 2.8                                                          |
| **预计工时** | 2小时                                                             |

#### 任务描述

在 Variables 页面添加数据导入导出功能。

#### 实现要点

- 导出完整 JSON 文件
- 导入前 Zod 校验
- 支持部分导入（选择分区）
- 导入前预览差异

#### 验收标准

- [ ] 可导出完整 JSON
- [ ] 可导入 JSON 并校验
- [ ] 导入前有预览确认
- [ ] 支持部分分区导入

---

## Phase 3: 页面重构与功能整合

> **来源**: 用户反馈中关于页面合并、功能整合的需求

### 任务 3.1: 仪表盘整合「当前场景」

| 属性         | 值                                                                         |
| ------------ | -------------------------------------------------------------------------- |
| **优先级**   | 🔴 P0                                                                       |
| **来源**     | 用户反馈「信息量少的页面（如当前场景）应合并到其他页面中，提升空间利用率」 |
| **目标文件** | `views/Dashboard.vue`                                                      |
| **依赖任务** | 任务 0.3                                                                   |
| **预计工时** | 2小时                                                                      |

#### 任务描述

将「当前场景」页面内容合并到仪表盘，删除独立的 Scene.vue 页面。

#### 实现要点

- 在仪表盘中添加「当前场景」卡片
- 显示：时间地点、在场人物、场景氛围、正在进行的事情
- 在场人物使用 CharacterName 组件（支持hover/点击）
- 删除 router.ts 中的 scene 路由

#### 验收标准

- [ ] 仪表盘显示当前场景信息
- [ ] 在场人物可交互（hover/点击）
- [ ] Scene.vue 已删除
- [ ] scene 路由已移除

---

### 任务 3.2: 人物库卡片样式改造 - 竖向扑克牌

| 属性         | 值                                                                 |
| ------------ | ------------------------------------------------------------------ |
| **优先级**   | 🟡 P1                                                               |
| **来源**     | 用户反馈「卡片改为竖向扑克牌样式，提升信息密度；增加性别视觉区分」 |
| **目标文件** | `views/Characters.vue`、`components/character/CharacterCard.vue`   |
| **依赖任务** | 任务 2.3                                                           |
| **预计工时** | 2小时                                                              |

#### 任务描述

将人物库卡片改为竖向扑克牌样式，提升信息密度和视觉美观度。

#### 实现要点

- 卡片纵向布局，类似扑克牌/塔罗牌
- 顶部：头像/默认图标
- 中部：姓名、职级
- 底部：关键标签
- 左上角：性别角标（男蓝/女粉）
- 边框颜色根据角色类型变化（绯色对象/靠山/竞争对手）

#### 代码示例

```vue
<template>
  <div
    class="character-card poker-style"
    :class="[cardTypeClass, genderClass]"
    @click="$emit('click')"
  >
    <!-- 性别角标 -->
    <div class="gender-badge" :class="genderClass">
      <i :class="genderIcon"></i>
    </div>

    <!-- 头像区域 -->
    <div class="card-avatar">
      <img v-if="avatar" :src="avatar" alt="" />
      <i v-else class="fas fa-user-tie default-avatar"></i>
    </div>

    <!-- 信息区域 -->
    <div class="card-info">
      <h4 class="card-name">{{ name }}</h4>
      <span class="card-rank">{{ character.级别 || character.职务 || '未知' }}</span>
    </div>

    <!-- 标签区域 -->
    <div class="card-tags">
      <span
        v-for="tag in displayTags"
        :key="tag"
        class="tag"
        :class="tagClass(tag)"
      >
        {{ tag }}
      </span>
    </div>

    <!-- 好感度指示器 -->
    <div class="favor-indicator" v-if="character.好感度">
      <div class="favor-bar" :style="{ width: character.好感度 + '%' }"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.character-card.poker-style {
  width: 140px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  position: relative;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--color-gold);
  }

  // 角色类型边框
  &.type-romance { border-color: var(--color-romance); }
  &.type-backer { border-color: var(--color-success); }
  &.type-rival { border-color: var(--color-danger); }
  &.type-family { border-color: var(--color-warning); }
}

.gender-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;

  &.male {
    background: rgba(74, 144, 217, 0.2);
    color: #4a90d9;
  }

  &.female {
    background: rgba(232, 67, 147, 0.2);
    color: #e84393;
  }
}

.card-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-sm);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .default-avatar {
    font-size: 28px;
    color: var(--color-text-muted);
  }
}

.card-info {
  text-align: center;
  margin-top: var(--spacing-sm);

  .card-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .card-rank {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-top: auto;
  padding-top: var(--spacing-xs);

  .tag {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);

    &.tag-romance { color: var(--color-romance); }
    &.tag-backer { color: var(--color-success); }
    &.tag-rival { color: var(--color-danger); }
  }
}

.favor-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-bg-elevated);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;

  .favor-bar {
    height: 100%;
    background: var(--color-romance-gradient);
    transition: width 0.3s ease;
  }
}
</style>
```

#### 验收标准

- [ ] 卡片为竖向扑克牌样式
- [ ] 性别角标明显区分
- [ ] 角色类型通过边框颜色区分
- [ ] hover 效果流畅
- [ ] 信息密度提升

---

### 任务 3.3: 关系网与人物库合并

| 属性         | 值                                                         |
| ------------ | ---------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                       |
| **来源**     | 用户反馈「将关系网作为人物库的显示模式之一，提供一键切换」 |
| **目标文件** | `views/Characters.vue`                                     |
| **依赖任务** | 任务 3.2, 4.1                                              |
| **预计工时** | 3小时                                                      |

#### 任务描述

将关系网功能合并到人物库页面，提供「卡片视图」和「关系网视图」的一键切换。

#### 实现要点

- 顶部添加视图切换按钮：卡片 | 关系网
- 关系网组件直接嵌入人物库页面
- 删除独立的 Relations.vue 页面和路由
- 保留筛选功能对两种视图的影响

#### 验收标准

- [ ] 人物库支持卡片/关系网视图切换
- [ ] Relations.vue 已删除
- [ ] relations 路由已移除
- [ ] 筛选功能对两种视图均有效

---

### 任务 3.4: 暗账页面优化 - 合并视图

| 属性         | 值                                                                         |
| ------------ | -------------------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                                       |
| **来源**     | 用户反馈「合并'被握把柄'和'手握把柄'为统一视图，使用颜色样式区分两种状态」 |
| **目标文件** | `views/Secrets.vue`                                                        |
| **依赖任务** | 无                                                                         |
| **预计工时** | 2小时                                                                      |

#### 任务描述

优化暗账页面，将分散的内容合并为更紧凑的统一视图。

#### 实现要点

- 「被握把柄」和「手握把柄」合并为「把柄」分区
- 使用颜色区分：被握（红色/危险）| 手握（绿色/优势）
- 可通过 Tab 或筛选切换显示
- 减少空白面板占用
- **支持就地编辑**（增/删/改）

#### 代码示例

```vue
<template>
  <div class="secrets-page">
    <!-- 把柄统一视图 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-hand-holding"></i> 把柄</h2>
        <div class="view-tabs">
          <button
            :class="{ active: handleView === 'all' }"
            @click="handleView = 'all'"
          >
            全部
          </button>
          <button
            :class="{ active: handleView === 'held', danger: true }"
            @click="handleView = 'held'"
          >
            <i class="fas fa-bomb"></i> 被握 ({{ 被握把柄数量 }})
          </button>
          <button
            :class="{ active: handleView === 'holding', success: true }"
            @click="handleView = 'holding'"
          >
            <i class="fas fa-fist-raised"></i> 手握 ({{ 手握把柄数量 }})
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="handles-grid">
          <!-- 被握把柄 -->
          <template v-if="handleView !== 'holding'">
            <div
              v-for="(handle, key) in 被握把柄"
              :key="'held-' + key"
              class="handle-card held"
            >
              <div class="handle-type">
                <i class="fas fa-bomb"></i>
                <span>被握</span>
              </div>
              <div class="handle-content">
                <h4>{{ key }}</h4>
                <p>{{ handle.把柄内容 }}</p>
                <div class="handle-meta">
                  <span class="holder">掌握者: {{ handle.掌握者 }}</span>
                  <span class="danger-level" :class="dangerClass(handle.危险等级)">
                    {{ handle.危险等级 }}
                  </span>
                </div>
              </div>
              <div class="handle-actions">
                <button class="btn-edit" @click="editHandle('被握把柄', key)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" @click="deleteHandle('被握把柄', key)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </template>

          <!-- 手握把柄 -->
          <template v-if="handleView !== 'held'">
            <div
              v-for="(handle, key) in 手握把柄"
              :key="'holding-' + key"
              class="handle-card holding"
            >
              <div class="handle-type">
                <i class="fas fa-fist-raised"></i>
                <span>手握</span>
              </div>
              <div class="handle-content">
                <h4>{{ key }}</h4>
                <p>{{ handle.把柄内容 }}</p>
                <div class="handle-meta">
                  <span class="target">涉及者: {{ handle.涉及者 }}</span>
                  <span class="value-level" :class="valueClass(handle.价值等级)">
                    {{ handle.价值等级 }}
                  </span>
                </div>
              </div>
              <div class="handle-actions">
                <button class="btn-edit" @click="editHandle('手握把柄', key)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" @click="deleteHandle('手握把柄', key)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- 新增按钮 -->
        <div class="add-buttons">
          <button class="btn-add held" @click="addHandle('被握把柄')">
            <i class="fas fa-plus"></i> 新增被握把柄
          </button>
          <button class="btn-add holding" @click="addHandle('手握把柄')">
            <i class="fas fa-plus"></i> 新增手握把柄
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.handle-card {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border-left: 4px solid;

  &.held {
    border-left-color: var(--color-danger);

    .handle-type {
      color: var(--color-danger);
      background: rgba(255, 107, 107, 0.1);
    }
  }

  &.holding {
    border-left-color: var(--color-success);

    .handle-type {
      color: var(--color-success);
      background: rgba(74, 193, 142, 0.1);
    }
  }
}

.handle-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;

  i {
    font-size: 20px;
    margin-bottom: 4px;
  }
}
</style>
```

#### 验收标准

- [ ] 把柄以统一视图展示
- [ ] 被握/手握通过颜色明显区分
- [ ] 支持筛选切换显示
- [ ] 支持就地增删改
- [ ] 空白区域减少

---

### 任务 3.5: 实现 Faction.vue (派系图谱)

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **优先级**   | 🟡 P1                                         |
| **来源文档** | `功能完善清单.md` 2.2.2节、`DESIGN.md` 第3节 |
| **目标文件** | `views/Faction.vue`                          |
| **依赖任务** | 任务 1.3                                     |
| **预计工时** | 2-3小时                                      |

#### 任务描述

实现派系图谱页面，展示我方派系和主要派系信息。

**当前状态**: ❌ 未实现

#### 实现要点

- 我方派系卡片突出显示
- 主要派系列表（实力评估色阶、关系标签）
- 关系类型颜色区分（友敌阵营）

#### 验收标准

- [ ] 我方派系突出显示
- [ ] 主要派系列表正确渲染
- [ ] 关系类型颜色区分明显

---

### 任务 3.6: 实现 Assets.vue (个人资产)

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **优先级**   | 🟡 P1                                         |
| **来源文档** | `功能完善清单.md` 2.2.2节、`DESIGN.md` 第3节 |
| **目标文件** | `views/Assets.vue`                           |
| **依赖任务** | 任务 1.3                                     |
| **预计工时** | 2-3小时                                      |

#### 任务描述

实现个人资产页面，展示资产概览和各类资产详情。

**当前状态**: ❌ 未实现

#### 实现要点

- 资产概览卡片（申报资产、实际资产、灰色资产）
- 房产、座驾、白手套分区展示
- 金额格式化显示
- 灰色资产使用警示样式

#### 验收标准

- [ ] 资产概览正确显示
- [ ] 各类资产列表正确渲染
- [ ] 金额格式化显示
- [ ] 来源/可靠度颜色区分

---

### 任务 3.7: 实现 Opportunities.vue (机遇与危机)

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **优先级**   | 🟡 P1                                         |
| **来源文档** | `功能完善清单.md` 2.2.2节、`DESIGN.md` 第3节 |
| **目标文件** | `views/Opportunities.vue`                    |
| **依赖任务** | 任务 1.3, 2.4                                |
| **预计工时** | 3-4小时                                      |

#### 任务描述

实现机遇与危机页面，支持列表/看板两种视图切换。

**当前状态**: ❌ 未实现

#### 实现要点

- 列表/看板视图切换
- 三栏看板：潜在危机、当前机遇、待办事项
- 紧急程度/等级颜色区分
- 关联人物使用 CharacterName 组件

#### 验收标准

- [ ] 列表/看板视图切换正常
- [ ] 三栏看板正确显示
- [ ] 等级/紧急程度颜色区分
- [ ] 关联人物可交互

---

## Phase 4: UI/UX优化与交互增强

### 任务 4.1: 关系网布局优化 + 好感度影响边长

| 属性         | 值                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **优先级**   | 🟡 P1                                                                                                   |
| **来源**     | 用户反馈「修复连线样式不按关系类型区分、让角色节点之间的边长按好感度调整」 + `功能完善清单.md` 2.2.3节 |
| **目标文件** | `views/Characters.vue` (关系网视图部分)                                                                |
| **依赖任务** | 任务 3.3                                                                                               |
| **预计工时** | 4-5小时                                                                                                |

#### 任务描述

优化关系网布局，解决当前固定 viewBox 尺寸和人物多时节点重叠问题，并实现好感度影响边长的特性。

**当前问题**:

- 固定 `viewBox="0 0 800 600"` 不响应容器
- 人物多时节点重叠
- 连线样式不按关系类型区分
- 筛选功能失效
- 布局呆板（总是正圆形）

#### 实现要点

- **动态布局**: 好感度越高的角色距离玩家节点越近
- **连线样式**: 不同关系类型使用不同颜色/线型
  - 绯色关系：粉红色实线
  - 靠山关系：绿色实线
  - 竞争关系：红色虚线
  - 家庭关系：金色实线
- **节点头像**: 显示角色头像缩略图（如有）
- **动态 viewBox**: 根据人数自动调整
- **支持缩放和拖拽**

#### 代码示例 - 好感度影响布局

```typescript
// 根据好感度计算节点位置
function calculatePositionByFavor(chars: [string, 人物][]) {
  const positions: Record<string, { x: number; y: number }> = {};
  const centerX = 400;
  const centerY = 300;
  const maxRadius = 250;
  const minRadius = 80;

  // 按好感度排序
  const sorted = [...chars].sort(([, a], [, b]) =>
    (b.好感度 || 50) - (a.好感度 || 50)
  );

  sorted.forEach(([name, char], index) => {
    const favor = char.好感度 || 50;
    // 好感度越高，距离中心越近
    const radius = minRadius + (maxRadius - minRadius) * (1 - favor / 100);

    // 角度均匀分布
    const angle = (2 * Math.PI * index) / sorted.length - Math.PI / 2;

    positions[name] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  return positions;
}

// 关系类型连线样式
function getLineStyle(relation: string) {
  if (relation.includes('绯色') || relation.includes('暧昧')) {
    return { stroke: '#e84393', strokeDasharray: 'none', strokeWidth: 2 };
  }
  if (relation.includes('靠山') || relation.includes('盟友')) {
    return { stroke: '#27ae60', strokeDasharray: 'none', strokeWidth: 2 };
  }
  if (relation.includes('竞争') || relation.includes('敌对')) {
    return { stroke: '#e74c3c', strokeDasharray: '5,5', strokeWidth: 2 };
  }
  if (relation.includes('家') || relation.includes('亲')) {
    return { stroke: '#f39c12', strokeDasharray: 'none', strokeWidth: 2 };
  }
  return { stroke: '#7f8c8d', strokeDasharray: '3,3', strokeWidth: 1 };
}
```

#### 验收标准

- [ ] 好感度影响节点与中心的距离
- [ ] 不同关系类型连线样式不同
- [ ] 节点可显示头像缩略图
- [ ] 缩放拖拽功能正常
- [ ] 筛选功能正常工作

---

### 任务 4.2: UI微交互增强 - 面板hover效果

| 属性         | 值                                                                              |
| ------------ | ------------------------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                                            |
| **来源**     | 用户反馈「为所有面板（包括不可交互的）添加hover效果，实现高亮、毛玻璃等微交互」 |
| **目标文件** | `styles/variables.scss`、各组件样式                                             |
| **依赖任务** | 无                                                                              |
| **预计工时** | 2小时                                                                           |

#### 任务描述

为全站所有卡片/面板添加统一的 hover 微交互效果，提升界面生动感。

#### 实现要点

- 卡片 hover 时轻微上移 + 阴影增强
- 可交互元素 hover 时高亮边框
- 数据展示面板 hover 时背景微亮
- 毛玻璃效果用于悬浮元素
- **统一的 CSS 变量控制**

#### 代码示例

```scss
// styles/variables.scss 添加微交互样式

// ═══ 卡片hover效果 ═══
.card {
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast),
              border-color var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  // 可交互卡片
  &.interactive:hover {
    border-color: var(--color-gold);
    cursor: pointer;
  }
}

// ═══ 面板hover效果 ═══
.panel, .stat-card, .info-block {
  position: relative;
  transition: background var(--transition-fast);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%);
    opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
    border-radius: inherit;
  }

  &:hover::before {
    opacity: 1;
  }
}

// ═══ 毛玻璃效果 ═══
.glass-effect {
  background: rgba(22, 25, 34, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// ═══ 发光边框效果 ═══
.glow-border {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    background: var(--color-romance-gradient);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    filter: blur(8px);
    transition: opacity var(--transition-fast);
  }

  &:hover::after {
    opacity: 0.5;
  }
}

// ═══ 列表项hover ═══
.list-item {
  transition: background var(--transition-fast),
              padding-left var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    padding-left: calc(var(--spacing-md) + 4px);
  }
}

// ═══ 数值变化动画 ═══
.value-change {
  &.increase {
    animation: pulse-green 0.3s ease;
  }

  &.decrease {
    animation: pulse-red 0.3s ease;
  }
}

@keyframes pulse-green {
  0%, 100% { color: inherit; }
  50% { color: var(--color-success); transform: scale(1.1); }
}

@keyframes pulse-red {
  0%, 100% { color: inherit; }
  50% { color: var(--color-danger); transform: scale(1.1); }
}
```

#### 验收标准

- [ ] 所有卡片 hover 有上移+阴影效果
- [ ] 面板 hover 有背景亮度变化
- [ ] 毛玻璃效果正常显示
- [ ] 交互反馈流畅无卡顿

---

### 任务 4.3: 能力值雷达图可视化

| 属性         | 值                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                                                      |
| **来源**     | 用户反馈「个人档案中的能力值使用交互式雷达图，显示最长板与最短板标注，hover显示详细说明」 |
| **目标文件** | `components/profile/AbilityRadar.vue`、`views/Profile.vue`                                |
| **依赖任务** | 无                                                                                        |
| **预计工时** | 3-4小时                                                                                   |

#### 任务描述

为个人档案的能力评估创建交互式雷达图组件。

#### 实现要点

- 使用 Canvas 或 SVG 绘制雷达图
- 显示所有能力维度
- 标注最长板（绿色高亮）和最短板（红色高亮）
- hover 某个维度时显示详细说明（参考游戏主prompt中的能力描述）
- 支持编辑模式（点击维度修改数值）

#### 代码示例

```vue
<template>
  <div class="ability-radar">
    <svg :viewBox="`0 0 ${size} ${size}`" class="radar-svg">
      <!-- 背景网格 -->
      <g class="radar-grid">
        <polygon
          v-for="level in [20, 40, 60, 80, 100]"
          :key="level"
          :points="getGridPoints(level)"
          class="grid-line"
        />
        <!-- 轴线 -->
        <line
          v-for="(_, i) in abilities"
          :key="'axis-' + i"
          :x1="center"
          :y1="center"
          :x2="getAxisPoint(i).x"
          :y2="getAxisPoint(i).y"
          class="axis-line"
        />
      </g>

      <!-- 能力值多边形 -->
      <polygon :points="dataPoints" class="radar-area" />

      <!-- 数据点 -->
      <g class="radar-points">
        <circle
          v-for="(ability, i) in abilities"
          :key="'point-' + i"
          :cx="getDataPoint(i).x"
          :cy="getDataPoint(i).y"
          r="6"
          class="data-point"
          :class="{
            'highest': ability.key === highestAbility,
            'lowest': ability.key === lowestAbility,
          }"
          @mouseenter="showTooltip(ability, $event)"
          @mouseleave="hideTooltip"
        />
      </g>

      <!-- 维度标签 -->
      <g class="radar-labels">
        <text
          v-for="(ability, i) in abilities"
          :key="'label-' + i"
          :x="getLabelPosition(i).x"
          :y="getLabelPosition(i).y"
          class="label"
          :class="{
            'highest': ability.key === highestAbility,
            'lowest': ability.key === lowestAbility,
          }"
        >
          {{ ability.label }} ({{ ability.value }})
        </text>
      </g>
    </svg>

    <!-- 最长板/最短板标注 -->
    <div class="radar-legend">
      <div class="legend-item highest">
        <i class="fas fa-arrow-up"></i>
        <span>最长板: {{ highestAbilityLabel }}</span>
      </div>
      <div class="legend-item lowest">
        <i class="fas fa-arrow-down"></i>
        <span>最短板: {{ lowestAbilityLabel }}</span>
      </div>
    </div>

    <!-- 悬浮说明 -->
    <Transition name="fade">
      <div
        v-if="tooltip.visible"
        class="ability-tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <h4>{{ tooltip.ability?.label }}</h4>
        <p class="value">当前值: {{ tooltip.ability?.value }}</p>
        <p class="description">{{ getAbilityDescription(tooltip.ability?.key) }}</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  data: Record<string, number>;
}>();

const size = 300;
const center = size / 2;
const radius = 120;

// 能力描述（来自游戏主prompt）
const abilityDescriptions: Record<string, string> = {
  '政治敏感': '对政治形势的判断能力，影响决策时机和方向选择',
  '行政能力': '处理日常政务的效率和质量，影响工作绩效',
  '人际关系': '与同僚、上级、下属的相处能力，影响人脉资源',
  '口才表达': '言语说服和演讲能力，影响会议发言效果',
  '心理素质': '抗压能力和情绪管理，影响危机应对',
  '学习能力': '新知识吸收速度，影响业务提升',
  '执行力': '将决策落实到位的能力',
  '谋略智慧': '战略规划和博弈能力',
};

const abilities = computed(() =>
  Object.entries(props.data).map(([key, value]) => ({
    key,
    label: key,
    value: value || 0,
  }))
);

const highestAbility = computed(() => {
  const max = Math.max(...abilities.value.map(a => a.value));
  return abilities.value.find(a => a.value === max)?.key;
});

const lowestAbility = computed(() => {
  const min = Math.min(...abilities.value.map(a => a.value));
  return abilities.value.find(a => a.value === min)?.key;
});

const highestAbilityLabel = computed(() =>
  abilities.value.find(a => a.key === highestAbility.value)?.label
);

const lowestAbilityLabel = computed(() =>
  abilities.value.find(a => a.key === lowestAbility.value)?.label
);

// 计算函数...
function getAngle(index: number) {
  return (2 * Math.PI * index) / abilities.value.length - Math.PI / 2;
}

function getDataPoint(index: number) {
  const angle = getAngle(index);
  const value = abilities.value[index].value;
  const r = (value / 100) * radius;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
}

const dataPoints = computed(() =>
  abilities.value.map((_, i) => {
    const p = getDataPoint(i);
    return `${p.x},${p.y}`;
  }).join(' ')
);

function getAbilityDescription(key?: string) {
  return key ? abilityDescriptions[key] || '暂无描述' : '';
}

// Tooltip
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  ability: null as any,
});

function showTooltip(ability: any, event: MouseEvent) {
  tooltip.value = {
    visible: true,
    x: event.clientX + 10,
    y: event.clientY + 10,
    ability,
  };
}

function hideTooltip() {
  tooltip.value.visible = false;
}
</script>

<style lang="scss" scoped>
.ability-radar {
  position: relative;
}

.radar-svg {
  width: 100%;
  max-width: 300px;
}

.grid-line {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
  opacity: 0.3;
}

.axis-line {
  stroke: var(--color-border);
  stroke-width: 1;
  opacity: 0.5;
}

.radar-area {
  fill: rgba(196, 30, 58, 0.2);
  stroke: var(--color-romance);
  stroke-width: 2;
}

.data-point {
  fill: var(--color-romance);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    r: 8;
  }

  &.highest {
    fill: var(--color-success);
    stroke: white;
    stroke-width: 2;
  }

  &.lowest {
    fill: var(--color-danger);
    stroke: white;
    stroke-width: 2;
  }
}

.label {
  font-size: 11px;
  fill: var(--color-text-secondary);
  text-anchor: middle;

  &.highest { fill: var(--color-success); font-weight: 600; }
  &.lowest { fill: var(--color-danger); font-weight: 600; }
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 12px;

    &.highest {
      color: var(--color-success);
    }

    &.lowest {
      color: var(--color-danger);
    }
  }
}

.ability-tooltip {
  position: fixed;
  z-index: 1000;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-width: 250px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .value {
    font-size: 13px;
    color: var(--color-gold);
    margin-bottom: var(--spacing-xs);
  }

  .description {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}
</style>
```

#### 验收标准

- [ ] 雷达图正确显示所有能力维度
- [ ] 最长板绿色高亮，最短板红色高亮
- [ ] hover 显示能力详细说明
- [ ] 支持响应式缩放

---

### 任务 4.4: 响应式布局完善

| 属性         | 值                                                |
| ------------ | ------------------------------------------------- |
| **优先级**   | 🟡 P1                                              |
| **来源文档** | `UI_UX设计规范.md` 6.1节、`架构重构方案.md` 1.2节 |
| **目标文件** | `styles/variables.scss`、各 View 组件             |
| **依赖任务** | 任务 0.2                                          |
| **预计工时** | 2-3小时                                           |

#### 任务描述

完善响应式布局，确保移动端无横向滚动。

**当前问题**: 部分页面横向溢出

#### 实现要点

- 统一使用响应式断点
- 移动端单列布局
- 左侧导航在窄屏时可折叠
- 卡片自适应宽度
- **禁止使用 vh 单位**

#### 验收标准

- [ ] 移动端无横向滚动
- [ ] 卡片自适应宽度
- [ ] 表单在移动端单列显示
- [ ] 窄屏时导航可折叠

---

### 任务 4.5: 敏感信息遮罩功能

| 属性         | 值                                           |
| ------------ | -------------------------------------------- |
| **优先级**   | 🟢 P2                                         |
| **来源文档** | `UI_UX设计规范.md` 9.1节、`UX_SPEC.md` 第4节 |
| **目标文件** | `components/common/MaskedText.vue`           |
| **依赖任务** | 无                                           |
| **预计工时** | 1小时                                        |

#### 任务描述

创建敏感信息遮罩组件，用于把柄、绯色详情等敏感内容。

#### 实现要点

- 默认模糊遮罩
- 点击"解锁"后展示
- 支持 10s 自动重新遮罩
- 支持手动遮罩

#### 验收标准

- [ ] 默认模糊遮罩
- [ ] 点击解锁正常
- [ ] 10秒后自动遮罩
- [ ] 手动遮罩功能可用

---

## Phase 5: 体验增强与高级功能

### 任务 5.1: 图片上传与处理功能

| 属性         | 值                                                                   |
| ------------ | -------------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                                 |
| **来源**     | 用户反馈「所有涉及照片上传的功能增加：基础缩放、裁剪、图片压缩处理」 |
| **目标文件** | `components/common/ImageUploader.vue`                                |
| **依赖任务** | 任务 1.2 (useLocalCache)                                             |
| **预计工时** | 3-4小时                                                              |

#### 任务描述

创建统一的图片上传组件，支持缩放、裁剪、压缩功能。

#### 实现要点

- 文件选择或拖拽上传
- 裁剪框（支持圆形/方形）
- 缩放预览
- 自动压缩到合适大小（<500KB）
- 保存到 localStorage（使用 useLocalCache）

#### 代码示例

```vue
<template>
  <div class="image-uploader">
    <!-- 上传区域 -->
    <div
      class="upload-zone"
      :class="{ dragging }"
      @click="openFilePicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="handleDrop"
    >
      <template v-if="!previewUrl">
        <i class="fas fa-cloud-upload-alt"></i>
        <span>点击或拖拽上传图片</span>
        <span class="hint">支持 JPG、PNG，最大 4MB</span>
      </template>
      <img v-else :src="previewUrl" alt="预览" class="preview-img" />
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      @change="handleFileSelect"
    />

    <!-- 裁剪工具 -->
    <div v-if="showCropper" class="cropper-modal">
      <div class="cropper-container">
        <canvas ref="cropCanvas"></canvas>
        <div
          class="crop-box"
          :style="cropBoxStyle"
          @mousedown="startCrop"
        >
          <div class="resize-handle nw"></div>
          <div class="resize-handle ne"></div>
          <div class="resize-handle sw"></div>
          <div class="resize-handle se"></div>
        </div>
      </div>

      <div class="cropper-tools">
        <div class="zoom-control">
          <button @click="zoom(-0.1)"><i class="fas fa-minus"></i></button>
          <span>{{ Math.round(scale * 100) }}%</span>
          <button @click="zoom(0.1)"><i class="fas fa-plus"></i></button>
        </div>
        <div class="shape-control">
          <button :class="{ active: cropShape === 'circle' }" @click="cropShape = 'circle'">
            <i class="fas fa-circle"></i> 圆形
          </button>
          <button :class="{ active: cropShape === 'square' }" @click="cropShape = 'square'">
            <i class="fas fa-square"></i> 方形
          </button>
        </div>
      </div>

      <div class="cropper-actions">
        <button class="btn-cancel" @click="cancelCrop">取消</button>
        <button class="btn-confirm" @click="confirmCrop">确认裁剪</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(defineProps<{
  maxSize?: number; // KB
  outputSize?: number; // px
}>(), {
  maxSize: 500,
  outputSize: 200,
});

const emit = defineEmits<{
  (e: 'upload', dataUrl: string): void;
}>();

const fileInput = ref<HTMLInputElement>();
const previewUrl = ref('');
const dragging = ref(false);
const showCropper = ref(false);
const scale = ref(1);
const cropShape = ref<'circle' | 'square'>('circle');

function openFilePicker() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) processFile(file);
}

function handleDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
}

async function processFile(file: File) {
  if (!file.type.startsWith('image/')) {
    toastr.warning('请上传图片文件');
    return;
  }

  if (file.size > 4 * 1024 * 1024) {
    toastr.warning('图片大小不能超过 4MB');
    return;
  }

  // 读取图片
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
    showCropper.value = true;
  };
  reader.readAsDataURL(file);
}

function zoom(delta: number) {
  scale.value = Math.max(0.5, Math.min(3, scale.value + delta));
}

async function confirmCrop() {
  // 创建裁剪后的图片
  const canvas = document.createElement('canvas');
  canvas.width = props.outputSize;
  canvas.height = props.outputSize;
  const ctx = canvas.getContext('2d')!;

  // 如果是圆形，创建圆形遮罩
  if (cropShape.value === 'circle') {
    ctx.beginPath();
    ctx.arc(props.outputSize / 2, props.outputSize / 2, props.outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  // 绘制裁剪区域
  const img = new Image();
  img.src = previewUrl.value;
  await new Promise(resolve => img.onload = resolve);

  ctx.drawImage(img, 0, 0, props.outputSize, props.outputSize);

  // 压缩并输出
  let quality = 0.9;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  // 压缩到目标大小
  while (dataUrl.length > props.maxSize * 1024 * 1.37 && quality > 0.1) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  emit('upload', dataUrl);
  showCropper.value = false;
  toastr.success('图片已上传');
}

function cancelCrop() {
  showCropper.value = false;
  previewUrl.value = '';
}
</script>
```

#### 使用位置

- 绯色互动头像上传
- 人物库角色头像
- 关系网节点头像

#### 验收标准

- [ ] 支持文件选择和拖拽上传
- [ ] 裁剪框可拖拽调整
- [ ] 支持圆形/方形裁剪
- [ ] 自动压缩到目标大小
- [ ] 预览正常显示

---

### 任务 5.2: 个人档案风格切换

| 属性         | 值                                                           |
| ------------ | ------------------------------------------------------------ |
| **优先级**   | 🟢 P2                                                         |
| **来源**     | 用户反馈「增加'体制内干部简历'风格切换按钮，提升游戏代入感」 |
| **目标文件** | `views/Profile.vue`、`components/profile/ResumeStyle.vue`    |
| **依赖任务** | 无                                                           |
| **预计工时** | 2-3小时                                                      |

#### 任务描述

为个人档案页面增加风格切换功能，提供「默认主题」和「体制内干部简历」两种显示风格。

#### 实现要点

- 风格切换按钮
- 体制内干部简历风格：
  - 红色表头
  - 表格化布局
  - 印章装饰
  - 证件照占位
  - 模仿真实干部简历样式

#### 代码示例

```vue
<!-- components/profile/ResumeStyle.vue -->
<template>
  <div class="resume-style">
    <!-- 表头 -->
    <div class="resume-header">
      <div class="header-line"></div>
      <h1>干部履历表</h1>
      <div class="header-line"></div>
    </div>

    <!-- 主体表格 -->
    <div class="resume-body">
      <!-- 基本信息 -->
      <table class="info-table">
        <tr>
          <th rowspan="6" class="photo-cell">
            <div class="photo-placeholder">
              <img v-if="avatar" :src="avatar" />
              <span v-else>照片</span>
            </div>
          </th>
          <th>姓 名</th>
          <td>{{ profile.基本信息.姓名 }}</td>
          <th>性 别</th>
          <td>{{ profile.基本信息.性别 }}</td>
        </tr>
        <tr>
          <th>出生年月</th>
          <td colspan="3">{{ profile.基本信息.出生年月 || '待填写' }}</td>
        </tr>
        <tr>
          <th>籍 贯</th>
          <td>{{ profile.基本信息.籍贯 || '待填写' }}</td>
          <th>民 族</th>
          <td>{{ profile.基本信息.民族 || '汉族' }}</td>
        </tr>
        <tr>
          <th>入党时间</th>
          <td>{{ profile.党籍信息.入党时间 || '待填写' }}</td>
          <th>参加工作时间</th>
          <td>{{ profile.基本信息.参加工作时间 || '待填写' }}</td>
        </tr>
        <tr>
          <th>学 历</th>
          <td>{{ profile.教育经历.最高学历 || '待填写' }}</td>
          <th>学 位</th>
          <td>{{ profile.教育经历.最高学位 || '待填写' }}</td>
        </tr>
        <tr>
          <th>现任职务</th>
          <td colspan="3" class="position-cell">
            {{ profile.现任职务.单位 }} {{ profile.现任职务.职务 }}
          </td>
        </tr>
      </table>

      <!-- 任职履历 -->
      <div class="section">
        <h3 class="section-title">任职履历</h3>
        <table class="history-table">
          <thead>
            <tr>
              <th>起止时间</th>
              <th>工作单位及职务</th>
              <th>级别</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, key) in profile.任职履历" :key="key">
              <td>{{ item.起止时间 || '待填写' }}</td>
              <td>{{ item.单位 }} {{ item.职务名称 }}</td>
              <td>{{ item.级别 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 印章 -->
      <div class="stamp-area">
        <div class="stamp">
          <span>中共{{ profile.现任职务.单位?.slice(0, 4) || '某某' }}委员会</span>
          <span>组织部</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resume-style {
  background: #fefefe;
  color: #333;
  padding: var(--spacing-lg);
  font-family: 'SimSun', '宋体', serif;
}

.resume-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  .header-line {
    flex: 1;
    height: 3px;
    background: #c41e3a;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #c41e3a;
    letter-spacing: 8px;
    white-space: nowrap;
  }
}

.info-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    border: 1px solid #333;
    padding: 8px 12px;
    text-align: center;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
    width: 100px;
  }

  .photo-cell {
    width: 120px;
    height: 160px;
    vertical-align: top;

    .photo-placeholder {
      width: 100%;
      height: 100%;
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .position-cell {
    font-weight: 600;
    color: #c41e3a;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #c41e3a;
  border-bottom: 2px solid #c41e3a;
  padding-bottom: 4px;
  margin: var(--spacing-lg) 0 var(--spacing-md);
}

.history-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    border: 1px solid #333;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }
}

.stamp-area {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-xl);

  .stamp {
    width: 120px;
    height: 120px;
    border: 4px solid #c41e3a;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #c41e3a;
    font-size: 12px;
    font-weight: 700;
    transform: rotate(-15deg);
    opacity: 0.7;
  }
}
</style>
```

#### 验收标准

- [ ] 风格切换按钮正常工作
- [ ] 体制内简历风格还原度高
- [ ] 数据正确填充
- [ ] 切换动画流畅

---

### 任务 5.3: 年龄红线动态提示

| 属性         | 值                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- |
| **优先级**   | 🟡 P1                                                                                          |
| **来源**     | 用户反馈「根据当前年龄与职级动态计算年龄红线评语：副科30岁前突破...对超龄人员提示'官场出局'」 |
| **目标文件** | `components/profile/AgeRedLine.vue`、`views/Profile.vue`、`views/Characters.vue`              |
| **依赖任务** | 无                                                                                            |
| **预计工时** | 2小时                                                                                         |

#### 任务描述

在用户角色的个人档案页面与NPC人物角色卡页面增加年龄红线评语。

#### 年龄红线规则

| 级别   | 红线年龄 | 说明                         |
| ------ | -------- | ---------------------------- |
| 副科   | 30岁前   | 30岁前突破才有前途           |
| 正科   | 35岁前   | 35岁前突破才有希望           |
| 副处   | 35岁前   | 35岁前突破是基本要求         |
| 正处   | 45岁前   | 45岁前突破还有机会           |
| 副厅   | 45岁前   | 45岁前突破才能更进一步       |
| 正厅   | 55岁前   | 55岁前突破才有可能入省部     |
| 副部   | 55岁前   | 55岁前突破才有政治前途       |
| 正部   | 65岁前   | 65岁必须退休                 |
| 国家级 | 67/68岁  | 政治局常委67岁可留，68岁必退 |

#### 代码示例

```vue
<template>
  <div class="age-redline" :class="statusClass">
    <i :class="statusIcon"></i>
    <span class="redline-text">{{ redlineText }}</span>
    <span class="detail-text" v-if="detailText">{{ detailText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  age: number;
  rank: string;
}>();

interface RedLineRule {
  maxAge: number;
  nextRank: string;
  warning: string;
}

const redlineRules: Record<string, RedLineRule> = {
  '科员': { maxAge: 28, nextRank: '副科', warning: '科员应尽早晋升副科' },
  '副科': { maxAge: 30, nextRank: '正科', warning: '副科30岁前突破才有前途' },
  '正科': { maxAge: 35, nextRank: '副处', warning: '正科35岁前突破才有希望' },
  '副处': { maxAge: 40, nextRank: '正处', warning: '副处40岁前突破是基本要求' },
  '正处': { maxAge: 45, nextRank: '副厅', warning: '正处45岁前突破还有机会' },
  '副厅': { maxAge: 50, nextRank: '正厅', warning: '副厅50岁前突破才能更进一步' },
  '正厅': { maxAge: 55, nextRank: '副部', warning: '正厅55岁前突破才有可能入省部' },
  '副部': { maxAge: 60, nextRank: '正部', warning: '副部60岁前突破才有政治前途' },
  '正部': { maxAge: 65, nextRank: '国家级', warning: '正部65岁必须退休' },
};

const status = computed(() => {
  const rule = redlineRules[props.rank];
  if (!rule) return 'unknown';

  const yearsLeft = rule.maxAge - props.age;

  if (yearsLeft < 0) return 'expired';
  if (yearsLeft <= 2) return 'critical';
  if (yearsLeft <= 5) return 'warning';
  return 'safe';
});

const statusClass = computed(() => `status-${status.value}`);

const statusIcon = computed(() => {
  switch (status.value) {
    case 'expired': return 'fas fa-skull-crossbones';
    case 'critical': return 'fas fa-exclamation-triangle';
    case 'warning': return 'fas fa-clock';
    case 'safe': return 'fas fa-check-circle';
    default: return 'fas fa-question-circle';
  }
});

const redlineText = computed(() => {
  const rule = redlineRules[props.rank];
  if (!rule) return '暂无评估';

  const yearsLeft = rule.maxAge - props.age;

  if (yearsLeft < 0) {
    return '⚠️ 官场出局 - 已超龄无晋升可能';
  }
  if (yearsLeft === 0) {
    return '🔥 红线临界 - 今年是最后机会！';
  }
  if (yearsLeft <= 2) {
    return `⏰ 紧迫 - 仅剩 ${yearsLeft} 年窗口期`;
  }
  if (yearsLeft <= 5) {
    return `⚡ 关注 - 还有 ${yearsLeft} 年，需加速布局`;
  }
  return `✅ 从容 - 距红线还有 ${yearsLeft} 年`;
});

const detailText = computed(() => {
  const rule = redlineRules[props.rank];
  if (!rule) return '';
  return rule.warning;
});
</script>

<style lang="scss" scoped>
.age-redline {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 13px;

  i {
    font-size: 16px;
  }

  .redline-text {
    font-weight: 600;
  }

  .detail-text {
    font-size: 11px;
    opacity: 0.8;
    margin-left: var(--spacing-xs);
  }

  &.status-expired {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
  }

  &.status-critical {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }

  &.status-warning {
    background: rgba(224, 195, 108, 0.15);
    color: var(--color-warning);
  }

  &.status-safe {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }

  &.status-unknown {
    background: var(--color-bg-elevated);
    color: var(--color-text-muted);
  }
}
</style>
```

#### 使用位置

- 个人档案页面（用户角色）
- 人物库详情卡片（NPC角色）
- 人物编辑表单

#### 验收标准

- [ ] 正确计算年龄红线状态
- [ ] 不同状态显示不同颜色
- [ ] 超龄显示"官场出局"辛辣点评
- [ ] 显示距红线剩余年数

---

### 任务 5.4: 就地编辑功能增强

| 属性         | 值                                                                 |
| ------------ | ------------------------------------------------------------------ |
| **优先级**   | 🟡 P1                                                               |
| **来源**     | 用户反馈「在各页面提供就地编辑能力，减少跳转到全量变量页面的需求」 |
| **目标文件** | `components/common/InlineEditor.vue`、各页面组件                   |
| **依赖任务** | 无                                                                 |
| **预计工时** | 3-4小时                                                            |

#### 任务描述

在各功能页面提供就地编辑能力，让用户无需跳转到「全量变量」页面即可快速修改数据。

#### 实现要点

- 创建 `InlineEditor` 组件：点击文本变为输入框
- 创建 `InlineArrayEditor` 组件：就地编辑数组
- 各页面集成就地编辑功能
- 编辑后自动保存
- 显示编辑成功提示

#### 代码示例

```vue
<!-- components/common/InlineEditor.vue -->
<template>
  <div class="inline-editor" :class="{ editing }">
    <!-- 显示模式 -->
    <div v-if="!editing" class="display-mode" @click="startEdit">
      <span class="value" :class="{ empty: isEmpty }">
        {{ displayValue }}
      </span>
      <i class="fas fa-pencil-alt edit-icon"></i>
    </div>

    <!-- 编辑模式 -->
    <div v-else class="edit-mode">
      <input
        v-if="type === 'text' || type === 'number'"
        ref="inputRef"
        :type="type"
        v-model="editValue"
        @keyup.enter="save"
        @keyup.esc="cancel"
        @blur="save"
      />
      <textarea
        v-else-if="type === 'textarea'"
        ref="inputRef"
        v-model="editValue"
        @keyup.esc="cancel"
        @blur="save"
        rows="3"
      ></textarea>
      <select
        v-else-if="type === 'select'"
        ref="inputRef"
        v-model="editValue"
        @change="save"
        @blur="save"
      >
        <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: string | number;
  type?: 'text' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}>(), {
  type: 'text',
  placeholder: '点击编辑...',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'save', value: string | number): void;
}>();

const editing = ref(false);
const editValue = ref(props.modelValue);
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>();

const isEmpty = computed(() =>
  props.modelValue === '' ||
  props.modelValue === '无' ||
  props.modelValue === undefined
);

const displayValue = computed(() =>
  isEmpty.value ? props.placeholder : String(props.modelValue)
);

watch(() => props.modelValue, (val) => {
  editValue.value = val;
});

async function startEdit() {
  editing.value = true;
  editValue.value = props.modelValue;
  await nextTick();
  inputRef.value?.focus();
  if (inputRef.value instanceof HTMLInputElement) {
    inputRef.value.select();
  }
}

function save() {
  editing.value = false;
  if (editValue.value !== props.modelValue) {
    emit('update:modelValue', editValue.value);
    emit('save', editValue.value);
    toastr.success('已保存');
  }
}

function cancel() {
  editing.value = false;
  editValue.value = props.modelValue;
}
</script>

<style lang="scss" scoped>
.inline-editor {
  display: inline-block;
}

.display-mode {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);

    .edit-icon {
      opacity: 1;
    }
  }

  .value {
    &.empty {
      color: var(--color-text-muted);
      font-style: italic;
    }
  }

  .edit-icon {
    font-size: 10px;
    color: var(--color-text-muted);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }
}

.edit-mode {
  input, textarea, select {
    padding: 4px 8px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-gold);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: inherit;

    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(216, 166, 87, 0.2);
    }
  }

  textarea {
    resize: vertical;
    min-width: 200px;
  }
}
</style>
```

#### 需要集成就地编辑的页面

- 仪表盘：当前时间、地点等
- 个人档案：所有基础字段
- 暗账：把柄内容、等级
- 机遇与危机：事项内容、截止时间
- 派系图谱：派系信息

#### 验收标准

- [ ] 点击文本进入编辑模式
- [ ] Enter/失焦保存，Esc 取消
- [ ] 编辑成功有提示
- [ ] 空值显示占位符

---

### 任务 5.5: 虚拟滚动优化

| 属性         | 值                                               |
| ------------ | ------------------------------------------------ |
| **优先级**   | 🟢 P2                                             |
| **来源文档** | `架构重构方案.md` 5.1节、`技术实现路径.md` 5.1节 |
| **目标文件** | `views/Characters.vue`、`views/Variables.vue`    |
| **依赖任务** | 无                                               |
| **预计工时** | 2小时                                            |

#### 任务描述

为人物库等大数据量列表添加虚拟滚动，优化 >50 人物时的性能。

#### 实现要点

- 使用 `@vueuse/core` 的 `useVirtualList`
- 仅渲染可见项
- 保持滚动位置

#### 验收标准

- [ ] 100 人物流畅运行
- [ ] 滚动无明显卡顿
- [ ] 数据更新后列表正确刷新

---

### 任务 5.6: 键盘快捷键支持

| 属性         | 值                                               |
| ------------ | ------------------------------------------------ |
| **优先级**   | 🟢 P2                                             |
| **来源文档** | `功能完善清单.md` 2.3.2节、`UX_SPEC.md` 第9节    |
| **目标文件** | `composables/useKeyboardShortcuts.ts`、`app.vue` |
| **依赖任务** | 无                                               |
| **预计工时** | 1小时                                            |

#### 任务描述

添加键盘快捷键支持，提升操作效率。

#### 实现要点

- Ctrl/Cmd + S: 保存
- Ctrl/Cmd + F: 聚焦搜索框
- Esc: 关闭抽屉/弹窗
- Tab 顺序遍历

#### 验收标准

- [ ] Ctrl+S 保存有效
- [ ] Ctrl+F 聚焦搜索框
- [ ] Esc 关闭弹窗/抽屉

---

### 任务 5.7: 创建变量自动同步脚本

| 属性         | 值                                 |
| ------------ | ---------------------------------- |
| **优先级**   | 🟢 P2                               |
| **来源文档** | `脚本引入构想.md` 2.1节            |
| **目标文件** | `src/绯色官途脚本/index.ts` (新建) |
| **依赖任务** | 无                                 |
| **预计工时** | 2小时                              |

#### 任务描述

创建独立的 Tavern Helper 脚本，监听 LLM 消息并自动同步变量到前端界面。

#### 验收标准

- [ ] 脚本正确监听消息
- [ ] 变量自动解析和同步
- [ ] 前端界面收到刷新通知

---

### 任务 5.8: 创建数据自动备份脚本

| 属性         | 值                                       |
| ------------ | ---------------------------------------- |
| **优先级**   | 🟢 P2                                     |
| **来源文档** | `脚本引入构想.md` 2.5节                  |
| **目标文件** | `src/绯色官途脚本/auto_backup.ts` (新建) |
| **依赖任务** | 无                                       |
| **预计工时** | 1.5小时                                  |

#### 任务描述

创建自动备份脚本，定期备份游戏数据防止丢失。

#### 实现要点

- 30分钟自动备份
- 保留最近5个备份
- 提供恢复功能
- 使用 localStorage 存储

#### 验收标准

- [ ] 30分钟自动备份
- [ ] 最多保留5个备份
- [ ] 恢复功能可用
- [ ] 控制台命令可用

---

## 附录

### A. 文件结构总览

重构完成后的目标文件结构：

```
src/绯色官途前端界面/
├── index.html
├── index.ts
├── app.vue                          # 重构：左右分栏布局
├── router.ts                        # 调整：移除scene/relations，变量移至末尾
├── stores/
│   ├── index.ts                     # 统一导出
│   ├── schema.ts                    # Zod Schema
│   ├── useGameData.ts               # 核心数据 store (含备份机制)
│   ├── useCharacters.ts             # 人物相关
│   └── useLocalCache.ts             # 本地缓存
├── components/
│   ├── common/
│   │   ├── SliderField.vue
│   │   ├── ArrayEditor.vue
│   │   ├── EnumSelect.vue
│   │   ├── Modal.vue
│   │   ├── ConfirmDialog.vue
│   │   ├── MaskedText.vue
│   │   ├── CharacterName.vue        # 新增：统一角色名组件
│   │   ├── InlineEditor.vue         # 新增：就地编辑组件
│   │   └── ImageUploader.vue        # 新增：图片上传处理
│   ├── character/
│   │   ├── CharacterForm.vue
│   │   ├── CharacterCard.vue        # 新增：扑克牌样式卡片
│   │   ├── CharacterDrawer.vue      # 新增：角色详情抽屉
│   │   └── AddCharacterModal.vue
│   ├── profile/
│   │   ├── AbilityRadar.vue         # 新增：能力雷达图
│   │   ├── AgeRedLine.vue           # 新增：年龄红线组件
│   │   └── ResumeStyle.vue          # 新增：干部简历风格
│   └── variable/
│       ├── SectionAccordion.vue
│       └── RecordTable.vue
├── composables/
│   └── useKeyboardShortcuts.ts
├── styles/
│   └── variables.scss               # 扩展：微交互样式
└── views/
    ├── Dashboard.vue                # 整合：当前场景信息
    ├── Profile.vue                  # 增强：雷达图、红线、风格切换
    ├── Characters.vue               # 整合：关系网视图、扑克牌卡片
    ├── Variables.vue                # 完善：全10分区编辑
    ├── Romance.vue
    ├── Faction.vue                  # 新实现
    ├── Assets.vue                   # 新实现
    ├── Secrets.vue                  # 优化：合并把柄视图
    └── Opportunities.vue            # 新实现

# 已删除的文件
├── views/Scene.vue                  # 删除：合并到 Dashboard
└── views/Relations.vue              # 删除：合并到 Characters

src/绯色官途脚本/                     # 新增
├── index.ts                         # 变量自动同步
└── auto_backup.ts                   # 自动备份
```

### B. 优先级汇总

| 优先级   | 任务数 | 预计总工时  | 说明                       |
| -------- | ------ | ----------- | -------------------------- |
| 🔴 P0     | 16     | ~35小时     | 核心功能，必须完成         |
| 🟡 P1     | 14     | ~35小时     | 重要功能，应该完成         |
| 🟢 P2     | 8      | ~15小时     | 优化功能，可以完成         |
| **总计** | **38** | **~85小时** | 相比原版增加约32小时工作量 |

### C. 用户反馈对照表

| 反馈序号 | 反馈关键词                     | 对应任务              |
| -------- | ------------------------------ | --------------------- |
| 0        | 数据持久化策略修复             | 任务 0.1              |
| 1        | 取消汉堡抽屉，左侧常驻Icon导航 | 任务 0.2              |
| 2        | 路由重构，页面等高             | 任务 0.3              |
| 3        | 角色名统一化，hover卡片        | 任务 2.4, 2.5         |
| 4        | 人物库BUG修复，扑克牌卡片      | 任务 2.2, 2.3, 3.2    |
| 5        | 关系网与人物库合并             | 任务 3.3, 4.1         |
| 6        | 全量变量移至导航末尾           | 任务 0.3 (router调整) |
| 7        | 图片上传缩放裁剪压缩           | 任务 5.1              |
| 8        | 暗账页面合并优化               | 任务 3.4              |
| 9        | UI微交互hover效果              | 任务 4.2              |
| 10       | 能力值雷达图                   | 任务 4.3              |
| 11       | 体制内干部简历风格             | 任务 5.2              |
| 12       | 年龄红线动态提示               | 任务 5.3              |
| 13       | 就地编辑功能                   | 任务 3.4, 5.4         |

### D. 依赖关系图

```
Phase 0: 紧急修复（最高优先级）
├── 0.1 数据持久化修复 (useGameData.ts)
├── 0.2 导航交互重构 (app.vue)
│   └── 0.3 页面等高布局 (router.ts + views)
│
Phase 1: 基础架构
├── 1.1 useCharacters.ts (依赖 0.1)
├── 1.2 useLocalCache.ts
├── 1.3 stores/index.ts (依赖 0.1, 1.1, 1.2)
├── 1.4 更新 Views 引用 (依赖 1.3)
└── 基础组件 (无依赖)
    ├── 1.5 SliderField
    ├── 1.6 ArrayEditor
    ├── 1.7 EnumSelect
    ├── 1.8 Modal
    └── 1.9 ConfirmDialog (依赖 1.8)

Phase 2: 核心功能
├── 2.1 CharacterForm (依赖 1.5-1.7)
├── 2.2 AddCharacterModal (依赖 1.8, 2.1)
├── 2.3 Characters.vue 集成 (依赖 2.1, 2.2)
├── 2.4 CharacterName.vue (依赖 1.1) ★用户反馈
├── 2.5 CharacterDrawer.vue (依赖 2.1) ★用户反馈
├── 2.6 SectionAccordion
├── 2.7 RecordTable
├── 2.8 Variables.vue 重构 (依赖 2.6, 2.7)
└── 2.9 导入导出 (依赖 2.8)

Phase 3: 页面重构
├── 3.1 Dashboard 整合场景 (依赖 0.3) ★用户反馈
├── 3.2 人物库扑克牌卡片 (依赖 2.3) ★用户反馈
├── 3.3 关系网合并 (依赖 3.2, 4.1) ★用户反馈
├── 3.4 暗账页面优化 ★用户反馈
├── 3.5 Faction.vue 新实现
├── 3.6 Assets.vue 新实现
└── 3.7 Opportunities.vue 新实现 (依赖 2.4)

Phase 4: UI/UX优化
├── 4.1 关系网布局优化 ★用户反馈
├── 4.2 UI微交互增强 ★用户反馈
├── 4.3 能力值雷达图 ★用户反馈
├── 4.4 响应式布局完善 (依赖 0.2)
└── 4.5 敏感信息遮罩

Phase 5: 体验增强
├── 5.1 图片上传处理 (依赖 1.2) ★用户反馈
├── 5.2 个人档案风格切换 ★用户反馈
├── 5.3 年龄红线提示 ★用户反馈
├── 5.4 就地编辑功能 ★用户反馈
├── 5.5 虚拟滚动优化
├── 5.6 键盘快捷键
├── 5.7 变量同步脚本
└── 5.8 自动备份脚本
```

### E. 技术栈确认

| 类型       | 技术           | 用途           |
| ---------- | -------------- | -------------- |
| 框架       | Vue 3          | UI 框架        |
| 状态管理   | Pinia          | 响应式状态     |
| 路由       | Vue Router     | SPA 路由       |
| 校验       | Zod            | 数据校验       |
| 样式       | SCSS           | 样式预处理     |
| 工具       | Lodash         | 工具函数       |
| 克隆       | Klona          | 深拷贝         |
| 图标       | Font Awesome 6 | 图标库         |
| 组合式工具 | @vueuse/core   | 虚拟列表、工具 |

### F. iframe 适配要求（重要）

所有开发必须遵循以下 iframe 适配规则：

1. **禁止使用 `vh` 单位**: 会受宿主高度影响，应使用 `width` + `aspect-ratio` 或百分比
2. **避免 `min-height`**: 会强制撑高父容器
3. **避免 `overflow: auto`**: 在根容器上使用可能导致布局问题
4. **页面整体适配容器宽度**: 不产生横向滚动条
5. **卡片形状**: 如样式更适合卡片，不要有背景颜色（除非用户明确要求）

---

**文档结束**

> 本施工指南整合自以下来源：
>
> **原始文档**：
>
> - `doc/脚本引入构想.md`
> - `doc/架构重构方案.md`
> - `doc/UI_UX设计规范.md`
> - `doc/技术实现路径.md`
> - `doc/功能完善清单.md`
> - `V0 Edition Dev Log/*.md`
>
> **用户反馈**（共14条）：
>
> - 数据持久化策略修复
> - 导航交互重构（左侧常驻Icon）
> - 路由与页面结构重构
> - 角色名显示与交互统一化
> - 人物库功能修复与UI改进
> - 关系网与人物库合并
> - 页面优先级调整
> - 图片上传与处理
> - 暗账页面优化
> - UI交互增强
> - 数据可视化改进
> - 个人档案风格切换
> - 年龄红线动态提示
> - 就地编辑功能增强
