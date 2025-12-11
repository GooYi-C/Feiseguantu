<template>
  <div class="assets-secrets-page">
    <!-- 单页布局：资产概览嵌入顶部 + 两行内容 -->
    <div class="main-content">
      <!-- 第一行：资产概览条 + 房产、座驾、白手套 -->
      <div class="row-assets">
        <!-- 资产概览条（嵌入式） -->
        <div class="overview-bar">
          <div class="overview-item">
            <span class="ov-label">申报资产</span>
            <span class="ov-value">{{ formatMoney(个人资产.申报资产) }}</span>
          </div>
          <div class="overview-item">
            <span class="ov-label">实际资产</span>
            <span class="ov-value">{{ formatMoney(个人资产.实际资产) }}</span>
          </div>
          <div class="overview-item danger">
            <span class="ov-label">灰色资产</span>
            <span class="ov-value">{{ formatMoney(个人资产.灰色资产) }}</span>
          </div>
        </div>

        <!-- 房产 -->
        <div class="section-card">
          <div class="section-header">
            <i class="fas fa-house"></i>
            <span>房产</span>
            <span class="count">({{ Object.keys(个人资产.房产).length }})</span>
          </div>
          <div class="section-body">
            <div v-for="(item, key) in 个人资产.房产" :key="key" class="item-card">
              <div class="item-main">
                <span class="item-name">{{ item.位置 }}</span>
                <span class="item-value">{{ formatMoney(item.估值) }}</span>
              </div>
              <div class="item-details">
                <span><i class="fas fa-ruler-combined"></i> {{ item.面积 }}</span>
                <span><i class="fas fa-route"></i> {{ item.来源 }}</span>
                <span v-if="item.登记人 && item.登记人 !== '无'">
                  <i class="fas fa-user"></i> <CharacterName :name="item.登记人" />
                </span>
              </div>
            </div>
            <p v-if="!Object.keys(个人资产.房产).length" class="empty-hint">暂无房产</p>
          </div>
        </div>

        <!-- 座驾 -->
        <div class="section-card">
          <div class="section-header">
            <i class="fas fa-car"></i>
            <span>座驾</span>
            <span class="count">({{ Object.keys(个人资产.座驾).length }})</span>
          </div>
          <div class="section-body">
            <div v-for="(item, key) in 个人资产.座驾" :key="key" class="item-card">
              <div class="item-main">
                <span class="item-name">{{ item.品牌型号 }}</span>
              </div>
              <div class="item-details">
                <span><i class="fas fa-route"></i> {{ item.来源 }}</span>
              </div>
            </div>
            <p v-if="!Object.keys(个人资产.座驾).length" class="empty-hint">暂无座驾</p>
          </div>
        </div>

        <!-- 白手套 -->
        <div class="section-card danger-section">
          <div class="section-header">
            <i class="fas fa-mask"></i>
            <span>白手套</span>
            <span class="count">({{ Object.keys(个人资产.白手套).length }})</span>
          </div>
          <div class="section-body">
            <div v-for="(item, key) in 个人资产.白手套" :key="key" class="item-card">
              <div class="item-main">
                <CharacterName :name="key as string" class="item-name-char" />
                <span class="item-value">{{ formatMoney(item.代持金额) }}</span>
              </div>
              <div class="item-details">
                <span v-if="item.代持内容 && item.代持内容 !== '无'"
                  ><i class="fas fa-briefcase"></i> {{ item.代持内容 }}</span
                >
                <span :class="reliabilityClass(item.可靠程度)"
                  ><i class="fas fa-shield-halved"></i> {{ item.可靠程度 }}</span
                >
              </div>
            </div>
            <p v-if="!Object.keys(个人资产.白手套).length" class="empty-hint">暂无白手套</p>
          </div>
        </div>
      </div>

      <!-- 第二行：把柄、政治地雷、人情债（to-do list 样式，高度与第一行一致） -->
      <div class="row-secrets">
        <!-- 把柄 -->
        <div class="section-card handles-section">
          <div class="section-header">
            <i class="fas fa-hand-holding"></i>
            <span>把柄</span>
            <span class="count">({{ handlesTodoList.totalCount.value }})</span>
            <div class="view-tabs">
              <button :class="{ active: handleView === 'all' }" @click="handleView = 'all'">全部</button>
              <button :class="{ active: handleView === 'held' }" @click="handleView = 'held'">被握</button>
              <button :class="{ active: handleView === 'holding' }" @click="handleView = 'holding'">手握</button>
            </div>
          </div>
          <div class="section-body todo-list">
            <!-- 被握把柄 -->
            <template v-if="handleView !== 'holding'">
              <div
                v-for="item in 合并被握把柄"
                :key="'held-' + item.key"
                class="todo-item held"
                :class="{ completed: item.isHidden }"
              >
                <label class="todo-checkbox">
                  <input
                    type="checkbox"
                    :checked="item.isHidden"
                    @change="toggleHandle('被握把柄', item.key, item.data, item.isHidden)"
                  />
                  <span class="checkmark"></span>
                </label>
                <div class="todo-content">
                  <div class="todo-main">
                    <span class="type-badge held"><i class="fas fa-bomb"></i></span>
                    <span class="todo-title">{{ item.key }}</span>
                    <span class="risk-badge" :class="riskClass(item.data.暴露风险)">{{ item.data.暴露风险 }}</span>
                  </div>
                  <p class="todo-desc">{{ item.data.把柄内容 }}</p>
                  <div class="todo-meta">
                    <span>掌握者: <CharacterName :name="item.data.掌握者" /></span>
                    <span :class="fatalClass(item.data.致命程度)">{{ item.data.致命程度 }}</span>
                    <span v-if="item.data.当前状态 && item.data.当前状态 !== '无'">{{ item.data.当前状态 }}</span>
                  </div>
                </div>
              </div>
            </template>
            <!-- 手握把柄 -->
            <template v-if="handleView !== 'held'">
              <div
                v-for="item in 合并手握把柄"
                :key="'holding-' + item.key"
                class="todo-item holding"
                :class="{ completed: item.isHidden }"
              >
                <label class="todo-checkbox">
                  <input
                    type="checkbox"
                    :checked="item.isHidden"
                    @change="toggleHandle('手握把柄', item.key, item.data, item.isHidden)"
                  />
                  <span class="checkmark"></span>
                </label>
                <div class="todo-content">
                  <div class="todo-main">
                    <span class="type-badge holding"><i class="fas fa-fist-raised"></i></span>
                    <span class="todo-title">{{ item.key }}</span>
                    <span class="usage-badge">{{ item.data.可用性 }}</span>
                  </div>
                  <p class="todo-desc">{{ item.data.把柄内容 }}</p>
                  <div class="todo-meta">
                    <span>涉及者: <CharacterName :name="item.data.目标人物" /></span>
                    <span :class="fatalClass(item.data.致命程度)">{{ item.data.致命程度 }}</span>
                  </div>
                </div>
              </div>
            </template>
            <p v-if="filteredHandlesEmpty" class="empty-hint">暂无把柄记录</p>
          </div>
        </div>

        <!-- 政治地雷 -->
        <div class="section-card mines-section">
          <div class="section-header">
            <i class="fas fa-bomb"></i>
            <span>政治地雷</span>
            <span class="count">({{ minesTodo.totalCount.value }})</span>
          </div>
          <div class="section-body todo-list">
            <div
              v-for="item in minesTodo.mergedList.value"
              :key="item.key"
              class="todo-item mine"
              :class="{ completed: item.isHidden }"
            >
              <label class="todo-checkbox">
                <input
                  type="checkbox"
                  :checked="item.isHidden"
                  @change="minesTodo.toggleItem(item.key, item.data, item.isHidden)"
                />
                <span class="checkmark"></span>
              </label>
              <div class="todo-content">
                <div class="todo-main">
                  <span class="todo-title">{{ item.key }}</span>
                  <span class="mine-type">{{ item.data.性质 }}</span>
                </div>
                <p class="todo-desc">{{ item.data.内容 }}</p>
                <div class="todo-meta">
                  <span><i class="fas fa-route"></i> {{ item.data.来源 }}</span>
                  <span><i class="fas fa-explosion"></i> {{ item.data.杀伤力 }}</span>
                </div>
                <div v-if="item.data.引爆条件 && item.data.引爆条件 !== '无'" class="trigger-badge">
                  <i class="fas fa-exclamation-triangle"></i> {{ item.data.引爆条件 }}
                </div>
              </div>
            </div>
            <p v-if="minesTodo.totalCount.value === 0" class="empty-hint">暂无政治地雷</p>
          </div>
        </div>

        <!-- 人情债 -->
        <div class="section-card debts-section">
          <div class="section-header">
            <i class="fas fa-handshake-angle"></i>
            <span>人情债</span>
            <span class="count">({{ debtsTodo.totalCount.value }})</span>
          </div>
          <div class="section-body todo-list">
            <div
              v-for="item in debtsTodo.mergedList.value"
              :key="item.key"
              class="todo-item debt"
              :class="{ completed: item.isHidden }"
            >
              <label class="todo-checkbox">
                <input
                  type="checkbox"
                  :checked="item.isHidden"
                  @change="debtsTodo.toggleItem(item.key, item.data, item.isHidden)"
                />
                <span class="checkmark"></span>
              </label>
              <div class="todo-content">
                <div class="todo-main">
                  <span class="todo-title">{{ item.key }}</span>
                  <span class="pressure-badge" :class="pressureClass(item.data.偿还压力)">{{
                    item.data.偿还压力
                  }}</span>
                </div>
                <p class="todo-desc">{{ item.data.欠债内容 }}</p>
                <div class="todo-meta">
                  <span>债主: <CharacterName :name="item.data.债主" /></span>
                  <span>性质: {{ item.data.债务性质 }}</span>
                </div>
              </div>
            </div>
            <p v-if="debtsTodo.totalCount.value === 0" class="empty-hint">暂无人情债</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CharacterName } from '../components/common';
import { useGroupedTodoList, useTodoList } from '../composables/useTodoList';
import { useGameData } from '../stores/useGameData';

const gameData = useGameData();
const 个人资产 = computed(() => gameData.个人资产);
const 暗账 = computed(() => gameData.暗账);

// 把柄视图切换
const handleView = ref<'all' | 'held' | 'holding'>('all');

// 类型定义
type 被握把柄类型 = (typeof 暗账.value.被握把柄)[string];
type 手握把柄类型 = (typeof 暗账.value.手握把柄)[string];
type 政治地雷类型 = (typeof 暗账.value.政治地雷)[string];
type 人情债类型 = (typeof 暗账.value.人情债)[string];

// ═══ 把柄使用分组 TodoList ═══
const handlesTodoList = useGroupedTodoList<被握把柄类型 | 手握把柄类型>({
  groups: [
    {
      type: '被握把柄',
      getActiveItems: () => 暗账.value.被握把柄 as Record<string, 被握把柄类型 | 手握把柄类型>,
      deleteActiveItem: key => {
        delete gameData.rawData.暗账.被握把柄[key];
      },
      restoreActiveItem: (key, data) => {
        gameData.rawData.暗账.被握把柄[key] = data as 被握把柄类型;
      },
    },
    {
      type: '手握把柄',
      getActiveItems: () => 暗账.value.手握把柄 as Record<string, 被握把柄类型 | 手握把柄类型>,
      deleteActiveItem: key => {
        delete gameData.rawData.暗账.手握把柄[key];
      },
      restoreActiveItem: (key, data) => {
        gameData.rawData.暗账.手握把柄[key] = data as 手握把柄类型;
      },
    },
  ],
  saveToBackend: () => gameData.saveSection('暗账'),
});

const 合并被握把柄 = handlesTodoList.getMergedListForGroup('被握把柄');
const 合并手握把柄 = handlesTodoList.getMergedListForGroup('手握把柄');

async function toggleHandle(type: '被握把柄' | '手握把柄', key: string, data: unknown, isHidden: boolean) {
  await handlesTodoList.toggleItem(type, key, data as 被握把柄类型 | 手握把柄类型, isHidden);
}

const filteredHandlesEmpty = computed(() => {
  if (handleView.value === 'all') {
    return 合并被握把柄.value.length === 0 && 合并手握把柄.value.length === 0;
  }
  if (handleView.value === 'held') {
    return 合并被握把柄.value.length === 0;
  }
  return 合并手握把柄.value.length === 0;
});

// ═══ 政治地雷 TodoList ═══
const minesTodo = useTodoList<政治地雷类型>({
  getActiveItems: () => 暗账.value.政治地雷,
  deleteActiveItem: key => {
    delete gameData.rawData.暗账.政治地雷[key];
  },
  restoreActiveItem: (key, data) => {
    gameData.rawData.暗账.政治地雷[key] = data;
  },
  saveToBackend: () => gameData.saveSection('暗账'),
});

// ═══ 人情债 TodoList ═══
const debtsTodo = useTodoList<人情债类型>({
  getActiveItems: () => 暗账.value.人情债,
  deleteActiveItem: key => {
    delete gameData.rawData.暗账.人情债[key];
  },
  restoreActiveItem: (key, data) => {
    gameData.rawData.暗账.人情债[key] = data;
  },
  saveToBackend: () => gameData.saveSection('暗账'),
});

// ═══ 工具函数 ═══
function formatMoney(val: number) {
  if (val >= 10000) return (val / 10000).toFixed(1) + ' 亿';
  return val + ' 万';
}

function reliabilityClass(level: string) {
  if (level === '绝对可靠') return 'safe';
  if (level === '基本可信') return 'ok';
  if (level === '存有隐患') return 'warn';
  if (level === '可能反水') return 'danger';
  return '';
}

function riskClass(risk: string) {
  if (['随时暴露', '风险极高'].includes(risk)) return 'critical';
  if (['风险偏高', '风险中等'].includes(risk)) return 'high';
  return 'low';
}

function fatalClass(level: string) {
  if (['移送判刑', '双规留置'].includes(level)) return 'fatal';
  if (['撤职免职', '党纪处分'].includes(level)) return 'serious';
  return 'minor';
}

function pressureClass(pressure: string) {
  if (pressure === '火烧眉毛') return 'urgent';
  if (pressure === '明确索要') return 'high';
  if (pressure === '偶尔提及') return 'mid';
  return 'low';
}
</script>

<style lang="scss" scoped>
.assets-secrets-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
  min-height: 0;
}

// ═══ 第一行：资产概览 + 房产/座驾/白手套 ═══
.row-assets {
  display: grid;
  grid-template-columns: 120px repeat(3, 1fr);
  gap: var(--spacing-sm);
  flex: 1;
  min-height: 0;
}

// 资产概览条（嵌入式）
.overview-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.overview-item {
  padding: var(--spacing-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .ov-label {
    display: block;
    font-size: 9px;
    color: var(--color-text-muted);
    margin-bottom: 2px;
  }

  .ov-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-gold);
    font-family: var(--font-display);
  }

  &.danger {
    border-color: rgba(255, 107, 107, 0.3);
    .ov-value {
      color: var(--color-danger);
    }
  }
}

// ═══ 第二行：暗账（高度与第一行一致） ═══
.row-secrets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  flex: 1;
  min-height: 0;
}

// ═══ 通用分区卡片 ═══
.section-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    border-color: var(--color-border-light);
  }

  &.danger-section {
    border-color: rgba(255, 107, 107, 0.3);
    &:hover {
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.15);
    }
  }
  &.handles-section {
    border-color: rgba(216, 166, 87, 0.3);
    &:hover {
      box-shadow: 0 6px 20px rgba(216, 166, 87, 0.15);
    }
  }
  &.mines-section {
    border-color: rgba(224, 195, 108, 0.3);
    &:hover {
      box-shadow: 0 6px 20px rgba(224, 195, 108, 0.15);
    }
  }
  &.debts-section {
    border-color: rgba(122, 162, 247, 0.3);
    &:hover {
      box-shadow: 0 6px 20px rgba(122, 162, 247, 0.15);
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex-shrink: 0;

  i {
    color: var(--color-gold);
    font-size: 11px;
  }

  .danger-section & i {
    color: var(--color-danger);
  }
  .handles-section & i {
    color: var(--color-gold);
  }
  .mines-section & i {
    color: var(--color-warning);
  }
  .debts-section & i {
    color: var(--color-info);
  }

  .count {
    color: var(--color-text-muted);
    font-weight: 400;
  }
}

.view-tabs {
  margin-left: auto;
  display: flex;
  gap: 2px;

  button {
    padding: 2px 6px;
    font-size: 9px;
    background: var(--color-bg-card);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-text-secondary);
    }
    &.active {
      background: var(--color-gold);
      color: var(--color-bg-dark);
    }
  }
}

.section-body {
  flex: 1;
  padding: var(--spacing-xs);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

// ═══ 资产项目卡片 ═══
.item-card {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    transform: translateX(2px);
  }
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.item-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.item-name-char {
  font-size: 12px !important;
  font-weight: 600 !important;
}

.item-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-gold);
}

.item-details {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  font-size: 10px;
  color: var(--color-text-muted);

  i {
    margin-right: 2px;
    font-size: 9px;
  }

  .safe {
    color: var(--color-success);
  }
  .ok {
    color: var(--color-info);
  }
  .warn {
    color: var(--color-warning);
  }
  .danger {
    color: var(--color-danger);
  }
}

// ═══ Todo List 样式 ═══
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-border);
  transition: all var(--transition-fast);

  &:hover:not(.completed) {
    background: rgba(255, 255, 255, 0.04);
    transform: translateX(2px);
  }

  &.held {
    border-left-color: var(--color-danger);
    &:hover:not(.completed) {
      box-shadow: inset 0 0 0 1px rgba(255, 107, 107, 0.15);
    }
  }
  &.holding {
    border-left-color: var(--color-success);
    &:hover:not(.completed) {
      box-shadow: inset 0 0 0 1px rgba(74, 193, 142, 0.15);
    }
  }
  &.mine {
    border-left-color: var(--color-warning);
    &:hover:not(.completed) {
      box-shadow: inset 0 0 0 1px rgba(224, 195, 108, 0.15);
    }
  }
  &.debt {
    border-left-color: var(--color-info);
    &:hover:not(.completed) {
      box-shadow: inset 0 0 0 1px rgba(122, 162, 247, 0.15);
    }
  }

  &.completed {
    opacity: 0.5;
    .todo-title,
    .todo-desc {
      text-decoration: line-through;
      color: var(--color-text-muted);
    }
  }
}

.todo-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;

  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    width: 14px;
    height: 14px;
    border: 2px solid var(--color-border);
    border-radius: 3px;
    background: transparent;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      display: none;
      width: 3px;
      height: 6px;
      border: solid var(--color-success);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 1px;
    }
  }

  input:checked + .checkmark {
    border-color: var(--color-success);
    background: rgba(74, 193, 142, 0.1);

    &::after {
      display: block;
    }
  }

  &:hover .checkmark {
    border-color: var(--color-text-muted);
  }
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.type-badge {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 9px;

  &.held {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.holding {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }
}

.todo-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.risk-badge,
.usage-badge,
.mine-type,
.pressure-badge {
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
}

.risk-badge {
  &.critical {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.high {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.pressure-badge {
  &.urgent {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.high {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.todo-desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  word-break: break-word;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  font-size: 10px;
  color: var(--color-text-muted);

  i {
    margin-right: 2px;
  }

  .fatal {
    color: var(--color-danger);
  }
  .serious {
    color: var(--color-warning);
  }
}

.trigger-badge {
  margin-top: 4px;
  padding: 3px 6px;
  background: rgba(224, 195, 108, 0.1);
  border-radius: var(--radius-sm);
  font-size: 10px;
  color: var(--color-warning);

  i {
    margin-right: 4px;
  }
}

// ═══ 空状态 ═══
.empty-hint {
  color: var(--color-text-muted);
  font-size: 11px;
  font-style: italic;
  text-align: center;
  padding: var(--spacing-sm);
}
</style>
