<template>
  <div class="profile-page">
    <!-- 基础信息卡 -->
    <section class="card profile-card">
      <div class="card-header">
        <h2><i class="fas fa-id-card"></i> 基本信息</h2>
      </div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">姓名</span>
            <span class="value">{{ 基本信息.姓名 }}</span>
          </div>
          <div class="info-item">
            <span class="label">性别</span>
            <span class="value">{{ 基本信息.性别 }}</span>
          </div>
          <div class="info-item">
            <span class="label">年龄</span>
            <span class="value">{{ 基本信息.年龄 }}岁</span>
          </div>
          <div class="info-item">
            <span class="label">民族</span>
            <span class="value">{{ 基本信息.民族 }}</span>
          </div>
          <div class="info-item">
            <span class="label">籍贯</span>
            <span class="value">{{ 基本信息.籍贯 }}</span>
          </div>
          <div class="info-item">
            <span class="label">学历</span>
            <span class="value">{{ 基本信息.学历 }}</span>
          </div>
          <div class="info-item">
            <span class="label">毕业院校</span>
            <span class="value">{{ 基本信息.毕业院校 }}</span>
          </div>
          <div class="info-item">
            <span class="label">入党时间</span>
            <span class="value">{{ 基本信息.入党时间 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 现任职务 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-briefcase"></i> 现任职务</h2>
      </div>
      <div class="card-body">
        <div class="position-main">
          <span class="position-title">{{ 现任职务.职务名称 }}</span>
          <span class="position-unit">{{ 现任职务.任职单位 }}</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">级别</span>
            <span class="value gold">{{ 现任职务.级别 }}</span>
          </div>
          <div class="info-item">
            <span class="label">体系</span>
            <span class="value">{{ 现任职务.体系 }}</span>
          </div>
          <div class="info-item">
            <span class="label">任职时间</span>
            <span class="value">{{ 现任职务.任职时间 }}</span>
          </div>
          <div class="info-item">
            <span class="label">编制类型</span>
            <span class="value">{{ 现任职务.编制类型 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 能力值雷达 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-chart-radar"></i> 能力评估</h2>
      </div>
      <div class="card-body">
        <div class="ability-list">
          <div v-for="(value, key) in 能力评估" :key="key" class="ability-item">
            <span class="ability-name">{{ key }}</span>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: value + '%' }" :class="abilityClass(value)"></div>
            </div>
            <span class="ability-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 政治生态 -->
    <section class="card">
      <div class="card-header">
        <h2><i class="fas fa-landmark"></i> 政治生态</h2>
      </div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">派系归属</span>
            <span class="value">{{ 政治生态.派系归属 }}</span>
          </div>
          <div class="info-item">
            <span class="label">政治立场</span>
            <span class="value">{{ 政治生态.政治立场 }}</span>
          </div>
          <div class="info-item">
            <span class="label">官声</span>
            <span class="value">{{ 政治生态.官声 }}</span>
          </div>
          <div class="info-item">
            <span class="label">群众基础</span>
            <span class="value">{{ 政治生态.群众基础 }}</span>
          </div>
          <div class="info-item">
            <span class="label">年度考核</span>
            <span class="value">{{ 政治生态.年度考核 }}</span>
          </div>
          <div class="info-item">
            <span class="label">班子内站位</span>
            <span class="value">{{ 政治生态.班子内站位 }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 任职履历 -->
    <section class="card" v-if="Object.keys(任职履历).length">
      <div class="card-header">
        <h2><i class="fas fa-timeline"></i> 任职履历</h2>
      </div>
      <div class="card-body">
        <div class="timeline">
          <div v-for="(item, key) in 任职履历" :key="key" class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">{{ item.职务名称 }}</span>
                <span class="timeline-period">{{ item.起始年月 }} - {{ item.结束年月 || '至今' }}</span>
              </div>
              <div class="timeline-meta">
                <span>{{ item.单位 }}</span>
                <span>{{ item.级别 }}</span>
              </div>
              <p class="timeline-desc" v-if="item.主要政绩 !== '无'">{{ item.主要政绩 }}</p>
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
const 个人档案 = computed(() => gameData.个人档案);
const 基本信息 = computed(() => 个人档案.value.基本信息);
const 现任职务 = computed(() => 个人档案.value.现任职务);
const 能力评估 = computed(() => 个人档案.value.能力评估);
const 政治生态 = computed(() => 个人档案.value.政治生态);
const 任职履历 = computed(() => 个人档案.value.任职履历);

function abilityClass(val: number) {
  if (val >= 90) return 't0';
  if (val >= 80) return 't1';
  if (val >= 60) return 't2';
  if (val >= 40) return 't3';
  return 't4';
}
</script>

<style lang="scss" scoped>
.profile-page {
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }
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
  }
}

.position-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);

  .position-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .position-unit {
    font-size: 14px;
    color: var(--color-text-secondary);
  }
}

.ability-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ability-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .ability-name {
    width: 80px;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .ability-bar {
    flex: 1;
    height: 10px;
    background: var(--color-bg-elevated);
    border-radius: 5px;
    overflow: hidden;
  }

  .ability-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s;

    &.t0 {
      background: linear-gradient(90deg, #ffd700, #ffec8b);
    }
    &.t1 {
      background: linear-gradient(90deg, var(--color-success), #6dd5a0);
    }
    &.t2 {
      background: linear-gradient(90deg, var(--color-info), #a3c4f7);
    }
    &.t3 {
      background: linear-gradient(90deg, var(--color-warning), #f0d78c);
    }
    &.t4 {
      background: linear-gradient(90deg, var(--color-danger), #ff9999);
    }
  }

  .ability-value {
    width: 30px;
    text-align: right;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.timeline {
  position: relative;
  padding-left: 20px;

  &::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-border);
  }
}

.timeline-item {
  position: relative;
  padding-bottom: var(--spacing-lg);

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -17px;
  top: 4px;
  width: 10px;
  height: 10px;
  background: var(--color-gold);
  border-radius: 50%;
}

.timeline-content {
  padding-left: var(--spacing-md);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timeline-period {
  font-size: 12px;
  color: var(--color-text-muted);
}

.timeline-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.timeline-desc {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>

