# 电子贺卡编辑器 (e-card)

一个基于 React + TypeScript 的电子贺卡在线制作平台，支持可视化编辑、多页面贺卡制作、模板管理、预览导出等功能。

## 功能特性

### 🎨 编辑器核心功能
- 支持文本、图片、形状、图标等多种元素
- 拖拽式操作，直观易用
- 丰富的样式编辑（字体、颜色、大小、旋转等）
- 撤销/重做功能（最多50步历史记录）

### 📄 多页面管理
- 创建、删除、复制页面
- 拖拽排序页面顺序
- 多种页面切换动画（淡入淡出、滑动、缩放、翻转）

### 🎵 背景与音乐
- 页面背景颜色和图片设置
- 全局背景音乐管理
- 页面专属音频支持

### 📚 模板系统
- 丰富的模板库
- 分类筛选（类别、场合、风格）
- 一键从模板创建贺卡

### 👤 用户系统
- 邮箱注册/登录
- 邮箱验证
- 密码重置

### 🔧 管理员后台
- 用户管理
- 模板管理
- 贺卡管理
- 统计数据

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.8.3 | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| Zustand | 5.0.3 | 状态管理 |
| React Router | 7.3.0 | 路由管理 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Lucide React | 0.511.0 | 图标库 |
| Supabase | 2.108.2 | 后端服务 |
| jsPDF | 4.2.1 | PDF导出 |
| html2canvas | 1.4.1 | 图片导出 |

## 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 Supabase 和 API 地址。

### 启动开发服务器

```bash
npm run dev
```

### Mock模式

无需后端服务即可开发：

```bash
# 在 .env 中设置
VITE_USE_MOCK=true
```

## 项目结构

```
e-card/
├── src/                    # 前端源码
│   ├── components/         # 组件目录
│   │   ├── admin/          # 管理后台组件
│   │   ├── common/         # 公共组件
│   │   ├── editor/         # 编辑器组件
│   │   └── templates/      # 模板组件
│   ├── pages/              # 页面组件
│   ├── store/              # 状态管理
│   ├── hooks/              # 自定义Hooks
│   ├── utils/              # 工具函数
│   └── types/              # TypeScript类型定义
├── server/                 # 后端服务
├── db/                     # 数据库脚本
└── supabase/               # Supabase配置
```

## 命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 代码检查
npm test             # 运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

## 部署

### 前端部署

```bash
npm run build
# 将 dist 目录部署到静态服务器
```

### 后端部署

```bash
cd server
npm install
npm run dev
```

## 测试

项目使用 Vitest 进行单元测试，测试文件位于 `src/tests/` 目录