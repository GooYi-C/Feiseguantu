# 绯色官途 MVU集成技术文档

## 概述

本文档描述了绯色官途前端界面与MVU（MagVarUpdate）变量框架的集成实现，包括额外模型解析功能、设置页面、用户确认弹窗等功能模块。

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    绯色官途前端界面                               │
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │  Settings    │    App.vue   │ MvuConfirm   │                 │
│  │  设置页面     │  顶部状态栏   │  Dialog      │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────┐                │
│  │              useMvuSettings Store           │                │
│  │         (Pinia状态管理 + 事件通信)           │                │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│                      事件通信层                                   │
│         (eventOn/eventEmit - SCARLET_MVU_EVENTS)                │
├─────────────────────────────────────────────────────────────────┤
│                   绯色官途MVU脚本                                 │
│  ┌──────────────┬──────────────┬──────────────┐                 │
│  │  设置管理     │  解析引擎     │  MVU接管     │                 │
│  │  API配置     │  重试/中断    │  流式修复    │                 │
│  └──────────────┴──────────────┴──────────────┘                 │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────┐                │
│  │              全局API (ScarletMvu)           │                │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│                    MVU变量框架 (Mvu)                              │
└─────────────────────────────────────────────────────────────────┘
```

### 文件结构

```
src/
├── 绯色官途mvu脚本/
│   └── index.ts              # MVU辅助脚本主文件
│
└── 绯色官途前端界面/
    ├── app.vue               # 主应用组件（含MVU按钮）
    ├── router.ts             # 路由配置（含Settings路由）
    │
    ├── stores/
    │   ├── index.ts          # Store导出
    │   └── useMvuSettings.ts # MVU设置Store
    │
    ├── views/
    │   └── Settings.vue      # 设置页面
    │
    ├── components/
    │   └── mvu/
    │       ├── index.ts
    │       └── MvuConfirmDialog.vue  # 确认弹窗组件
    │
    └── doc/
        └── MVU集成技术文档.md # 本文档
```

## 核心功能

### 1. 设置优先级接管

当用户在本项目配置了API参数时，这些设置会覆盖MVU脚本中的原生配置：

```typescript
// 绯色官途mvu脚本/index.ts
function overrideMvuSettings(): void {
  if (!settings.enableExtraModelParsing) return;
  
  const mvuSettings = SillyTavern.extensionSettings.mvu_settings;
  const config = settings.apiConfig;

  // 强制设置为"额外模型解析"模式
  mvuSettings.更新方式 = '额外模型解析';
  mvuSettings.额外模型解析配置.模型来源 = '自定义';
  mvuSettings.额外模型解析配置.api地址 = config.apiUrl;
  // ... 其他配置
}
```

### 2. 模型选择功能

移除了手动输入模型名称，改为通过API获取模型列表：

```typescript
// 获取模型列表
async function fetchModelList(apiUrl: string, apiKey: string): Promise<string[]> {
  const url = apiUrl.replace(/\/+$/, '') + '/models';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
    },
  });
  // 支持OpenAI格式和其他格式
  // ...
}
```

### 3. 解析进度反馈

点击重试解析按钮后显示旋转动画和进度提示：

```vue
<!-- app.vue -->
<button
  class="mvu-retry-btn"
  :class="{ parsing: mvuSettings.isParsingInProgress }"
  @click="handleMvuRetry"
>
  <i class="fas fa-rotate" :class="{ 'fa-spin': mvuSettings.isParsingInProgress }"></i>
</button>
```

支持点击旋转中的按钮中断解析：

```typescript
async function retryExtraModelParsing(): Promise<void> {
  if (isParsingInProgress) {
    // 中断当前解析
    shouldAbortParsing = true;
    eventEmit(SCARLET_MVU_EVENTS.PARSING_ABORTED);
    return;
  }
  // ...
}
```

### 4. 流式输出Bug修复

在解析前后保存和恢复酒馆的流式输出配置：

```typescript
let originalStreamSetting: boolean | null = null;

function saveStreamSetting(): void {
  originalStreamSetting = SillyTavern.chatCompletionSettings?.stream ?? null;
}

function restoreStreamSetting(): void {
  if (originalStreamSetting !== null && SillyTavern.chatCompletionSettings) {
    SillyTavern.chatCompletionSettings.stream = originalStreamSetting;
  }
  originalStreamSetting = null;
}
```

### 5. 用户确认弹窗

拦截MVU的自动消息追加，展示富文本弹窗供用户编辑：

```typescript
// 监听MVU的BEFORE_MESSAGE_UPDATE事件
eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, (context) => {
  if (settings.enableExtraModelParsing) {
    // 检测并提取UpdateVariable块
    // 修改context.message_content移除块
    // 触发确认事件
    eventEmit(SCARLET_MVU_EVENTS.CONFIRM_UPDATE, {
      messageId,
      originalMessage,
      updateBlock,
      rawResponse,
    });
  }
});
```

## 事件系统

### 事件列表

| 事件名 | 描述 | 数据 |
|--------|------|------|
| `SETTINGS_CHANGED` | 设置变更 | `Settings` |
| `PARSING_STARTED` | 解析开始 | - |
| `PARSING_PROGRESS` | 解析进度 | `string` |
| `PARSING_COMPLETED` | 解析完成 | - |
| `PARSING_ABORTED` | 解析中断 | - |
| `PARSING_ERROR` | 解析错误 | `string` |
| `CONFIRM_UPDATE` | 请求确认 | `PendingUpdateData` |
| `CONFIRM_RESULT` | 确认结果 | `{confirmed, updateBlock}` |
| `MODEL_LIST_UPDATED` | 模型列表更新 | `string[]` |

### 通信流程

```
前端界面                    脚本
    │                        │
    │─REQUEST_RETRY_PARSING─▶│
    │                        │──┐ 解析中...
    │◀───PARSING_STARTED─────│  │
    │◀───PARSING_PROGRESS────│  │
    │                        │◀─┘
    │◀───CONFIRM_UPDATE──────│
    │                        │
    │    [用户编辑/确认]      │
    │                        │
    │───CONFIRM_RESULT──────▶│
    │                        │──┐ 应用更新
    │◀───PARSING_COMPLETED───│◀─┘
```

## 配置Schema

### API配置

```typescript
const ApiConfigSchema = z.object({
  apiUrl: z.string().default('http://localhost:1234/v1'),
  apiKey: z.string().default(''),
  modelName: z.string().default(''),
  maxTokens: z.coerce.number().default(4096),
  temperature: z.coerce.number().default(1).transform(v => Math.max(0, Math.min(2, v))),
  frequencyPenalty: z.coerce.number().default(0).transform(v => Math.max(-2, Math.min(2, v))),
  presencePenalty: z.coerce.number().default(0).transform(v => Math.max(-2, Math.min(2, v))),
  topP: z.coerce.number().default(1).transform(v => Math.max(0, Math.min(1, v))),
  sendPreset: z.boolean().default(true),
  useFunctionCalling: z.boolean().default(false),
});
```

### 完整设置

```typescript
const SettingsSchema = z.object({
  enableExtraModelParsing: z.boolean().default(false),
  apiConfig: ApiConfigSchema,
  savedProfiles: z.array(z.object({
    name: z.string(),
    config: ApiConfigSchema,
  })).default([]),
  activeProfileName: z.string().default('默认'),
  internal: z.object({
    lastUsedModel: z.string().default(''),
    cachedModelList: z.array(z.string()).default([]),
    cachedModelListTime: z.number().default(0),
  }).prefault({}),
});
```

## 全局API

脚本导出了 `ScarletMvu` 全局对象：

```typescript
const ScarletMvu = {
  events: SCARLET_MVU_EVENTS,
  getSettings: () => settings,
  saveSettings: (newSettings) => void,
  retryParsing: () => void,
  abortParsing: () => void,
  fetchModels: (apiUrl, apiKey) => Promise<string[]>,
  isParsingInProgress: () => boolean,
  getPendingConfirmation: () => PendingUpdateData | null,
  confirmUpdate: (confirmed, updateBlock?) => Promise<void>,
};
```

## 使用说明

### 启用额外模型解析

1. 打开设置页面（点击顶部状态栏右侧的齿轮图标）
2. 开启"启用额外模型解析"开关
3. 配置API参数：
   - 输入API地址
   - 输入API密钥（可选）
   - 点击"获取列表"按钮
   - 从下拉菜单选择模型

### 手动重试解析

1. 点击顶部状态栏的旋转图标按钮
2. 等待解析完成，弹窗显示解析结果
3. 检查/编辑变量更新代码
4. 点击"确认应用"或"取消"

### 中断解析

在解析过程中，点击正在旋转的按钮可以中断解析。

### 保存配置

1. 在设置页面配置好参数后
2. 点击"保存"图标
3. 输入配置名称
4. 后续可从下拉菜单快速切换不同配置

## 注意事项

1. **脚本依赖**：需要同时启用"绯色官途mvu脚本"才能使用完整功能
2. **MVU依赖**：需要安装MVU变量框架
3. **API兼容性**：模型列表获取支持OpenAI格式API
4. **流式输出**：本实现已修复中断解析导致的流式输出Bug

## 扩展接口

### 添加新的高级配置

在 `ApiConfigSchema` 中添加新字段，并在 `overrideMvuSettings` 函数中同步到MVU：

```typescript
// 1. 添加Schema字段
const ApiConfigSchema = z.object({
  // ...
  newOption: z.boolean().default(false),
});

// 2. 同步到MVU
mvuSettings.额外模型解析配置.newOption = config.newOption;
```

### 自定义解析逻辑

可以通过监听 `COMMAND_PARSED` 事件来自定义解析逻辑：

```typescript
eventOn(Mvu.events.COMMAND_PARSED, (variables, commands, message) => {
  // 自定义处理
});
```

