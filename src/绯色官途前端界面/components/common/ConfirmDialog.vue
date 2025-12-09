<template>
  <Modal
    v-model="isVisible"
    :title="title"
    :icon="icon"
    size="sm"
    :show-close="!loading"
    :close-on-overlay="!danger && !loading"
    :close-on-esc="!danger && !loading"
    :persistent="loading"
  >
    <div class="confirm-content" :class="{ danger }">
      <!-- 图标 -->
      <div v-if="showIcon" class="confirm-icon" :class="iconType">
        <i :class="displayIcon"></i>
      </div>

      <!-- 消息 -->
      <p class="confirm-message">{{ message }}</p>

      <!-- 详细说明 -->
      <p v-if="description" class="confirm-description">{{ description }}</p>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <button
        v-if="showCancel"
        type="button"
        class="btn btn-cancel"
        :disabled="loading"
        @click="handleCancel"
      >
        <i v-if="cancelIcon" :class="cancelIcon"></i>
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="btn btn-confirm"
        :class="{ 'btn-danger': danger }"
        :disabled="loading"
        @click="handleConfirm"
      >
        <i v-if="loading" class="fas fa-spinner fa-spin"></i>
        <i v-else-if="confirmIcon" :class="confirmIcon"></i>
        {{ confirmText }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Modal from './Modal.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    icon?: string;
    message: string;
    description?: string;
    danger?: boolean; // 危险操作模式
    confirmText?: string;
    cancelText?: string;
    confirmIcon?: string;
    cancelIcon?: string;
    showIcon?: boolean;
    showCancel?: boolean;
    loading?: boolean;
  }>(),
  {
    title: '确认操作',
    confirmText: '确认',
    cancelText: '取消',
    danger: false,
    showIcon: true,
    showCancel: true,
    loading: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// ═══ State ═══
const isVisible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
});

// ═══ Computed ═══
const iconType = computed(() => {
  if (props.danger) return 'danger';
  return 'default';
});

const displayIcon = computed(() => {
  if (props.icon) return props.icon;
  if (props.danger) return 'fas fa-exclamation-triangle';
  return 'fas fa-question-circle';
});

// ═══ Methods ═══
function handleConfirm(): void {
  emit('confirm');
  // 如果不是loading状态，自动关闭
  if (!props.loading) {
    isVisible.value = false;
  }
}

function handleCancel(): void {
  emit('cancel');
  isVisible.value = false;
}
</script>

<style lang="scss" scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-md) 0;
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--spacing-lg);
  border-radius: 50%;
  font-size: 24px;

  &.default {
    background: rgba(122, 162, 247, 0.15);
    color: var(--color-info);
  }

  &.danger {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
    animation: pulse-danger 1.5s ease-in-out infinite;
  }
}

@keyframes pulse-danger {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
  }
}

.confirm-message {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.5;
}

.confirm-description {
  margin-top: var(--spacing-sm);
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

// ═══ 按钮样式 ═══
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);

  &:hover:not(:disabled) {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-light);
    color: var(--color-text-primary);
  }
}

.btn-confirm {
  background: var(--color-gold);
  border: none;
  color: var(--color-bg-dark);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &.btn-danger {
    background: var(--color-danger);
    color: white;

    &:hover:not(:disabled) {
      background: #ff5252;
    }
  }
}

// ═══ 危险模式下的内容样式 ═══
.confirm-content.danger {
  .confirm-message {
    color: var(--color-danger);
  }
}
</style>

