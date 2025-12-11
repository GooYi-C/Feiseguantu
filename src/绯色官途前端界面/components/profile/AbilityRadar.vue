<template>
  <div class="ability-radar" ref="containerRef">
    <svg :viewBox="`0 0 ${props.size} ${props.size}`" class="radar-svg">
      <!-- 背景网格 -->
      <g class="radar-grid">
        <polygon
          v-for="level in [20, 40, 60, 80, 100]"
          :key="level"
          :points="getGridPoints(level)"
          class="grid-line"
        />
        <!-- 轴线 -->
        <line
          v-for="(_, i) in abilities"
          :key="'axis-' + i"
          :x1="center"
          :y1="center"
          :x2="getAxisPoint(i).x"
          :y2="getAxisPoint(i).y"
          class="axis-line"
        />
      </g>

      <!-- 能力值多边形 -->
      <polygon :points="dataPoints" class="radar-area" />

      <!-- 数据点 -->
      <g class="radar-points">
        <circle
          v-for="(ability, i) in abilities"
          :key="'point-' + i"
          :cx="getDataPoint(i).x"
          :cy="getDataPoint(i).y"
          r="6"
          class="data-point"
          :class="{
            highest: ability.key === highestAbility,
            lowest: ability.key === lowestAbility,
          }"
          @mouseenter="showTooltip(ability, $event)"
          @mouseleave="hideTooltip"
        />
      </g>

      <!-- 维度标签 -->
      <g class="radar-labels">
        <text
          v-for="(ability, i) in abilities"
          :key="'label-' + i"
          :x="getLabelPosition(i).x"
          :y="getLabelPosition(i).y"
          class="label"
          :class="{
            highest: ability.key === highestAbility,
            lowest: ability.key === lowestAbility,
          }"
        >
          {{ ability.label }} ({{ ability.value }})
        </text>
      </g>
    </svg>

    <!-- 最长板/最短板标注 -->
    <div class="radar-legend">
      <div class="legend-item highest">
        <i class="fas fa-arrow-up"></i>
        <span>最长板: {{ highestAbilityLabel }} ({{ highestAbilityValue }})</span>
      </div>
      <div class="legend-item lowest">
        <i class="fas fa-arrow-down"></i>
        <span>最短板: {{ lowestAbilityLabel }} ({{ lowestAbilityValue }})</span>
      </div>
    </div>

    <!-- 悬浮说明 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="tooltip.visible"
          class="ability-tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <h4>{{ tooltip.ability?.label }}</h4>
          <p class="value">
            当前值: {{ tooltip.ability?.value }}
            <span class="tier" :class="getTierClass(tooltip.ability?.value)">
              ({{ getTierLabel(tooltip.ability?.value) }})
            </span>
          </p>
          <p class="description">{{ getAbilityDescription(tooltip.ability?.key) }}</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    data: Record<string, number>;
    size?: number;
  }>(),
  {
    size: 320,
  },
);

const containerRef = ref<HTMLElement | null>(null);

const center = computed(() => props.size / 2);
const radius = computed(() => props.size * 0.34); // 约 110/320 = 0.34

// 能力描述（来自游戏主prompt）
const abilityDescriptions: Record<string, string> = {
  公文笔杆: '喉舌。意图转译为红头/内参。晋升快车道，90+可成为核心大秘。',
  揣摩上意: '听风。读懂"沉默"与"弦外音"。哪怕执行0分，猜对方向也能软着陆。',
  资源整合: '抓手。调配财政/土地/编制平事。政绩(GDP)唯一来源。',
  人脉经营: '根系。利益输送网。决定消息灵通度&保护伞厚度。',
  政治敏感: '嗅觉。预判风暴/站队切割。低分者死于换届/严打（莫名暴毙）。',
  执行魄力: '獠牙。脏活落地（拆迁/截访/镇压）。领导眼中的"好用"（酷吏）。',
  酒桌功夫: '诚意。肝功能=忠诚度。圈子入场券（断片前结盟）。',
  魅力风度: '脸面。群众/媒体眼中的"官相"。女人看重的颜值。舆情控制&猎艳资本。',
  表演功底: '面具。即使恨之入骨也能握手言欢。情绪管理失败=政治幼稚。',
  厚黑指数: '脏器。脸厚心黑。作恶抗性（毫无波澜牺牲盟友/百姓）。',
};

// 阶梯评价
function getTierLabel(value?: number): string {
  if (!value) return '未知';
  if (value >= 91) return 'T0 国手';
  if (value >= 81) return 'T1 封疆';
  if (value >= 61) return 'T2 干将';
  if (value >= 41) return 'T3 庸吏';
  return 'T4 弃子';
}

function getTierClass(value?: number): string {
  if (!value) return '';
  if (value >= 91) return 't0';
  if (value >= 81) return 't1';
  if (value >= 61) return 't2';
  if (value >= 41) return 't3';
  return 't4';
}

const abilities = computed(() =>
  Object.entries(props.data).map(([key, value]) => ({
    key,
    label: key,
    value: value || 0,
  }))
);

const highestAbility = computed(() => {
  if (abilities.value.length === 0) return undefined;
  const max = Math.max(...abilities.value.map(a => a.value));
  return abilities.value.find(a => a.value === max)?.key;
});

const lowestAbility = computed(() => {
  if (abilities.value.length === 0) return undefined;
  const min = Math.min(...abilities.value.map(a => a.value));
  return abilities.value.find(a => a.value === min)?.key;
});

const highestAbilityLabel = computed(() =>
  abilities.value.find(a => a.key === highestAbility.value)?.label ?? '无'
);

const highestAbilityValue = computed(() =>
  abilities.value.find(a => a.key === highestAbility.value)?.value ?? 0
);

const lowestAbilityLabel = computed(() =>
  abilities.value.find(a => a.key === lowestAbility.value)?.label ?? '无'
);

const lowestAbilityValue = computed(() =>
  abilities.value.find(a => a.key === lowestAbility.value)?.value ?? 0
);

// 计算函数
function getAngle(index: number): number {
  return (2 * Math.PI * index) / abilities.value.length - Math.PI / 2;
}

function getGridPoints(level: number): string {
  const r = (level / 100) * radius.value;
  return abilities.value
    .map((_, i) => {
      const angle = getAngle(i);
      return `${center.value + r * Math.cos(angle)},${center.value + r * Math.sin(angle)}`;
    })
    .join(' ');
}

function getAxisPoint(index: number): { x: number; y: number } {
  const angle = getAngle(index);
  return {
    x: center.value + radius.value * Math.cos(angle),
    y: center.value + radius.value * Math.sin(angle),
  };
}

function getDataPoint(index: number): { x: number; y: number } {
  const angle = getAngle(index);
  const value = abilities.value[index]?.value || 0;
  const r = (value / 100) * radius.value;
  return {
    x: center.value + r * Math.cos(angle),
    y: center.value + r * Math.sin(angle),
  };
}

function getLabelPosition(index: number): { x: number; y: number } {
  const angle = getAngle(index);
  const labelRadius = radius.value + 28;
  return {
    x: center.value + labelRadius * Math.cos(angle),
    y: center.value + labelRadius * Math.sin(angle) + 4,
  };
}

const dataPoints = computed(() =>
  abilities.value
    .map((_, i) => {
      const p = getDataPoint(i);
      return `${p.x},${p.y}`;
    })
    .join(' ')
);

function getAbilityDescription(key?: string): string {
  return key ? abilityDescriptions[key] || '暂无描述' : '';
}

// Tooltip
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  ability: null as { key: string; label: string; value: number } | null,
});

function showTooltip(ability: { key: string; label: string; value: number }, event: MouseEvent) {
  tooltip.value = {
    visible: true,
    x: event.clientX + 12,
    y: event.clientY + 12,
    ability,
  };
}

function hideTooltip() {
  tooltip.value.visible = false;
}
</script>

<style lang="scss" scoped>
.ability-radar {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.radar-svg {
  width: 100%;
  height: 100%;
  max-width: none;
  aspect-ratio: 1;
}

.grid-line {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
  opacity: 0.4;
}

.axis-line {
  stroke: var(--color-border);
  stroke-width: 1;
  opacity: 0.3;
}

.radar-area {
  fill: rgba(196, 30, 58, 0.15);
  stroke: var(--color-romance);
  stroke-width: 2;
  transition: fill 0.2s ease;
}

.data-point {
  fill: var(--color-romance);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    r: 8;
    filter: drop-shadow(0 0 6px var(--color-romance));
  }

  &.highest {
    fill: var(--color-success);
    stroke: white;
    stroke-width: 2;
    r: 7;

    &:hover {
      filter: drop-shadow(0 0 8px var(--color-success));
    }
  }

  &.lowest {
    fill: var(--color-danger);
    stroke: white;
    stroke-width: 2;
    r: 7;

    &:hover {
      filter: drop-shadow(0 0 8px var(--color-danger));
    }
  }
}

.label {
  font-size: 10px;
  fill: var(--color-text-secondary);
  text-anchor: middle;
  pointer-events: none;

  &.highest {
    fill: var(--color-success);
    font-weight: 600;
  }

  &.lowest {
    fill: var(--color-danger);
    font-weight: 600;
  }
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 12px;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);

    i {
      font-size: 11px;
    }

    &.highest {
      color: var(--color-success);
      background: rgba(74, 193, 142, 0.1);
    }

    &.lowest {
      color: var(--color-danger);
      background: rgba(255, 107, 107, 0.1);
    }
  }
}

// Tooltip
.ability-tooltip {
  position: fixed;
  z-index: 1000;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-width: 280px;
  pointer-events: none;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
  }

  .value {
    font-size: 13px;
    color: var(--color-gold);
    margin-bottom: var(--spacing-xs);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .tier {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-weight: 500;

      &.t0 {
        background: rgba(255, 215, 0, 0.15);
        color: #ffd700;
      }
      &.t1 {
        background: rgba(74, 193, 142, 0.15);
        color: var(--color-success);
      }
      &.t2 {
        background: rgba(122, 162, 247, 0.15);
        color: var(--color-info);
      }
      &.t3 {
        background: rgba(224, 195, 108, 0.15);
        color: var(--color-warning);
      }
      &.t4 {
        background: rgba(255, 107, 107, 0.15);
        color: var(--color-danger);
      }
    }
  }

  .description {
    font-size: 12px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

