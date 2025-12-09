<template>
  <div class="assets-page">
    <!-- 资产概览 -->
    <div class="overview-cards">
      <div class="overview-card">
        <span class="ov-label">申报资产</span>
        <span class="ov-value">{{ formatMoney(个人资产.申报资产) }}</span>
      </div>
      <div class="overview-card">
        <span class="ov-label">实际资产</span>
        <span class="ov-value">{{ formatMoney(个人资产.实际资产) }}</span>
      </div>
      <div class="overview-card danger">
        <span class="ov-label">灰色资产</span>
        <span class="ov-value">{{ formatMoney(个人资产.灰色资产) }}</span>
      </div>
    </div>

    <div class="assets-grid">
      <!-- 房产 -->
      <section class="card">
        <div class="card-header">
          <h2><i class="fas fa-house"></i> 房产</h2>
          <span class="count">{{ Object.keys(个人资产.房产).length }}</span>
        </div>
        <div class="card-body">
          <div v-if="Object.keys(个人资产.房产).length" class="asset-list">
            <div v-for="(item, key) in 个人资产.房产" :key="key" class="asset-item">
              <div class="asset-main">
                <span class="asset-name">{{ item.位置 }}</span>
                <span class="asset-value">{{ formatMoney(item.估值) }}</span>
              </div>
              <div class="asset-meta">
                <span>{{ item.面积 }}</span>
                <span>{{ item.来源 }}</span>
                <span class="registrant">登记人: <CharacterName :name="item.登记人" /></span>
              </div>
            </div>
          </div>
          <p v-else class="empty-hint">暂无房产记录</p>
        </div>
      </section>

      <!-- 座驾 -->
      <section class="card">
        <div class="card-header">
          <h2><i class="fas fa-car"></i> 座驾</h2>
          <span class="count">{{ Object.keys(个人资产.座驾).length }}</span>
        </div>
        <div class="card-body">
          <div v-if="Object.keys(个人资产.座驾).length" class="asset-list">
            <div v-for="(item, key) in 个人资产.座驾" :key="key" class="asset-item">
              <div class="asset-main">
                <span class="asset-name">{{ item.品牌型号 }}</span>
              </div>
              <div class="asset-meta">
                <span>{{ item.来源 }}</span>
              </div>
            </div>
          </div>
          <p v-else class="empty-hint">暂无座驾记录</p>
        </div>
      </section>

      <!-- 白手套 -->
      <section class="card danger-card">
        <div class="card-header">
          <h2><i class="fas fa-mask"></i> 白手套</h2>
          <span class="count">{{ Object.keys(个人资产.白手套).length }}</span>
        </div>
        <div class="card-body">
          <div v-if="Object.keys(个人资产.白手套).length" class="asset-list">
            <div v-for="(item, key) in 个人资产.白手套" :key="key" class="asset-item">
              <div class="asset-main">
                <CharacterName :name="key as string" class="asset-name" />
                <span class="asset-value">{{ formatMoney(item.代持金额) }}</span>
              </div>
              <div class="asset-meta">
                <span>{{ item.代持内容 }}</span>
                <span :class="reliabilityClass(item.可靠程度)">{{ item.可靠程度 }}</span>
              </div>
            </div>
          </div>
          <p v-else class="empty-hint">暂无白手套记录</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from '../stores/useGameData';
import { CharacterName } from '../components/common';

const gameData = useGameData();
const 个人资产 = computed(() => gameData.个人资产);

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
</script>

<style lang="scss" scoped>
.assets-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.overview-card {
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;

  .ov-label {
    display: block;
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xs);
  }

  .ov-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-gold);
    font-family: var(--font-display);
  }

  &.danger {
    border-color: var(--color-danger);

    .ov-value {
      color: var(--color-danger);
    }
  }
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.asset-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.asset-item {
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.asset-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.asset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.asset-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-gold);
}

.asset-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-muted);

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

.empty-hint {
  color: var(--color-text-muted);
  font-style: italic;
  text-align: center;
}
</style>

