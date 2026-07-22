# 电子贺卡编辑器 (e-card)

> 一个功能强大的 H5 电子贺卡在线制作平台，支持可视化编辑、AI 智能助手、多页面贺卡、丰富模板和便捷导出。

## ✨ 功能特性

### 🎨 可视化编辑器
- 拖拽式操作界面，直观易用
- 支持文本、图片、形状、图标、音频等多种元素
- 丰富的样式编辑（字体、颜色、大小、旋转、渐变、阴影等）
- 元素动画系统（入场、出场、强调动画，支持动画序列管理）
- 图层管理（层级调整、可见性切换、元素锁定）
- 组合与拆分功能
- 对齐工具（左/中/右/上/中/下对齐）
- 撤销/重做（最多 50 步历史记录）
- 键盘快捷键支持

### 📄 多页面贺卡
- 创建、删除、复制页面
- 拖拽排序页面顺序
- 多种页面切换动画（淡入淡出、滑动、缩放、翻转）
- 页面独立背景图/背景色设置
- 页面专属音频支持

### 🤖 AI 智能助手
- 智能问候语生成（支持多种场合）
- AI 配色建议（根据场合推荐色彩方案）
- 布局建议（智能排版推荐）
- AI 模板生成

### 🧩 创意功能
- 拼图卡片模板
- 全局背景音乐管理
- 音乐面板支持

### 🎯 模板系统
- 丰富的模板库
- 多维筛选（13 个行业分类、40+ 场合、26 种风格）
- 模板收藏功能
- 一键从模板创建贺卡

### 👤 用户系统
- 邮箱/手机注册登录
- 邮箱验证
- 密码重置
- 用户反馈提交

### 🔧 管理员后台
- 用户管理（启用/禁用）
- 模板管理（CRUD）
- 贺卡管理
- 标签管理（分类/场合/风格）
- 系统配置（AI 限流等）
- 数据统计看板

### 📤 导出与分享
- PDF 格式导出
- 图片格式导出
- 预览模式

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3.1 | 前端框架 |
| TypeScript | 5.8.3 | 类型安全 |
| Vite | 6.3.5 | 构建工具 |
| Zustand | 5.0.3 | 状态管理 |
| React Router | 7.3.0 | 路由管理 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| Lucide React | 0.511.0 | 图标库 |
| react-colorful | 5.7.0 | 颜色选择器 |
| jsPDF | 4.2.1 | PDF 导出 |
| html2canvas | 1.4.1 | 图片导出 |

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | - | 运行时环境 |
| Express | 4.18.2 | Web 框架 |
| PostgreSQL | 16 | 数据库 |
| JWT | 9.0.2 | 身份认证 |
| bcryptjs | 2.4.3 | 密码加密 |

### AI 集成
| 技术 | 说明 |
|------|------|
| Agnes AI | 智能问候语、配色建议、布局建议、模板生成 |

### 测试工具
| 技术 | 说明 |
|------|------|
| Vitest | 单元测试 |
| Playwright | E2E 测试 |
| Testing Library | 组件测试 |

### 基础设施
| 技术 | 说明 |
|------|------|
| Docker | 容器化部署 PostgreSQL |
| Supabase (可选) | 备选后端方案 |

## 🚀 快速开始

### 前置条件
- Node.js >= 18.x
- npm >= 9.x
- Docker Desktop（用于 PostgreSQL 部署）
- Git（可选）

### 完整安装流程

#### 1. 克隆项目
```bash
git clone <repository-url>
cd e-card
```

#### 2. 启动数据库
```bash
# 复制后端环境变量模板
copy server\.env.example server\.env

# 使用 PowerShell (Windows)
# cp server/.env.example server/.env

# 使用 Git Bash / WSL
# cp server/.env.example server/.env

# 编辑 server\.env，修改以下配置（重要！）：
# POSTGRES_PASSWORD - 设置安全的数据库密码
# JWT_SECRET - 设置足够长的密钥（至少 32 字符）
# AGNES_API_KEY - 替换为真实的 Agnes AI API Key

# 启动 PostgreSQL（Docker）
docker-compose up -d

# 等待数据库就绪（约 10 秒）
docker-compose logs -f postgres
# 看到 "database system is ready to accept connections" 后按 Ctrl+C
```

#### 3. 初始化数据库
```bash
cd server
npm install
npm run migrate
# 执行数据库初始化脚本，创建表结构、索引和初始数据
```

#### 4. 启动后端服务
```bash
npm run dev
# API 服务运行在 http://localhost:3001
```

#### 5. 配置并启动前端
```bash
cd ..

# 复制前端环境变量模板
copy .env.example .env

# 编辑 .env，设置：
# VITE_API_BASE_URL=http://localhost:3001/api
# VITE_USE_REAL_DB=true

npm install
npm run dev
# 前端运行在 http://localhost:5173
```

#### 6. 访问系统
| 服务 | 地址 | 账号 |
|------|------|------|
| 前端应用 | http://localhost:5173 | - |
| 管理后台 | http://localhost:5173/admin | admin@ecard.com / password |
| API 服务 | http://localhost:3001 | - |
| pgAdmin | http://localhost:5050 | admin@ecard.com / admin123 |

> ⚠️ **安全提示**：生产环境必须修改所有默认密码和密钥！

### Mock 模式（可选）

无需后端服务即可进行前端开发：

```bash
# 在 .env 中设置
VITE_USE_REAL_DB=false

# 仅启动前端
npm install
npm run dev
```

## 📁 项目结构

```
e-card/
├── src/                              # 前端源码
│   ├── components/                   # 组件目录
│   │   ├── admin/                    # 管理后台组件
│   │   │   └── AdminLayout.tsx       # 后台布局
│   │   ├── ai/                       # AI 功能组件
│   │   │   ├── AIColorSuggestions.tsx
│   │   │   ├── AIGreetingPanel.tsx
│   │   │   ├── AILayoutSuggestions.tsx
│   │   │   ├── AIRecommendBar.tsx
│   │   │   ├── AITemplateGenerator.tsx
│   │   │   └── AITextActions.tsx
│   │   ├── common/                   # 公共组件
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Header.tsx
│   │   ├── editor/                   # 编辑器组件
│   │   │   ├── Canvas.tsx            # 画布
│   │   │   ├── ComponentPicker.tsx   # 组件选择器
│   │   │   ├── ComponentPropertyEditor.tsx
│   │   │   ├── ComponentRenderer.tsx
│   │   │   ├── EditorSidebar.tsx    # 侧边栏
│   │   │   ├── ImageCropperModal.tsx
│   │   │   ├── LayersPanel.tsx       # 图层面板
│   │   │   ├── MusicPanel.tsx        # 音乐面板
│   │   │   ├── PageSettingsPanel.tsx # 页面设置
│   │   │   ├── PageThumbnail.tsx
│   │   │   ├── PagesPanel.tsx        # 页面管理
│   │   │   ├── PropertyPanel.tsx     # 属性面板
│   │   │   ├── PuzzleCellCropperModal.tsx
│   │   │   ├── PuzzleTemplateModal.tsx
│   │   │   └── puzzleTemplates.tsx
│   │   └── templates/                # 模板组件
│   │       ├── FilterPanel.tsx       # 筛选面板
│   │       └── TemplateCard.tsx       # 模板卡片
│   ├── pages/                        # 页面组件
│   │   ├── admin/                    # 管理后台页面
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── CardManagementPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LabelManagementPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── TemplateEditorPage.tsx
│   │   │   ├── TemplateManagementPage.tsx
│   │   │   └── UserManagementPage.tsx
│   │   ├── EditorPage.tsx            # 编辑器主页面
│   │   ├── ExportPage.tsx            # 导出页面
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── HomePage.tsx              # 首页
│   │   ├── LoginPage.tsx             # 登录页
│   │   ├── PreviewPage.tsx           # 预览页
│   │   ├── RegisterPage.tsx          # 注册页
│   │   ├── TemplateLibrary.tsx       # 模板库
│   │   ├── UserProfile.tsx           # 用户中心
│   │   └── VerificationSentPage.tsx
│   ├── store/                        # Zustand 状态管理
│   │   └── index.ts                  # Editor/Templates/User Store
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useTheme.ts
│   ├── lib/                          # 工具库
│   │   ├── ai.ts                     # AI API 封装
│   │   ├── clipPathUtils.ts
│   │   ├── elementStyle.ts
│   │   ├── fonts.ts
│   │   └── utils.ts
│   ├── utils/                        # 工具函数
│   │   ├── export.ts                 # 导出工具
│   │   └── supabase.ts               # Supabase 客户端（可选）
│   ├── data/                         # Mock 数据
│   │   └── mockTemplates.ts
│   ├── tests/                        # 单元测试
│   │   ├── setup.ts
│   │   ├── store.test.ts
│   │   ├── editorStoreEdgeCases.test.ts
│   │   ├── templatesStore.test.ts
│   │   ├── userStore.test.ts
│   │   ├── elementStyle.test.ts
│   │   ├── colorPicker.test.tsx
│   │   └── rateLimiter.test.ts
│   ├── types/                        # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx                       # 应用入口组件
│   ├── main.tsx                      # 主入口文件
│   ├── index.css                     # 全局样式
│   └── vite-env.d.ts
├── server/                           # 后端服务
│   ├── server.js                     # Express 主服务
│   ├── aiRoutes.js                   # AI 路由
│   ├── rateLimiter.js                # API 限流中间件
│   ├── configService.js              # 动态配置服务
│   ├── simple-server.js              # 简化版服务（备用）
│   ├── .env.example                  # 后端环境变量模板
│   ├── package.json
│   └── scripts/
│       ├── migrate.js                # 数据库迁移脚本
│       └── download-fonts.js          # 字体下载脚本
├── db/                               # 数据库 SQL 脚本
│   └── init/
│       ├── 01-schema.sql             # 主表结构
│       ├── 02-update-templates.sql   # 模板更新
│       ├── 03-fonts.sql              # 字体数据
│       └── 04-system-configs.sql     # 系统配置
├── docs/                             # 技术文档
│   ├── rate-limiting.md              # 限流功能说明
│   └── system-configs.md             # 系统配置说明
├── e2e/                              # E2E 测试
│   ├── animation.spec.ts
│   ├── editor.spec.ts
│   └── text-styles.spec.ts
├── public/                           # 静态资源
│   ├── fonts/                        # 字体文件
│   └── favicon.svg
├── docker-compose.yml                # Docker 配置
├── .env.example                      # 前端环境变量模板
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## 📝 使用命令

### 前端命令
```bash
npm run dev              # 启动开发服务器（Vite）
npm run build            # 构建生产版本
npm run preview          # 预览构建结果
npm run lint             # 代码检查（ESLint）
npm run check            # TypeScript 类型检查
npm run test             # 运行单元测试（Vitest）
npm run test:watch       # 监听模式运行测试
npm run test:coverage    # 运行测试并生成覆盖率报告
npm run test:e2e         # 运行 E2E 测试（Playwright）
```

### 后端命令（在 server 目录）
```bash
cd server
npm run dev              # 启动后端开发服务器（带热重载）
npm run start            # 生产模式运行
npm run migrate          # 执行数据库迁移
npm run download-fonts   # 下载字体文件
```

## 🔧 配置说明

### 前端环境变量 (.env)
```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:3001/api

# 是否使用真实数据库
# true  - 连接后端 API
# false - 使用 Mock 数据（无需后端）
VITE_USE_REAL_DB=false

# Supabase 配置（可选，备选方案）
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 后端环境变量 (server/.env)
```env
# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ecard
POSTGRES_USER=ecard
POSTGRES_PASSWORD=your_secure_password_change_this

# API 服务配置
PORT=3001
NODE_ENV=development

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars
JWT_EXPIRES=7d

# AI 服务配置
AGNES_API_KEY=your_agnes_api_key_here
AGNES_API_BASE_URL=https://apihub.agnes-ai.com/v1
```

### Docker 配置
```bash
# 启动 PostgreSQL
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f postgres
```

## 📊 数据库

### 核心表结构
| 表名 | 说明 |
|------|------|
| users | 用户表（邮箱/手机登录、管理员、禁用状态） |
| templates | 模板表（支持多页、多分类筛选） |
| cards | 贺卡表（用户创建的贺卡） |
| favorites | 收藏表（用户收藏的模板） |
| template_categories | 模板分类（13 个行业） |
| template_occasions | 模板场合（40+ 场合） |
| template_styles | 模板风格（26 种风格） |
| sms_codes | 短信验证码 |
| feedbacks | 用户反馈 |
| system_configs | 系统配置（动态可扩展） |
| admin_action_logs | 管理员操作日志 |

### 初始化
首次部署自动执行 `db/init/` 下的 SQL 脚本，创建表结构、索引和初始数据：
- 默认管理员账号：admin@ecard.com / password
- 5 个示例模板

详细数据库部署说明请查看 [DB-DEPLOYMENT.md](./DB-DEPLOYMENT.md)

## 🧪 测试

### 单元测试
```bash
npm run test            # 运行所有单元测试
npm run test:watch      # 监听模式
npm run test:coverage  # 生成覆盖率报告
```

测试文件位于 `src/tests/`：
- `store.test.ts` - Zustand Store 基础测试
- `editorStoreEdgeCases.test.ts` - 编辑器边界场景
- `templatesStore.test.ts` - 模板状态管理
- `userStore.test.ts` - 用户状态管理
- `elementStyle.test.ts` - 元素样式工具
- `colorPicker.test.tsx` - 颜色选择器组件
- `rateLimiter.test.ts` - 限流逻辑

### E2E 测试
```bash
npm run test:e2e        # 运行 Playwright E2E 测试
```

E2E 测试文件位于 `e2e/`：
- `editor.spec.ts` - 编辑器功能流程
- `animation.spec.ts` - 动画相关功能
- `text-styles.spec.ts` - 文本样式功能

### 测试覆盖率
执行 `npm run test:coverage` 后，覆盖率报告生成在 `coverage/` 目录。

## 📚 相关文档

- [数据库部署指南](./DB-DEPLOYMENT.md) - PostgreSQL 完整部署流程
- [API 限流功能说明](./docs/rate-limiting.md) - AI API 限流机制
- [系统配置说明](./docs/system-configs.md) - 动态配置管理
- [开发文档](./电子贺卡编辑器开发文档.md) - 详细技术设计文档

## ❓ 常见问题

### Q1: Docker 启动失败怎么办？
```bash
# 检查 Docker 状态
docker info

# 如果是 Windows，确保：
# 1. Docker Desktop 已启动
# 2. WSL2 已启用
# 3. 没有其他容器占用 5432 端口

# 重启 Docker Desktop
```

### Q2: 数据库连接失败？
```bash
# 检查端口是否被占用
netstat -an | findstr 5432

# 查看容器日志
docker-compose logs postgres

# 确认 server/.env 中的密码与 docker-compose.yml 一致
```

### Q3: 前端启动后无法连接后端？
```bash
# 1. 确认后端正在运行（访问 http://localhost:3001）
# 2. 检查 .env 中的 VITE_API_BASE_URL 配置
# 3. 检查浏览器控制台是否有 CORS 错误
# 4. 如果使用 Mock 模式，VITE_USE_REAL_DB 设为 false
```

### Q4: AI 功能无法使用？
```bash
# 1. 确认 Agnes API Key 已正确配置（server/.env）
# 2. 检查 API Key 是否有效
# 3. 检查网络连接是否能访问 https://apihub.agnes-ai.com
# 4. AI 功能需要后端服务运行
```

### Q5: 如何重置数据库？
```bash
# 警告：此操作会删除所有数据！
docker-compose down -v
docker-compose up -d
cd server
npm run migrate
```

### Q6: pgAdmin 无法访问？
```bash
# 确认容器正在运行
docker-compose ps

# 首次访问使用：
# URL: http://localhost:5050
# 邮箱: admin@ecard.com
# 密码: admin123
```

### Q7: 为什么选择 Express + PostgreSQL 而不是纯 Supabase？
本项目支持两种后端方案：
- **主方案（推荐）**：Express + PostgreSQL - 功能完整、性能好、适合生产
- **备选方案**：Supabase - 快速原型开发，无需自建服务器

### Q8: 如何自定义模板分类/场合/风格？
通过管理员后台：
1. 登录 http://localhost:5173/admin
2. 进入「标签管理」
3. 添加/编辑/删除分类、场合、风格标签

## 🌐 浏览器支持

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome / Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

> 推荐使用最新版 Chrome 或 Edge 获得最佳体验。

## 🚀 生产部署

### 1. 前端部署
```bash
npm run build
# 将 dist 目录部署到静态服务器（Nginx、Vercel 等）
```

### 2. 后端部署
```bash
cd server
npm install
# 使用 PM2 管理进程
npm install -g pm2
pm2 start server.js --name ecard-api
pm2 startup
pm2 save
```

### 3. 生产环境安全检查清单
- [ ] 修改所有默认密码
- [ ] 设置安全的 JWT_SECRET（至少 32 字符随机字符串）
- [ ] 使用 HTTPS
- [ ] 配置 CORS 白名单域名
- [ ] 设置正确的 NODE_ENV=production
- [ ] .env 文件加入 .gitignore（已配置）

## 🤝 贡献指南

欢迎贡献代码！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS
- 新增功能需添加单元测试
- 公共工具函数需添加 JSDoc 注释

### 提交规范
遵循 Conventional Commits：
```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 📄 许可证

本项目采用 [MIT License](./LICENSE)。

## 💬 问题反馈

如果遇到问题或有建议：
1. 查看本文档的「常见问题」章节
2. 查看 [DB-DEPLOYMENT.md](./DB-DEPLOYMENT.md) 和 `docs/` 目录
3. 提交 GitHub Issue

## 🙏 致谢

感谢所有贡献者和开源社区！

---

**有问题？** 欢迎提交 Issue 或联系维护者。
