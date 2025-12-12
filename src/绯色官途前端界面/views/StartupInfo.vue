<template>
  <div class="startup-info-page">
    <!-- 开局说明区域 -->
    <section class="intro-section">
      <div class="intro-header">
        <div class="seal-icon">
          <i class="fas fa-stamp"></i>
        </div>
        <h2>开局设置</h2>
        <p class="intro-subtitle">绯色官途 · 权力游戏从此开始</p>
      </div>
      <div class="intro-desc">
        <p>在这里设定你的开局背景，包括个人履历、起点地区、初始人脉等关键信息。</p>
        <p>一个精心设计的开局，将为你的仕途之路奠定坚实基础。</p>
      </div>
    </section>

    <!-- 富文本编辑区域 -->
    <section class="editor-section">
      <div class="section-header">
        <h3><i class="fas fa-edit"></i> 开局背景描述</h3>
        <span class="hint-text">描述你的角色背景、起点设定、初始剧情等</span>
      </div>
      <div class="editor-container">
        <textarea
          v-model="startupContent"
          class="rich-editor"
          placeholder="在此输入你的开局背景设定...

例如：
• 你是某省某市的基层公务员，刚从名牌大学毕业进入体制
• 家庭背景：父亲是退休的副处级干部，母亲是教师
• 起点：市委办公室科员，正在为提拔副科级努力
• 初始人脉：大学同学在省委办工作，表姐夫是区里的副区长..."
          rows="12"
          @input="onContentChange"
        ></textarea>
        <div class="editor-footer">
          <span class="char-count">{{ startupContent.length }} 字</span>
        </div>
      </div>
    </section>

    <!-- 操作按钮区域 -->
    <section class="action-section">
      <button class="action-btn generate-btn" @click="handleGenerateVariables">
        <i class="fas fa-magic"></i>
        <span>生成开局变量</span>
        <small>根据背景描述自动生成初始变量</small>
      </button>
      <button class="action-btn confirm-btn" @click="handleConfirmStartup">
        <i class="fas fa-check-circle"></i>
        <span>确认当前开局</span>
        <small>锁定设置并开始游戏</small>
      </button>
    </section>

    <!-- 提示信息 -->
    <section class="tips-section">
      <div class="tip-card">
        <i class="fas fa-lightbulb"></i>
        <div class="tip-content">
          <strong>温馨提示</strong>
          <p>开局确认后，游戏将正式开始。建议在确认前仔细检查全量变量页面，确保所有初始设定符合预期。</p>
        </div>
      </div>
    </section>

    <!-- 生成开局变量确认弹窗 -->
    <ConfirmDialog
      v-model="showGenerateConfirm"
      title="生成开局变量"
      icon="fas fa-magic"
      message="确定要根据开局背景描述生成初始变量吗？"
      description="这将调用AI分析您的开局描述，并生成相应的初始变量设置。"
      confirm-text="开始生成"
      confirm-icon="fas fa-magic"
      @confirm="confirmGenerateVariables"
    />

    <!-- 确认开局弹窗 -->
    <ConfirmDialog
      v-model="showStartupConfirm"
      title="确认开局"
      icon="fas fa-check-circle"
      message="确定要锁定当前设置并开始游戏吗？"
      description="确认后将发送开局消息，AI将根据当前变量快照生成开局剧情。"
      confirm-text="确认开局"
      confirm-icon="fas fa-play"
      :danger="false"
      @confirm="confirmStartup"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ConfirmDialog } from '../components/common';
import { useMvuSettings } from '../stores';

const mvuSettings = useMvuSettings();

// 开局内容
const startupContent = ref('');

// 确认弹窗状态
const showGenerateConfirm = ref(false);
const showStartupConfirm = ref(false);

// ═══ 初始化时从脚本读取保存的描述 ═══
onMounted(() => {
  const api = (window.parent as any)?.ScarletMvu;
  if (api?.getLastStartupDescription) {
    const savedDescription = api.getLastStartupDescription();
    if (savedDescription) {
      console.info('[绯色官途] 从脚本恢复开局描述');
      startupContent.value = savedDescription;
    }
  }
});

// 内容变化处理 - 自动保存到脚本
function onContentChange() {
  const api = (window.parent as any)?.ScarletMvu;
  if (api?.setLastStartupDescription) {
    api.setLastStartupDescription(startupContent.value);
  }
}

// ═══ 生成开局变量 ═══
function handleGenerateVariables() {
  // 检查是否有开局描述
  if (!startupContent.value.trim()) {
    toastr.warning('请先输入开局背景描述', '[绯色官途]');
    return;
  }
  // 显示确认弹窗
  showGenerateConfirm.value = true;
}

// 确认生成开局变量
async function confirmGenerateVariables() {
  showGenerateConfirm.value = false;
  try {
    console.info('[绯色官途] 开始生成开局变量...');
    await mvuSettings.generateStartupVariables(startupContent.value);
    // 成功后会弹出变量更新确认对话框（由MVU系统处理）
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    toastr.error(`生成失败: ${errorMsg}`, '[绯色官途]');
    console.error('[绯色官途] 生成开局变量失败:', error);
  }
}

// ═══ 确认当前开局 ═══
function handleConfirmStartup() {
  // 显示确认弹窗
  showStartupConfirm.value = true;
}

// 确认开局
async function confirmStartup() {
  showStartupConfirm.value = false;
  try {
    console.info('[绯色官途] 确认开局，发送开局消息...');
    await mvuSettings.confirmStartup();
    // 成功后会自动发送消息并触发AI回复
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    toastr.error(`确认开局失败: ${errorMsg}`, '[绯色官途]');
    console.error('[绯色官途] 确认开局失败:', error);
  }
}
</script>

<style lang="scss" scoped>
.startup-info-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

// ═══ 介绍区域 ═══
.intro-section {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.08) 0%, rgba(216, 166, 87, 0.05) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.intro-header {
  margin-bottom: var(--spacing-lg);
}

.seal-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-romance) 0%, #ff6b8a 100%);
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(196, 30, 58, 0.3);

  i {
    font-size: 32px;
    color: white;
  }
}

.intro-header h2 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  background: var(--color-romance-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 var(--spacing-xs);
}

.intro-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.intro-desc {
  p {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.8;
    margin: 0;

    & + p {
      margin-top: var(--spacing-xs);
    }
  }
}

// ═══ 编辑器区域 ═══
.editor-section {
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

  h3 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;

    i {
      color: var(--color-gold);
    }
  }

  .hint-text {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

.editor-container {
  padding: var(--spacing-md);
}

.rich-editor {
  width: 100%;
  min-height: 280px;
  padding: var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.8;
  resize: vertical;
  transition: border-color var(--transition-fast);

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.7;
  }

  &:focus {
    outline: none;
    border-color: var(--color-gold);
    box-shadow: 0 0 0 3px rgba(216, 166, 87, 0.1);
  }
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-sm);

  .char-count {
    font-size: 12px;
    color: var(--color-text-muted);
  }
}

// ═══ 操作按钮区域 ═══
.action-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl) var(--spacing-lg);
  border-radius: var(--radius-lg);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-normal);

  i {
    font-size: 28px;
    margin-bottom: var(--spacing-xs);
  }

  span {
    font-size: 16px;
    font-weight: 600;
  }

  small {
    font-size: 12px;
    opacity: 0.8;
  }

  &.generate-btn {
    background: linear-gradient(135deg, rgba(216, 166, 87, 0.15) 0%, rgba(216, 166, 87, 0.05) 100%);
    border-color: var(--color-gold-dim);
    color: var(--color-gold);

    &:hover {
      background: linear-gradient(135deg, rgba(216, 166, 87, 0.25) 0%, rgba(216, 166, 87, 0.1) 100%);
      border-color: var(--color-gold);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(216, 166, 87, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &.confirm-btn {
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.15) 0%, rgba(255, 77, 109, 0.05) 100%);
    border-color: var(--color-romance);
    color: var(--color-romance-light);

    &:hover {
      background: linear-gradient(135deg, rgba(196, 30, 58, 0.25) 0%, rgba(255, 77, 109, 0.1) 100%);
      border-color: var(--color-romance-light);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(196, 30, 58, 0.2);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// ═══ 提示区域 ═══
.tips-section {
  .tip-card {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-md) var(--spacing-lg);
    background: rgba(122, 162, 247, 0.08);
    border: 1px solid rgba(122, 162, 247, 0.2);
    border-radius: var(--radius-md);

    > i {
      font-size: 20px;
      color: var(--color-info);
      margin-top: 2px;
    }

    .tip-content {
      strong {
        display: block;
        font-size: 13px;
        color: var(--color-info);
        margin-bottom: var(--spacing-xs);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--color-text-secondary);
        line-height: 1.6;
      }
    }
  }
}

// ═══ 响应式 ═══
@media (max-width: 600px) {
  .action-section {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>
