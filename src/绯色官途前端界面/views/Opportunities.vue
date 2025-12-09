<template>
  <div class="opportunities-page">
    <!-- 当前机遇 -->
    <section class="card success-card">
      <div class="card-header">
        <h2><i class="fas fa-star"></i> 当前机遇</h2>
        <span class="count">{{ Object.keys(机遇与危机.当前机遇).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(机遇与危机.当前机遇).length" class="item-list">
          <div v-for="(item, key) in 机遇与危机.当前机遇" :key="key" class="item-card success">
            <div class="item-header">
              <span class="item-name">{{ item.机遇名称 || key }}</span>
              <span class="level-tag" :class="opportunityLevel(item.机遇等级)">{{ item.机遇等级 }}</span>
            </div>
            <p class="item-content">{{ item.机遇内容 }}</p>
            <div class="item-meta">
              <span><i class="fas fa-route"></i> {{ item.来源渠道 }}</span>
              <span><i class="fas fa-hourglass-half"></i> {{ item.时效性 }}</span>
            </div>
            <div class="item-detail" v-if="item.所需资源 !== '无'">
              <strong>所需资源:</strong> {{ item.所需资源 }}
            </div>
            <div class="item-detail warning" v-if="item.潜在代价 !== '无'">
              <strong>潜在代价:</strong> {{ item.潜在代价 }}
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无机遇</p>
      </div>
    </section>

    <!-- 潜在危机 -->
    <section class="card danger-card">
      <div class="card-header">
        <h2><i class="fas fa-triangle-exclamation"></i> 潜在危机</h2>
        <span class="count">{{ Object.keys(机遇与危机.潜在危机).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(机遇与危机.潜在危机).length" class="item-list">
          <div v-for="(item, key) in 机遇与危机.潜在危机" :key="key" class="item-card danger">
            <div class="item-header">
              <span class="item-name">{{ item.危机名称 || key }}</span>
              <span class="level-tag" :class="crisisLevel(item.危机等级)">{{ item.危机等级 }}</span>
            </div>
            <p class="item-content">{{ item.危机内容 }}</p>
            <div class="item-meta">
              <span><i class="fas fa-crosshairs"></i> {{ item.危机来源 }}</span>
              <span :class="probClass(item.引爆概率)"><i class="fas fa-chart-line"></i> {{ item.引爆概率 }}</span>
            </div>
            <div class="item-detail" v-if="item.应对思路 !== '无'">
              <strong>应对思路:</strong> {{ item.应对思路 }}
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无危机</p>
      </div>
    </section>

    <!-- 待办事项 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-clipboard-list"></i> 待办事项</h2>
        <span class="count">{{ Object.keys(机遇与危机.待办事项).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(机遇与危机.待办事项).length" class="todo-list">
          <div v-for="(item, key) in sortedTodos" :key="key" class="todo-item" :class="urgencyClass(item.紧急程度)">
            <div class="todo-main">
              <span class="urgency-tag">{{ item.紧急程度 }}</span>
              <span class="todo-text">{{ item.事项 }}</span>
            </div>
            <div class="todo-meta">
              <span v-if="item.截止时间 !== '无'" class="deadline">
                <i class="far fa-clock"></i> {{ item.截止时间 }}
              </span>
              <div v-if="item.关联人物.length" class="related-chars">
                <router-link
                  v-for="char in item.关联人物"
                  :key="char"
                  :to="{ path: '/characters', query: { char } }"
                  class="char-link"
                >
                  {{ char }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无待办事项</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from '../stores/useGameData';

const gameData = useGameData();
const 机遇与危机 = computed(() => gameData.机遇与危机);

const sortedTodos = computed(() => {
  const items = 机遇与危机.value.待办事项;
  const order: Record<string, number> = { 火烧眉毛: 0, 尽快处理: 1, 正常推进: 2, 可以缓缓: 3 };
  return Object.fromEntries(
    Object.entries(items).sort((a, b) => (order[a[1].紧急程度] ?? 99) - (order[b[1].紧急程度] ?? 99)),
  );
});

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
  gap: var(--spacing-lg);
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &.success-card {
    border-color: rgba(74, 193, 142, 0.3);
  }
  &.danger-card {
    border-color: rgba(255, 107, 107, 0.3);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);

  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      color: var(--color-gold);
    }
  }

  .success-card & h2 i {
    color: var(--color-success);
  }
  .danger-card & h2 i {
    color: var(--color-danger);
  }

  .count {
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
  }
}

.card-body {
  padding: var(--spacing-lg);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.item-card {
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-border);

  &.success {
    border-left-color: var(--color-success);
  }
  &.danger {
    border-left-color: var(--color-danger);
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.level-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  color: var(--color-text-muted);

  &.legendary {
    background: linear-gradient(90deg, #ffd700, #ffec8b);
    color: var(--color-bg-dark);
  }
  &.epic {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }
  &.fatal {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.severe {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.item-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-xs);

  i {
    margin-right: 4px;
  }

  .high-prob {
    color: var(--color-danger);
  }
  .mid-prob {
    color: var(--color-warning);
  }
}

.item-detail {
  font-size: 12px;
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) 0;

  strong {
    color: var(--color-text-muted);
  }

  &.warning {
    color: var(--color-warning);
  }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.todo-item {
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-border);

  &.urgent {
    border-left-color: var(--color-danger);
  }
  &.high {
    border-left-color: var(--color-warning);
  }
  &.normal {
    border-left-color: var(--color-info);
  }
}

.todo-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.urgency-tag {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);

  .urgent & {
    color: var(--color-danger);
  }
  .high & {
    color: var(--color-warning);
  }
}

.todo-text {
  font-size: 13px;
  color: var(--color-text-primary);
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-muted);
}

.deadline {
  i {
    margin-right: 4px;
  }
}

.related-chars {
  display: flex;
  gap: var(--spacing-xs);
}

.char-link {
  padding: 2px 8px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-border);
    color: var(--color-text-primary);
  }
}

.empty-hint {
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
}
</style>

