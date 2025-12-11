<template>
  <div class="dashboard">
    <!-- 第一行：时空舆情 + 当前场景 -->
    <div class="row-1">
      <!-- 时空舆情卡（可滚动，无纵向间距） -->
      <section class="card time-card">
        <div class="card-header compact">
          <h2><i class="fas fa-globe"></i> 时空舆情</h2>
        </div>
        <div class="card-body compact scrollable">
          <div class="info-list compact">
            <div v-if="时空舆情.重大事件 !== '无'" class="info-row event" title="重大事件">
              <i class="fas fa-bolt"></i>
              <span>{{ 时空舆情.重大事件 }}</span>
            </div>
            <div v-if="时空舆情.中央动态 !== '无'" class="info-row central" title="中央动态">
              <i class="fas fa-landmark"></i>
              <span>{{ 时空舆情.中央动态 }}</span>
            </div>
            <div v-if="时空舆情.省内风向 !== '无'" class="info-row province" title="省内风气">
              <i class="fas fa-building"></i>
              <span>{{ 时空舆情.省内风向 }}</span>
            </div>
            <div v-if="时空舆情.本地新闻 !== '无'" class="info-row local" title="本地新闻">
              <i class="fas fa-newspaper"></i>
              <span>{{ 时空舆情.本地新闻 }}</span>
            </div>
            <div v-if="时空舆情.圈内传闻 !== '无'" class="info-row rumor" title="圈内传闻">
              <i class="fas fa-comment-dots"></i>
              <span>{{ 时空舆情.圈内传闻 }}</span>
            </div>
            <div v-if="时空舆情.个人风评 !== '无'" class="info-row reputation" title="个人风评">
              <i class="fas fa-user-tag"></i>
              <span>{{ 时空舆情.个人风评 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 当前场景（可滚动） -->
      <section v-if="当前场景.场景类型 !== '无'" class="card scene-card">
        <div class="card-header compact">
          <h2><i class="fas fa-map-location-dot"></i> 当前场景</h2>
          <span class="scene-type">{{ 当前场景.场景类型 }}</span>
        </div>
        <div class="card-body compact scrollable">
          <p v-if="当前场景.场景速写 !== '无'" class="scene-desc">{{ 当前场景.场景速写 }}</p>
          <div class="scene-row">
            <span v-if="当前场景.气氛基调 !== '无'" class="mood-badge">
              <i class="fas fa-theater-masks"></i> {{ 当前场景.气氛基调 }}
            </span>
            <div v-if="当前场景.在场人物.length" class="present-chars">
              <CharacterName v-for="char in 当前场景.在场人物" :key="char" :name="char" />
            </div>
          </div>
          <div v-if="当前场景.潜在议题 !== '无'" class="topic-badge">
            <i class="fas fa-lightbulb"></i> {{ 当前场景.潜在议题 }}
          </div>
        </div>
      </section>
    </div>

    <!-- 第二行：统计卡片 + 待办事项 + 关系索引（三栏均分，填满剩余空间） -->
    <div class="row-2">
      <!-- 统计卡片列 -->
      <section class="card stat-card-panel">
        <div class="card-header compact">
          <h2><i class="fas fa-chart-simple"></i> 快捷导航</h2>
        </div>
        <div class="card-body compact stat-body">
          <div class="stat-list">
            <div class="stat-item" @click="$router.push('/characters')">
              <div class="stat-icon"><i class="fas fa-users"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ 人物总数 }}</span>
                <span class="stat-label">人物库</span>
              </div>
            </div>
            <div class="stat-item romance" @click="$router.push('/romance')">
              <div class="stat-icon"><i class="fas fa-heart"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ 绯色对象列表.length }}</span>
                <span class="stat-label">绯色对象</span>
              </div>
            </div>
            <div class="stat-item danger" @click="$router.push('/opportunities')">
              <div class="stat-icon"><i class="fas fa-bomb"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ 危机数量 }}</span>
                <span class="stat-label">潜在危机</span>
              </div>
            </div>
            <div class="stat-item success" @click="$router.push('/opportunities')">
              <div class="stat-icon"><i class="fas fa-star"></i></div>
              <div class="stat-info">
                <span class="stat-value">{{ 机遇数量 }}</span>
                <span class="stat-label">当前机遇</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 待办事项（可交互Todo List，真正删除/恢复变量） -->
      <section class="card todo-card">
        <div class="card-header compact">
          <h2><i class="fas fa-clipboard-list"></i> 待办事项</h2>
          <span class="count-badge">{{ 活跃待办数量 }} / {{ 全部待办数量 }}</span>
        </div>
        <div class="card-body compact todo-body">
          <div class="todo-list">
            <div
              v-for="item in 合并待办列表"
              :key="item.key"
              class="todo-item"
              :class="[urgencyClass(item.todo.紧急程度), { completed: item.isHidden }]"
            >
              <label class="todo-checkbox">
                <input
                  type="checkbox"
                  :checked="item.isHidden"
                  @change="toggleTodo(item.key, item.todo, item.isHidden)"
                />
                <span class="checkmark"></span>
              </label>
              <div class="todo-content">
                <div class="todo-main">
                  <span class="todo-urgency">{{ item.todo.紧急程度 }}</span>
                  <span class="todo-text">{{ item.todo.事项 }}</span>
                </div>
                <div class="todo-meta">
                  <span v-if="item.todo.截止时间 !== '无'" class="deadline">
                    <i class="far fa-clock"></i> {{ item.todo.截止时间 }}
                  </span>
                  <CharacterName v-for="char in item.todo.关联人物.slice(0, 2)" :key="char" :name="char" />
                  <span v-if="item.todo.关联人物.length > 2" class="more-chars"
                    >+{{ item.todo.关联人物.length - 2 }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div v-if="全部待办数量 === 0" class="empty-hint">暂无待办事项</div>
        </div>
      </section>

      <!-- 关系索引 -->
      <section class="card relations-card">
        <div class="card-header compact">
          <h2><i class="fas fa-diagram-project"></i> 关系索引</h2>
          <router-link to="/characters" class="more-link">查看 <i class="fas fa-arrow-right"></i></router-link>
        </div>
        <div class="card-body compact relations-body">
          <div class="relation-row">
            <!-- 动态渲染所有字段 -->
            <template v-for="field in 动态关系字段" :key="field.key">
              <!-- 单值字段 -->
              <div
                v-if="field.isSingle && field.value !== '无'"
                class="relation-chip"
                :class="{ extended: field.isExtended }"
                :style="{ '--field-color': field.color }"
              >
                <span class="rel-label">{{ field.displayName }}</span>
                <CharacterName :name="field.value" />
              </div>

              <!-- 数组字段 -->
              <div
                v-else-if="!field.isSingle && field.value.length"
                class="relation-group"
                :class="{ extended: field.isExtended }"
                :style="{ '--field-color': field.color }"
              >
                <span class="group-label">{{ field.displayName }}</span>
                <div class="group-tags">
                  <CharacterName v-for="name in field.value" :key="name" :name="name" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CharacterName } from '../components/common';
import { useTodoList } from '../composables/useTodoList';
import { useGameData } from '../stores/useGameData';

// 待办事项类型定义
interface 待办事项类型 {
  事项: string;
  紧急程度: string;
  截止时间: string;
  关联人物: string[];
}

const gameData = useGameData();

const 时空舆情 = computed(() => gameData.时空舆情);
const 当前场景 = computed(() => gameData.当前场景);
const 关系索引 = computed(() => gameData.关系索引);
const 人物总数 = computed(() => gameData.人物总数);
const 绯色对象列表 = computed(() => gameData.绯色对象列表);
const 危机数量 = computed(() => gameData.危机数量);
const 机遇数量 = computed(() => gameData.机遇数量);

// ═══ 动态关系字段处理 ═══

/**
 * 高对比度颜色池 - 基于HSL色彩模型设计
 *
 * 设计原则：
 * - 色相差异至少60度，确保视觉区分度
 * - 明度保持在45-60%，适配深色背景
 * - 饱和度保持65-80%，平衡鲜艳度与可读性
 * - 参考Material Design和Tailwind CSS配色标准
 * - 考虑色盲用户的识别需求
 *
 * 颜色分组：
 * - 层级类（金、紫）：表示权力关系
 * - 情感类（红、粉、橙粉）：表示情感关系
 * - 技术类（蓝、青、绿）：表示业务关系
 * - 中性类（橙、黄绿、靛蓝）：表示其他关系
 */
const FIELD_COLORS = [
  // 第1组：层级与权力（暖色调）
  '#f59e0b', // 1. 琥珀金 (HSL: 38°, 92%, 50%) - 明亮的金色，适合"一把手"等高层级
  '#a855f7', // 2. 紫罗兰 (HSL: 270°, 91%, 65%) - 高贵紫色，适合"直接上级"等

  // 第2组：情感关系（红粉橙色系）
  '#ef4444', // 3. 鲜红色 (HSL: 0°, 84%, 60%) - 强烈的红色，适合"政治宿敌"
  '#ec4899', // 4. 玫瑰粉 (HSL: 330°, 81%, 60%) - 浪漫粉色，适合"配偶"
  '#ff6b9d', // 5. 珊瑚粉 (HSL: 345°, 100%, 71%) - 明亮的橙粉色，适合"绯色对象"（与红色差异大）

  // 第3组：技术与业务（冷色调）
  '#3b82f6', // 6. 宝石蓝 (HSL: 217°, 91%, 60%) - 经典蓝色，适合"竞争对手"
  '#06b6d4', // 7. 青绿色 (HSL: 188°, 95%, 42%) - 清新青色，适合"靠山"
  '#10b981', // 8. 翡翠绿 (HSL: 158°, 84%, 39%) - 生机绿色，适合"核心嫡系"

  // 第4组：中性与特殊（混合色调）
  '#f97316', // 9. 活力橙 (HSL: 25°, 95%, 53%) - 明亮橙色，与金色区分明显
  '#84cc16', // 10. 黄绿色 (HSL: 84°, 81%, 44%) - 独特的黄绿，与其他颜色差异大
  '#6366f1', // 11. 靛蓝色 (HSL: 239°, 84%, 67%) - 深邃靛蓝，与紫色和蓝色都有区别
  '#14b8a6', // 12. 青碧色 (HSL: 173°, 80%, 40%) - 独特的青色，与绿色和蓝色都不同

  // 第13+组：使用前12个颜色的变体（降低饱和度或调整明度）
  '#d97706', // 13. 深琥珀 - 第1色的深色版本
  '#9333ea', // 14. 深紫罗兰 - 第2色的深色版本
  '#dc2626', // 15. 深红色 - 第3色的深色版本
];

/**
 * 常用字段的固定颜色映射
 * 确保常用字段的颜色稳定，提升用户体验
 *
 * 注意：绯色对象使用珊瑚粉(#ff6b9d)，与政治宿敌的鲜红色(#ef4444)形成明显对比
 */
const FIXED_FIELD_COLORS: Record<string, number> = {
  一把手: 0, // 琥珀金 - 最高权力
  直接上级: 1, // 紫罗兰 - 直接领导
  配偶: 3, // 玫瑰粉 - 情感关系
  政治宿敌列表: 2, // 鲜红色 - 敌对关系
  绯色对象列表: 4, // 珊瑚粉 - 浪漫关系（与红色差异大）
  竞争对手列表: 5, // 宝石蓝 - 竞争关系
  靠山列表: 6, // 青绿色 - 支持关系
  核心嫡系列表: 7, // 翡翠绿 - 核心团队
};

// 处理字段名：移除末尾的"列表"、"集合"等后缀
function processFieldName(fieldName: string): string {
  return fieldName.replace(/(列表|集合|清单|名单|组|队|群)$/g, '');
}

// 动态获取所有关系字段
const 动态关系字段 = computed(() => {
  const fields: Array<{
    key: string;
    displayName: string;
    value: any;
    isSingle: boolean;
    color: string;
    isExtended: boolean; // 是否为第13个及以后的字段
  }> = [];

  const relationData = 关系索引.value;
  if (!relationData || typeof relationData !== 'object') {
    return fields;
  }

  // 已使用的颜色索引集合
  const usedColorIndices = new Set<number>();

  // 第一遍：为固定字段分配颜色
  const fixedFields: Array<[string, any]> = [];
  const dynamicFields: Array<[string, any]> = [];

  for (const [key, value] of Object.entries(relationData)) {
    if (value === null || value === undefined) continue;

    if (key in FIXED_FIELD_COLORS) {
      fixedFields.push([key, value]);
      usedColorIndices.add(FIXED_FIELD_COLORS[key]);
    } else {
      dynamicFields.push([key, value]);
    }
  }

  // 处理固定字段
  for (const [key, value] of fixedFields) {
    const isSingle = typeof value === 'string';
    const displayName = processFieldName(key);
    const colorIndex = FIXED_FIELD_COLORS[key];
    const color = FIELD_COLORS[colorIndex];

    fields.push({
      key,
      displayName,
      value,
      isSingle,
      color,
      isExtended: false,
    });
  }

  // 处理动态字段：使用未被占用的颜色
  let availableColorIndex = 0;
  for (const [key, value] of dynamicFields) {
    // 找到下一个未被使用的颜色索引
    while (usedColorIndices.has(availableColorIndex) && availableColorIndex < 12) {
      availableColorIndex++;
    }

    const isSingle = typeof value === 'string';
    const displayName = processFieldName(key);
    const colorIndex = availableColorIndex % FIELD_COLORS.length;
    const color = FIELD_COLORS[colorIndex];
    const isExtended = availableColorIndex >= 12;

    fields.push({
      key,
      displayName,
      value,
      isSingle,
      color,
      isExtended,
    });

    usedColorIndices.add(availableColorIndex);
    availableColorIndex++;
  }

  return fields;
});

// ═══ 待办事项逻辑（使用公共 composable） ═══
const todoList = useTodoList<待办事项类型>({
  getActiveItems: () => gameData.机遇与危机.待办事项,
  deleteActiveItem: key => {
    delete gameData.rawData.机遇与危机.待办事项[key];
  },
  restoreActiveItem: (key, data) => {
    gameData.rawData.机遇与危机.待办事项[key] = data;
  },
  saveToBackend: () => gameData.saveSection('机遇与危机'),
  // 按紧急程度排序，但保持相同紧急程度内的原始顺序
  sortFn: (a, b) => {
    const order: Record<string, number> = { 火烧眉毛: 0, 尽快处理: 1, 正常推进: 2, 可以缓缓: 3 };
    const orderA = order[a.data.紧急程度] ?? 99;
    const orderB = order[b.data.紧急程度] ?? 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.sortIndex - b.sortIndex;
  },
});

// 活跃待办数量
const 活跃待办数量 = computed(() => todoList.activeCount.value);

// 全部待办数量
const 全部待办数量 = computed(() => todoList.totalCount.value);

// 合并列表
const 合并待办列表 = computed(() => {
  return todoList.mergedList.value.map(item => ({
    key: item.key,
    todo: item.data,
    isHidden: item.isHidden,
  }));
});

// 切换待办事项状态
async function toggleTodo(key: string, todo: 待办事项类型, isCurrentlyHidden: boolean) {
  await todoList.toggleItem(key, todo, isCurrentlyHidden);
}

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
  gap: var(--spacing-md);
  height: 100%;
  min-height: 0;
}

// ═══ 行布局 ═══
.row-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

// 第二行：三栏均分，填满剩余空间
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
}

// ═══ 通用卡片（含hover效果） ═══
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  // hover 光泽效果
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 60%);
    opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
    z-index: 0;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    border-color: var(--color-border-light);

    &::before {
      opacity: 1;
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;

  &.compact {
    padding: var(--spacing-xs) var(--spacing-md);
  }

  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      color: var(--color-gold);
      font-size: 12px;
    }
  }
}

.card-body {
  padding: var(--spacing-md);
  flex: 1;
  overflow-y: auto;
  min-height: 0;

  &.compact {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  &.scrollable {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 2px;
    }
  }
}

// ═══ 时空舆情卡（无纵向间距） ═══

.info-list {
  display: flex;
  flex-direction: column;

  &.compact {
    gap: 0;
  }
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;
  padding: 2px 0;

  i {
    flex-shrink: 0;
    width: 12px;
    font-size: 10px;
    margin-top: 3px;
  }

  span {
    flex: 1;
    word-break: break-word;
  }

  &.event {
    color: var(--color-gold);
    i {
      color: var(--color-gold);
    }
  }
  &.central {
    color: #9b59b6;
    i {
      color: #9b59b6;
    }
  }
  &.province {
    color: #3498db;
    i {
      color: #3498db;
    }
  }
  &.local {
    color: #1abc9c;
    i {
      color: #1abc9c;
    }
  }
  &.rumor {
    color: var(--color-warning);
    i {
      color: var(--color-warning);
    }
  }
  &.reputation {
    color: var(--color-romance-light);
    i {
      color: var(--color-romance-light);
    }
  }
}

// ═══ 场景卡 ═══
.scene-type {
  padding: 2px 8px;
  font-size: 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
}

.scene-desc {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  word-break: break-word;
}

.scene-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.mood-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 10px;
  background: rgba(255, 77, 109, 0.1);
  border-radius: var(--radius-sm);
  color: var(--color-romance-light);

  i {
    font-size: 10px;
  }
}

.present-chars {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.topic-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(216, 166, 87, 0.1);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-gold);
  word-break: break-word;

  i {
    margin-right: 4px;
  }
}

// ═══ 统计卡片 ═══
.stat-card-panel {
  min-width: 0;
}

.stat-body {
  overflow-y: auto;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(2px);
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-card);
    border-radius: var(--radius-sm);
    font-size: 14px;
    color: var(--color-gold);
    flex-shrink: 0;
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
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
    font-family: var(--font-display);
    line-height: 1;
  }

  .stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}

// ═══ 待办事项 ═══
.todo-card {
  min-width: 0;
}

.todo-body {
  overflow-y: auto;
}

.count-badge {
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-border);
  transition: all var(--transition-fast);

  &.urgent {
    border-left-color: var(--color-danger);
  }
  &.high {
    border-left-color: var(--color-warning);
  }
  &.normal {
    border-left-color: var(--color-info);
  }

  &.completed {
    opacity: 0.5;

    .todo-text {
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

.todo-urgency {
  padding: 2px 5px;
  font-size: 10px;
  font-weight: 600;
  background: var(--color-bg-card);
  border-radius: 3px;
  color: var(--color-text-muted);
  flex-shrink: 0;

  .urgent & {
    color: var(--color-danger);
  }
  .high & {
    color: var(--color-warning);
  }
}

.todo-text {
  font-size: 12px;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.4;
}

.todo-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 10px;
  color: var(--color-text-muted);

  i {
    margin-right: 2px;
  }
}

.deadline {
  display: flex;
  align-items: center;
}

.more-chars {
  font-size: 10px;
  color: var(--color-text-muted);
}

.empty-hint {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 12px;
  padding: var(--spacing-md);
}

.more-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--color-gold);
  }
}

// ═══ 关系索引（动态颜色，无图标） ═══
.relations-card {
  min-width: 0;
}

.relations-body {
  overflow-y: auto;
}

.relations-card .card-header .more-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);

  &:hover {
    color: var(--color-gold);
  }
}

.relation-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
}

// 关系 chip - 单值字段（无图标，使用动态颜色）
.relation-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 11px;
  border: 1px solid transparent;
  transition: all var(--transition-fast);

  .rel-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--field-color);
  }

  // 第13个及以后的字段：添加边框和降低透明度以示区分
  &.extended {
    border-color: var(--field-color);
    opacity: 0.85;

    .rel-label {
      opacity: 0.9;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }
}

// 关系组 - 数组字段（无图标，使用动态颜色）
.relation-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all var(--transition-fast);

  .group-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--field-color);
  }

  .group-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  // 第13个及以后的字段：添加边框和降低透明度以示区分
  &.extended {
    border-color: var(--field-color);
    opacity: 0.85;

    .group-label {
      opacity: 0.9;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }
}

// ═══ 全局统一角色名样式 ═══
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
