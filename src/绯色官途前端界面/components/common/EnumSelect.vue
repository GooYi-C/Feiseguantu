<template>
  <div class="enum-select" :class="{ disabled, focused: isOpen }">
    <label v-if="label" class="select-label">{{ label }}</label>

    <div class="select-wrapper" ref="wrapperRef">
      <!-- 自定义选择器 -->
      <div
        class="select-trigger"
        :class="{ open: isOpen }"
        :tabindex="disabled ? -1 : 0"
        @click="toggleDropdown"
        @keydown="handleKeydown"
      >
        <span class="selected-value" :class="valueClass">
          <i v-if="selectedIcon" :class="selectedIcon"></i>
          {{ displayValue }}
        </span>
        <i class="fas fa-chevron-down dropdown-icon"></i>
      </div>

      <!-- 下拉菜单 -->
      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown-menu">
          <div
            v-for="option in normalizedOptions"
            :key="option.value"
            class="dropdown-item"
            :class="{
              selected: option.value === modelValue,
              [option.colorClass || '']: true,
            }"
            @click="selectOption(option.value)"
          >
            <i v-if="option.icon" :class="option.icon"></i>
            <span class="option-label">{{ option.label }}</span>
            <i v-if="option.value === modelValue" class="fas fa-check check-icon"></i>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 选项类型
interface EnumOption {
  value: string;
  label: string;
  icon?: string;
  colorClass?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: string[] | EnumOption[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    // 预设的选项配置（用于绯色官途项目的枚举）
    preset?: 'gender' | 'system' | 'marriage' | 'climate' | 'custom';
  }>(),
  {
    placeholder: '请选择',
    disabled: false,
    preset: 'custom',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

// ═══ State ═══
const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

// ═══ 预设配置 ═══
const presetConfigs: Record<string, EnumOption[]> = {
  gender: [
    { value: '无', label: '无', icon: 'fas fa-question', colorClass: 'muted' },
    { value: '男', label: '男', icon: 'fas fa-mars', colorClass: 'male' },
    { value: '女', label: '女', icon: 'fas fa-venus', colorClass: 'female' },
  ],
  system: [
    { value: '无', label: '无', icon: 'fas fa-question', colorClass: 'muted' },
    { value: '党政', label: '党政', icon: 'fas fa-landmark', colorClass: 'gold' },
    { value: '军队', label: '军队', icon: 'fas fa-shield-halved', colorClass: 'success' },
    { value: '事业', label: '事业', icon: 'fas fa-building', colorClass: 'info' },
    { value: '国企', label: '国企', icon: 'fas fa-industry', colorClass: 'warning' },
  ],
  marriage: [
    { value: '无', label: '无', icon: 'fas fa-question', colorClass: 'muted' },
    { value: '未婚', label: '未婚', icon: 'fas fa-user', colorClass: 'info' },
    { value: '已婚', label: '已婚', icon: 'fas fa-ring', colorClass: 'success' },
    { value: '离异', label: '离异', icon: 'fas fa-heart-crack', colorClass: 'warning' },
    { value: '丧偶', label: '丧偶', icon: 'fas fa-cross', colorClass: 'muted' },
  ],
  climate: [
    { value: '无', label: '无', icon: 'fas fa-question', colorClass: 'muted' },
    { value: '狂飙年代', label: '狂飙年代', icon: 'fas fa-fire', colorClass: 'gold' },
    { value: '雷霆震荡', label: '雷霆震荡', icon: 'fas fa-bolt', colorClass: 'danger' },
    { value: '大考淬炼', label: '大考淬炼', icon: 'fas fa-book', colorClass: 'warning' },
    { value: '存量博弈', label: '存量博弈', icon: 'fas fa-chess', colorClass: 'info' },
  ],
};

// ═══ Computed ═══

// 标准化选项
const normalizedOptions = computed<EnumOption[]>(() => {
  // 使用预设配置
  if (props.preset !== 'custom' && presetConfigs[props.preset]) {
    return presetConfigs[props.preset];
  }

  // 自定义选项
  return props.options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });
});

// 当前选中项
const selectedOption = computed(() => {
  return normalizedOptions.value.find(opt => opt.value === props.modelValue);
});

// 显示值
const displayValue = computed(() => {
  return selectedOption.value?.label || props.modelValue || props.placeholder;
});

// 选中项图标
const selectedIcon = computed(() => {
  return selectedOption.value?.icon;
});

// 值样式类
const valueClass = computed(() => {
  return selectedOption.value?.colorClass || '';
});

// ═══ Methods ═══

function toggleDropdown(): void {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function selectOption(value: string): void {
  emit('update:modelValue', value);
  emit('change', value);
  isOpen.value = false;
}

function handleKeydown(e: KeyboardEvent): void {
  if (props.disabled) return;

  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      toggleDropdown();
      break;
    case 'Escape':
      isOpen.value = false;
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
      } else {
        selectNextOption(1);
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (!isOpen.value) {
        isOpen.value = true;
      } else {
        selectNextOption(-1);
      }
      break;
  }
}

function selectNextOption(direction: number): void {
  const currentIndex = normalizedOptions.value.findIndex(opt => opt.value === props.modelValue);
  const nextIndex = currentIndex + direction;

  if (nextIndex >= 0 && nextIndex < normalizedOptions.value.length) {
    const nextOption = normalizedOptions.value[nextIndex];
    emit('update:modelValue', nextOption.value);
    emit('change', nextOption.value);
  }
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent): void {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.enum-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.select-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.select-wrapper {
  position: relative;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-border-light);
  }

  &:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  &.open {
    border-color: var(--color-gold);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.selected-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 13px;
  color: var(--color-text-primary);

  i {
    font-size: 12px;
  }

  // 颜色变体
  &.muted {
    color: var(--color-text-muted);
  }
  &.male {
    color: #4a90d9;
  }
  &.female {
    color: #e84393;
  }
  &.gold {
    color: var(--color-gold);
  }
  &.danger {
    color: var(--color-danger);
  }
  &.success {
    color: var(--color-success);
  }
  &.warning {
    color: var(--color-warning);
  }
  &.info {
    color: var(--color-info);
  }
}

.dropdown-icon {
  font-size: 10px;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);

  .select-trigger.open & {
    transform: rotate(180deg);
  }
}

// ═══ 下拉菜单 ═══
.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: var(--z-dropdown);
  background: var(--color-bg-card);
  border: 1px solid var(--color-gold);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  max-height: 200px;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);

  i {
    font-size: 12px;
    width: 16px;
    text-align: center;
  }

  .option-label {
    flex: 1;
  }

  .check-icon {
    font-size: 10px;
    color: var(--color-gold);
  }

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }

  &.selected {
    background: rgba(216, 166, 87, 0.1);
    color: var(--color-gold);
  }

  // 颜色变体
  &.muted i {
    color: var(--color-text-muted);
  }
  &.male i {
    color: #4a90d9;
  }
  &.female i {
    color: #e84393;
  }
  &.gold i {
    color: var(--color-gold);
  }
  &.danger i {
    color: var(--color-danger);
  }
  &.success i {
    color: var(--color-success);
  }
  &.warning i {
    color: var(--color-warning);
  }
  &.info i {
    color: var(--color-info);
  }
}

// ═══ 过渡动画 ═══
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

