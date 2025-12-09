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
        :class="{ selected: selectedChar === name }"
        @click="selectChar(name)"
      >
        <div class="char-avatar" :style="avatarStyle(name)">
          <i v-if="!getAvatar(name)" class="fas fa-user"></i>
        </div>
        <div class="char-info">
          <div class="char-name">{{ name }}</div>
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

    <!-- 人物详情抽屉 -->
    <Teleport to="body">
      <div class="drawer-overlay" :class="{ open: !!selectedChar }" @click="selectedChar = null"></div>
      <aside class="drawer" :class="{ open: !!selectedChar }">
        <template v-if="selectedChar && currentCharacter">
          <div class="drawer-header">
            <div class="drawer-avatar" :style="avatarStyle(selectedChar)">
              <i v-if="!getAvatar(selectedChar)" class="fas fa-user-tie"></i>
              <label class="upload-btn" title="上传头像">
                <i class="fas fa-camera"></i>
                <input type="file" accept="image/*" hidden @change="handleAvatarUpload" />
              </label>
            </div>
            <div class="drawer-title">
              <h3>{{ selectedChar }}</h3>
              <span v-if="currentCharacter.职务 !== '无'" class="subtitle">{{ currentCharacter.职务 }}</span>
            </div>
            <button class="drawer-close" @click="selectedChar = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 基础信息 -->
            <section class="detail-section">
              <h4><i class="fas fa-id-card"></i> 基础信息</h4>
              <div class="info-grid">
                <div class="info-row">
                  <span class="label">性别</span>
                  <span class="value">{{ currentCharacter.性别 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">年龄</span>
                  <span class="value">{{ currentCharacter.年龄 }}岁</span>
                </div>
                <div class="info-row">
                  <span class="label">体系</span>
                  <span class="value">{{ currentCharacter.体系 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">级别</span>
                  <span class="value">{{ currentCharacter.级别 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">单位</span>
                  <span class="value">{{ currentCharacter.单位 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">派系</span>
                  <span class="value">{{ currentCharacter.派系 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">婚姻</span>
                  <span class="value">{{ currentCharacter.婚姻状态 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">状态</span>
                  <span class="value">{{ currentCharacter.状态 }}</span>
                </div>
              </div>
            </section>

            <!-- 数值面板 -->
            <section class="detail-section">
              <h4><i class="fas fa-chart-bar"></i> 数值面板</h4>
              <div class="stats-panel">
                <div class="stat-item">
                  <span class="stat-label">好感度</span>
                  <div class="stat-bar-lg">
                    <div class="fill" :style="{ width: currentCharacter.好感度 + '%' }" :class="statColor(currentCharacter.好感度)"></div>
                  </div>
                  <span class="stat-num">{{ currentCharacter.好感度 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">信任度</span>
                  <div class="stat-bar-lg">
                    <div class="fill" :style="{ width: currentCharacter.信任度 + '%' }" :class="statColor(currentCharacter.信任度)"></div>
                  </div>
                  <span class="stat-num">{{ currentCharacter.信任度 }}</span>
                </div>
                <div v-if="currentCharacter.忠诚度 > 0" class="stat-item">
                  <span class="stat-label">忠诚度</span>
                  <div class="stat-bar-lg">
                    <div class="fill" :style="{ width: currentCharacter.忠诚度 + '%' }" :class="statColor(currentCharacter.忠诚度)"></div>
                  </div>
                  <span class="stat-num">{{ currentCharacter.忠诚度 }}</span>
                </div>
              </div>
            </section>

            <!-- 当前状态 -->
            <section v-if="currentCharacter.当前状态 !== '无'" class="detail-section">
              <h4><i class="fas fa-info-circle"></i> 当前状态</h4>
              <p class="status-text">{{ currentCharacter.当前状态 }}</p>
            </section>

            <!-- 官场关系 -->
            <section v-if="currentCharacter.官场关系" class="detail-section">
              <h4><i class="fas fa-landmark"></i> 官场关系</h4>
              <div class="relation-detail">
                <div v-if="currentCharacter.官场关系.关系类型 !== '无'" class="info-row">
                  <span class="label">关系类型</span>
                  <span class="value">{{ currentCharacter.官场关系.关系类型 }}</span>
                </div>
                <div v-if="currentCharacter.官场关系.立场倾向 !== '无'" class="info-row">
                  <span class="label">立场倾向</span>
                  <span class="value">{{ currentCharacter.官场关系.立场倾向 }}</span>
                </div>
                <div v-if="currentCharacter.官场关系.威胁等级 !== '无'" class="info-row">
                  <span class="label">威胁等级</span>
                  <span class="value" :class="threatClass(currentCharacter.官场关系.威胁等级)">
                    {{ currentCharacter.官场关系.威胁等级 }}
                  </span>
                </div>
                <div v-if="currentCharacter.官场关系.近期动向 !== '无'" class="info-row full">
                  <span class="label">近期动向</span>
                  <span class="value">{{ currentCharacter.官场关系.近期动向 }}</span>
                </div>
              </div>
            </section>

            <!-- 绯色关系 -->
            <section v-if="currentCharacter.绯色关系" class="detail-section romance">
              <h4><i class="fas fa-heart"></i> 绯色关系</h4>
              <div class="romance-detail">
                <div v-if="currentCharacter.绯色关系.关系阶段 !== '无'" class="info-row">
                  <span class="label">关系阶段</span>
                  <span class="value romance">{{ currentCharacter.绯色关系.关系阶段 }}</span>
                </div>
                <div v-if="currentCharacter.绯色关系.关系性质 !== '无'" class="info-row">
                  <span class="label">关系性质</span>
                  <span class="value">{{ currentCharacter.绯色关系.关系性质 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">危险度</span>
                  <div class="danger-bar">
                    <div class="fill" :style="{ width: currentCharacter.绯色关系.危险度 + '%' }"></div>
                  </div>
                  <span class="danger-num">{{ currentCharacter.绯色关系.危险度 }}%</span>
                </div>
                <div v-if="currentCharacter.绯色关系.外貌 !== '无'" class="info-row full">
                  <span class="label">外貌</span>
                  <span class="value">{{ currentCharacter.绯色关系.外貌 }}</span>
                </div>
              </div>
            </section>

            <!-- 操作按钮 -->
            <div class="drawer-actions">
              <button class="action-btn edit" @click="editCharacter">
                <i class="fas fa-edit"></i> 编辑
              </button>
              <button class="action-btn delete" @click="confirmDelete">
                <i class="fas fa-trash"></i> 删除
              </button>
            </div>
          </div>
        </template>
      </aside>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameData } from '../stores/useGameData';

const gameData = useGameData();
const searchQuery = ref('');
const filterRelation = ref('');
const selectedChar = ref<string | null>(null);
const showAddModal = ref(false);

const 人物库 = computed(() => gameData.人物库);

const filteredCharacters = computed(() => {
  let entries = Object.entries(人物库.value);

  // 搜索过滤
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    entries = entries.filter(
      ([name, char]) =>
        name.toLowerCase().includes(q) ||
        (char.职务 as string).toLowerCase().includes(q) ||
        (char.单位 as string).toLowerCase().includes(q),
    );
  }

  // 关系类型过滤
  if (filterRelation.value) {
    entries = entries.filter(([, char]) => {
      switch (filterRelation.value) {
        case '官场关系':
          return !!char.官场关系;
        case '绯色关系':
          return !!char.绯色关系;
        case '竞争关系':
          return !!char.竞争关系;
        case '靠山关系':
          return !!char.靠山关系;
        case '家庭关系':
          return !!char.家庭关系;
        default:
          return true;
      }
    });
  }

  return entries;
});

const currentCharacter = computed(() => (selectedChar.value ? 人物库.value[selectedChar.value] : null));

function selectChar(name: string) {
  selectedChar.value = name;
}

function getAvatar(name: string) {
  return gameData.getAvatar(name);
}

function avatarStyle(name: string) {
  const url = getAvatar(name);
  return url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
}

function handleAvatarUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !selectedChar.value) return;

  if (file.size > 4 * 1024 * 1024) {
    toastr.warning('图片大小不能超过 4MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    gameData.setAvatar(selectedChar.value!, reader.result as string);
    toastr.success('头像已更新');
  };
  reader.readAsDataURL(file);
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

function threatClass(level: string) {
  if (['极高', '致命'].includes(level)) return 'danger';
  if (['偏高', '中等'].includes(level)) return 'warning';
  return '';
}

function editCharacter() {
  toastr.info('编辑功能开发中');
}

function confirmDelete() {
  if (!selectedChar.value) return;
  if (confirm(`确定要删除人物「${selectedChar.value}」吗？此操作不可撤销。`)) {
    gameData.deleteCharacter(selectedChar.value);
    selectedChar.value = null;
    toastr.success('人物已删除');
  }
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

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
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
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-light);
  }

  &.selected {
    border-color: var(--color-gold);
    box-shadow: var(--shadow-glow-gold);
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

// ═══ 抽屉 ═══
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-slow);
  z-index: var(--z-drawer);

  &.open {
    opacity: 1;
    visibility: visible;
  }
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  transform: translateX(100%);
  transition: transform var(--transition-slow);
  z-index: calc(var(--z-drawer) + 1);
  display: flex;
  flex-direction: column;

  &.open {
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(216, 166, 87, 0.1) 0%, transparent 100%);
}

.drawer-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: 28px;

  .upload-btn {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-gold);
    border-radius: 50%;
    color: var(--color-bg-dark);
    font-size: 10px;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &:hover .upload-btn {
    opacity: 1;
  }
}

.drawer-title {
  flex: 1;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .subtitle {
    font-size: 13px;
    color: var(--color-gold);
  }
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-text-primary);
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.detail-section {
  margin-bottom: var(--spacing-xl);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);

    i {
      color: var(--color-gold);
    }
  }

  &.romance h4 i {
    color: var(--color-romance-light);
  }
}

.info-grid,
.relation-detail,
.romance-detail {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm) var(--spacing-md);
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.full {
    grid-column: 1 / -1;
  }

  .label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 13px;
    color: var(--color-text-secondary);

    &.romance {
      color: var(--color-romance-light);
    }
    &.danger {
      color: var(--color-danger);
    }
    &.warning {
      color: var(--color-warning);
    }
  }
}

.stats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .stat-label {
    width: 60px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .stat-bar-lg {
    flex: 1;
    height: 8px;
    background: var(--color-bg-elevated);
    border-radius: 4px;
    overflow: hidden;

    .fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s;

      &.high {
        background: linear-gradient(90deg, var(--color-success), #6dd5a0);
      }
      &.mid {
        background: linear-gradient(90deg, var(--color-warning), #f0d78c);
      }
      &.low {
        background: linear-gradient(90deg, var(--color-danger), #ff9999);
      }
    }
  }

  .stat-num {
    width: 30px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
}

.danger-bar {
  flex: 1;
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: 3px;
  overflow: hidden;

  .fill {
    height: 100%;
    background: var(--color-romance-gradient);
    border-radius: 3px;
  }
}

.danger-num {
  font-size: 12px;
  color: var(--color-romance-light);
  font-weight: 600;
}

.status-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.drawer-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;

  &.edit {
    background: var(--color-gold);
    color: var(--color-bg-dark);
  }

  &.delete {
    background: transparent;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);

    &:hover {
      background: rgba(255, 107, 107, 0.1);
    }
  }
}
</style>

