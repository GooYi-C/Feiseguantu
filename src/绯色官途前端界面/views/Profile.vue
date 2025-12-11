<template>
  <div class="profile-page">
    <!-- 第一行：基本信息 + 现任职务 + 晋升状态（紧凑高度） -->
    <div class="row-1">
      <!-- 基础信息卡 -->
      <section class="card profile-card">
        <div class="card-header compact">
          <h2><i class="fas fa-id-card"></i> 基本信息</h2>
        </div>
        <div class="card-body compact">
          <div class="info-row-inline">
            <div class="info-item inline">
              <span class="label">姓名</span>
              <span class="value highlight">{{ 基本信息.姓名 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">性别</span>
              <span class="value">{{ 基本信息.性别 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">年龄</span>
              <span class="value">{{ 基本信息.年龄 }}岁</span>
            </div>
            <div class="info-item inline">
              <span class="label">民族</span>
              <span class="value">{{ 基本信息.民族 }}</span>
            </div>
          </div>
          <div class="info-row-inline">
            <div class="info-item inline">
              <span class="label">籍贯</span>
              <span class="value">{{ 基本信息.籍贯 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">学历</span>
              <span class="value">{{ 基本信息.学历 }}</span>
            </div>
            <div class="info-item inline wide">
              <span class="label">毕业院校</span>
              <span class="value">{{ 基本信息.毕业院校 }}</span>
            </div>
          </div>
          <div class="info-row-inline">
            <div class="info-item inline">
              <span class="label">入党时间</span>
              <span class="value">{{ 基本信息.入党时间 }}</span>
            </div>
            <div v-if="基本信息.参加工作时间 && 基本信息.参加工作时间 !== '无'" class="info-item inline">
              <span class="label">参加工作</span>
              <span class="value">{{ 基本信息.参加工作时间 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 现任职务 -->
      <section class="card position-card" :class="{ expanded: showPositionDetails }">
        <div class="card-header compact clickable" @click="showPositionDetails = !showPositionDetails">
          <h2><i class="fas fa-briefcase"></i> 现任职务</h2>
          <i class="fas fa-chevron-down expand-indicator" :class="{ rotated: showPositionDetails }"></i>
        </div>
        <div class="card-body compact">
          <div class="position-main compact">
            <span class="position-title">{{ 现任职务.职务名称 }}</span>
            <span class="position-unit">{{ 现任职务.任职单位 }}</span>
          </div>
          <div class="info-row-inline">
            <div class="info-item inline">
              <span class="label">级别</span>
              <span class="value gold">{{ 现任职务.级别 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">体系</span>
              <span class="value">{{ 现任职务.体系 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">任职时间</span>
              <span class="value">{{ 现任职务.任职时间 }}</span>
            </div>
            <div class="info-item inline">
              <span class="label">编制类型</span>
              <span class="value">{{ 现任职务.编制类型 }}</span>
            </div>
          </div>
          <!-- 展开的详细信息 -->
          <Transition name="expand">
            <div v-if="showPositionDetails" class="position-details">
              <div v-if="现任职务.任期预期 && 现任职务.任期预期 !== '无'" class="detail-row">
                <span class="label">任期预期</span>
                <span class="value">{{ 现任职务.任期预期 }}</span>
              </div>
              <div v-if="现任职务.前任情况 && 现任职务.前任情况 !== '无'" class="detail-row">
                <span class="label">前任情况</span>
                <span class="value">{{ 现任职务.前任情况 }}</span>
              </div>
              <div v-if="现任职务.前任遗留 && 现任职务.前任遗留 !== '无'" class="detail-row">
                <span class="label">前任遗留</span>
                <span class="value">{{ 现任职务.前任遗留 }}</span>
              </div>
              <!-- 兼任职务 -->
              <div v-if="兼任职务列表.length > 0" class="detail-section">
                <span class="section-title"><i class="fas fa-user-plus"></i> 兼任职务</span>
                <div class="tag-list">
                  <span v-for="(item, key) in 兼任职务列表" :key="key" class="detail-tag">
                    {{ item.职务名称 || key }}
                  </span>
                </div>
              </div>
              <!-- 分管领域 -->
              <div v-if="分管领域列表.length > 0" class="detail-section">
                <span class="section-title"><i class="fas fa-sitemap"></i> 分管领域</span>
                <div class="tag-list">
                  <span v-for="(item, key) in 分管领域列表" :key="key" class="detail-tag">
                    {{ item.领域名称 || key }}
                  </span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 晋升状态 -->
      <section class="card promotion-card">
        <div class="card-header compact">
          <h2><i class="fas fa-chart-line"></i> 晋升状态</h2>
        </div>
        <div class="card-body compact">
          <div class="promotion-status compact" :class="{ frozen: 晋升状态.是否冻结 }">
            <div class="status-icon">
              <i :class="晋升状态.是否冻结 ? 'fas fa-ban' : 'fas fa-rocket'"></i>
            </div>
            <div class="status-info">
              <span class="status-label">{{ 晋升状态.是否冻结 ? '晋升冻结' : '正常晋升' }}</span>
              <span v-if="晋升状态.下一目标 !== '无'" class="next-target"> 目标: {{ 晋升状态.下一目标 }} </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 第二行：左侧雷达图（大） + 右侧 2x2 网格 -->
    <div class="row-2">
      <!-- 左侧：能力值雷达图（大尺寸） -->
      <section class="card ability-card">
        <div class="card-header">
          <h2><i class="fas fa-chart-radar"></i> 能力评估</h2>
        </div>
        <div class="card-body ability-body">
          <AbilityRadar :data="能力评估" :size="280" />
        </div>
      </section>

      <!-- 右侧：2x2 网格 -->
      <div class="right-grid">
        <!-- 政治生态 -->
        <section class="card politics-card">
          <div class="card-header compact">
            <h2><i class="fas fa-landmark"></i> 政治生态</h2>
          </div>
          <div class="card-body compact scrollable">
            <div class="politics-list compact">
              <div class="politics-item">
                <span class="label">派系归属</span>
                <span class="value">{{ 政治生态.派系归属 }}</span>
              </div>
              <div class="politics-item">
                <span class="label">政治立场</span>
                <span class="value">{{ 政治生态.政治立场 }}</span>
              </div>
              <div class="politics-item">
                <span class="label">官声</span>
                <span class="value">{{ 政治生态.官声 }}</span>
              </div>
              <div class="politics-item">
                <span class="label">群众基础</span>
                <span class="value">{{ 政治生态.群众基础 }}</span>
              </div>
              <div class="politics-item">
                <span class="label">年度考核</span>
                <span class="value">{{ 政治生态.年度考核 }}</span>
              </div>
              <div class="politics-item">
                <span class="label">班子内站位</span>
                <span class="value">{{ 政治生态.班子内站位 }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 奖惩记录 -->
        <section class="card records-card">
          <div class="card-header compact">
            <h2><i class="fas fa-award"></i> 奖惩记录</h2>
          </div>
          <div class="card-body compact scrollable records-body">
            <!-- 表彰记录 -->
            <div v-if="Object.keys(表彰记录).length" class="record-section awards">
              <div class="section-label"><i class="fas fa-medal"></i> 表彰</div>
              <div v-for="(item, key) in 表彰记录" :key="key" class="record-item award">
                <span class="record-name">{{ item.名称 || key }}</span>
                <span class="record-meta">{{ item.授予单位 }} · {{ item.时间 }}</span>
              </div>
            </div>
            <!-- 处分记录 -->
            <div v-if="Object.keys(处分记录).length" class="record-section punishments">
              <div class="section-label"><i class="fas fa-gavel"></i> 处分</div>
              <div v-for="(item, key) in 处分记录" :key="key" class="record-item punishment">
                <span class="record-name">{{ item.处分类型 || key }}</span>
                <span class="record-meta">{{ item.处分原因 }} · {{ item.处分时间 }}</span>
              </div>
            </div>
            <div v-if="!Object.keys(表彰记录).length && !Object.keys(处分记录).length" class="empty-hint">
              暂无奖惩记录
            </div>
          </div>
        </section>

        <!-- 在手项目 -->
        <section class="card projects-card">
          <div class="card-header compact">
            <h2><i class="fas fa-tasks"></i> 在手项目</h2>
            <span class="count-badge">{{ Object.keys(在手项目).length }}</span>
          </div>
          <div class="card-body compact scrollable projects-body">
            <div v-if="Object.keys(在手项目).length" class="projects-list">
              <div
                v-for="(project, key) in 在手项目"
                :key="key"
                class="project-item compact"
                :class="[riskClass(project.风险等级), { expanded: expandedProjects.has(key as string) }]"
                @click="toggleProject(key as string)"
              >
                <div class="project-header">
                  <div class="project-title-row">
                    <i class="fas fa-chevron-right expand-icon"></i>
                    <span class="project-name">{{ project.项目名称 || key }}</span>
                  </div>
                  <span class="project-status" :class="statusClass(project.进展状态)">{{ project.进展状态 }}</span>
                </div>
                <!-- 展开的详情 -->
                <Transition name="expand">
                  <div v-if="expandedProjects.has(key as string)" class="project-details">
                    <div class="project-meta-inline">
                      <span><i class="fas fa-user-tag"></i> {{ project.角色定位 }}</span>
                      <span><i class="fas fa-trophy"></i> {{ project.政治效益 }}</span>
                      <span v-if="project.预计完成 !== '无'"
                        ><i class="far fa-calendar"></i> {{ project.预计完成 }}</span
                      >
                    </div>
                    <div v-if="project.关联人物?.length" class="project-chars">
                      <span class="chars-label">关联:</span>
                      <CharacterName v-for="char in project.关联人物" :key="char" :name="char" />
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            <div v-else class="empty-hint">暂无在手项目</div>
          </div>
        </section>

        <!-- 任职履历 -->
        <section class="card timeline-card">
          <div class="card-header compact">
            <h2><i class="fas fa-timeline"></i> 任职履历</h2>
          </div>
          <div class="card-body compact scrollable timeline-body">
            <div v-if="Object.keys(任职履历).length" class="timeline compact">
              <div
                v-for="(item, key) in 任职履历"
                :key="key"
                class="timeline-item"
                :class="{ expanded: expandedTimeline.has(key as string) }"
                @click="toggleTimeline(key as string)"
              >
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div class="timeline-title-row">
                      <i class="fas fa-chevron-right expand-icon"></i>
                      <span class="timeline-title">{{ item.职务名称 }}</span>
                      <span class="level-badge">{{ item.级别 }}</span>
                    </div>
                    <span class="timeline-period">{{ item.起始年月 }} - {{ item.结束年月 || '至今' }}</span>
                  </div>
                  <!-- 展开的详情 -->
                  <Transition name="expand">
                    <div v-if="expandedTimeline.has(key as string)" class="timeline-details">
                      <div class="timeline-meta">
                        <span><i class="fas fa-building"></i> {{ item.单位 }}</span>
                      </div>
                      <p v-if="item.主要政绩 !== '无'" class="timeline-desc">{{ item.主要政绩 }}</p>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
            <div v-else class="empty-hint">暂无任职履历</div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CharacterName } from '../components/common';
import { AbilityRadar } from '../components/profile';
import { useGameData } from '../stores/useGameData';

const gameData = useGameData();
const 个人档案 = computed(() => gameData.个人档案);
const 基本信息 = computed(() => 个人档案.value.基本信息);
const 现任职务 = computed(() => 个人档案.value.现任职务);
const 能力评估 = computed(() => 个人档案.value.能力评估);
const 政治生态 = computed(() => 个人档案.value.政治生态);
const 任职履历 = computed(() => 个人档案.value.任职履历);
const 晋升状态 = computed(() => 个人档案.value.晋升状态);
const 在手项目 = computed(() => 个人档案.value.在手项目);
const 表彰记录 = computed(() => 个人档案.value.表彰记录);
const 处分记录 = computed(() => 个人档案.value.处分记录);

// 兼任职务和分管领域列表
const 兼任职务列表 = computed(() => {
  const raw = 现任职务.value.兼任职务;
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).map(([key, value]) => ({ key, ...(value as object) }));
});

const 分管领域列表 = computed(() => {
  const raw = 现任职务.value.分管领域;
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).map(([key, value]) => ({ key, ...(value as object) }));
});

// 展开状态
const showPositionDetails = ref(false);
const expandedProjects = ref<Set<string>>(new Set());
const expandedTimeline = ref<Set<string>>(new Set());

function toggleProject(key: string) {
  if (expandedProjects.value.has(key)) {
    expandedProjects.value.delete(key);
  } else {
    expandedProjects.value.add(key);
  }
}

function toggleTimeline(key: string) {
  if (expandedTimeline.value.has(key)) {
    expandedTimeline.value.delete(key);
  } else {
    expandedTimeline.value.add(key);
  }
}

function riskClass(risk: string) {
  if (['极高', '高'].includes(risk)) return 'high-risk';
  if (['中等', '中'].includes(risk)) return 'mid-risk';
  return '';
}

function statusClass(status: string) {
  if (['顺利推进', '进展良好', '已完成'].includes(status)) return 'good';
  if (['遇阻', '停滞', '困难'].includes(status)) return 'bad';
  return '';
}
</script>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  height: 100%;
  min-height: 0;
}

// ═══ 行布局 ═══
.row-1 {
  display: grid;
  grid-template-columns: 1.2fr 1fr 200px;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.row-2 {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-sm);
  flex: 1;
  min-height: 0;
}

// 右侧 2x2 网格
.right-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: var(--spacing-sm);
  min-height: 0;
}

// ═══ 通用卡片 ═══
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.card-header {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.compact {
    padding: 6px var(--spacing-sm);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;

    i {
      color: var(--color-gold);
      font-size: 11px;
    }
  }

  .count-badge {
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-full);
    color: var(--color-text-muted);
  }
}

.card-body {
  padding: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &.compact {
    padding: var(--spacing-sm);
  }

  &.scrollable {
    overflow-y: auto;
  }
}

// ═══ 内联信息行（紧凑模式） ═══
.info-row-inline {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-md);
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 1px;

  &.inline {
    flex-direction: row;
    align-items: baseline;
    gap: 6px;

    &.wide {
      flex: 1;
      min-width: 150px;
    }
  }

  .label {
    font-size: 10px;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .value {
    font-size: 12px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.gold {
      color: var(--color-gold);
      font-weight: 600;
    }

    &.highlight {
      color: var(--color-text-primary);
      font-weight: 600;
    }
  }
}

// ═══ 现任职务 ═══
.position-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);

  &.compact {
    margin-bottom: 4px;
    padding-bottom: 4px;
  }

  .position-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  .position-unit {
    font-size: 10px;
    color: var(--color-text-secondary);
  }
}

// 现任职务展开详情
.position-details {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px dashed var(--color-border);

  .detail-row {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: 10px;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .value {
      font-size: 11px;
      color: var(--color-text-secondary);
    }
  }

  .detail-section {
    margin-top: var(--spacing-xs);

    .section-title {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--color-text-muted);
      margin-bottom: 4px;

      i {
        color: var(--color-gold);
        font-size: 9px;
      }
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .detail-tag {
        padding: 2px 6px;
        font-size: 10px;
        background: var(--color-bg-elevated);
        color: var(--color-text-secondary);
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-border);
      }
    }
  }
}

// 展开指示器
.expand-indicator {
  font-size: 10px;
  color: var(--color-text-muted);
  transition: transform 0.2s ease;

  &.rotated {
    transform: rotate(180deg);
  }
}

.card-header.clickable {
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-bg-elevated);
  }
}

// ═══ 晋升状态 ═══
.promotion-card {
  .promotion-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs);
    background: rgba(74, 193, 142, 0.1);
    border-radius: var(--radius-sm);

    &.compact {
      padding: 6px;
    }

    &.frozen {
      background: rgba(255, 107, 107, 0.1);

      .status-icon {
        background: rgba(255, 107, 107, 0.2);
        color: var(--color-danger);
      }

      .status-label {
        color: var(--color-danger);
      }
    }

    .status-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(74, 193, 142, 0.2);
      border-radius: var(--radius-sm);
      color: var(--color-success);
      font-size: 14px;
    }

    .status-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .status-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-success);
    }

    .next-target {
      font-size: 10px;
      color: var(--color-text-muted);
    }
  }
}

// ═══ 能力评估（大尺寸雷达图） ═══
.ability-card {
  .ability-body {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-sm);
    height: 100%;
  }

  :deep(.ability-radar) {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .radar-svg {
      width: 100%;
      max-width: none;
      flex: 1;
    }

    .label {
      font-size: 11px;
    }

    .radar-legend {
      gap: 8px;
      margin-top: var(--spacing-xs);

      .legend-item {
        font-size: 11px;
        padding: 2px 8px;
      }
    }
  }
}

// ═══ 政治生态 ═══
.politics-card {
  .politics-list {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.compact {
      gap: 3px;
    }
  }

  .politics-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast);

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .label {
      font-size: 10px;
      color: var(--color-text-muted);
    }

    .value {
      font-size: 11px;
      color: var(--color-text-secondary);
      font-weight: 500;
      text-align: right;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// ═══ 奖惩记录 ═══
.records-card {
  .records-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .record-section {
    .section-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        font-size: 10px;
      }
    }

    &.awards .section-label {
      color: var(--color-gold);
    }

    &.punishments .section-label {
      color: var(--color-danger);
    }
  }

  .record-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 6px 8px;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    margin-bottom: 4px;

    &.award {
      border-left: 2px solid var(--color-gold);
    }

    &.punishment {
      border-left: 2px solid var(--color-danger);
    }

    .record-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .record-meta {
      font-size: 10px;
      color: var(--color-text-muted);
    }
  }
}

// ═══ 在手项目 ═══
.projects-card {
  .projects-body {
    overflow-y: auto;
  }

  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .project-item {
    padding: 8px 10px;
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    border-left: 2px solid var(--color-border);
    cursor: pointer;
    transition: all var(--transition-fast);

    &.compact {
      padding: 6px 8px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    &.high-risk {
      border-left-color: var(--color-danger);
    }

    &.mid-risk {
      border-left-color: var(--color-warning);
    }

    &.expanded {
      background: rgba(255, 255, 255, 0.03);

      .expand-icon {
        transform: rotate(90deg);
      }
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .project-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .expand-icon {
      font-size: 9px;
      color: var(--color-text-muted);
      transition: transform var(--transition-fast);
    }

    .project-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .project-status {
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 600;
      border-radius: var(--radius-sm);
      background: var(--color-bg-card);
      color: var(--color-text-muted);

      &.good {
        background: rgba(74, 193, 142, 0.15);
        color: var(--color-success);
      }

      &.bad {
        background: rgba(255, 107, 107, 0.15);
        color: var(--color-danger);
      }
    }

    .project-details {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px dashed var(--color-border);
    }

    .project-meta-inline {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 10px;
      color: var(--color-text-muted);
      margin-bottom: 4px;

      i {
        margin-right: 3px;
        color: var(--color-gold);
      }
    }

    .project-chars {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;

      .chars-label {
        font-size: 10px;
        color: var(--color-text-muted);
      }
    }
  }
}

// ═══ 任职履历 ═══
.timeline-card {
  .timeline-body {
    overflow-y: auto;
  }
}

.timeline {
  position: relative;
  padding-left: 16px;

  &::before {
    content: '';
    position: absolute;
    left: 3px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-border);
  }

  &.compact {
    .timeline-item {
      padding-bottom: 8px;
    }
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 10px;
  cursor: pointer;

  &:last-child {
    padding-bottom: 0;
  }

  &.expanded {
    .expand-icon {
      transform: rotate(90deg);
    }
  }
}

.timeline-dot {
  position: absolute;
  left: -14px;
  top: 4px;
  width: 6px;
  height: 6px;
  background: var(--color-gold);
  border-radius: 50%;
}

.timeline-content {
  padding-left: 2px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 6px;
}

.timeline-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.expand-icon {
  font-size: 9px;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.timeline-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-badge {
  padding: 1px 4px;
  background: rgba(216, 166, 87, 0.15);
  color: var(--color-gold);
  border-radius: var(--radius-sm);
  font-size: 9px;
  font-weight: 600;
  flex-shrink: 0;
}

.timeline-period {
  font-size: 9px;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.timeline-details {
  margin-top: 4px;
  padding-top: 4px;
}

.timeline-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 10px;
  color: var(--color-text-secondary);

  i {
    margin-right: 3px;
    color: var(--color-gold);
  }
}

.timeline-desc {
  font-size: 10px;
  color: var(--color-text-muted);
  line-height: 1.3;
  margin: 2px 0 0;
}

// ═══ 空状态 ═══
.empty-hint {
  color: var(--color-text-muted);
  font-size: 12px;
  text-align: center;
  padding: var(--spacing-md);
  font-style: italic;
}

// ═══ 展开动画 ═══
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}

// ═══ 统一 CharacterName 样式（与 Dashboard 一致） ═══
:deep(.character-name) {
  font-size: 11px !important;
  padding: 2px 6px !important;
  margin: 0 1px !important;
  line-height: 1.2 !important;
  white-space: nowrap;

  &.exists {
    background: rgba(100, 100, 100, 0.12) !important;

    &.male {
      background: rgba(74, 144, 217, 0.12) !important;
      color: #5ba0e0 !important;
    }

    &.female {
      background: rgba(232, 67, 147, 0.12) !important;
      color: #e84393 !important;
    }
  }

  &:not(.exists) {
    background: transparent !important;
    padding: 0 !important;
    color: var(--color-text-muted) !important;
  }
}
</style>
