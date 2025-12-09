<template>
  <div class="characters-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <!-- 视图切换 -->
      <div class="view-toggle">
        <button
          :class="{ active: viewMode === 'cards' }"
          @click="viewMode = 'cards'"
          title="卡片视图"
        >
          <i class="fas fa-grip"></i>
        </button>
        <button
          :class="{ active: viewMode === 'network' }"
          @click="viewMode = 'network'"
          title="关系网视图"
        >
          <i class="fas fa-diagram-project"></i>
        </button>
      </div>

      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" type="text" placeholder="搜索人物..." />
      </div>
      <div class="filters">
        <select v-model="filterRelation" class="filter-select">
          <option value="">全部关系</option>
          <option value="官场关系">官场关系</option>
          <option value="绯色关系">绯色关系</option>
          <option value="竞争关系">竞争关系</option>
          <option value="靠山关系">靠山关系</option>
          <option value="家庭关系">家庭关系</option>
        </select>
        <select v-model="filterGender" class="filter-select">
          <option value="">全部性别</option>
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <button class="add-btn" @click="showAddModal = true">
        <i class="fas fa-plus"></i> 新增人物
      </button>
    </div>

    <!-- 卡片视图 -->
    <div v-show="viewMode === 'cards'" class="cards-view">
      <div class="char-grid">
      <div
        v-for="[name, char] in filteredCharacters"
        :key="name"
          class="char-card poker-style"
        :class="[
          { selected: selectedChar === name },
          genderClass(char.性别),
          cardTypeClass(char),
        ]"
        @click="selectChar(name)"
      >
          <!-- 左上角状态角标（显示人物状态字段） -->
          <div v-if="char.状态 && char.状态 !== '无'" class="status-badge" :class="statusClass(char.状态)">
            {{ char.状态 }}
          </div>

          <!-- 右上角标签区域 -->
          <div class="card-tags-side">
            <span
              v-for="tag in displayTags(char)"
              :key="tag"
              class="tag-side"
              :class="tagClass(tag)"
            >
              {{ tag }}
            </span>
          </div>

          <!-- 头像区域（用样式区分性别） -->
          <div class="card-avatar" :class="genderClass(char.性别)" :style="avatarStyle(name)">
            <i v-if="!getAvatar(name)" :class="avatarIcon(char.性别)" class="default-avatar"></i>
          </div>

          <!-- 信息区域（每行一个字段） -->
          <div class="card-info">
            <h4 class="card-name" :class="genderClass(char.性别)">{{ name }}</h4>
            <div class="card-details-list">
              <div v-if="char.年龄 > 0" class="detail-row">
                <i class="fas fa-calendar"></i>
                <span>{{ char.年龄 }}岁</span>
              </div>
              <div v-if="char.体系 && char.体系 !== '无'" class="detail-row">
                <i class="fas fa-sitemap"></i>
                <span>{{ char.体系 }}</span>
              </div>
              <div v-if="char.级别 && char.级别 !== '无'" class="detail-row rank">
                <i class="fas fa-medal"></i>
                <span>{{ char.级别 }}</span>
              </div>
              <div v-if="char.单位 && char.单位 !== '无'" class="detail-row org">
                <i class="fas fa-building"></i>
                <span>{{ char.单位 }}</span>
        </div>
            </div>
          </div>

          <!-- 当前状态（底部，完整显示不省略） -->
          <div v-if="char.当前状态 && char.当前状态 !== '无'" class="card-status">
            「{{ char.当前状态 }}」
            </div>

          <!-- 好感度指示器 -->
          <div class="favor-indicator" v-if="char.好感度">
            <div class="favor-bar" :style="{ width: char.好感度 + '%' }" :class="favorColor(char.好感度)"></div>
          </div>
        </div>
      </div>
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <i class="fas fa-users-slash"></i>
        <p>暂无符合条件的人物</p>
      </div>
    </div>

    <!-- 关系网视图 -->
    <div v-show="viewMode === 'network'" class="network-view">
      <!-- 图例 -->
      <div class="legend">
        <div class="legend-item" v-for="rel in relationTypes" :key="rel.key">
          <span class="legend-line" :style="{ background: rel.color }"></span>
          <span>{{ rel.label }}</span>
        </div>
      </div>

      <!-- 关系网图 -->
      <div class="graph-container" ref="graphContainer">
        <svg class="relation-graph" :viewBox="viewBox" @wheel="handleZoom" @mousedown="startPan">
          <defs>
            <linearGradient id="grad-romance" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color: #c41e3a" />
              <stop offset="100%" style="stop-color: #ff4d6d" />
            </linearGradient>
          </defs>

          <g :transform="`translate(${pan.x}, ${pan.y}) scale(${zoom})`">
            <!-- 连接线 - 每个节点到中心的边 -->
            <g class="edges">
              <line
                v-for="node in networkNodes"
                :key="`edge-${node.name}`"
                :x1="centerX"
                :y1="centerY"
                :x2="node.x"
                :y2="node.y"
                :stroke="getEdgeColor(node.relationType)"
                :stroke-width="getEdgeWidth(node.relationType)"
                :stroke-dasharray="getEdgeDash(node.relationType)"
                opacity="0.6"
              />
            </g>

            <!-- 节点 -->
            <g class="nodes">
              <!-- 中心节点：玩家 -->
              <g class="node player" :transform="`translate(${centerX}, ${centerY})`">
                <circle r="30" fill="url(#grad-romance)" />
                <text y="5" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
                  {{ 玩家姓名 }}
                </text>
              </g>

              <!-- 其他人物节点 -->
              <g
                v-for="node in networkNodes"
                :key="node.name"
                class="node"
                :class="{ selected: selectedChar === node.name, dimmed: node.dimmed }"
                :transform="`translate(${node.x}, ${node.y})`"
                @click="selectChar(node.name)"
              >
                <circle :r="node.radius" :fill="node.fill" :stroke="node.stroke" stroke-width="2" />
                <text :y="node.radius + 14" text-anchor="middle" fill="var(--color-text-secondary)" font-size="11">
                  {{ node.name }}
                </text>
              </g>
            </g>
          </g>
        </svg>

        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <button @click="zoomIn"><i class="fas fa-plus"></i></button>
          <button @click="resetView"><i class="fas fa-crosshairs"></i></button>
          <button @click="zoomOut"><i class="fas fa-minus"></i></button>
        </div>

        <!-- 统计信息 -->
        <div class="stats-overlay">
          <span class="node-count">
            <i class="fas fa-users"></i>
            {{ networkNodes.length }} / {{ 人物总数 }} 人物
          </span>
        </div>
      </div>
    </div>

    <!-- 使用新的 CharacterDrawer 组件 -->
    <CharacterDrawer
      v-model="showDrawer"
      :character-name="selectedChar || ''"
      @deleted="handleDeleted"
      @updated="handleUpdated"
    />

    <!-- 使用新的 AddCharacterModal 组件 -->
    <AddCharacterModal
      v-model="showAddModal"
      @created="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCharacters, useLocalCache, useGameData } from '../stores';
import { CharacterDrawer, AddCharacterModal } from '../components/character';
import type { 人物 } from '../stores/schema';

// 使用拆分后的 Store
const characters = useCharacters();
const localCache = useLocalCache();
const gameData = useGameData();

// 视图模式
const viewMode = ref<'cards' | 'network'>('cards');

const searchQuery = ref('');
const filterRelation = ref('');
const filterGender = ref('');
const selectedChar = ref<string | null>(null);
const showDrawer = ref(false);
const showAddModal = ref(false);

// 关系网视图状态
const graphContainer = ref<HTMLElement | null>(null);
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });

// 从 useCharacters 获取人物库数据
const 人物库 = computed(() => characters.人物库);
const 人物总数 = computed(() => gameData.人物总数);
const 玩家姓名 = computed(() => gameData.个人档案.基本信息.姓名 || '我');

// 图形尺寸
const width = 800;
const height = 600;
const centerX = width / 2;
const centerY = height / 2;
const viewBox = `0 0 ${width} ${height}`;

// 关系网配置
const relationTypes = [
  { key: 'patron', label: '靠山', color: 'var(--color-rel-patron)' },
  { key: 'romance', label: '绯色', color: 'var(--color-rel-romance)' },
  { key: 'rival', label: '竞争', color: 'var(--color-rel-rival)' },
  { key: 'enemy', label: '宿敌', color: 'var(--color-rel-enemy)' },
  { key: 'family', label: '家属', color: 'var(--color-rel-family)' },
  { key: 'official', label: '官场', color: 'var(--color-rel-official)' },
];

// 筛选逻辑
const filteredCharacters = computed(() => {
  let entries = characters.人物列表;

  // 搜索过滤
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    entries = entries.filter(
      ([name, char]) =>
        name.toLowerCase().includes(q) ||
        (char.职务 as string).toLowerCase().includes(q) ||
        (char.单位 as string).toLowerCase().includes(q) ||
        char.角色标签?.some(tag => tag.toLowerCase().includes(q)),
    );
  }

  // 性别过滤
  if (filterGender.value) {
    entries = entries.filter(([, char]) => char.性别 === filterGender.value);
  }

  // 关系类型过滤
  if (filterRelation.value) {
    entries = entries.filter(([, char]) => {
      switch (filterRelation.value) {
        case '官场关系':
          return (
            char.官场关系 &&
            (char.官场关系.关系类型 !== '无' ||
              char.官场关系.立场倾向 !== '无' ||
              char.官场关系.威胁等级 !== '无' ||
              char.角色标签?.some(tag => ['直接上级', '一把手'].includes(tag)))
          );
        case '绯色关系':
          return (
            (char.绯色关系 && char.绯色关系.关系阶段 && char.绯色关系.关系阶段 !== '无') ||
            char.角色标签?.includes('绯色对象')
          );
        case '竞争关系':
          return (
            (char.竞争关系 && char.竞争关系.竞争目标 && char.竞争关系.竞争目标 !== '无') ||
            char.角色标签?.some(tag => ['竞争对手', '政治宿敌'].includes(tag))
          );
        case '靠山关系':
          return (
            (char.靠山关系 && char.靠山关系.紧密度 && char.靠山关系.紧密度 !== '无') ||
            char.角色标签?.includes('靠山')
          );
        case '家庭关系':
          return (
            (char.家庭关系 && char.家庭关系.关系 && char.家庭关系.关系 !== '无') ||
            char.角色标签?.includes('家属')
          );
        default:
          return true;
      }
    });
  }

  return entries;
});

// 获取人物的关系类型
function getCharRelationType(char: 人物): string {
  if (char.靠山关系 && char.靠山关系.紧密度 !== '无' || char.角色标签?.includes('靠山')) {
    return 'patron';
  } else if ((char.绯色关系 && char.绯色关系.关系阶段 !== '无') || char.角色标签?.includes('绯色对象')) {
    return 'romance';
  } else if (char.角色标签?.includes('政治宿敌')) {
    return 'enemy';
  } else if ((char.竞争关系 && char.竞争关系.竞争目标 !== '无') || char.角色标签?.includes('竞争对手')) {
    return 'rival';
  } else if ((char.家庭关系 && char.家庭关系.关系 !== '无') || char.角色标签?.includes('家属')) {
    return 'family';
  }
  return 'official';
}

// 计算关系网节点（基于筛选后的人物）
const networkNodes = computed(() => {
  const chars = filteredCharacters.value;
  const count = chars.length;
  if (count === 0) return [];

  const radius = Math.min(width, height) * 0.35;

  return chars.map(([name, char], i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // 确定节点类型和样式
    let nodeRadius = 20;
    let fill = 'var(--color-bg-elevated)';
    let stroke = 'var(--color-border)';
    const relationType = getCharRelationType(char);

    switch (relationType) {
      case 'patron':
        nodeRadius = 24;
        fill = 'rgba(216, 166, 87, 0.2)';
        stroke = 'var(--color-rel-patron)';
        break;
      case 'romance':
        fill = 'rgba(255, 77, 109, 0.2)';
        stroke = 'var(--color-rel-romance)';
        break;
      case 'enemy':
        nodeRadius = 24;
        fill = 'rgba(230, 57, 70, 0.2)';
        stroke = 'var(--color-rel-enemy)';
        break;
      case 'rival':
        fill = 'rgba(255, 136, 68, 0.2)';
        stroke = 'var(--color-rel-rival)';
        break;
      case 'family':
        fill = 'rgba(122, 162, 247, 0.2)';
        stroke = 'var(--color-rel-family)';
        break;
    }

    return {
      name,
      x,
      y,
      radius: nodeRadius,
      fill,
      stroke,
      relationType,
      char,
      dimmed: false,
    };
  });
});

// 关系颜色映射（使用实际颜色值而非 CSS 变量，确保 SVG 兼容性）
const relationColors: Record<string, string> = {
  patron: '#d8a657',   // 靠山-金色
  romance: '#ff4d6d',  // 绯色-粉红
  rival: '#ff8844',    // 竞争-橙红
  enemy: '#e63946',    // 宿敌-深红
  family: '#7aa2f7',   // 家属-柔蓝
  official: '#a0a5b8', // 官场-银灰
};

// 边样式辅助函数（直接在模板中使用，避免 computed 响应式问题）
function getEdgeColor(relationType: string): string {
  if (relationType === 'romance') return 'url(#grad-romance)';
  return relationColors[relationType] || relationColors.official;
}

function getEdgeWidth(relationType: string): number {
  return relationType === 'official' ? 1 : 2;
}

function getEdgeDash(relationType: string): string {
  if (relationType === 'enemy') return '4,2';
  if (relationType === 'rival') return '6,3';
  return '';
}

function selectChar(name: string) {
  selectedChar.value = name;
  showDrawer.value = true;
}

// 使用 useLocalCache 获取头像
function getAvatar(name: string) {
  return localCache.getAvatar(name);
}

function avatarStyle(name: string) {
  const url = getAvatar(name);
  return url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
}

function displayTags(char: 人物) {
  return char.角色标签?.slice(0, 3) || [];
}

function tagClass(tag: string) {
  if (['靠山', '一把手', '直接上级'].includes(tag)) return 'gold';
  if (['绯色对象'].includes(tag)) return 'romance';
  if (['竞争对手', '政治宿敌'].includes(tag)) return 'danger';
  if (['核心嫡系'].includes(tag)) return 'success';
  if (['家属'].includes(tag)) return 'info';
  return '';
}

function favorColor(val: number) {
  if (val >= 80) return 'high';
  if (val >= 50) return 'mid';
  return 'low';
}

function genderClass(gender: string | undefined) {
  if (gender === '男') return 'male';
  if (gender === '女') return 'female';
  return '';
}

function genderIcon(gender: string | undefined) {
  if (gender === '男') return 'fas fa-mars';
  if (gender === '女') return 'fas fa-venus';
  return 'fas fa-genderless';
}

function avatarIcon(gender: string | undefined) {
  if (gender === '男') return 'fas fa-user-tie';
  if (gender === '女') return 'fas fa-user';
  return 'fas fa-user';
}

function statusClass(status: string) {
  if (['在任', '活跃', '正常'].includes(status)) return 'active';
  if (['调离', '退休', '离职'].includes(status)) return 'inactive';
  if (['落马', '双规', '调查中'].includes(status)) return 'danger';
  return '';
}

function cardTypeClass(char: 人物) {
  if (char.角色标签?.includes('绯色对象') || (char.绯色关系?.关系阶段 && char.绯色关系.关系阶段 !== '无')) {
    return 'type-romance';
  }
  if (char.角色标签?.includes('靠山') || (char.靠山关系?.紧密度 && char.靠山关系.紧密度 !== '无')) {
    return 'type-backer';
  }
  if (char.角色标签?.some(t => ['竞争对手', '政治宿敌'].includes(t)) || (char.竞争关系?.竞争目标 && char.竞争关系.竞争目标 !== '无')) {
    return 'type-rival';
  }
  if (char.角色标签?.includes('家属') || (char.家庭关系?.关系 && char.家庭关系.关系 !== '无')) {
    return 'type-family';
  }
  return '';
}

// 关系网缩放控制
function handleZoom(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  zoom.value = Math.max(0.5, Math.min(2, zoom.value + delta));
}

function startPan(e: MouseEvent) {
  isPanning.value = true;
  panStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };

  const onMove = (me: MouseEvent) => {
    if (!isPanning.value) return;
    pan.value = { x: me.clientX - panStart.value.x, y: me.clientY - panStart.value.y };
  };

  const onUp = () => {
    isPanning.value = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function zoomIn() {
  zoom.value = Math.min(2, zoom.value + 0.2);
}

function zoomOut() {
  zoom.value = Math.max(0.5, zoom.value - 0.2);
}

function resetView() {
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
}

// 事件处理
function handleCreated(name: string) {
  selectedChar.value = name;
  showDrawer.value = true;
}

function handleDeleted(name: string) {
    selectedChar.value = null;
}

function handleUpdated(name: string) {
  // 更新成功，数据已自动刷新
}
</script>

<style lang="scss" scoped>
.characters-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

// ═══ 工具栏 ═══
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
}

.view-toggle {
  display: flex;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  button {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
    }

    &.active {
      background: var(--color-gold);
      color: var(--color-bg-dark);
    }

    &:first-child {
      border-right: 1px solid var(--color-border);
    }
  }
}

.search-box {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  i {
    color: var(--color-text-muted);
  }

  input {
    flex: 1;
    background: transparent;
    color: var(--color-text-primary);

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.filters {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 13px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  color: var(--color-bg-dark);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 13px;

  &:hover {
    filter: brightness(1.1);
  }
}

// ═══ 卡片视图 ═══
.cards-view {
  flex: 1;
  overflow-y: auto;
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-xs);
}

// ═══ 扑克牌样式卡片（精美版） ═══
.char-card.poker-style {
  width: 100%;
  aspect-ratio: 3/4;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm);
  background: linear-gradient(180deg, var(--color-bg-card) 0%, rgba(26, 29, 38, 0.95) 100%);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  position: relative;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    border-color: var(--color-gold);
  }

  &.selected {
    border-color: var(--color-gold);
    box-shadow: var(--shadow-glow-gold);
  }

  // 角色类型边框
  &.type-romance {
    border-color: rgba(255, 77, 109, 0.5);
    background: linear-gradient(180deg, rgba(255, 77, 109, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover, &.selected { border-color: var(--color-romance-light); }
  }
  &.type-backer {
    border-color: rgba(74, 193, 142, 0.5);
    background: linear-gradient(180deg, rgba(74, 193, 142, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover, &.selected { border-color: var(--color-success); }
  }
  &.type-rival {
    border-color: rgba(255, 107, 107, 0.5);
    background: linear-gradient(180deg, rgba(255, 107, 107, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover, &.selected { border-color: var(--color-danger); }
  }
  &.type-family {
    border-color: rgba(122, 162, 247, 0.5);
    background: linear-gradient(180deg, rgba(122, 162, 247, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover, &.selected { border-color: var(--color-info); }
  }
}

// 左上角状态角标
.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  z-index: 2;

  &.active {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }

  &.inactive {
    background: rgba(122, 162, 247, 0.2);
    color: var(--color-info);
  }

  &.danger {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
}

// 右上角标签区域
.card-tags-side {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
}

.tag-side {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;

  &.gold {
    background: rgba(216, 166, 87, 0.2);
    color: var(--color-gold);
  }
  &.romance {
    background: rgba(255, 77, 109, 0.2);
    color: var(--color-romance-light);
  }
  &.danger {
    background: rgba(255, 107, 107, 0.2);
    color: var(--color-danger);
  }
  &.success {
    background: rgba(74, 193, 142, 0.2);
    color: var(--color-success);
  }
  &.info {
    background: rgba(122, 162, 247, 0.2);
    color: var(--color-info);
  }
}

// 头像区域（用样式区分性别）
.card-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--spacing-md) auto var(--spacing-sm);
  flex-shrink: 0;
  border: 2px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  .default-avatar {
    font-size: 30px;
    color: var(--color-text-muted);
  }

  // 男性头像样式
  &.male {
    background: linear-gradient(135deg, rgba(74, 144, 217, 0.15) 0%, var(--color-bg-elevated) 100%);
    border-color: rgba(74, 144, 217, 0.4);

    .default-avatar {
      color: #4a90d9;
    }
  }

  // 女性头像样式
  &.female {
    background: linear-gradient(135deg, rgba(232, 67, 147, 0.15) 0%, var(--color-bg-elevated) 100%);
    border-color: rgba(232, 67, 147, 0.4);

    .default-avatar {
      color: #e84393;
    }
  }
}

// 信息区域
.card-info {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .card-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px;
    line-height: 1.2;

    &.male { color: #4a90d9; }
    &.female { color: #e84393; }
  }
}

// 卡牌详情（每行一个字段）
.card-details-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--spacing-xs);
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  color: var(--color-text-muted);

  i {
    font-size: 9px;
    color: var(--color-gold);
    width: 12px;
    text-align: center;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
  }

  &.rank {
    color: var(--color-gold);
    font-weight: 600;

    span {
      color: var(--color-gold);
    }
  }

  &.org {
    font-size: 9px;
    opacity: 0.85;

    i {
      color: var(--color-text-muted);
    }
  }
}

// 当前状态（底部，完整显示）
.card-status {
  margin-top: auto;
  padding: 6px var(--spacing-sm);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
  font-size: 10px;
  color: var(--color-text-secondary);
  text-align: center;
  font-style: italic;
  line-height: 1.4;
  word-break: break-word;
  // 不使用省略号，允许换行完整显示
}

// 好感度指示器
.favor-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-bg-elevated);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;

  .favor-bar {
    height: 100%;
    transition: width 0.3s ease;

    &.high { background: linear-gradient(90deg, #4ac18e, #2ecc71); }
    &.mid { background: linear-gradient(90deg, #e0c36c, #f1c40f); }
    &.low { background: linear-gradient(90deg, #ff6b6b, #e74c3c); }
  }
}

// ═══ 关系网视图 ═══
.network-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
}

// 图例
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
    color: var(--color-text-muted);
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
  }

// 图形容器
.graph-container {
    flex: 1;
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
    overflow: hidden;
  min-height: 300px;
  }

.relation-graph {
  width: 100%;
    height: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.node {
  cursor: pointer;
  transition: opacity var(--transition-fast);

  &.dimmed {
    opacity: 0.3;
  }

  &.selected circle {
    stroke-width: 3;
    filter: drop-shadow(0 0 8px currentColor);
  }

  &:hover:not(.player) circle {
    filter: brightness(1.2);
  }
}

// 缩放控制
.zoom-controls {
  position: absolute;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  overflow: hidden;

  button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--color-bg-card);
      color: var(--color-text-primary);
    }
  }
}

// 统计信息
.stats-overlay {
  position: absolute;
  top: var(--spacing-md);
  left: var(--spacing-md);

  .node-count {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color: var(--color-text-secondary);

    i {
      color: var(--color-gold);
  }
}
}

// ═══ 空状态 ═══
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);

  i {
    font-size: 48px;
  }
}
</style>
