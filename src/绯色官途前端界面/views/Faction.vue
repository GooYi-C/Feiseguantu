<template>
  <div class="faction-page">
    <!-- 我方派系 -->
    <section class="card our-faction">
      <div class="card-header">
        <h2><i class="fas fa-flag"></i> 我方派系</h2>
      </div>
      <div class="card-body">
        <h3 class="faction-name">{{ 我方派系.派系名称 }}</h3>
        <div class="faction-info">
          <div class="info-item">
            <span class="label">核心人物</span>
            <span class="value gold"><CharacterName :name="我方派系.核心人物" /></span>
          </div>
          <div class="info-item">
            <span class="label">势力范围</span>
            <span class="value">{{ 我方派系.势力范围 }}</span>
          </div>
          <div class="info-item">
            <span class="label">实力评估</span>
            <span class="value" :class="strengthClass(我方派系.实力评估)">{{ 我方派系.实力评估 }}</span>
          </div>
        </div>
        <div class="faction-trend" v-if="我方派系.近期动向 !== '无'">
          <i class="fas fa-chart-line"></i>
          <span>{{ 我方派系.近期动向 }}</span>
        </div>
      </div>
    </section>

    <!-- 主要派系列表 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-sitemap"></i> 主要派系</h2>
      </div>
      <div class="card-body">
        <div class="faction-list" v-if="Object.keys(主要派系).length">
          <div v-for="(faction, name) in 主要派系" :key="name" class="faction-item">
            <div class="faction-header">
              <span class="faction-title">{{ faction.派系名称 || name }}</span>
              <span class="relation-tag" :class="relationClass(faction.与我派系关系)">
                {{ faction.与我派系关系 }}
              </span>
            </div>
            <div class="faction-meta">
              <span class="core-leader"><i class="fas fa-user-tie"></i> <CharacterName :name="faction.核心人物" /></span>
              <span :class="strengthClass(faction.实力评估)">{{ faction.实力评估 }}</span>
            </div>
            <div class="faction-scope" v-if="faction.势力范围 !== '无'">
              <i class="fas fa-map"></i> {{ faction.势力范围 }}
            </div>
            <div class="faction-trend" v-if="faction.近期动向 !== '无'">
              <i class="fas fa-clock"></i> {{ faction.近期动向 }}
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-sitemap"></i>
          <p>暂无派系数据</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameData } from '../stores/useGameData';
import { CharacterName } from '../components/common';

const gameData = useGameData();
const 派系图谱 = computed(() => gameData.派系图谱);
const 我方派系 = computed(() => 派系图谱.value.我方派系);
const 主要派系 = computed(() => 派系图谱.value.主要派系);

function strengthClass(strength: string) {
  if (strength === '如日中天') return 'high';
  if (strength === '稳健运转') return 'mid';
  if (['略显颓势', '风雨飘摇'].includes(strength)) return 'low';
  return '';
}

function relationClass(relation: string) {
  if (['坚定盟友', '利益同盟'].includes(relation)) return 'ally';
  if (['公开对立', '暗中较劲'].includes(relation)) return 'enemy';
  if (['表面中立', '若即若离', '井水不犯'].includes(relation)) return 'neutral';
  return '';
}
</script>

<style lang="scss" scoped>
.faction-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
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

.our-faction {
  border-color: var(--color-gold);
  background: linear-gradient(135deg, rgba(216, 166, 87, 0.05) 0%, var(--color-bg-card) 100%);
}

.faction-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gold);
  margin-bottom: var(--spacing-md);
}

.faction-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
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
    font-size: 14px;
    color: var(--color-text-secondary);

    &.gold {
      color: var(--color-gold);
      font-weight: 600;
    }
    &.high {
      color: var(--color-success);
    }
    &.mid {
      color: var(--color-info);
    }
    &.low {
      color: var(--color-warning);
    }
  }
}

.faction-trend {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);

  i {
    color: var(--color-gold);
    margin-top: 2px;
  }
}

.faction-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.faction-item {
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.faction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.faction-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.relation-tag {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  color: var(--color-text-muted);

  &.ally {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }
  &.enemy {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }
  &.neutral {
    background: rgba(122, 162, 247, 0.15);
    color: var(--color-info);
  }
}

.faction-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);

  i {
    color: var(--color-text-muted);
    margin-right: 4px;
  }

  .high {
    color: var(--color-success);
  }
  .mid {
    color: var(--color-info);
  }
  .low {
    color: var(--color-warning);
  }
}

.faction-scope,
.faction-item .faction-trend {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);

  i {
    margin-right: 6px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);

  i {
    font-size: 48px;
  }
}
</style>

