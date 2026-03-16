// ═══════════════════════════════════════════════════════════════
// 绯色官途 · 主游戏数据 Store
// ═══════════════════════════════════════════════════════════════

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { klona } from 'klona';
import { GameSchema, type GameData, type 人物 } from './schema';

export const useGameStore = defineStore('game', () => {
  // ─── 状态 ───
  const data = ref<GameData>(GameSchema.parse({}));
  const loading = ref(false);
  const initialized = ref(false);
  const isDirty = ref(false);
  const lastError = ref<string | null>(null);

  // ─── 本地插图缓存 (角色ID -> DataURL) ───
  const avatarCache = ref<Record<string, string>>({});

  // ─── 计算属性 ───
  const 时空舆情 = computed(() => data.value.时空舆情);
  const 当前场景 = computed(() => data.value.当前场景);
  const 人物库 = computed(() => data.value.人物库);
  const 关系索引 = computed(() => data.value.关系索引);
  const 个人档案 = computed(() => data.value.个人档案);
  const 派系图谱 = computed(() => data.value.派系图谱);
  const 绯色履历 = computed(() => data.value.绯色履历);
  const 个人资产 = computed(() => data.value.个人资产);
  const 暗账 = computed(() => data.value.暗账);
  const 机遇与危机 = computed(() => data.value.机遇与危机);

  // ─── 人物统计 ───
  const 人物总数 = computed(() => Object.keys(人物库.value).length);
  const 绯色对象列表 = computed(() =>
    Object.entries(人物库.value)
      .filter(([, p]) => p.绯色关系 && p.角色标签?.includes('绯色对象'))
      .map(([name, p]) => ({ name, ...p })),
  );
  const 靠山列表 = computed(() =>
    Object.entries(人物库.value)
      .filter(([, p]) => p.靠山关系 || p.角色标签?.includes('靠山'))
      .map(([name, p]) => ({ name, ...p })),
  );
  const 竞争对手列表 = computed(() =>
    Object.entries(人物库.value)
      .filter(([, p]) => p.竞争关系 || p.角色标签?.includes('竞争对手'))
      .map(([name, p]) => ({ name, ...p })),
  );
  const 家属列表 = computed(() =>
    Object.entries(人物库.value)
      .filter(([, p]) => p.家庭关系 || p.角色标签?.includes('家属'))
      .map(([name, p]) => ({ name, ...p })),
  );

  // ─── 危机/机遇统计 ───
  const 危机数量 = computed(() => Object.keys(机遇与危机.value.潜在危机).length);
  const 机遇数量 = computed(() => Object.keys(机遇与危机.value.当前机遇).length);
  const 待办数量 = computed(() => Object.keys(机遇与危机.value.待办事项).length);

  // ─── 加载数据 ───
  async function loadData() {
    loading.value = true;
    lastError.value = null;
    try {
      // 优先尝试 MVU
      let rawData: Record<string, unknown> = {};
      try {
        await waitGlobalInitialized('Mvu');
        const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        rawData = mvuData?.stat_data || {};
        console.info('[绯色官途] 从 MVU 加载数据');
      } catch {
        // 如果 MVU 不可用，尝试角色卡变量
        try {
          rawData = getVariables({ type: 'character' });
          console.info('[绯色官途] 从角色卡变量加载数据');
        } catch {
          // 最后尝试聊天变量
          rawData = getVariables({ type: 'chat' });
          console.info('[绯色官途] 从聊天变量加载数据');
        }
      }

      const parsed = GameSchema.parse(rawData);
      data.value = parsed;
      initialized.value = true;
      isDirty.value = false;
      console.info('[绯色官途] 数据加载成功', { 人物数: Object.keys(parsed.人物库).length });
    } catch (err) {
      lastError.value = err instanceof Error ? err.message : String(err);
      console.error('[绯色官途] 数据加载失败', err);
      toastr.error('数据加载失败: ' + lastError.value);
    } finally {
      loading.value = false;
    }
  }

  // ─── 保存数据 ───
  async function saveData(partial?: Partial<GameData>) {
    loading.value = true;
    try {
      const toSave = partial ? { ...klona(data.value), ...partial } : klona(data.value);

      // 优先尝试 MVU
      try {
        await waitGlobalInitialized('Mvu');
        const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        mvuData.stat_data = toSave;
        await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });
        console.info('[绯色官途] 通过 MVU 保存数据');
      } catch {
        // 回退到角色卡变量
        try {
          replaceVariables(toSave, { type: 'character' });
          console.info('[绯色官途] 通过角色卡变量保存数据');
        } catch {
          replaceVariables(toSave, { type: 'chat' });
          console.info('[绯色官途] 通过聊天变量保存数据');
        }
      }

      if (partial) {
        Object.assign(data.value, partial);
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

  // ─── 更新单个字段 ───
  function updateField(path: string, value: unknown) {
    _.set(data.value, path, value);
    isDirty.value = true;
  }

  // ─── 人物操作 ───
  function addCharacter(name: string, char: 人物) {
    if (人物库.value[name]) {
      toastr.warning(`人物 "${name}" 已存在`);
      return false;
    }
    data.value.人物库[name] = char;
    isDirty.value = true;
    return true;
  }

  function updateCharacter(name: string, updates: Partial<人物>) {
    if (!人物库.value[name]) {
      toastr.warning(`人物 "${name}" 不存在`);
      return false;
    }
    Object.assign(data.value.人物库[name], updates);
    isDirty.value = true;
    return true;
  }

  function deleteCharacter(name: string) {
    if (!人物库.value[name]) return false;
    delete data.value.人物库[name];
    // 同步删除本地头像
    delete avatarCache.value[name];
    isDirty.value = true;
    return true;
  }

  // ─── 本地头像缓存 ───
  function setAvatar(charName: string, dataUrl: string) {
    avatarCache.value[charName] = dataUrl;
    // 持久化到 localStorage
    try {
      const cache = JSON.parse(localStorage.getItem('scarlet_avatars') || '{}');
      cache[charName] = dataUrl;
      localStorage.setItem('scarlet_avatars', JSON.stringify(cache));
    } catch (e) {
      console.warn('[绯色官途] 头像缓存保存失败', e);
    }
  }

  function getAvatar(charName: string): string | null {
    return avatarCache.value[charName] || null;
  }

  function clearAvatarCache() {
    avatarCache.value = {};
    localStorage.removeItem('scarlet_avatars');
    toastr.info('本地头像缓存已清空');
  }

  // 加载本地缓存
  function loadAvatarCache() {
    try {
      const cache = JSON.parse(localStorage.getItem('scarlet_avatars') || '{}');
      avatarCache.value = cache;
    } catch {
      avatarCache.value = {};
    }
  }

  // ─── 事件监听 ───
  function setupEventListeners() {
    // 聊天变化时重新加载
    eventOn(tavern_events.CHAT_CHANGED, () => {
      console.info('[绯色官途] 聊天变化，重新加载数据');
      loadData();
    });
  }

  // 初始化时加载头像缓存
  loadAvatarCache();

  return {
    // 状态
    data,
    loading,
    initialized,
    isDirty,
    lastError,
    avatarCache,

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

    // 统计
    人物总数,
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
    updateField,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setAvatar,
    getAvatar,
    clearAvatarCache,
    setupEventListeners,
  };
});
