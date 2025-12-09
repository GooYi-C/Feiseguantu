<template>
  <div class="variables-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" type="text" placeholder="搜索字段名或内容..." />
      </div>
      <div class="toolbar-actions">
        <label class="toggle-filled">
          <input type="checkbox" v-model="onlyFilled" />
          <span>仅显示已填写</span>
        </label>
        <button class="action-btn" @click="expandAll">
          <i class="fas fa-expand"></i> 全部展开
        </button>
        <button class="action-btn" @click="collapseAll">
          <i class="fas fa-compress"></i> 全部折叠
        </button>
        <button class="save-btn" @click="saveAll" :disabled="!isDirty">
          <i class="fas fa-save"></i> 保存全部
        </button>
      </div>
    </div>

    <!-- 分区列表 -->
    <div class="sections-list">
      <!-- 时空舆情 -->
      <section class="var-section" :class="{ collapsed: !expanded.时空舆情 }">
        <div class="section-header" @click="toggleSection('时空舆情')">
          <i class="fas fa-chevron-right expand-icon"></i>
          <h3><i class="fas fa-globe"></i> 时空舆情</h3>
          <span class="field-count">{{ countFilled(data.时空舆情) }} / {{ countTotal(data.时空舆情) }}</span>
        </div>
        <div class="section-body" v-show="expanded.时空舆情">
          <div class="field-group">
            <div class="field-row">
              <label>当前日期 · 年</label>
              <input type="number" v-model.number="data.时空舆情.当前日期.年" min="2000" max="2100" />
            </div>
            <div class="field-row">
              <label>当前日期 · 月</label>
              <input type="number" v-model.number="data.时空舆情.当前日期.月" min="1" max="12" />
            </div>
            <div class="field-row">
              <label>当前日期 · 日</label>
              <input type="number" v-model.number="data.时空舆情.当前日期.日" min="1" max="31" />
            </div>
            <div class="field-row">
              <label>当前日期 · 星期</label>
              <select v-model="data.时空舆情.当前日期.星期">
                <option v-for="d in weekdays" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="field-row">
              <label>当前时间</label>
              <input type="text" v-model="data.时空舆情.当前时间" placeholder="HH:MM 或 无" />
            </div>
            <div class="field-row">
              <label>当前地点</label>
              <input type="text" v-model="data.时空舆情.当前地点" />
            </div>
            <div class="field-row">
              <label>政治气候</label>
              <span class="computed-value">{{ data.时空舆情.政治气候 }}</span>
            </div>
            <div class="field-row full">
              <label>重大事件</label>
              <input type="text" v-model="data.时空舆情.重大事件" />
            </div>
            <div class="field-row full">
              <label>中央动态</label>
              <textarea v-model="data.时空舆情.中央动态" rows="2"></textarea>
            </div>
            <div class="field-row full">
              <label>省内风向</label>
              <textarea v-model="data.时空舆情.省内风向" rows="2"></textarea>
            </div>
            <div class="field-row full">
              <label>本地新闻</label>
              <textarea v-model="data.时空舆情.本地新闻" rows="2"></textarea>
            </div>
            <div class="field-row full">
              <label>圈内传闻</label>
              <textarea v-model="data.时空舆情.圈内传闻" rows="2"></textarea>
            </div>
            <div class="field-row full">
              <label>个人风评</label>
              <textarea v-model="data.时空舆情.个人风评" rows="2"></textarea>
            </div>
          </div>
          <button class="section-save" @click="saveSection('时空舆情')">
            <i class="fas fa-check"></i> 保存本分区
          </button>
        </div>
      </section>

      <!-- 当前场景 -->
      <section class="var-section" :class="{ collapsed: !expanded.当前场景 }">
        <div class="section-header" @click="toggleSection('当前场景')">
          <i class="fas fa-chevron-right expand-icon"></i>
          <h3><i class="fas fa-map-location-dot"></i> 当前场景</h3>
          <span class="field-count">{{ countFilled(data.当前场景) }} / {{ countTotal(data.当前场景) }}</span>
        </div>
        <div class="section-body" v-show="expanded.当前场景">
          <div class="field-group">
            <div class="field-row">
              <label>场景类型</label>
              <input type="text" v-model="data.当前场景.场景类型" />
            </div>
            <div class="field-row full">
              <label>场景速写</label>
              <textarea v-model="data.当前场景.场景速写" rows="3"></textarea>
            </div>
            <div class="field-row">
              <label>气氛基调</label>
              <input type="text" v-model="data.当前场景.气氛基调" />
            </div>
            <div class="field-row full">
              <label>在场人物</label>
              <div class="array-editor">
                <span v-for="(p, i) in data.当前场景.在场人物" :key="i" class="array-item">
                  {{ p }}
                  <button class="remove-item" @click="removeArrayItem(data.当前场景.在场人物, i)">×</button>
                </span>
                <input
                  type="text"
                  class="add-input"
                  placeholder="添加人物..."
                  @keyup.enter="addArrayItem(data.当前场景.在场人物, $event)"
                />
              </div>
            </div>
            <div class="field-row full">
              <label>潜在议题</label>
              <textarea v-model="data.当前场景.潜在议题" rows="2"></textarea>
            </div>
          </div>
          <button class="section-save" @click="saveSection('当前场景')">
            <i class="fas fa-check"></i> 保存本分区
          </button>
        </div>
      </section>

      <!-- 人物库 -->
      <section class="var-section" :class="{ collapsed: !expanded.人物库 }">
        <div class="section-header" @click="toggleSection('人物库')">
          <i class="fas fa-chevron-right expand-icon"></i>
          <h3><i class="fas fa-users"></i> 人物库</h3>
          <span class="field-count">{{ Object.keys(data.人物库).length }} 人</span>
        </div>
        <div class="section-body" v-show="expanded.人物库">
          <div class="record-list">
            <div v-for="(char, name) in paginatedChars" :key="name" class="record-item">
              <div class="record-header" @click="toggleRecord('人物库', name as string)">
                <span class="record-name">{{ name }}</span>
                <span class="record-meta">{{ char.职务 }} · {{ char.级别 }}</span>
                <i class="fas fa-chevron-down record-expand"></i>
              </div>
              <div class="record-body" v-show="expandedRecords['人物库']?.[name as string]">
                <div class="field-row">
                  <label>姓名</label>
                  <input type="text" v-model="char.姓名" />
                </div>
                <div class="field-row">
                  <label>性别</label>
                  <select v-model="char.性别">
                    <option value="无">无</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div class="field-row">
                  <label>年龄</label>
                  <input type="number" v-model.number="char.年龄" min="0" max="120" />
                </div>
                <div class="field-row">
                  <label>体系</label>
                  <select v-model="char.体系">
                    <option v-for="t in ['无', '党政', '军队', '事业', '国企']" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="field-row">
                  <label>级别</label>
                  <input type="text" v-model="char.级别" />
                </div>
                <div class="field-row">
                  <label>职务</label>
                  <input type="text" v-model="char.职务" />
                </div>
                <div class="field-row">
                  <label>好感度</label>
                  <div class="slider-field">
                    <input type="range" v-model.number="char.好感度" min="0" max="100" />
                    <input type="number" v-model.number="char.好感度" min="0" max="100" class="num-input" />
                  </div>
                </div>
                <div class="field-row">
                  <label>信任度</label>
                  <div class="slider-field">
                    <input type="range" v-model.number="char.信任度" min="0" max="100" />
                    <input type="number" v-model.number="char.信任度" min="0" max="100" class="num-input" />
                  </div>
                </div>
                <div class="record-actions">
                  <button class="delete-record" @click="deleteRecord('人物库', name as string)">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="pagination" v-if="charPages > 1">
            <button :disabled="charPage === 1" @click="charPage--">上一页</button>
            <span>{{ charPage }} / {{ charPages }}</span>
            <button :disabled="charPage === charPages" @click="charPage++">下一页</button>
          </div>
          <button class="add-record" @click="addCharacter">
            <i class="fas fa-plus"></i> 新增人物
          </button>
        </div>
      </section>

      <!-- 其他分区简化处理... -->
      <section v-for="sectionKey in remainingSections" :key="sectionKey" class="var-section" :class="{ collapsed: !expanded[sectionKey] }">
        <div class="section-header" @click="toggleSection(sectionKey)">
          <i class="fas fa-chevron-right expand-icon"></i>
          <h3><i :class="sectionIcon(sectionKey)"></i> {{ sectionKey }}</h3>
          <span class="field-count">{{ countFilled((data as any)[sectionKey]) }} / {{ countTotal((data as any)[sectionKey]) }}</span>
        </div>
        <div class="section-body" v-show="expanded[sectionKey]">
          <pre class="json-preview">{{ JSON.stringify((data as any)[sectionKey], null, 2) }}</pre>
          <p class="section-note">完整编辑功能开发中，可在 JSON 中查看当前数据。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useGameData } from '../stores/useGameData';
import { klona } from 'klona';

const gameData = useGameData();

// 本地编辑副本
const data = reactive(klona(gameData.rawData));

// 同步原始数据变化
watch(
  () => gameData.rawData,
  newData => {
    if (!gameData.isDirty) {
      Object.assign(data, klona(newData));
    }
  },
  { deep: true },
);

// 标记数据是否改变
const isDirty = computed(() => JSON.stringify(data) !== JSON.stringify(gameData.rawData));

// 搜索和过滤
const searchQuery = ref('');
const onlyFilled = ref(false);

// 展开状态
const expanded = reactive<Record<string, boolean>>({
  时空舆情: true,
  当前场景: false,
  人物库: false,
  关系索引: false,
  个人档案: false,
  派系图谱: false,
  绯色履历: false,
  个人资产: false,
  暗账: false,
  机遇与危机: false,
});

const expandedRecords = reactive<Record<string, Record<string, boolean>>>({});

// 人物库分页
const charPage = ref(1);
const charPageSize = 10;
const charPages = computed(() => Math.ceil(Object.keys(data.人物库).length / charPageSize));
const paginatedChars = computed(() => {
  const entries = Object.entries(data.人物库);
  const start = (charPage.value - 1) * charPageSize;
  return Object.fromEntries(entries.slice(start, start + charPageSize));
});

const weekdays = ['无', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const remainingSections = ['关系索引', '个人档案', '派系图谱', '绯色履历', '个人资产', '暗账', '机遇与危机'];

function toggleSection(key: string) {
  expanded[key] = !expanded[key];
}

function toggleRecord(section: string, key: string) {
  if (!expandedRecords[section]) expandedRecords[section] = {};
  expandedRecords[section][key] = !expandedRecords[section][key];
}

function expandAll() {
  Object.keys(expanded).forEach(k => (expanded[k] = true));
}

function collapseAll() {
  Object.keys(expanded).forEach(k => (expanded[k] = false));
}

function countFilled(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return obj && obj !== '无' ? 1 : 0;
  return Object.values(obj).reduce((acc: number, v) => acc + countFilled(v), 0);
}

function countTotal(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 1;
  return Object.values(obj).reduce((acc: number, v) => acc + countTotal(v), 0);
}

function sectionIcon(key: string) {
  const icons: Record<string, string> = {
    关系索引: 'fas fa-diagram-project',
    个人档案: 'fas fa-id-card',
    派系图谱: 'fas fa-sitemap',
    绯色履历: 'fas fa-heart',
    个人资产: 'fas fa-coins',
    暗账: 'fas fa-user-secret',
    机遇与危机: 'fas fa-scale-balanced',
  };
  return icons[key] || 'fas fa-folder';
}

function addArrayItem(arr: string[], e: Event) {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim();
  if (value && !arr.includes(value)) {
    arr.push(value);
    input.value = '';
  }
}

function removeArrayItem(arr: string[], index: number) {
  arr.splice(index, 1);
}

function addCharacter() {
  const name = prompt('请输入新人物姓名：');
  if (!name) return;
  if (data.人物库[name]) {
    toastr.warning('人物已存在');
    return;
  }
  data.人物库[name] = {
    姓名: name,
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
  };
  if (!expandedRecords['人物库']) expandedRecords['人物库'] = {};
  expandedRecords['人物库'][name] = true;
  toastr.success(`人物「${name}」已添加`);
}

function deleteRecord(section: string, key: string) {
  if (!confirm(`确定删除「${key}」吗？`)) return;
  delete (data as any)[section][key];
  toastr.info(`已删除「${key}」`);
}

async function saveSection(section: string) {
  try {
    await gameData.saveData({ [section]: klona((data as any)[section]) } as any);
    toastr.success(`${section} 已保存`);
  } catch (e) {
    toastr.error('保存失败');
  }
}

async function saveAll() {
  try {
    await gameData.saveData(klona(data));
    toastr.success('全部保存成功');
  } catch (e) {
    toastr.error('保存失败');
  }
}
</script>

<style lang="scss" scoped>
.variables-page {
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
  justify-content: space-between;
}

.search-box {
  flex: 1;
  min-width: 200px;
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

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.toggle-filled {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;

  input {
    accent-color: var(--color-gold);
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
}

// ═══ 分区列表 ═══
.sections-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.var-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
  }

  .expand-icon {
    color: var(--color-text-muted);
    transition: transform var(--transition-fast);

    .var-section:not(.collapsed) & {
      transform: rotate(90deg);
    }
  }

  h3 {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      color: var(--color-gold);
    }
  }

  .field-count {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

.section-body {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

// ═══ 字段组 ═══
.field-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 600px) {
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
  }

  input[type='text'],
  input[type='number'],
  textarea,
  select {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .computed-value {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--color-gold);
  }
}

.slider-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  input[type='range'] {
    flex: 1;
    accent-color: var(--color-gold);
  }

  .num-input {
    width: 60px;
  }
}

.array-editor {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-height: 40px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-secondary);

  .remove-item {
    color: var(--color-text-muted);
    font-size: 14px;

    &:hover {
      color: var(--color-danger);
    }
  }
}

.add-input {
  flex: 1;
  min-width: 100px;
  padding: 4px;
  font-size: 12px;
}

.section-save {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-success);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: white;

  &:hover {
    filter: brightness(1.1);
  }
}

// ═══ Record 列表 ═══
.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-card);
  }

  .record-name {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .record-meta {
    flex: 1;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .record-expand {
    color: var(--color-text-muted);
    transition: transform var(--transition-fast);
  }
}

.record-body {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.record-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}

.delete-record {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-danger);

  &:hover {
    background: rgba(255, 107, 107, 0.1);
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);

  button {
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 12px;
    color: var(--color-text-secondary);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: var(--color-bg-card);
    }
  }

  span {
    font-size: 13px;
    color: var(--color-text-muted);
  }
}

.add-record {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:hover {
    filter: brightness(1.1);
  }
}

.json-preview {
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow-x: auto;
  max-height: 300px;
}

.section-note {
  margin-top: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}
</style>

