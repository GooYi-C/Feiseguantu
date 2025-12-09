<template>
  <span
    ref="nameRef"
    v-bind="$attrs"
    class="character-name"
    :class="{
      exists: exists,
      male: gender === '男',
      female: gender === '女',
      clickable: exists && clickable,
    }"
    @click="handleClick"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    {{ displayName }}
  </span>

  <!-- 悬浮卡片 - 使用 Teleport 避免被父容器裁切 -->
  <Teleport to="body">
    <Transition name="char-tooltip">
      <div
        v-if="tooltipVisible && exists && character"
        ref="tooltipRef"
        class="character-tooltip-global"
        :style="tooltipStyle"
      >
        <div class="tooltip-header">
          <span class="tooltip-name" :class="genderClass">{{ pureName }}</span>
          <span class="tooltip-gender" :class="genderClass">
            <i :class="genderIcon"></i>
            {{ gender }}
          </span>
        </div>

        <div class="tooltip-info">
          <span v-if="character.年龄 > 0" class="info-item">
            <i class="fas fa-calendar"></i> {{ character.年龄 }}岁
          </span>
          <span v-if="character.级别 !== '无'" class="info-item">
            <i class="fas fa-medal"></i> {{ character.级别 }}
          </span>
          <span v-if="character.职务 !== '无'" class="info-item">
            <i class="fas fa-briefcase"></i> {{ character.职务 }}
          </span>
          <span v-if="character.单位 !== '无'" class="info-item">
            <i class="fas fa-building"></i> {{ character.单位 }}
          </span>
        </div>

        <!-- 数值条 -->
        <div v-if="character.好感度 !== undefined" class="tooltip-stats">
          <div class="mini-stat">
            <span class="stat-label"><i class="fas fa-heart"></i></span>
            <div class="stat-bar">
              <div class="fill" :style="{ width: character.好感度 + '%' }" :class="statColor(character.好感度)"></div>
            </div>
            <span class="stat-value">{{ character.好感度 }}</span>
          </div>
          <div class="mini-stat">
            <span class="stat-label"><i class="fas fa-handshake"></i></span>
            <div class="stat-bar">
              <div class="fill" :style="{ width: character.信任度 + '%' }" :class="statColor(character.信任度)"></div>
            </div>
            <span class="stat-value">{{ character.信任度 }}</span>
          </div>
        </div>

        <div v-if="displayTags.length > 0" class="tooltip-tags">
          <span v-for="tag in displayTags" :key="tag" class="tag" :class="tagClass(tag)">
            {{ tag }}
          </span>
        </div>

        <!-- 箭头 -->
        <div class="tooltip-arrow" :class="tooltipDirection"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useCharacters, useCharacterDrawer } from '../../stores';

// 禁用自动继承 attrs，因为组件有多个根节点（span + Teleport）
defineOptions({
  inheritAttrs: false,
});

// ═══ Props ═══
const props = withDefaults(
  defineProps<{
    name: string;
    clickable?: boolean;
  }>(),
  {
    clickable: true,
  },
);

// ═══ Store ═══
const characters = useCharacters();
const characterDrawer = useCharacterDrawer();

// ═══ State ═══
const tooltipVisible = ref(false);
const nameRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const tooltipDirection = ref<'top' | 'bottom'>('top');

// ═══ 正则提取纯名字 ═══
// 匹配括号前的名字，支持中文全角/半角括号
const pureName = computed(() => {
  const match = props.name.match(/^([^（(]+)/);
  return match ? match[1].trim() : props.name;
});

// 显示的名字（原始传入的名字）
const displayName = computed(() => props.name);

// ═══ Computed ═══
// 使用提取的纯名字来匹配人物库
const exists = computed(() => characters.existsInLibrary(pureName.value));
const character = computed(() => characters.getCharacter(pureName.value));
const gender = computed(() => character.value?.性别 || '无');

const genderClass = computed(() => {
  if (gender.value === '男') return 'male';
  if (gender.value === '女') return 'female';
  return '';
});

const genderIcon = computed(() => {
  if (gender.value === '男') return 'fas fa-mars';
  if (gender.value === '女') return 'fas fa-venus';
  return 'fas fa-genderless';
});

const displayTags = computed(() => character.value?.角色标签?.slice(0, 4) || []);

const tooltipStyle = computed(() => {
  const style: Record<string, string> = {
    left: tooltipPosition.value.x + 'px',
  };

  if (tooltipDirection.value === 'top') {
    style.bottom = window.innerHeight - tooltipPosition.value.y + 8 + 'px';
  } else {
    style.top = tooltipPosition.value.y + 8 + 'px';
  }

  return style;
});

// ═══ Methods ═══
function handleClick(e: MouseEvent) {
  if (exists.value && props.clickable) {
    e.stopPropagation();
    e.preventDefault();
    // 使用提取的纯名字打开抽屉
    characterDrawer.open(pureName.value);
  }
}

async function showTooltip() {
  if (!exists.value || !nameRef.value) return;

  tooltipVisible.value = true;

  await nextTick();

  const rect = nameRef.value.getBoundingClientRect();
  const tooltipHeight = tooltipRef.value?.offsetHeight || 150;

  // 计算水平位置，确保不超出屏幕
  let x = rect.left + rect.width / 2;
  const tooltipWidth = tooltipRef.value?.offsetWidth || 240;
  const halfWidth = tooltipWidth / 2;

  if (x - halfWidth < 10) {
    x = halfWidth + 10;
  } else if (x + halfWidth > window.innerWidth - 10) {
    x = window.innerWidth - halfWidth - 10;
  }

  // 判断上方还是下方显示
  if (rect.top > tooltipHeight + 20) {
    tooltipDirection.value = 'top';
    tooltipPosition.value = { x, y: rect.top };
  } else {
    tooltipDirection.value = 'bottom';
    tooltipPosition.value = { x, y: rect.bottom };
  }
}

function hideTooltip() {
  tooltipVisible.value = false;
}

function statColor(val: number) {
  if (val >= 80) return 'high';
  if (val >= 50) return 'mid';
  return 'low';
}

function tagClass(tag: string) {
  if (['靠山', '一把手', '直接上级', '核心嫡系'].includes(tag)) return 'gold';
  if (['绯色对象'].includes(tag)) return 'romance';
  if (['竞争对手', '政治宿敌'].includes(tag)) return 'danger';
  if (['家属'].includes(tag)) return 'info';
  return '';
}
</script>

<style lang="scss" scoped>
// ═══ 角色名 - 现代化胶囊样式 ═══
.character-name {
  display: inline-flex;
  align-items: center;
  font-size: inherit;
  line-height: 1.2;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 2px 8px;
  margin: 0 2px;

  // 存在于人物库的角色 - 有背景的胶囊样式
  &.exists {
    background: rgba(100, 100, 100, 0.15);
    
    &.clickable {
      cursor: pointer;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }

    // 男性 - 蓝色系
    &.male {
      background: rgba(74, 144, 217, 0.15) !important;
      color: #5ba0e0 !important;
      
      &:hover {
        background: rgba(74, 144, 217, 0.25) !important;
      }
    }

    // 女性 - 粉色系
    &.female {
      background: rgba(232, 67, 147, 0.15) !important;
      color: #e84393 !important;
      
      &:hover {
        background: rgba(232, 67, 147, 0.25) !important;
      }
    }
  }

  // 不存在于人物库的角色 - 普通文本
  &:not(.exists) {
    background: transparent;
    padding: 0;
    margin: 0;
    color: var(--color-text-muted) !important;
    cursor: default;
  }
}
</style>

<style lang="scss">
// ═══ 全局悬浮卡片样式 (非 scoped，因为使用了 Teleport) ═══
.character-tooltip-global {
  position: fixed;
  transform: translateX(-50%);
  z-index: 10000;
  min-width: 220px;
  max-width: 280px;
  padding: 10px 14px;
  background: var(--color-bg-card, #1a1d26);
  border: 1px solid var(--color-border, #2a2e3a);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  pointer-events: none;

  .tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border, #2a2e3a);
  }

  .tooltip-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #e4e4e7);

    &.male {
      color: #4a90d9;
    }

    &.female {
      color: #e84393;
    }
  }

  .tooltip-gender {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;

    &.male {
      background: rgba(74, 144, 217, 0.15);
      color: #4a90d9;
    }

    &.female {
      background: rgba(232, 67, 147, 0.15);
      color: #e84393;
    }
  }

  .tooltip-info {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin-bottom: 8px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-secondary, #a1a1aa);

    i {
      color: var(--color-gold, #d8a657);
      font-size: 10px;
    }
  }

  .tooltip-stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .mini-stat {
    display: flex;
    align-items: center;
    gap: 6px;

    .stat-label {
      width: 16px;
      font-size: 10px;
      text-align: center;

      i {
        color: var(--color-gold, #d8a657);
      }
    }

    .stat-bar {
      flex: 1;
      height: 4px;
      background: var(--color-bg-elevated, #22252f);
      border-radius: 2px;
      overflow: hidden;

      .fill {
        height: 100%;
        border-radius: 2px;

        &.high {
          background: var(--color-success, #4ac18e);
        }
        &.mid {
          background: var(--color-warning, #e0c36c);
        }
        &.low {
          background: var(--color-danger, #ff6b6b);
        }
      }
    }

    .stat-value {
      width: 20px;
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted, #71717a);
      text-align: right;
    }
  }

  .tooltip-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .tag {
    font-size: 10px;
    padding: 2px 6px;
    background: var(--color-bg-elevated, #22252f);
    border-radius: 4px;
    color: var(--color-text-muted, #71717a);

    &.gold {
      background: rgba(216, 166, 87, 0.15);
      color: var(--color-gold, #d8a657);
    }
    &.romance {
      background: rgba(255, 77, 109, 0.15);
      color: var(--color-romance-light, #ff4d6d);
    }
    &.danger {
      background: rgba(255, 107, 107, 0.15);
      color: var(--color-danger, #ff6b6b);
    }
    &.info {
      background: rgba(122, 162, 247, 0.15);
      color: var(--color-info, #7aa2f7);
    }
  }

  // 箭头
  .tooltip-arrow {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;

    &.top {
      bottom: -6px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid var(--color-bg-card, #1a1d26);

      &::before {
        content: '';
        position: absolute;
        bottom: 1px;
        left: -7px;
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 7px solid var(--color-border, #2a2e3a);
        z-index: -1;
      }
    }

    &.bottom {
      top: -6px;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid var(--color-bg-card, #1a1d26);

      &::before {
        content: '';
        position: absolute;
        top: 1px;
        left: -7px;
        width: 0;
        height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-bottom: 7px solid var(--color-border, #2a2e3a);
        z-index: -1;
      }
    }
  }
}

// ═══ 过渡动画 ═══
.char-tooltip-enter-active,
.char-tooltip-leave-active {
  transition: all 0.15s ease;
}

.char-tooltip-enter-from,
.char-tooltip-leave-to {
  opacity: 0;
}
</style>
