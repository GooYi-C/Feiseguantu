// ═══════════════════════════════════════════════════════════════
// 绯色官途 · Stores 统一导出
// ═══════════════════════════════════════════════════════════════

// 核心数据 Store
export { useGameData, type DataSource } from './useGameData';

// 人物管理 Store
export { useCharacters } from './useCharacters';

// 本地缓存 Store
export { useLocalCache } from './useLocalCache';

// 全局角色抽屉状态
export { useCharacterDrawer } from './useCharacterDrawer';

// MVU设置 Store
export {
  SCARLET_MVU_EVENTS,
  useMvuSettings,
  type ApiConfig,
  type MvuSettings,
  type PendingUpdateData,
} from './useMvuSettings';

// UI设置 Store
export { ASPECT_RATIO_PRESETS, useUiSettings, type UiSettings } from './useUiSettings';

// 旧版 Store（保留兼容性，建议使用 useGameData）
export { useGameStore } from './game';

// Schema 和类型导出
export {
  GameSchema,
  人物Schema,
  体系枚举,
  婚姻状态枚举,
  性别枚举,
  政治气候枚举,
  type GameData,
  type 人物,
  type 绯色关系,
} from './schema';
