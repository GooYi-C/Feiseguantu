/**
 * ═══════════════════════════════════════════════════════════════
 * 绯色官途 · MVU辅助脚本
 * 用于与MVU变量框架交互，实现额外模型解析等功能
 * ═══════════════════════════════════════════════════════════════
 */

import { klona } from 'klona';
import { z } from 'zod';

// ═══ 配置Schema定义 ═══
const ApiConfigSchema = z
  .object({
    // API基础配置
    apiUrl: z.string().default('http://localhost:1234/v1'),
    apiKey: z.string().default(''),
    modelName: z.string().default(''),

    // 请求参数
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
    // 是否发送预设 (默认不发送，因为预设通常是角色扮演)
    sendPreset: z.boolean().default(false),

    // 选中的世界书列表 (向后兼容)
    selectedLorebooks: z.array(z.string()).default([]),

    // 选中的条目列表 (细粒度选择，格式: `${lorebookName}::${entryId}`)
    selectedEntries: z.array(z.string()).default([]),

    // 自定义指引prompt (系统前缀)
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

    // 自定义用户请求prompt (后缀)
    customUserPrompt: z.string().default('请根据上述剧情内容，分析并输出变量更新命令。'),

    // 聊天历史数量
    maxChatHistory: z.coerce.number().default(2),

    // 是否包含角色描述
    includeCharDescription: z.boolean().default(false),

    // 是否包含角色人设
    includeCharPersonality: z.boolean().default(false),

    // 是否包含场景描述
    includeScenario: z.boolean().default(false),

    // 【开发者配置】Prompt过滤正则表达式列表
    // 在发送给LLM2的prompt中删除所有匹配项
    // 示例: ['^<StatusPlaceHolderImpl/>', '\\[mvu_plot\\]']
    promptFilterPatterns: z.array(z.string()).default(['<StatusPlaceHolderImpl/>']),
  })
  .prefault({});

const SettingsSchema = z
  .object({
    // 是否启用额外模型解析
    enableExtraModelParsing: z.boolean().default(false),

    // 是否使用酒馆主API（与插头相同）
    useMainApi: z.boolean().default(true),

    // API配置（仅在 useMainApi 为 false 时使用）
    apiConfig: ApiConfigSchema,

    // Prompt配置
    promptConfig: PromptConfigSchema,

    // 配置文件管理
    savedProfiles: z
      .array(
        z.object({
          name: z.string(),
          config: ApiConfigSchema,
        }),
      )
      .default([]),
    activeProfileName: z.string().default('默认'),

    // 内部状态
    internal: z
      .object({
        lastUsedModel: z.string().default(''),
        cachedModelList: z.array(z.string()).default([]),
        cachedModelListTime: z.number().default(0),
      })
      .prefault({}),
  })
  .prefault({});

type Settings = z.infer<typeof SettingsSchema>;

// ═══ 全局状态 ═══
let settings: Settings;
let isParsingInProgress = false;
let shouldAbortParsing = false;
let currentGenerationId: string | null = null; // 用于中断生成
let originalStreamSetting: boolean | null = null;
let pendingConfirmation: {
  messageId: number;
  originalMessage: string;
  updateBlock: string;
  rawResponse: string;
} | null = null;
let isInExtraModelParsing = false; // 标记当前是否在额外模型解析中（用于世界书过滤）
let messageReceivedListener: EventOnReturn | null = null; // 消息接收监听器
let generationStoppedListener: EventOnReturn | null = null; // 生成中止监听器
let generationStartedListener: EventOnReturn | null = null; // 生成开始监听器（用于拦截）
let wasGenerationStopped = false; // 标记主API是否被用户主动中止
let pendingRegenerate = false; // 标记是否需要在确认后重新生成
let blockedUserMessageId: number | null = null; // 记录被拦截时用户消息的 ID，用于取消时删除

// ═══ 事件名称定义 ═══
export const SCARLET_MVU_EVENTS = {
  // 设置变更
  SETTINGS_CHANGED: 'scarlet_mvu_settings_changed',
  // 解析状态
  PARSING_STARTED: 'scarlet_mvu_parsing_started',
  PARSING_PROGRESS: 'scarlet_mvu_parsing_progress',
  PARSING_COMPLETED: 'scarlet_mvu_parsing_completed',
  PARSING_ABORTED: 'scarlet_mvu_parsing_aborted',
  PARSING_ERROR: 'scarlet_mvu_parsing_error',
  // 变量更新完成（用于通知前端刷新UI）
  VARIABLE_UPDATED: 'scarlet_mvu_variable_updated',
  // 用户确认
  CONFIRM_UPDATE: 'scarlet_mvu_confirm_update',
  CONFIRM_RESULT: 'scarlet_mvu_confirm_result',
  // 模型列表
  MODEL_LIST_UPDATED: 'scarlet_mvu_model_list_updated',
  MODEL_LIST_FETCH_ERROR: 'scarlet_mvu_model_list_fetch_error',
  // 世界书列表
  LOREBOOK_LIST_UPDATED: 'scarlet_mvu_lorebook_list_updated',
  // Prompt预览
  PROMPT_PREVIEW_UPDATED: 'scarlet_mvu_prompt_preview_updated',
  // 请求操作
  REQUEST_RETRY_PARSING: 'scarlet_mvu_request_retry_parsing',
  REQUEST_ABORT_PARSING: 'scarlet_mvu_request_abort_parsing',
  REQUEST_FETCH_MODELS: 'scarlet_mvu_request_fetch_models',
  REQUEST_FETCH_LOREBOOKS: 'scarlet_mvu_request_fetch_lorebooks',
  REQUEST_PREVIEW_PROMPT: 'scarlet_mvu_request_preview_prompt',
  REQUEST_SAVE_SETTINGS: 'scarlet_mvu_request_save_settings',
  REQUEST_GET_SETTINGS: 'scarlet_mvu_request_get_settings',
  SETTINGS_RESPONSE: 'scarlet_mvu_settings_response',
  // 生成拦截相关
  GENERATION_BLOCKED: 'scarlet_mvu_generation_blocked', // 生成被拦截，需要用户确认
  GENERATION_BLOCK_CONFIRMED: 'scarlet_mvu_generation_block_confirmed', // 用户确认放弃/中断
};

// ═══ 工具函数 ═══
function getScriptSettings(): Settings {
  try {
    const raw = getVariables({ type: 'script', script_id: getScriptId() });
    return SettingsSchema.parse(raw);
  } catch {
    return SettingsSchema.parse({});
  }
}

function saveScriptSettings(newSettings: Settings): void {
  settings = newSettings;
  replaceVariables(klona(settings), { type: 'script', script_id: getScriptId() });
  eventEmit(SCARLET_MVU_EVENTS.SETTINGS_CHANGED, klona(settings));
}

// ═══ 条目信息接口 ═══
interface LorebookEntryInfo {
  uid: string;
  lorebookName: string;
  entryId: number;
  comment: string;
  keys: string[];
  constant: boolean;
  position: string;
  depth: number;
  order: number;
}

interface LorebookWithEntries {
  name: string;
  entries: number;
  entryList: LorebookEntryInfo[];
}

// ═══ 获取可用世界书列表 (包含条目详情) ═══
async function fetchLorebookList(): Promise<LorebookWithEntries[]> {
  try {
    const lorebooks: LorebookWithEntries[] = [];

    // 辅助函数：获取单个世界书的条目信息
    async function getLorebookWithEntries(lorebookName: string): Promise<LorebookWithEntries | null> {
      try {
        const entries = await getLorebookEntries(lorebookName);
        const entryList: LorebookEntryInfo[] = entries.map((entry, index) => {
          // 解析位置描述
          const positionMap: Record<string, string> = {
            before_character_definition: '角色定义前',
            after_character_definition: '角色定义后',
            before_example_messages: '示例消息前',
            after_example_messages: '示例消息后',
            before_author_note: '作者注释前',
            after_author_note: '作者注释后',
            at_depth_as_system: '@D系统',
            at_depth_as_assistant: '@D助手',
            at_depth_as_user: '@D用户',
          };
          let positionStr = positionMap[entry.position] || String(entry.position);

          // 如果是深度位置，显示具体深度
          if (entry.position?.startsWith('at_depth_') && entry.depth !== null) {
            positionStr = `@D${entry.depth}`;
          }

          // 判断是否为常驻 (蓝灯): type === 'constant'
          const isConstant = entry.type === 'constant';

          return {
            uid: `${lorebookName}::${entry.uid ?? index}`,
            lorebookName,
            entryId: entry.uid ?? index,
            comment: entry.comment || '',
            keys: entry.keys || [],
            constant: isConstant,
            position: positionStr,
            depth: entry.depth ?? 0,
            order: entry.order ?? index,
          };
        });

        return {
          name: lorebookName,
          entries: entries.length,
          entryList,
        };
      } catch {
        return { name: lorebookName, entries: 0, entryList: [] };
      }
    }

    // 获取全局世界书
    const globalLorebooks = await getLorebookSettings();
    if (globalLorebooks.selected_global_lorebooks) {
      for (const name of globalLorebooks.selected_global_lorebooks) {
        const lorebook = await getLorebookWithEntries(name);
        if (lorebook) lorebooks.push(lorebook);
      }
    }

    // 获取当前角色的主世界书
    const charLorebook = await getCurrentCharPrimaryLorebook();
    if (charLorebook && !lorebooks.some(l => l.name === charLorebook)) {
      const lorebook = await getLorebookWithEntries(charLorebook);
      if (lorebook) lorebooks.push(lorebook);
    }

    eventEmit(SCARLET_MVU_EVENTS.LOREBOOK_LIST_UPDATED, lorebooks);
    return lorebooks;
  } catch (error) {
    console.error('[绯色官途MVU] 获取世界书列表失败:', error);
    return [];
  }
}

// ═══ 获取世界书内容 ═══
async function getLorebookContent(lorebookName: string): Promise<string> {
  try {
    const entries = await getLorebookEntries(lorebookName);
    const contents: string[] = [];

    for (const entry of entries) {
      if (entry.content && entry.content.trim()) {
        // 包含条目名称作为上下文
        const comment = entry.comment || '未命名条目';
        contents.push(`[${comment}]\n${entry.content}`);
      }
    }

    return contents.join('\n\n---\n\n');
  } catch (error) {
    console.error(`[绯色官途MVU] 获取世界书 ${lorebookName} 内容失败:`, error);
    return '';
  }
}

// ═══ 构建完整的Prompt ═══
async function buildPromptForParsing(): Promise<{
  prompts: RolePrompt[];
  preview: string;
}> {
  const promptConfig = settings.promptConfig;
  const prompts: RolePrompt[] = [];
  const previewParts: string[] = [];

  // 获取角色信息
  const charId = SillyTavern.characterId;
  const charInfo = charId !== undefined ? SillyTavern.characters?.[Number(charId)] : undefined;

  // 1. 系统指引prompt
  if (promptConfig.customSystemPrompt) {
    prompts.push({
      role: 'system',
      content: promptConfig.customSystemPrompt,
    });
    previewParts.push(`【系统指引】\n${promptConfig.customSystemPrompt}`);
  }

  // 2. 角色描述 (可选)
  if (promptConfig.includeCharDescription && charInfo?.description) {
    prompts.push({
      role: 'system',
      content: `角色描述:\n${charInfo.description}`,
    });
    previewParts.push(`【角色描述】\n${charInfo.description}`);
  }

  // 3. 角色人设 (可选)
  if (promptConfig.includeCharPersonality && charInfo?.personality) {
    prompts.push({
      role: 'system',
      content: `角色人设:\n${charInfo.personality}`,
    });
    previewParts.push(`【角色人设】\n${charInfo.personality}`);
  }

  // 4. 场景描述 (可选)
  if (promptConfig.includeScenario && charInfo?.scenario) {
    prompts.push({
      role: 'system',
      content: `场景:\n${charInfo.scenario}`,
    });
    previewParts.push(`【场景描述】\n${charInfo.scenario}`);
  }

  // 5. 选中的世界书条目内容 (细粒度选择)
  if (promptConfig.selectedEntries && promptConfig.selectedEntries.length > 0) {
    // 按世界书分组
    const entriesByLorebook = new Map<string, string[]>();

    for (const entryUid of promptConfig.selectedEntries) {
      const [lorebookName, entryIdStr] = entryUid.split('::');
      if (!lorebookName) continue;

      if (!entriesByLorebook.has(lorebookName)) {
        entriesByLorebook.set(lorebookName, []);
      }
      entriesByLorebook.get(lorebookName)!.push(entryIdStr);
    }

    // 获取并添加每个世界书的选中条目
    for (const [lorebookName, entryIds] of entriesByLorebook) {
      try {
        const allEntries = await getLorebookEntries(lorebookName);
        const selectedContents: string[] = [];

        for (const entry of allEntries) {
          const entryIdStr = String(entry.uid ?? allEntries.indexOf(entry));
          if (entryIds.includes(entryIdStr)) {
            if (entry.content && entry.content.trim()) {
              const comment = entry.comment || '未命名条目';
              selectedContents.push(`[${comment}]\n${entry.content}`);
            }
          }
        }

        if (selectedContents.length > 0) {
          const content = selectedContents.join('\n\n---\n\n');
          prompts.push({
            role: 'system',
            content: `世界书 [${lorebookName}] (${selectedContents.length}条目):\n${content}`,
          });
          previewParts.push(`【世界书: ${lorebookName}】 (${selectedContents.length}条目)\n${content}`);
        }
      } catch (error) {
        console.error(`[绯色官途MVU] 获取世界书 ${lorebookName} 条目失败:`, error);
      }
    }
  } else if (promptConfig.selectedLorebooks && promptConfig.selectedLorebooks.length > 0) {
    // 向后兼容: 如果没有细粒度选择，使用世界书级别选择
    for (const lorebookName of promptConfig.selectedLorebooks) {
      const content = await getLorebookContent(lorebookName);
      if (content) {
        prompts.push({
          role: 'system',
          content: `世界书 [${lorebookName}]:\n${content}`,
        });
        previewParts.push(`【世界书: ${lorebookName}】\n${content}`);
      }
    }
  }

  // 6. 聊天历史
  const historyCount = promptConfig.maxChatHistory;
  if (historyCount > 0) {
    const messageId = getLastMessageId();
    const startId = Math.max(0, messageId - historyCount + 1);

    previewParts.push(`【聊天历史 (最近${historyCount}条)】`);

    for (let i = startId; i <= messageId; i++) {
      const msgs = getChatMessages(i);
      if (msgs.length > 0) {
        const msg = msgs[0];
        const role = msg.role === 'user' ? 'user' : 'assistant';
        const content = msg.message;

        // 对最新消息添加past_observe标记
        if (i === messageId) {
          prompts.push({
            role: 'assistant',
            content: `<past_observe>\n${content}\n</past_observe>`,
          });
          previewParts.push(`${role === 'user' ? '用户' : '助手'}: <past_observe>\n${content}\n</past_observe>`);
        } else {
          prompts.push({
            role,
            content,
          });
          previewParts.push(
            `${role === 'user' ? '用户' : '助手'}: ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`,
          );
        }
      }
    }
  }

  // 7. 用户请求 (可自定义后缀)
  const userPrompt = promptConfig.customUserPrompt || '请根据上述剧情内容，分析并输出变量更新命令。';
  prompts.push({
    role: 'user',
    content: userPrompt,
  });
  previewParts.push(`【用户请求】\n${userPrompt}`);

  // 8. 应用正则过滤器 (开发者配置)
  const filterPatterns = promptConfig.promptFilterPatterns || [];
  if (filterPatterns.length > 0) {
    for (const prompt of prompts) {
      for (const pattern of filterPatterns) {
        try {
          const regex = new RegExp(pattern, 'g');
          prompt.content = prompt.content.replace(regex, '');
        } catch (e) {
          console.warn(`[绯色官途MVU] 无效的正则表达式: ${pattern}`, e);
        }
      }
    }
    console.info(`[绯色官途MVU] 已应用 ${filterPatterns.length} 个正则过滤器`);
  }

  return {
    prompts,
    preview: previewParts.join('\n\n' + '─'.repeat(50) + '\n\n'),
  };
}

// ═══ 获取Prompt预览 ═══
async function getPromptPreview(): Promise<string> {
  const { preview } = await buildPromptForParsing();
  eventEmit(SCARLET_MVU_EVENTS.PROMPT_PREVIEW_UPDATED, preview);
  return preview;
}

// ═══ 获取模型列表 ═══
async function fetchModelList(apiUrl: string, apiKey: string): Promise<string[]> {
  try {
    const url = apiUrl.replace(/\/+$/, '') + '/models';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const models: string[] = [];

    if (data.data && Array.isArray(data.data)) {
      // OpenAI格式
      for (const model of data.data) {
        if (model.id) {
          models.push(model.id);
        }
      }
    } else if (Array.isArray(data.models)) {
      // 其他格式
      for (const model of data.models) {
        if (typeof model === 'string') {
          models.push(model);
        } else if (model.name) {
          models.push(model.name);
        } else if (model.id) {
          models.push(model.id);
        }
      }
    }

    // 缓存模型列表
    settings.internal.cachedModelList = models;
    settings.internal.cachedModelListTime = Date.now();
    saveScriptSettings(settings);

    eventEmit(SCARLET_MVU_EVENTS.MODEL_LIST_UPDATED, models);
    return models;
  } catch (error) {
    console.error('[绯色官途MVU] 获取模型列表失败:', error);
    eventEmit(SCARLET_MVU_EVENTS.MODEL_LIST_FETCH_ERROR, String(error));
    throw error;
  }
}

// ═══ 保存/恢复流式输出设置 ═══
// 使用 Preset API 确保流式设置正确恢复
function saveStreamSetting(): void {
  try {
    // 使用 Preset API 获取正确的流式设置
    const preset = getPreset('in_use');
    originalStreamSetting = preset.settings.should_stream;
    console.info('[绯色官途MVU] 保存流式输出设置:', originalStreamSetting);
  } catch (e) {
    // 回退到 chatCompletionSettings
    try {
      originalStreamSetting = SillyTavern.chatCompletionSettings?.stream ?? true;
      console.info('[绯色官途MVU] 保存流式输出设置(fallback):', originalStreamSetting);
    } catch {
      originalStreamSetting = true; // 默认流式
    }
  }
}

async function restoreStreamSetting(): Promise<void> {
  const targetValue = originalStreamSetting !== null ? originalStreamSetting : true;
  console.info('[绯色官途MVU] 准备恢复流式输出设置:', targetValue);

  try {
    // 使用 Preset API 设置流式输出（最可靠的方式）
    await setPreset('in_use', { settings: { should_stream: targetValue } });
    console.info('[绯色官途MVU] 已通过Preset API恢复流式输出设置:', targetValue);
  } catch (e) {
    // 回退方案：直接修改 chatCompletionSettings
    try {
      if (SillyTavern.chatCompletionSettings) {
        SillyTavern.chatCompletionSettings.stream = targetValue;
        console.info('[绯色官途MVU] 已通过fallback恢复流式输出设置:', targetValue);
      }
    } catch {
      console.warn('[绯色官途MVU] 恢复流式输出设置失败');
    }
  } finally {
    originalStreamSetting = null;
  }
}

// ═══ 接管MVU设置 ═══
// 核心策略：禁用MVU的自动额外解析，让用户只能通过UI按钮触发我们的解析
// 这确保了：1. 所有解析都使用UI配置的prompt 2. 前端可以拦截并显示确认对话框
function overrideMvuSettings(): void {
  if (!settings.enableExtraModelParsing) {
    return;
  }

  try {
    if (!SillyTavern.extensionSettings?.mvu_settings) {
      console.warn('[绯色官途MVU] MVU扩展设置不存在，跳过接管');
      return;
    }

    const mvuSettings = SillyTavern.extensionSettings.mvu_settings;

    // 关键：将MVU设为"随AI输出"模式，禁用其自动额外解析
    // 这样MVU不会在每轮对话后自动触发额外模型解析
    // 用户只能通过点击UI按钮来触发我们自己实现的解析流程
    mvuSettings.更新方式 = '随AI输出';

    // 保存原始API配置（用于恢复）
    // 注意：我们不再修改MVU的额外模型解析配置
    // 因为我们的解析流程完全独立，使用自己的generateRaw调用

    console.info('[绯色官途MVU] 已接管MVU设置 (禁用自动额外解析，使用UI按钮触发)');
  } catch (e) {
    console.warn('[绯色官途MVU] 接管MVU设置失败:', e);
  }
}

function restoreMvuSettings(): void {
  if (settings.enableExtraModelParsing) {
    return;
  }

  try {
    if (!SillyTavern.extensionSettings?.mvu_settings) {
      return;
    }

    SillyTavern.extensionSettings.mvu_settings.更新方式 = '随AI输出';
    console.info('[绯色官途MVU] 已恢复MVU设置为随AI输出模式');
  } catch (e) {
    console.warn('[绯色官途MVU] 恢复MVU设置失败:', e);
  }
}

// ═══ 重试额外模型解析 ═══
// 使用generateRaw完全自定义prompt，不依赖预设和世界书自动加载
async function retryExtraModelParsing(): Promise<void> {
  // 如果正在解析，则真正中断
  if (isParsingInProgress) {
    shouldAbortParsing = true;

    // 使用 stopGenerationById 真正中断 LLM 请求
    if (currentGenerationId) {
      try {
        await stopGenerationById(currentGenerationId);
        console.info('[绯色官途MVU] 已中断生成:', currentGenerationId);
      } catch (e) {
        console.warn('[绯色官途MVU] 中断生成失败:', e);
      }
    }

    isParsingInProgress = false;
    isInExtraModelParsing = false;
    currentGenerationId = null;
    eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
    toastr.info('已中断解析', '[绯色官途]');

    // 恢复流式输出设置
    await restoreStreamSetting();
    return;
  }

  // 检查是否启用了额外模型解析
  if (!settings.enableExtraModelParsing) {
    toastr.warning('请先在设置中启用"额外模型解析"功能', '[绯色官途]');
    return;
  }

  // 检查API配置
  const config = settings.apiConfig;
  if (!config.apiUrl || !config.modelName) {
    toastr.warning('请先配置API地址和模型名称', '[绯色官途]');
    return;
  }

  isParsingInProgress = true;
  isInExtraModelParsing = true;
  shouldAbortParsing = false;
  currentGenerationId = `scarlet-mvu-${Date.now()}`; // 生成唯一ID
  eventEmit(SCARLET_MVU_EVENTS.PARSING_STARTED);

  // 保存流式输出设置
  saveStreamSetting();

  try {
    await waitGlobalInitialized('Mvu');

    const messageId = getLastMessageId();
    const messages = getChatMessages(messageId);
    const message = messages[0];

    if (!message) {
      throw new Error('无法获取最新消息');
    }

    let messageContent = message.message;

    // 移除已存在的<UpdateVariable>块（无论是自动还是手动解析）
    const updateVarStart = messageContent.lastIndexOf('<UpdateVariable>');
    if (updateVarStart >= 0) {
      const updateVarEnd = messageContent.lastIndexOf('</UpdateVariable>');
      if (updateVarEnd >= 0) {
        messageContent = messageContent.slice(0, updateVarStart) + messageContent.slice(updateVarEnd + 17);
      } else {
        messageContent = messageContent.slice(0, updateVarStart);
      }
    }

    // ═══ 关键修复：统一使用上一楼层的变量 ═══
    // 无论是自动解析还是手动重新解析，我们都应该：
    // 1. 将当前楼层的变量重置为上一楼层的变量
    // 2. 这样 {{get_message_variable::stat_data}} 宏就能获取到正确的（更新前的）数据
    // 3. LLM2 会基于这个"未更新"的状态来生成变量更新命令
    const prevMessageId = messageId > 0 ? messageId - 1 : 0;
    const prevVariables = getLastValidMvuData(prevMessageId);

    if (prevVariables?.stat_data) {
      // 将上一楼层的变量覆盖到当前楼层（临时）
      // 这确保了宏 {{get_message_variable::stat_data}} 获取的是更新前的状态
      await Mvu.replaceMvuData(prevVariables, { type: 'message', message_id: messageId });
      console.info('[绯色官途MVU] 已将当前楼层变量重置为上一楼层 (楼层', prevMessageId, ')');
    } else {
      console.warn('[绯色官途MVU] 无法获取上一楼层变量，将使用当前楼层变量');
    }

    // 更新消息内容（移除旧的 UpdateVariable 块）
    await setChatMessages([{ message_id: messageId, message: messageContent }], { refresh: 'none' });

    if (shouldAbortParsing) {
      throw new Error('用户中断');
    }

    eventEmit(SCARLET_MVU_EVENTS.PARSING_PROGRESS, '正在构建Prompt...');

    // 构建自定义prompt
    const { prompts } = await buildPromptForParsing();

    if (shouldAbortParsing) {
      throw new Error('用户中断');
    }

    eventEmit(SCARLET_MVU_EVENTS.PARSING_PROGRESS, '正在调用额外模型解析...');

    let response: string;
    const promptConfig = settings.promptConfig;
    const useMainApi = settings.useMainApi;

    // 构建 custom_api 配置（仅在不使用主 API 时）
    const customApiConfig = useMainApi
      ? undefined
      : {
          apiurl: config.apiUrl,
          key: config.apiKey,
          model: config.modelName,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
          top_p: config.topP,
        };

    // 使用generateRaw完全控制发送的内容
    if (promptConfig.sendPreset) {
      // 如果用户选择发送预设，使用generate
      response = await generate({
        user_input: promptConfig.customUserPrompt || '请根据上述剧情内容，分析并输出变量更新命令。',
        custom_api: customApiConfig,
        injects: [
          {
            position: 'in_chat',
            depth: 0,
            should_scan: false,
            role: 'system',
            content: promptConfig.customSystemPrompt,
          },
        ],
        max_chat_history: promptConfig.maxChatHistory,
        should_stream: false,
        generation_id: currentGenerationId || undefined, // 添加生成ID用于中断
      });
    } else {
      // 不发送预设，使用generateRaw完全自定义
      response = await generateRaw({
        custom_api: customApiConfig,
        ordered_prompts: prompts,
        should_stream: false,
        generation_id: currentGenerationId || undefined, // 添加生成ID用于中断
      });
    }

    isInExtraModelParsing = false;

    if (shouldAbortParsing) {
      throw new Error('用户中断');
    }

    console.info('[绯色官途MVU] LLM响应:', response);

    // 解析响应中的UpdateVariable块
    let updateBlock = '';
    const updateMatch = response.match(/<(?:Update)?Variable>([\s\S]*?)<\/(?:Update)?Variable>/i);
    if (updateMatch) {
      updateBlock = `<UpdateVariable>${updateMatch[1]}</UpdateVariable>`;
    } else {
      const varUpdateMatch = response.match(/<VariableUpdate>([\s\S]*?)<\/VariableUpdate>/i);
      if (varUpdateMatch) {
        updateBlock = `<UpdateVariable>${varUpdateMatch[1]}</UpdateVariable>`;
      }
    }

    if (!updateBlock) {
      // 检查是否包含更新命令
      const hasCommands = /_\.(?:set|insert|assign|remove|unset|delete|add)\s*\([\s\S]*?\)\s*;/.test(response);
      if (hasCommands) {
        updateBlock = `<UpdateVariable>${response}</UpdateVariable>`;
      } else {
        throw new Error('未能从响应中解析出变量更新命令');
      }
    }

    eventEmit(SCARLET_MVU_EVENTS.PARSING_PROGRESS, '解析完成，等待确认...');

    // 存储待确认信息
    pendingConfirmation = {
      messageId,
      originalMessage: messageContent,
      updateBlock,
      rawResponse: response,
    };

    // 触发确认事件
    eventEmit(SCARLET_MVU_EVENTS.CONFIRM_UPDATE, {
      messageId,
      originalMessage: messageContent,
      updateBlock,
      rawResponse: response,
    });

    console.info('[绯色官途MVU] 解析完成，等待用户确认');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg === '用户中断') {
      eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
      toastr.info('解析已中断', '[绯色官途]');
    } else {
      eventEmit(SCARLET_MVU_EVENTS.PARSING_ERROR, errorMsg);
      toastr.error(`解析失败: ${errorMsg}`, '[绯色官途]');
      console.error('[绯色官途MVU] 解析失败:', error);
    }

    isParsingInProgress = false;
    isInExtraModelParsing = false;
    shouldAbortParsing = false;
    currentGenerationId = null;
  } finally {
    // 始终恢复流式输出设置
    await restoreStreamSetting();
    isInExtraModelParsing = false;
    currentGenerationId = null;
  }
}

// ═══ 获取上一楼层的有效变量 ═══
// 模仿 MVU 内部的 getLastValidVariable 逻辑
// 用于在调用 LLM2 前将当前楼层变量重置为上一楼层状态
function getLastValidMvuData(beforeMessageId: number): Mvu.MvuData | null {
  const chat = SillyTavern.chat;
  if (!chat || chat.length === 0) return null;

  // 从 beforeMessageId 向前搜索，找到最后一个有 stat_data 的楼层
  for (let i = Math.min(beforeMessageId, chat.length - 1); i >= 0; i--) {
    const chatMessage = chat[i];
    const swipeId = chatMessage?.swipe_id ?? 0;
    const variables = _.get(chatMessage, ['variables', swipeId]);
    if (variables?.stat_data) {
      return klona(variables) as Mvu.MvuData;
    }
  }

  // 如果没找到，尝试从聊天变量获取
  const chatVars = getVariables({ type: 'chat' });
  if (chatVars?.stat_data) {
    return klona(chatVars) as Mvu.MvuData;
  }

  return null;
}

// ═══ 应用变量更新 ═══
// 直接使用 MVU 内部的 handleVariablesInMessage 函数
// 这是 MVU "重新处理变量" 按钮使用的同一函数，能正确处理所有变量更新逻辑
async function applyVariableUpdate(messageId: number, originalMessage: string, updateBlock: string): Promise<void> {
  try {
    // 1. 将更新语句追加到消息内容
    let newMessage = originalMessage + '\n\n' + updateBlock;

    // 2. 添加状态栏占位符（如果没有的话）
    if (!newMessage.includes('<StatusPlaceHolderImpl/>')) {
      newMessage += '\n\n<StatusPlaceHolderImpl/>';
    }

    // 3. 保存消息内容到聊天记录（不刷新UI，避免iframe重载）
    // MVU 的 handleVariablesInMessage 会从聊天记录中读取消息
    await setChatMessages([{ message_id: messageId, message: newMessage }], { refresh: 'none' });
    console.info('[绯色官途MVU] 消息已保存到楼层', messageId);

    // 4. 清除当前楼层的变量数据（模仿MVU"重新处理变量"按钮行为）
    // 这样 handleVariablesInMessage 会从上一楼层继承变量并重新解析
    await updateVariablesWith(
      (variables: Record<string, unknown>) => {
        _.unset(variables, 'stat_data');
        _.unset(variables, 'delta_data');
        _.unset(variables, 'display_data');
        _.unset(variables, 'schema');
        return variables;
      },
      { type: 'message', message_id: messageId },
    );

    // 5. 调用 MVU 内部的 handleVariablesInMessage 函数
    // MVU 在初始化时将此函数导出到 window.parent（见 MVU/src/main.ts:526）
    // 这个函数会：
    //   - 从聊天记录中读取消息内容
    //   - 从前一楼层获取变量基础数据
    //   - 调用 updateVariables 解析 JSON Patch 等命令
    //   - 将更新后的变量写回当前楼层
    const handleVariablesInMessage = (window.parent as any).handleVariablesInMessage as
      | ((messageId: number) => Promise<void>)
      | undefined;

    if (handleVariablesInMessage) {
      console.info('[绯色官途MVU] 调用 MVU handleVariablesInMessage 处理变量...');
      await handleVariablesInMessage(messageId);
      console.info('[绯色官途MVU] 变量处理完成');
    } else {
      console.error('[绯色官途MVU] 无法找到 MVU 的 handleVariablesInMessage 函数');
      throw new Error('MVU handleVariablesInMessage 函数不可用，请确保 MVU 已正确加载');
    }

    // 6. 刷新显示
    await setChatMessages([{ message_id: messageId, message: newMessage }], { refresh: 'affected' });

    eventEmit(SCARLET_MVU_EVENTS.PARSING_COMPLETED);

    // 7. 发送变量更新完成事件，通知前端刷新UI
    eventEmit(SCARLET_MVU_EVENTS.VARIABLE_UPDATED, {
      messageId,
      updateBlock,
    });

    toastr.success('变量更新已应用', '[绯色官途]');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    eventEmit(SCARLET_MVU_EVENTS.PARSING_ERROR, errorMsg);
    toastr.error(`应用更新失败: ${errorMsg}`, '[绯色官途]');
    throw error;
  } finally {
    isParsingInProgress = false;
    isInExtraModelParsing = false;
    pendingConfirmation = null;
    currentGenerationId = null;
    await restoreStreamSetting();
  }
}

// ═══ 拦截MVU的自动消息追加 ═══
function setupMvuInterception(): void {
  // 监听MVU的BEFORE_MESSAGE_UPDATE事件来拦截自动追加
  eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, (context: { variables: Mvu.MvuData; message_content: string }) => {
    // 当启用额外模型解析时，检查是否需要拦截
    if (settings.enableExtraModelParsing) {
      // 检查消息是否包含UpdateVariable块
      const hasUpdateBlock =
        context.message_content.includes('<UpdateVariable>') || context.message_content.includes('<VariableUpdate>');

      if (hasUpdateBlock) {
        // 提取UpdateVariable块
        let updateBlock = '';
        const match = context.message_content.match(/<(?:Update)?Variable>([\s\S]*?)<\/(?:Update)?Variable>/i);
        if (match) {
          updateBlock = `<UpdateVariable>${match[1]}</UpdateVariable>`;
        } else {
          const varMatch = context.message_content.match(/<VariableUpdate>([\s\S]*?)<\/VariableUpdate>/i);
          if (varMatch) {
            updateBlock = `<UpdateVariable>${varMatch[1]}</UpdateVariable>`;
          }
        }

        if (updateBlock) {
          // 从消息中移除UpdateVariable块，阻止自动追加
          const cleanContent = context.message_content
            .replace(/<(?:Update)?Variable>[\s\S]*?<\/(?:Update)?Variable>/gi, '')
            .replace(/<VariableUpdate>[\s\S]*?<\/VariableUpdate>/gi, '')
            .trim();

          // 存储待确认信息
          pendingConfirmation = {
            messageId: getLastMessageId(),
            originalMessage: cleanContent,
            updateBlock,
            rawResponse: context.message_content,
          };

          // 修改context.message_content为不含UpdateVariable的版本
          context.message_content = cleanContent;

          // 触发确认事件
          eventEmit(SCARLET_MVU_EVENTS.CONFIRM_UPDATE, pendingConfirmation);

          console.info('[绯色官途MVU] 已拦截MVU自动追加，等待用户确认');
        }
      }
    }
  });
}

// ═══ 设置事件监听器 ═══
function setupEventListeners(): void {
  // 监听来自前端的请求
  eventOn(SCARLET_MVU_EVENTS.REQUEST_RETRY_PARSING, () => {
    retryExtraModelParsing();
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_ABORT_PARSING, () => {
    if (isParsingInProgress) {
      shouldAbortParsing = true;
      toastr.info('正在中断解析...', '[绯色官途]');
    }
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_FETCH_MODELS, async (data: { apiUrl: string; apiKey: string }) => {
    try {
      await fetchModelList(data.apiUrl, data.apiKey);
    } catch {
      // 错误已在fetchModelList中处理
    }
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_FETCH_LOREBOOKS, async () => {
    await fetchLorebookList();
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_PREVIEW_PROMPT, async () => {
    await getPromptPreview();
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_SAVE_SETTINGS, (newSettings: Settings) => {
    saveScriptSettings(SettingsSchema.parse(newSettings));
    // 根据设置调整MVU和自动解析监听
    if (settings.enableExtraModelParsing) {
      overrideMvuSettings();
      setupAutoParsingListener();
    } else {
      restoreMvuSettings();
      // 清理自动解析监听
      if (messageReceivedListener) {
        messageReceivedListener.stop();
        messageReceivedListener = null;
      }
    }
  });

  eventOn(SCARLET_MVU_EVENTS.REQUEST_GET_SETTINGS, () => {
    eventEmit(SCARLET_MVU_EVENTS.SETTINGS_RESPONSE, klona(settings));
  });

  // 监听用户确认结果
  eventOn(SCARLET_MVU_EVENTS.CONFIRM_RESULT, async (result: { confirmed: boolean; updateBlock?: string }) => {
    if (pendingConfirmation) {
      if (result.confirmed && result.updateBlock) {
        await applyVariableUpdate(
          pendingConfirmation.messageId,
          pendingConfirmation.originalMessage,
          result.updateBlock,
        );
      } else {
        // 用户取消，清理状态
        isParsingInProgress = false;
        pendingConfirmation = null;
        await restoreStreamSetting();
        eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
        toastr.info('已取消变量更新', '[绯色官途]');
      }
    }
  });

  // Bug 3 修复：监听生成拦截确认结果
  eventOn(SCARLET_MVU_EVENTS.GENERATION_BLOCK_CONFIRMED, async (confirmed: boolean) => {
    if (confirmed) {
      // 用户确认放弃/中断，清理状态
      console.info('[绯色官途MVU] 用户确认放弃/中断，清理状态并重新生成');

      // 清理待确认状态
      if (pendingConfirmation) {
        pendingConfirmation = null;
      }

      // 清理被拦截消息 ID（用户选择继续，消息保留）
      blockedUserMessageId = null;

      // 中断正在进行的解析
      if (isParsingInProgress) {
        shouldAbortParsing = true;
        if (currentGenerationId) {
          try {
            await stopGenerationById(currentGenerationId);
          } catch {
            // 忽略错误
          }
        }
      }

      // 重置所有状态
      isParsingInProgress = false;
      isInExtraModelParsing = false;
      currentGenerationId = null;
      await restoreStreamSetting();
      eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);

      // 重新触发生成
      pendingRegenerate = false;
      setTimeout(() => {
        console.info('[绯色官途MVU] 重新触发用户消息生成');
        SillyTavern.generate('normal');
      }, 100);
    } else {
      // 用户取消，不发送消息，删除已添加的用户消息
      console.info('[绯色官途MVU] 用户取消发送消息');
      pendingRegenerate = false;

      // 删除被拦截时添加的用户消息
      if (blockedUserMessageId !== null) {
        console.info('[绯色官途MVU] 删除被拦截的用户消息:', blockedUserMessageId);
        try {
          await deleteChatMessages([blockedUserMessageId], { refresh: 'all' });
        } catch (e) {
          console.warn('[绯色官途MVU] 删除用户消息失败:', e);
        }
        blockedUserMessageId = null;
      }

      // 发送 PARSING_ABORTED 事件，通知前端重置图标状态
      eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
    }
  });
}

// ═══ 导出全局API ═══
function exportGlobalApi(): void {
  const api = {
    events: SCARLET_MVU_EVENTS,
    getSettings: () => klona(settings),
    saveSettings: (newSettings: Settings) => {
      saveScriptSettings(SettingsSchema.parse(newSettings));
    },
    retryParsing: () => retryExtraModelParsing(),
    abortParsing: async () => {
      if (isParsingInProgress) {
        shouldAbortParsing = true;
        if (currentGenerationId) {
          try {
            await stopGenerationById(currentGenerationId);
            console.info('[绯色官途MVU] 已中断生成:', currentGenerationId);
          } catch (e) {
            console.warn('[绯色官途MVU] 中断生成失败:', e);
          }
        }
        isParsingInProgress = false;
        isInExtraModelParsing = false;
        currentGenerationId = null;
        eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
        await restoreStreamSetting();
        toastr.info('已中断解析', '[绯色官途]');
      }
    },
    fetchModels: (apiUrl: string, apiKey: string) => fetchModelList(apiUrl, apiKey),
    fetchLorebooks: () => fetchLorebookList(),
    getPromptPreview: () => getPromptPreview(),
    isParsingInProgress: () => isParsingInProgress,
    getPendingConfirmation: () => pendingConfirmation,
    confirmUpdate: async (confirmed: boolean, updateBlock?: string) => {
      eventEmit(SCARLET_MVU_EVENTS.CONFIRM_RESULT, { confirmed, updateBlock });
    },
  };

  // 导出到window和parent window
  _.set(window, 'ScarletMvu', api);
  _.set(window.parent, 'ScarletMvu', api);

  console.info('[绯色官途MVU] 全局API已导出');
}

// ═══ 设置世界书过滤 ═══
// 当UI启用"额外模型解析"时，过滤掉只给LLM2用的条目（带[mvu_update]且不带[mvu_plot]的条目）
// 这样LLM1不会收到变量更新规则，节省token
function setupWorldInfoFilter(): void {
  eventOn(
    tavern_events.WORLDINFO_ENTRIES_LOADED,
    (lores: {
      globalLore: Array<{ comment?: string }>;
      characterLore: Array<{ comment?: string }>;
      chatLore: Array<{ comment?: string }>;
      personaLore: Array<{ comment?: string }>;
    }) => {
      // 如果未启用额外模型解析，或者当前正在进行额外模型解析（LLM2），则不过滤
      if (!settings.enableExtraModelParsing || isInExtraModelParsing) {
        return;
      }

      // 对LLM1的请求，过滤掉只给LLM2用的条目
      // 规则：移除带[mvu_update]且不带[mvu_plot]的条目
      const filterEntries = (entries: Array<{ comment?: string }>) => {
        for (let i = entries.length - 1; i >= 0; i--) {
          const entry = entries[i];
          const comment = (entry.comment || '').toLowerCase();
          const hasMvuUpdate = comment.includes('[mvu_update]');
          const hasMvuPlot = comment.includes('[mvu_plot]');

          // 如果只有[mvu_update]没有[mvu_plot]，则是只给LLM2用的，移除
          if (hasMvuUpdate && !hasMvuPlot) {
            entries.splice(i, 1);
          }
        }
      };

      filterEntries(lores.globalLore);
      filterEntries(lores.characterLore);
      filterEntries(lores.chatLore);
      filterEntries(lores.personaLore);

      console.info('[绯色官途MVU] 已过滤世界书条目 (移除仅LLM2使用的条目)');
    },
  );
}

// ═══ 设置自动解析监听 ═══
// 当消息生成完成后，自动触发额外模型解析
function setupAutoParsingListener(): void {
  // 清理旧监听器
  if (messageReceivedListener) {
    messageReceivedListener.stop();
    messageReceivedListener = null;
  }
  if (generationStoppedListener) {
    generationStoppedListener.stop();
    generationStoppedListener = null;
  }
  if (generationStartedListener) {
    generationStartedListener.stop();
    generationStartedListener = null;
  }

  // 重置标志
  wasGenerationStopped = false;
  pendingRegenerate = false;

  if (!settings.enableExtraModelParsing) {
    return;
  }

  // Bug 2 修复：监听生成中止事件
  // 如果用户通过酒馆的中止按钮主动中止了主API的输出，不应触发自动解析
  generationStoppedListener = eventOn(tavern_events.GENERATION_STOPPED, () => {
    // 如果是我们主动中止的（用于拦截），不设置标志
    if (pendingRegenerate) {
      return;
    }
    console.info('[绯色官途MVU] 检测到用户主动中止生成，跳过本次自动解析');
    wasGenerationStopped = true;
  });

  // Bug 3 修复：监听生成开始事件，拦截用户在解析中/最小化时尝试发送消息
  generationStartedListener = eventOn(
    tavern_events.GENERATION_STARTED,
    (_type: string, _option: object, dryRun: boolean) => {
      // 跳过 dry_run（预览/token计数等）
      if (dryRun) {
        return;
      }

      // 检查是否需要拦截：有待确认更新或正在解析中
      const needBlock = pendingConfirmation !== null || isParsingInProgress;

      if (needBlock) {
        console.info('[绯色官途MVU] 检测到用户尝试发送消息，但当前有未处理的变量更新');
        pendingRegenerate = true;

        // 延迟调用 stopGeneration，等待生成实际开始
        // 在 GENERATION_STARTED 事件回调中同步调用 stopGeneration 会失败，因为请求还没发出
        // 同时，用户消息也是在此延迟后才被添加到聊天记录中
        setTimeout(async () => {
          SillyTavern.stopGeneration();

          // 等待更长时间让用户消息被添加到聊天记录
          await new Promise(resolve => setTimeout(resolve, 100));

          // 在 stopGeneration 后获取用户消息 ID - 此时用户消息应该已添加
          // 扩大搜索范围，获取最后 3 条消息
          const lastMsgId = getLastMessageId();
          const lastMessages = getChatMessages(`${Math.max(0, lastMsgId - 2)}-${lastMsgId}`);

          // 从后往前找到最后一条 user 消息
          let userMsgId: number | null = null;
          for (let i = lastMessages.length - 1; i >= 0; i--) {
            if (lastMessages[i].role === 'user') {
              userMsgId = lastMessages[i].message_id;
              break;
            }
          }
          blockedUserMessageId = userMsgId;
        }, 50);

        // 通知前端显示拦截确认对话框
        eventEmit(SCARLET_MVU_EVENTS.GENERATION_BLOCKED, {
          reason: pendingConfirmation ? 'pending_confirmation' : 'parsing_in_progress',
          message: pendingConfirmation
            ? '您有待确认的变量更新，是否放弃变量更新并发送新消息？'
            : '额外模型正在解析变量更新，是否中断解析并发送新消息？',
        });
      }
    },
  );

  // 监听消息接收事件（LLM1回复完成后触发）
  messageReceivedListener = eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId: number) => {
    // Bug 2 修复：如果用户主动中止了生成，跳过自动解析
    if (wasGenerationStopped) {
      console.info('[绯色官途MVU] 由于用户主动中止了生成，跳过自动解析');
      wasGenerationStopped = false; // 重置标志
      return;
    }

    // 如果正在解析中，跳过
    if (isParsingInProgress) {
      return;
    }

    // 检查是否启用了额外模型解析
    if (!settings.enableExtraModelParsing) {
      return;
    }

    // 跳过第0层消息（新游戏开始时的第一条消息，通常是角色卡的首条消息）
    if (messageId === 0) {
      console.info('[绯色官途MVU] 跳过第0层消息，不触发自动解析');
      return;
    }

    console.info(`[绯色官途MVU] 检测到新消息 #${messageId}，准备自动触发额外模型解析...`);

    // 延迟一小段时间，等待消息渲染完成
    await new Promise(resolve => setTimeout(resolve, 500));

    // 自动触发解析
    retryExtraModelParsing();
  });

  console.info('[绯色官途MVU] 已启用自动解析监听');
}

// ═══ 初始化 ═══
async function init(): Promise<void> {
  console.info('[绯色官途MVU] 脚本初始化中...');

  // 加载设置
  settings = getScriptSettings();

  // 等待MVU初始化
  try {
    await waitGlobalInitialized('Mvu');
    console.info('[绯色官途MVU] MVU已就绪');
  } catch {
    console.warn('[绯色官途MVU] MVU未就绪，部分功能可能不可用');
  }

  // 设置事件监听
  setupEventListeners();

  // 设置MVU拦截
  setupMvuInterception();

  // 设置世界书过滤
  setupWorldInfoFilter();

  // 导出全局API
  exportGlobalApi();

  // 应用初始设置
  if (settings.enableExtraModelParsing) {
    overrideMvuSettings();
    setupAutoParsingListener();
  }

  console.info('[绯色官途MVU] 脚本初始化完成');
}

// ═══ 卸载 ═══
function cleanup(): void {
  // 恢复MVU设置
  restoreMvuSettings();

  // 恢复流式输出设置
  restoreStreamSetting();

  // 清理自动解析监听
  if (messageReceivedListener) {
    messageReceivedListener.stop();
    messageReceivedListener = null;
  }
  if (generationStoppedListener) {
    generationStoppedListener.stop();
    generationStoppedListener = null;
  }
  if (generationStartedListener) {
    generationStartedListener.stop();
    generationStartedListener = null;
  }

  // 清理全局API
  _.unset(window, 'ScarletMvu');
  _.unset(window.parent, 'ScarletMvu');

  console.info('[绯色官途MVU] 脚本已卸载');
}

// ═══ 生命周期 ═══
$(() => {
  errorCatched(init)();
});

$(window).on('pagehide', () => {
  cleanup();
});
