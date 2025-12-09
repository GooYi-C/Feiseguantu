<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        :class="{ 'no-close-on-click': !closeOnOverlay }"
        @click.self="handleOverlayClick"
        @keydown.esc="handleEsc"
      >
        <div
          ref="modalRef"
          class="modal-container"
          :class="[sizeClass, { 'has-header': !!title || $slots.header }]"
          :style="customStyle"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="title ? 'modal-title' : undefined"
        >
          <!-- 头部 -->
          <div v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <h3 id="modal-title" class="modal-title">
                <i v-if="icon" :class="icon"></i>
                {{ title }}
              </h3>
            </slot>
            <button
              v-if="showClose"
              class="modal-close"
              type="button"
              aria-label="关闭"
              @click="close"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body" :class="{ 'no-padding': noPadding }">
            <slot></slot>
          </div>

          <!-- 底部 -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, type CSSProperties } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    icon?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    width?: string; // 自定义宽度
    maxHeight?: string; // 自定义最大高度
    showClose?: boolean;
    closeOnOverlay?: boolean; // 点击遮罩关闭
    closeOnEsc?: boolean; // 按 Esc 关闭
    noPadding?: boolean; // 内容区无内边距
    persistent?: boolean; // 是否持久化（不允许关闭）
  }>(),
  {
    size: 'md',
    showClose: true,
    closeOnOverlay: true,
    closeOnEsc: true,
    noPadding: false,
    persistent: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
  (e: 'open'): void;
}>();

// ═══ Refs ═══
const modalRef = ref<HTMLElement | null>(null);

// ═══ Computed ═══
const sizeClass = computed(() => `size-${props.size}`);

const customStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.width) style.width = props.width;
  if (props.maxHeight) style.maxHeight = props.maxHeight;
  return style;
});

// ═══ Methods ═══
function close(): void {
  if (props.persistent) return;
  emit('update:modelValue', false);
  emit('close');
}

function handleOverlayClick(): void {
  if (props.closeOnOverlay && !props.persistent) {
    close();
  }
}

function handleEsc(e: KeyboardEvent): void {
  if (props.closeOnEsc && !props.persistent && e.key === 'Escape') {
    e.preventDefault();
    close();
  }
}

// 处理全局 Esc 按键
function handleGlobalKeydown(e: KeyboardEvent): void {
  if (props.modelValue && props.closeOnEsc && !props.persistent && e.key === 'Escape') {
    e.preventDefault();
    close();
  }
}

// 禁止背景滚动
function lockBodyScroll(): void {
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll(): void {
  document.body.style.overflow = '';
}

// ═══ Lifecycle ═══
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      lockBodyScroll();
      emit('open');
      // 聚焦到模态框以便接收键盘事件
      setTimeout(() => {
        modalRef.value?.focus();
      }, 100);
    } else {
      unlockBodyScroll();
    }
  },
);

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
  if (props.modelValue) {
    lockBodyScroll();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
  unlockBodyScroll();
});
</script>

<style lang="scss" scoped>
// ═══ 遮罩层 ═══
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);

  &.no-close-on-click {
    cursor: default;
  }
}

// ═══ 模态框容器 ═══
.modal-container {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: calc(100% - var(--spacing-2xl) * 2);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;

  // 尺寸变体
  &.size-sm {
    width: 320px;
  }

  &.size-md {
    width: 480px;
  }

  &.size-lg {
    width: 640px;
  }

  &.size-xl {
    width: 800px;
  }

  &.size-full {
    width: calc(100% - var(--spacing-2xl) * 2);
    height: calc(100% - var(--spacing-2xl) * 2);
    max-height: none;
  }

  // 最大宽度限制
  max-width: calc(100% - var(--spacing-lg) * 2);
}

// ═══ 头部 ═══
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg-card) 100%);
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;

  i {
    color: var(--color-gold);
  }
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }

  &:active {
    background: rgba(255, 107, 107, 0.1);
    color: var(--color-danger);
  }
}

// ═══ 内容 ═══
.modal-body {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;

  &.no-padding {
    padding: 0;
  }

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;

    &:hover {
      background: var(--color-text-muted);
    }
  }
}

// ═══ 底部 ═══
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  flex-shrink: 0;
}

// ═══ 过渡动画 ═══
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-container {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
}
</style>

