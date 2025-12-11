<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="mvu-confirm-overlay" @click.self="handleCollapse">
        <div class="mvu-confirm-dialog" :class="{ collapsed: isCollapsed }">
          <!-- 头部 -->
          <header class="dialog-header">
            <div class="header-title">
              <i class="fas fa-code-branch"></i>
              <span>变量更新确认</span>
            </div>
            <div class="header-actions">
              <button class="btn-action" :title="isCollapsed ? '展开' : '收起'" @click="toggleCollapse">
                <i :class="isCollapsed ? 'fas fa-expand' : 'fas fa-compress'"></i>
              </button>
              <button class="btn-action btn-close" title="取消" @click="handleCancel">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </header>

          <!-- 内容 -->
          <div v-show="!isCollapsed" class="dialog-body">
            <!-- 更新代码编辑 -->
            <div class="edit-section">
              <div class="section-label">
                <i class="fas fa-edit"></i>
                变量更新代码
                <span class="label-hint">可编辑</span>
              </div>
              <textarea ref="codeEditor" v-model="editedUpdateBlock" class="code-editor" spellcheck="false"></textarea>
            </div>

            <!-- 解析预览 -->
            <div class="preview-section">
              <div class="section-label">
                <i class="fas fa-list-check"></i>
                解析预览
              </div>
              <div class="preview-content parsed-preview">
                <div v-for="(cmd, index) in parsedCommands" :key="index" class="command-item">
                  <span class="cmd-type" :class="`type-${cmd.type}`">{{ cmd.type }}</span>
                  <span class="cmd-path">{{ cmd.path }}</span>
                  <span v-if="cmd.value !== undefined" class="cmd-value"> → {{ formatValue(cmd.value) }} </span>
                  <span v-if="cmd.reason" class="cmd-reason">// {{ cmd.reason }}</span>
                </div>
                <div v-if="parsedCommands.length === 0" class="no-commands">未检测到有效的变量更新命令</div>
              </div>
            </div>
          </div>

          <!-- 底部操作 -->
          <footer v-show="!isCollapsed" class="dialog-footer">
            <button class="btn-secondary" @click="handleCancel">
              <i class="fas fa-times"></i>
              取消
            </button>
            <button class="btn-primary" :disabled="parsedCommands.length === 0" @click="handleConfirm">
              <i class="fas fa-check"></i>
              确认应用
            </button>
          </footer>

          <!-- 收起状态的迷你视图 -->
          <div v-if="isCollapsed" class="collapsed-content">
            <span class="collapsed-info"> {{ parsedCommands.length }} 条更新命令待确认 </span>
            <button class="btn-mini" @click="toggleCollapse">
              <i class="fas fa-expand"></i>
              展开查看
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
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', updateBlock: string): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isCollapsed = ref(false);
const editedUpdateBlock = ref('');
const codeEditor = ref<HTMLTextAreaElement | null>(null);

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
  // 这是最准确的方法，能正确处理数组、对象等复杂值
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
              reason: item.reason, // JSON Patch 可能包含 reason 字段
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
          // 尝试解析值
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
            // 尝试解析为 JSON（处理数组等）
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
      // 匹配所有独立的 JSON 对象
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

// 切换收起/展开
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function handleCollapse() {
  isCollapsed.value = true;
}

function handleConfirm() {
  emit('confirm', editedUpdateBlock.value);
  emit('update:modelValue', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

// 监听数据变化
watch(
  () => props.pendingData,
  newData => {
    if (newData) {
      editedUpdateBlock.value = newData.updateBlock;
      isCollapsed.value = false;
    }
  },
  { immediate: true },
);
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
  max-width: 700px;
  max-height: 80vh;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;

  &.collapsed {
    max-height: auto;
  }
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
}

.header-actions {
  display: flex;
  gap: var(--spacing-xs);
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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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

.label-hint {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-muted);
  background: var(--color-bg-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.preview-content {
  padding: var(--spacing-md);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
}

.message-preview {
  max-height: 100px;
  overflow-y: auto;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

// ═══ Code Editor ═══
.code-editor {
  width: 100%;
  min-height: 150px;
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

// ═══ Parsed Preview ═══
.parsed-preview {
  max-height: 250px;
  overflow-y: auto;
}

.command-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.4;

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

  &.type-set {
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
}

.cmd-path {
  word-break: break-all;
}

.cmd-value {
  color: var(--color-success);
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.cmd-reason {
  width: 100%;
  color: var(--color-text-muted);
  font-style: italic;
  margin-top: var(--spacing-xs);
}

.no-commands {
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-md);
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
.btn-primary {
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

// ═══ Collapsed Content ═══
.collapsed-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
}

.collapsed-info {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.btn-mini {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-gold);
  border-radius: var(--radius-sm);
  color: var(--color-bg-dark);
  font-size: 12px;
  font-weight: 600;

  &:hover {
    filter: brightness(1.1);
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
</style>
