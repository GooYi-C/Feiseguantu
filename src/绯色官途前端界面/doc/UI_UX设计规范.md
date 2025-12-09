# 绯色官途 · UI/UX 设计规范

## 1. 设计理念

### 1.1 核心关键词

> **政纪肃正 × 绯色暧昧 × 权谋危机感**

- **政纪肃正**: 深沉、庄重、官方感，金色点缀体现权力质感
- **绯色暧昧**: 暗红渐变营造禁忌与危险的暧昧氛围
- **权谋危机**: 危机提示醒目，数据变化有紧迫感

### 1.2 视觉对比

| 场景 | 主色调 | 氛围 | 示例 |
|------|--------|------|------|
| 日常/档案 | 深炭黑 + 金 | 稳重、正式 | 仪表盘、个人档案 |
| 绯色互动 | 暗红渐变 | 暧昧、危险 | 绯色关系、把柄 |
| 危机/警告 | 橙红系 | 紧迫、警示 | 危机提示、高危把柄 |
| 机遇/成功 | 青绿系 | 积极、希望 | 机遇卡片、正向变化 |

---

## 2. 色彩系统

### 2.1 主色板

```scss
// ═══ 官方肃正系 (Primary) ═══
--color-bg-dark: #0f1117;       // 最深背景
--color-bg-card: #161922;       // 卡片背景
--color-bg-elevated: #1e212c;   // 悬浮/选中背景
--color-border: #242838;        // 边框
--color-border-light: #2d3348;  // 浅边框

// ═══ 金色点缀 (Accent) ═══
--color-gold: #d8a657;          // 主金色
--color-gold-light: #e8c078;    // 亮金色
--color-gold-dim: #9a7a3a;      // 暗金色

// ═══ 绯色互动系 (Romance) ═══
--color-romance: #c41e3a;       // 绯红
--color-romance-light: #ff4d6d; // 亮绯
--color-romance-gradient: linear-gradient(135deg, #c41e3a 0%, #ff4d6d 100%);
```

### 2.2 语义色

```scss
// 状态色
--color-success: #4ac18e;   // 成功/机遇/正向
--color-info: #7aa2f7;      // 信息/提示
--color-warning: #e0c36c;   // 警告/注意
--color-danger: #ff6b6b;    // 危险/错误/危机

// 关系类型色
--color-rel-patron: #d8a657;   // 靠山 - 金色
--color-rel-romance: #ff4d6d;  // 绯色 - 粉红
--color-rel-rival: #ff8844;    // 竞争 - 橙色
--color-rel-enemy: #e63946;    // 宿敌 - 深红
--color-rel-family: #7aa2f7;   // 家属 - 柔蓝
--color-rel-official: #a0a5b8; // 官场 - 银灰
```

### 2.3 文字色

```scss
--color-text-primary: #f0f0f5;   // 主文字 (标题、重要内容)
--color-text-secondary: #a0a5b8; // 次要文字 (正文)
--color-text-muted: #6a7088;     // 辅助文字 (标签、描述)
--color-text-disabled: #484c5c;  // 禁用文字
```

### 2.4 色彩使用原则

1. **背景层级**: `bg-dark` → `bg-card` → `bg-elevated` (由深到浅)
2. **金色使用**: 仅用于强调元素 (图标、标题、靠山关系)
3. **绯色使用**: 绯色相关内容、CTA 按钮、危险警示
4. **避免纯白**: 文字不使用 #fff，使用 `text-primary`

---

## 3. 字体排版

### 3.1 字体栈

```scss
// 中文正文
--font-sans: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;

// 数字/英文标题
--font-display: 'Inter', 'Noto Sans SC', sans-serif;

// 代码/等宽
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 字号层级

| 元素 | 字号 | 字重 | 行高 | 示例 |
|------|------|------|------|------|
| H1 页面标题 | 20-22px | 700 | 1.3 | "个人档案" |
| H2 卡片标题 | 15-16px | 600 | 1.4 | "基本信息" |
| H3 分区标题 | 14px | 600 | 1.4 | "能力评估" |
| 正文 | 13-14px | 400 | 1.5 | 卡片内容 |
| 标签 | 11-12px | 500 | 1.4 | 字段标签 |
| 徽章 | 10-11px | 600 | 1.2 | 状态徽章 |

### 3.3 排版规则

```scss
// 中文字间距
letter-spacing: 0.02em;

// 标签文字
.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

// 数值显示
.stat-value {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  font-feature-settings: 'tnum'; // 等宽数字
}
```

---

## 4. 间距系统

### 4.1 间距变量

```scss
--spacing-xs: 4px;   // 紧凑间距
--spacing-sm: 8px;   // 小间距
--spacing-md: 12px;  // 中等间距
--spacing-lg: 16px;  // 大间距
--spacing-xl: 24px;  // 超大间距
--spacing-2xl: 32px; // 最大间距
```

### 4.2 使用场景

| 间距 | 场景 |
|------|------|
| xs (4px) | 紧凑标签间距、图标与文字间距 |
| sm (8px) | 列表项内部、字段标签与输入框 |
| md (12px) | 卡片内元素间距、表单行间距 |
| lg (16px) | 卡片内边距、分区间距 |
| xl (24px) | 页面内卡片间距 |
| 2xl (32px) | 页面边距 |

---

## 5. 组件规范

### 5.1 卡片 (Card)

```scss
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);      // 12px
  box-shadow: var(--shadow-sm);
  
  // 悬浮效果
  &:hover {
    border-color: var(--color-border-light);
    box-shadow: var(--shadow-md);
  }
  
  // 选中状态
  &.selected {
    border-color: var(--color-gold);
    box-shadow: var(--shadow-glow-gold);
  }
}

.card-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  
  h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    i { color: var(--color-gold); }
  }
}

.card-body {
  padding: var(--spacing-lg);
}
```

### 5.2 按钮 (Button)

```scss
// 主要按钮 (金色)
.btn-primary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  color: var(--color-bg-dark);
  border-radius: var(--radius-md);
  font-weight: 600;
  
  &:hover { filter: brightness(1.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// 绯色按钮
.btn-romance {
  background: var(--color-romance-gradient);
  color: white;
}

// 幽灵按钮
.btn-ghost {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  
  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

// 危险按钮
.btn-danger {
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  
  &:hover {
    background: rgba(255, 107, 107, 0.1);
  }
}
```

### 5.3 标签/徽章 (Tag/Badge)

```scss
.tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  
  // 变体
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
  &.success {
    background: rgba(74, 193, 142, 0.15);
    color: var(--color-success);
  }
}
```

### 5.4 输入控件

```scss
// 文本输入
.input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  
  &:focus {
    border-color: var(--color-gold);
    outline: none;
  }
  
  &::placeholder {
    color: var(--color-text-muted);
  }
}

// 滑条
.slider {
  -webkit-appearance: none;
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: 3px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: var(--color-gold);
    border-radius: 50%;
    cursor: pointer;
  }
}

// 下拉选择
.select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
}
```

### 5.5 进度条

```scss
.progress-bar {
  height: 8px;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  overflow: hidden;
  
  .fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
    
    // 等级着色
    &.high { background: linear-gradient(90deg, var(--color-success), #6dd5a0); }
    &.mid { background: linear-gradient(90deg, var(--color-warning), #f0d78c); }
    &.low { background: linear-gradient(90deg, var(--color-danger), #ff9999); }
  }
}

// 危险度进度条 (绯红渐变)
.danger-bar .fill {
  background: var(--color-romance-gradient);
}
```

### 5.6 抽屉 (Drawer)

```scss
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-slow);
  z-index: var(--z-drawer);
  
  &.open {
    opacity: 1;
    visibility: visible;
  }
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  transform: translateX(100%);
  transition: transform var(--transition-slow);
  z-index: calc(var(--z-drawer) + 1);
  
  &.open {
    transform: translateX(0);
  }
}
```

---

## 6. 布局规范

### 6.1 响应式断点

```scss
// 移动端优先
$breakpoints: (
  'sm': 480px,   // 手机横屏
  'md': 768px,   // 平板竖屏
  'lg': 1024px,  // 平板横屏/小桌面
  'xl': 1280px,  // 标准桌面
);
```

### 6.2 栅格系统

```scss
// 卡片网格 (自适应)
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-lg);
}

// 统计卡片行
.stat-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  
  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

// 表单网格
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
  
  .full { grid-column: 1 / -1; }
}
```

### 6.3 导航布局

```scss
// 顶部导航
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
  padding: 0 var(--spacing-lg);
  background: linear-gradient(180deg, var(--color-bg-card) 0%, rgba(22, 25, 34, 0.95) 100%);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}

// 侧边导航
.nav-drawer {
  width: 280px;
  
  @media (max-width: 768px) {
    // 移动端: 覆盖式抽屉
    position: fixed;
    transform: translateX(-100%);
  }
  
  @media (min-width: 1280px) {
    // 大屏: 常驻侧栏
    position: relative;
    transform: none;
  }
}
```

---

## 7. 动效规范

### 7.1 过渡时间

```scss
--transition-fast: 150ms ease;    // 快速反馈 (hover, focus)
--transition-normal: 200ms ease;  // 普通过渡
--transition-slow: 300ms ease;    // 慢速过渡 (抽屉, 展开)
```

### 7.2 常用动效

```scss
// 卡片悬浮
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

// 路由切换
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 加载旋转
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-spinner {
  animation: spin 1s linear infinite;
}

// 脉冲提醒
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.alert-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

### 7.3 动效原则

1. **目的明确**: 每个动效都有明确目的（反馈/引导/过渡）
2. **简洁克制**: 避免过多动效分散注意力
3. **性能优先**: 使用 transform/opacity，避免 layout 抖动
4. **可关闭**: 提供低带宽模式，退化为无动效

---

## 8. 图标规范

### 8.1 图标库

使用 **Font Awesome 6 Free**，通过 CDN 加载：
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
```

### 8.2 常用图标映射

| 功能 | 图标 | Class |
|------|------|-------|
| 仪表盘 | 🎛️ | `fa-gauge-high` |
| 场景 | 📍 | `fa-map-location-dot` |
| 档案 | 🪪 | `fa-id-card` |
| 人物 | 👥 | `fa-users` |
| 关系 | 🔀 | `fa-diagram-project` |
| 变量 | 🗄️ | `fa-database` |
| 绯色 | ❤️ | `fa-heart` |
| 派系 | 🗺️ | `fa-sitemap` |
| 资产 | 💰 | `fa-coins` |
| 暗账 | 🕵️ | `fa-user-secret` |
| 机遇 | ⚖️ | `fa-scale-balanced` |
| 危机 | 💣 | `fa-bomb` |
| 时间 | 🕐 | `fa-clock` / `far fa-clock` |
| 日期 | 📅 | `far fa-calendar-alt` |
| 刷新 | 🔄 | `fa-sync-alt` |
| 保存 | 💾 | `fa-save` |
| 编辑 | ✏️ | `fa-edit` |
| 删除 | 🗑️ | `fa-trash` |
| 添加 | ➕ | `fa-plus` |
| 关闭 | ✖️ | `fa-times` |
| 展开 | ▶️ | `fa-chevron-right` |
| 查看 | 👁️ | `fa-eye` |
| 隐藏 | 🙈 | `fa-eye-slash` |

### 8.3 图标使用规则

```scss
// 卡片标题图标 (金色)
.card-header i {
  color: var(--color-gold);
  margin-right: var(--spacing-sm);
}

// 绯色区域图标
.romance-section i {
  color: var(--color-romance-light);
}

// 按钮图标
.btn i {
  margin-right: 6px;
}

// 统一尺寸
.icon-sm { font-size: 12px; }
.icon-md { font-size: 16px; }
.icon-lg { font-size: 20px; }
```

---

## 9. 特殊模式

### 9.1 敏感信息遮罩

用于把柄、绯色详情等敏感内容：

```scss
.masked-content {
  filter: blur(6px);
  user-select: none;
  transition: filter var(--transition-normal);
  
  &.revealed {
    filter: none;
    user-select: auto;
  }
}

.unmask-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  
  &:hover {
    color: var(--color-text-primary);
  }
}
```

### 9.2 绯色主题变体

绯色互动页面使用特殊主题：

```scss
.theme-romance {
  // 卡片边框
  .card {
    border-color: rgba(196, 30, 58, 0.2);
  }
  
  // 头部渐变
  .card-header {
    background: linear-gradient(135deg, rgba(196, 30, 58, 0.1) 0%, transparent 100%);
  }
  
  // 图标颜色
  .card-header i {
    color: var(--color-romance-light);
  }
}
```

### 9.3 危机/机遇卡片

```scss
// 危机卡片
.crisis-card {
  border-left: 3px solid var(--color-danger);
  background: linear-gradient(90deg, rgba(255, 107, 107, 0.05) 0%, transparent 100%);
}

// 机遇卡片
.opportunity-card {
  border-left: 3px solid var(--color-success);
  background: linear-gradient(90deg, rgba(74, 193, 142, 0.05) 0%, transparent 100%);
}
```

---

## 10. 可访问性

### 10.1 对比度

- 正文对比度 ≥ 4.5:1
- 大文字对比度 ≥ 3:1
- 禁用状态降低饱和度但保持可辨识

### 10.2 键盘导航

```scss
// 焦点样式
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
}

// 禁用默认 outline，使用自定义样式
:focus:not(:focus-visible) {
  outline: none;
}
```

### 10.3 语义化

```html
<!-- 使用 aria-label -->
<button class="refresh-btn" aria-label="刷新数据">
  <i class="fas fa-sync-alt"></i>
</button>

<!-- 使用 role -->
<div role="tablist" class="tab-bar">
  <button role="tab" aria-selected="true">列表</button>
  <button role="tab" aria-selected="false">看板</button>
</div>
```

---

## 11. 设计 Checklist

### 新组件开发

- [ ] 使用 CSS 变量定义颜色
- [ ] 使用间距变量定义间距
- [ ] 响应式设计 (至少支持 600px 以下)
- [ ] hover/focus 状态
- [ ] disabled 状态
- [ ] 加载状态 (如需要)
- [ ] 空状态
- [ ] 键盘可访问

### 新页面开发

- [ ] 统一使用 `.card` 容器
- [ ] 顶部有标题/工具栏
- [ ] 移动端无横向滚动
- [ ] 数据加载有 loading 状态
- [ ] 空数据有提示

