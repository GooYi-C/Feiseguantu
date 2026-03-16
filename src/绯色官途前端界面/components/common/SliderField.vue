<template>
  <div class="slider-field" :class="{ disabled }">
    <div v-if="label" class="slider-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="showValue" class="label-value" :class="valueColorClass">{{ displayValue }}</span>
    </div>

    <div class="slider-wrapper">
      <!-- 进度条背景 -->
      <div class="slider-track">
        <div class="slider-fill" :class="fillColorClass" :style="{ width: percentage + '%' }"></div>
      </div>

      <!-- 滑块输入 -->
      <input
        type="range"
        class="slider-input"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        @input="handleSliderInput"
      />

      <!-- 数字输入框 -->
      <input
        v-if="showInput"
        type="number"
        class="number-input"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        @input="handleNumberInput"
        @blur="handleBlur"
      />
    </div>

    <!-- 刻度标记 -->
    <div v-if="showTicks" class="slider-ticks">
      <span v-for="tick in tickMarks" :key="tick" class="tick" :style="{ left: tickPosition(tick) + '%' }">
        {{ tick }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    disabled?: boolean;
    showInput?: boolean;
    showValue?: boolean;
    showTicks?: boolean;
    tickInterval?: number;
    colorMode?: 'default' | 'graded'; // graded: 根据值显示颜色分级
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    showInput: true,
    showValue: false, // 默认不显示标签上的数值，因为右侧有 number-input
    showTicks: false,
    tickInterval: 25,
    colorMode: 'graded',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
}>();

// ═══ 计算属性 ═══
const percentage = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((props.modelValue - props.min) / range) * 100;
});

const displayValue = computed(() => {
  return props.modelValue;
});

// 颜色分级：高(>=80) / 中(>=50) / 低(<50)
const valueColorClass = computed(() => {
  if (props.colorMode !== 'graded') return '';
  const val = props.modelValue;
  const range = props.max - props.min;
  const normalizedVal = ((val - props.min) / range) * 100;

  if (normalizedVal >= 80) return 'high';
  if (normalizedVal >= 50) return 'mid';
  return 'low';
});

const fillColorClass = computed(() => {
  return valueColorClass.value;
});

// 刻度标记
const tickMarks = computed(() => {
  const ticks: number[] = [];
  for (let i = props.min; i <= props.max; i += props.tickInterval) {
    ticks.push(i);
  }
  if (!ticks.includes(props.max)) {
    ticks.push(props.max);
  }
  return ticks;
});

function tickPosition(tick: number): number {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((tick - props.min) / range) * 100;
}

// ═══ 事件处理 ═══
function clampValue(value: number): number {
  return Math.max(props.min, Math.min(props.max, value));
}

function handleSliderInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = clampValue(Number(target.value));
  emit('update:modelValue', value);
  emit('change', value);
}

function handleNumberInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = clampValue(Number(target.value));
  emit('update:modelValue', value);
}

function handleBlur(e: Event) {
  const target = e.target as HTMLInputElement;
  const value = clampValue(Number(target.value));
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<style lang="scss" scoped>
.slider-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label-text {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .label-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);

    &.high {
      color: var(--color-success);
    }
    &.mid {
      color: var(--color-warning);
    }
    &.low {
      color: var(--color-danger);
    }
  }
}

.slider-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.slider-track {
  position: absolute;
  left: 0;
  right: 60px; // 为数字输入框留空间
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: 3px;
  overflow: hidden;
  pointer-events: none;
}

.slider-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.15s ease;

  // 默认颜色
  background: var(--color-gold);

  // 分级颜色
  &.high {
    background: linear-gradient(90deg, var(--color-success), #6dd5a0);
  }
  &.mid {
    background: linear-gradient(90deg, var(--color-warning), #f0d78c);
  }
  &.low {
    background: linear-gradient(90deg, var(--color-danger), #ff9999);
  }
}

.slider-input {
  flex: 1;
  height: 24px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;

  // Webkit 滑块轨道
  &::-webkit-slider-runnable-track {
    height: 6px;
    background: transparent;
    border-radius: 3px;
  }

  // Webkit 滑块把手
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    background: var(--color-text-primary);
    border: 2px solid var(--color-bg-card);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast);

    &:hover {
      transform: scale(1.1);
    }
  }

  // Firefox 滑块轨道
  &::-moz-range-track {
    height: 6px;
    background: transparent;
    border-radius: 3px;
  }

  // Firefox 滑块把手
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: var(--color-text-primary);
    border: 2px solid var(--color-bg-card);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-fast);

    &:hover {
      transform: scale(1.1);
    }
  }

  &:focus {
    outline: none;

    &::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba(216, 166, 87, 0.3);
    }

    &::-moz-range-thumb {
      box-shadow: 0 0 0 3px rgba(216, 166, 87, 0.3);
    }
  }
}

.number-input {
  width: 52px;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  // 隐藏数字输入框的箭头
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  -moz-appearance: textfield;
}

.slider-ticks {
  position: relative;
  height: 16px;
  margin-top: var(--spacing-xs);
  margin-right: 60px; // 与数字输入框对齐
}

.tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-text-muted);
}
</style>
