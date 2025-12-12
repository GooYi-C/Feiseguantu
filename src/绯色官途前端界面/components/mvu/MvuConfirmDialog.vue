<template>
  <Teleport to="body">
    <!-- 最小化状态时不显示主弹窗，但保持overlay用于提示 -->
    <Transition name="modal">
      <div v-if="modelValue && !isMinimized" class="mvu-confirm-overlay" @click.self="handleMinimize">
        <div class="mvu-confirm-dialog">
          <!-- 头部 -->
          <header class="dialog-header">
            <div class="header-title">
              <i class="fas fa-code-branch"></i>
              <span>变量更新确认</span>
              <span class="cmd-count">{{ parsedCommands.length }} 条命令</span>
            </div>
            <div class="header-actions">
              <!-- 视图切换 -->
              <div class="view-toggle">
                <button
                  class="toggle-btn"
                  :class="{ active: viewMode === 'code' }"
                  title="代码视图"
                  @click="viewMode = 'code'"
                >
                  <i class="fas fa-code"></i>
                </button>
                <button
                  class="toggle-btn"
                  :class="{ active: viewMode === 'interactive' }"
                  title="交互视图"
                  @click="viewMode = 'interactive'"
                >
                  <i class="fas fa-sliders-h"></i>
                </button>
              </div>
              <button class="btn-action" title="最小化" @click="handleMinimize">
                <i class="fas fa-window-minimize"></i>
              </button>
              <button class="btn-action btn-close" title="取消" @click="handleCancelClick">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </header>

          <!-- 内容 -->
          <div class="dialog-body">
            <!-- 代码视图 -->
            <div v-if="viewMode === 'code'" class="view-code">
              <div class="section-label">
                <i class="fas fa-edit"></i>
                变量更新代码
                <span class="label-hint">可编辑</span>
              </div>
              <textarea ref="codeEditor" v-model="editedUpdateBlock" class="code-editor" spellcheck="false"></textarea>

              <div class="section-label mt-lg">
                <i class="fas fa-list-check"></i>
                解析预览
              </div>
              <div class="preview-content parsed-preview">
                <div v-for="(cmd, index) in parsedCommands" :key="index" class="command-item">
                  <span class="cmd-type" :class="`type-${cmd.type}`">{{ cmd.type }}</span>
                  <span class="cmd-path">{{ cmd.path }}</span>
                  <span v-if="cmd.value !== undefined" class="cmd-arrow">→</span>
                  <span v-if="cmd.value !== undefined" class="cmd-value">{{ formatValue(cmd.value) }}</span>
                  <span v-if="cmd.reason" class="cmd-reason">// {{ cmd.reason }}</span>
                </div>
                <div v-if="parsedCommands.length === 0" class="no-commands">
                  <i class="fas fa-exclamation-circle"></i>
                  未检测到有效的变量更新命令
                </div>
              </div>
            </div>

            <!-- 交互视图 -->
            <div v-else class="view-interactive">
              <div class="section-label">
                <i class="fas fa-sliders-h"></i>
                交互式编辑
                <span class="label-hint">可直接修改值</span>
              </div>

              <div v-if="parsedCommands.length === 0" class="no-commands-card">
                <i class="fas fa-inbox"></i>
                <p>未检测到有效的变量更新命令</p>
                <button class="btn-switch" @click="viewMode = 'code'">
                  <i class="fas fa-code"></i>
                  切换到代码视图编辑
                </button>
              </div>

              <div v-else class="interactive-list">
                <div
                  v-for="(cmd, index) in parsedCommands"
                  :key="index"
                  class="interactive-item"
                  :class="`item-${cmd.type}`"
                >
                  <div class="item-header">
                    <span class="item-type" :class="`type-${cmd.type}`">{{ cmd.type }}</span>
                    <span class="item-path">{{ cmd.path }}</span>
                    <button class="btn-delete" title="删除此命令" @click="removeCommand(index)">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <div v-if="cmd.type !== 'delete' && cmd.type !== 'remove' && cmd.type !== 'unset'" class="item-value">
                    <label>新值:</label>
                    <input
                      v-if="typeof cmd.value === 'string' || typeof cmd.value === 'number'"
                      type="text"
                      :value="cmd.value"
                      @input="updateCommandValue(index, ($event.target as HTMLInputElement).value)"
                    />
                    <textarea
                      v-else
                      :value="JSON.stringify(cmd.value, null, 2)"
                      rows="2"
                      @input="updateCommandValueJson(index, ($event.target as HTMLTextAreaElement).value)"
                    ></textarea>
                  </div>
                  <div v-if="cmd.reason" class="item-reason">
                    <i class="fas fa-comment-dots"></i>
                    {{ cmd.reason }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <footer class="dialog-footer">
            <button class="btn-secondary" @click="handleCancelClick">
              <i class="fas fa-times"></i>
              取消
            </button>
            <button class="btn-minimize" @click="handleMinimize">
              <i class="fas fa-window-minimize"></i>
              最小化
            </button>
            <button class="btn-primary" @click="handleConfirm">
              <i class="fas fa-check"></i>
              确认应用
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- 取消确认对话框 -->
    <Transition name="fade">
      <div v-if="showCancelConfirm" class="cancel-confirm-overlay" @click.self="showCancelConfirm = false">
        <div class="cancel-confirm-dialog">
          <div class="confirm-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3>确认取消？</h3>
          <p>取消后将丢弃本次变量更新，此操作无法撤销。</p>
          <div class="confirm-actions">
            <button class="btn-back" @click="showCancelConfirm = false">
              <i class="fas fa-arrow-left"></i>
              返回
            </button>
            <button class="btn-confirm-cancel" @click="confirmCancel">
              <i class="fas fa-times"></i>
              确认取消
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PendingUpdateData } from '../../stores';

interface Props {
  modelValue: boolean;
  pendingData: PendingUpdateData | null;
  isMinimized: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:isMinimized', value: boolean): void;
  (e: 'confirm', updateBlock: string): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editedUpdateBlock = ref('');
const codeEditor = ref<HTMLTextAreaElement | null>(null);
const viewMode = ref<'code' | 'interactive'>('interactive');
const showCancelConfirm = ref(false);

// 解析的命令列表
interface ParsedCommand {
  type: string;
  path: string;
  value?: unknown;
  reason?: string;
}

const parsedCommands = computed<ParsedCommand[]>(() => {
  const commands: ParsedCommand[] = [];
  const content = editedUpdateBlock.value;

  // 方法1: 优先尝试整体解析为 JSON 数组（JSON Patch 格式）
  try {
    const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      const parsed = JSON.parse(jsonArrayMatch[0]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.op && item.path) {
            commands.push({
              type: item.op,
              path: item.path,
              value: item.value,
              reason: item.reason,
            });
          }
        }
      }
    }
  } catch {
    // JSON 解析失败，继续尝试其他方法
  }

  // 如果 JSON 数组解析没有结果，尝试其他方法
  if (commands.length === 0) {
    // 方法2: 匹配 _.set/add/insert/delete 等命令
    const cmdRegex =
      /_\.(set|insert|assign|remove|unset|delete|add)\s*\(\s*(['"`])([^'"`]+)\2\s*(?:,\s*([^)]+))?\s*\)\s*;?\s*(?:\/\/\s*(.*))?/g;

    let match;
    while ((match = cmdRegex.exec(content)) !== null) {
      const [, type, , path, valueStr, reason] = match;
      let value: unknown;

      if (valueStr) {
        try {
          const trimmed = valueStr.trim();
          if (
            (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))
          ) {
            value = trimmed.slice(1, -1);
          } else if (trimmed === 'true') {
            value = true;
          } else if (trimmed === 'false') {
            value = false;
          } else if (trimmed === 'null') {
            value = null;
          } else if (!isNaN(Number(trimmed))) {
            value = Number(trimmed);
          } else {
            try {
              value = JSON.parse(trimmed);
            } catch {
              value = trimmed;
            }
          }
        } catch {
          value = valueStr;
        }
      }

      commands.push({
        type,
        path,
        value,
        reason: reason?.trim(),
      });
    }

    // 方法3: 尝试逐个匹配 JSON Patch 对象
    if (commands.length === 0) {
      const jsonObjectRegex = /\{[^{}]*"op"\s*:\s*"[^"]+"\s*,\s*"path"\s*:\s*"[^"]+"[^{}]*\}/g;
      let objMatch;
      while ((objMatch = jsonObjectRegex.exec(content)) !== null) {
        try {
          const item = JSON.parse(objMatch[0]);
          if (item.op && item.path) {
            commands.push({
              type: item.op,
              path: item.path,
              value: item.value,
              reason: item.reason,
            });
          }
        } catch {
          // 单个对象解析失败，继续下一个
        }
      }
    }
  }

  return commands;
});

// 格式化值显示 - 完整显示，不截断
function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// 从交互视图更新命令值
function updateCommandValue(index: number, newValue: string) {
  const commands = [...parsedCommands.value];
  if (commands[index]) {
    // 尝试解析为数字
    const numValue = Number(newValue);
    commands[index].value = isNaN(numValue) ? newValue : numValue;
    rebuildUpdateBlock(commands);
  }
}

function updateCommandValueJson(index: number, jsonStr: string) {
  try {
    const commands = [...parsedCommands.value];
    if (commands[index]) {
      commands[index].value = JSON.parse(jsonStr);
      rebuildUpdateBlock(commands);
    }
  } catch {
    // JSON解析失败，忽略
  }
}

function removeCommand(index: number) {
  const commands = parsedCommands.value.filter((_, i) => i !== index);
  rebuildUpdateBlock(commands);
}

// 根据命令列表重建更新代码
function rebuildUpdateBlock(commands: ParsedCommand[]) {
  // 检测原始格式
  const isJsonPatch = editedUpdateBlock.value.includes('"op"');

  if (isJsonPatch) {
    // JSON Patch 格式
    const patches = commands.map(cmd => ({
      op: cmd.type,
      path: cmd.path,
      value: cmd.value,
      ...(cmd.reason ? { reason: cmd.reason } : {}),
    }));
    editedUpdateBlock.value = JSON.stringify(patches, null, 2);
  } else {
    // Lodash 格式
    const lines = commands.map(cmd => {
      const valuePart = cmd.value !== undefined ? `, ${JSON.stringify(cmd.value)}` : '';
      const reasonPart = cmd.reason ? `//${cmd.reason}` : '';
      return `_.${cmd.type}('${cmd.path}'${valuePart});${reasonPart}`;
    });
    editedUpdateBlock.value = lines.join('\n');
  }
}

// 最小化
function handleMinimize() {
  emit('update:isMinimized', true);
}

// 从最小化恢复（由外部调用）
function restore() {
  emit('update:isMinimized', false);
}

function handleConfirm() {
  emit('confirm', editedUpdateBlock.value);
  emit('update:modelValue', false);
  emit('update:isMinimized', false);
}

function handleCancelClick() {
  showCancelConfirm.value = true;
}

function confirmCancel() {
  showCancelConfirm.value = false;
  emit('cancel');
  emit('update:modelValue', false);
  emit('update:isMinimized', false);
}

// 监听数据变化
watch(
  () => props.pendingData,
  newData => {
    if (newData) {
      editedUpdateBlock.value = newData.updateBlock;
    }
  },
  { immediate: true },
);

// 暴露restore方法给父组件
defineExpose({ restore });
</script>

<style lang="scss" scoped>
.mvu-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--spacing-lg);
  z-index: var(--z-modal);
}

.mvu-confirm-dialog {
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

// ═══ Header ═══
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);

  i {
    color: var(--color-gold);
  }

  .cmd-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-muted);
    background: var(--color-bg-dark);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.view-toggle {
  display: flex;
  background: var(--color-bg-dark);
  border-radius: var(--radius-sm);
  padding: 2px;
  margin-right: var(--spacing-sm);

  .toggle-btn {
    padding: 6px 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-xs);
    color: var(--color-text-muted);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }

    &.active {
      background: var(--color-gold);
      color: var(--color-bg-dark);
    }
  }
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-dark);
    color: var(--color-text-primary);
  }

  &.btn-close:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
}

// ═══ Body ═══
.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.section-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);

  i {
    color: var(--color-gold);
  }
}

.mt-lg {
  margin-top: var(--spacing-lg);
}

.label-hint {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-muted);
  background: var(--color-bg-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

// ═══ Code View ═══
.code-editor {
  width: 100%;
  min-height: 180px;
  padding: var(--spacing-md);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
  resize: vertical;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-gold);
    outline: none;
  }
}

.preview-content {
  padding: var(--spacing-md);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.parsed-preview {
  max-height: 300px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;

  & + & {
    border-top: 1px solid var(--color-border);
  }
}

.cmd-type {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10px;
  flex-shrink: 0;

  &.type-set,
  &.type-replace {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }

  &.type-add {
    background: rgba(122, 162, 247, 0.2);
    color: var(--color-info);
  }

  &.type-insert,
  &.type-assign {
    background: rgba(216, 166, 87, 0.2);
    color: var(--color-gold);
  }

  &.type-delete,
  &.type-remove,
  &.type-unset {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
}

.cmd-path {
  color: var(--color-text-primary);
  word-break: break-all;
}

.cmd-arrow {
  color: var(--color-text-muted);
}

.cmd-value {
  color: var(--color-success);
  word-break: break-all;
}

.cmd-reason {
  width: 100%;
  color: var(--color-text-muted);
  font-style: italic;
  padding-left: var(--spacing-sm);
}

.no-commands {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-lg);

  i {
    margin-right: var(--spacing-xs);
  }
}

// ═══ Interactive View ═══
.no-commands-card {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg-dark);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);

  i {
    font-size: 32px;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }

  p {
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-md);
  }

  .btn-switch {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);

    i {
      font-size: 14px;
      margin-right: var(--spacing-xs);
      margin-bottom: 0;
    }

    &:hover {
      background: var(--color-bg-card);
      color: var(--color-gold);
    }
  }
}

.interactive-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.interactive-item {
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-gold);
  }

  &.item-delete,
  &.item-remove,
  &.item-unset {
    border-left: 3px solid var(--color-danger);
  }

  &.item-set,
  &.item-replace {
    border-left: 3px solid var(--color-success);
  }

  &.item-add,
  &.item-insert {
    border-left: 3px solid var(--color-info);
  }
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.item-type {
  @extend .cmd-type;
}

.item-path {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-primary);
  word-break: break-all;
}

.btn-delete {
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all var(--transition-fast);

  .interactive-item:hover & {
    opacity: 1;
  }

  &:hover {
    color: var(--color-danger);
    background: rgba(255, 107, 107, 0.1);
  }
}

.item-value {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  input,
  textarea {
    padding: var(--spacing-sm);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-text-primary);
    transition: border-color var(--transition-fast);

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.item-reason {
  margin-top: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;

  i {
    margin-right: var(--spacing-xs);
  }
}

// ═══ Footer ═══
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.btn-secondary,
.btn-primary,
.btn-minimize {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
}

.btn-minimize {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-dark);
    color: var(--color-text-primary);
  }
}

.btn-primary {
  background: var(--color-gold);
  color: var(--color-bg-dark);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ═══ Cancel Confirm Dialog ═══
.cancel-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-modal) + 1);
}

.cancel-confirm-dialog {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  text-align: center;

  .confirm-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto var(--spacing-md);
    background: rgba(255, 193, 7, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 28px;
      color: var(--color-warning, #ffc107);
    }
  }

  h3 {
    font-size: 18px;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
  }

  p {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0 0 var(--spacing-lg);
  }

  .confirm-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
  }

  .btn-back,
  .btn-confirm-cancel {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-lg);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    transition: all var(--transition-fast);
  }

  .btn-back {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    color: var(--color-text-secondary);

    &:hover {
      background: var(--color-bg-dark);
      color: var(--color-text-primary);
    }
  }

  .btn-confirm-cancel {
    background: var(--color-danger);
    color: white;

    &:hover {
      filter: brightness(1.1);
    }
  }
}

// ═══ Transitions ═══
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;

  .mvu-confirm-dialog {
    transition: all 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .mvu-confirm-dialog {
    transform: translateY(100%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
