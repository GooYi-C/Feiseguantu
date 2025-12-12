// ═══════════════════════════════════════════════════════════════
// 绯色官途 · 核心数据 Store (含数据持久化策略)
// 数据源优先级: MVU > 消息楼层变量 > Chat聊天变量
// ═══════════════════════════════════════════════════════════════

import { klona } from 'klona';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { GameSchema, 人物Schema, type GameData, type 人物 } from './schema';

// ═══ 类型定义 ═══
export type DataSource = 'mvu' | 'message' | 'chat';

// ═══ 常量 ═══
const AVATAR_CACHE_KEY = 'scarlet_avatars';

export const useGameData = defineStore('gameData', () => {
  // ═══ State ═══
  const rawData = ref<GameData>(GameSchema.parse({}));
  const loading = ref(false);
  const initialized = ref(false);
  const isDirty = ref(false);
  const lastError = ref<string | null>(null);
  const dataSource = ref<DataSource>('mvu');
  const currentMessageLayer = ref<number>(0); // 当前消息层数

  // ═══ 本地头像缓存 (角色名 -> DataURL) ═══
  const avatarCache = ref<Record<string, string>>({});

  // ═══ Computed ═══
  const 时空舆情 = computed(() => rawData.value.时空舆情);
  const 当前场景 = computed(() => rawData.value.当前场景);
  const 人物库 = computed(() => rawData.value.人物库);
  const 关系索引 = computed(() => rawData.value.关系索引);
  const 个人档案 = computed(() => rawData.value.个人档案);
  const 派系图谱 = computed(() => rawData.value.派系图谱);
  const 绯色履历 = computed(() => rawData.value.绯色履历);
  const 个人资产 = computed(() => rawData.value.个人资产);
  const 暗账 = computed(() => rawData.value.暗账);
  const 机遇与危机 = computed(() => rawData.value.机遇与危机);

  // ─── 人物统计 ───
  const 人物总数 = computed(() => Object.keys(人物库.value).length);
  const 人物列表 = computed(() => Object.entries(人物库.value));
  const 人物名单 = computed(() => Object.keys(人物库.value));

  // 绯色对象：需要有实际的绯色关系内容（关系阶段不为空/无）或有绯色对象标签
  const 绯色对象列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.绯色关系 && p.绯色关系.关系阶段 && p.绯色关系.关系阶段 !== '无') || p.角色标签?.includes('绯色对象'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 靠山：需要有实际的靠山关系内容或有靠山标签
  const 靠山列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) => (p.靠山关系 && p.靠山关系.紧密度 && p.靠山关系.紧密度 !== '无') || p.角色标签?.includes('靠山'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 竞争对手：需要有实际的竞争关系内容或有竞争对手标签
  const 竞争对手列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.竞争关系 && p.竞争关系.竞争目标 && p.竞争关系.竞争目标 !== '无') || p.角色标签?.includes('竞争对手'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 家属：需要有实际的家庭关系内容或有家属标签
  const 家属列表 = computed(() =>
    人物列表.value
      .filter(([, p]) => (p.家庭关系 && p.家庭关系.关系 && p.家庭关系.关系 !== '无') || p.角色标签?.includes('家属'))
      .map(([name, p]) => ({ name, ...p })),
  );

  // ─── 危机/机遇统计 ───
  const 危机数量 = computed(() => Object.keys(机遇与危机.value.潜在危机).length);
  const 机遇数量 = computed(() => Object.keys(机遇与危机.value.当前机遇).length);
  const 待办数量 = computed(() => Object.keys(机遇与危机.value.待办事项).length);

  // ─── 开局模式检测 ───
  // 当前是否处于0层（开局模式）
  const isStartupMode = computed(() => currentMessageLayer.value === 0);

  // ═══ 等待 MVU 变量初始化完成 ═══
  async function waitMvuInitialized(timeoutMs = 5000): Promise<Mvu.MvuData | null> {
    try {
      await waitGlobalInitialized('Mvu');

      // 检查 MVU 是否已经完成初始化
      // initialized_lorebooks 存在（即使为空数组）且 stat_data 存在即认为已初始化
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
      if (mvuData && mvuData.initialized_lorebooks !== undefined && mvuData.stat_data !== undefined) {
        // 已经初始化完成
        console.info('[绯色官途] MVU 已初始化完成', {
          世界书: mvuData.initialized_lorebooks,
          数据字段数: Object.keys(mvuData.stat_data).length,
        });
        return mvuData;
      }

      // MVU 还在初始化中，等待 VARIABLE_INITIALIZED 事件
      console.info('[绯色官途] MVU 尚未初始化完成，等待初始化事件...');
      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          // 超时后再检查一次
          const finalCheck = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
          if (finalCheck?.stat_data !== undefined) {
            console.info('[绯色官途] MVU 超时前最终检查成功');
            resolve(finalCheck);
          } else {
            console.warn('[绯色官途] MVU 初始化超时，继续尝试其他数据源');
            resolve(null);
          }
        }, timeoutMs);

        const listener = eventOn(Mvu.events.VARIABLE_INITIALIZED, variables => {
          clearTimeout(timeout);
          listener.stop();
          console.info('[绯色官途] MVU 变量初始化完成', { 世界书: variables.initialized_lorebooks });
          resolve(variables);
        });
      });
    } catch {
      return null;
    }
  }

  // ═══ 从变量数据中提取 stat_data ═══
  function extractStatData(vars: unknown): unknown {
    // 如果变量数据包含 stat_data 字段（MVU 格式），则提取它
    if (vars && typeof vars === 'object' && 'stat_data' in vars) {
      const mvuVars = vars as { stat_data: unknown };
      console.info('[绯色官途] 检测到 MVU 格式数据，提取 stat_data');
      return mvuVars.stat_data;
    }
    // 否则直接返回原数据
    return vars;
  }

  // ═══ 数据源加载 (优先级: MVU > 消息楼层变量 > Chat聊天变量) ═══
  async function loadFromBestSource(): Promise<{ data: unknown; source: DataSource }> {
    // 1. 最高优先级: MVU (等待初始化完成)
    try {
      const mvuData = await waitMvuInitialized();
      if (mvuData?.stat_data !== undefined) {
        // MVU 可用，使用 MVU 数据（即使为空也表示这是新游戏初始状态）
        console.info('[绯色官途] 使用 MVU 数据源', {
          已初始化世界书: mvuData.initialized_lorebooks,
          数据字段: Object.keys(mvuData.stat_data),
        });
        return { data: mvuData.stat_data, source: 'mvu' };
      }
    } catch (e) {
      console.warn('[绯色官途] MVU 不可用', e);
    }

    // 2. 消息楼层变量 (Message)
    try {
      const messageVars = getVariables({ type: 'message', message_id: 'latest' });
      if (messageVars && Object.keys(messageVars).length > 0) {
        const statData = extractStatData(messageVars);
        console.info('[绯色官途] 使用消息楼层变量数据源', {
          原始字段: Object.keys(messageVars as object),
          数据字段: statData && typeof statData === 'object' ? Object.keys(statData) : [],
        });
        return { data: statData, source: 'message' };
      }
    } catch {
      /* 继续尝试 */
    }

    // 3. 聊天变量 (Chat)
    try {
      const chatVars = getVariables({ type: 'chat' });
      if (chatVars && Object.keys(chatVars).length > 0) {
        const statData = extractStatData(chatVars);
        console.info('[绯色官途] 使用 Chat 数据源', {
          原始字段: Object.keys(chatVars as object),
          数据字段: statData && typeof statData === 'object' ? Object.keys(statData) : [],
        });
        return { data: statData, source: 'chat' };
      }
    } catch {
      /* 继续尝试 */
    }

    // 无数据，返回空对象，默认使用 MVU 作为数据源
    console.info('[绯色官途] 无可用数据源，使用默认空数据 (MVU)');
    return { data: {}, source: 'mvu' };
  }

  // ═══ 更新当前消息层数 ═══
  function updateMessageLayer() {
    try {
      // 使用酒馆助手API获取最后一条消息的ID
      const lastMsgId = getLastMessageId();
      currentMessageLayer.value = lastMsgId;
      console.info('[绯色官途] 当前消息层数:', lastMsgId);
    } catch {
      // 如果API不可用，检查SillyTavern.chat
      try {
        const chatLength = SillyTavern?.chat?.length ?? 0;
        currentMessageLayer.value = chatLength > 0 ? chatLength - 1 : 0;
      } catch {
        currentMessageLayer.value = 0;
      }
    }
  }

  // ═══ 数据加载 ═══
  async function loadData() {
    loading.value = true;
    lastError.value = null;

    try {
      const result = await loadFromBestSource();
      rawData.value = GameSchema.parse(result.data);
      dataSource.value = result.source;
      initialized.value = true;
      isDirty.value = false;

      // 更新当前消息层数
      updateMessageLayer();

      console.info(`[绯色官途] 从 ${result.source} 加载数据成功`, {
        人物数: Object.keys(rawData.value.人物库).length,
        当前层数: currentMessageLayer.value,
      });
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err);
      console.error('[绯色官途] 数据加载失败', err);
      toastr.error('数据加载失败: ' + lastError.value);
    } finally {
      loading.value = false;
    }
  }

  // ═══ 数据保存到指定数据源 ═══
  async function saveToSource(data: GameData, source: DataSource) {
    const saveData = data as Record<string, unknown>;
    switch (source) {
      case 'mvu':
        // MVU 模式下写回 MVU
        try {
          await waitGlobalInitialized('Mvu');
          const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' }) || ({} as Mvu.MvuData);
          mvuData.stat_data = saveData;
          await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });
          console.info('[绯色官途] 通过 MVU 保存数据');
        } catch (e) {
          console.warn('[绯色官途] MVU 保存失败，回退到聊天变量', e);
          await replaceVariables(saveData, { type: 'chat' });
        }
        break;
      case 'message':
        await replaceVariables(saveData, { type: 'message', message_id: 'latest' });
        console.info('[绯色官途] 通过消息楼层变量保存数据');
        break;
      case 'chat':
      default:
        await replaceVariables(saveData, { type: 'chat' });
        console.info('[绯色官途] 通过聊天变量保存数据');
        break;
    }
  }

  // ═══ 数据保存 ═══
  async function saveData(partial?: Partial<GameData>) {
    loading.value = true;
    try {
      const toSave = partial ? { ...klona(rawData.value), ...partial } : klona(rawData.value);

      // 根据当前数据源保存
      await saveToSource(toSave, dataSource.value);

      if (partial) {
        Object.assign(rawData.value, partial);
      }
      isDirty.value = false;
      toastr.success('保存成功');
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err);
      console.error('[绯色官途] 保存失败', err);
      toastr.error('保存失败: ' + lastError.value);
    } finally {
      loading.value = false;
    }
  }

  // ═══ 分区保存 ═══
  async function saveSection<K extends keyof GameData>(key: K) {
    await saveData({ [key]: rawData.value[key] } as Partial<GameData>);
  }

  // ═══ 字段更新 ═══
  function updateField(path: string, value: unknown) {
    _.set(rawData.value, path, value);
    isDirty.value = true;
  }

  // ═══ 放弃更改 ═══
  async function discardChanges() {
    await loadData();
    isDirty.value = false;
    toastr.info('已放弃更改');
  }

  // ═══ 事件监听 ═══
  function setupEventListeners() {
    // 聊天变化时重新加载
    eventOn(tavern_events.CHAT_CHANGED, () => {
      console.info('[绯色官途] 聊天变化，重新加载');
      loadData();
    });

    // 监听 MVU 变量更新结束事件，同步更新前端数据
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, variables => {
      if (dataSource.value === 'mvu' && variables?.stat_data) {
        console.info('[绯色官途] MVU 变量更新，同步前端数据');
        rawData.value = GameSchema.parse(variables.stat_data);
      }
      // 更新消息层数
      updateMessageLayer();
    });

    // 监听消息接收事件，更新层数
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      updateMessageLayer();
    });

    // 监听消息删除事件，更新层数
    eventOn(tavern_events.MESSAGE_DELETED, () => {
      updateMessageLayer();
    });
  }

  // ═══ 人物操作 ═══
  function addCharacter(name: string, char?: Partial<人物>) {
    if (人物库.value[name]) {
      toastr.warning(`人物「${name}」已存在`);
      return false;
    }
    rawData.value.人物库[name] = 人物Schema.parse({ 姓名: name, ...char });
    isDirty.value = true;
    return true;
  }

  function updateCharacter(name: string, updates: Partial<人物>) {
    if (!人物库.value[name]) {
      toastr.warning(`人物「${name}」不存在`);
      return false;
    }
    Object.assign(rawData.value.人物库[name], updates);
    isDirty.value = true;
    return true;
  }

  function deleteCharacter(name: string) {
    if (!人物库.value[name]) return false;
    delete rawData.value.人物库[name];
    // 同步删除本地头像
    delete avatarCache.value[name];
    saveAvatarCache();
    isDirty.value = true;
    return true;
  }

  function getCharacter(name: string): 人物 | null {
    return 人物库.value[name] || null;
  }

  function existsInLibrary(name: string): boolean {
    return !!人物库.value[name];
  }

  // ═══ 本地头像缓存 ═══
  function loadAvatarCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(AVATAR_CACHE_KEY) || '{}');
      avatarCache.value = cache;
    } catch {
      avatarCache.value = {};
    }
  }

  function saveAvatarCache() {
    try {
      localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(avatarCache.value));
    } catch (e) {
      console.warn('[绯色官途] 头像缓存保存失败', e);
    }
  }

  function getAvatar(charName: string): string | null {
    return avatarCache.value[charName] || null;
  }

  function setAvatar(charName: string, dataUrl: string) {
    avatarCache.value[charName] = dataUrl;
    saveAvatarCache();
  }

  function removeAvatar(charName: string) {
    delete avatarCache.value[charName];
    saveAvatarCache();
  }

  function clearAvatarCache() {
    avatarCache.value = {};
    localStorage.removeItem(AVATAR_CACHE_KEY);
    toastr.info('头像缓存已清空');
  }

  // 初始化时加载头像缓存
  loadAvatarCache();

  return {
    // 状态
    rawData,
    loading,
    initialized,
    isDirty,
    lastError,
    dataSource,
    currentMessageLayer,

    // 计算属性
    时空舆情,
    当前场景,
    人物库,
    关系索引,
    个人档案,
    派系图谱,
    绯色履历,
    个人资产,
    暗账,
    机遇与危机,

    // 开局模式
    isStartupMode,

    // 统计
    人物总数,
    人物列表,
    人物名单,
    绯色对象列表,
    靠山列表,
    竞争对手列表,
    家属列表,
    危机数量,
    机遇数量,
    待办数量,

    // 方法
    loadData,
    saveData,
    saveSection,
    updateField,
    discardChanges,
    setupEventListeners,
    updateMessageLayer,

    // 人物操作
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacter,
    existsInLibrary,

    // 头像缓存
    avatarCache,
    getAvatar,
    setAvatar,
    removeAvatar,
    clearAvatarCache,
  };
});
