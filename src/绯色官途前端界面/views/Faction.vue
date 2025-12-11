<template>
  <div class="faction-page">
    <!-- 紧凑单页布局：我方派系 + 主要派系 -->
    <div class="faction-layout">
      <!-- 左侧：我方派系 -->
      <section class="our-faction-section">
        <div class="section-header">
          <h2><i class="fas fa-flag"></i> 我方派系</h2>
        </div>
        <div class="our-faction-card">
          <div class="faction-badge">
            <i class="fas fa-flag"></i>
          </div>
          <h3 class="faction-name">{{ 我方派系.派系名称 }}</h3>
          <div class="faction-core">
            <span class="label">核心人物</span>
            <CharacterName :name="我方派系.核心人物" class="core-char" />
          </div>
          <div class="faction-stats">
            <div class="stat">
              <span class="stat-label">实力评估</span>
              <span class="stat-value" :class="strengthClass(我方派系.实力评估)">{{ 我方派系.实力评估 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">势力范围</span>
              <span class="stat-value">{{ 我方派系.势力范围 }}</span>
            </div>
          </div>
          <div v-if="我方派系.近期动向 !== '无'" class="faction-trend">
            <i class="fas fa-chart-line"></i>
            <span>{{ 我方派系.近期动向 }}</span>
          </div>
        </div>
      </section>

      <!-- 右侧：主要派系网格 -->
      <section class="major-factions">
        <div class="section-header">
          <h2><i class="fas fa-sitemap"></i> 主要派系</h2>
        </div>
        <div class="factions-grid" v-if="Object.keys(主要派系).length">
          <div
            v-for="(faction, name) in 主要派系"
            :key="name"
            class="faction-card"
            :class="relationStyleClass(faction.与我派系关系)"
          >
            <div class="card-header">
              <span class="card-title">{{ faction.派系名称 || name }}</span>
              <span class="relation-tag" :class="relationClass(faction.与我派系关系)">
                {{ faction.与我派系关系 }}
              </span>
            </div>
            <div class="card-body">
              <div class="card-leader">
                <i class="fas fa-user-tie"></i>
                <CharacterName :name="faction.核心人物" />
                <span class="strength" :class="strengthClass(faction.实力评估)">{{ faction.实力评估 }}</span>
              </div>
              <div v-if="faction.势力范围 !== '无'" class="card-scope">
                <i class="fas fa-map"></i> {{ faction.势力范围 }}
              </div>
              <div v-if="faction.近期动向 !== '无'" class="card-trend">
                <i class="fas fa-clock"></i> {{ faction.近期动向 }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-sitemap"></i>
          <p>暂无派系数据</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CharacterName } from '../components/common';
import { useGameData } from '../stores/useGameData';

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

function relationStyleClass(relation: string) {
  if (['坚定盟友', '利益同盟'].includes(relation)) return 'ally-border';
  if (['公开对立', '暗中较劲'].includes(relation)) return 'enemy-border';
  return '';
}
</script>

<style lang="scss" scoped>
.faction-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

// ═══ 紧凑单页布局 ═══
.faction-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--spacing-md);
  height: 100%;
  min-height: 0;
}

// ═══ 左侧：我方派系区域 ═══
.our-faction-section {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;

  > .section-header {
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;

    h2 {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 14px;
      font-weight: 600;
      color: var(--color-gold);

      i {
        color: var(--color-gold);
      }
    }
  }
}

.our-faction-card {
  background: linear-gradient(135deg, rgba(216, 166, 87, 0.08) 0%, transparent 100%);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  position: relative;
  overflow: hidden;
  flex: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle at top right, rgba(216, 166, 87, 0.1), transparent);
    pointer-events: none;
  }
}

.faction-badge {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-gold), #e0c36c);
  border-radius: var(--radius-md);
  color: var(--color-bg-dark);
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(216, 166, 87, 0.3);
}

.faction-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gold);
  margin: 0;
}

.faction-core {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 10px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .core-char {
    font-size: 14px !important;
    padding: var(--spacing-xs) var(--spacing-sm) !important;
  }
}

.faction-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);

  .stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .stat-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);

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

.our-faction-card .faction-trend {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(216, 166, 87, 0.08);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;

  i {
    color: var(--color-gold);
    margin-top: 2px;
    flex-shrink: 0;
  }
}

// ═══ 右侧：主要派系 ═══
.major-factions {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;

  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      color: var(--color-gold);
    }
  }
}

// 派系网格
.factions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  overflow-y: auto;
  flex: 1;
}

.faction-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-border);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    background: rgba(255, 255, 255, 0.03);
  }

  &.ally-border {
    border-left-color: var(--color-success);
    &:hover {
      box-shadow: 0 6px 16px rgba(74, 193, 142, 0.15);
    }
  }
  &.enemy-border {
    border-left-color: var(--color-danger);
    &:hover {
      box-shadow: 0 6px 16px rgba(255, 107, 107, 0.15);
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.relation-tag {
  padding: 2px 8px;
  font-size: 10px;
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

.card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-leader {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-secondary);

  i {
    color: var(--color-text-muted);
    font-size: 11px;
  }

  .strength {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;

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

.card-scope,
.card-trend {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: flex-start;
  gap: 6px;

  i {
    margin-top: 2px;
    font-size: 10px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
  flex: 1;

  i {
    font-size: 36px;
    opacity: 0.5;
  }

  p {
    font-size: 13px;
  }
}
</style>
