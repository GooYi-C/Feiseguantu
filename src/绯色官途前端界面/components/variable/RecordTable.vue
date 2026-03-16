<template>
  <div class="record-table">
    <!-- 工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <div class="search-box" v-if="searchable">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" />
      </div>
      <div class="toolbar-actions">
        <button v-if="addable" class="btn-add" @click="handleAdd">
          <i class="fas fa-plus"></i>
          {{ addText }}
        </button>
      </div>
    </div>

    <!-- 表格列表 -->
    <div class="record-list">
      <TransitionGroup name="record">
        <div
          v-for="[key, item] in paginatedItems"
          :key="key"
          class="record-item"
          :class="{ expanded: expandedKeys.has(key) }"
        >
          <!-- 记录头部 -->
          <div class="record-header" @click="toggleRecord(key)">
            <i class="fas fa-chevron-right expand-icon" :class="{ expanded: expandedKeys.has(key) }"></i>
            <div class="record-info">
              <span class="record-name">{{ key }}</span>
              <span class="record-meta">
                <slot name="meta" :item="item" :key="key">
                  {{ getRecordMeta(item) }}
                </slot>
              </span>
            </div>
            <div class="record-actions" @click.stop>
              <button v-if="deletable" class="btn-delete" title="删除" @click="handleDelete(key)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- 记录详情 -->
          <Transition name="expand">
            <div v-show="expandedKeys.has(key)" class="record-body">
              <slot name="item" :item="item" :key="key" :update="(updates: any) => updateItem(key, updates)">
                <!-- 默认字段渲染 -->
                <div class="field-grid">
                  <template v-for="(value, fieldKey) in item" :key="fieldKey">
                    <div class="field-row" :class="{ full: isLongField(fieldKey as string, value) }">
                      <label>{{ fieldKey }}</label>
                      <template v-if="isArrayField(value)">
                        <div class="array-value">
                          <span v-for="(v, i) in value" :key="i" class="array-item">{{ v }}</span>
                        </div>
                      </template>
                      <template v-else-if="isObjectField(value)">
                        <pre class="object-value">{{ JSON.stringify(value, null, 2) }}</pre>
                      </template>
                      <template v-else-if="isNumberField(value)">
                        <input
                          type="number"
                          :value="value"
                          @input="
                            updateItemField(key, fieldKey as string, ($event.target as HTMLInputElement).valueAsNumber)
                          "
                        />
                      </template>
                      <template v-else-if="isBooleanField(value)">
                        <label class="checkbox-wrapper">
                          <input
                            type="checkbox"
                            :checked="value"
                            @change="
                              updateItemField(key, fieldKey as string, ($event.target as HTMLInputElement).checked)
                            "
                          />
                          <span>{{ value ? '是' : '否' }}</span>
                        </label>
                      </template>
                      <template v-else-if="isLongTextField(fieldKey as string, value)">
                        <textarea
                          :value="value"
                          rows="2"
                          @input="
                            updateItemField(key, fieldKey as string, ($event.target as HTMLTextAreaElement).value)
                          "
                        ></textarea>
                      </template>
                      <template v-else>
                        <input
                          type="text"
                          :value="value"
                          @input="updateItemField(key, fieldKey as string, ($event.target as HTMLInputElement).value)"
                        />
                      </template>
                    </div>
                  </template>
                </div>
              </slot>
            </div>
          </Transition>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>{{ emptyText }}</p>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';

// ═══ Props ═══
const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>;
    pageSize?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
    addable?: boolean;
    addText?: string;
    deletable?: boolean;
    emptyText?: string;
    showToolbar?: boolean;
    metaFields?: string[]; // 在 meta 位置显示的字段
    longFields?: string[]; // 被视为长文本的字段
  }>(),
  {
    pageSize: 10,
    searchable: true,
    searchPlaceholder: '搜索...',
    addable: true,
    addText: '新增',
    deletable: true,
    emptyText: '暂无数据',
    showToolbar: true,
    metaFields: () => [],
    longFields: () => ['描述', '内容', '备注', '详情', '说明'],
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void;
  (e: 'add'): void;
  (e: 'delete', key: string): void;
  (e: 'update', key: string, updates: any): void;
}>();

// ═══ State ═══
const searchQuery = ref('');
const currentPage = ref(1);
const expandedKeys = reactive(new Set<string>());

// ═══ Computed ═══
const allItems = computed(() => Object.entries(props.modelValue));

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return allItems.value;
  }
  const query = searchQuery.value.toLowerCase();
  return allItems.value.filter(([key, item]) => {
    // 搜索键名
    if (key.toLowerCase().includes(query)) return true;
    // 搜索值
    return Object.values(item).some(v => {
      if (typeof v === 'string') return v.toLowerCase().includes(query);
      if (typeof v === 'number') return String(v).includes(query);
      return false;
    });
  });
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / props.pageSize));

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  return filteredItems.value.slice(start, start + props.pageSize);
});

// ═══ 搜索变化时重置页码 ═══
watch(searchQuery, () => {
  currentPage.value = 1;
});

// ═══ Methods ═══
function toggleRecord(key: string) {
  if (expandedKeys.has(key)) {
    expandedKeys.delete(key);
  } else {
    expandedKeys.add(key);
  }
}

function getRecordMeta(item: any): string {
  if (props.metaFields.length > 0) {
    return props.metaFields
      .map(f => item[f])
      .filter(v => v && v !== '无')
      .join(' · ');
  }
  // 默认取前两个非空字段
  const values = Object.entries(item)
    .filter(([, v]) => v && v !== '无' && typeof v !== 'object')
    .slice(0, 2)
    .map(([, v]) => v);
  return values.join(' · ');
}

function handleAdd() {
  emit('add');
}

function handleDelete(key: string) {
  if (confirm(`确定要删除「${key}」吗？`)) {
    const newValue = { ...props.modelValue };
    delete newValue[key];
    emit('update:modelValue', newValue);
    emit('delete', key);
    expandedKeys.delete(key);
  }
}

function updateItem(key: string, updates: any) {
  const newValue = {
    ...props.modelValue,
    [key]: { ...props.modelValue[key], ...updates },
  };
  emit('update:modelValue', newValue);
  emit('update', key, updates);
}

function updateItemField(key: string, fieldKey: string, value: any) {
  updateItem(key, { [fieldKey]: value });
}

// 类型判断
function isArrayField(value: any): value is any[] {
  return Array.isArray(value);
}

function isObjectField(value: any): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumberField(value: any): value is number {
  return typeof value === 'number';
}

function isBooleanField(value: any): value is boolean {
  return typeof value === 'boolean';
}

function isLongTextField(key: string, value: any): boolean {
  if (typeof value !== 'string') return false;
  return props.longFields.some(f => key.includes(f)) || value.length > 50;
}

function isLongField(key: string, value: any): boolean {
  return isLongTextField(key, value) || isArrayField(value) || isObjectField(value);
}

// 暴露方法
function expandAll() {
  filteredItems.value.forEach(([key]) => expandedKeys.add(key));
}

function collapseAll() {
  expandedKeys.clear();
}

defineExpose({ expandAll, collapseAll });
</script>

<style lang="scss" scoped>
.record-table {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// ═══ 工具栏 ═══
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 150px;
  max-width: 250px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  i {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  input {
    flex: 1;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 12px;

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:hover {
    filter: brightness(1.1);
  }
}

// ═══ 记录列表 ═══
.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.record-item {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: all var(--transition-fast);

  &.expanded {
    background: var(--color-bg-card);
    box-shadow: var(--shadow-sm);
  }
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-card);
  }

  .expand-icon {
    font-size: 10px;
    color: var(--color-text-muted);
    transition: transform var(--transition-fast);

    &.expanded {
      transform: rotate(90deg);
    }
  }
}

.record-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);

  .record-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .record-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.record-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-text-muted);

  &:hover {
    background: rgba(255, 107, 107, 0.1);
    color: var(--color-danger);
  }
}

// ═══ 记录内容 ═══
.record-body {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm) var(--spacing-md);

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &.full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 10px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type='text'],
  input[type='number'],
  textarea {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 12px;

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }
  }

  textarea {
    resize: vertical;
    min-height: 50px;
  }
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;

  input[type='checkbox'] {
    accent-color: var(--color-gold);
  }
}

.array-value {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: var(--spacing-xs);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  min-height: 28px;
}

.array-item {
  padding: 2px 6px;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--color-text-secondary);
}

.object-value {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
  overflow-x: auto;
  max-height: 100px;
}

// ═══ 空状态 ═══
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  color: var(--color-text-muted);

  i {
    font-size: 32px;
  }

  p {
    font-size: 13px;
  }
}

// ═══ 分页 ═══
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);

  button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 11px;
    color: var(--color-text-secondary);

    &:hover:not(:disabled) {
      background: var(--color-bg-card);
      color: var(--color-text-primary);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

// ═══ 过渡动画 ═══
.record-enter-active,
.record-leave-active {
  transition: all 0.2s ease;
}

.record-enter-from,
.record-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.record-move {
  transition: transform 0.2s ease;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
