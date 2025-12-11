<template>
  <div class="masked-text" :class="{ masked: isMasked }">
    <!-- 遮罩层 -->
    <div v-if="isMasked" class="mask-overlay" @click="unlock">
      <div class="mask-content">
        <i class="fas fa-eye-slash"></i>
        <span>点击查看</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content" :class="{ blurred: isMasked }">
      <slot></slot>
    </div>

    <!-- 手动遮罩按钮（仅在解锁状态显示） -->
    <button
      v-if="!isMasked && showLockButton"
      class="lock-btn"
      @click="lock"
      title="隐藏内容"
    >
      <i class="fas fa-eye"></i>
    </button>

    <!-- 自动遮罩倒计时 -->
    <div v-if="!isMasked && autoLockSeconds > 0" class="countdown">
      {{ remainingSeconds }}s
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    /**
     * 初始是否遮罩
     */
    initialMasked?: boolean;
    /**
     * 自动重新遮罩的秒数，0 表示不自动遮罩
     */
    autoLockSeconds?: number;
    /**
     * 是否显示手动遮罩按钮
     */
    showLockButton?: boolean;
  }>(),
  {
    initialMasked: true,
    autoLockSeconds: 10,
    showLockButton: true,
  }
);

const emit = defineEmits<{
  (e: 'unlock'): void;
  (e: 'lock'): void;
}>();

const isMasked = ref(props.initialMasked);
const remainingSeconds = ref(props.autoLockSeconds);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 解锁
function unlock() {
  isMasked.value = false;
  emit('unlock');

  // 开始自动遮罩倒计时
  if (props.autoLockSeconds > 0) {
    startCountdown();
  }
}

// 手动遮罩
function lock() {
  stopCountdown();
  isMasked.value = true;
  emit('lock');
}

// 开始倒计时
function startCountdown() {
  stopCountdown();
  remainingSeconds.value = props.autoLockSeconds;

  countdownTimer = setInterval(() => {
    remainingSeconds.value--;
    if (remainingSeconds.value <= 0) {
      lock();
    }
  }, 1000);
}

// 停止倒计时
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

// 监听 initialMasked 变化
watch(
  () => props.initialMasked,
  newVal => {
    if (newVal) {
      lock();
    }
  }
);

onMounted(() => {
  // 如果初始状态为解锁且需要自动遮罩，开始倒计时
  if (!isMasked.value && props.autoLockSeconds > 0) {
    startCountdown();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>

<style lang="scss" scoped>
.masked-text {
  position: relative;
  display: inline-block;
  min-width: 60px;
}

// 遮罩层
.mask-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 17, 23, 0.9);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border-radius: var(--radius-sm);
  cursor: pointer;
  z-index: 2;
  transition: all var(--transition-fast);

  &:hover {
    background: rgba(15, 17, 23, 0.8);

    .mask-content {
      color: var(--color-gold);
    }
  }
}

.mask-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 11px;
  transition: color var(--transition-fast);

  i {
    font-size: 16px;
  }
}

// 内容区域
.content {
  transition: filter var(--transition-normal);

  &.blurred {
    filter: blur(8px);
    user-select: none;
    pointer-events: none;
  }
}

// 手动遮罩按钮
.lock-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 10px;
  cursor: pointer;
  z-index: 1;
  opacity: 0;
  transition: all var(--transition-fast);

  .masked-text:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    border-color: var(--color-gold);
  }
}

// 倒计时
.countdown {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-sm);
  font-size: 10px;
  color: var(--color-text-muted);
  z-index: 1;
}
</style>

