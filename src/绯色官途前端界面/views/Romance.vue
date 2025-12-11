<template>
  <div class="romance-page">
    <!-- 横向滚动卡片区 -->
    <div class="romance-carousel" ref="carouselRef" @wheel.prevent="handleWheel">
      <div class="carousel-track" :style="{ transform: `translateX(${scrollOffset}px)` }">
        <div
          v-for="char in sortedRomanceList"
          :key="char.name"
          class="romance-card"
          :class="{ selected: selectedChar === char.name }"
          @click="selectChar(char.name)"
        >
          <!-- 封面图片区域（占 61.8% 高度） -->
          <div class="card-cover" :style="romanceCoverStyle(char.name)">
            <div class="cover-gradient"></div>
            <!-- 上传按钮 -->
            <button class="upload-btn" title="上传绯色封面" @click.stop="openImageUploader(char.name)">
              <i class="fas fa-camera"></i>
            </button>
            <!-- 好感度指示 -->
            <div class="favor-badge">
              <i class="fas fa-heart"></i>
              <span>{{ char.好感度 || 50 }}%</span>
            </div>
            <!-- 危险度指示 -->
            <div class="danger-badge" :class="dangerLevel(char.绯色关系?.危险度 || 0)">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ char.绯色关系?.危险度 || 0 }}%</span>
            </div>
          </div>

          <!-- 信息区域 -->
          <div class="card-info">
            <h3 class="char-name">{{ char.name }}</h3>
            <div v-if="char.职务 !== '无'" class="char-position">{{ char.职务 }}</div>

            <!-- 关系阶段 + 情绪状态（并列一排） -->
            <div class="status-row">
              <div v-if="char.绯色关系?.关系阶段" class="stage-tag" :class="stageClass(char.绯色关系.关系阶段)">
                {{ char.绯色关系.关系阶段 }}
              </div>
              <div
                v-if="char.绯色关系?.情绪状态 !== '无'"
                class="emotion-tag"
                :class="emotionClass(char.绯色关系?.情绪状态)"
              >
                <i class="fas fa-face-smile-beam"></i>
                {{ char.绯色关系?.情绪状态 }}
              </div>
            </div>

            <!-- 身份标签 -->
            <div v-if="char.绯色关系?.身份标签?.length" class="identity-tags">
              <span v-for="tag in char.绯色关系.身份标签.slice(0, 3)" :key="tag" class="id-tag">{{ tag }}</span>
            </div>

            <!-- 近期事件 -->
            <div v-if="char.绯色关系?.近期事件 !== '无'" class="recent-event">
              <i class="fas fa-clock-rotate-left"></i>
              「{{ truncate(char.绯色关系?.近期事件 || '', 30) }}」
            </div>
          </div>
        </div>
      </div>

      <div v-if="sortedRomanceList.length === 0" class="empty-state">
        <i class="fas fa-heart-crack"></i>
        <p>暂无绯色对象</p>
      </div>
    </div>

    <!-- 滚动指示器 -->
    <div v-if="sortedRomanceList.length > 0" class="scroll-indicator">
      <div
        class="scroll-thumb"
        :style="{
          width: thumbWidth + '%',
          left: thumbPosition + '%',
        }"
      ></div>
    </div>

    <!-- 详情抽屉 -->
    <Teleport to="body">
      <div class="drawer-overlay" :class="{ open: !!selectedChar }" @click="selectedChar = null"></div>
      <aside class="drawer romance-drawer" :class="{ open: !!selectedChar }">
        <template v-if="selectedChar && selectedCharacter">
          <div class="drawer-header">
            <div class="drawer-cover" :style="romanceCoverStyle(selectedChar)">
              <div class="cover-gradient"></div>
            </div>
            <div class="drawer-title-area">
              <h3>{{ selectedChar }}</h3>
              <span v-if="selectedCharacter.职务 !== '无'" class="subtitle">{{ selectedCharacter.职务 }}</span>
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
              <div class="status-row">
                <span class="status-label">好感度</span>
                <span class="status-value highlight">{{ selectedCharacter.好感度 || 50 }}%</span>
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
            <section v-if="selectedCharacter.绯色关系?.外貌 !== '无'" class="detail-section">
              <h4><i class="fas fa-eye"></i> 外貌</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.外貌 }}</p>
            </section>

            <!-- 性格 -->
            <section v-if="selectedCharacter.绯色关系?.性格 !== '无'" class="detail-section">
              <h4><i class="fas fa-masks-theater"></i> 性格</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.性格 }}</p>
            </section>

            <!-- 把柄信息 -->
            <section v-if="selectedCharacter.绯色关系?.把柄" class="detail-section sensitive">
              <h4><i class="fas fa-file-contract"></i> 把柄</h4>
              <div class="grip-info" :class="{ masked: !showSensitive }">
                <div v-if="selectedCharacter.绯色关系?.把柄.我方掌握 !== '无'" class="grip-row">
                  <span class="grip-label">我方掌握</span>
                  <span class="grip-value">{{ selectedCharacter.绯色关系?.把柄.我方掌握 }}</span>
                </div>
                <div v-if="selectedCharacter.绯色关系?.把柄.对方掌握 !== '无'" class="grip-row">
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
            <section v-if="selectedCharacter.绯色关系?.通联方式 !== '无'" class="detail-section">
              <h4><i class="fas fa-phone"></i> 通联</h4>
              <div class="contact-info">
                <span class="contact-type">{{ selectedCharacter.绯色关系?.通联方式 }}</span>
                <span v-if="selectedCharacter.绯色关系?.通联详情 !== '无'" class="contact-detail">
                  {{ selectedCharacter.绯色关系?.通联详情 }}
                </span>
              </div>
            </section>

            <!-- 近期事件 -->
            <section v-if="selectedCharacter.绯色关系?.近期事件 !== '无'" class="detail-section">
              <h4><i class="fas fa-calendar-day"></i> 近期事件</h4>
              <p class="desc-text">{{ selectedCharacter.绯色关系?.近期事件 }}</p>
            </section>
          </div>
        </template>
      </aside>
    </Teleport>

    <!-- 图片上传弹窗 -->
    <Teleport to="body">
      <div v-if="showImageUploader" class="image-uploader-modal" @click.self="closeImageUploader">
        <div class="uploader-dialog">
          <div class="uploader-header">
            <h3><i class="fas fa-crop-alt"></i> 上传绯色封面</h3>
            <button class="close-btn" @click="closeImageUploader">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="uploader-body">
            <ImageUploader
              :default-output-size="300"
              default-shape="portrait"
              :max-size="500"
              @upload="handleImageUpload"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ImageUploader } from '../components/common';
import { useGameData, useLocalCache } from '../stores';

const gameData = useGameData();
const localCache = useLocalCache();

const selectedChar = ref<string | null>(null);
const showSensitive = ref(false);
const carouselRef = ref<HTMLElement | null>(null);
const scrollOffset = ref(0);
const maxScrollOffset = ref(0);
const cardWidth = 280; // 卡片宽度
const cardGap = 24; // 卡片间距

// 图片上传弹窗状态
const showImageUploader = ref(false);
const uploadingCharName = ref<string | null>(null);

// 绯色专用头像 key 前缀
const ROMANCE_AVATAR_PREFIX = 'romance_';

const 绯色对象列表 = computed(() => gameData.绯色对象列表);

// 按好感度从高到低排序
const sortedRomanceList = computed(() => {
  const list = [...绯色对象列表.value];
  // 按好感度排序
  return list.sort((a, b) => (b.好感度 || 50) - (a.好感度 || 50));
});

const selectedCharacter = computed(() => {
  if (!selectedChar.value) return null;
  return gameData.人物库[selectedChar.value];
});

// 计算最大滚动偏移
function updateMaxScroll() {
  if (!carouselRef.value) return;
  const containerWidth = carouselRef.value.clientWidth;
  const totalWidth = sortedRomanceList.value.length * (cardWidth + cardGap);
  maxScrollOffset.value = Math.max(0, totalWidth - containerWidth + 40);
}

// 滚动指示器
const thumbWidth = computed(() => {
  if (maxScrollOffset.value === 0) return 100;
  const containerWidth = carouselRef.value?.clientWidth || 800;
  const totalWidth = sortedRomanceList.value.length * (cardWidth + cardGap);
  return Math.max(20, (containerWidth / totalWidth) * 100);
});

const thumbPosition = computed(() => {
  if (maxScrollOffset.value === 0) return 0;
  return (Math.abs(scrollOffset.value) / maxScrollOffset.value) * (100 - thumbWidth.value);
});

// 处理滚轮事件
function handleWheel(e: WheelEvent) {
  const delta = e.deltaY || e.deltaX;
  scrollOffset.value = Math.min(0, Math.max(-maxScrollOffset.value, scrollOffset.value - delta));
}

// 绯色专用头像（独立存储）
function getRomanceAvatar(name: string): string | null {
  return localCache.getAvatar(ROMANCE_AVATAR_PREFIX + name);
}

function setRomanceAvatar(name: string, dataUrl: string): boolean {
  return localCache.setAvatar(ROMANCE_AVATAR_PREFIX + name, dataUrl);
}

// 封面样式（只使用绯色专用头像，不回退到通用头像，保持完全独立）
function romanceCoverStyle(name: string) {
  const romanceAvatar = getRomanceAvatar(name);
  return romanceAvatar ? { backgroundImage: `url(${romanceAvatar})` } : {};
}

function selectChar(name: string) {
  selectedChar.value = name;
  showSensitive.value = false;
}

// 图片上传弹窗
function openImageUploader(name: string) {
  uploadingCharName.value = name;
  showImageUploader.value = true;
}

function closeImageUploader() {
  showImageUploader.value = false;
  uploadingCharName.value = null;
}

function handleImageUpload(dataUrl: string) {
  if (uploadingCharName.value) {
    setRomanceAvatar(uploadingCharName.value, dataUrl);
    toastr.success('绯色封面已更新');
  }
  closeImageUploader();
}

function dangerLevel(danger: number) {
  if (danger >= 80) return 'critical';
  if (danger >= 50) return 'high';
  if (danger >= 30) return 'medium';
  return 'low';
}

function stageClass(stage: string) {
  const hotStages = ['激情突破', '如胶似漆', '稳定维持'];
  const coldStages = ['激情消退', '关系决裂'];
  if (hotStages.includes(stage)) return 'hot';
  if (coldStages.includes(stage)) return 'cold';
  return '';
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

// 生命周期
onMounted(() => {
  updateMaxScroll();
  window.addEventListener('resize', updateMaxScroll);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateMaxScroll);
});
</script>

<style lang="scss" scoped>
.romance-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// ═══ 横向滚动区域 ═══
.romance-carousel {
  flex: 1;
  overflow: hidden;
  perspective: 1000px;
  padding: var(--spacing-sm) 0;
}

.carousel-track {
  display: flex;
  gap: 24px;
  padding: var(--spacing-sm) var(--spacing-lg);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

// ═══ 卡片样式 ═══
.romance-card {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--color-bg-card) 0%, rgba(30, 20, 25, 0.95) 100%);
  border: 2px solid rgba(196, 30, 58, 0.3);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-style: preserve-3d;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.08) translateY(-8px);
    border-color: var(--color-romance);
    box-shadow:
      0 25px 60px rgba(196, 30, 58, 0.4),
      0 0 40px rgba(255, 77, 109, 0.25);
    z-index: 10;
  }

  &.selected {
    border-color: var(--color-romance);
    box-shadow: var(--shadow-glow-romance);
  }
}

// 封面区域（与裁剪比例 3:4 一致，所见即所得）
.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.5) 0%, rgba(120, 20, 40, 0.4) 100%);
  background-size: cover;
  background-position: center;

  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 50%,
      rgba(30, 20, 25, 0.8) 85%,
      rgba(30, 20, 25, 1) 100%
    );
  }
}

.upload-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all var(--transition-fast);

  .romance-card:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--color-romance);
    transform: scale(1.1);
  }
}

.favor-badge {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 77, 109, 0.9);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 77, 109, 0.4);

  i {
    font-size: 10px;
  }
}

.danger-badge {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
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

// 信息区域
.card-info {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

// 关系阶段 + 情绪状态并列
.status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.char-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.char-position {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stage-tag {
  display: inline-block;
  width: fit-content;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 77, 109, 0.15);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: var(--radius-full);
  color: var(--color-romance-light);

  &.hot {
    background: rgba(255, 77, 109, 0.25);
    border-color: var(--color-romance);
    color: var(--color-romance);
  }

  &.cold {
    background: rgba(122, 162, 247, 0.15);
    border-color: rgba(122, 162, 247, 0.3);
    color: var(--color-info);
  }
}

.emotion-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 3px 8px;
  font-size: 10px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);

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
}

.id-tag {
  padding: 2px 6px;
  font-size: 9px;
  background: rgba(255, 77, 109, 0.1);
  border-radius: var(--radius-sm);
  color: var(--color-romance-light);
}

.recent-event {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
  line-height: 1.4;

  i {
    margin-top: 2px;
    font-size: 10px;
    flex-shrink: 0;
  }
}

// ═══ 滚动指示器 ═══
.scroll-indicator {
  height: 4px;
  background: var(--color-bg-elevated);
  border-radius: 2px;
  margin: 0 var(--spacing-lg);
  position: relative;
  flex-shrink: 0;
}

.scroll-thumb {
  position: absolute;
  height: 100%;
  background: var(--color-romance-gradient);
  border-radius: 2px;
  transition: left 0.1s ease-out;
}

// ═══ 空状态 ═══
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--spacing-md);
  color: var(--color-text-muted);

  i {
    font-size: 64px;
    color: var(--color-romance);
    opacity: 0.3;
  }
}

// ═══ 抽屉样式 ═══
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
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
  // 使用 3:4 比例，与裁剪和卡片封面一致
  aspect-ratio: 3 / 4;
  max-height: 50vh; // 限制最大高度
}

.drawer-cover {
  position: absolute;
  inset: 0;
  background: var(--color-romance-gradient);
  background-size: cover;
  background-position: center top; // 优先显示顶部（通常是脸部）

  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, var(--color-bg-card) 100%);
  }
}

.drawer-title-area {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-lg);

  h3 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
    margin: 0;
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
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-sm);
  color: white;
  font-size: 16px;

  &:hover {
    background: rgba(255, 77, 109, 0.6);
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
    margin: 0 0 var(--spacing-sm);

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

// ═══ 图片上传弹窗 ═══
.image-uploader-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.uploader-dialog {
  width: 460px;
  max-width: 95vw;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.uploader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);

  h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;

    i {
      color: var(--color-romance);
    }
  }

  .close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);

    &:hover {
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
    }
  }
}

.uploader-body {
  padding: var(--spacing-lg);
}
</style>
