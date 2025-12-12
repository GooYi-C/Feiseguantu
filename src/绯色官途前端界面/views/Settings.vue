<template>
  <div class="settings-page">
    <header class="page-header">
      <h1 class="page-title">
        <i class="fas fa-cog"></i>
        设置
      </h1>
      <p class="page-desc">配置额外模型解析和API参数</p>
    </header>

    <div class="settings-content">
      <!-- 额外模型解析开关 -->
      <section class="settings-section">
        <div class="section-header">
          <h2><i class="fas fa-robot"></i> 额外模型解析</h2>
        </div>
        <div class="section-body">
          <div class="setting-item toggle-item">
            <div class="setting-info">
              <span class="setting-label">启用额外模型解析</span>
              <span class="setting-desc">
                开启后使用独立模型解析变量更新，关闭则随AI输出
              </span>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="mvuSettings.isEnabled"
                @change="handleToggleExtraModel"
              />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <Transition name="expand">
            <div v-if="mvuSettings.isEnabled" class="extra-model-status">
              <div class="status-item">
                <i class="fas fa-circle" :class="statusClass"></i>
                <span>{{ statusText }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- API配置 -->
      <Transition name="fade">
        <section v-if="mvuSettings.isEnabled" class="settings-section api-section">
          <div class="section-header">
            <h2><i class="fas fa-plug"></i> API配置</h2>
            <div v-if="!mvuSettings.settings.useMainApi" class="profile-controls">
              <select
                v-model="selectedProfile"
                class="profile-select"
                @change="handleProfileChange"
              >
                <option value="默认">默认配置</option>
                <option
                  v-for="profile in mvuSettings.savedProfiles"
                  :key="profile.name"
                  :value="profile.name"
                >
                  {{ profile.name }}
                </option>
              </select>
              <button class="btn-icon" title="保存配置" @click="handleSaveProfile">
                <i class="fas fa-save"></i>
              </button>
              <button
                v-if="selectedProfile !== '默认'"
                class="btn-icon btn-danger"
                title="删除配置"
                @click="handleDeleteProfile"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div class="section-body">
            <!-- 与插头相同开关 -->
            <div class="setting-item toggle-item">
              <div class="setting-info">
                <span class="setting-label">与插头相同</span>
                <span class="setting-desc">
                  使用酒馆主API进行变量解析，关闭后可配置独立API
                </span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="mvuSettings.settings.useMainApi"
                  @change="handleToggleUseMainApi"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <!-- 自定义API配置（仅在不使用主API时显示） -->
            <Transition name="expand">
              <div v-if="!mvuSettings.settings.useMainApi" class="custom-api-config">
                <!-- API地址 -->
                <div class="setting-item">
                  <label class="setting-label">
                    <i class="fas fa-link"></i>
                    API地址
                  </label>
                  <input
                    v-model="localConfig.apiUrl"
                    type="text"
                    class="setting-input"
                    placeholder="http://localhost:1234/v1"
                    @blur="handleConfigChange"
                  />
                </div>

                <!-- API密钥 -->
                <div class="setting-item">
                  <label class="setting-label">
                    <i class="fas fa-key"></i>
                    API密钥
                  </label>
                  <div class="input-with-toggle">
                    <input
                      v-model="localConfig.apiKey"
                      :type="showApiKey ? 'text' : 'password'"
                      class="setting-input"
                      placeholder="留空表示无需密钥"
                      @blur="handleConfigChange"
                    />
                    <button class="btn-toggle" @click="showApiKey = !showApiKey">
                      <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- 模型选择 -->
                <div class="setting-item">
                  <label class="setting-label">
                    <i class="fas fa-microchip"></i>
                    模型
                  </label>
                  <div class="model-selector">
                    <select
                      v-model="localConfig.modelName"
                      class="setting-select"
                      :disabled="mvuSettings.modelList.length === 0"
                      @change="handleModelSelect"
                    >
                      <option value="" disabled>
                        {{ mvuSettings.modelList.length > 0 ? '请选择模型' : '请先获取模型列表' }}
                      </option>
                      <option
                        v-for="model in mvuSettings.modelList"
                        :key="model"
                        :value="model"
                      >
                        {{ model }}
                      </option>
                    </select>
                    <button
                      class="btn-fetch"
                      :disabled="mvuSettings.isLoadingModels"
                      @click="handleFetchModels"
                    >
                      <i
                        class="fas"
                        :class="mvuSettings.isLoadingModels ? 'fa-spinner fa-spin' : 'fa-sync'"
                      ></i>
                      获取列表
                    </button>
                  </div>
                  <span v-if="mvuSettings.modelListError" class="setting-error">
                    {{ mvuSettings.modelListError }}
                  </span>
                </div>

                <!-- 高级参数 (可折叠) -->
                <div class="advanced-params">
                  <button class="btn-expand" @click="showAdvanced = !showAdvanced">
                    <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                    高级参数
                  </button>

                  <Transition name="expand">
                    <div v-if="showAdvanced" class="advanced-content">
                      <!-- 最大Token -->
                      <div class="setting-item">
                        <label class="setting-label">最大回复Token</label>
                        <input
                          v-model.number="localConfig.maxTokens"
                          type="number"
                          class="setting-input"
                          min="1"
                          step="128"
                          @blur="handleConfigChange"
                        />
                      </div>

                      <!-- 温度 -->
                      <div class="setting-item">
                        <label class="setting-label">温度 (0-2)</label>
                        <div class="slider-input">
                          <input
                            v-model.number="localConfig.temperature"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            @change="handleConfigChange"
                          />
                          <span class="slider-value">{{ localConfig.temperature.toFixed(1) }}</span>
                        </div>
                      </div>

                      <!-- Top P -->
                      <div class="setting-item">
                        <label class="setting-label">Top P (0-1)</label>
                        <div class="slider-input">
                          <input
                            v-model.number="localConfig.topP"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            @change="handleConfigChange"
                          />
                          <span class="slider-value">{{ localConfig.topP.toFixed(2) }}</span>
                        </div>
                      </div>

                      <!-- 频率惩罚 -->
                      <div class="setting-item">
                        <label class="setting-label">频率惩罚 (-2 ~ 2)</label>
                        <div class="slider-input">
                          <input
                            v-model.number="localConfig.frequencyPenalty"
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            @change="handleConfigChange"
                          />
                          <span class="slider-value">{{ localConfig.frequencyPenalty.toFixed(1) }}</span>
                        </div>
                      </div>

                      <!-- 存在惩罚 -->
                      <div class="setting-item">
                        <label class="setting-label">存在惩罚 (-2 ~ 2)</label>
                        <div class="slider-input">
                          <input
                            v-model.number="localConfig.presencePenalty"
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            @change="handleConfigChange"
                          />
                          <span class="slider-value">{{ localConfig.presencePenalty.toFixed(1) }}</span>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </Transition>
          </div>
        </section>
      </Transition>

      <!-- 世界书配置说明 -->
      <Transition name="fade">
        <section v-if="mvuSettings.isEnabled" class="settings-section info-section">
          <div class="section-header">
            <h2><i class="fas fa-book"></i> 世界书配置说明</h2>
          </div>
          <div class="section-body">
            <div class="info-box">
              <i class="fas fa-info-circle"></i>
              <div class="info-content">
                <p><strong>世界书条目自动过滤规则：</strong></p>
                <ul>
                  <li>带 <code>[mvu_update]</code> 的条目 → 仅发送给额外模型(LLM2)</li>
                  <li>带 <code>[mvu_plot]</code> 的条目 → 仅发送给主模型(LLM1)</li>
                  <li>两者都不带的条目 → 同时发送给LLM1和LLM2</li>
                </ul>
                <p class="info-hint">请按照上述规则在世界书条目名称中添加标签，系统将自动处理Prompt分发。</p>
              </div>
            </div>
          </div>
        </section>
      </Transition>

      <!-- 脚本状态提示 -->
      <div v-if="!mvuSettings.isScriptLoaded" class="script-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <span>MVU脚本未加载，请确保已启用"绯色官途mvu脚本"</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useMvuSettings } from '../stores';

const mvuSettings = useMvuSettings();

// 本地配置状态 (用于表单编辑)
const localConfig = reactive({
  apiUrl: '',
  apiKey: '',
  modelName: '',
  maxTokens: 4096,
  temperature: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  topP: 1,
});

const showApiKey = ref(false);
const showAdvanced = ref(false);
const selectedProfile = ref('默认');

// 状态计算
const statusClass = computed(() => {
  // 区分正在解析和等待确认两种状态
  if (mvuSettings.isParsingInProgress && !mvuSettings.pendingUpdate) return 'status-parsing';
  if (mvuSettings.pendingUpdate) return 'status-pending';
  if (mvuSettings.isScriptLoaded) return 'status-ready';
  return 'status-warning';
});

const statusText = computed(() => {
  // 区分正在解析和等待确认两种状态
  if (mvuSettings.isParsingInProgress && !mvuSettings.pendingUpdate) return '正在解析变量...';
  if (mvuSettings.pendingUpdate) return '等待确认更新...';
  if (mvuSettings.isScriptLoaded) return '已就绪';
  return '脚本未加载';
});

// 同步本地配置
function syncLocalConfig() {
  const config = mvuSettings.currentApiConfig;
  localConfig.apiUrl = config.apiUrl;
  localConfig.apiKey = config.apiKey;
  localConfig.modelName = config.modelName;
  localConfig.maxTokens = config.maxTokens;
  localConfig.temperature = config.temperature;
  localConfig.frequencyPenalty = config.frequencyPenalty;
  localConfig.presencePenalty = config.presencePenalty;
  localConfig.topP = config.topP;
  selectedProfile.value = mvuSettings.activeProfileName;
}

// 事件处理
function handleToggleExtraModel(event: Event) {
  const target = event.target as HTMLInputElement;
  mvuSettings.toggleExtraModelParsing(target.checked);
}

function handleToggleUseMainApi(event: Event) {
  const target = event.target as HTMLInputElement;
  mvuSettings.settings.useMainApi = target.checked;
  mvuSettings.saveSettings();
}

function handleConfigChange() {
  mvuSettings.updateApiConfig({ ...localConfig });
}

function handleModelSelect() {
  mvuSettings.selectModel(localConfig.modelName);
}

async function handleFetchModels() {
  // 先保存当前配置
  mvuSettings.updateApiConfig({
    apiUrl: localConfig.apiUrl,
    apiKey: localConfig.apiKey,
  });
  await mvuSettings.fetchModelList();
}

function handleProfileChange() {
  if (selectedProfile.value !== '默认') {
    mvuSettings.loadProfile(selectedProfile.value);
    syncLocalConfig();
  }
}

async function handleSaveProfile() {
  const name = await promptProfileName();
  if (name) {
    mvuSettings.saveProfile(name);
    selectedProfile.value = name;
    toastr.success(`配置"${name}"已保存`, '[绯色官途]');
  }
}

function handleDeleteProfile() {
  if (selectedProfile.value !== '默认') {
    mvuSettings.deleteProfile(selectedProfile.value);
    selectedProfile.value = '默认';
    syncLocalConfig();
    toastr.info('配置已删除', '[绯色官途]');
  }
}

async function promptProfileName(): Promise<string | null> {
  const result = await SillyTavern.callGenericPopup(
    '请输入配置名称:',
    SillyTavern.POPUP_TYPE.INPUT,
    selectedProfile.value === '默认' ? '' : selectedProfile.value,
    { okButton: '保存', cancelButton: '取消' },
  );
  return result as string | null;
}

// 监听设置变化
watch(
  () => mvuSettings.settings,
  () => {
    syncLocalConfig();
  },
  { deep: true },
);

onMounted(async () => {
  await mvuSettings.initialize();
  mvuSettings.checkScriptLoaded();
  syncLocalConfig();
});
</script>

<style lang="scss" scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);

  i {
    color: var(--color-gold);
  }
}

.page-desc {
  margin-top: var(--spacing-xs);
  color: var(--color-text-muted);
  font-size: 14px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

// ═══ Section ═══
.settings-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);

  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);

    i {
      color: var(--color-gold);
    }
  }
}

.section-body {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// ═══ Setting Items ═══
.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);

  &.toggle-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);

  i {
    color: var(--color-text-muted);
    font-size: 12px;
  }
}

.setting-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.setting-input,
.setting-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-gold);
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.setting-error {
  font-size: 12px;
  color: var(--color-danger);
}

// ═══ Toggle Switch ═══
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  transition: var(--transition-fast);

  &::before {
    position: absolute;
    content: '';
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: var(--color-text-muted);
    border-radius: 50%;
    transition: var(--transition-fast);
  }
}

input:checked + .toggle-slider {
  background-color: var(--color-gold);
  border-color: var(--color-gold);

  &::before {
    transform: translateX(22px);
    background-color: var(--color-bg-dark);
  }
}

// ═══ Status ═══
.extra-model-status {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-dark);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
}

.status-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 13px;
  color: var(--color-text-secondary);

  i {
    font-size: 8px;

    &.status-ready {
      color: var(--color-success);
    }

    &.status-parsing {
      color: var(--color-warning);
      animation: pulse 1s infinite;
    }

    &.status-pending {
      color: var(--color-info);
      animation: pulse 1.5s infinite;
    }

    &.status-warning {
      color: var(--color-danger);
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// ═══ Profile Controls ═══
.profile-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.profile-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 13px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-gold);
    border-color: var(--color-gold);
  }

  &.btn-danger:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
}

// ═══ Input with Toggle ═══
.input-with-toggle {
  display: flex;
  gap: var(--spacing-xs);

  .setting-input {
    flex: 1;
  }

  .btn-toggle {
    padding: var(--spacing-sm);
    background: var(--color-bg-dark);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-muted);

    &:hover {
      color: var(--color-text-primary);
    }
  }
}

// ═══ Model Selector ═══
.model-selector {
  display: flex;
  gap: var(--spacing-sm);

  .setting-select {
    flex: 1;
  }
}

.btn-fetch {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  color: var(--color-bg-dark);
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ═══ Advanced Params ═══
.advanced-params {
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}

.btn-expand {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) 0;
  color: var(--color-text-muted);
  font-size: 13px;
  transition: color var(--transition-fast);

  &:hover {
    color: var(--color-text-primary);
  }
}

.advanced-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

// ═══ Slider Input ═══
.slider-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  input[type='range'] {
    flex: 1;
    height: 4px;
    background: var(--color-bg-dark);
    border-radius: var(--radius-full);
    appearance: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      background: var(--color-gold);
      border-radius: 50%;
      cursor: pointer;
    }
  }
}

.slider-value {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--color-text-secondary);
}

// ═══ Info Section ═══
.info-section {
  .section-body {
    padding: var(--spacing-md);
  }
}

.info-box {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-md);
  background: rgba(var(--color-info-rgb, 59, 130, 246), 0.1);
  border: 1px solid rgba(var(--color-info-rgb, 59, 130, 246), 0.3);
  border-radius: var(--radius-md);

  > i {
    color: var(--color-info, #3b82f6);
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .info-content {
    flex: 1;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-secondary);

    p {
      margin: 0 0 var(--spacing-xs) 0;
    }

    ul {
      margin: var(--spacing-xs) 0;
      padding-left: var(--spacing-lg);

      li {
        margin-bottom: var(--spacing-xs);

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    code {
      background: var(--color-bg-tertiary);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--color-gold);
    }

    .info-hint {
      margin-top: var(--spacing-sm);
      font-size: 12px;
      color: var(--color-text-muted);
    }
  }
}

.btn-expand-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-dark);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 12px;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

// ═══ Warning ═══
.script-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-danger);
  font-size: 13px;

  i {
    font-size: 16px;
  }
}

// ═══ Transitions ═══
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}
</style>

