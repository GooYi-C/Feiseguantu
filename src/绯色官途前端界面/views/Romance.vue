<template>
  <div class="romance-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" type="text" placeholder="搜索绯色对象..." />
      </div>
      <div class="stats">
        <span class="count"><i class="fas fa-heart"></i> {{ 绯色对象列表.length }} 位绯色对象</span>
      </div>
    </div>

    <!-- 绯色对象卡片网格 -->
    <div class="romance-grid">
      <div
        v-for="char in filteredRomanceList"
        :key="char.name"
        class="romance-card"
        :class="{ selected: selectedChar === char.name }"
        @click="selectChar(char.name)"
      >
        <!-- 头像/封面 -->
        <div class="card-cover" :style="coverStyle(char.name)">
          <div class="cover-overlay"></div>
          <label class="upload-cover" title="上传封面">
            <i class="fas fa-image"></i>
            <input type="file" accept="image/*" @change="e => handleCoverUpload(e, char.name)" hidden />
          </label>
          <div class="danger-indicator" :class="dangerLevel(char.绯色关系?.危险度 || 0)">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ char.绯色关系?.危险度 || 0 }}%</span>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <h3 class="char-name">{{ char.name }}</h3>
          <div class="char-position" v-if="char.职务 !== '无'">{{ char.职务 }}</div>

          <!-- 关系阶段进度 -->
          <div class="stage-progress" v-if="char.绯色关系">
            <span class="stage-label">{{ char.绯色关系.关系阶段 }}</span>
            <div class="stage-bar">
              <div class="stage-fill" :style="{ width: stageProgress(char.绯色关系.关系阶段) + '%' }"></div>
            </div>
          </div>

          <!-- 情绪状态 -->
          <div class="emotion-tag" v-if="char.绯色关系?.情绪状态 !== '无'" :class="emotionClass(char.绯色关系?.情绪状态)">
            <i class="fas fa-face-smile-beam"></i>
            {{ char.绯色关系?.情绪状态 }}
          </div>

          <!-- 身份标签 -->
          <div class="identity-tags" v-if="char.绯色关系?.身份标签?.length">
            <span v-for="tag in char.绯色关系.身份标签.slice(0, 3)" :key="tag" class="id-tag">{{ tag }}</span>
          </div>

          <!-- 近期事件 -->
          <div class="recent-event" v-if="char.绯色关系?.近期事件 !== '无'">
            <i class="fas fa-clock-rotate-left"></i>
            <span>{{ truncate(char.绯色关系.近期事件, 40) }}</span>
          </div>
        </div>
      </div>

      <div v-if="filteredRomanceList.length === 0" class="empty-state">
        <i class="fas fa-heart-crack"></i>
        <p>暂无绯色对象</p>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <Teleport to="body">
      <div class="drawer-overlay" :class="{ open: !!selectedChar }" @click="selectedChar = null"></div>
      <aside class="drawer romance-drawer" :class="{ open: !!selectedChar }">
        <template v-if="selectedChar && selectedCharacter">
          <div class="drawer-header">
            <div class="drawer-cover" :style="coverStyle(selectedChar)">
              <div class="cover-gradient"></div>
            </div>
            <div class="drawer-title-area">
              <h3>{{ selectedChar }}</h3>
              <span class="subtitle" v-if="selectedCharacter.职务 !== '无'">{{ selectedCharacter.职务 }}</span>
            </div>
            <button class="drawer-close" @click="selectedChar = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 关系状态卡 -->
            <section class="status-card">
              <div class="status-row">
                <span class="status-label">关系阶段</span>
                <span class="status-value highlight">{{ selectedCharacter.绯色关系?.关系阶段 }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">关系性质</span>
                <span class="status-value">{{ selectedCharacter.绯色关系?.关系性质 }}</span>
              </div>
              <div class="status-row">
                <span class="status-label">情绪状态</span>
                <span class="status-value" :class="emotionClass(selectedCharacter.绯色关系?.情绪状态)">
                  {{ selectedCharacter.绯色关系?.情绪状态 }}
                </span>
              </div>
              <div class="danger-meter">
                <span class="danger-label">危险度</span>
                <div class="danger-bar">
                  <div class="danger-fill" :style="{ width: (selectedCharacter.绯色关系?.危险度 || 0) + '%' }"></div>
                </div>
                <span class="danger-value">{{ selectedCharacter.绯色关系?.危险度 || 0 }}%</span>
              </div>
            </section>

            <!-- 外貌描述 -->
            <section class="detail-section" v-if="selectedCharacter.绯色关系?.外貌 !== '无'">
              <h4><i class="fas fa-eye"></i> 外貌</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.外貌 }}</p>
            </section>

            <!-- 性格 -->
            <section class="detail-section" v-if="selectedCharacter.绯色关系?.性格 !== '无'">
              <h4><i class="fas fa-masks-theater"></i> 性格</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.性格 }}</p>
            </section>

            <!-- 把柄信息 -->
            <section class="detail-section sensitive" v-if="selectedCharacter.绯色关系?.把柄">
              <h4><i class="fas fa-file-contract"></i> 把柄</h4>
              <div class="grip-info" :class="{ masked: !showSensitive }">
                <div class="grip-row" v-if="selectedCharacter.绯色关系?.把柄.我方掌握 !== '无'">
                  <span class="grip-label">我方掌握</span>
                  <span class="grip-value">{{ selectedCharacter.绯色关系?.把柄.我方掌握 }}</span>
                </div>
                <div class="grip-row" v-if="selectedCharacter.绯色关系?.把柄.对方掌握 !== '无'">
                  <span class="grip-label">对方掌握</span>
                  <span class="grip-value danger">{{ selectedCharacter.绯色关系?.把柄.对方掌握 }}</span>
                </div>
              </div>
              <button class="unmask-btn" @click="showSensitive = !showSensitive">
                <i :class="showSensitive ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                {{ showSensitive ? '隐藏' : '查看' }}
              </button>
            </section>

            <!-- 通联方式 -->
            <section class="detail-section" v-if="selectedCharacter.绯色关系?.通联方式 !== '无'">
              <h4><i class="fas fa-phone"></i> 通联</h4>
              <div class="contact-info">
                <span class="contact-type">{{ selectedCharacter.绯色关系?.通联方式 }}</span>
                <span class="contact-detail" v-if="selectedCharacter.绯色关系?.通联详情 !== '无'">
                  {{ selectedCharacter.绯色关系?.通联详情 }}
                </span>
              </div>
            </section>

            <!-- 近期事件 -->
            <section class="detail-section" v-if="selectedCharacter.绯色关系?.近期事件 !== '无'">
              <h4><i class="fas fa-calendar-day"></i> 近期事件</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.近期事件 }}</p>
            </section>
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
const selectedChar = ref<string | null>(null);
const showSensitive = ref(false);

const 绯色对象列表 = computed(() => gameData.绯色对象列表);

const filteredRomanceList = computed(() => {
  if (!searchQuery.value) return 绯色对象列表.value;
  const q = searchQuery.value.toLowerCase();
  return 绯色对象列表.value.filter(
    c => c.name.toLowerCase().includes(q) || (c.职务 as string).toLowerCase().includes(q),
  );
});

const selectedCharacter = computed(() => {
  if (!selectedChar.value) return null;
  return gameData.人物库[selectedChar.value];
});

function selectChar(name: string) {
  selectedChar.value = name;
  showSensitive.value = false;
}

function coverStyle(name: string) {
  const url = gameData.getAvatar(name);
  return url ? { backgroundImage: `url(${url})` } : {};
}

function handleCoverUpload(e: Event, name: string) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 4 * 1024 * 1024) {
    toastr.warning('图片大小不能超过 4MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    gameData.setAvatar(name, reader.result as string);
    toastr.success('封面已更新');
  };
  reader.readAsDataURL(file);
}

function dangerLevel(danger: number) {
  if (danger >= 80) return 'critical';
  if (danger >= 50) return 'high';
  if (danger >= 30) return 'medium';
  return 'low';
}

function stageProgress(stage: string | undefined) {
  const stages = ['素未谋面', '初步接触', '暧昧试探', '激情突破', '稳定维持', '如胶似漆', '激情消退', '关系决裂', '彻底终结'];
  const idx = stages.indexOf(stage || '');
  return idx >= 0 ? ((idx + 1) / stages.length) * 100 : 0;
}

function emotionClass(emotion: string | undefined) {
  if (!emotion || emotion === '无') return '';
  if (['心满意足', '期待渴望'].includes(emotion)) return 'positive';
  if (['焦虑不安', '绝望崩溃'].includes(emotion)) return 'negative';
  if (['心生怨恨', '患得患失'].includes(emotion)) return 'warning';
  return '';
}

function truncate(text: string, len: number) {
  return text.length > len ? text.slice(0, len) + '...' : text;
}
</script>

<style lang="scss" scoped>
.romance-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// ═══ 工具栏 ═══
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.search-box {
  flex: 1;
  max-width: 300px;
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
    color: var(--color-text-primary);

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.stats {
  .count {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-romance-light);

    i {
      color: var(--color-romance);
    }
  }
}

// ═══ 卡片网格 ═══
.romance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.romance-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow-romance);
    border-color: var(--color-romance);
  }

  &.selected {
    border-color: var(--color-romance);
    box-shadow: var(--shadow-glow-romance);
  }
}

.card-cover {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.3) 0%, rgba(255, 77, 109, 0.1) 100%);
  background-size: cover;
  background-position: center;

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 50%, var(--color-bg-card) 100%);
  }
}

.upload-cover {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: var(--radius-sm);
  color: white;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--transition-fast);

  .romance-card:hover & {
    opacity: 1;
  }
}

.danger-indicator {
  position: absolute;
  bottom: var(--spacing-sm);
  left: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: white;

  &.critical {
    background: rgba(255, 77, 109, 0.9);
  }
  &.high {
    background: rgba(255, 107, 107, 0.8);
  }
  &.medium {
    background: rgba(224, 195, 108, 0.8);
    color: var(--color-bg-dark);
  }
}

.card-content {
  padding: var(--spacing-md);
}

.char-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.char-position {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.stage-progress {
  margin-bottom: var(--spacing-sm);

  .stage-label {
    font-size: 11px;
    color: var(--color-romance-light);
  }

  .stage-bar {
    height: 4px;
    background: var(--color-bg-elevated);
    border-radius: 2px;
    margin-top: 4px;
    overflow: hidden;

    .stage-fill {
      height: 100%;
      background: var(--color-romance-gradient);
      border-radius: 2px;
    }
  }
}

.emotion-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);

  &.positive {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }
  &.negative {
    background: rgba(255, 107, 107, 0.15);
    color: var(--color-danger);
  }
  &.warning {
    background: rgba(224, 195, 108, 0.15);
    color: var(--color-warning);
  }
}

.identity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.id-tag {
  padding: 2px 6px;
  font-size: 10px;
  background: rgba(255, 77, 109, 0.1);
  border-radius: var(--radius-sm);
  color: var(--color-romance-light);
}

.recent-event {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);

  i {
    margin-top: 2px;
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
    color: var(--color-romance);
    opacity: 0.5;
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

.romance-drawer {
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
  position: relative;
  min-height: 160px;
}

.drawer-cover {
  position: absolute;
  inset: 0;
  background: var(--color-romance-gradient);
  background-size: cover;
  background-position: center;

  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 30%, var(--color-bg-card) 100%);
  }
}

.drawer-title-area {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-lg);

  h3 {
    font-size: 22px;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.drawer-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-sm);
  color: white;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.status-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;

  .status-label {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .status-value {
    font-size: 13px;
    color: var(--color-text-secondary);

    &.highlight {
      color: var(--color-romance-light);
      font-weight: 600;
    }
    &.positive {
      color: var(--color-success);
    }
    &.negative {
      color: var(--color-danger);
    }
    &.warning {
      color: var(--color-warning);
    }
  }
}

.danger-meter {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border);

  .danger-label {
    font-size: 12px;
    color: var(--color-text-muted);
    width: 50px;
  }

  .danger-bar {
    flex: 1;
    height: 8px;
    background: var(--color-bg-card);
    border-radius: 4px;
    overflow: hidden;

    .danger-fill {
      height: 100%;
      background: var(--color-romance-gradient);
      border-radius: 4px;
    }
  }

  .danger-value {
    width: 40px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-romance-light);
  }
}

.detail-section {
  margin-bottom: var(--spacing-lg);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);

    i {
      color: var(--color-romance-light);
    }
  }

  &.sensitive h4 i {
    color: var(--color-warning);
  }
}

.desc-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.grip-info {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);

  &.masked {
    filter: blur(6px);
    user-select: none;
  }
}

.grip-row {
  margin-bottom: var(--spacing-sm);

  &:last-child {
    margin-bottom: 0;
  }

  .grip-label {
    font-size: 11px;
    color: var(--color-text-muted);
    display: block;
    margin-bottom: 2px;
  }

  .grip-value {
    font-size: 13px;
    color: var(--color-text-secondary);

    &.danger {
      color: var(--color-danger);
    }
  }
}

.unmask-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--spacing-sm);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--color-text-primary);
  }
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .contact-type {
    font-size: 12px;
    color: var(--color-romance-light);
  }

  .contact-detail {
    font-size: 13px;
    color: var(--color-text-secondary);
  }
}
</style>

