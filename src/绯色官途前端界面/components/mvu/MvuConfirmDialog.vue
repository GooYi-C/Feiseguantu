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
              <span v-if="hasValidationErrors" class="validation-badge error">
                <i class="fas fa-exclamation-triangle"></i>
                {{ validationResult.errors.length }} 个验证错误
              </span>
              <span v-else class="validation-badge success">
                <i class="fas fa-check-circle"></i>
                验证通过
              </span>
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
                <div
                  v-for="(cmd, index) in parsedCommands"
                  :key="index"
                  :ref="el => setCommandRef(el, index)"
                  class="command-item"
                  :class="{
                    'has-error': hasCommandError(cmd),
                    'current-error': isCurrentError(index),
                  }"
                >
                  <div class="cmd-main">
                    <span class="cmd-type" :class="`type-${cmd.type}`">{{ cmd.type }}</span>
                    <span class="cmd-path">{{ cmd.path }}</span>
                    <span v-if="cmd.value !== undefined" class="cmd-arrow">→</span>
                    <span
                      v-if="cmd.value !== undefined"
                      class="cmd-value"
                      :class="{ 'value-error': hasCommandError(cmd) }"
                      >{{ formatValue(cmd.value) }}</span
                    >
                    <span v-if="cmd.reason" class="cmd-reason">// {{ cmd.reason }}</span>
                  </div>
                  <!-- 验证错误提示 - 显示所有相关错误 -->
                  <div v-if="hasCommandError(cmd)" class="cmd-errors">
                    <div v-for="(error, errIdx) in getCommandErrors(cmd)" :key="errIdx" class="cmd-error">
                      <i class="fas fa-times-circle"></i>
                      <span class="error-path">{{ error.path }}</span>
                      <span class="error-message">{{ error.message }}</span>
                      <span class="expected-type">期望: {{ getExpectedType(error.path) }}</span>
                    </div>
                  </div>
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
                  :ref="el => setCommandRef(el, index)"
                  class="interactive-item"
                  :class="[
                    `item-${cmd.type}`,
                    { 'item-error': hasCommandError(cmd) },
                    { 'current-error': isCurrentError(index) },
                  ]"
                >
                  <div class="item-header">
                    <span class="item-type" :class="`type-${cmd.type}`">{{ cmd.type }}</span>
                    <span class="item-path">{{ cmd.path }}</span>
                    <span
                      v-if="hasCommandError(cmd)"
                      class="item-error-icon"
                      :title="`${getCommandErrors(cmd).length} 个验证错误`"
                    >
                      <i class="fas fa-exclamation-triangle"></i>
                      <span class="error-count">{{ getCommandErrors(cmd).length }}</span>
                    </span>
                    <button class="btn-delete" title="删除此命令" @click="removeCommand(index)">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                  <!-- 验证错误提示 - 显示所有相关错误 -->
                  <div v-if="hasCommandError(cmd)" class="item-validation-errors">
                    <div v-for="(error, errIdx) in getCommandErrors(cmd)" :key="errIdx" class="item-validation-error">
                      <i class="fas fa-times-circle"></i>
                      <span class="error-field">{{ getFieldName(error.path, cmd.path) }}</span>
                      <span class="error-msg">{{ error.message }}</span>
                      <span class="expected-hint">期望: {{ getExpectedType(error.path) }}</span>
                    </div>
                  </div>
                  <div v-if="cmd.type !== 'delete' && cmd.type !== 'remove' && cmd.type !== 'unset'" class="item-value">
                    <label>新值:</label>
                    <input
                      v-if="typeof cmd.value === 'string' || typeof cmd.value === 'number'"
                      type="text"
                      :value="cmd.value"
                      :class="{ 'input-error': hasCommandError(cmd) }"
                      @input="updateCommandValue(index, ($event.target as HTMLInputElement).value)"
                    />
                    <textarea
                      v-else
                      :value="JSON.stringify(cmd.value, null, 2)"
                      rows="6"
                      :class="{ 'input-error': hasCommandError(cmd) }"
                      @input="updateCommandValueJson(index, ($event.target as HTMLTextAreaElement).value)"
                      @wheel="handleTextareaWheel"
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
            <!-- 有错误时显示"下一处错误"按钮 -->
            <button
              v-if="hasValidationErrors"
              class="btn-next-error"
              :title="`跳转到下一处错误 (${currentErrorIndex + 1}/${errorCommandIndices.length})`"
              @click="goToNextError"
            >
              <i class="fas fa-exclamation-circle"></i>
              下一处错误
              <span class="error-counter">({{ currentErrorIndex + 1 }}/{{ errorCommandIndices.length }})</span>
            </button>
            <button v-else class="btn-primary" title="确认应用变量更新" @click="handleConfirm">
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
import { getExpectedTypeDescription, validateCommands, type ValidationError } from '../../utils/zodValidator';

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

const editedUpdateBlock = ref(''); // 只保存 JSONPatch 内部的 JSON 内容
const codeEditor = ref<HTMLTextAreaElement | null>(null);
const viewMode = ref<'code' | 'interactive'>('interactive');
const showCancelConfirm = ref(false);

// 保存原始 <UpdateVariable>...</UpdateVariable> 完整内容
const originalUpdateVariable = ref('');

// 错误定位相关
const currentErrorIndex = ref(0);
const commandRefs = new Map<number, HTMLElement>();

// 设置命令元素的 ref（处理 Vue template ref 类型）
function setCommandRef(el: unknown, index: number) {
  if (el && el instanceof HTMLElement) {
    commandRefs.set(index, el);
  } else {
    commandRefs.delete(index);
  }
}

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

// ZOD 验证结果
const validationResult = computed(() => {
  return validateCommands(parsedCommands.value);
});

// 是否有验证错误
const hasValidationErrors = computed(() => !validationResult.value.isValid);

// 获取命令的所有相关验证错误（使用路径前缀匹配）
// 例如：命令路径 /人物库/刘娜，错误路径 /人物库/刘娜/体系 -> 匹配成功
function getCommandErrors(cmd: ParsedCommand): ValidationError[] {
  const errors: ValidationError[] = [];
  const allErrors = validationResult.value.errors;

  for (const error of allErrors) {
    // 精确匹配或前缀匹配（错误路径以命令路径开头）
    if (error.path === cmd.path || error.path.startsWith(cmd.path + '/')) {
      errors.push(error);
    }
  }
  return errors;
}

// 获取命令的第一个验证错误（向后兼容）
function getCommandError(cmd: ParsedCommand): ValidationError | undefined {
  const errors = getCommandErrors(cmd);
  return errors.length > 0 ? errors[0] : undefined;
}

// 检查命令是否有错误
function hasCommandError(cmd: ParsedCommand): boolean {
  return getCommandErrors(cmd).length > 0;
}

// 获取所有有错误的命令索引
const errorCommandIndices = computed(() => {
  const indices: number[] = [];
  parsedCommands.value.forEach((cmd, index) => {
    if (hasCommandError(cmd)) {
      indices.push(index);
    }
  });
  return indices;
});

// 判断某个命令是否是当前定位的错误
function isCurrentError(index: number): boolean {
  if (!hasValidationErrors.value || errorCommandIndices.value.length === 0) {
    return false;
  }
  const currentCmdIndex = errorCommandIndices.value[currentErrorIndex.value];
  return index === currentCmdIndex;
}

// 跳转到下一个错误（循环）
function goToNextError() {
  if (errorCommandIndices.value.length === 0) return;

  // 更新错误索引（循环）
  currentErrorIndex.value = (currentErrorIndex.value + 1) % errorCommandIndices.value.length;

  // 获取当前错误对应的命令索引
  const cmdIndex = errorCommandIndices.value[currentErrorIndex.value];
  const cmd = parsedCommands.value[cmdIndex];
  const errors = getCommandErrors(cmd);
  const firstError = errors[0];

  // 获取错误的具体字段名（用于在文本中搜索定位）
  const errorFieldName = firstError ? getFieldName(firstError.path, cmd.path) : '';

  if (viewMode.value === 'code') {
    // 代码视图：定位到代码编辑器中的错误位置
    scrollToErrorInCodeEditor(cmd, errorFieldName);
  } else {
    // 交互视图：滚动到命令，并定位到内部 textarea 的错误字段
    scrollToErrorInInteractiveView(cmdIndex, errorFieldName);
  }
}

// 在代码编辑器中定位到错误
function scrollToErrorInCodeEditor(cmd: ParsedCommand, fieldName: string) {
  const editor = codeEditor.value;
  if (!editor) return;

  const content = editor.value;

  // 首先尝试找到命令的路径位置
  const searchTarget = cmd.path;
  let position = content.indexOf(`"path": "${searchTarget}"`);

  if (position === -1) {
    position = content.indexOf(`"path":"${searchTarget}"`);
  }

  // 如果有具体的错误字段，尝试在该命令附近找到该字段
  if (position !== -1 && fieldName && fieldName !== '根字段') {
    // 从命令位置开始，向后搜索字段名
    const fieldPos = content.indexOf(`"${fieldName}"`, position);
    if (fieldPos !== -1 && fieldPos < position + 2000) {
      // 找到了字段，定位到这里
      position = fieldPos;
    }
  }

  if (position !== -1) {
    // 选中并滚动到该位置
    editor.focus();
    editor.setSelectionRange(position, position + (fieldName || searchTarget).length + 2);

    // 计算滚动位置 - 让选中的文本居中
    const textBefore = content.substring(0, position);
    const lines = textBefore.split('\n');
    const lineNumber = lines.length;
    const lineHeight = 18; // 大约的行高
    const scrollTop = Math.max(0, (lineNumber - 10) * lineHeight);
    editor.scrollTop = scrollTop;

    // 添加视觉反馈
    editor.classList.add('editor-flash');
    setTimeout(() => editor.classList.remove('editor-flash'), 1000);
  }
}

// 在交互视图中定位到错误
function scrollToErrorInInteractiveView(cmdIndex: number, fieldName: string) {
  const targetEl = commandRefs.get(cmdIndex);
  if (!targetEl) return;

  // 滚动到命令元素
  targetEl.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  // 添加闪烁效果
  targetEl.classList.add('error-flash');
  setTimeout(() => {
    targetEl.classList.remove('error-flash');
  }, 1000);

  // 尝试定位到内部 textarea 中的错误字段
  if (fieldName && fieldName !== '根字段') {
    setTimeout(() => {
      const textarea = targetEl.querySelector('textarea');
      if (textarea) {
        const content = textarea.value;
        const fieldPos = content.indexOf(`"${fieldName}"`);
        if (fieldPos !== -1) {
          // 计算滚动位置
          const textBefore = content.substring(0, fieldPos);
          const lines = textBefore.split('\n');
          const lineNumber = lines.length;
          const lineHeight = 20; // 大约的行高

          // 滚动 textarea 到字段位置
          textarea.scrollTop = Math.max(0, (lineNumber - 2) * lineHeight);

          // 选中字段
          textarea.focus();
          textarea.setSelectionRange(fieldPos, fieldPos + fieldName.length + 2);
        }
      }
    }, 300); // 等待滚动动画完成
  }
}

// 获取预期类型描述
function getExpectedType(path: string): string {
  return getExpectedTypeDescription(path);
}

// 从错误路径中提取相对字段名
// 例如：errorPath="/人物库/刘娜/体系", cmdPath="/人物库/刘娜" => "体系"
function getFieldName(errorPath: string, cmdPath: string): string {
  if (errorPath === cmdPath) {
    return '根字段';
  }
  const relative = errorPath.slice(cmdPath.length);
  // 移除开头的斜杠
  return relative.startsWith('/') ? relative.slice(1) : relative;
}

// 处理 textarea 滚动 - 减小滚动步长
function handleTextareaWheel(event: WheelEvent) {
  const target = event.target as HTMLTextAreaElement;
  if (!target) return;

  // 减小滚动步长（原来的 1/4）
  const scrollAmount = event.deltaY * 0.25;

  // 阻止默认滚动
  event.preventDefault();

  // 应用自定义滚动
  target.scrollTop += scrollAmount;
}

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
    // 保持原始字符串值，不自动转换为数字
    // 这样可以保留前导零（如时间格式 "09:20"）
    // Zod 验证会自动处理类型转换
    commands[index].value = newValue;
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
  // 重建完整的 UpdateVariable 块，包含修改后的 JSONPatch
  const finalUpdateBlock = rebuildFinalUpdateBlock();
  emit('confirm', finalUpdateBlock);
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

// 从 UpdateVariable 块中提取 JSONPatch 内容
function extractJsonPatch(updateBlock: string): string {
  // 保存原始完整内容
  originalUpdateVariable.value = updateBlock;

  // 尝试提取 <JSONPatch>...</JSONPatch> 内容
  const jsonPatchMatch = updateBlock.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);
  if (jsonPatchMatch) {
    return jsonPatchMatch[1].trim();
  }

  // 如果没有 JSONPatch 标签，尝试提取 JSON 数组
  const jsonArrayMatch = updateBlock.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    return jsonArrayMatch[0];
  }

  // 返回原始内容
  return updateBlock;
}

// 将修改后的 JSONPatch 内容合并回原始 UpdateVariable 块
function rebuildFinalUpdateBlock(): string {
  const original = originalUpdateVariable.value;
  const editedJson = editedUpdateBlock.value;

  // 如果原始内容包含 <JSONPatch> 标签，替换其中的内容
  if (original.includes('<JSONPatch>')) {
    return original.replace(/<JSONPatch>[\s\S]*?<\/JSONPatch>/i, `<JSONPatch>\n${editedJson}\n</JSONPatch>`);
  }

  // 如果原始内容包含 <UpdateVariable> 但没有 <JSONPatch>，添加 JSONPatch 标签
  if (original.includes('<UpdateVariable>')) {
    // 在 </UpdateVariable> 前插入 JSONPatch
    return original.replace(/<\/UpdateVariable>/i, `<JSONPatch>\n${editedJson}\n</JSONPatch>\n</UpdateVariable>`);
  }

  // 否则包装完整结构
  return `<UpdateVariable>\n<JSONPatch>\n${editedJson}\n</JSONPatch>\n</UpdateVariable>`;
}

// 监听数据变化
watch(
  () => props.pendingData,
  newData => {
    if (newData) {
      // 提取 JSONPatch 内容供编辑
      editedUpdateBlock.value = extractJsonPatch(newData.updateBlock);
    }
  },
  { immediate: true },
);

// 当错误列表变化时，重置当前错误索引
watch(
  () => errorCommandIndices.value,
  newIndices => {
    if (newIndices.length === 0) {
      currentErrorIndex.value = 0;
    } else if (currentErrorIndex.value >= newIndices.length) {
      currentErrorIndex.value = 0;
    }
  },
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

  .validation-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-sm);

    &.error {
      background: rgba(255, 107, 107, 0.15);
      color: var(--color-danger);
      animation: pulse-error 2s infinite;
    }

    &.success {
      background: rgba(74, 193, 142, 0.15);
      color: var(--color-success);
    }
  }

  @keyframes pulse-error {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
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
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);

  &:focus {
    border-color: var(--color-gold);
    outline: none;
  }

  // 定位错误时的闪烁效果
  &.editor-flash {
    animation: editor-flash-anim 0.5s ease-in-out 2;
    border-color: var(--color-danger);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.3);
  }
}

@keyframes editor-flash-anim {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.5);
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

// 验证错误样式
.command-item {
  &.has-error {
    background: rgba(255, 107, 107, 0.08);
    border-left: 3px solid var(--color-danger);
    padding-left: var(--spacing-sm);
    margin-left: calc(-1 * var(--spacing-sm));
  }

  // 当前定位的错误 - 更明显的高亮
  &.current-error {
    background: rgba(255, 107, 107, 0.2) !important;
    border-left: 4px solid var(--color-danger) !important;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
    position: relative;

    &::before {
      content: '→';
      position: absolute;
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-danger);
      font-weight: bold;
      font-size: 16px;
    }
  }

  // 闪烁效果
  &.error-flash {
    animation: error-flash-anim 0.5s ease-in-out 2;
  }

  .cmd-main {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .value-error {
    color: var(--color-danger) !important;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .cmd-errors {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }

  .cmd-error {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: rgba(255, 107, 107, 0.1);
    border-radius: var(--radius-sm);
    font-size: 11px;

    i {
      color: var(--color-danger);
      flex-shrink: 0;
    }

    .error-path {
      color: var(--color-danger);
      font-weight: 600;
      font-family: var(--font-mono);
      background: rgba(255, 107, 107, 0.15);
      padding: 1px 4px;
      border-radius: 2px;
    }

    .error-message {
      color: var(--color-danger);
      font-weight: 500;
    }

    .expected-type {
      color: var(--color-text-muted);
      font-style: italic;
      margin-left: auto;
    }
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

  // 验证错误状态
  &.item-error {
    border-color: var(--color-danger) !important;
    border-left: 3px solid var(--color-danger) !important;
    background: rgba(255, 107, 107, 0.05);

    &:hover {
      border-color: var(--color-danger) !important;
    }
  }

  // 当前定位的错误 - 更明显的高亮
  &.current-error {
    border-color: var(--color-danger) !important;
    border-left: 4px solid var(--color-danger) !important;
    background: rgba(255, 107, 107, 0.15) !important;
    box-shadow:
      0 0 0 3px rgba(255, 107, 107, 0.25),
      0 4px 12px rgba(255, 107, 107, 0.2);
    transform: scale(1.01);
    position: relative;

    &::after {
      content: '当前错误';
      position: absolute;
      top: -10px;
      right: 10px;
      background: var(--color-danger);
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  }

  // 闪烁效果
  &.error-flash {
    animation: error-flash-anim 0.5s ease-in-out 2;
  }
}

// 错误闪烁动画
@keyframes error-flash-anim {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.25);
  }
  50% {
    box-shadow:
      0 0 0 6px rgba(255, 107, 107, 0.5),
      0 0 20px rgba(255, 107, 107, 0.3);
  }
}

.item-error-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-danger);
  animation: pulse-error 2s infinite;

  .error-count {
    font-size: 11px;
    font-weight: 600;
    background: var(--color-danger);
    color: white;
    padding: 1px 5px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }
}

.item-validation-errors {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.item-validation-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(255, 107, 107, 0.1);
  border-radius: var(--radius-sm);
  font-size: 12px;

  i {
    color: var(--color-danger);
    flex-shrink: 0;
  }

  .error-field {
    color: var(--color-danger);
    font-weight: 600;
    font-family: var(--font-mono);
    background: rgba(255, 107, 107, 0.2);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  .error-msg {
    color: var(--color-danger);
  }

  .expected-hint {
    color: var(--color-text-muted);
    font-style: italic;
    font-size: 11px;
    margin-left: auto;
  }
}

.input-error {
  border-color: var(--color-danger) !important;
  background: rgba(255, 107, 107, 0.05) !important;

  &:focus {
    border-color: var(--color-danger) !important;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2) !important;
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
    min-height: 120px;
    max-height: 300px;
    overflow-y: auto;
    scroll-behavior: smooth;

    // 优化滚动条样式
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: var(--color-bg-dark);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-text-muted);
      border-radius: 4px;

      &:hover {
        background: var(--color-text-secondary);
      }
    }
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

.btn-next-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  background: var(--color-danger);
  border: none;
  color: white;
  transition: all var(--transition-fast);

  &:hover {
    filter: brightness(1.1);
  }

  .error-counter {
    font-size: 12px;
    opacity: 0.9;
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
