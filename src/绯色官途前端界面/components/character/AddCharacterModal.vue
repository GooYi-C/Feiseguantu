<template>
  <Modal
    v-model="isOpen"
    title="新增人物"
    icon="fas fa-user-plus"
    size="lg"
    :close-on-overlay="!hasChanges"
    @close="handleClose"
  >
    <!-- 模板选择 -->
    <div class="template-section" v-if="step === 'template'">
      <p class="template-hint">选择人物模板快速创建，或从空白开始</p>
      <div class="template-grid">
        <button
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          :class="{ selected: selectedTemplate === template.id }"
          @click="selectTemplate(template.id)"
        >
          <i :class="template.icon"></i>
          <span class="template-name">{{ template.name }}</span>
          <span class="template-desc">{{ template.description }}</span>
        </button>
      </div>
      <div class="template-actions">
        <button class="btn-secondary" @click="close">取消</button>
        <button class="btn-primary" @click="nextStep">下一步 <i class="fas fa-arrow-right"></i></button>
      </div>
    </div>

    <!-- 编辑表单 -->
    <div class="form-section" v-else>
      <div class="form-header">
        <button class="btn-back" @click="prevStep"><i class="fas fa-arrow-left"></i> 返回选择模板</button>
        <span class="template-badge" v-if="selectedTemplate !== 'blank'">
          <i :class="currentTemplate?.icon"></i>
          {{ currentTemplate?.name }}
        </span>
      </div>

      <CharacterForm ref="formRef" v-model="characterData" mode="create" />
    </div>

    <template #footer v-if="step === 'form'">
      <button class="btn-secondary" @click="close">取消</button>
      <button class="btn-primary" :disabled="isSubmitting" @click="handleSubmit">
        <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-check"></i>
        创建人物
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Modal } from '../common';
import CharacterForm from './CharacterForm.vue';
import { useCharacters, useGameData } from '../../stores';
import type { 人物 } from '../../stores/schema';

// ═══ Props & Emits ═══
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created', name: string): void;
}>();

// ═══ Stores ═══
const characters = useCharacters();
const gameData = useGameData();

// ═══ 状态 ═══
const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
});

const step = ref<'template' | 'form'>('template');
const selectedTemplate = ref('blank');
const characterData = ref<Partial<人物>>({});
const isSubmitting = ref(false);
const formRef = ref<InstanceType<typeof CharacterForm> | null>(null);

// ═══ 模板配置 ═══
// 模板需要预填充对应关系字段，使得关系 optional 字段不为空，从而能被正确关系筛选
const templates = [
  {
    id: 'blank',
    name: '空白人物',
    description: '从零开始创建',
    icon: 'fas fa-file',
    data: {},
  },
  {
    id: 'official',
    name: '官场关系',
    description: '官场中的人脉',
    icon: 'fas fa-landmark',
    data: {
      体系: '党政',
      好感度: 50,
      信任度: 50,
      角色标签: [],
      官场关系: {
        关系类型: '待填写',
        立场倾向: '待填写',
      },
    },
  },
  {
    id: 'romance',
    name: '绯色对象',
    description: '潜在或已有情感关系',
    icon: 'fas fa-heart',
    data: {
      性别: '女',
      好感度: 60,
      信任度: 40,
      角色标签: ['绯色对象'],
      绯色关系: {
        关系阶段: '待填写',
        关系性质: '待填写',
        危险度: 30,
      },
    },
  },
  {
    id: 'rival',
    name: '竞争对手',
    description: '职务竞争者',
    icon: 'fas fa-chess',
    data: {
      体系: '党政',
      好感度: 30,
      信任度: 20,
      角色标签: ['竞争对手'],
      竞争关系: {
        竞争目标: '待填写',
        竞争态势: '待填写',
      },
    },
  },
  {
    id: 'backer',
    name: '靠山',
    description: '提携自己的上级',
    icon: 'fas fa-shield-halved',
    data: {
      体系: '党政',
      好感度: 70,
      信任度: 60,
      角色标签: ['靠山'],
      靠山关系: {
        紧密度: '待填写',
        提携内容: '待填写',
      },
    },
  },
  {
    id: 'family',
    name: '家庭成员',
    description: '家属亲戚',
    icon: 'fas fa-house-user',
    data: {
      好感度: 80,
      信任度: 70,
      角色标签: ['家属'],
      家庭关系: {
        关系: '待填写',
        态度: '待填写',
      },
    },
  },
];

const currentTemplate = computed(() => templates.find(t => t.id === selectedTemplate.value));

const hasChanges = computed(() => {
  return characterData.value.姓名 && characterData.value.姓名 !== '无';
});

// ═══ 方法 ═══
function selectTemplate(id: string) {
  selectedTemplate.value = id;
}

function nextStep() {
  // 应用模板数据
  const template = currentTemplate.value;
  if (template) {
    characterData.value = { ...template.data };
  }
  step.value = 'form';
}

function prevStep() {
  step.value = 'template';
}

function close() {
  if (hasChanges.value) {
    if (!confirm('有未保存的更改，确定要关闭吗？')) {
      return;
    }
  }
  reset();
  isOpen.value = false;
}

function handleClose() {
  reset();
}

function reset() {
  step.value = 'template';
  selectedTemplate.value = 'blank';
  characterData.value = {};
  isSubmitting.value = false;
}

async function handleSubmit() {
  // 验证表单
  const validation = formRef.value?.validate();
  if (!validation?.valid) {
    toastr.warning(validation?.message || '请填写必要信息');
    return;
  }

  const data = formRef.value?.getData();
  if (!data?.姓名 || data.姓名 === '无') {
    toastr.warning('请输入人物姓名');
    return;
  }

  const name = data.姓名.trim();

  // 检查重复
  if (characters.existsInLibrary(name)) {
    toastr.warning(`人物「${name}」已存在`);
    return;
  }

  isSubmitting.value = true;

  try {
    // 添加人物
    const success = characters.addCharacter(name, data);
    if (success) {
      // 保存数据
      await gameData.saveData();
      toastr.success(`人物「${name}」创建成功`);
      emit('created', name);
      reset();
      isOpen.value = false;
    }
  } catch (err) {
    console.error('[AddCharacterModal] 创建失败', err);
    toastr.error('创建失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
}

// 打开时重置
watch(isOpen, val => {
  if (val) {
    reset();
  }
});
</script>

<style lang="scss" scoped>
// ═══ 模板选择 ═══
.template-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.template-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-bg-elevated);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-card);
    border-color: var(--color-border-light);
  }

  &.selected {
    border-color: var(--color-gold);
    background: rgba(216, 166, 87, 0.1);

    i {
      color: var(--color-gold);
    }
  }

  i {
    font-size: 24px;
    color: var(--color-text-muted);
    transition: color var(--transition-fast);
  }

  .template-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .template-desc {
    font-size: 11px;
    color: var(--color-text-muted);
    text-align: center;
  }
}

.template-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

// ═══ 表单区域 ═══
.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.template-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 11px;
  color: var(--color-gold);
  background: rgba(216, 166, 87, 0.15);
  border-radius: var(--radius-full);

  i {
    font-size: 12px;
  }
}

// ═══ 按钮样式 ═══
.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
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

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
