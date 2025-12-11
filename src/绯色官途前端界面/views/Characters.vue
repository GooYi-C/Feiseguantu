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
      <button class="add-btn" @click="showAddModal = true"><i class="fas fa-plus"></i> 新增人物</button>
    </div>

    <!-- 卡片视图 -->
    <div class="cards-view">
      <div class="char-grid">
        <div
          v-for="[name, char] in filteredCharacters"
          :key="name"
          class="char-card poker-style"
          :class="[{ selected: selectedChar === name }, genderClass(char.性别), cardTypeClass(char)]"
          @click="selectChar(name)"
        >
          <!-- 左上角状态角标（显示人物状态字段） -->
          <div v-if="char.状态 && char.状态 !== '无'" class="status-badge" :class="statusClass(char.状态)">
            {{ char.状态 }}
          </div>

          <!-- 右上角标签区域 -->
          <div class="card-tags-side">
            <span v-for="tag in displayTags(char)" :key="tag" class="tag-side" :class="tagClass(tag)">
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
          <div v-if="char.当前状态 && char.当前状态 !== '无'" class="card-status">「{{ char.当前状态 }}」</div>

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

    <!-- 使用新的 CharacterDrawer 组件 -->
    <CharacterDrawer
      v-model="showDrawer"
      :character-name="selectedChar || ''"
      @deleted="handleDeleted"
      @updated="handleUpdated"
    />

    <!-- 使用新的 AddCharacterModal 组件 -->
    <AddCharacterModal v-model="showAddModal" @created="handleCreated" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { AddCharacterModal, CharacterDrawer } from '../components/character';
import { useCharacters, useLocalCache } from '../stores';
import type { 人物 } from '../stores/schema';

// 使用拆分后的 Store
const characters = useCharacters();
const localCache = useLocalCache();

const searchQuery = ref('');
const filterRelation = ref('');
const filterGender = ref('');
const selectedChar = ref<string | null>(null);
const showDrawer = ref(false);
const showAddModal = ref(false);

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
            (char.靠山关系 && char.靠山关系.紧密度 && char.靠山关系.紧密度 !== '无') || char.角色标签?.includes('靠山')
          );
        case '家庭关系':
          return (
            (char.家庭关系 && char.家庭关系.关系 && char.家庭关系.关系 !== '无') || char.角色标签?.includes('家属')
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
  if (
    char.角色标签?.some(t => ['竞争对手', '政治宿敌'].includes(t)) ||
    (char.竞争关系?.竞争目标 && char.竞争关系.竞争目标 !== '无')
  ) {
    return 'type-rival';
  }
  if (char.角色标签?.includes('家属') || (char.家庭关系?.关系 && char.家庭关系.关系 !== '无')) {
    return 'type-family';
  }
  return '';
}

// 事件处理
function handleCreated(name: string) {
  selectedChar.value = name;
  showDrawer.value = true;
}

function handleDeleted(_name: string) {
  selectedChar.value = null;
}

function handleUpdated(_name: string) {
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
    &:hover,
    &.selected {
      border-color: var(--color-romance-light);
    }
  }
  &.type-backer {
    border-color: rgba(74, 193, 142, 0.5);
    background: linear-gradient(180deg, rgba(74, 193, 142, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover,
    &.selected {
      border-color: var(--color-success);
    }
  }
  &.type-rival {
    border-color: rgba(255, 107, 107, 0.5);
    background: linear-gradient(180deg, rgba(255, 107, 107, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover,
    &.selected {
      border-color: var(--color-danger);
    }
  }
  &.type-family {
    border-color: rgba(122, 162, 247, 0.5);
    background: linear-gradient(180deg, rgba(122, 162, 247, 0.05) 0%, var(--color-bg-card) 30%);
    &:hover,
    &.selected {
      border-color: var(--color-info);
    }
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

    &.male {
      color: #4a90d9;
    }
    &.female {
      color: #e84393;
    }
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

    &.high {
      background: linear-gradient(90deg, #4ac18e, #2ecc71);
    }
    &.mid {
      background: linear-gradient(90deg, #e0c36c, #f1c40f);
    }
    &.low {
      background: linear-gradient(90deg, #ff6b6b, #e74c3c);
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
