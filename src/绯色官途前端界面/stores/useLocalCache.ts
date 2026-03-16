// ═══════════════════════════════════════════════════════════════
// 绯色官途 · 本地缓存管理 Store
// 用于存储头像、用户设置等不需要同步到 LLM 的数据
// ═══════════════════════════════════════════════════════════════

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// ═══ 常量 ═══
const AVATAR_CACHE_KEY = 'scarlet_avatars';
const SETTINGS_CACHE_KEY = 'scarlet_settings';
const MAX_AVATAR_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_AVATAR_COUNT = 50; // 最多缓存 50 个头像

export const useLocalCache = defineStore('localCache', () => {
  // ═══ State ═══
  const avatarCache = ref<Record<string, string>>({});
  const settingsCache = ref<Record<string, unknown>>({});

  // ═══ Computed ═══
  const avatarCount = computed(() => Object.keys(avatarCache.value).length);

  // ═══ 头像缓存管理 ═══

  /**
   * 加载本地头像缓存
   */
  function loadAvatarCache(): void {
    try {
      const cached = localStorage.getItem(AVATAR_CACHE_KEY);
      if (cached) {
        avatarCache.value = JSON.parse(cached);
        console.info('[绯色官途] 头像缓存已加载', { 数量: Object.keys(avatarCache.value).length });
      }
    } catch (e) {
      console.warn('[绯色官途] 头像缓存加载失败', e);
      avatarCache.value = {};
    }
  }

  /**
   * 保存头像缓存到 localStorage
   */
  function saveAvatarCache(): void {
    try {
      localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(avatarCache.value));
    } catch (e) {
      console.warn('[绯色官途] 头像缓存保存失败，可能超出容量限制', e);
      // 尝试清理旧头像后重试
      pruneOldAvatars();
      try {
        localStorage.setItem(AVATAR_CACHE_KEY, JSON.stringify(avatarCache.value));
      } catch {
        toastr.error('头像缓存保存失败，本地存储空间不足');
      }
    }
  }

  /**
   * 获取角色头像
   * @param name 角色姓名
   * @returns 头像 DataURL 或 null
   */
  function getAvatar(name: string): string | null {
    return avatarCache.value[name] || null;
  }

  /**
   * 设置角色头像
   * @param name 角色姓名
   * @param dataUrl 头像 DataURL
   * @returns 是否成功
   */
  function setAvatar(name: string, dataUrl: string): boolean {
    // 检查头像大小
    if (dataUrl.length > MAX_AVATAR_SIZE) {
      toastr.warning('图片太大，请压缩后上传（最大 4MB）');
      return false;
    }

    // 检查缓存数量，超出时自动清理
    if (avatarCount.value >= MAX_AVATAR_COUNT && !avatarCache.value[name]) {
      pruneOldAvatars();
    }

    avatarCache.value[name] = dataUrl;
    saveAvatarCache();
    console.info('[绯色官途] 头像已缓存', { 角色: name });
    return true;
  }

  /**
   * 删除角色头像
   * @param name 角色姓名
   */
  function removeAvatar(name: string): void {
    if (avatarCache.value[name]) {
      delete avatarCache.value[name];
      saveAvatarCache();
      console.info('[绯色官途] 头像已删除', { 角色: name });
    }
  }

  /**
   * 清空所有头像缓存
   */
  function clearAllAvatars(): void {
    avatarCache.value = {};
    localStorage.removeItem(AVATAR_CACHE_KEY);
    toastr.info('头像缓存已清空');
    console.info('[绯色官途] 头像缓存已清空');
  }

  /**
   * 清理旧头像（保留最近的）
   * 当缓存超出容量时自动调用
   */
  function pruneOldAvatars(): void {
    const entries = Object.entries(avatarCache.value);
    if (entries.length > MAX_AVATAR_COUNT - 10) {
      // 保留最后 40 个（按字母顺序，实际应该按时间，但简化处理）
      const toKeep = entries.slice(-(MAX_AVATAR_COUNT - 10));
      avatarCache.value = Object.fromEntries(toKeep);
      saveAvatarCache();
      console.info('[绯色官途] 已清理旧头像缓存', {
        清理前: entries.length,
        清理后: toKeep.length,
      });
    }
  }

  /**
   * 获取缓存占用大小（字节）
   * @returns 缓存大小
   */
  function getCacheSize(): number {
    try {
      const cacheStr = JSON.stringify(avatarCache.value);
      return new Blob([cacheStr]).size;
    } catch {
      return 0;
    }
  }

  /**
   * 获取格式化的缓存大小
   * @returns 格式化的大小字符串
   */
  function getFormattedCacheSize(): string {
    const size = getCacheSize();
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ═══ 设置缓存管理 ═══

  /**
   * 加载本地设置缓存
   */
  function loadSettingsCache(): void {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        settingsCache.value = JSON.parse(cached);
      }
    } catch {
      settingsCache.value = {};
    }
  }

  /**
   * 保存设置缓存
   */
  function saveSettingsCache(): void {
    try {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settingsCache.value));
    } catch (e) {
      console.warn('[绯色官途] 设置缓存保存失败', e);
    }
  }

  /**
   * 获取设置项
   * @param key 设置键名
   * @param defaultValue 默认值
   * @returns 设置值
   */
  function getSetting<T>(key: string, defaultValue: T): T {
    return (settingsCache.value[key] as T) ?? defaultValue;
  }

  /**
   * 设置设置项
   * @param key 设置键名
   * @param value 设置值
   */
  function setSetting<T>(key: string, value: T): void {
    settingsCache.value[key] = value;
    saveSettingsCache();
  }

  /**
   * 删除设置项
   * @param key 设置键名
   */
  function removeSetting(key: string): void {
    delete settingsCache.value[key];
    saveSettingsCache();
  }

  /**
   * 清空所有设置
   */
  function clearAllSettings(): void {
    settingsCache.value = {};
    localStorage.removeItem(SETTINGS_CACHE_KEY);
  }

  // ═══ 初始化 ═══
  loadAvatarCache();
  loadSettingsCache();

  return {
    // State
    avatarCache,
    settingsCache,

    // Computed
    avatarCount,

    // 头像管理
    getAvatar,
    setAvatar,
    removeAvatar,
    clearAllAvatars,
    pruneOldAvatars,
    getCacheSize,
    getFormattedCacheSize,

    // 设置管理
    getSetting,
    setSetting,
    removeSetting,
    clearAllSettings,

    // 重新加载
    loadAvatarCache,
    loadSettingsCache,
  };
});
