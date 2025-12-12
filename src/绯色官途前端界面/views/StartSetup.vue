<template>
  <div class="start-setup-page">
    <!-- 主内容区 - 开局描述编辑器 -->
    <section class="description-section">
      <div class="section-header">
        <h3><i class="fas fa-feather-alt"></i> 开局描述</h3>
        <span class="char-count" :class="{ warning: descriptionLength > 2000 }">
          {{ descriptionLength }} / 2000 字
        </span>
      </div>
      <div class="editor-wrapper">
        <textarea
          v-model="localDescription"
          class="description-editor"
          placeholder="在此输入您的开局背景故事...

例如：
- 角色的出身背景
- 当前所处的环境
- 面临的初始挑战
- 想要达成的目标

这段描述将帮助AI理解您的游戏起点，并据此调整初始变量。
（如需编辑初始变量，请点击左侧导航栏的「全量变量」页面）"
          :disabled="isGenerating"
        ></textarea>
      </div>
    </section>

    <!-- 底部操作区 -->
    <footer class="setup-footer">
      <div class="footer-status">
        <template v-if="isGenerating">
          <i class="fas fa-spinner fa-spin"></i>
          <span>{{ progress || '处理中...' }}</span>
        </template>
        <template v-else-if="phase === 'generated'">
          <i class="fas fa-check-circle success-icon"></i>
          <span>变量已生成，可继续调整后确认开局</span>
        </template>
        <template v-else-if="lastError">
          <i class="fas fa-exclamation-triangle error-icon"></i>
          <span>{{ lastError }}</span>
        </template>
      </div>
      <div class="footer-actions">
        <button class="btn-generate" :disabled="isGenerating || !canGenerate" @click="handleGenerate">
          <i class="fas fa-magic"></i>
          <span>生成开局</span>
        </button>
        <button class="btn-confirm" :disabled="isGenerating || !canConfirmLocal" @click="handleConfirm">
          <i class="fas fa-check"></i>
          <span>确认开局</span>
        </button>
      </div>
    </footer>

    <!-- 生成确认对话框 -->
    <Modal v-model="showGenerateConfirm" title="确认生成开局" icon="fas fa-magic" size="sm">
      <div class="confirm-content">
        <p>即将根据您的开局描述和变量配置，调用AI生成开局变量更新。</p>
        <p class="hint">生成过程可能需要几秒钟，请耐心等待。</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="showGenerateConfirm = false">取消</button>
        <button class="btn-primary" @click="confirmGenerate"><i class="fas fa-play"></i> 开始生成</button>
      </template>
    </Modal>

    <!-- 确认开局对话框 -->
    <Modal v-model="showConfirmDialog" title="确认开局" icon="fas fa-flag-checkered" size="sm">
      <div class="confirm-content">
        <p>确认后将生成正式的开局剧情内容，并开始游戏。</p>
        <p class="hint">开局剧情将添加到聊天记录中，开始您的官场之旅。</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="showConfirmDialog = false">取消</button>
        <button class="btn-primary" @click="confirmStartup"><i class="fas fa-rocket"></i> 开始游戏</button>
      </template>
    </Modal>

    <!-- 变量更新预览弹窗 -->
    <Modal v-model="showUpdatePreview" title="开局变量更新预览" icon="fas fa-code" size="lg" :closable="true">
      <div class="update-preview">
        <pre>{{ pendingData?.updateBlock || '无更新内容' }}</pre>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showUpdatePreview = false">关闭</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Modal } from '../components/common';
import { useGameData, useStartSetup } from '../stores';
import { GameSchema } from '../stores/schema';

// ═══ Stores ═══
const gameData = useGameData();
const startSetup = useStartSetup();

// ═══ 本地状态 ═══
const localDescription = ref('');
const showGenerateConfirm = ref(false);
const showConfirmDialog = ref(false);
const showUpdatePreview = ref(false);

// ═══ 从 Store 映射状态 ═══
const phase = computed(() => startSetup.phase);
const isGenerating = computed(() => startSetup.isGenerating);
const canGenerate = computed(() => startSetup.canGenerate);
const progress = computed(() => startSetup.progress);
const lastError = computed(() => startSetup.lastError);
const pendingData = computed(() => startSetup.pendingData);

// 本地计算属性
const descriptionLength = computed(() => localDescription.value.length);
// 只有在至少生成一次后才能确认开局
const canConfirmLocal = computed(() => phase.value === 'generated');

function handleGenerate() {
  showGenerateConfirm.value = true;
}

async function confirmGenerate() {
  showGenerateConfirm.value = false;
  // 使用 gameData.rawData 作为变量数据
  try {
    const validData = GameSchema.parse(gameData.rawData);
    await startSetup.requestGenerate(localDescription.value, validData as Record<string, unknown>);
  } catch (e) {
    toastr.error('数据验证失败: ' + String(e), '[绯色官途]');
  }
}

function handleConfirm() {
  showConfirmDialog.value = true;
}

async function confirmStartup() {
  showConfirmDialog.value = false;
  try {
    const validData = GameSchema.parse(gameData.rawData);
    await startSetup.requestConfirm(validData as Record<string, unknown>);
  } catch (e) {
    toastr.error('数据验证失败: ' + String(e), '[绯色官途]');
  }
}
</script>

<style lang="scss" scoped>
.start-setup-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-lg);
}

// ═══ 开局描述区 ═══
.description-section {
  flex: 1;
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);

    h3 {
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

    .char-count {
      font-size: 12px;
      color: var(--color-text-muted);

      &.warning {
        color: var(--color-warning);
      }
    }
  }

  .editor-wrapper {
    flex: 1;
    min-height: 200px;
  }

  .description-editor {
    width: 100%;
    height: 100%;
    padding: var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;
    line-height: 1.6;
    resize: none;

    &::placeholder {
      color: var(--color-text-muted);
      opacity: 0.7;
    }

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// ═══ 底部操作区 ═══
.setup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--color-border);

  .footer-status {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 13px;
    color: var(--color-text-secondary);

    i {
      font-size: 16px;
    }

    .success-icon {
      color: var(--color-success);
    }

    .error-icon {
      color: var(--color-danger);
    }
  }

  .footer-actions {
    display: flex;
    gap: var(--spacing-md);
  }

  .btn-generate,
  .btn-confirm {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-generate {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-gold);
    color: var(--color-gold);

    &:hover:not(:disabled) {
      background: rgba(216, 166, 87, 0.15);
    }
  }

  .btn-confirm {
    background: var(--color-gold);
    border: 1px solid var(--color-gold);
    color: var(--color-bg-dark);

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }
}

// ═══ 对话框内容 ═══
.confirm-content {
  text-align: center;
  padding: var(--spacing-md);

  p {
    margin: 0 0 var(--spacing-sm);
    font-size: 14px;
    color: var(--color-text-primary);
  }

  .hint {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

// ═══ 按钮样式 ═══
.btn-cancel {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  border: 1px solid var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
}

.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
  }
}

// ═══ 更新预览 ═══
.update-preview {
  pre {
    padding: var(--spacing-md);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 400px;
    overflow: auto;
  }
}
</style>
