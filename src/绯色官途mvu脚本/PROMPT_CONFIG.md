# 绯色官途 MVU 脚本 - Prompt 配置指南

本文档面向开发者，说明如何配置额外模型解析的 Prompt。

---

## 1. 世界书条目过滤规则

MVU框架使用世界书条目名称中的标签来决定条目发送给哪个模型。

**重要前提：关闭的词条（enabled=false）永不注入，对LLM1和LLM2都适用。**

### 标签规则

| 条目标签情况                                     | 发送给 LLM1 (主模型) | 发送给 LLM2 (额外模型) |
| ------------------------------------------------ | -------------------- | ---------------------- |
| 不带任何标签                                     | ✅ 发送               | ❌ 不发送               |
| 只带 `[mvu_plot]`                                | ✅ 发送               | ❌ 不发送               |
| 只带 `[mvu_update]`                              | ❌ 不发送             | ✅ 发送                 |
| 只带 `[mvu_start]`                               | ❌ 不发送             | ✅ 发送（仅开局）       |
| 带 `[mvu_plot]` + `[mvu_update]`                 | ✅ 发送               | ✅ 发送                 |
| 带 `[mvu_plot]` + `[mvu_start]`                  | ✅ 发送               | ✅ 发送（仅开局）       |
| 带 `[mvu_update]` + `[mvu_start]`                | ❌ 不发送             | ✅ 发送                 |
| 带 `[mvu_plot]` + `[mvu_update]` + `[mvu_start]` | ✅ 发送               | ✅ 发送                 |

### 规则说明

**LLM1 (主模型) 注入条件：**

- ①不带任何标签（不带`[mvu_update]`且不带`[mvu_start]`） 或者
- ②显式含有标签`[mvu_plot]`

**LLM2 (额外模型) 注入条件：**

- 只有带了`[mvu_update]`标签或者`[mvu_start]`的（有这个标签就可以，多个标签也行，只要有）才会传LLM2

**开局变量生成：**

- 只注入带`[mvu_start]`标签的条目

### 示例

```yaml
# 世界书条目名称示例

# 只发送给主模型的剧情条目
"[mvu_plot] 角色设定 - 小明"

# 只发送给额外模型的变量更新规则
"[mvu_update] 好感度更新规则"

# 只发送给开局的开局规则
"[mvu_start] 开局变量初始化规则"

# 同时发送给主模型和额外模型
"[mvu_plot][mvu_update] 混合条目"

# 只发送给主模型（不带标签）
"世界观设定"

# 不发送给任何模型（只带[mvu_update]且不带[mvu_plot]）
"[mvu_update] 仅LLM2使用的规则"
```

---

## 2. Prompt 结构配置

### 2.1 配置位置

在 `src/绯色官途mvu脚本/index.ts` 中的 `PromptConfigSchema` 定义了 Prompt 配置结构：

```typescript
const PromptConfigSchema = z.object({
  // 是否发送预设（通常设为 false）
  sendPreset: z.boolean().default(false),

  // 自定义系统 Prompt（前缀，放在最前面）
  customSystemPrompt: z.string().default(`...`),

  // 自定义用户 Prompt（后缀，放在最后面）
  customUserPrompt: z.string().default('请根据上述剧情内容，分析并输出变量更新命令。'),

  // 聊天历史数量
  maxChatHistory: z.coerce.number().default(2),
});
```

### 2.2 修改默认 Prompt

要修改默认的系统指引 Prompt，找到 `customSystemPrompt` 的默认值并修改：

```typescript
customSystemPrompt: z.string().default(`你是一个变量更新助手。请根据以下剧情内容，分析变量应该如何变化，并输出变量更新命令。

规则：
1. 仔细阅读<past_observe>中的剧情内容
2. 根据世界书中的变量定义和更新规则，分析变量变化
3. 只输出变量更新命令，不要输出任何剧情内容
4. 使用以下格式输出：

<UpdateVariable>
<Analysis>
变量名: Y/N (是否需要更新)
</Analysis>
_.set('变量路径', 新值);//更新原因
</UpdateVariable>`),
```

---

## 3. Prompt 发送流程

### 3.1 LLM1 (主模型) 交互

用户与 LLM1 正常对话时：

1. 自动过滤掉带 `[mvu_update]` 且不带 `[mvu_plot]` 的世界书条目
2. 剩余条目按其原始位置设置注入到 Prompt

### 3.2 LLM2 (额外模型) 交互

点击"重试额外模型解析"或自动触发解析时：

1. 自动包含带 `[mvu_update]` 或 `[mvu_start]` 的世界书条目（前提：条目必须启用）
2. Prompt 结构如下：

```
[System] customSystemPrompt (自定义指引)
[System] 世界书条目 (按原始位置，仅包含带[mvu_update]或[mvu_start]的启用条目)
[聊天历史] 最近 N 条对话
[User] customUserPrompt (用户请求)
```

---

## 4. 变量更新命令格式

LLM2 输出的变量更新命令支持两种格式：

### 4.1 Lodash 风格 (推荐)

```javascript
_.set('角色.好感度', 50);//愉快的交流
_.add('user.金币', -30);//购买物品
_.insert('user.物品', '新装备');
_.delete('user.临时状态');
```

### 4.2 JSON Patch 风格

```json
[
  {"op": "replace", "path": "/角色/好感度", "value": 50},
  {"op": "add", "path": "/user/物品/-", "value": "新装备"},
  {"op": "remove", "path": "/user/临时状态"}
]
```

---

## 5. 部署步骤

### 5.1 修改配置后

1. 修改 `src/绯色官途mvu脚本/index.ts` 中的配置
2. 运行构建命令：

   ```bash
   npm run build
   ```

3. 将 `dist/绯色官途mvu脚本/index.js` 部署到酒馆

### 5.2 用户可配置项

以下设置仍可通过 UI 让用户配置：

- **是否启用额外模型解析** - 开关功能
- **API 配置** - API 地址、密钥、模型选择等
- **聊天历史数量** - 发送给 LLM2 的历史消息数
- **自定义 Prompt** - 用户可微调的系统指引和用户请求

### 5.3 开发者专属配置

以下配置应由开发者在代码中设置，不暴露给用户：

- 世界书过滤规则（通过 `[mvu_update]`/`[mvu_plot]` 标签控制）
- Prompt 的整体结构
- 变量更新命令的解析规则

---

## 6. 调试建议

1. **查看控制台日志**：脚本会输出详细的调试信息
2. **使用 Prompt 预览**：在设置页面点击"刷新预览"查看实际发送的 Prompt
3. **检查变量更新**：使用 MVU 的变量查看器确认变量是否正确更新

---

## 7. 注意事项

1. **不要将预设发送给 LLM2**：预设通常用于角色扮演，会干扰变量更新
2. **精简聊天历史**：过多历史会增加 token 消耗，通常 2-3 条足够
3. **明确的更新规则**：在世界书的 `[mvu_update]` 条目中写清楚变量更新规则
4. **测试验证**：修改配置后务必测试变量更新是否正常工作
