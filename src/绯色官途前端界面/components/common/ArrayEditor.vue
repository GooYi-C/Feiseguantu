<template>
  <div class="array-editor" :class="{ disabled, focused: isFocused }">
    <div v-if="label" class="editor-label">
      <span class="label-text">{{ label }}</span>
      <span class="item-count">{{ modelValue.length }} 项</span>
    </div>

    <div class="editor-container">
      <!-- 已有项目列表 -->
      <div class="tags-wrapper">
        <TransitionGroup name="tag">
          <span v-for="(item, index) in modelValue" :key="item + index" class="tag-item" :class="tagColorClass(item)">
            <span class="tag-text">{{ item }}</span>
            <button
              v-if="!disabled"
              class="tag-remove"
              type="button"
              :title="`删除 ${item}`"
              @click="removeItem(index)"
            >
              <i class="fas fa-times"></i>
            </button>
          </span>
        </TransitionGroup>

        <!-- 输入框 -->
        <input
          v-if="!disabled"
          ref="inputRef"
          v-model="inputValue"
          type="text"
          class="tag-input"
          :placeholder="isEmpty ? placeholder : ''"
          @focus="isFocused = true"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
      </div>
    </div>

    <!-- 预设建议 -->
    <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-panel">
      <div class="suggestions-header">
        <i class="fas fa-lightbulb"></i>
        <span>建议</span>
      </div>
      <div class="suggestions-list">
        <button
          v-for="suggestion in filteredSuggestions"
          :key="suggestion"
          type="button"
          class="suggestion-item"
          @click="addSuggestion(suggestion)"
        >
          <i class="fas fa-plus"></i>
          {{ suggestion }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    suggestions?: string[];
    maxItems?: number;
    allowDuplicates?: boolean;
    tagColors?: Record<string, string>; // 标签颜色映射
  }>(),
  {
    placeholder: '输入后按 Enter 添加...',
    disabled: false,
    suggestions: () => [],
    maxItems: 0, // 0 表示不限制
    allowDuplicates: false,
    tagColors: () => ({}),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'add', item: string): void;
  (e: 'remove', item: string, index: number): void;
}>();

// ═══ State ═══
const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');
const isFocused = ref(false);

// ═══ Computed ═══
const isEmpty = computed(() => props.modelValue.length === 0);

const showSuggestions = computed(() => {
  return !props.disabled && props.suggestions.length > 0 && filteredSuggestions.value.length > 0;
});

// 过滤掉已添加的建议
const filteredSuggestions = computed(() => {
  return props.suggestions.filter(
    s =>
      !props.modelValue.includes(s) &&
      (inputValue.value === '' || s.toLowerCase().includes(inputValue.value.toLowerCase())),
  );
});

// ═══ Methods ═══

/**
 * 添加新项目
 */
function addItem(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 检查重复
  if (!props.allowDuplicates && props.modelValue.includes(trimmed)) {
    toastr.warning(`「${trimmed}」已存在`);
    return false;
  }

  // 检查数量限制
  if (props.maxItems > 0 && props.modelValue.length >= props.maxItems) {
    toastr.warning(`最多添加 ${props.maxItems} 项`);
    return false;
  }

  emit('update:modelValue', [...props.modelValue, trimmed]);
  emit('add', trimmed);
  inputValue.value = '';
  return true;
}

/**
 * 删除项目
 */
function removeItem(index: number): void {
  const item = props.modelValue[index];
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  emit('update:modelValue', newValue);
  emit('remove', item, index);
}

/**
 * 添加建议项
 */
function addSuggestion(suggestion: string): void {
  if (addItem(suggestion)) {
    // 添加成功后聚焦输入框
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
}

/**
 * 键盘事件处理
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    addItem(inputValue.value);
  } else if (e.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    // 空输入框时按 Backspace 删除最后一项
    removeItem(props.modelValue.length - 1);
  }
}

/**
 * 失焦处理
 */
function handleBlur(): void {
  // 延迟设置失焦，允许点击建议
  setTimeout(() => {
    isFocused.value = false;
  }, 150);
}

/**
 * 获取标签颜色类
 */
function tagColorClass(item: string): string {
  // 检查自定义颜色映射
  const customColor = props.tagColors[item];
  if (customColor) return `color-${customColor}`;

  // 默认颜色映射（用于绯色官途项目）
  if (['靠山', '一把手', '直接上级', '核心嫡系'].includes(item)) return 'color-gold';
  if (['绯色对象'].includes(item)) return 'color-romance';
  if (['竞争对手', '政治宿敌'].includes(item)) return 'color-danger';
  if (['家属'].includes(item)) return 'color-info';

  return '';
}
</script>

<style lang="scss" scoped>
.array-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &.focused .editor-container {
    border-color: var(--color-gold);
  }
}

.editor-label {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label-text {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .item-count {
    font-size: 11px;
    color: var(--color-text-muted);
  }
}

.editor-container {
  padding: var(--spacing-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 40px;
  transition: border-color var(--transition-fast);
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  align-items: center;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  // 颜色变体
  &.color-gold {
    background: rgba(216, 166, 87, 0.15);
    color: var(--color-gold);
  }

  &.color-romance {
    background: rgba(255, 77, 109, 0.15);
    color: var(--color-romance-light);
  }

  &.color-danger {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }

  &.color-success {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }

  &.color-info {
    background: rgba(122, 162, 247, 0.15);
    color: var(--color-info);
  }

  &.color-warning {
    background: rgba(224, 195, 108, 0.15);
    color: var(--color-warning);
  }
}

.tag-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: inherit;
  font-size: 10px;
  opacity: 0.6;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    opacity: 1;
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
}

.tag-input {
  flex: 1;
  min-width: 100px;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 12px;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus {
    outline: none;
  }
}

// ═══ 建议面板 ═══
.suggestions-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-muted);

  i {
    color: var(--color-warning);
  }
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
}

.suggestion-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-bg-elevated);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  i {
    font-size: 9px;
  }

  &:hover {
    background: var(--color-bg-card);
    border-color: var(--color-gold);
    color: var(--color-gold);
  }
}

// ═══ 过渡动画 ═══
.tag-enter-active,
.tag-leave-active {
  transition: all 0.2s ease;
}

.tag-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tag-move {
  transition: transform 0.2s ease;
}
</style>
