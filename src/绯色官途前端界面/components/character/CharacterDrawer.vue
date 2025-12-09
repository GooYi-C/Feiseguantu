<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen" class="drawer-overlay" @click.self="close">
        <aside class="drawer-container" :class="{ editing: isEditing }">
          <template v-if="character">
            <!-- 头部 -->
            <div class="drawer-header">
              <label class="header-avatar" :class="genderClass" title="点击上传头像">
                <img v-if="avatar" :src="avatar" alt="" />
                <i v-else class="fas fa-user-tie"></i>
                <span class="gender-badge" :class="genderClass">
                  <i :class="genderIcon"></i>
                </span>
                <div class="avatar-upload-overlay">
                  <i class="fas fa-camera"></i>
                </div>
                <input type="file" accept="image/*" hidden @change="handleAvatarUpload" />
              </label>
              <div class="header-info">
                <h3 class="char-name">{{ characterName }}</h3>
                <span v-if="character.职务 !== '无'" class="char-title">{{ character.职务 }}</span>
                <div class="char-tags">
                  <span v-for="tag in displayTags" :key="tag" class="tag" :class="tagClass(tag)">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <button class="drawer-close" @click="close">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- 内容区 - 查看模式 -->
            <div v-if="!isEditing" class="drawer-body">
              <!-- 基础信息 -->
              <section class="detail-section">
                <h4><i class="fas fa-id-card"></i> 基础信息</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">性别</span>
                    <span class="value" :class="genderClass">{{ character.性别 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">年龄</span>
                    <span class="value age-value">
                      {{ character.年龄 > 0 ? character.年龄 + '岁' : '未知' }}
                      <span v-if="ageWarningText" class="age-warning" :class="ageWarningClass">
                        {{ ageWarningText }}
                      </span>
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">体系</span>
                    <span class="value">{{ character.体系 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">级别</span>
                    <span class="value">{{ character.级别 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">单位</span>
                    <span class="value">{{ character.单位 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">派系</span>
                    <span class="value">{{ character.派系 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">婚姻</span>
                    <span class="value">{{ character.婚姻状态 }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">状态</span>
                    <span class="value">{{ character.状态 }}</span>
                  </div>
                </div>
              </section>

              <!-- 数值面板 -->
              <section class="detail-section">
                <h4><i class="fas fa-chart-bar"></i> 数值面板</h4>
                <div class="stats-panel">
                  <div class="stat-row">
                    <span class="stat-label">好感度</span>
                    <div class="stat-bar">
                      <div
                        class="fill"
                        :style="{ width: character.好感度 + '%' }"
                        :class="statColor(character.好感度)"
                      ></div>
                    </div>
                    <span class="stat-value" :class="statColor(character.好感度)">{{ character.好感度 }}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">信任度</span>
                    <div class="stat-bar">
                      <div
                        class="fill"
                        :style="{ width: character.信任度 + '%' }"
                        :class="statColor(character.信任度)"
                      ></div>
                    </div>
                    <span class="stat-value" :class="statColor(character.信任度)">{{ character.信任度 }}</span>
                  </div>
                  <div v-if="character.忠诚度 > 0" class="stat-row">
                    <span class="stat-label">忠诚度</span>
                    <div class="stat-bar">
                      <div
                        class="fill"
                        :style="{ width: character.忠诚度 + '%' }"
                        :class="statColor(character.忠诚度)"
                      ></div>
                    </div>
                    <span class="stat-value" :class="statColor(character.忠诚度)">{{ character.忠诚度 }}</span>
                  </div>
                </div>
              </section>

              <!-- 当前状态 -->
              <section v-if="character.当前状态 !== '无'" class="detail-section">
                <h4><i class="fas fa-info-circle"></i> 当前状态</h4>
                <p class="status-text">{{ character.当前状态 }}</p>
              </section>

              <!-- 官场关系 -->
              <section v-if="hasOfficialRelation" class="detail-section">
                <h4><i class="fas fa-landmark"></i> 官场关系</h4>
                <div class="relation-grid">
                  <template v-for="(value, key) in character.官场关系" :key="key">
                    <div v-if="value && value !== '无'" class="relation-item">
                      <span class="label">{{ key }}</span>
                      <span class="value" :class="{ danger: key === '威胁等级' && isDangerLevel(value) }">{{
                        value
                      }}</span>
                    </div>
                  </template>
                </div>
              </section>

              <!-- 绯色关系 -->
              <section v-if="hasRomanceRelation" class="detail-section romance">
                <h4><i class="fas fa-heart"></i> 绯色关系</h4>
                <div class="relation-grid">
                  <div v-if="character.绯色关系?.关系阶段 !== '无'" class="relation-item">
                    <span class="label">关系阶段</span>
                    <span class="value romance">{{ character.绯色关系?.关系阶段 }}</span>
                  </div>
                  <div v-if="character.绯色关系?.关系性质 !== '无'" class="relation-item">
                    <span class="label">关系性质</span>
                    <span class="value">{{ character.绯色关系?.关系性质 }}</span>
                  </div>
                  <div class="relation-item full">
                    <span class="label">危险度</span>
                    <div class="danger-bar-wrapper">
                      <div class="danger-bar">
                        <div class="fill" :style="{ width: character.绯色关系?.危险度 + '%' }"></div>
                      </div>
                      <span class="danger-value">{{ character.绯色关系?.危险度 }}%</span>
                    </div>
                  </div>
                  <div v-if="character.绯色关系?.外貌 !== '无'" class="relation-item full">
                    <span class="label">外貌</span>
                    <span class="value">{{ character.绯色关系?.外貌 }}</span>
                  </div>
                </div>
              </section>

              <!-- 竞争关系 -->
              <section v-if="hasRivalRelation" class="detail-section">
                <h4><i class="fas fa-chess"></i> 竞争关系</h4>
                <div class="relation-grid">
                  <template v-for="(value, key) in character.竞争关系" :key="key">
                    <div v-if="value && value !== '无'" class="relation-item" :class="{ full: isLongField(key) }">
                      <span class="label">{{ key }}</span>
                      <span class="value">{{ value }}</span>
                    </div>
                  </template>
                </div>
              </section>

              <!-- 靠山关系 -->
              <section v-if="hasBackerRelation" class="detail-section">
                <h4><i class="fas fa-shield-halved"></i> 靠山关系</h4>
                <div class="relation-grid">
                  <template v-for="(value, key) in character.靠山关系" :key="key">
                    <div v-if="value && value !== '无'" class="relation-item" :class="{ full: isLongField(key) }">
                      <span class="label">{{ key }}</span>
                      <span class="value">{{ value }}</span>
                    </div>
                  </template>
                </div>
              </section>

              <!-- 家庭关系 -->
              <section v-if="hasFamilyRelation" class="detail-section">
                <h4><i class="fas fa-house-user"></i> 家庭关系</h4>
                <div class="relation-grid">
                  <template v-for="(value, key) in character.家庭关系" :key="key">
                    <div v-if="value && value !== '无'" class="relation-item" :class="{ full: isLongField(key) }">
                      <span class="label">{{ key }}</span>
                      <span class="value">{{ value }}</span>
                    </div>
                  </template>
                </div>
              </section>

              <!-- 操作按钮 -->
              <div class="drawer-actions">
                <button class="btn-edit" @click="startEdit"><i class="fas fa-edit"></i> 编辑</button>
                <button class="btn-delete" @click="handleDelete"><i class="fas fa-trash"></i> 删除</button>
              </div>
            </div>

            <!-- 内容区 - 编辑模式 -->
            <div v-else class="drawer-body editing">
              <CharacterForm ref="formRef" v-model="editData" mode="edit" />
              <div class="edit-actions">
                <button class="btn-cancel" @click="cancelEdit"><i class="fas fa-times"></i> 取消</button>
                <button class="btn-save" :disabled="isSaving" @click="saveEdit">
                  <i v-if="isSaving" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-save"></i>
                  保存
                </button>
              </div>
            </div>
          </template>
        </aside>
      </div>
    </Transition>
  </Teleport>

  <!-- 删除确认对话框 -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="删除确认"
    :message="`确定要删除人物「${characterName}」吗？此操作不可撤销。`"
    confirm-text="删除"
    danger
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { computed, ref, watch } from 'vue';
import { useCharacters, useGameData, useLocalCache } from '../../stores';
import type { 人物 } from '../../stores/schema';
import { ConfirmDialog } from '../common';
import CharacterForm from './CharacterForm.vue';

// ═══ Props & Emits ═══
const props = defineProps<{
  modelValue: boolean;
  characterName: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'deleted', name: string): void;
  (e: 'updated', name: string): void;
}>();

// ═══ Stores ═══
const characters = useCharacters();
const localCache = useLocalCache();
const gameData = useGameData();

// ═══ 状态 ═══
const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
});

const isEditing = ref(false);
const isSaving = ref(false);
const editData = ref<Partial<人物>>({});
const originalEditData = ref<string>(''); // 用于比较是否有变化
const formRef = ref<InstanceType<typeof CharacterForm> | null>(null);
const showDeleteConfirm = ref(false);

// ═══ 计算属性 ═══
const character = computed(() => characters.getCharacter(props.characterName));
const avatar = computed(() => localCache.getAvatar(props.characterName));

const genderClass = computed(() => {
  const gender = character.value?.性别;
  if (gender === '男') return 'male';
  if (gender === '女') return 'female';
  return '';
});

const genderIcon = computed(() => {
  const gender = character.value?.性别;
  if (gender === '男') return 'fas fa-mars';
  if (gender === '女') return 'fas fa-venus';
  return 'fas fa-genderless';
});

const displayTags = computed(() => character.value?.角色标签?.slice(0, 5) || []);

// ═══ 年龄红线提示 ═══
function getAgeLimit(level: string): { targetAge: number; nextLevel: string } | null {
  const levelMap: Record<string, { targetAge: number; nextLevel: string }> = {
    副科级: { targetAge: 30, nextLevel: '正科级' },
    副科: { targetAge: 30, nextLevel: '正科' },
    正科级: { targetAge: 35, nextLevel: '副处级' },
    正科: { targetAge: 35, nextLevel: '副处' },
    副处级: { targetAge: 35, nextLevel: '正处级' },
    副处: { targetAge: 35, nextLevel: '正处' },
    正处级: { targetAge: 45, nextLevel: '副厅级' },
    正处: { targetAge: 45, nextLevel: '副厅' },
    副厅级: { targetAge: 45, nextLevel: '正厅级' },
    副厅: { targetAge: 45, nextLevel: '正厅' },
    正厅级: { targetAge: 55, nextLevel: '副部级' },
    正厅: { targetAge: 55, nextLevel: '副部' },
    副部级: { targetAge: 55, nextLevel: '正部级' },
    副部: { targetAge: 55, nextLevel: '正部' },
    正部级: { targetAge: 65, nextLevel: '国家级' },
    正部: { targetAge: 65, nextLevel: '国家级' },
    国家级: { targetAge: 67, nextLevel: '政治局常委' },
    政治局常委: { targetAge: 67, nextLevel: '' },
  };
  return levelMap[level] || null;
}

const ageWarningClass = computed(() => {
  const age = character.value?.年龄 || 0;
  const level = character.value?.级别 || '无';
  const limit = getAgeLimit(level);

  if (!limit) {
    if (age >= 60) return 'danger';
    if (age >= 55) return 'warning';
    return '';
  }

  const diff = limit.targetAge - age;
  if (diff <= 0) return 'danger';
  if (diff <= 3) return 'warning';
  if (diff <= 5) return 'caution';
  return 'good';
});

const ageWarningText = computed(() => {
  const age = character.value?.年龄 || 0;
  const level = character.value?.级别 || '无';
  const limit = getAgeLimit(level);

  if (!limit) {
    if (age >= 68) return '七上八下，回家养老';
    if (age >= 60) return '已过退休线';
    if (age >= 55) return '临近退休';
    return '';
  }

  const diff = limit.targetAge - age;

  if (level.includes('政治局') || level.includes('国家级')) {
    if (age >= 68) return '八下铁律，体面退场';
    if (age >= 67) return '七上八下，最后一搏';
    if (age >= 65) return '夕阳余晖，善始善终';
    return '';
  }

  if (diff <= -10) return '莫求升迁，另谋出路';
  if (diff <= -5) return '前路艰难，心态放平';
  if (diff <= 0) return `已超${limit.nextLevel}红线${-diff}年`;
  if (diff <= 2) return `距${limit.nextLevel}红线仅${diff}年！`;
  if (diff <= 5) return `离${limit.nextLevel}红线还有${diff}年`;
  if (diff <= 10) return `${limit.nextLevel}晋升窗口期`;
  return '年龄优势明显';
});

// 关系判断
const hasOfficialRelation = computed(() => {
  const rel = character.value?.官场关系;
  return rel && Object.values(rel).some(v => v && v !== '无');
});

const hasRomanceRelation = computed(() => {
  const rel = character.value?.绯色关系;
  return rel && (rel.关系阶段 !== '无' || (rel.危险度 && rel.危险度 > 0));
});

const hasRivalRelation = computed(() => {
  const rel = character.value?.竞争关系;
  return rel && Object.values(rel).some(v => v && v !== '无');
});

const hasBackerRelation = computed(() => {
  const rel = character.value?.靠山关系;
  return rel && Object.values(rel).some(v => v && v !== '无');
});

const hasFamilyRelation = computed(() => {
  const rel = character.value?.家庭关系;
  return rel && Object.values(rel).some(v => v && v !== '无');
});

// ═══ 方法 ═══
function hasUnsavedChanges(): boolean {
  if (!isEditing.value || !originalEditData.value) return false;
  // 使用 editData（通过 v-model 同步）与原始数据比较
  // 需要用 klona 去除 proxy 层以确保序列化一致
  const currentJson = JSON.stringify(klona(editData.value));
  return currentJson !== originalEditData.value;
}

function close() {
  if (isEditing.value && hasUnsavedChanges()) {
    if (!confirm('有未保存的更改，确定要关闭吗？')) {
      return;
    }
  }
  isEditing.value = false;
  isOpen.value = false;
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

function isDangerLevel(level: unknown) {
  return typeof level === 'string' && ['极高', '致命'].includes(level);
}

function isLongField(key: string) {
  return ['已知弱点', '利用价值', '可托付事项', '近期动向', '提携内容', '预期回报', '知悉内情', '政治资源'].includes(
    key as string,
  );
}

// ═══ 编辑功能 ═══
function startEdit() {
  if (character.value) {
    const data = klona(character.value);
    editData.value = data;
    originalEditData.value = JSON.stringify(data); // 保存原始数据用于比较
    isEditing.value = true;
  }
}

function cancelEdit() {
  isEditing.value = false;
  editData.value = {};
  originalEditData.value = '';
}

async function saveEdit() {
  const validation = formRef.value?.validate();
  if (!validation?.valid) {
    toastr.warning(validation?.message || '请检查表单');
    return;
  }

  const data = formRef.value?.getData();
  if (!data) return;

  isSaving.value = true;

  try {
    characters.updateCharacter(props.characterName, data);
    await gameData.saveData();
    toastr.success('保存成功');
    emit('updated', props.characterName);
    isEditing.value = false;
  } catch (err) {
    console.error('[CharacterDrawer] 保存失败', err);
    toastr.error('保存失败');
  } finally {
    isSaving.value = false;
  }
}

// ═══ 头像上传 ═══
function handleAvatarUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 4 * 1024 * 1024) {
    toastr.warning('图片大小不能超过 4MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    localCache.setAvatar(props.characterName, reader.result as string);
    toastr.success('头像已更新');
  };
  reader.readAsDataURL(file);

  // 清空 input 以便重复选择同一文件
  input.value = '';
}

// ═══ 删除功能 ═══
function handleDelete() {
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  try {
    const name = props.characterName;
    characters.deleteCharacter(name);
    localCache.removeAvatar(name);
    await gameData.saveData();
    toastr.success(`人物「${name}」已删除`);
    emit('deleted', name);
    isOpen.value = false;
  } catch (err) {
    console.error('[CharacterDrawer] 删除失败', err);
    toastr.error('删除失败');
  }
}

// 监听打开状态
watch(isOpen, val => {
  if (!val) {
    isEditing.value = false;
    editData.value = {};
    originalEditData.value = '';
  }
});
</script>

<style lang="scss" scoped>
// ═══ 遮罩层 ═══
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-drawer);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

// ═══ 抽屉容器 ═══
.drawer-container {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.editing {
    width: 500px;
  }
}

// ═══ 头部 ═══
.drawer-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, rgba(216, 166, 87, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  > i {
    font-size: 28px;
    color: var(--color-text-muted);
  }

  &.male {
    border: 2px solid #4a90d9;
  }

  &.female {
    border: 2px solid #e84393;
  }

  // 上传覆盖层
  .avatar-upload-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.2s ease;

    i {
      font-size: 20px;
      color: white;
    }
  }

  &:hover .avatar-upload-overlay {
    opacity: 1;
  }
}

.gender-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;

  &.male {
    background: #4a90d9;
    color: white;
  }

  &.female {
    background: #e84393;
    color: white;
  }
}

.header-info {
  flex: 1;
  min-width: 0;

  .char-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 4px;
  }

  .char-title {
    font-size: 13px;
    color: var(--color-gold);
    display: block;
    margin-bottom: var(--spacing-xs);
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
    &.info {
      background: rgba(122, 162, 247, 0.15);
      color: var(--color-info);
    }
  }
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

// ═══ 内容区 ═══
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);

  &.editing {
    padding: var(--spacing-md);
  }
}

// ═══ 详情区块 ═══
.detail-section {
  margin-bottom: var(--spacing-xl);

  h4 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-md);
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
.relation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm) var(--spacing-md);
}

.info-item,
.relation-item {
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

    &.male {
      color: #4a90d9;
    }
    &.female {
      color: #e84393;
    }
    &.romance {
      color: var(--color-romance-light);
    }
    &.danger {
      color: var(--color-danger);
    }

    // 年龄值显示
    &.age-value {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }

  // 年龄红线提示
  .age-warning {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-sm);

    &.danger {
      background: rgba(255, 107, 107, 0.15);
      color: var(--color-danger);
    }
    &.warning {
      background: rgba(224, 195, 108, 0.15);
      color: var(--color-warning);
    }
    &.caution {
      background: rgba(216, 166, 87, 0.15);
      color: var(--color-gold);
    }
    &.good {
      background: rgba(74, 193, 142, 0.15);
      color: var(--color-success);
    }
  }
}

// ═══ 数值面板 ═══
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  .stat-label {
    width: 50px;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .stat-bar {
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

  .stat-value {
    width: 30px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;

    &.high {
      color: var(--color-success);
    }
    &.mid {
      color: var(--color-warning);
    }
    &.low {
      color: var(--color-danger);
    }
  }
}

// ═══ 危险度条 ═══
.danger-bar-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
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

.danger-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-romance-light);
}

.status-text {
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
}

// ═══ 操作按钮 ═══
.drawer-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.btn-edit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:hover {
    filter: brightness(1.1);
  }
}

.btn-delete {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-danger);

  &:hover {
    background: rgba(255, 107, 107, 0.1);
  }
}

// ═══ 编辑操作 ═══
.edit-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.btn-save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-success);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: white;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ═══ 过渡动画 ═══
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;

  .drawer-container {
    transition: transform 0.3s ease;
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  .drawer-container {
    transform: translateX(100%);
  }
}
</style>
