<template>
  <div class="prompt-manager">
    <h3 class="section-title">
      <i class="fas fa-cog"></i>
      Prompt 配置
    </h3>

    <!-- 世界书规则说明 -->
    <div class="config-section info-section">
      <div class="info-box">
        <i class="fas fa-info-circle"></i>
        <div class="info-content">
          <p><strong>世界书条目过滤规则（自动应用）：</strong></p>
          <ul>
            <li>带 <code>[mvu_update]</code> 的条目 → 仅发送给额外模型(LLM2)</li>
            <li>带 <code>[mvu_plot]</code> 的条目 → 仅发送给主模型(LLM1)</li>
            <li>两者都不带的条目 → 同时发送给LLM1和LLM2</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 基础设置 -->
    <div class="config-section">
      <h4 class="subsection-title">基础设置</h4>

      <label class="checkbox-item">
        <input type="checkbox" :checked="promptConfig.sendPreset" @change="toggleSendPreset" />
        <span>发送预设（通常不建议，预设用于角色扮演而非变量更新）</span>
      </label>

      <div class="form-group">
        <label>聊天历史数量</label>
        <input type="number" :value="promptConfig.maxChatHistory" min="0" max="10" @change="updateMaxChatHistory" />
      </div>
    </div>

    <!-- 自定义系统Prompt (前缀) -->
    <div class="config-section">
      <h4 class="subsection-title">自定义指引 Prompt（前缀）</h4>
      <p class="prompt-position-hint">
        <i class="fas fa-info-circle"></i>
        此Prompt将始终放置在发送给LLM的Prompt最前方（System位置）
      </p>
      <textarea
        class="prompt-textarea"
        :value="promptConfig.customSystemPrompt"
        placeholder="输入自定义的系统指引..."
        rows="10"
        @input="updateCustomPrompt"
      ></textarea>
    </div>

    <!-- 自定义用户Prompt (后缀) -->
    <div class="config-section">
      <h4 class="subsection-title">用户请求 Prompt（后缀）</h4>
      <p class="prompt-position-hint">
        <i class="fas fa-info-circle"></i>
        此Prompt将作为用户消息放置在Prompt末尾，用于引导LLM输出变量更新
      </p>
      <textarea
        class="prompt-textarea prompt-textarea-short"
        :value="promptConfig.customUserPrompt"
        placeholder="输入用户请求..."
        rows="3"
        @input="updateUserPrompt"
      ></textarea>
    </div>

    <!-- Prompt预览 -->
    <div class="config-section">
      <h4 class="subsection-title">
        <span>Prompt 预览</span>
        <button class="btn-small" :disabled="isLoadingPreview" @click="refreshPreview">
          <i class="fas fa-eye" :class="{ 'fa-spin': isLoadingPreview }"></i>
          {{ isLoadingPreview ? '加载中...' : '刷新预览' }}
        </button>
      </h4>

      <div v-if="promptPreview" class="prompt-preview">
        <pre>{{ promptPreview }}</pre>
      </div>
      <div v-else class="empty-state">
        <p>点击"刷新预览"查看将发送给LLM的完整Prompt</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMvuSettings } from '../../stores';

const mvuSettings = useMvuSettings();

const promptConfig = computed(() => mvuSettings.currentPromptConfig);
const promptPreview = computed(() => mvuSettings.promptPreview);
const isLoadingPreview = computed(() => mvuSettings.isLoadingPreview);

function toggleSendPreset(e: Event) {
  const target = e.target as HTMLInputElement;
  mvuSettings.updatePromptConfig({ sendPreset: target.checked });
}

function updateMaxChatHistory(e: Event) {
  const target = e.target as HTMLInputElement;
  mvuSettings.updatePromptConfig({ maxChatHistory: parseInt(target.value) || 2 });
}

function updateCustomPrompt(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  mvuSettings.updatePromptConfig({ customSystemPrompt: target.value });
}

function updateUserPrompt(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  mvuSettings.updatePromptConfig({ customUserPrompt: target.value });
}

function refreshPreview() {
  mvuSettings.fetchPromptPreview();
}

onMounted(() => {
  // 页面挂载时不需要额外初始化
});
</script>

<style lang="scss" scoped>
.prompt-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);

  i {
    color: var(--color-gold);
  }
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);

  &.info-section {
    background: rgba(var(--color-info-rgb, 59, 130, 246), 0.1);
    border-color: rgba(var(--color-info-rgb, 59, 130, 246), 0.3);
  }
}

.info-box {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;

  > i {
    color: var(--color-info, #3b82f6);
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-content {
    flex: 1;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-secondary);

    p {
      margin: 0 0 var(--spacing-xs) 0;
    }

    ul {
      margin: 0;
      padding-left: var(--spacing-lg);

      li {
        margin-bottom: var(--spacing-xs);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    code {
      background: var(--color-bg-tertiary);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--color-gold);
    }
  }
}

.subsection-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary);

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  &:hover {
    color: var(--color-text-primary);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  input[type='number'] {
    width: 80px;
    padding: 6px 8px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 13px;

    &:focus {
      outline: none;
      border-color: var(--color-gold);
    }
  }
}

.subsection-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.selected-count {
  font-size: 11px;
  color: var(--color-gold);
  background: rgba(216, 166, 87, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.entry-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);

  i {
    color: var(--color-gold);
  }
}

.lorebook-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  min-height: 100px;
  overflow-y: auto;
  overflow-x: hidden;

  // 确保滚动条可见
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg-dark);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 4px;

    &:hover {
      background: var(--color-text-muted);
    }
  }
}

.lorebook-group {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.lorebook-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-elevated);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(216, 166, 87, 0.1);
  }

  > i {
    font-size: 10px;
    color: var(--color-text-muted);
    width: 12px;
  }
}

.lorebook-checkbox {
  flex: 1;
  margin: 0;
}

.lorebook-name {
  flex: 1;
  font-weight: 500;
}

.lorebook-count {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.entry-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
  max-height: 200px;
  overflow-y: auto;

  // 滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg-dark);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;

    &:hover {
      background: var(--color-text-muted);
    }
  }
}

.entry-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  padding-left: calc(var(--spacing-sm) + 24px);
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(216, 166, 87, 0.05);
  }

  &.constant {
    background: rgba(122, 162, 247, 0.05);
  }
}

.entry-indicator {
  font-size: 8px;
  color: var(--color-success);

  &.constant {
    color: var(--color-info);
  }
}

.entry-comment {
  flex: 1;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-keys {
  max-width: 120px;
  font-size: 10px;
  color: var(--color-text-muted);
  background: var(--color-bg-dark);
  padding: 1px 4px;
  border-radius: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-position {
  font-size: 10px;
  color: var(--color-gold);
  background: rgba(216, 166, 87, 0.1);
  padding: 1px 4px;
  border-radius: 2px;
}

// 展开动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

.prompt-position-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-text-muted);
  background: rgba(216, 166, 87, 0.1);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-gold);
  margin-bottom: var(--spacing-sm);

  i {
    color: var(--color-gold);
  }
}

.prompt-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--spacing-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: var(--color-gold);
  }

  &.prompt-textarea-short {
    min-height: 60px;
  }
}

.prompt-preview {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-sm);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    line-height: 1.4;
    color: var(--color-text-secondary);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 13px;
  text-align: center;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
    border-color: var(--color-gold);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-small {
  padding: 6px 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  &:hover:not(:disabled) {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    border-color: var(--color-gold);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
