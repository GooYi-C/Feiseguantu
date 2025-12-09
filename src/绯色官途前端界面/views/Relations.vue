<template>
  <div class="relations-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="filter-group">
        <label class="filter-check" v-for="filter in relationFilters" :key="filter.key">
          <input type="checkbox" v-model="activeFilters" :value="filter.key" />
          <span class="check-label" :style="{ '--filter-color': filter.color }">{{ filter.label }}</span>
        </label>
      </div>
      <div class="stats-info">
        <span class="node-count">
          <i class="fas fa-users"></i>
          {{ filteredNodes.length }} / {{ 人物总数 }} 人物
        </span>
      </div>
    </div>

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
          <!-- 连接线 -->
          <g class="edges">
            <line
              v-for="edge in edges"
              :key="edge.id"
              :x1="edge.source.x"
              :y1="edge.source.y"
              :x2="edge.target.x"
              :y2="edge.target.y"
              :stroke="edge.color"
              :stroke-width="edge.width"
              :stroke-dasharray="edge.dash"
              :opacity="edge.opacity"
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
              v-for="node in filteredNodes"
              :key="node.name"
              class="node"
              :class="{ selected: selectedNode === node.name, dimmed: node.dimmed }"
              :transform="`translate(${node.x}, ${node.y})`"
              @click="selectNode(node.name)"
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
    </div>

    <!-- 人物详情侧栏 -->
    <aside class="side-panel" :class="{ open: !!selectedNode }">
      <template v-if="selectedNode && selectedCharacter">
        <div class="panel-header">
          <h3><CharacterName :name="selectedNode" :clickable="false" /></h3>
          <button class="close-btn" @click="selectedNode = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="panel-body">
          <div class="char-meta">
            <span v-if="selectedCharacter.职务 !== '无'">{{ selectedCharacter.职务 }}</span>
            <span v-if="selectedCharacter.级别 !== '无'">{{ selectedCharacter.级别 }}</span>
          </div>
          <div class="char-tags">
            <span v-for="tag in selectedCharacter.角色标签" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="stat-bars">
            <div class="stat-row">
              <span>好感度</span>
              <div class="bar"><div class="fill" :style="{ width: selectedCharacter.好感度 + '%' }"></div></div>
              <span>{{ selectedCharacter.好感度 }}</span>
            </div>
            <div class="stat-row">
              <span>信任度</span>
              <div class="bar"><div class="fill" :style="{ width: selectedCharacter.信任度 + '%' }"></div></div>
              <span>{{ selectedCharacter.信任度 }}</span>
            </div>
          </div>
          <div class="panel-actions">
            <button class="action-link" @click="openCharacterDrawer">
              <i class="fas fa-id-card"></i> 查看详情
            </button>
            <router-link
              v-if="selectedCharacter.绯色关系"
              :to="{ path: '/romance', query: { char: selectedNode } }"
              class="action-link romance"
            >
              <i class="fas fa-heart"></i> 绯色关系
            </router-link>
          </div>
        </div>
      </template>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameData, useCharacterDrawer } from '../stores';
import { CharacterName } from '../components/common';

const gameData = useGameData();
const characterDrawer = useCharacterDrawer();
const graphContainer = ref<HTMLElement | null>(null);

// 视图状态
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const panStart = ref({ x: 0, y: 0 });
const selectedNode = ref<string | null>(null);

// 过滤器
const activeFilters = ref<string[]>([]);

const relationFilters = [
  { key: '官场关系', label: '官场', color: 'var(--color-rel-official)' },
  { key: '绯色关系', label: '绯色', color: 'var(--color-rel-romance)' },
  { key: '竞争关系', label: '竞争', color: 'var(--color-rel-rival)' },
  { key: '靠山关系', label: '靠山', color: 'var(--color-rel-patron)' },
  { key: '家庭关系', label: '家属', color: 'var(--color-rel-family)' },
];

const relationTypes = [
  { key: 'patron', label: '靠山', color: 'var(--color-rel-patron)' },
  { key: 'romance', label: '绯色', color: 'var(--color-rel-romance)' },
  { key: 'rival', label: '竞争', color: 'var(--color-rel-rival)' },
  { key: 'enemy', label: '宿敌', color: 'var(--color-rel-enemy)' },
  { key: 'family', label: '家属', color: 'var(--color-rel-family)' },
  { key: 'official', label: '官场', color: 'var(--color-rel-official)' },
];

const 人物库 = computed(() => gameData.人物库);
const 人物总数 = computed(() => gameData.人物总数);
const 玩家姓名 = computed(() => gameData.个人档案.基本信息.姓名 || '我');

// 图形尺寸
const width = 800;
const height = 600;
const centerX = width / 2;
const centerY = height / 2;
const viewBox = `0 0 ${width} ${height}`;

// 计算节点位置（环形布局）
const nodes = computed(() => {
  const chars = Object.entries(人物库.value);
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
    let relationType = 'official';

    if (char.靠山关系 || char.角色标签?.includes('靠山')) {
      nodeRadius = 24;
      fill = 'rgba(216, 166, 87, 0.2)';
      stroke = 'var(--color-rel-patron)';
      relationType = 'patron';
    } else if (char.绯色关系 || char.角色标签?.includes('绯色对象')) {
      fill = 'rgba(255, 77, 109, 0.2)';
      stroke = 'var(--color-rel-romance)';
      relationType = 'romance';
    } else if (char.角色标签?.includes('政治宿敌')) {
      nodeRadius = 24;
      fill = 'rgba(230, 57, 70, 0.2)';
      stroke = 'var(--color-rel-enemy)';
      relationType = 'enemy';
    } else if (char.竞争关系 || char.角色标签?.includes('竞争对手')) {
      fill = 'rgba(255, 136, 68, 0.2)';
      stroke = 'var(--color-rel-rival)';
      relationType = 'rival';
    } else if (char.家庭关系 || char.角色标签?.includes('家属')) {
      fill = 'rgba(122, 162, 247, 0.2)';
      stroke = 'var(--color-rel-family)';
      relationType = 'family';
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

// 过滤后的节点
const filteredNodes = computed(() => {
  if (activeFilters.value.length === 0) return nodes.value;

  return nodes.value.map(node => {
    const hasRelation = activeFilters.value.some(filter => {
      switch (filter) {
        case '官场关系':
          return !!node.char.官场关系;
        case '绯色关系':
          return !!node.char.绯色关系;
        case '竞争关系':
          return !!node.char.竞争关系;
        case '靠山关系':
          return !!node.char.靠山关系;
        case '家庭关系':
          return !!node.char.家庭关系;
        default:
          return false;
      }
    });
    return { ...node, dimmed: !hasRelation };
  });
});

// 计算边
const edges = computed(() => {
  return filteredNodes.value.map(node => {
    let color = 'var(--color-rel-official)';
    let width = 1;
    let dash = '';

    switch (node.relationType) {
      case 'patron':
        color = 'var(--color-rel-patron)';
        width = 2;
        break;
      case 'romance':
        color = 'url(#grad-romance)';
        width = 2;
        break;
      case 'enemy':
        color = 'var(--color-rel-enemy)';
        width = 2;
        dash = '4,2';
        break;
      case 'rival':
        color = 'var(--color-rel-rival)';
        dash = '6,3';
        break;
      case 'family':
        color = 'var(--color-rel-family)';
        break;
    }

    return {
      id: node.name,
      source: { x: centerX, y: centerY },
      target: { x: node.x, y: node.y },
      color,
      width,
      dash,
      opacity: node.dimmed ? 0.2 : 0.6,
    };
  });
});

const selectedCharacter = computed(() => (selectedNode.value ? 人物库.value[selectedNode.value] : null));

function selectNode(name: string) {
  selectedNode.value = selectedNode.value === name ? null : name;
}

function openCharacterDrawer() {
  if (selectedNode.value) {
    characterDrawer.open(selectedNode.value);
  }
}

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
</script>

<style lang="scss" scoped>
.relations-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-md);
}

// ═══ 工具栏 ═══
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.filter-check {
  display: flex;
  align-items: center;
  cursor: pointer;

  input {
    display: none;
  }

  .check-label {
    padding: 4px 12px;
    font-size: 12px;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }

  input:checked + .check-label {
    background: var(--filter-color);
    border-color: var(--filter-color);
    color: white;
  }
}

.stats-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.node-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);

  i {
    color: var(--color-gold);
  }
}

// ═══ 图例 ═══
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

// ═══ 图形容器 ═══
.graph-container {
  flex: 1;
  position: relative;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
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

// ═══ 缩放控制 ═══
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

// ═══ 侧边面板 ═══
.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  transform: translateX(100%);
  transition: transform var(--transition-slow);

  &.open {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);

  &:hover {
    color: var(--color-text-primary);
  }
}

.panel-body {
  padding: var(--spacing-md);
}

.char-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.char-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-md);
}

.tag {
  padding: 2px 8px;
  font-size: 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-muted);

  .bar {
    flex: 1;
    height: 6px;
    background: var(--color-bg-elevated);
    border-radius: 3px;
    overflow: hidden;

    .fill {
      height: 100%;
      background: var(--color-gold);
      border-radius: 3px;
    }
  }
}

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-border);
    color: var(--color-text-primary);
  }

  &.romance {
    background: rgba(255, 77, 109, 0.1);
    color: var(--color-romance-light);

    &:hover {
      background: rgba(255, 77, 109, 0.2);
    }
  }
}
</style>

