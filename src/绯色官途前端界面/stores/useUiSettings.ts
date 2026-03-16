// ═══════════════════════════════════════════════════════════════
// 绯色官途 · UI设置 Store
// ═══════════════════════════════════════════════════════════════

import { reactive } from 'vue';

/**
 * UI设置接口
 */
export interface UiSettings {
  /** 页面宽长比 (width / height) */
  aspectRatio: {
    width: number;
    height: number;
  };
}

/**
 * 本地存储键
 */
const UI_SETTINGS_KEY = 'scarlet_ui_settings';

/**
 * 默认UI设置
 */
const DEFAULT_UI_SETTINGS: UiSettings = {
  aspectRatio: {
    width: 16,
    height: 10,
  },
};

/**
 * 预设宽长比选项
 */
export const ASPECT_RATIO_PRESETS = [
  { width: 16, height: 9, label: '16:9 (宽屏)' },
  { width: 16, height: 10, label: '16:10 (标准)' },
  { width: 4, height: 3, label: '4:3 (经典)' },
  { width: 21, height: 9, label: '21:9 (超宽屏)' },
  { width: 3, height: 2, label: '3:2 (Surface)' },
  { width: 1, height: 1, label: '1:1 (正方形)' },
];

/**
 * UI设置状态
 */
const state = reactive<UiSettings>({
  aspectRatio: { ...DEFAULT_UI_SETTINGS.aspectRatio },
});

/**
 * UI设置 Store
 */
export function useUiSettings() {
  /**
   * 从本地存储加载设置
   */
  function loadSettings() {
    try {
      const stored = localStorage.getItem(UI_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UiSettings>;
        if (parsed.aspectRatio) {
          state.aspectRatio = { ...parsed.aspectRatio };
        }
      }
    } catch (error) {
      console.error('[绯色官途] 加载UI设置失败:', error);
    }
  }

  /**
   * 保存设置到本地存储
   */
  function saveSettings() {
    try {
      localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[绯色官途] 保存UI设置失败:', error);
    }
  }

  /**
   * 更新宽长比
   */
  function updateAspectRatio(width: number, height: number) {
    // 确保宽高为正数
    if (width <= 0 || height <= 0) {
      console.warn('[绯色官途] 无效的宽长比:', width, height);
      return;
    }

    state.aspectRatio.width = width;
    state.aspectRatio.height = height;
    saveSettings();
  }

  /**
   * 重置为默认设置
   */
  function resetToDefaults() {
    state.aspectRatio = { ...DEFAULT_UI_SETTINGS.aspectRatio };
    saveSettings();
  }

  /**
   * 获取当前宽长比的CSS值
   */
  function getAspectRatioCss(): string {
    return `${state.aspectRatio.width} / ${state.aspectRatio.height}`;
  }

  /**
   * 检查是否为预设值
   */
  function isPreset(width: number, height: number): boolean {
    return ASPECT_RATIO_PRESETS.some(preset => preset.width === width && preset.height === height);
  }

  // 初始化时加载设置
  loadSettings();

  return {
    // 状态
    settings: state,

    // 方法
    loadSettings,
    saveSettings,
    updateAspectRatio,
    resetToDefaults,
    getAspectRatioCss,
    isPreset,

    // 预设
    presets: ASPECT_RATIO_PRESETS,
  };
}
