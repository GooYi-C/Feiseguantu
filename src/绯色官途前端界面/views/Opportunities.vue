<template>
  <div class="opportunities-page">
    <!-- 仅保留看板视图 -->
    <div class="kanban-view">
      <!-- 潜在危机列 -->
      <div class="kanban-column danger-column">
        <div class="column-header">
          <h3><i class="fas fa-triangle-exclamation"></i> 潜在危机</h3>
          <span class="column-count">{{ crisisTodo.totalCount.value }}</span>
      </div>
        <div class="column-body">
          <div
            v-for="item in crisisTodo.mergedList.value"
            :key="item.key"
            class="kanban-card danger"
            :class="{ completed: item.isHidden }"
          >
            <label class="todo-checkbox">
              <input type="checkbox" :checked="item.isHidden" @change="crisisTodo.toggleItem(item.key, item.data, item.isHidden)" />
              <span class="checkmark"></span>
            </label>
            <div class="card-content">
              <div class="kanban-card-header">
                <span class="kanban-title">{{ item.data.危机名称 || item.key }}</span>
                <span class="level-badge" :class="crisisLevel(item.data.危机等级)">{{ item.data.危机等级 }}</span>
            </div>
              <p class="kanban-content">{{ item.data.危机内容 }}</p>
              <div class="kanban-details">
                <div class="detail-row">
                  <span><i class="fas fa-crosshairs"></i> 来源: {{ item.data.危机来源 }}</span>
                  <span :class="probClass(item.data.引爆概率)"><i class="fas fa-bolt"></i> {{ item.data.引爆概率 }}</span>
            </div>
                <div v-if="item.data.应对思路 && item.data.应对思路 !== '无'" class="detail-row solution">
                  <i class="fas fa-lightbulb"></i> {{ item.data.应对思路 }}
            </div>
            </div>
          </div>
        </div>
          <div v-if="crisisTodo.totalCount.value === 0" class="empty-column">
            <i class="fas fa-shield-halved"></i>
            <span>暂无危机</span>
          </div>
        </div>
      </div>

      <!-- 当前机遇列 -->
      <div class="kanban-column success-column">
        <div class="column-header">
          <h3><i class="fas fa-star"></i> 当前机遇</h3>
          <span class="column-count">{{ opportunityTodo.totalCount.value }}</span>
        </div>
        <div class="column-body">
          <div
            v-for="item in opportunityTodo.mergedList.value"
            :key="item.key"
            class="kanban-card success"
            :class="{ completed: item.isHidden }"
          >
            <label class="todo-checkbox">
              <input type="checkbox" :checked="item.isHidden" @change="opportunityTodo.toggleItem(item.key, item.data, item.isHidden)" />
              <span class="checkmark"></span>
            </label>
            <div class="card-content">
              <div class="kanban-card-header">
                <span class="kanban-title">{{ item.data.机遇名称 || item.key }}</span>
                <span class="level-badge" :class="opportunityLevel(item.data.机遇等级)">{{ item.data.机遇等级 }}</span>
              </div>
              <p class="kanban-content">{{ item.data.机遇内容 }}</p>
              <div class="kanban-details">
                <div class="detail-row">
                  <span><i class="fas fa-route"></i> 来源: {{ item.data.来源渠道 }}</span>
                  <span><i class="fas fa-clock"></i> {{ item.data.时效性 }}</span>
      </div>
                <div v-if="item.data.所需资源 && item.data.所需资源 !== '无'" class="detail-row resource">
                  <i class="fas fa-toolbox"></i> 所需资源: {{ item.data.所需资源 }}
            </div>
                <div v-if="item.data.潜在代价 && item.data.潜在代价 !== '无'" class="detail-row warning">
                  <i class="fas fa-exclamation-triangle"></i> 潜在代价: {{ item.data.潜在代价 }}
            </div>
            </div>
          </div>
        </div>
          <div v-if="opportunityTodo.totalCount.value === 0" class="empty-column">
            <i class="fas fa-seedling"></i>
            <span>暂无机遇</span>
          </div>
        </div>
      </div>

      <!-- 待办事项列 -->
      <div class="kanban-column todo-column">
        <div class="column-header">
          <h3><i class="fas fa-clipboard-list"></i> 待办事项</h3>
          <span class="column-count">{{ todoList.totalCount.value }}</span>
      </div>
        <div class="column-body">
          <div
            v-for="item in todoList.mergedList.value"
            :key="item.key"
            class="kanban-card todo"
            :class="[urgencyClass(item.data.紧急程度), { completed: item.isHidden }]"
          >
            <label class="todo-checkbox">
              <input type="checkbox" :checked="item.isHidden" @change="todoList.toggleItem(item.key, item.data, item.isHidden)" />
              <span class="checkmark"></span>
            </label>
            <div class="card-content">
              <div class="kanban-card-header">
                <span class="kanban-title">{{ item.data.事项 }}</span>
                <span class="urgency-badge" :class="urgencyClass(item.data.紧急程度)">{{ item.data.紧急程度 }}</span>
            </div>
              <div class="kanban-meta">
                <span v-if="item.data.截止时间 && item.data.截止时间 !== '无'" class="deadline-badge">
                  <i class="far fa-clock"></i> {{ item.data.截止时间 }}
              </span>
                <div v-if="item.data.关联人物.length" class="related-avatars">
                <CharacterName
                    v-for="char in item.data.关联人物.slice(0, 2)"
                  :key="char"
                  :name="char"
                    class="mini-char"
                />
                  <span v-if="item.data.关联人物.length > 2" class="more-chars">
                    +{{ item.data.关联人物.length - 2 }}
                  </span>
              </div>
            </div>
          </div>
        </div>
          <div v-if="todoList.totalCount.value === 0" class="empty-column">
            <i class="fas fa-check-circle"></i>
            <span>暂无待办</span>
          </div>
        </div>
      </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from '../stores/useGameData';
import { CharacterName } from '../components/common';
import { useTodoList } from '../composables/useTodoList';

const gameData = useGameData();

const 机遇与危机 = computed(() => gameData.机遇与危机);

// 类型定义
type 机遇类型 = typeof 机遇与危机.value.当前机遇[string];
type 危机类型 = typeof 机遇与危机.value.潜在危机[string];
type 待办类型 = typeof 机遇与危机.value.待办事项[string];

// ═══ 机遇 TodoList ═══
const opportunityTodo = useTodoList<机遇类型>({
  getActiveItems: () => 机遇与危机.value.当前机遇,
  deleteActiveItem: (key) => { delete gameData.rawData.机遇与危机.当前机遇[key]; },
  restoreActiveItem: (key, data) => { gameData.rawData.机遇与危机.当前机遇[key] = data; },
  saveToBackend: () => gameData.saveSection('机遇与危机'),
});

// ═══ 危机 TodoList ═══
const crisisTodo = useTodoList<危机类型>({
  getActiveItems: () => 机遇与危机.value.潜在危机,
  deleteActiveItem: (key) => { delete gameData.rawData.机遇与危机.潜在危机[key]; },
  restoreActiveItem: (key, data) => { gameData.rawData.机遇与危机.潜在危机[key] = data; },
  saveToBackend: () => gameData.saveSection('机遇与危机'),
});

// ═══ 待办事项 TodoList ═══
const todoList = useTodoList<待办类型>({
  getActiveItems: () => 机遇与危机.value.待办事项,
  deleteActiveItem: (key) => { delete gameData.rawData.机遇与危机.待办事项[key]; },
  restoreActiveItem: (key, data) => { gameData.rawData.机遇与危机.待办事项[key] = data; },
  saveToBackend: () => gameData.saveSection('机遇与危机'),
  // 按紧急程度排序，保持相同紧急程度内的原始顺序
  sortFn: (a, b) => {
  const order: Record<string, number> = { 火烧眉毛: 0, 尽快处理: 1, 正常推进: 2, 可以缓缓: 3 };
    const orderA = order[a.data.紧急程度] ?? 99;
    const orderB = order[b.data.紧急程度] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.sortIndex - b.sortIndex;
  },
});

// ═══ 工具函数 ═══
function opportunityLevel(level: string) {
  if (level === '改变命运') return 'legendary';
  if (level === '重大晋升') return 'epic';
  if (level === '有利发展') return 'good';
  return 'minor';
}

function crisisLevel(level: string) {
  if (level === '灭顶之灾') return 'fatal';
  if (level === '严重威胁') return 'severe';
  if (level === '需要警惕') return 'moderate';
  return 'minor';
}

function probClass(prob: string) {
  if (['极高', '偏高'].includes(prob)) return 'high-prob';
  if (prob === '中等') return 'mid-prob';
  return '';
}

function urgencyClass(level: string) {
  if (level === '火烧眉毛') return 'urgent';
  if (level === '尽快处理') return 'high';
  if (level === '正常推进') return 'normal';
  return 'low';
}
</script>

<style lang="scss" scoped>
.opportunities-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// ═══ 看板视图 ═══
.kanban-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 0;
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &.danger-column {
    border-top: 3px solid var(--color-danger);
    &:hover { box-shadow: 0 8px 24px rgba(255, 107, 107, 0.15); }
  }
  &.success-column {
    border-top: 3px solid var(--color-success);
    &:hover { box-shadow: 0 8px 24px rgba(74, 193, 142, 0.15); }
  }
  &.todo-column {
    border-top: 3px solid var(--color-info);
    &:hover { box-shadow: 0 8px 24px rgba(122, 162, 247, 0.15); }
  }
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;

  h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      font-size: 12px;
    }
  }

  .danger-column & h3 i { color: var(--color-danger); }
  .success-column & h3 i { color: var(--color-success); }
  .todo-column & h3 i { color: var(--color-info); }

  .column-count {
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
  }
}

.column-body {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.kanban-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid;
  transition: all var(--transition-fast);

  &:hover:not(.completed) {
    background: rgba(255, 255, 255, 0.04);
    transform: translateX(2px);
  }

  &.danger {
    border-left-color: var(--color-danger);
    &:hover:not(.completed) { box-shadow: inset 0 0 0 1px rgba(255, 107, 107, 0.2); }
  }
  &.success {
    border-left-color: var(--color-success);
    &:hover:not(.completed) { box-shadow: inset 0 0 0 1px rgba(74, 193, 142, 0.2); }
  }
  &.todo {
    border-left-color: var(--color-info);
    &:hover:not(.completed) { box-shadow: inset 0 0 0 1px rgba(122, 162, 247, 0.2); }

    &.urgent {
      border-left-color: var(--color-danger);
      &:hover:not(.completed) { box-shadow: inset 0 0 0 1px rgba(255, 107, 107, 0.2); }
    }
    &.high {
      border-left-color: var(--color-warning);
      &:hover:not(.completed) { box-shadow: inset 0 0 0 1px rgba(224, 195, 108, 0.2); }
    }
  }

  &.completed {
    opacity: 0.5;

    .kanban-title, .kanban-content {
      text-decoration: line-through;
      color: var(--color-text-muted);
    }
  }
}

// Todo checkbox
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
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-border);
    border-radius: 4px;
    background: transparent;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      display: none;
      width: 4px;
      height: 8px;
      border: solid var(--color-success);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 2px;
    }
  }

  input:checked + .checkmark {
    border-color: var(--color-success);
    background: rgba(74, 193, 142, 0.1);

    &::after { display: block; }
}

  &:hover .checkmark {
    border-color: var(--color-text-muted);
  }
}

.card-content {
  flex: 1;
  min-width: 0;
}

.kanban-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.kanban-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  flex: 1;
}

.level-badge, .urgency-badge {
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  white-space: nowrap;

  &.legendary {
    background: linear-gradient(90deg, #ffd700, #ffec8b);
    color: var(--color-bg-dark);
  }
  &.epic, &.good {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }
  &.fatal {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.severe, &.moderate {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
  &.urgent {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.high {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.kanban-content {
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  word-break: break-word;
}

// 详情区域
.kanban-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 11px;
  color: var(--color-text-muted);

  i {
    margin-right: 3px;
    font-size: 10px;
  }

  &.solution {
    color: var(--color-info);
    font-style: italic;
  }

  &.resource {
    color: var(--color-success);
  }

  &.warning {
    color: var(--color-warning);
  }

  .high-prob {
    color: var(--color-danger);
  }
  .mid-prob {
    color: var(--color-warning);
  }
}

.kanban-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 11px;
  color: var(--color-text-muted);

  i {
    margin-right: 3px;
  }
}

.deadline-badge {
  padding: 2px 6px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 10px;
}

.related-avatars {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.mini-char {
  padding: 2px 6px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 10px;
  color: var(--color-text-secondary);
}

.more-chars {
  font-size: 10px;
  color: var(--color-text-muted);
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-size: 12px;

  i {
    font-size: 24px;
    opacity: 0.5;
  }
}
</style>
