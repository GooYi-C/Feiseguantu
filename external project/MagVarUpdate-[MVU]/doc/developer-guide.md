# MagVarUpdate (MVU) 开发者文档

> 本文档面向需要快速理解并继续开发 MagVarUpdate 项目的开发者。MVU 是一个基于 [JS-Slash-Runner (酒馆助手)](https://github.com/N0VI028/JS-Slash-Runner) 框架的 SillyTavern 变量管理脚本。

---

## 目录

1. [项目概览与架构](#1-项目概览与架构)
2. [技术基础](#2-技术基础)
3. [核心功能](#3-核心功能)
4. [实现细节](#4-实现细节)
5. [开发指南](#5-开发指南)
6. [扩展点](#6-扩展点)
7. [已知限制与改进机会](#7-已知限制与改进机会)
8. [代码示例](#8-代码示例)
9. [调试与故障排除](#9-调试与故障排除)

---

## 1. 项目概览与架构

### 1.1 项目目的与范围

MagVarUpdate (MVU) 是一个**消息楼层变量管理框架**，旨在解决传统基于正则表达式的角色卡变量更新方案中存在的问题：

- **消除正则冲突**：不再依赖复杂的正则表达式来捕获变量更新
- **支持楼层隐藏**：变量状态独立于消息内容存储，可随时隐藏/删除旧楼层
- **降低运行时开销**：不需要持续对所有楼层进行正则处理
- **可靠的状态管理**：提供结构化的变量定义、初始化和更新机制

### 1.2 MVU 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                      SillyTavern 平台                            │
├─────────────────────────────────────────────────────────────────┤
│                   JS-Slash-Runner (酒馆助手)                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ eventOn/Emit │ getVariables │ setChatMsg   │ generate API │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    MagVarUpdate (MVU) 脚本                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     main.ts (入口)                          │ │
│  │  - 事件监听注册     - 生命周期管理     - 全局导出           │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                  核心模块                                   │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │ │variable_init│ │  function   │ │   schema    │           │ │
│  │ │ 变量初始化   │ │ 命令解析执行 │ │ 模式生成验证 │           │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │ │   settings  │ │    panel    │ │   button    │           │ │
│  │ │  配置管理    │ │  UI 面板    │ │  按钮功能    │           │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  │ ┌─────────────┐ ┌─────────────┐                           │ │
│  │ │function_call│ │export_globals│                          │ │
│  │ │ 函数调用支持 │ │ 全局接口导出 │                          │ │
│  │ └─────────────┘ └─────────────┘                           │ │
│  └────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      数据存储层                                  │
│  ┌──────────────┬──────────────┬──────────────┐                │
│  │ 消息楼层变量  │   聊天变量    │  扩展设置     │                │
│  │ (per-message)│   (per-chat) │ (extension)  │                │
│  └──────────────┴──────────────┴──────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 与 SillyTavern 和 Slash-Runner 的关系

**SillyTavern** 是一个本地运行的 AI 聊天前端，支持多种 LLM API。

**JS-Slash-Runner (酒馆助手)** 是 SillyTavern 的一个扩展，提供：

- 脚本执行环境（iframe 沙箱）
- 事件系统 (`eventOn`, `eventEmit`)
- 变量管理 API (`getVariables`, `replaceVariables`, `updateVariablesWith`)
- 消息操作 API (`getChatMessages`, `setChatMessages`)
- 生成接口 (`generate`, `generateRaw`)
- 宏系统 (`substitudeMacros`)

**MVU** 作为酒馆助手的一个脚本运行，利用上述 API 实现变量管理功能。

### 1.4 核心数据结构

```typescript
// MVU 核心数据类型 (MvuData)
type MvuData = {
    // 已初始化的世界书列表（对象格式）
    initialized_lorebooks?: Record<string, any[]>;

    // 实际变量数据
    stat_data: StatData & RootAdditionalMetaProps & { $internal?: InternalData };

    // 显示数据：变量变化的可视化表示 "旧值->新值 (原因)"
    display_data?: Record<string, any>;

    // 增量数据：本次更新中变化的变量
    delta_data?: Record<string, any>;

    // 数据结构模式（Schema）
    schema?: ObjectSchemaNode & Partial<RootAdditionalProps>;
};

// 带描述的值类型
type ValueWithDescription<T> = [T, string];
// 例: ["03月15日", "今天的日期，格式为 mm月dd日"]
```

---

## 2. 技术基础

### 2.1 技术栈

| 类别       | 技术              | 版本    |
| ---------- | ----------------- | ------- |
| 语言       | TypeScript        | ^5.8.3  |
| 构建工具   | Webpack           | ^5.99.8 |
| 包管理     | Yarn              | 3.4.1   |
| UI 框架    | Vue 3             | ^3.5.21 |
| 状态管理   | Pinia             | ^3.0.3  |
| 验证       | Zod               | ^4.1.11 |
| 数学计算   | mathjs            | ^12.4.1 |
| JSON Patch | fast-json-patch   | ^3.1.1  |
| 深拷贝     | klona             | ^2.0.6  |
| 数据解析   | yaml, json5, toml | latest  |
| 测试       | Jest              | ^29.7.0 |

### 2.2 项目结构

```
MagVarUpdate-beta/
├── src/                          # 源代码目录
│   ├── main.ts                   # 入口文件，生命周期管理
│   ├── function.ts               # 核心：命令解析与执行
│   ├── variable_def.ts           # 类型定义与常量
│   ├── variable_init.ts          # 变量初始化逻辑
│   ├── schema.ts                 # Schema 生成与验证
│   ├── settings.ts               # 配置管理（Pinia store）
│   ├── panel.ts                  # UI 面板挂载
│   ├── Panel.vue                 # Vue 配置面板组件
│   ├── button.ts                 # 扩展按钮功能
│   ├── export_globals.ts         # Mvu 全局接口导出
│   ├── function_call.ts          # LLM 函数调用支持
│   ├── util.ts                   # 工具函数
│   ├── notifications.ts          # 通知提示
│   └── update_descriptions.ts    # 描述更新辅助
│
├── slash-runner/@types/          # 类型定义
│   ├── iframe/                   # iframe 环境类型
│   │   ├── exported.mvu.d.ts     # MVU 导出接口类型
│   │   ├── exported.tavernhelper.d.ts
│   │   ├── exported.sillytavern.d.ts
│   │   └── ...
│   └── function/                 # 函数类型定义
│       └── ...
│
├── artifact/                     # 构建产物
│   ├── bundle.js                 # 打包后的脚本
│   ├── bundle.js.map             # Source Map
│   └── *.d.ts                    # 类型声明文件
│
├── tests/                        # 测试文件
├── doc/                          # 文档
├── example/                      # 示例角色卡世界书
└── example_src/                  # 示例脚本源码
```

### 2.3 关键 API 与集成

MVU 依赖酒馆助手提供的以下核心 API：

```typescript
// 变量操作
getVariables(options: VariableOption): Record<string, any>
replaceVariables(variables: object, options: VariableOption): Promise<void>
updateVariablesWith(updater: (v: object) => object, options: VariableOption): Promise<void>

// VariableOption 类型
type VariableOption = {
    type: 'message' | 'chat' | 'character' | 'global' | 'script';
    message_id?: number | 'latest';  // type='message' 时使用
    script_id?: string;               // type='script' 时使用
}

// 消息操作
getChatMessages(message_id: number, options?: object): ChatMessage[]
setChatMessages(messages: ChatMessageUpdate[], options?: object): Promise<void>

// 事件系统
eventOn(event: string, callback: Function): void
eventEmit(event: string, ...args: any[]): Promise<void>
eventRemoveListener(event: string, callback: Function): void

// 生成接口
generate(options: GenerateOptions): Promise<string>
generateRaw(options: GenerateOptions): Promise<string>

// 宏替换
substitudeMacros(text: string): string
```

---

## 3. 核心功能

### 3.1 变量管理能力

#### 3.1.1 变量初始化

通过世界书中 `[InitVar]` 标签的条目定义初始变量：

```yaml
# 世界书条目名称包含 [InitVar]
日期: ["03月15日", "今天的日期，格式为 mm月dd日"]
时间: ["09:00", "按照实际经历时间更新，格式为 hh:mm"]
user:
  身份: ["新来的牧师", "随故事进展改变"]
  当前位置: ["教堂", "user所在位置，移动后改变"]
理:
  好感度: [0, "[-100,100]之间，与理交流时变化，范围 [-5,8]"]
  当前所想: ["今天吃什么好呢？", "理现在脑子里想的事情"]
```

#### 3.1.2 变量更新命令

支持多种更新命令格式：

```javascript
// 设置值
_.set('角色.好感度', 50);              // 直接设置
_.set('角色.好感度', 30, 50);          // 带旧值验证
_.set('角色.好感度', 50);//升级奖励    // 带原因注释

// 数值增减
_.add('角色.好感度', 5);               // 增加
_.add('角色.好感度', -3);              // 减少
_.add('世界.时间', 3600000);           // 时间增加（毫秒）

// 插入元素
_.insert('角色.物品', '新物品');        // 数组尾部追加
_.insert('角色.物品', 0, '新物品');     // 指定位置插入
_.insert('角色.属性', 'key', 'value'); // 对象属性添加

// 删除元素
_.delete('角色.物品[0]');              // 删除数组元素
_.delete('角色.属性', 'key');          // 删除对象属性
_.remove('角色.物品', 0);              // remove 是 delete 的别名
_.unset('角色.临时属性');              // unset 是 delete 的别名
```

#### 3.1.3 JSON Patch 支持

```xml
<JsonPatch>
[
    {"op": "replace", "path": "/角色/好感度", "value": 50},
    {"op": "add", "path": "/角色/物品/-", "value": "新物品"},
    {"op": "remove", "path": "/角色/临时属性"}
]
</JsonPatch>
```

### 3.2 命令系统集成

MVU 通过监听酒馆助手的事件来触发变量处理：

```typescript
// 核心事件监听（main.ts）
scopedEventOn(tavern_events.GENERATION_STARTED, initCheck);
scopedEventOn(tavern_events.MESSAGE_SENT, initCheck);
scopedEventOn(tavern_events.MESSAGE_SENT, handleVariablesInMessage);
scopedEventOn(tavern_events.MESSAGE_RECEIVED, onMessageReceived);
scopedEventOn('worldinfo_entries_loaded', handlePromptFilter);
```

### 3.3 数据持久化机制

变量数据存储在多个层级：

1. **消息楼层变量** (`message`): 每条消息独立存储，包含该楼层的完整变量快照
2. **聊天变量** (`chat`): 可选的聊天级别存储（默认关闭）
3. **扩展设置** (`extensionSettings`): MVU 配置持久化

```typescript
// 存储结构示例（消息楼层）
{
    message: "AI 回复内容...",
    variables: [{
        initialized_lorebooks: { "角色世界书": [] },
        stat_data: { /* 变量数据 */ },
        display_data: { /* 显示数据 */ },
        delta_data: { /* 增量数据 */ },
        schema: { /* 数据结构模式 */ }
    }]
}
```

---

## 4. 实现细节

### 4.1 关键组件职责

#### `main.ts` - 入口与生命周期

```typescript
// 主要职责
- 初始化版本检测
- 导出全局 Mvu 对象
- 初始化 Vue 面板
- 注册事件监听器
- 注册功能按钮
- 处理旧楼层变量清理与恢复
```

#### `function.ts` - 命令解析与执行

```typescript
// 核心函数
extractCommands(inputText: string): Command[]  // 从文本提取更新命令
updateVariables(message: string, variables: MvuData): Promise<boolean>  // 执行变量更新
handleVariablesInMessage(message_id: number): Promise<void>  // 处理消息中的变量
updateVariable(stat_data, path, new_value, reason, is_recursive): Promise<boolean>  // 单变量更新
```

#### `variable_init.ts` - 变量初始化

```typescript
// 核心函数
initCheck(): Promise<void>  // 检查并执行初始化
loadInitVarData(mvu_data: MvuData, lorebook_list?: string[]): Promise<boolean>  // 加载 InitVar 数据
createEmptyGameData(): MvuData  // 创建空数据结构
```

#### `schema.ts` - 模式管理

```typescript
// 核心函数
generateSchema(data: any, oldSchemaNode?: SchemaNode): SchemaNode  // 生成 Schema
getSchemaForPath(schema: SchemaNode, path: string): SchemaNode | null  // 路径查询
reconcileAndApplySchema(variables: MvuData): void  // 调和 Schema
cleanUpMetadata(data: any): void  // 清理元数据标记
```

#### `export_globals.ts` - 全局接口

```typescript
// Mvu 全局对象方法
Mvu.events                    // 事件常量
Mvu.parseMessage()            // 解析变量更新命令
Mvu.getMvuData()              // 获取 MvuData
Mvu.replaceMvuData()          // 替换 MvuData
Mvu.setMvuVariable()          // 设置单个变量
Mvu.getMvuVariable()          // 获取单个变量
Mvu.reloadInitVar()           // 重新加载初始变量
Mvu.getRecordFromMvuData()    // 获取指定类别数据
```

### 4.2 数据流

```
消息生成完成
    │
    ▼
tavern_events.MESSAGE_RECEIVED
    │
    ▼
onMessageReceived(message_id)
    │
    ├─[随AI输出模式]───────────────────────────────────────┐
    │                                                      │
    ├─[额外模型解析模式]                                    │
    │     │                                                │
    │     ▼                                                │
    │  generate() 调用额外模型                              │
    │     │                                                │
    │     ▼                                                │
    │  解析 <UpdateVariable> 块或函数调用结果               │
    │     │                                                │
    │     ▼                                                │
    │  追加结果到消息内容                                   │
    │                                                      │
    └──────────────────────────────────────────────────────┘
                        │
                        ▼
             handleVariablesInMessage(message_id)
                        │
                        ▼
              getLastValidVariable()  // 获取前一楼层变量
                        │
                        ▼
              updateVariables(message, variables)
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
eventEmit           extractCommands     eventEmit
(UPDATE_STARTED)    解析所有命令         (COMMAND_PARSED)
                        │
                        ▼
              ┌─────────────────────┐
              │ 遍历执行每个命令     │
              │ - set/insert/delete │
              │ - 更新 stat_data    │
              │ - 更新 display_data │
              │ - 更新 delta_data   │
              │ - 触发 UPDATED 事件  │
              └─────────────────────┘
                        │
                        ▼
              reconcileAndApplySchema()  // 调和 Schema
                        │
                        ▼
              eventEmit(UPDATE_ENDED)
                        │
                        ▼
              updateVariablesWith()  // 写回变量
                        │
                        ▼
              setChatMessages()  // 更新消息，添加状态栏占位符
```

### 4.3 事件系统

MVU 提供以下自定义事件：

| 事件名                        | 常量                      | 触发时机         | 回调签名                                 |
| ----------------------------- | ------------------------- | ---------------- | ---------------------------------------- |
| `mag_variable_initialized`    | `VARIABLE_INITIALIZED`    | 0层变量初始化    | `(variables, swipe_id) => void`          |
| `mag_before_message_update`   | `BEFORE_MESSAGE_UPDATE`   | 即将更新楼层变量 | `(context: UpdateContext) => void`       |
| `mag_variable_update_started` | `VARIABLE_UPDATE_STARTED` | 批量更新开始     | `(variables) => void`                    |
| `mag_command_parsed`          | `COMMAND_PARSED`          | 命令解析完成     | `(variables, commands, message) => void` |
| `mag_variable_updated`        | `SINGLE_VARIABLE_UPDATED` | 单变量更新       | `(stat_data, path, old, new) => void`    |
| `mag_variable_update_ended`   | `VARIABLE_UPDATE_ENDED`   | 批量更新结束     | `(variables, variables_before) => void`  |

### 4.4 Schema 系统

Schema 用于控制变量结构的可扩展性：

```typescript
// Schema 节点类型
type ObjectSchemaNode = {
    type: 'object';
    properties: Record<string, SchemaNode & { required?: boolean }>;
    extensible?: boolean;       // 是否可添加新属性
    template?: TemplateType;    // 新属性的模板
    recursiveExtensible?: boolean;  // 递归可扩展
};

type ArraySchemaNode = {
    type: 'array';
    elementType: SchemaNode;
    extensible?: boolean;       // 是否可添加新元素
    template?: TemplateType;    // 新元素的模板
};
```

在 `stat_data` 中使用 `$meta` 定义 Schema：

```yaml
角色列表:
  $meta:
    extensible: true
    template:
      好感度: [0, "初始好感度"]
      状态: ["正常", "角色状态"]
  角色A:
    好感度: [50, "好感度"]
    状态: ["正常", "状态"]
```

---

## 5. 开发指南

### 5.1 编码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置（`eslint.config.mjs`）
- 使用 Prettier 格式化
- 中文变量名/注释可用于面向用户的配置

### 5.2 测试方法

```bash
# 运行所有测试
yarn test

# 监视模式
yarn test:watch

# 覆盖率报告
yarn test:coverage
```

测试文件位于 `tests/` 目录，使用 Jest 框架。

### 5.3 构建与部署

```bash
# 开发构建
yarn build:dev

# 生产构建
yarn build

# 监视模式（带热重载服务器）
yarn watch

# 仅构建类型定义
yarn build:dts
```

构建产物输出到 `artifact/` 目录：

- `bundle.js` - 主脚本文件
- `bundle.js.map` - Source Map
- `*.d.ts` - TypeScript 声明文件
- `stat-data-schema.json` - JSON Schema

### 5.4 开发环境热重载

运行 `yarn watch` 后，Webpack 会启动 WebSocket 服务器（端口 6621），当代码变更时自动通知酒馆页面重新加载脚本。

---

## 6. 扩展点

### 6.1 事件钩子

通过 `eventOn` 监听 MVU 事件实现自定义逻辑：

```javascript
// 变量联动：等级提升时增加属性
eventOn(Mvu.events.SINGLE_VARIABLE_UPDATED, (stat_data, path, oldValue, newValue) => {
    if (path === 'player.level' && newValue > oldValue) {
        Mvu.setMvuVariable({ stat_data }, 'player.maxHealth',
            stat_data.player.maxHealth + 10,
            { reason: '升级奖励' }
        );
    }
});

// 保护变量不被修改
eventOn(Mvu.events.COMMAND_PARSED, (variables, commands, message) => {
    _.remove(commands, cmd => cmd.args[0].startsWith('protected.'));
});

// 自定义命令解析
eventOn(Mvu.events.COMMAND_PARSED, (variables, commands, message) => {
    const customMatch = message.match(/<CustomUpdate>(.*?)<\/CustomUpdate>/s);
    if (customMatch) {
        // 解析自定义格式并添加到 commands
        commands.push({
            type: 'set',
            args: ['custom.path', 'value'],
            full_match: customMatch[0],
            reason: '自定义解析'
        });
    }
});
```

### 6.2 自定义变量类型

通过 `ValueWithDescription` 类型支持带描述的值：

```typescript
type ValueWithDescription<T> = [T, string];
// 第一个元素是实际值，第二个是描述/更新条件
```

### 6.3 与其他扩展集成

MVU 导出的 `Mvu` 全局对象可被其他脚本使用：

```javascript
// 等待 MVU 初始化完成
await waitGlobalInitialized('Mvu');

// 使用 MVU API
const data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
const health = Mvu.getMvuVariable(data, 'player.health');
```

---

## 7. 已知限制与改进机会

### 7.1 当前限制

1. **Schema 生成时机**：Schema 在变量更新后才重新生成，可能导致同一消息内的连续操作出现验证问题
2. **函数调用依赖**：额外模型解析的函数调用模式依赖 LLM 的 tool calling 能力
3. **楼层变量体积**：长期聊天会积累大量楼层变量，需要定期清理
4. **重演功能限制**：依赖聊天记录中的命令完整性，无法重演前端直接修改的变量

### 7.2 性能考虑

- 使用 `klona` 进行深拷贝，对大型变量结构有一定开销
- Schema 调和在每次变量更新后执行
- 自动清理功能每 5 层触发一次检查

### 7.3 建议改进方向

1. **增量 Schema 更新**：只更新变化的部分而非完整重新生成
2. **变量版本控制**：支持变量变更历史的查看和回滚
3. **前端变量编辑器**：提供可视化的变量编辑界面
4. **变量导入导出**：支持变量状态的备份和恢复
5. **性能优化**：对大型变量结构使用增量序列化

---

## 8. 代码示例

### 8.1 变量定义示例 (`[InitVar]` 条目)

```yaml
# YAML 格式
日期: ["03月15日", "格式为 mm月dd日"]
时间: ["09:00", "格式为 hh:mm"]

user:
  名字: "<user>"
  身份: ["冒险者", "随故事进展改变"]
  金币: [100, "持有金币数量"]
  物品:
    $meta:
      extensible: true
      template: ["新物品", "物品描述"]

角色:
  $meta:
    extensible: true
    template:
      好感度: [0, "[-100,100]之间"]
      关系: ["陌生人", "关系阶段"]
  小明:
    好感度: [20, "好感度"]
    关系: ["朋友", "关系"]
```

### 8.2 变量更新示例 (AI 输出)

```xml
<UpdateVariable>
<Analysis>
日期: N（日期未变）
时间: Y（进行了行动）
user.金币: Y（购买了物品）
角色.小明.好感度: Y（愉快交流）
</Analysis>
_.set('时间', '10:30');//进行了探索
_.add('user.金币', -50);//购买装备
_.set('角色.小明.好感度', 20, 25);//愉快的交流增加了好感
_.insert('user.物品', '铁剑');//获得新物品
</UpdateVariable>
```

### 8.3 脚本集成示例

```typescript
// 等待 MVU 初始化
await waitGlobalInitialized('Mvu');

// 监听变量初始化事件，添加自定义数据
eventOn(Mvu.events.VARIABLE_INITIALIZED, (variables, swipe_id) => {
    // 添加非 stat_data 的自定义变量
    variables.custom_data = { initialized: true, timestamp: Date.now() };
});

// 监听变量更新，实现日期自动切换
eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async (variables, variables_before) => {
    const oldTime = Mvu.getMvuVariable(variables_before, '时间');
    const newTime = Mvu.getMvuVariable(variables, '时间');

    // 检测是否跨越午夜
    if (oldTime && newTime) {
        const oldHour = parseInt(oldTime.split(':')[0]);
        const newHour = parseInt(newTime.split(':')[0]);

        if (newHour < oldHour) {
            // 自动更新日期
            const currentDate = Mvu.getMvuVariable(variables, '日期');
            // 计算新日期...
            await Mvu.setMvuVariable(variables, '日期', newDate, { reason: '日替' });
        }
    }
});

// 保护关键变量不被 AI 修改
eventOn(Mvu.events.COMMAND_PARSED, (variables, commands, message) => {
    _.remove(commands, cmd => {
        const path = cmd.args[0];
        // 保护 user.名字 不被修改
        if (path === 'user.名字' || path.startsWith('user.名字.')) {
            console.warn(`[保护] 阻止对 ${path} 的修改`);
            return true;
        }
        return false;
    });
});
```

### 8.4 状态栏显示示例

```ejs
<%
if (runType == 'render') {
    function SafeGetValue(value, defaultValue = "") {
        if (value === undefined || value === null) return defaultValue;
        if (Array.isArray(value)) return value.length !== 0 ? value[0] : defaultValue;
        return value;
    }

    const data = window.TavernHelper.getVariables({type: 'message', message_id: message_id});
    const display = data.display_data || data.stat_data;
%>
📅 日期: <%- SafeGetValue(display.日期) %>
⏰ 时间: <%- SafeGetValue(display.时间) %>
💰 金币: <%- SafeGetValue(display.user?.金币) %>
💖 好感度: <%- SafeGetValue(display.角色?.小明?.好感度) %>
<% } %>
```

---

## 9. 调试与故障排除

### 9.1 常见问题

#### 变量未初始化

- **症状**：`stat_data` 为空或未定义
- **原因**：世界书条目名称未包含 `[InitVar]` 或条目格式错误
- **解决**：检查条目命名和 YAML/JSON 格式

#### Schema 验证失败

- **症状**：`SCHEMA VIOLATION` 错误
- **原因**：尝试向不可扩展的对象/数组添加元素
- **解决**：在 `$meta` 中设置 `extensible: true`

#### 变量路径错误

- **症状**：`Path does not exist` 错误
- **原因**：LLM 生成的路径与实际变量结构不匹配
- **解决**：使用 `COMMAND_PARSED` 事件修正路径

### 9.2 日志机制

MVU 使用 `console.log/info/warn/error` 输出日志，在浏览器控制台查看：

```javascript
// 常见日志前缀
[MVU] // 一般信息
[MVU]变量初始化 // 初始化相关
[MVU]额外模型解析 // 额外模型相关
```

### 9.3 调试配置

1. **开发模式构建**：`yarn build:dev` 生成未压缩的代码
2. **Source Map**：生产构建包含 source map (`bundle.js.map`)
3. **变量查看器**：安装 [SillyTavern-Variable-Viewer](https://github.com/LenAnderson/SillyTavern-Variable-Viewer/) 插件

### 9.4 故障排除步骤

1. **检查版本兼容性**
   - SillyTavern >= 1.13.4
   - 酒馆助手 >= 3.4.17

2. **验证世界书配置**
   - `[InitVar]` 条目正确命名
   - `[mvu_update]` 条目用于变量更新规则
   - `[mvu_plot]` 条目用于剧情演绎（额外模型解析时过滤）

3. **检查聊天文件**
   - 导出聊天文件查看 `variables` 字段
   - 使用 VSCode 实时查看文件变化

4. **使用重演功能**
   - 点击 `重演楼层` 从快照重新计算变量
   - 点击 `重新读取初始变量` 合并新的 InitVar 定义

---

## 附录

### A. 类型定义参考

完整类型定义见 `slash-runner/@types/iframe/exported.mvu.d.ts`

### B. 配置项说明

| 配置项                              | 类型    | 默认值     | 说明                         |
| ----------------------------------- | ------- | ---------- | ---------------------------- |
| 更新方式                            | enum    | '随AI输出' | '随AI输出' 或 '额外模型解析' |
| 快照保留间隔                        | number  | 50         | 每 N 层保留一个快照          |
| 更新到聊天变量                      | boolean | false      | 是否同步更新到聊天变量       |
| auto_cleanup.启用                   | boolean | true       | 启用自动清理旧变量           |
| auto_cleanup.要保留变量的最近楼层数 | number  | 20         | 保留最近 N 层的变量          |

### C. 相关链接

- [MVU 仓库](https://github.com/MagicalAstrogy/MagVarUpdate)
- [酒馆助手](https://github.com/N0VI028/JS-Slash-Runner)
- [酒馆助手文档](https://n0vi028.github.io/JS-Slash-Runner-Doc)
- [SillyTavern](https://github.com/SillyTavern/SillyTavern)
