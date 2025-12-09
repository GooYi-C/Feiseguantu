/**
 * 全局角色抽屉状态管理
 * 用于在任何页面通过 CharacterName 组件打开角色详情抽屉
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useCharacterDrawer = defineStore('characterDrawer', () => {
  // 当前显示的角色名称
  const currentCharacter = ref<string | null>(null);

  // 抽屉是否打开
  const isOpen = ref(false);

  /**
   * 打开角色抽屉
   * @param name 角色名称
   */
  function open(name: string) {
    currentCharacter.value = name;
    isOpen.value = true;
  }

  /**
   * 关闭角色抽屉
   */
  function close() {
    isOpen.value = false;
    // 延迟清除角色名，等待动画完成
    setTimeout(() => {
      if (!isOpen.value) {
        currentCharacter.value = null;
      }
    }, 300);
  }

  return {
    currentCharacter,
    isOpen,
    open,
    close,
  };
});

