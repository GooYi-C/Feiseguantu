// ═══════════════════════════════════════════════════════════════
// 绯色官途 · 人物管理 Store
// 专门管理人物库的 CRUD 操作和分类查询
// ═══════════════════════════════════════════════════════════════

import { defineStore, storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useGameData } from './useGameData';
import { 人物Schema, type 人物 } from './schema';

export const useCharacters = defineStore('characters', () => {
  const gameData = useGameData();
  const { rawData, isDirty } = storeToRefs(gameData);

  // ═══ Getters ═══
  const 人物库 = computed(() => rawData.value.人物库 || {});
  const 人物列表 = computed(() => Object.entries(人物库.value));
  const 人物总数 = computed(() => 人物列表.value.length);
  const 人物名单 = computed(() => Object.keys(人物库.value));

  // ─── 按类型分组 ───

  // 绯色对象：需要有实际的绯色关系内容（关系阶段不为空/无）或有绯色对象标签
  const 绯色对象列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.绯色关系 && p.绯色关系.关系阶段 && p.绯色关系.关系阶段 !== '无') ||
          p.角色标签?.includes('绯色对象'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 靠山：需要有实际的靠山关系内容或有靠山标签
  const 靠山列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.靠山关系 && p.靠山关系.紧密度 && p.靠山关系.紧密度 !== '无') ||
          p.角色标签?.includes('靠山'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 竞争对手：需要有实际的竞争关系内容或有竞争对手标签
  const 竞争对手列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.竞争关系 && p.竞争关系.竞争目标 && p.竞争关系.竞争目标 !== '无') ||
          p.角色标签?.includes('竞争对手'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // 家属：需要有实际的家庭关系内容或有家属标签
  const 家属列表 = computed(() =>
    人物列表.value
      .filter(
        ([, p]) =>
          (p.家庭关系 && p.家庭关系.关系 && p.家庭关系.关系 !== '无') ||
          p.角色标签?.includes('家属'),
      )
      .map(([name, p]) => ({ name, ...p })),
  );

  // ═══ Actions ═══

  /**
   * 新增人物
   * @param name 人物姓名（作为唯一标识）
   * @param data 人物数据（可选）
   * @returns 是否成功
   */
  function addCharacter(name: string, data: Partial<人物> = {}): boolean {
    if (!name || name.trim() === '') {
      toastr.warning('人物姓名不能为空');
      return false;
    }

    const trimmedName = name.trim();
    if (人物库.value[trimmedName]) {
      toastr.warning(`人物「${trimmedName}」已存在`);
      return false;
    }

    rawData.value.人物库[trimmedName] = 人物Schema.parse({ 姓名: trimmedName, ...data });
    isDirty.value = true;
    console.info(`[绯色官途] 新增人物: ${trimmedName}`);
    return true;
  }

  /**
   * 更新人物信息
   * @param name 人物姓名
   * @param updates 要更新的字段
   * @returns 是否成功
   */
  function updateCharacter(name: string, updates: Partial<人物>): boolean {
    if (!人物库.value[name]) {
      toastr.warning(`人物「${name}」不存在`);
      return false;
    }

    Object.assign(rawData.value.人物库[name], updates);
    isDirty.value = true;
    console.info(`[绯色官途] 更新人物: ${name}`);
    return true;
  }

  /**
   * 删除人物
   * @param name 人物姓名
   * @returns 是否成功
   */
  function deleteCharacter(name: string): boolean {
    if (!人物库.value[name]) {
      return false;
    }

    delete rawData.value.人物库[name];
    isDirty.value = true;
    console.info(`[绯色官途] 删除人物: ${name}`);
    return true;
  }

  /**
   * 获取人物信息
   * @param name 人物姓名
   * @returns 人物对象或 null
   */
  function getCharacter(name: string): 人物 | null {
    return 人物库.value[name] || null;
  }

  /**
   * 检查角色是否存在于人物库
   * @param name 人物姓名
   * @returns 是否存在
   */
  function existsInLibrary(name: string): boolean {
    return !!人物库.value[name];
  }

  /**
   * 根据姓名快速查询人物（用于角色名悬浮卡片）
   * @param name 人物姓名
   * @returns 人物信息对象（含姓名字段）或 null
   */
  function getCharacterByName(name: string): (人物 & { name: string }) | null {
    const char = 人物库.value[name];
    if (!char) return null;
    return { name, ...char };
  }

  /**
   * 按关键词搜索人物
   * @param query 搜索关键词
   * @returns 匹配的人物列表
   */
  function searchCharacters(query: string): [string, 人物][] {
    if (!query || query.trim() === '') {
      return 人物列表.value;
    }

    const q = query.toLowerCase().trim();
    return 人物列表.value.filter(
      ([name, char]) =>
        name.toLowerCase().includes(q) ||
        (char.职务 as string).toLowerCase().includes(q) ||
        (char.单位 as string).toLowerCase().includes(q) ||
        char.角色标签?.some(tag => tag.toLowerCase().includes(q)),
    );
  }

  /**
   * 按角色类型筛选人物
   * @param type 角色类型
   * @returns 匹配的人物列表
   */
  function filterByType(
    type: 'all' | 'romance' | 'backer' | 'rival' | 'family',
  ): [string, 人物][] {
    if (type === 'all') {
      return 人物列表.value;
    }

    return 人物列表.value.filter(([, char]) => {
      switch (type) {
        case 'romance':
          return (
            (char.绯色关系 && char.绯色关系.关系阶段 && char.绯色关系.关系阶段 !== '无') ||
            char.角色标签?.includes('绯色对象')
          );
        case 'backer':
          return (
            (char.靠山关系 && char.靠山关系.紧密度 && char.靠山关系.紧密度 !== '无') ||
            char.角色标签?.includes('靠山')
          );
        case 'rival':
          return (
            (char.竞争关系 && char.竞争关系.竞争目标 && char.竞争关系.竞争目标 !== '无') ||
            char.角色标签?.includes('竞争对手')
          );
        case 'family':
          return (
            (char.家庭关系 && char.家庭关系.关系 && char.家庭关系.关系 !== '无') ||
            char.角色标签?.includes('家属')
          );
        default:
          return true;
      }
    });
  }

  /**
   * 按性别筛选人物
   * @param gender 性别
   * @returns 匹配的人物列表
   */
  function filterByGender(gender: '全部' | '男' | '女'): [string, 人物][] {
    if (gender === '全部') {
      return 人物列表.value;
    }
    return 人物列表.value.filter(([, char]) => char.性别 === gender);
  }

  return {
    // Getters
    人物库,
    人物列表,
    人物总数,
    人物名单,
    绯色对象列表,
    靠山列表,
    竞争对手列表,
    家属列表,

    // Actions
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacter,
    existsInLibrary,
    getCharacterByName,
    searchCharacters,
    filterByType,
    filterByGender,
  };
});

