<template>
  <div class="dashboard">
    <!-- 时空舆情卡 -->
    <section class="card time-card">
      <div class="card-header">
        <h2><i class="fas fa-globe"></i> 时空舆情</h2>
        <span class="climate-badge" :class="climateClass">{{ 时空舆情.政治气候 }}</span>
      </div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">当前地点</span>
            <span class="value">{{ 时空舆情.当前地点 || '未知' }}</span>
          </div>
          <div v-if="时空舆情.重大事件 !== '无'" class="info-item">
            <span class="label">重大事件</span>
            <span class="value highlight">{{ 时空舆情.重大事件 }}</span>
          </div>
          <div v-if="时空舆情.中央动态 !== '无'" class="info-item">
            <span class="label">中央动态</span>
            <span class="value">{{ 时空舆情.中央动态 }}</span>
          </div>
          <div v-if="时空舆情.省内风向 !== '无'" class="info-item">
            <span class="label">省内风向</span>
            <span class="value">{{ 时空舆情.省内风向 }}</span>
          </div>
          <div v-if="时空舆情.本地新闻 !== '无'" class="info-item">
            <span class="label">本地新闻</span>
            <span class="value">{{ 时空舆情.本地新闻 }}</span>
          </div>
          <div v-if="时空舆情.圈内传闻 !== '无'" class="info-item">
            <span class="label">圈内传闻</span>
            <span class="value warning">{{ 时空舆情.圈内传闻 }}</span>
          </div>
          <div v-if="时空舆情.个人风评 !== '无'" class="info-item">
            <span class="label">个人风评</span>
            <span class="value">{{ 时空舆情.个人风评 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 当前场景 -->
    <section v-if="当前场景.场景类型 !== '无'" class="card scene-card">
      <div class="card-header">
        <h2><i class="fas fa-map-location-dot"></i> 当前场景</h2>
        <span class="scene-type">{{ 当前场景.场景类型 }}</span>
      </div>
      <div class="card-body">
        <p v-if="当前场景.场景速写 !== '无'" class="scene-desc">{{ 当前场景.场景速写 }}</p>
        <div class="scene-meta">
          <span v-if="当前场景.气氛基调 !== '无'" class="mood">
            <i class="fas fa-theater-masks"></i> {{ 当前场景.气氛基调 }}
          </span>
          <div v-if="当前场景.在场人物.length" class="present-chars">
            <i class="fas fa-users"></i>
            <span v-for="char in 当前场景.在场人物" :key="char" class="char-tag">{{ char }}</span>
          </div>
        </div>
        <div v-if="当前场景.潜在议题 !== '无'" class="topic">
          <i class="fas fa-lightbulb"></i> 潜在议题: {{ 当前场景.潜在议题 }}
        </div>
      </div>
    </section>

    <!-- 统计卡片行 -->
    <div class="stat-row">
      <div class="stat-card" @click="$router.push('/characters')">
        <div class="stat-icon"><i class="fas fa-users"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ 人物总数 }}</span>
          <span class="stat-label">人物库</span>
        </div>
      </div>
      <div class="stat-card romance" @click="$router.push('/romance')">
        <div class="stat-icon"><i class="fas fa-heart"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ 绯色对象列表.length }}</span>
          <span class="stat-label">绯色对象</span>
        </div>
      </div>
      <div class="stat-card danger" @click="$router.push('/opportunities')">
        <div class="stat-icon"><i class="fas fa-bomb"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ 危机数量 }}</span>
          <span class="stat-label">潜在危机</span>
        </div>
      </div>
      <div class="stat-card success" @click="$router.push('/opportunities')">
        <div class="stat-icon"><i class="fas fa-star"></i></div>
        <div class="stat-info">
          <span class="stat-value">{{ 机遇数量 }}</span>
          <span class="stat-label">当前机遇</span>
        </div>
      </div>
    </div>

    <!-- 待办事项 -->
    <section v-if="待办事项.length" class="card todo-card">
      <div class="card-header">
        <h2><i class="fas fa-clipboard-list"></i> 待办事项</h2>
        <span class="count-badge">{{ 待办事项.length }}</span>
      </div>
      <div class="card-body">
        <ul class="todo-list">
          <li v-for="[key, todo] in 待办事项" :key="key" class="todo-item" :class="urgencyClass(todo.紧急程度)">
            <div class="todo-main">
              <span class="todo-urgency">{{ todo.紧急程度 }}</span>
              <span class="todo-text">{{ todo.事项 }}</span>
            </div>
            <div class="todo-meta">
              <span v-if="todo.截止时间 !== '无'" class="deadline">
                <i class="far fa-clock"></i> {{ todo.截止时间 }}
              </span>
              <span v-if="todo.关联人物.length" class="related">
                <i class="fas fa-user"></i> {{ todo.关联人物.join(', ') }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 关系索引快览 -->
    <section class="card relations-card">
      <div class="card-header">
        <h2><i class="fas fa-diagram-project"></i> 关系索引</h2>
        <router-link to="/relations" class="more-link">查看关系网 <i class="fas fa-arrow-right"></i></router-link>
      </div>
      <div class="card-body">
        <div class="relation-grid">
          <div v-if="关系索引.一把手 !== '无'" class="relation-item">
            <span class="rel-label">一把手</span>
            <span class="rel-value gold">{{ 关系索引.一把手 }}</span>
          </div>
          <div v-if="关系索引.直接上级 !== '无'" class="relation-item">
            <span class="rel-label">直接上级</span>
            <span class="rel-value">{{ 关系索引.直接上级 }}</span>
          </div>
          <div v-if="关系索引.配偶 !== '无'" class="relation-item">
            <span class="rel-label">配偶</span>
            <span class="rel-value">{{ 关系索引.配偶 }}</span>
          </div>
          <div v-if="关系索引.靠山列表.length" class="relation-item">
            <span class="rel-label">靠山</span>
            <div class="rel-tags">
              <span v-for="p in 关系索引.靠山列表" :key="p" class="rel-tag gold">{{ p }}</span>
            </div>
          </div>
          <div v-if="关系索引.绯色对象列表.length" class="relation-item">
            <span class="rel-label">绯色对象</span>
            <div class="rel-tags">
              <span v-for="p in 关系索引.绯色对象列表" :key="p" class="rel-tag romance">{{ p }}</span>
            </div>
          </div>
          <div v-if="关系索引.竞争对手列表.length" class="relation-item">
            <span class="rel-label">竞争对手</span>
            <div class="rel-tags">
              <span v-for="p in 关系索引.竞争对手列表" :key="p" class="rel-tag warning">{{ p }}</span>
            </div>
          </div>
          <div v-if="关系索引.政治宿敌列表.length" class="relation-item">
            <span class="rel-label">政治宿敌</span>
            <div class="rel-tags">
              <span v-for="p in 关系索引.政治宿敌列表" :key="p" class="rel-tag danger">{{ p }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from '../stores/useGameData';

const gameData = useGameData();

const 时空舆情 = computed(() => gameData.时空舆情);
const 当前场景 = computed(() => gameData.当前场景);
const 关系索引 = computed(() => gameData.关系索引);
const 人物总数 = computed(() => gameData.人物总数);
const 绯色对象列表 = computed(() => gameData.绯色对象列表);
const 危机数量 = computed(() => gameData.危机数量);
const 机遇数量 = computed(() => gameData.机遇数量);

const 待办事项 = computed(() => {
  const items = gameData.机遇与危机.待办事项;
  return Object.entries(items).sort((a, b) => {
    const order: Record<string, number> = { 火烧眉毛: 0, 尽快处理: 1, 正常推进: 2, 可以缓缓: 3 };
    return (order[a[1].紧急程度] ?? 99) - (order[b[1].紧急程度] ?? 99);
  });
});

const climateClass = computed(() => {
  const climate = 时空舆情.value.政治气候;
  if (climate === '狂飙年代') return 'gold';
  if (climate === '雷霆震荡') return 'danger';
  if (climate === '大考淬炼') return 'warning';
  if (climate === '存量博弈') return 'muted';
  return '';
});

function urgencyClass(level: string) {
  if (level === '火烧眉毛') return 'urgent';
  if (level === '尽快处理') return 'high';
  if (level === '正常推进') return 'normal';
  return 'low';
}
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// ═══ 通用卡片 ═══
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
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
}

.card-body {
  padding: var(--spacing-lg);
}

// ═══ 时空舆情卡 ═══
.climate-badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);

  &.gold {
    background: rgba(216, 166, 87, 0.2);
    color: var(--color-gold);
  }
  &.danger {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.warning {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;

    &.highlight {
      color: var(--color-gold);
    }
    &.warning {
      color: var(--color-warning);
    }
  }
}

// ═══ 场景卡 ═══
.scene-type {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
}

.scene-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.scene-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);

  .mood {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-text-muted);

    i {
      color: var(--color-romance-light);
    }
  }
}

.present-chars {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;

  i {
    color: var(--color-text-muted);
    font-size: 12px;
  }
}

.char-tag {
  padding: 2px 8px;
  font-size: 11px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
}

.topic {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(216, 166, 87, 0.1);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-gold);

  i {
    margin-right: 6px;
  }
}

// ═══ 统计卡片行 ═══
.stat-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    font-size: 18px;
    color: var(--color-gold);
  }

  &.romance .stat-icon {
    background: rgba(255, 77, 109, 0.15);
    color: var(--color-romance-light);
  }
  &.danger .stat-icon {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }
  &.success .stat-icon {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary);
    font-family: var(--font-display);
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

// ═══ 待办事项 ═══
.count-badge {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
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

.todo-urgency {
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
  gap: var(--spacing-md);
  font-size: 11px;
  color: var(--color-text-muted);

  i {
    margin-right: 4px;
  }
}

// ═══ 关系索引 ═══
.more-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);

  &:hover {
    color: var(--color-gold);
  }
}

.relation-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.relation-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .rel-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rel-value {
    font-size: 14px;
    color: var(--color-text-primary);

    &.gold {
      color: var(--color-gold);
    }
  }
}

.rel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.rel-tag {
  padding: 3px 10px;
  font-size: 12px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);

  &.gold {
    background: rgba(216, 166, 87, 0.15);
    color: var(--color-gold);
  }
  &.romance {
    background: rgba(255, 77, 109, 0.15);
    color: var(--color-romance-light);
  }
  &.warning {
    background: rgba(224, 195, 108, 0.15);
    color: var(--color-warning);
  }
  &.danger {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }
}
</style>

