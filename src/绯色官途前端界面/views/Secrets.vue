<template>
  <div class="secrets-page">
    <!-- 被握把柄 -->
    <section class="card danger-card">
      <div class="card-header">
        <h2><i class="fas fa-hand-fist"></i> 被握把柄</h2>
        <span class="count">{{ Object.keys(暗账.被握把柄).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(暗账.被握把柄).length" class="secret-list">
          <div v-for="(item, key) in 暗账.被握把柄" :key="key" class="secret-item">
            <div class="secret-header">
              <span class="secret-name">{{ key }}</span>
              <span class="risk-tag" :class="riskClass(item.暴露风险)">{{ item.暴露风险 }}</span>
            </div>
            <p class="secret-content masked" :class="{ revealed: revealedSecrets[`被握把柄.${key}`] }">
              {{ item.把柄内容 }}
            </p>
            <button class="reveal-btn" @click="toggleReveal(`被握把柄.${key}`)">
              <i :class="revealedSecrets[`被握把柄.${key}`] ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
            <div class="secret-meta">
              <span class="holder">掌握者: <CharacterName :name="item.掌握者" /></span>
              <span :class="fatalClass(item.致命程度)">{{ item.致命程度 }}</span>
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无被握把柄</p>
      </div>
    </section>

    <!-- 手握把柄 -->
    <section class="card success-card">
      <div class="card-header">
        <h2><i class="fas fa-file-contract"></i> 手握把柄</h2>
        <span class="count">{{ Object.keys(暗账.手握把柄).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(暗账.手握把柄).length" class="secret-list">
          <div v-for="(item, key) in 暗账.手握把柄" :key="key" class="secret-item">
            <div class="secret-header">
              <span class="secret-name">{{ key }}</span>
              <span class="target-tag">目标: <CharacterName :name="item.目标人物" /></span>
            </div>
            <p class="secret-content">{{ item.把柄内容 }}</p>
            <div class="secret-meta">
              <span :class="fatalClass(item.致命程度)">{{ item.致命程度 }}</span>
              <span>{{ item.可用性 }}</span>
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无手握把柄</p>
      </div>
    </section>

    <!-- 政治地雷 -->
    <section class="card warning-card">
      <div class="card-header">
        <h2><i class="fas fa-bomb"></i> 政治地雷</h2>
        <span class="count">{{ Object.keys(暗账.政治地雷).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(暗账.政治地雷).length" class="secret-list">
          <div v-for="(item, key) in 暗账.政治地雷" :key="key" class="secret-item">
            <div class="secret-header">
              <span class="secret-name">{{ key }}</span>
              <span class="type-tag">{{ item.性质 }}</span>
            </div>
            <p class="secret-content">{{ item.内容 }}</p>
            <div class="secret-meta">
              <span>来源: {{ item.来源 }}</span>
              <span>杀伤力: {{ item.杀伤力 }}</span>
            </div>
            <div class="trigger" v-if="item.引爆条件 !== '无'">
              <i class="fas fa-explosion"></i> 引爆条件: {{ item.引爆条件 }}
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无政治地雷</p>
      </div>
    </section>

    <!-- 人情债 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-handshake-angle"></i> 人情债</h2>
        <span class="count">{{ Object.keys(暗账.人情债).length }}</span>
      </div>
      <div class="card-body">
        <div v-if="Object.keys(暗账.人情债).length" class="secret-list">
          <div v-for="(item, key) in 暗账.人情债" :key="key" class="secret-item">
            <div class="secret-header">
              <span class="secret-name">{{ key }}</span>
              <span class="pressure-tag" :class="pressureClass(item.偿还压力)">{{ item.偿还压力 }}</span>
            </div>
            <p class="secret-content">{{ item.欠债内容 }}</p>
            <div class="secret-meta">
              <span class="creditor">债主: <CharacterName :name="item.债主" /></span>
              <span>性质: {{ item.债务性质 }}</span>
            </div>
          </div>
        </div>
        <p v-else class="empty-hint">暂无人情债</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useGameData } from '../stores/useGameData';
import { CharacterName } from '../components/common';

const gameData = useGameData();
const 暗账 = computed(() => gameData.暗账);

const revealedSecrets = reactive<Record<string, boolean>>({});

function toggleReveal(key: string) {
  revealedSecrets[key] = !revealedSecrets[key];
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
.secrets-page {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  &.danger-card {
    border-color: rgba(255, 107, 107, 0.3);
  }
  &.success-card {
    border-color: rgba(74, 193, 142, 0.3);
  }
  &.warning-card {
    border-color: rgba(224, 195, 108, 0.3);
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

  .danger-card & h2 i {
    color: var(--color-danger);
  }
  .success-card & h2 i {
    color: var(--color-success);
  }
  .warning-card & h2 i {
    color: var(--color-warning);
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

.secret-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.secret-item {
  position: relative;
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.secret-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.secret-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.risk-tag,
.target-tag,
.type-tag,
.pressure-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
}

.risk-tag {
  &.critical {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.high {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.pressure-tag {
  &.urgent {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.high {
    background: rgba(224, 195, 108, 0.2);
    color: var(--color-warning);
  }
}

.secret-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);

  &.masked:not(.revealed) {
    filter: blur(6px);
    user-select: none;
  }
}

.reveal-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 12px;

  &:hover {
    color: var(--color-text-primary);
  }
}

.secret-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-muted);

  .fatal {
    color: var(--color-danger);
  }
  .serious {
    color: var(--color-warning);
  }
}

.trigger {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(224, 195, 108, 0.1);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-warning);

  i {
    margin-right: 6px;
  }
}

.empty-hint {
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
}
</style>

