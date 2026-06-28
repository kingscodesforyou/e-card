# 动画页签组件重实现计划

## 1. 需求分析

根据用户提供的UI设计规范和业务需求，动画页签组件需要实现以下功能：

### 1.1 核心功能

* 支持单个元素选择并应用**多个动画效果**

* 确保选中的动画效果**严格按照用户选择的顺序依次连续播放**

* 提供直观的动画列表排序功能，允许用户通过**拖拽或上下移动按钮**调整动画顺序

### 1.2 界面组件要求

* 组件顶部固定放置两个操作按钮：**"添加动画"** 和 **"预览动画"**

* **"添加动画"按钮**：点击后弹出模态窗口，展示所有可选动画效果列表，用户选择一项后关闭弹窗并将选中动画添加至当前序列

* **"预览动画"按钮**：点击后按当前设定顺序完整播放所有已选择的动画效果

### 1.3 视觉与交互规范

* 动画之间的过渡效果流畅自然，无明显卡顿或跳变

* 用户界面设计符合直观易用原则

* 整体视觉风格与项目现有UI设计保持一致（颜色、字体、间距等）

### 1.4 质量要求

* 组件具备良好的响应式设计，适配不同屏幕尺寸

* 动画播放性能优化

* 提供清晰的视觉反馈（动画选中状态、排序位置变化等）

***

## 2. 技术方案

### 2.1 类型定义扩展

需要在 `src/types/index.ts` 中添加动画序列相关的类型定义：

```typescript
// 单个动画配置
export interface ElementAnimation {
  id: string;
  name: string;           // 动画名称（如：淡入、缩放等）
  cssClass: string;       // CSS动画类名
  duration: number;       // 动画时长（毫秒）
  delay: number;          // 延迟时间（毫秒）
  iterationCount: number | 'infinite';  // 重复次数
}

// 扩展 CardElement，支持多动画序列
export interface CardElement {
  // ... 现有字段
  animations: ElementAnimation[];  // 动画序列
}
```

### 2.2 动画效果分类

根据用户提供的UI设计，动画分为三个类别：

| 类别     | 动画名称  | CSS类名          |
| ------ | ----- | -------------- |
| **进入** | 淡入    | fadeIn         |
| <br /> | 向右移入  | slideInRight   |
| <br /> | 向左移入  | slideInLeft    |
| <br /> | 向上移入  | slideInUp      |
| <br /> | 向下移入  | slideInDown    |
| <br /> | 翻转进入  | flipIn         |
| <br /> | 向右弹入  | bounceInRight  |
| <br /> | 向左弹入  | bounceInLeft   |
| <br /> | 向上弹入  | bounceInUp     |
| <br /> | 向下弹入  | bounceInDown   |
| <br /> | 翻翻开进入 | flipOpenIn     |
| <br /> | 向左翻滚  | rollInLeft     |
| <br /> | 向上翻滚  | rollInUp       |
| <br /> | 向右翻滚  | rollInRight    |
| <br /> | 向下翻滚  | rollInDown     |
| <br /> | 中心弹入  | bounceInCenter |
| <br /> | 光速向右  | speedInRight   |
| <br /> | 光速向左  | speedInLeft    |
| <br /> | 光速向上  | speedInUp      |
| <br /> | 光速向下  | speedInDown    |
| <br /> | 中心放大  | scaleCenter    |
| <br /> | 魔幻向右  | magicRight     |
| <br /> | 魔幻向左  | magicLeft      |
| <br /> | 魔幻向上  | magicUp        |
| <br /> | 魔幻向下  | magicDown      |
| <br /> | 缩小进入  | shrinkIn       |
| <br /> | 向左旋转  | rotateInLeft   |
| <br /> | 向右旋转  | rotateInRight  |
| <br /> | 向上旋转  | rotateInUp     |
| <br /> | 向下旋转  | rotateInDown   |
| **强调** | 闪烁    | flash          |
| <br /> | 脉冲    | pulse          |
| <br /> | 抖动    | shake          |
| <br /> | 弹跳    | bounce         |
| <br /> | 摇摆    | swing          |
| <br /> | 旋转    | spin           |
| <br /> | 缩放强调  | scaleEmphasis  |
| **退出** | 淡出    | fadeOut        |
| <br /> | 滑出向右  | slideOutRight  |
| <br /> | 滑出向左  | slideOutLeft   |
| <br /> | 滑出向上  | slideOutUp     |
| <br /> | 滑出向下  | slideOutDown   |

### 2.3 Store 方法扩展

在 `src/store/index.ts` 中添加动画序列管理方法：

* `addAnimation(elementId: string, animation: Omit<ElementAnimation, 'id'>)` - 添加动画到元素

* `removeAnimation(elementId: string, animationId: string)` - 从元素移除动画

* `updateAnimation(elementId: string, animationId: string, updates: Partial<ElementAnimation>)` - 更新动画配置

* `reorderAnimations(elementId: string, startIndex: number, endIndex: number)` - 重新排序动画

### 2.4 组件结构设计

```
AnimationPanel
├── Header
│   ├── Button: 添加动画 (+)
│   └── Button: 预览动画 (▶)
├── AnimationList
│   ├── AnimationItem (可拖拽)
│   │   ├── DragHandle (拖拽手柄)
│   │   ├── AnimationName (动画名称)
│   │   ├── Controls
│   │   │   ├── Button: ↑ (上移)
│   │   │   ├── Button: ↓ (下移)
│   │   │   ├── Button: ▶ (播放单个)
│   │   │   └── Button: ✕ (删除)
│   │   └── Settings (展开/收起)
│   │       ├── Input: 时长
│   │       ├── Input: 延迟
│   │       └── Select: 重复次数
│   └── EmptyState (无动画时显示)
└── AnimationModal (添加动画弹窗)
    ├── Tabs: 进入 / 强调 / 退出
    └── Grid: 动画效果选择
```

***

## 3. 文件修改清单

| 文件路径                                      | 修改内容                                      |
| ----------------------------------------- | ----------------------------------------- |
| `src/types/index.ts`                      | 添加 `ElementAnimation` 接口，扩展 `CardElement` |
| `src/store/index.ts`                      | 添加动画序列管理方法                                |
| `src/components/editor/PropertyPanel.tsx` | 重写 `AnimationTab` 组件                      |
| `src/index.css`                           | 添加所有动画的 CSS 关键帧定义                         |
| `src/tests/animation.test.ts`             | 新增动画相关单元测试                                |

***

## 4. 实现步骤

### 步骤 1: 扩展类型定义（0.5天）

* 在 `src/types/index.ts` 中添加 `ElementAnimation` 接口

* 更新 `CardElement` 接口，添加 `animations` 字段

### 步骤 2: 添加动画 CSS（0.5天）

* 在 `src/index.css` 中添加所有动画关键帧定义

### 步骤 3: 扩展 Store（1天）

* 添加动画管理的四个方法

* 确保历史记录正确保存

### 步骤 4: 重写 AnimationTab 组件（2天）

* 实现动画列表展示

* 实现拖拽排序功能

* 实现上下移动按钮

* 实现添加动画弹窗

* 实现预览动画功能

* 实现单个动画配置编辑

### 步骤 5: 编写单元测试（1天）

* 测试动画添加、删除、排序功能

* 测试动画序列播放逻辑

***

## 5. 依赖与风险

### 5.1 依赖

* 项目已使用 TailwindCSS 3，无需额外样式框架

* 拖拽功能使用原生 HTML5 Drag & Drop API，无需额外依赖

### 5.2 风险评估

| 风险         | 等级 | 缓解措施                  |
| ---------- | -- | --------------------- |
| 动画序列播放同步问题 | 高  | 使用 Promise 链式调用确保顺序播放 |
| 拖拽排序性能问题   | 中  | 使用虚拟列表或限制列表长度         |
| 状态同步问题     | 中  | 使用 Zustand 的状态管理确保一致性 |

***

## 6. 测试计划

### 6.1 单元测试覆盖

* 动画添加功能测试

* 动画删除功能测试

* 动画排序功能测试

* 动画配置更新测试

* 动画序列播放顺序测试

### 6.2 E2E 测试覆盖

* 添加动画流程测试

* 拖拽排序测试

* 预览动画功能测试

***

## 7. 代码规范

* 遵循项目现有的代码风格（使用 TailwindCSS 类名）

* 使用 TypeScript 严格模式

* 添加必要的 JSDoc 注释

* 函数和变量命名采用 camelCase 风格

* 组件文件不超过 500 行，超过则拆分

