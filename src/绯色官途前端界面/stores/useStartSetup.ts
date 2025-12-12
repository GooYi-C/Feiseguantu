// ═══════════════════════════════════════════════════════════════
// 绯色官途 · 开局配置 Store
// 管理游戏开局状态、配置和流程控制
// ═══════════════════════════════════════════════════════════════

import { klona } from 'klona';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// ═══ 开局状态枚举 ═══
export type StartupPhase =
  | 'idle' // 空闲（正常游戏模式）
  | 'editing' // 编辑开局配置中
  | 'generating' // 正在生成开局变量
  | 'generated' // 变量生成完成，等待确认
  | 'confirming' // 正在生成正式开局剧情
  | 'completed'; // 开局完成

// ═══ 开局图标状态枚举 ═══
export type StartupIconState =
  | 'ready' // 金色刷新图标 - 无任务时
  | 'generating' // 红色加载图标 - LLM解析中
  | 'minimized'; // 蓝色文本图标 - 弹窗最小化

// ═══ 事件名称定义 ═══
export const STARTUP_EVENTS = {
  // 开局流程事件
  STARTUP_PHASE_CHANGED: 'scarlet_startup_phase_changed',
  STARTUP_GENERATE_REQUESTED: 'scarlet_startup_generate_requested',
  STARTUP_CONFIRM_REQUESTED: 'scarlet_startup_confirm_requested',
  STARTUP_GENERATION_STARTED: 'scarlet_startup_generation_started',
  STARTUP_GENERATION_PROGRESS: 'scarlet_startup_generation_progress',
  STARTUP_GENERATION_COMPLETED: 'scarlet_startup_generation_completed',
  STARTUP_GENERATION_ERROR: 'scarlet_startup_generation_error',
  STARTUP_GENERATION_ABORTED: 'scarlet_startup_generation_aborted',
  // 开局剧情生成
  STARTUP_STORY_STARTED: 'scarlet_startup_story_started',
  STARTUP_STORY_COMPLETED: 'scarlet_startup_story_completed',
  STARTUP_STORY_ERROR: 'scarlet_startup_story_error',
  // 请求操作
  REQUEST_GENERATE_STARTUP: 'scarlet_request_generate_startup',
  REQUEST_CONFIRM_STARTUP: 'scarlet_request_confirm_startup',
  REQUEST_ABORT_STARTUP: 'scarlet_request_abort_startup',
  REQUEST_RECONFIGURE_STARTUP: 'scarlet_request_reconfigure_startup',
};

// ═══ 待确认的开局数据 ═══
export interface PendingStartupData {
  description: string; // 用户输入的开局描述
  variables: Record<string, unknown>; // 当前变量数据
  updateBlock: string; // LLM生成的变量更新语句
  rawResponse: string; // LLM原始响应
}

export const useStartSetup = defineStore('startSetup', () => {
  // ═══ 状态 ═══
  const phase = ref<StartupPhase>('idle');
  const isAtFloor0 = ref(false); // 是否在第0层
  const description = ref(''); // 用户输入的开局描述
  const pendingData = ref<PendingStartupData | null>(null);
  const progress = ref(''); // 当前进度描述
  const lastError = ref<string | null>(null);
  const isDialogMinimized = ref(false); // 弹窗是否最小化

  // ═══ 计算属性 ═══
  // 是否处于开局配置模式
  const isInStartupMode = computed(() => isAtFloor0.value);

  // 是否正在生成
  const isGenerating = computed(() => phase.value === 'generating' || phase.value === 'confirming');

  // 是否有待确认的数据
  const hasPendingData = computed(() => pendingData.value !== null);

  // 是否可以生成开局
  const canGenerate = computed(() => phase.value === 'editing' || phase.value === 'idle');

  // 是否可以确认开局
  const canConfirm = computed(() => phase.value === 'generated');

  // 图标状态
  const iconState = computed<StartupIconState>(() => {
    if (isGenerating.value) {
      return 'generating';
    }
    if (isDialogMinimized.value && hasPendingData.value) {
      return 'minimized';
    }
    return 'ready';
  });

  // 图标提示文本
  const iconTooltip = computed(() => {
    switch (iconState.value) {
      case 'generating':
        return `点击中断开局生成 (${progress.value || '生成中...'})`;
      case 'minimized':
        return '展开当前开局变量语句';
      default:
        return '重新配置开局';
    }
  });

  // ═══ 检测是否在第0层 ═══
  // 开局状态定义：
  // 1. 没有任何消息（新建聊天，lastMsgId = -1）
  // 2. 只有第0层消息（角色卡的首条消息/招呼语，lastMsgId = 0）
  async function checkFloor0(): Promise<boolean> {
    try {
      // 使用 try-catch 包装 getLastMessageId，因为在某些情况下可能未定义
      let lastMsgId: number | undefined = -1;
      try {
        lastMsgId = getLastMessageId();
      } catch {
        console.warn('[绯色官途开局] getLastMessageId 调用失败，可能脚本未加载');
        // 默认显示开局界面
        isAtFloor0.value = true;
        if (phase.value === 'idle') {
          phase.value = 'editing';
        }
        return true;
      }

      console.info('[绯色官途开局] getLastMessageId 返回:', lastMsgId);

      // getLastMessageId() 返回 -1 表示没有消息
      // 返回 0 表示只有一条消息（第0层）
      // 只要在第0层就显示开局界面（不检查消息内容，因为角色卡初始消息也包含StatusPlaceHolderImpl）
      const atFloor0 = lastMsgId === -1 || lastMsgId === 0 || lastMsgId === undefined;

      isAtFloor0.value = atFloor0;

      if (isAtFloor0.value && phase.value === 'idle') {
        phase.value = 'editing';
      } else if (!isAtFloor0.value && phase.value !== 'idle' && phase.value !== 'completed') {
        // 离开第0层后重置状态（但不在completed状态时重置，避免闪烁）
        resetState();
      }

      console.info('[绯色官途开局] 楼层检测结果:', { lastMsgId, isAtFloor0: isAtFloor0.value, phase: phase.value });
      return isAtFloor0.value;
    } catch (e) {
      console.warn('[绯色官途开局] 检测楼层失败:', e);
      // 出错时默认显示开局界面
      isAtFloor0.value = true;
      if (phase.value === 'idle') {
        phase.value = 'editing';
      }
      return true;
    }
  }

  // ═══ 设置开局描述 ═══
  function setDescription(text: string): void {
    description.value = text;
  }

  // ═══ 请求生成开局变量 ═══
  async function requestGenerate(desc: string, variables: Record<string, unknown>): Promise<void> {
    if (!canGenerate.value) {
      console.warn('[绯色官途开局] 当前状态不允许生成:', phase.value);
      return;
    }

    description.value = desc;
    phase.value = 'generating';
    progress.value = '正在准备...';
    lastError.value = null;

    // 发送事件到脚本层
    eventEmit(STARTUP_EVENTS.REQUEST_GENERATE_STARTUP, {
      description: desc,
      variables: klona(variables),
    });
  }

  // ═══ 请求确认开局 ═══
  async function requestConfirm(variables: Record<string, unknown>): Promise<void> {
    if (!canConfirm.value) {
      console.warn('[绯色官途开局] 当前状态不允许确认:', phase.value);
      return;
    }

    phase.value = 'confirming';
    progress.value = '正在生成开局剧情...';
    lastError.value = null;

    // 发送事件到脚本层
    eventEmit(STARTUP_EVENTS.REQUEST_CONFIRM_STARTUP, {
      description: description.value,
      variables: klona(variables),
      updateBlock: pendingData.value?.updateBlock || '',
    });
  }

  // ═══ 中断生成 ═══
  function abortGeneration(): void {
    if (!isGenerating.value) return;

    eventEmit(STARTUP_EVENTS.REQUEST_ABORT_STARTUP);
    phase.value = 'editing';
    progress.value = '';
  }

  // ═══ 重新配置开局（重置状态，允许重新生成） ═══
  function reconfigure(): void {
    // 如果已经生成过，重置到 editing 状态以允许重新生成
    pendingData.value = null;
    phase.value = 'editing';
    progress.value = '';
    lastError.value = null;
    isDialogMinimized.value = false;
    eventEmit(STARTUP_EVENTS.REQUEST_RECONFIGURE_STARTUP);
    toastr.info('已重置开局配置，可重新生成', '[绯色官途]');
  }

  // ═══ 重置状态 ═══
  function resetState(): void {
    phase.value = 'idle';
    description.value = '';
    pendingData.value = null;
    progress.value = '';
    lastError.value = null;
    isDialogMinimized.value = false;
  }

  // ═══ 切换弹窗最小化状态 ═══
  function toggleDialogMinimized(minimized?: boolean): void {
    isDialogMinimized.value = minimized ?? !isDialogMinimized.value;
  }

  // ═══ 处理图标点击 ═══
  function handleIconClick(): void {
    switch (iconState.value) {
      case 'generating':
        // 中断生成
        abortGeneration();
        break;
      case 'minimized':
        // 恢复弹窗
        isDialogMinimized.value = false;
        break;
      default:
        // 重新配置
        reconfigure();
        break;
    }
  }

  // ═══ 设置事件监听 ═══
  function setupEventListeners(): void {
    // 监听生成开始
    eventOn(STARTUP_EVENTS.STARTUP_GENERATION_STARTED, () => {
      phase.value = 'generating';
      progress.value = '开始生成...';
    });

    // 监听生成进度
    eventOn(STARTUP_EVENTS.STARTUP_GENERATION_PROGRESS, (msg: string) => {
      progress.value = msg;
    });

    // 监听生成完成
    eventOn(STARTUP_EVENTS.STARTUP_GENERATION_COMPLETED, (data: PendingStartupData) => {
      pendingData.value = data;
      phase.value = 'generated';
      progress.value = '';
      console.info('[绯色官途开局] 变量生成完成');
    });

    // 监听生成错误
    eventOn(STARTUP_EVENTS.STARTUP_GENERATION_ERROR, (error: string) => {
      lastError.value = error;
      phase.value = 'editing';
      progress.value = '';
      toastr.error(`开局生成失败: ${error}`, '[绯色官途]');
    });

    // 监听生成中断
    eventOn(STARTUP_EVENTS.STARTUP_GENERATION_ABORTED, () => {
      phase.value = 'editing';
      progress.value = '';
      toastr.info('已中断开局生成', '[绯色官途]');
    });

    // 监听开局剧情生成开始
    eventOn(STARTUP_EVENTS.STARTUP_STORY_STARTED, () => {
      phase.value = 'confirming';
      progress.value = '正在生成开局剧情...';
    });

    // 监听开局剧情生成完成
    eventOn(STARTUP_EVENTS.STARTUP_STORY_COMPLETED, () => {
      phase.value = 'completed';
      progress.value = '';
      isAtFloor0.value = false; // 开局完成后离开第0层
      toastr.success('开局完成！', '[绯色官途]');

      // 延迟重置状态，让UI有时间切换
      setTimeout(() => {
        resetState();
      }, 500);
    });

    // 监听开局剧情生成错误
    eventOn(STARTUP_EVENTS.STARTUP_STORY_ERROR, (error: string) => {
      lastError.value = error;
      phase.value = 'generated'; // 回退到变量已生成状态
      progress.value = '';
      toastr.error(`开局剧情生成失败: ${error}`, '[绯色官途]');
    });

    // 监听聊天变化，重新检测楼层
    eventOn(tavern_events.CHAT_CHANGED, () => {
      checkFloor0();
    });

    // 监听消息接收，检测是否离开第0层
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      checkFloor0();
    });
  }

  // ═══ 初始化 ═══
  async function initialize(): Promise<void> {
    setupEventListeners();
    await checkFloor0();
    console.info('[绯色官途开局] 初始化完成', { isAtFloor0: isAtFloor0.value, phase: phase.value });
  }

  return {
    // 状态
    phase,
    isAtFloor0,
    description,
    pendingData,
    progress,
    lastError,
    isDialogMinimized,

    // 计算属性
    isInStartupMode,
    isGenerating,
    hasPendingData,
    canGenerate,
    canConfirm,
    iconState,
    iconTooltip,

    // 方法
    checkFloor0,
    setDescription,
    requestGenerate,
    requestConfirm,
    abortGeneration,
    reconfigure,
    resetState,
    toggleDialogMinimized,
    handleIconClick,
    setupEventListeners,
    initialize,
  };
});
