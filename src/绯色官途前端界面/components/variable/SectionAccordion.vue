<template>
  <section class="section-accordion" :class="{ collapsed: !isExpanded }">
    <!-- 头部 -->
    <div class="section-header" @click="toggle">
      <i class="fas fa-chevron-right expand-icon" :class="{ expanded: isExpanded }"></i>
      <h3 class="section-title">
        <i v-if="icon" :class="icon"></i>
        <slot name="title">{{ title }}</slot>
      </h3>
      <div class="section-meta">
        <span v-if="showCount" class="field-count">
          {{ filledCount }} / {{ totalCount }}
        </span>
        <slot name="meta"></slot>
      </div>
      <div class="section-actions" @click.stop>
        <button
          v-if="showSave && isExpanded"
          class="btn-save"
          :disabled="saving || !dirty"
          @click="handleSave"
        >
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          <span>保存</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <Transition name="accordion">
      <div v-show="isExpanded" class="section-body">
        <slot></slot>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// ═══ Props & Emits ═══
const props = withDefaults(
  defineProps<{
    title: string;
    icon?: string;
    expanded?: boolean;
    showCount?: boolean;
    filledCount?: number;
    totalCount?: number;
    showSave?: boolean;
    dirty?: boolean;
    saving?: boolean;
  }>(),
  {
    expanded: false,
    showCount: true,
    filledCount: 0,
    totalCount: 0,
    showSave: true,
    dirty: false,
    saving: false,
  },
);

const emit = defineEmits<{
  (e: 'update:expanded', value: boolean): void;
  (e: 'toggle', expanded: boolean): void;
  (e: 'save'): void;
}>();

// ═══ State ═══
const isExpanded = ref(props.expanded);

// 同步外部 expanded 变化
watch(
  () => props.expanded,
  val => {
    isExpanded.value = val;
  },
);

// ═══ Methods ═══
function toggle() {
  isExpanded.value = !isExpanded.value;
  emit('update:expanded', isExpanded.value);
  emit('toggle', isExpanded.value);
}

function handleSave() {
  emit('save');
}

// 暴露方法
function expand() {
  isExpanded.value = true;
  emit('update:expanded', true);
}

function collapse() {
  isExpanded.value = false;
  emit('update:expanded', false);
}

defineExpose({ expand, collapse, isExpanded });
</script>

<style lang="scss" scoped>
.section-accordion {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--color-border-light);
  }
}

// ═══ 头部 ═══
.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
  }
}

.expand-icon {
  font-size: 12px;
  color: var(--color-text-muted);
  transition: transform var(--transition-fast);

  &.expanded {
    transform: rotate(90deg);
  }
}

.section-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;

  i {
    color: var(--color-gold);
  }
}

.section-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.field-count {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 2px 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--color-success);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  color: white;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 10px;
  }
}

// ═══ 内容区 ═══
.section-body {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

// ═══ 过渡动画 ═══
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>

