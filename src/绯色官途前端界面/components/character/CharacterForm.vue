<template>
  <div class="character-form">
    <!-- 基础信息区块 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('basic')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.basic }"></i>
        <h4><i class="fas fa-id-card"></i> 基础信息</h4>
      </div>
      <div v-show="expandedSections.basic" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>姓名 <span class="required">*</span></label>
            <input v-model="formData.姓名" type="text" :disabled="mode === 'edit'" placeholder="人物姓名" />
          </div>
          <div class="field-row">
            <label>性别</label>
            <EnumSelect v-model="formData.性别" :options="['无', '男', '女']" placeholder="选择性别" />
          </div>
          <div class="field-row">
            <label>年龄</label>
            <div class="age-input-wrapper">
              <input v-model.number="formData.年龄" type="number" min="0" max="120" placeholder="年龄" />
              <span v-if="formData.年龄 > 0" class="age-warning" :class="ageWarningClass">
                {{ ageWarningText }}
              </span>
            </div>
          </div>
          <div class="field-row">
            <label>体系</label>
            <EnumSelect
              v-model="formData.体系"
              :options="['无', '党政', '军队', '事业', '国企']"
              placeholder="选择体系"
            />
          </div>
          <div class="field-row">
            <label>级别</label>
            <input v-model="formData.级别" type="text" placeholder="如：正处级" />
          </div>
          <div class="field-row">
            <label>职务</label>
            <input v-model="formData.职务" type="text" placeholder="如：区长" />
          </div>
          <div class="field-row">
            <label>单位</label>
            <input v-model="formData.单位" type="text" placeholder="任职单位" />
          </div>
          <div class="field-row">
            <label>派系</label>
            <input v-model="formData.派系" type="text" placeholder="所属派系" />
          </div>
          <div class="field-row">
            <label>状态</label>
            <input v-model="formData.状态" type="text" placeholder="如：在职、退休" />
          </div>
          <div class="field-row">
            <label>婚姻状态</label>
            <EnumSelect
              v-model="formData.婚姻状态"
              :options="['无', '未婚', '已婚', '离异', '丧偶']"
              placeholder="婚姻状态"
            />
          </div>
          <div class="field-row full">
            <label>当前状态</label>
            <textarea v-model="formData.当前状态" rows="2" placeholder="当前状况描述"></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 数值面板区块 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('stats')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.stats }"></i>
        <h4><i class="fas fa-chart-bar"></i> 数值面板</h4>
      </div>
      <div v-show="expandedSections.stats" class="section-body">
        <div class="stats-panel">
          <SliderField v-model="formData.好感度" label="好感度" :min="0" :max="100" color-mode="graded" />
          <SliderField v-model="formData.信任度" label="信任度" :min="0" :max="100" color-mode="graded" />
          <SliderField v-model="formData.忠诚度" label="忠诚度" :min="0" :max="100" color-mode="graded" />
        </div>
      </div>
    </section>

    <!-- 角色标签区块 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('tags')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.tags }"></i>
        <h4><i class="fas fa-tags"></i> 角色标签</h4>
      </div>
      <div v-show="expandedSections.tags" class="section-body">
        <ArrayEditor v-model="formData.角色标签" :suggestions="tagSuggestions" placeholder="输入标签后按 Enter 添加" />
      </div>
    </section>

    <!-- 官场关系 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('official')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.official }"></i>
        <h4><i class="fas fa-landmark"></i> 官场关系</h4>
      </div>
      <div v-show="expandedSections.official" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>关系类型</label>
            <input v-model="官场关系Data.关系类型" type="text" placeholder="如：同僚、上下级" />
          </div>
          <div class="field-row">
            <label>关系来源</label>
            <input v-model="官场关系Data.关系来源" type="text" placeholder="认识渠道" />
          </div>
          <div class="field-row">
            <label>立场倾向</label>
            <input v-model="官场关系Data.立场倾向" type="text" placeholder="如：友好、中立、敌对" />
          </div>
          <div class="field-row">
            <label>威胁等级</label>
            <input v-model="官场关系Data.威胁等级" type="text" placeholder="如：低、中等、极高" />
          </div>
          <div class="field-row full">
            <label>敌对原因</label>
            <input v-model="官场关系Data.敌对原因" type="text" placeholder="产生矛盾的原因" />
          </div>
          <div class="field-row full">
            <label>已知弱点</label>
            <textarea v-model="官场关系Data.已知弱点" rows="2" placeholder="对方的弱点"></textarea>
          </div>
          <div class="field-row full">
            <label>利用价值</label>
            <textarea v-model="官场关系Data.利用价值" rows="2" placeholder="可利用的价值"></textarea>
          </div>
          <div class="field-row full">
            <label>可托付事项</label>
            <textarea v-model="官场关系Data.可托付事项" rows="2" placeholder="可以委托的事项"></textarea>
          </div>
          <div class="field-row full">
            <label>近期动向</label>
            <textarea v-model="官场关系Data.近期动向" rows="2" placeholder="最近的动态"></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 绯色关系 -->
    <section class="form-section romance">
      <div class="section-header" @click="toggleSection('romance')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.romance }"></i>
        <h4><i class="fas fa-heart"></i> 绯色关系</h4>
      </div>
      <div v-show="expandedSections.romance" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>关系阶段</label>
            <input v-model="绯色关系Data.关系阶段" type="text" placeholder="如：初识、暧昧、热恋" />
          </div>
          <div class="field-row">
            <label>关系性质</label>
            <input v-model="绯色关系Data.关系性质" type="text" placeholder="如：暧昧、情人" />
          </div>
          <div class="field-row full">
            <SliderField v-model="绯色关系Data.危险度" label="危险度" :min="0" :max="100" color-mode="graded" />
          </div>
          <div class="field-row full">
            <label>外貌</label>
            <textarea v-model="绯色关系Data.外貌" rows="2" placeholder="外貌描述"></textarea>
          </div>
          <div class="field-row full">
            <label>性格</label>
            <textarea v-model="绯色关系Data.性格" rows="2" placeholder="性格特点"></textarea>
          </div>
          <div class="field-row">
            <label>情绪状态</label>
            <input v-model="绯色关系Data.情绪状态" type="text" placeholder="当前情绪" />
          </div>
          <div class="field-row">
            <label>初识场景</label>
            <input v-model="绯色关系Data.初识场景" type="text" placeholder="初次相识的场景" />
          </div>
          <div class="field-row">
            <label>通联方式</label>
            <input v-model="绯色关系Data.通联方式" type="text" placeholder="联系方式" />
          </div>
          <div class="field-row">
            <label>通联详情</label>
            <input v-model="绯色关系Data.通联详情" type="text" placeholder="联系详情" />
          </div>
          <div class="field-row full">
            <label>经济往来</label>
            <input v-model="绯色关系Data.经济往来" type="text" placeholder="经济方面的往来" />
          </div>
          <div class="field-row full">
            <label>利益纠葛</label>
            <textarea v-model="绯色关系Data.利益纠葛" rows="2" placeholder="利益关系"></textarea>
          </div>
          <div class="field-row full">
            <label>安置情况</label>
            <textarea v-model="绯色关系Data.安置情况" rows="2" placeholder="安置情况"></textarea>
          </div>
          <div class="field-row full">
            <label>近期事件</label>
            <textarea v-model="绯色关系Data.近期事件" rows="2" placeholder="最近发生的事"></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 竞争关系 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('rival')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.rival }"></i>
        <h4><i class="fas fa-chess"></i> 竞争关系</h4>
      </div>
      <div v-show="expandedSections.rival" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>竞争目标</label>
            <input v-model="竞争关系Data.竞争目标" type="text" placeholder="竞争的目标" />
          </div>
          <div class="field-row">
            <label>竞争态势</label>
            <input v-model="竞争关系Data.竞争态势" type="text" placeholder="当前态势" />
          </div>
          <div class="field-row full">
            <label>竞争理由</label>
            <textarea v-model="竞争关系Data.竞争理由" rows="2" placeholder="竞争的原因"></textarea>
          </div>
          <div class="field-row full">
            <label>对方优势</label>
            <textarea v-model="竞争关系Data.对方优势" rows="2" placeholder="对方的优势"></textarea>
          </div>
          <div class="field-row full">
            <label>对方软肋</label>
            <textarea v-model="竞争关系Data.对方软肋" rows="2" placeholder="对方的弱点"></textarea>
          </div>
          <div class="field-row full">
            <label>背后靠山</label>
            <input v-model="竞争关系Data.背后靠山" type="text" placeholder="对方的靠山" />
          </div>
        </div>
      </div>
    </section>

    <!-- 靠山关系 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('backer')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.backer }"></i>
        <h4><i class="fas fa-shield-halved"></i> 靠山关系</h4>
      </div>
      <div v-show="expandedSections.backer" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>紧密度</label>
            <input v-model="靠山关系Data.紧密度" type="text" placeholder="如：疏远、一般、紧密、核心" />
          </div>
          <div class="field-row full">
            <label>提携内容</label>
            <textarea v-model="靠山关系Data.提携内容" rows="2" placeholder="提携的具体内容"></textarea>
          </div>
          <div class="field-row full">
            <label>预期回报</label>
            <textarea v-model="靠山关系Data.预期回报" rows="2" placeholder="期望的回报"></textarea>
          </div>
        </div>
      </div>
    </section>

    <!-- 家庭关系 -->
    <section class="form-section">
      <div class="section-header" @click="toggleSection('family')">
        <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedSections.family }"></i>
        <h4><i class="fas fa-house-user"></i> 家庭关系</h4>
      </div>
      <div v-show="expandedSections.family" class="section-body">
        <div class="field-grid">
          <div class="field-row">
            <label>关系</label>
            <input v-model="家庭关系Data.关系" type="text" placeholder="如：配偶、父母、奶奶、叔叔" />
          </div>
          <div class="field-row">
            <label>态度</label>
            <input v-model="家庭关系Data.态度" type="text" placeholder="对我的态度" />
          </div>
          <div class="field-row">
            <label>风险等级</label>
            <input v-model="家庭关系Data.风险等级" type="text" placeholder="如：低、中等、高" />
          </div>
          <div class="field-row full">
            <label>知悉内情</label>
            <textarea v-model="家庭关系Data.知悉内情" rows="2" placeholder="知道哪些内情"></textarea>
          </div>
          <div class="field-row full">
            <label>政治资源</label>
            <textarea v-model="家庭关系Data.政治资源" rows="2" placeholder="可提供的资源"></textarea>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import type { 人物 } from '../../stores/schema';
import { ArrayEditor, EnumSelect, SliderField } from '../common';

// ═══ Props & Emits ═══
const props = withDefaults(
  defineProps<{
    modelValue?: Partial<人物>;
    mode?: 'create' | 'edit';
  }>(),
  {
    mode: 'create',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Partial<人物>): void;
  (e: 'submit', value: Partial<人物>): void;
}>();

// ═══ 区块展开状态 ═══
const expandedSections = reactive({
  basic: true,
  stats: true,
  tags: true,
  official: false,
  romance: false,
  rival: false,
  backer: false,
  family: false,
});

function toggleSection(section: keyof typeof expandedSections) {
  expandedSections[section] = !expandedSections[section];
}

// ═══ 表单数据 ═══
const formData = reactive<Partial<人物>>({
  姓名: '无',
  性别: '无',
  年龄: 0,
  体系: '无',
  级别: '无',
  职务: '无',
  单位: '无',
  派系: '无',
  状态: '无',
  婚姻状态: '无',
  好感度: 50,
  信任度: 50,
  忠诚度: 0,
  当前状态: '无',
  角色标签: [],
});

// 关系子对象
const 官场关系Data = reactive({
  关系类型: '无',
  关系来源: '无',
  立场倾向: '无',
  威胁等级: '无',
  敌对原因: '无',
  已知弱点: '无',
  利用价值: '无',
  可托付事项: '无',
  近期动向: '无',
});

const 绯色关系Data = reactive({
  外貌: '无',
  性格: '无',
  身份标签: [] as string[],
  初识场景: '无',
  关系阶段: '无',
  关系性质: '无',
  情绪状态: '无',
  危险度: 0,
  通联方式: '无',
  通联详情: '无',
  经济往来: '无',
  利益纠葛: '无',
  安置情况: '无',
  近期事件: '无',
});

const 竞争关系Data = reactive({
  竞争目标: '无',
  竞争理由: '无',
  竞争态势: '无',
  对方优势: '无',
  对方软肋: '无',
  背后靠山: '无',
});

const 靠山关系Data = reactive({
  紧密度: '无',
  提携内容: '无',
  预期回报: '无',
});

const 家庭关系Data = reactive({
  关系: '无',
  知悉内情: '无',
  政治资源: '无',
  态度: '无',
  风险等级: '无',
});

// ═══ 标签建议 ═══
const tagSuggestions = [
  '绯色对象',
  '靠山',
  '竞争对手',
  '政治宿敌',
  '核心嫡系',
  '家属',
  '一把手',
  '直接上级',
  '同僚',
  '下属',
];

// ═══ 年龄红线提示 - 根据级别与年龄动态计算 ═══
// 年龄红线标准：
// 副科30岁前 | 正科35岁前
// 副处35岁前 | 正处45岁前
// 副厅45岁前 | 正厅55岁前
// 副部55岁前 | 正部65岁前
// 政治局常委67岁可留，68岁必退

function getAgeLimit(level: string): { targetAge: number; nextLevel: string } | null {
  const levelMap: Record<string, { targetAge: number; nextLevel: string }> = {
    // 科级
    副科级: { targetAge: 30, nextLevel: '正科级' },
    副科: { targetAge: 30, nextLevel: '正科' },
    正科级: { targetAge: 35, nextLevel: '副处级' },
    正科: { targetAge: 35, nextLevel: '副处' },
    // 处级
    副处级: { targetAge: 35, nextLevel: '正处级' },
    副处: { targetAge: 35, nextLevel: '正处' },
    正处级: { targetAge: 45, nextLevel: '副厅级' },
    正处: { targetAge: 45, nextLevel: '副厅' },
    // 厅级
    副厅级: { targetAge: 45, nextLevel: '正厅级' },
    副厅: { targetAge: 45, nextLevel: '正厅' },
    正厅级: { targetAge: 55, nextLevel: '副部级' },
    正厅: { targetAge: 55, nextLevel: '副部' },
    // 部级
    副部级: { targetAge: 55, nextLevel: '正部级' },
    副部: { targetAge: 55, nextLevel: '正部' },
    正部级: { targetAge: 65, nextLevel: '国家级' },
    正部: { targetAge: 65, nextLevel: '国家级' },
    // 国家级
    国家级: { targetAge: 67, nextLevel: '政治局常委' },
    政治局常委: { targetAge: 67, nextLevel: '' },
  };
  return levelMap[level] || null;
}

const ageWarningClass = computed(() => {
  const age = formData.年龄 || 0;
  const level = formData.级别 || '无';
  const limit = getAgeLimit(level);

  if (!limit) {
    // 无法识别级别，使用通用逻辑
    if (age >= 60) return 'danger';
    if (age >= 55) return 'warning';
    return '';
  }

  const diff = limit.targetAge - age;
  if (diff <= 0) return 'danger'; // 已超龄
  if (diff <= 3) return 'warning'; // 即将超龄
  if (diff <= 5) return 'caution'; // 临近红线
  return 'good'; // 年龄优势
});

const ageWarningText = computed(() => {
  const age = formData.年龄 || 0;
  const level = formData.级别 || '无';
  const limit = getAgeLimit(level);

  if (!limit) {
    // 无法识别级别，使用通用逻辑
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
  return `年龄优势明显`;
});

// ═══ 组装完整数据 ═══
const fullFormData = computed<Partial<人物>>(() => {
  const data: Partial<人物> = { ...formData };

  // 只有当关系数据有实际内容时才添加
  if (hasValidData(官场关系Data)) {
    data.官场关系 = { ...官场关系Data };
  }
  if (hasValidData(绯色关系Data)) {
    data.绯色关系 = { ...绯色关系Data };
  }
  if (hasValidData(竞争关系Data)) {
    data.竞争关系 = { ...竞争关系Data };
  }
  if (hasValidData(靠山关系Data)) {
    data.靠山关系 = { ...靠山关系Data };
  }
  if (hasValidData(家庭关系Data)) {
    data.家庭关系 = { ...家庭关系Data };
  }

  return data;
});

// 检查对象是否有有效数据（非默认值）
function hasValidData(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'number') return v > 0;
    return v && v !== '无';
  });
}

// ═══ 监听变化，同步到父组件 ═══
watch(
  fullFormData,
  newData => {
    emit('update:modelValue', newData);
  },
  { deep: true },
);

// ═══ 初始化数据 ═══
function initFormData(data: Partial<人物> | undefined) {
  if (!data) return;

  // 基础字段
  Object.keys(formData).forEach(key => {
    if (key in data) {
      (formData as any)[key] = (data as any)[key];
    }
  });

  // 关系字段
  if (data.官场关系) {
    Object.assign(官场关系Data, data.官场关系);
  }
  if (data.绯色关系) {
    Object.assign(绯色关系Data, data.绯色关系);
  }
  if (data.竞争关系) {
    Object.assign(竞争关系Data, data.竞争关系);
  }
  if (data.靠山关系) {
    Object.assign(靠山关系Data, data.靠山关系);
  }
  if (data.家庭关系) {
    Object.assign(家庭关系Data, data.家庭关系);
  }
}

// 监听 props 变化
watch(
  () => props.modelValue,
  newData => {
    initFormData(newData);
  },
  { immediate: true, deep: true },
);

// ═══ 暴露方法供父组件调用 ═══
function getData(): Partial<人物> {
  return fullFormData.value;
}

function validate(): { valid: boolean; message?: string } {
  if (!formData.姓名 || formData.姓名 === '无' || formData.姓名.trim() === '') {
    return { valid: false, message: '请输入人物姓名' };
  }
  return { valid: true };
}

function reset() {
  Object.assign(formData, {
    姓名: '无',
    性别: '无',
    年龄: 0,
    体系: '无',
    级别: '无',
    职务: '无',
    单位: '无',
    派系: '无',
    状态: '无',
    婚姻状态: '无',
    好感度: 50,
    信任度: 50,
    忠诚度: 0,
    当前状态: '无',
    角色标签: [],
  });
}

defineExpose({ getData, validate, reset });
</script>

<style lang="scss" scoped>
.character-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// ═══ 区块样式 ═══
.form-section {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  &.romance {
    .section-header h4 i {
      color: var(--color-romance-light);
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-card);
  }

  .expand-icon {
    color: var(--color-text-muted);
    font-size: 12px;
    transition: transform var(--transition-fast);

    &.expanded {
      transform: rotate(90deg);
    }
  }

  h4 {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;

    i {
      color: var(--color-gold);
      font-size: 14px;
    }
  }
}

.section-body {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

// ═══ 字段网格 ═══
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;

    .required {
      color: var(--color-danger);
    }
  }

  input[type='text'],
  input[type='number'],
  textarea {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
}

// ═══ 年龄输入 ═══
.age-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  input {
    flex: 1;
  }

  .age-warning {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    font-weight: 600;

    &.good {
      background: rgba(74, 193, 142, 0.15);
      color: var(--color-success);
    }

    &.caution {
      background: rgba(216, 166, 87, 0.15);
      color: var(--color-gold);
    }

    &.warning {
      background: rgba(255, 165, 0, 0.15);
      color: #ffa500;
    }

    &.danger {
      background: rgba(255, 107, 107, 0.15);
      color: var(--color-danger);
    }
  }
}

// ═══ 数值面板 ═══
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
</style>
