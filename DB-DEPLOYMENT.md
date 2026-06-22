# 电子贺卡系统 - PostgreSQL 数据库部署指南

## 目录

- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [数据库表结构](#数据库表结构)
- [API 接口文档](#api-接口文档)
- [常见问题](#常见问题)

---

## 快速开始

### 1. 启动数据库（5分钟）

```bash
# 进入项目目录
cd e:\workspaceForTrae\e-card

# 复制环境变量配置
copy server\.env.example server\.env

# 启动 PostgreSQL 和 pgAdmin
docker-compose up -d

# 安装 API 服务依赖
cd server
npm install

# 初始化数据库
npm run migrate

# 启动 API 服务
npm run dev
```

### 2. 配置前端

```bash
# 回到项目根目录
cd ..

# 复制环境变量配置
copy .env.example .env

# 编辑 .env，设置：
# VITE_API_BASE_URL=http://localhost:3001/api

# 启动前端
npm run dev
```

### 3. 访问系统

| 服务 | 地址 | 账号 |
|------|------|------|
| 前端 | http://localhost:5173 | - |
| API | http://localhost:3001 | - |
| pgAdmin | http://localhost:5050 | admin@ecard.com / admin123 |

**默认管理员账号**: admin@ecard.com / password

---

## 详细部署步骤

### 环境要求

- Docker Desktop (Windows)
- Node.js 18+
- 2GB+ 内存

### 步骤 1: 安装 Docker

1. 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 安装并启动 Docker Desktop
3. 确保 WSL2 已启用（Windows）

### 步骤 2: 配置环境变量

编辑 `server\.env` 文件：

```env
POSTGRES_PASSWORD=your_secure_password_change_this
```

### 步骤 3: 启动服务

```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# 等待数据库就绪（约10秒）
docker-compose logs -f postgres
# 看到 "database system is ready to accept connections" 后按 Ctrl+C

# 初始化数据库
cd server
npm install
npm run migrate
```

### 步骤 4: 启动 API 服务

```bash
# 在 server 目录下
npm run dev
```

### 步骤 5: 更新前端配置

编辑 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_USE_REAL_DB=true
```

---

## 数据库表结构

### 1. users (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | VARCHAR | 邮箱（唯一） |
| phone | VARCHAR | 手机号（唯一） |
| password_hash | VARCHAR | 密码哈希 |
| name | VARCHAR | 用户名 |
| is_admin | BOOLEAN | 是否管理员 |
| is_disabled | BOOLEAN | 是否禁用 |
| is_email_verified | BOOLEAN | 邮箱已验证 |
| is_phone_verified | BOOLEAN | 手机已验证 |
| created_at | TIMESTAMP | 创建时间 |

### 2. templates (模板表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR | 模板名称 |
| category | VARCHAR | 分类 |
| occasion | VARCHAR | 场合 |
| style | VARCHAR | 风格 |
| pages | JSONB | 多页内容 |
| background_music_url | TEXT | 背景音乐 |
| is_featured | BOOLEAN | 是否推荐 |
| usage_count | INTEGER | 使用次数 |

### 3. cards (贺卡表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID |
| template_id | UUID | 模板ID |
| title | VARCHAR | 贺卡标题 |
| pages | JSONB | 多页内容 |
| background_music_url | TEXT | 背景音乐 |
| is_public | BOOLEAN | 是否公开 |
| created_at | TIMESTAMP | 创建时间 |

### 4. favorites (收藏表)

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 用户ID |
| template_id | UUID | 模板ID |
| created_at | TIMESTAMP | 收藏时间 |

---

## API 接口文档

### 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/sms/send | 发送短信验证码 | 否 |
| POST | /api/auth/sms/verify | 验证短信登录 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |

### 模板接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/templates | 获取模板列表 | 否 |
| GET | /api/templates/:id | 获取单个模板 | 否 |

### 贺卡接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/cards | 获取我的贺卡 | 是 |
| POST | /api/cards | 创建贺卡 | 是 |
| PUT | /api/cards/:id | 更新贺卡 | 是 |
| DELETE | /api/cards/:id | 删除贺卡 | 是 |

### 收藏接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/favorites | 获取收藏列表 | 是 |
| POST | /api/favorites | 添加收藏 | 是 |
| DELETE | /api/favorites/:templateId | 取消收藏 | 是 |

### 管理接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/admin/users | 获取用户列表 | 管理员 |
| PUT | /api/admin/users/:id | 更新用户 | 管理员 |
| DELETE | /api/admin/users/:id | 删除用户 | 管理员 |
| GET | /api/admin/stats | 获取统计数据 | 管理员 |

---

## 常见问题

### Q: Docker 启动失败？

```bash
# 检查 Docker 状态
docker info

# 重启 Docker Desktop
# 或在 PowerShell 中运行
 Restart-Service docker
```

### Q: 数据库连接失败？

```bash
# 检查端口是否被占用
netstat -an | findstr 5432

# 查看容器日志
docker-compose logs postgres
```

### Q: 迁移脚本执行失败？

```bash
# 确保 PostgreSQL 已完全启动
docker-compose logs postgres

# 手动执行 SQL
docker-compose exec postgres psql -U ecard -d ecard -f /docker-entrypoint-initdb.d/01-schema.sql
```

### Q: 如何备份数据库？

```bash
# 创建备份
docker-compose exec postgres pg_dump -U ecard ecard > backup_$(date +%Y%m%d).sql

# 恢复备份
docker-compose exec -T postgres psql -U ecard ecard < backup_20240101.sql
```

### Q: 如何查看数据库内容？

使用 pgAdmin:
1. 访问 http://localhost:5050
2. 登录: admin@ecard.com / admin123
3. 添加服务器连接:
   - Host: postgres (容器内) 或 localhost (宿主机)
   - Port: 5432
   - Database: ecard
   - User: ecard
   - Password: (你设置的密码)

---

## 生产部署建议

### 1. 修改默认密码

```env
POSTGRES_PASSWORD=your-very-secure-production-password
JWT_SECRET=your-very-long-random-secret-key-minimum-32-chars
```

### 2. 启用 HTTPS

在生产环境中，建议使用 Nginx 反向代理并启用 HTTPS。

### 3. 定期备份

```bash
# 每天凌晨3点自动备份 (Linux/Mac)
0 3 * * * docker-compose exec postgres pg_dump -U ecard ecard > /backups/ecard_$(date +\%Y\%m\%d).sql
```

### 4. 监控

建议使用 [pgAdmin](https://www.pgadmin.org/) 或 [DataGrip](https://www.jetbrains.com/datagrip/) 监控数据库性能。

---

## 目录结构

```
e-card/
├── docker-compose.yml          # Docker 配置
├── .env                        # 环境变量
├── db/
│   ├── init/
│   │   └── 01-schema.sql      # 数据库初始化脚本
│   └── backup/                 # 备份目录
├── server/
│   ├── server.js              # API 服务器
│   ├── package.json
│   ├── .env.example
│   └── scripts/
│       └── migrate.js         # 迁移脚本
└── src/                        # 前端代码
```

---

**有问题？** 欢迎提交 Issue！
