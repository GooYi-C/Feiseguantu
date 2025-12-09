/**
 * 公共的 Todo List 逻辑
 * 实现勾选删除变量、取消勾选恢复变量的功能
 * 关键：保持列表项在原位显示，不因勾选状态改变顺序
 */
import { ref, computed, onMounted } from 'vue';

export interface TodoItem<T> {
  key: string;
  data: T;
  isHidden: boolean;
  /** 原始排序索引，用于保持顺序稳定 */
  sortIndex: number;
}

export interface TodoListOptions<T> {
  /** localStorage 缓存键 */
  cacheKey: string;
  /** 获取活跃项数据的函数 */
  getActiveItems: () => Record<string, T>;
  /** 删除活跃项的函数 */
  deleteActiveItem: (key: string) => void;
  /** 恢复活跃项的函数 */
  restoreActiveItem: (key: string, data: T) => void;
  /** 保存到后端的函数 */
  saveToBackend: () => Promise<void>;
  /** 排序函数（可选，默认按 sortIndex 排序） */
  sortFn?: (a: TodoItem<T>, b: TodoItem<T>) => number;
}

export function useTodoList<T>(options: TodoListOptions<T>) {
  const { cacheKey, getActiveItems, deleteActiveItem, restoreActiveItem, saveToBackend, sortFn } = options;

  // 缓存结构：{ key -> { data, sortIndex } }
  const hiddenCache = ref<Record<string, { data: T; sortIndex: number }>>({});
  // 排序索引计数器（用于新增项）
  let sortIndexCounter = 0;
  // 已分配的排序索引映射
  const sortIndexMap = ref<Record<string, number>>({});

  // 加载缓存
  onMounted(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        hiddenCache.value = JSON.parse(cached);
        // 初始化排序索引计数器
        for (const item of Object.values(hiddenCache.value)) {
          if (item.sortIndex >= sortIndexCounter) {
            sortIndexCounter = item.sortIndex + 1;
          }
        }
      }
    } catch {
      hiddenCache.value = {};
    }

    // 为现有活跃项分配排序索引
    const activeItems = getActiveItems();
    for (const key of Object.keys(activeItems)) {
      if (hiddenCache.value[key]) {
        // 使用缓存中的排序索引
        sortIndexMap.value[key] = hiddenCache.value[key].sortIndex;
      } else if (!sortIndexMap.value[key]) {
        sortIndexMap.value[key] = sortIndexCounter++;
      }
    }
  });

  // 保存缓存
  function saveCache() {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(hiddenCache.value));
    } catch (e) {
      console.warn('[绯色官途] 缓存保存失败', e);
    }
  }

  // 合并列表：活跃项 + 隐藏项，按 sortIndex 排序保持原位
  const mergedList = computed(() => {
    const result: TodoItem<T>[] = [];
    const activeItems = getActiveItems();

    // 添加活跃项
    for (const [key, data] of Object.entries(activeItems)) {
      // 获取或分配排序索引
      if (!sortIndexMap.value[key]) {
        sortIndexMap.value[key] = sortIndexCounter++;
      }
      result.push({
        key,
        data: data as T,
        isHidden: false,
        sortIndex: sortIndexMap.value[key],
      });
    }

    // 添加隐藏项
    for (const [key, cached] of Object.entries(hiddenCache.value)) {
      // 确保活跃项中没有这个 key
      if (!activeItems[key]) {
        result.push({
          key,
          data: cached.data,
          isHidden: true,
          sortIndex: cached.sortIndex,
        });
      }
    }

    // 排序：使用自定义排序函数或默认按 sortIndex
    if (sortFn) {
      result.sort(sortFn);
    } else {
      result.sort((a, b) => a.sortIndex - b.sortIndex);
    }

    return result;
  });

  // 切换项目状态
  async function toggleItem(key: string, data: T, isCurrentlyHidden: boolean) {
    if (isCurrentlyHidden) {
      // 取消勾选：从缓存恢复到活跃
      const cached = hiddenCache.value[key];
      if (cached) {
        // 恢复排序索引
        sortIndexMap.value[key] = cached.sortIndex;
        restoreActiveItem(key, cached.data);
        delete hiddenCache.value[key];
        saveCache();
        await saveToBackend();
        console.info('[绯色官途] 项目已恢复:', key);
      }
    } else {
      // 勾选：从活跃移除到缓存
      const sortIndex = sortIndexMap.value[key] ?? sortIndexCounter++;
      hiddenCache.value[key] = { data, sortIndex };
      deleteActiveItem(key);
      saveCache();
      await saveToBackend();
      console.info('[绯色官途] 项目已移除:', key);
    }
  }

  // 统计
  const activeCount = computed(() => Object.keys(getActiveItems()).length);
  const hiddenCount = computed(() => Object.keys(hiddenCache.value).length);
  const totalCount = computed(() => activeCount.value + hiddenCount.value);

  return {
    mergedList,
    toggleItem,
    activeCount,
    hiddenCount,
    totalCount,
    hiddenCache,
  };
}

/**
 * 带类型分组的 Todo List（如：被握把柄、手握把柄）
 */
export interface GroupedTodoListOptions<T> {
  cacheKey: string;
  groups: {
    type: string;
    getActiveItems: () => Record<string, T>;
    deleteActiveItem: (key: string) => void;
    restoreActiveItem: (key: string, data: T) => void;
  }[];
  saveToBackend: () => Promise<void>;
  sortFn?: (a: TodoItem<T> & { type: string }, b: TodoItem<T> & { type: string }) => number;
}

export function useGroupedTodoList<T>(options: GroupedTodoListOptions<T>) {
  const { cacheKey, groups, saveToBackend, sortFn } = options;

  // 缓存结构：{ key -> { type, data, sortIndex } }
  const hiddenCache = ref<Record<string, { type: string; data: T; sortIndex: number }>>({});
  let sortIndexCounter = 0;
  const sortIndexMap = ref<Record<string, number>>({});

  onMounted(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        hiddenCache.value = JSON.parse(cached);
        for (const item of Object.values(hiddenCache.value)) {
          if (item.sortIndex >= sortIndexCounter) {
            sortIndexCounter = item.sortIndex + 1;
          }
        }
      }
    } catch {
      hiddenCache.value = {};
    }

    // 为现有活跃项分配排序索引
    for (const group of groups) {
      const activeItems = group.getActiveItems();
      for (const key of Object.keys(activeItems)) {
        const cacheKey = `${group.type}:${key}`;
        if (hiddenCache.value[key]?.type === group.type) {
          sortIndexMap.value[cacheKey] = hiddenCache.value[key].sortIndex;
        } else if (!sortIndexMap.value[cacheKey]) {
          sortIndexMap.value[cacheKey] = sortIndexCounter++;
        }
      }
    }
  });

  function saveCache() {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(hiddenCache.value));
    } catch (e) {
      console.warn('[绯色官途] 缓存保存失败', e);
    }
  }

  // 获取特定分组的合并列表
  function getMergedListForGroup(groupType: string) {
    return computed(() => {
      const result: (TodoItem<T> & { type: string })[] = [];
      const group = groups.find(g => g.type === groupType);
      if (!group) return result;

      const activeItems = group.getActiveItems();

      // 添加活跃项
      for (const [key, data] of Object.entries(activeItems)) {
        const cacheKey = `${groupType}:${key}`;
        if (!sortIndexMap.value[cacheKey]) {
          sortIndexMap.value[cacheKey] = sortIndexCounter++;
        }
        result.push({
          key,
          data: data as T,
          isHidden: false,
          sortIndex: sortIndexMap.value[cacheKey],
          type: groupType,
        });
      }

      // 添加隐藏项
      for (const [key, cached] of Object.entries(hiddenCache.value)) {
        if (cached.type === groupType && !activeItems[key]) {
          result.push({
            key,
            data: cached.data,
            isHidden: true,
            sortIndex: cached.sortIndex,
            type: groupType,
          });
        }
      }

      if (sortFn) {
        result.sort(sortFn);
      } else {
        result.sort((a, b) => a.sortIndex - b.sortIndex);
      }

      return result;
    });
  }

  async function toggleItem(groupType: string, key: string, data: T, isCurrentlyHidden: boolean) {
    const group = groups.find(g => g.type === groupType);
    if (!group) return;

    const cacheKeyStr = `${groupType}:${key}`;

    if (isCurrentlyHidden) {
      const cached = hiddenCache.value[key];
      if (cached && cached.type === groupType) {
        sortIndexMap.value[cacheKeyStr] = cached.sortIndex;
        group.restoreActiveItem(key, cached.data);
        delete hiddenCache.value[key];
        saveCache();
        await saveToBackend();
      }
    } else {
      const sortIndex = sortIndexMap.value[cacheKeyStr] ?? sortIndexCounter++;
      hiddenCache.value[key] = { type: groupType, data, sortIndex };
      group.deleteActiveItem(key);
      saveCache();
      await saveToBackend();
    }
  }

  const hiddenCount = computed(() => Object.keys(hiddenCache.value).length);

  // 计算所有分组的活跃项总数
  const activeCount = computed(() => {
    let count = 0;
    for (const group of groups) {
      count += Object.keys(group.getActiveItems()).length;
    }
    return count;
  });

  // 总数 = 活跃数 + 隐藏数
  const totalCount = computed(() => activeCount.value + hiddenCount.value);

  return {
    getMergedListForGroup,
    toggleItem,
    activeCount,
    hiddenCount,
    totalCount,
    hiddenCache,
  };
}

