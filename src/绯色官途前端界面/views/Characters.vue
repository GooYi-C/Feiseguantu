<template>
  <div class="characters-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
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

    <!-- 人物列表 -->
    <div class="char-list">
      <div
        v-for="[name, char] in filteredCharacters"
        :key="name"
        class="char-card"
        :class="[
          { selected: selectedChar === name },
          genderClass(char.性别),
          cardTypeClass(char),
        ]"
        @click="selectChar(name)"
      >
        <!-- 性别角标 -->
        <div class="gender-badge" :class="genderClass(char.性别)">
          <i :class="genderIcon(char.性别)"></i>
        </div>

        <div class="char-avatar" :style="avatarStyle(name)">
          <i v-if="!getAvatar(name)" class="fas fa-user"></i>
        </div>
        <div class="char-info">
          <div class="char-name" :class="genderClass(char.性别)">{{ name }}</div>
          <div class="char-meta">
            <span v-if="char.职务 !== '无'" class="position">{{ char.职务 }}</span>
            <span v-else-if="char.级别 !== '无'" class="level">{{ char.级别 }}</span>
          </div>
          <div class="char-tags">
            <span v-for="tag in char.角色标签?.slice(0, 3)" :key="tag" class="tag" :class="tagClass(tag)">
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="char-stats">
          <div class="stat-bar" title="好感度">
            <i class="fas fa-heart"></i>
            <div class="bar">
              <div class="fill" :style="{ width: char.好感度 + '%' }" :class="statColor(char.好感度)"></div>
            </div>
            <span>{{ char.好感度 }}</span>
          </div>
          <div class="stat-bar" title="信任度">
            <i class="fas fa-handshake"></i>
            <div class="bar">
              <div class="fill" :style="{ width: char.信任度 + '%' }" :class="statColor(char.信任度)"></div>
            </div>
            <span>{{ char.信任度 }}</span>
          </div>
        </div>
      </div>
      <div v-if="filteredCharacters.length === 0" class="empty-state">
        <i class="fas fa-users-slash"></i>
        <p>暂无符合条件的人物</p>
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

const searchQuery = ref('');
const filterRelation = ref('');
const filterGender = ref('');
const selectedChar = ref<string | null>(null);
const showDrawer = ref(false);
const showAddModal = ref(false);

// 从 useCharacters 获取人物库数据
const 人物库 = computed(() => characters.人物库);

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

  // 关系类型过滤 - 检查关系对象中的关键字段是否有实际值
  if (filterRelation.value) {
    entries = entries.filter(([, char]) => {
      switch (filterRelation.value) {
        case '官场关系':
          // 检查官场关系的关键字段
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

function tagClass(tag: string) {
  if (['靠山', '一把手', '直接上级'].includes(tag)) return 'gold';
  if (['绯色对象'].includes(tag)) return 'romance';
  if (['竞争对手', '政治宿敌'].includes(tag)) return 'danger';
  if (['核心嫡系'].includes(tag)) return 'success';
  if (['家属'].includes(tag)) return 'info';
  return '';
}

function statColor(val: number) {
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

// 事件处理
function handleCreated(name: string) {
  // 创建成功后选中新人物
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
}

// ═══ 工具栏 ═══
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
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

// ═══ 人物列表 ═══
.char-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.char-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-light);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.selected {
    border-color: var(--color-gold);
    box-shadow: var(--shadow-glow-gold);
  }

  // 角色类型边框颜色
  &.type-romance {
    border-color: rgba(255, 77, 109, 0.3);
    &:hover, &.selected {
      border-color: var(--color-romance-light);
    }
  }

  &.type-backer {
    border-color: rgba(74, 193, 142, 0.3);
    &:hover, &.selected {
      border-color: var(--color-success);
    }
  }

  &.type-rival {
    border-color: rgba(255, 107, 107, 0.3);
    &:hover, &.selected {
      border-color: var(--color-danger);
    }
  }

  &.type-family {
    border-color: rgba(122, 162, 247, 0.3);
    &:hover, &.selected {
      border-color: var(--color-info);
    }
  }
}

// 性别角标
.gender-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;

  &.male {
    background: rgba(74, 144, 217, 0.2);
    color: #4a90d9;
  }

  &.female {
    background: rgba(232, 67, 147, 0.2);
    color: #e84393;
  }
}

.char-avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 22px;
}

.char-info {
  flex: 1;
  min-width: 0;
}

.char-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;

  &.male {
    color: #4a90d9;
  }

  &.female {
    color: #e84393;
  }
}

.char-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.char-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 6px;
  font-size: 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);

  &.gold {
    background: rgba(216, 166, 87, 0.15);
    color: var(--color-gold);
  }
  &.romance {
    background: rgba(255, 77, 109, 0.15);
    color: var(--color-romance-light);
  }
  &.danger {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }
  &.success {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }
  &.info {
    background: rgba(122, 162, 247, 0.15);
    color: var(--color-info);
  }
}

.char-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 80px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;

  i {
    color: var(--color-text-muted);
    width: 12px;
  }

  .bar {
    flex: 1;
    height: 4px;
    background: var(--color-bg-elevated);
    border-radius: 2px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;

    &.high {
      background: var(--color-success);
    }
    &.mid {
      background: var(--color-warning);
    }
    &.low {
      background: var(--color-danger);
    }
  }

  span {
    width: 20px;
    text-align: right;
    color: var(--color-text-muted);
  }
}

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
