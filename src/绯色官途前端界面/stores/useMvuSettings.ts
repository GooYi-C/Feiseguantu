// ═══════════════════════════════════════════════════════════════
// 绯色官途 · MVU设置 Store
// 与MVU脚本交互，管理额外模型解析配置
// ═══════════════════════════════════════════════════════════════

import { klona } from 'klona';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { z } from 'zod';

// ═══ 配置Schema定义 (与脚本保持一致) ═══
const ApiConfigSchema = z
  .object({
    apiUrl: z.string().default('http://localhost:1234/v1'),
    apiKey: z.string().default(''),
    modelName: z.string().default(''),
    maxTokens: z.coerce.number().default(4096),
    temperature: z.coerce
      .number()
      .default(1)
      .transform(v => Math.max(0, Math.min(2, v))),
    frequencyPenalty: z.coerce
      .number()
      .default(0)
      .transform(v => Math.max(-2, Math.min(2, v))),
    presencePenalty: z.coerce
      .number()
      .default(0)
      .transform(v => Math.max(-2, Math.min(2, v))),
    topP: z.coerce
      .number()
      .default(1)
      .transform(v => Math.max(0, Math.min(1, v))),
  })
  .prefault({});

// Prompt配置Schema
const PromptConfigSchema = z
  .object({
    sendPreset: z.boolean().default(false),
    selectedLorebooks: z.array(z.string()).default([]), // 保留向后兼容
    selectedEntries: z.array(z.string()).default([]), // 新增：选中的条目 uid 列表
    customSystemPrompt: z.string()
      .default(`你是一个变量更新助手。请根据以下剧情内容，分析变量应该如何变化，并输出变量更新命令。

规则：
1. 仔细阅读<past_observe>中的剧情内容
2. 根据世界书中的变量定义和更新规则，分析变量变化
3. 只输出变量更新命令，不要输出任何剧情内容
4. 使用以下格式输出：

<UpdateVariable>
<Analysis>
变量名: Y/N (是否需要更新)
</Analysis>
_.set('变量路径', 新值);//更新原因
</UpdateVariable>`),
    customUserPrompt: z.string().default('请根据上述剧情内容，分析并输出变量更新命令。'), // 用户请求后缀
    maxChatHistory: z.coerce.number().default(2),
    includeCharDescription: z.boolean().default(false),
    includeCharPersonality: z.boolean().default(false),
    includeScenario: z.boolean().default(false),
  })
  .prefault({});

const SettingsSchema = z
  .object({
    enableExtraModelParsing: z.boolean().default(false),
    useMainApi: z.boolean().default(true), // 与插头相同
    apiConfig: ApiConfigSchema,
    promptConfig: PromptConfigSchema,
    savedProfiles: z
      .array(
        z.object({
          name: z.string(),
          config: ApiConfigSchema,
        }),
      )
      .default([]),
    activeProfileName: z.string().default('默认'),
    internal: z
      .object({
        lastUsedModel: z.string().default(''),
        cachedModelList: z.array(z.string()).default([]),
        cachedModelListTime: z.number().default(0),
      })
      .prefault({}),
  })
  .prefault({});

export type MvuSettings = z.infer<typeof SettingsSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type PromptConfig = z.infer<typeof PromptConfigSchema>;

// ═══ 世界书条目信息 ═══
export interface LorebookEntryInfo {
  uid: string; // 条目唯一标识: `${lorebookName}::${entryId}`
  lorebookName: string; // 所属世界书名称
  entryId: number; // 条目ID
  comment: string; // 条目名称/注释
  keys: string[]; // 关键词
  constant: boolean; // 是否常驻 (蓝灯)
  position: string; // 位置描述
  depth: number; // 深度
  order: number; // 顺序
}

// ═══ 世界书信息 ═══
export interface LorebookInfo {
  name: string;
  entries: number;
  entryList: LorebookEntryInfo[]; // 条目列表
}

// ═══ 事件名称 (与脚本保持一致) ═══
export const SCARLET_MVU_EVENTS = {
  SETTINGS_CHANGED: 'scarlet_mvu_settings_changed',
  PARSING_STARTED: 'scarlet_mvu_parsing_started',
  PARSING_PROGRESS: 'scarlet_mvu_parsing_progress',
  PARSING_COMPLETED: 'scarlet_mvu_parsing_completed',
  PARSING_ABORTED: 'scarlet_mvu_parsing_aborted',
  PARSING_ERROR: 'scarlet_mvu_parsing_error',
  VARIABLE_UPDATED: 'scarlet_mvu_variable_updated', // 变量更新完成
  CONFIRM_UPDATE: 'scarlet_mvu_confirm_update',
  CONFIRM_RESULT: 'scarlet_mvu_confirm_result',
  MODEL_LIST_UPDATED: 'scarlet_mvu_model_list_updated',
  MODEL_LIST_FETCH_ERROR: 'scarlet_mvu_model_list_fetch_error',
  LOREBOOK_LIST_UPDATED: 'scarlet_mvu_lorebook_list_updated',
  PROMPT_PREVIEW_UPDATED: 'scarlet_mvu_prompt_preview_updated',
  REQUEST_RETRY_PARSING: 'scarlet_mvu_request_retry_parsing',
  REQUEST_ABORT_PARSING: 'scarlet_mvu_request_abort_parsing',
  REQUEST_FETCH_MODELS: 'scarlet_mvu_request_fetch_models',
  REQUEST_FETCH_LOREBOOKS: 'scarlet_mvu_request_fetch_lorebooks',
  REQUEST_PREVIEW_PROMPT: 'scarlet_mvu_request_preview_prompt',
  REQUEST_SAVE_SETTINGS: 'scarlet_mvu_request_save_settings',
  REQUEST_GET_SETTINGS: 'scarlet_mvu_request_get_settings',
  SETTINGS_RESPONSE: 'scarlet_mvu_settings_response',
  // 生成拦截相关
  GENERATION_BLOCKED: 'scarlet_mvu_generation_blocked',
  GENERATION_BLOCK_CONFIRMED: 'scarlet_mvu_generation_block_confirmed',
};

// ═══ 待确认更新数据 ═══
export interface PendingUpdateData {
  messageId: number;
  originalMessage: string;
  updateBlock: string;
  rawResponse: string;
}

export const useMvuSettings = defineStore('mvuSettings', () => {
  // ═══ 状态 ═══
  const settings = ref<MvuSettings>(SettingsSchema.parse({}));
  const isScriptLoaded = ref(false);
  const isParsingInProgress = ref(false);
  const parsingProgress = ref('');
  const modelList = ref<string[]>([]);
  const isLoadingModels = ref(false);
  const modelListError = ref('');
  const pendingUpdate = ref<PendingUpdateData | null>(null);
  const showConfirmDialog = ref(false);

  // 生成拦截相关状态
  const showBlockConfirm = ref(false);
  const blockConfirmMessage = ref('');

  // 世界书相关状态
  const lorebookList = ref<LorebookInfo[]>([]);
  const isLoadingLorebooks = ref(false);

  // Prompt预览相关状态
  const promptPreview = ref('');
  const isLoadingPreview = ref(false);

  // ═══ 计算属性 ═══
  const isEnabled = computed(() => settings.value.enableExtraModelParsing);
  const currentApiConfig = computed(() => settings.value.apiConfig);
  const currentPromptConfig = computed(() => settings.value.promptConfig);
  const savedProfiles = computed(() => settings.value.savedProfiles);
  const activeProfileName = computed(() => settings.value.activeProfileName);

  // ═══ 检查脚本是否已加载 ═══
  function checkScriptLoaded(): boolean {
    const api = (window.parent as any)?.ScarletMvu;
    if (api) {
      isScriptLoaded.value = true;
      return true;
    }
    isScriptLoaded.value = false;
    return false;
  }

  // ═══ 获取脚本API ═══

  function getScriptApi(): any {
    return (window.parent as any)?.ScarletMvu;
  }

  // ═══ 从脚本加载设置 ═══
  async function loadSettings(): Promise<void> {
    const api = getScriptApi();
    if (api) {
      const scriptSettings = api.getSettings();
      if (scriptSettings) {
        settings.value = SettingsSchema.parse(scriptSettings);
        modelList.value = settings.value.internal.cachedModelList || [];
      }
    }
  }

  // ═══ 保存设置到脚本 ═══
  function saveSettings(): void {
    const api = getScriptApi();
    if (api) {
      api.saveSettings(klona(settings.value));
    } else {
      eventEmit(SCARLET_MVU_EVENTS.REQUEST_SAVE_SETTINGS, klona(settings.value));
    }
  }

  // ═══ 切换额外模型解析 ═══
  function toggleExtraModelParsing(enabled: boolean): void {
    settings.value.enableExtraModelParsing = enabled;
    saveSettings();
  }

  // ═══ 更新API配置 ═══
  function updateApiConfig(config: Partial<ApiConfig>): void {
    settings.value.apiConfig = ApiConfigSchema.parse({
      ...settings.value.apiConfig,
      ...config,
    });
    saveSettings();
  }

  // ═══ 更新Prompt配置 ═══
  function updatePromptConfig(config: Partial<PromptConfig>): void {
    settings.value.promptConfig = PromptConfigSchema.parse({
      ...settings.value.promptConfig,
      ...config,
    });
    saveSettings();
  }

  // ═══ 获取模型列表 ═══
  async function fetchModelList(): Promise<void> {
    isLoadingModels.value = true;
    modelListError.value = '';

    try {
      const api = getScriptApi();
      if (api) {
        const models = await api.fetchModels(settings.value.apiConfig.apiUrl, settings.value.apiConfig.apiKey);
        modelList.value = models;
      } else {
        eventEmit(SCARLET_MVU_EVENTS.REQUEST_FETCH_MODELS, {
          apiUrl: settings.value.apiConfig.apiUrl,
          apiKey: settings.value.apiConfig.apiKey,
        });
      }
    } catch (error) {
      modelListError.value = String(error);
    } finally {
      isLoadingModels.value = false;
    }
  }

  // ═══ 获取世界书列表 ═══
  async function fetchLorebookList(): Promise<void> {
    isLoadingLorebooks.value = true;

    try {
      const api = getScriptApi();
      if (api) {
        const lorebooks = await api.fetchLorebooks();
        lorebookList.value = lorebooks;
      } else {
        eventEmit(SCARLET_MVU_EVENTS.REQUEST_FETCH_LOREBOOKS);
      }
    } catch (error) {
      console.error('获取世界书列表失败:', error);
    } finally {
      isLoadingLorebooks.value = false;
    }
  }

  // ═══ 切换世界书选中状态 (保留向后兼容) ═══
  function toggleLorebookSelection(lorebookName: string): void {
    const index = settings.value.promptConfig.selectedLorebooks.indexOf(lorebookName);
    if (index >= 0) {
      settings.value.promptConfig.selectedLorebooks.splice(index, 1);
    } else {
      settings.value.promptConfig.selectedLorebooks.push(lorebookName);
    }
    saveSettings();
  }

  // ═══ 切换条目选中状态 ═══
  function toggleEntrySelection(entryUid: string): void {
    const index = settings.value.promptConfig.selectedEntries.indexOf(entryUid);
    if (index >= 0) {
      settings.value.promptConfig.selectedEntries.splice(index, 1);
    } else {
      settings.value.promptConfig.selectedEntries.push(entryUid);
    }
    saveSettings();
  }

  // ═══ 全选/取消全选某世界书的所有条目 ═══
  function toggleAllEntriesInLorebook(lorebookName: string, selected: boolean): void {
    const lorebook = lorebookList.value.find(lb => lb.name === lorebookName);
    if (!lorebook) return;

    const entryUids = lorebook.entryList.map(e => e.uid);

    if (selected) {
      // 全选：添加所有不在列表中的条目
      for (const uid of entryUids) {
        if (!settings.value.promptConfig.selectedEntries.includes(uid)) {
          settings.value.promptConfig.selectedEntries.push(uid);
        }
      }
    } else {
      // 取消全选：移除所有该世界书的条目
      settings.value.promptConfig.selectedEntries = settings.value.promptConfig.selectedEntries.filter(
        uid => !entryUids.includes(uid),
      );
    }
    saveSettings();
  }

  // ═══ 检查某世界书是否有条目被选中 ═══
  function isLorebookPartiallySelected(lorebookName: string): boolean {
    const lorebook = lorebookList.value.find(lb => lb.name === lorebookName);
    if (!lorebook) return false;
    const entryUids = lorebook.entryList.map(e => e.uid);
    return entryUids.some(uid => settings.value.promptConfig.selectedEntries.includes(uid));
  }

  // ═══ 检查某世界书是否全部条目被选中 ═══
  function isLorebookFullySelected(lorebookName: string): boolean {
    const lorebook = lorebookList.value.find(lb => lb.name === lorebookName);
    if (!lorebook || lorebook.entryList.length === 0) return false;
    const entryUids = lorebook.entryList.map(e => e.uid);
    return entryUids.every(uid => settings.value.promptConfig.selectedEntries.includes(uid));
  }

  // ═══ 获取Prompt预览 ═══
  async function fetchPromptPreview(): Promise<void> {
    isLoadingPreview.value = true;

    try {
      const api = getScriptApi();
      if (api) {
        const preview = await api.getPromptPreview();
        promptPreview.value = preview;
      } else {
        eventEmit(SCARLET_MVU_EVENTS.REQUEST_PREVIEW_PROMPT);
      }
    } catch (error) {
      console.error('获取Prompt预览失败:', error);
    } finally {
      isLoadingPreview.value = false;
    }
  }

  // ═══ 选择模型 ═══
  function selectModel(modelName: string): void {
    settings.value.apiConfig.modelName = modelName;
    settings.value.internal.lastUsedModel = modelName;
    saveSettings();
  }

  // ═══ 配置文件管理 ═══
  function saveProfile(name: string): void {
    const existingIndex = settings.value.savedProfiles.findIndex(p => p.name === name);
    const profile = {
      name,
      config: klona(settings.value.apiConfig),
    };

    if (existingIndex >= 0) {
      settings.value.savedProfiles[existingIndex] = profile;
    } else {
      settings.value.savedProfiles.push(profile);
    }

    settings.value.activeProfileName = name;
    saveSettings();
  }

  function loadProfile(name: string): void {
    const profile = settings.value.savedProfiles.find(p => p.name === name);
    if (profile) {
      settings.value.apiConfig = klona(profile.config);
      settings.value.activeProfileName = name;
      saveSettings();
    }
  }

  function deleteProfile(name: string): void {
    const index = settings.value.savedProfiles.findIndex(p => p.name === name);
    if (index >= 0) {
      settings.value.savedProfiles.splice(index, 1);
      if (settings.value.activeProfileName === name) {
        settings.value.activeProfileName = '默认';
      }
      saveSettings();
    }
  }

  // ═══ 重试解析 ═══
  async function retryParsing(): Promise<void> {
    const api = getScriptApi();
    if (api) {
      if (api.isParsingInProgress()) {
        api.abortParsing();
      } else {
        api.retryParsing();
      }
    } else if (isParsingInProgress.value) {
      eventEmit(SCARLET_MVU_EVENTS.REQUEST_ABORT_PARSING);
    } else {
      eventEmit(SCARLET_MVU_EVENTS.REQUEST_RETRY_PARSING);
    }
  }

  // ═══ 确认/取消更新 ═══
  function confirmUpdate(confirmed: boolean, editedUpdateBlock?: string): void {
    const api = getScriptApi();
    if (api) {
      api.confirmUpdate(confirmed, editedUpdateBlock || pendingUpdate.value?.updateBlock);
    } else {
      eventEmit(SCARLET_MVU_EVENTS.CONFIRM_RESULT, {
        confirmed,
        updateBlock: editedUpdateBlock || pendingUpdate.value?.updateBlock,
      });
    }
    showConfirmDialog.value = false;
    pendingUpdate.value = null;
  }

  // ═══ 确认/取消生成拦截 ═══
  function confirmGenerationBlock(confirmed: boolean): void {
    eventEmit(SCARLET_MVU_EVENTS.GENERATION_BLOCK_CONFIRMED, confirmed);
    showBlockConfirm.value = false;
    blockConfirmMessage.value = '';
  }

  // ═══ 设置事件监听 ═══
  function setupEventListeners(): void {
    // 监听设置变更
    eventOn(SCARLET_MVU_EVENTS.SETTINGS_CHANGED, (newSettings: MvuSettings) => {
      settings.value = SettingsSchema.parse(newSettings);
      modelList.value = settings.value.internal.cachedModelList || [];
    });

    // 监听解析状态
    eventOn(SCARLET_MVU_EVENTS.PARSING_STARTED, () => {
      isParsingInProgress.value = true;
      parsingProgress.value = '开始解析...';
    });

    eventOn(SCARLET_MVU_EVENTS.PARSING_PROGRESS, (progress: string) => {
      parsingProgress.value = progress;
    });

    eventOn(SCARLET_MVU_EVENTS.PARSING_COMPLETED, () => {
      isParsingInProgress.value = false;
      parsingProgress.value = '';
    });

    // 监听变量更新完成事件，触发UI刷新
    eventOn(SCARLET_MVU_EVENTS.VARIABLE_UPDATED, () => {
      console.info('[绯色官途MVU] 变量更新完成，触发UI刷新');
      // 这里可以添加额外的刷新逻辑，例如重新加载数据
      // 前端的 useGameData store 会通过 MVU 事件自动刷新
    });

    eventOn(SCARLET_MVU_EVENTS.PARSING_ABORTED, () => {
      isParsingInProgress.value = false;
      parsingProgress.value = '';
      // 清理待确认状态，将图标恢复为黄色
      pendingUpdate.value = null;
      showConfirmDialog.value = false;
    });

    eventOn(SCARLET_MVU_EVENTS.PARSING_ERROR, () => {
      isParsingInProgress.value = false;
      parsingProgress.value = '';
    });

    // 监听确认更新请求
    eventOn(SCARLET_MVU_EVENTS.CONFIRM_UPDATE, (data: PendingUpdateData) => {
      pendingUpdate.value = data;
      showConfirmDialog.value = true;
    });

    // 监听模型列表更新
    eventOn(SCARLET_MVU_EVENTS.MODEL_LIST_UPDATED, (models: string[]) => {
      modelList.value = models;
      isLoadingModels.value = false;
    });

    eventOn(SCARLET_MVU_EVENTS.MODEL_LIST_FETCH_ERROR, (error: string) => {
      modelListError.value = error;
      isLoadingModels.value = false;
    });

    // 监听世界书列表更新
    eventOn(SCARLET_MVU_EVENTS.LOREBOOK_LIST_UPDATED, (lorebooks: LorebookInfo[]) => {
      lorebookList.value = lorebooks;
      isLoadingLorebooks.value = false;
    });

    // 监听Prompt预览更新
    eventOn(SCARLET_MVU_EVENTS.PROMPT_PREVIEW_UPDATED, (preview: string) => {
      promptPreview.value = preview;
      isLoadingPreview.value = false;
    });

    // 监听设置响应
    eventOn(SCARLET_MVU_EVENTS.SETTINGS_RESPONSE, (newSettings: MvuSettings) => {
      settings.value = SettingsSchema.parse(newSettings);
      modelList.value = settings.value.internal.cachedModelList || [];
    });

    // 监听生成拦截事件
    eventOn(SCARLET_MVU_EVENTS.GENERATION_BLOCKED, (data: { reason: string; message: string }) => {
      blockConfirmMessage.value = data.message;
      showBlockConfirm.value = true;
    });
  }

  // ═══ 初始化 ═══
  async function initialize(): Promise<void> {
    checkScriptLoaded();
    setupEventListeners();
    await loadSettings();

    // Bug 1 修复：初始化时同步脚本的解析状态
    // 前端 iframe 可能在脚本已经开始解析后才加载，需要同步状态
    const api = getScriptApi();
    if (api) {
      const isParsing = api.isParsingInProgress();
      if (isParsing) {
        isParsingInProgress.value = true;
        parsingProgress.value = '正在解析...';
      }
      // 同步待确认状态
      const pending = api.getPendingConfirmation();
      if (pending) {
        pendingUpdate.value = pending;
        showConfirmDialog.value = true;
      }
    }

    watch(
      () => settings.value,
      () => {
        // 不在这里自动保存，由各个修改函数单独处理
      },
      { deep: true },
    );
  }

  return {
    // 状态
    settings,
    isScriptLoaded,
    isParsingInProgress,
    parsingProgress,
    modelList,
    isLoadingModels,
    modelListError,
    pendingUpdate,
    showConfirmDialog,
    showBlockConfirm,
    blockConfirmMessage,
    lorebookList,
    isLoadingLorebooks,
    promptPreview,
    isLoadingPreview,

    // 计算属性
    isEnabled,
    currentApiConfig,
    currentPromptConfig,
    savedProfiles,
    activeProfileName,

    // 方法
    checkScriptLoaded,
    loadSettings,
    saveSettings,
    toggleExtraModelParsing,
    updateApiConfig,
    updatePromptConfig,
    fetchModelList,
    fetchLorebookList,
    toggleLorebookSelection,
    toggleEntrySelection,
    toggleAllEntriesInLorebook,
    isLorebookPartiallySelected,
    isLorebookFullySelected,
    fetchPromptPreview,
    selectModel,
    saveProfile,
    loadProfile,
    deleteProfile,
    retryParsing,
    confirmUpdate,
    confirmGenerationBlock,
    setupEventListeners,
    initialize,
  };
});
