# 系统配置表结构设计文档

## 概述

`system_configs` 表是一个通用的系统配置存储表，用于存储包括大模型API限流配置在内的各类系统参数。设计目标为具有良好的可扩展性，未来新增配置项无需修改表结构。

## 表结构

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | 主键 |
| `key` | VARCHAR(100) | NOT NULL, UNIQUE | 配置键，用于程序读取的唯一标识 |
| `value` | TEXT | NOT NULL, DEFAULT '' | 配置值（字符串形式存储） |
| `description` | TEXT | 可空 | 配置描述，说明该配置的用途 |
| `type` | VARCHAR(50) | NOT NULL, DEFAULT 'string' | 数据类型，用于值的类型转换 |
| `group_name` | VARCHAR(50) | DEFAULT 'general' | 分组名称，便于按模块管理 |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 更新时间（由触发器自动更新） |

## 索引

| 索引名 | 类型 | 字段 |
|--------|------|------|
| `idx_system_configs_key` | BTREE | `key` |
| `idx_system_configs_group` | BTREE | `group_name` |

## 触发器

`update_system_configs_updated_at`：在 UPDATE 操作时自动更新 `updated_at` 字段。

## 支持的数据类型

| type 值 | 说明 | 转换规则 |
|---------|------|---------|
| `string` | 字符串 | 直接返回字符串 |
| `integer` / `int` | 整数 | `parseInt(value, 10)` |
| `float` / `number` | 浮点数 | `parseFloat(value)` |
| `boolean` / `bool` | 布尔值 | 'true'/'1' → true, 'false'/'0' → false |
| `json` | JSON对象 | `JSON.parse(value)` |

## 预置配置项

| key | value | type | group_name | description |
|-----|-------|------|------------|-------------|
| `model_api_rate_limit` | 20 | integer | ai | 大模型API调用频率限制(rpm) |

## 扩展指南

### 添加新的配置项

直接在 `system_configs` 表中 INSERT 新记录即可，无需修改表结构：

```sql
INSERT INTO system_configs (key, value, description, type, group_name)
VALUES ('new_config_key', 'default_value', '配置说明', 'string', 'system');
```

### 推荐的 group_name 分组

| group_name | 用途 | 示例配置 |
|------------|------|---------|
| `ai` | AI 服务相关 | model_api_rate_limit, ai_model, ai_temperature |
| `system` | 系统参数 | site_name, maintenance_mode |
| `security` | 安全设置 | max_login_attempts, password_min_length |
| `email` | 邮件服务 | smtp_host, smtp_port, smtp_user |
| `general` | 通用配置 | 其他未分类配置 |

## 代码接口

### 后端 (Node.js/Express)

```javascript
import { getConfig, setConfig, getAllConfigs, getConfigsByGroup, onConfigChanged } from './configService.js';

// 读取配置（带缓存），失败时返回默认值
const limit = await getConfig('model_api_rate_limit', 20);

// 更新配置（立即清除缓存，通知监听者）
await setConfig('model_api_rate_limit', '50', { description: '新描述' });

// 获取所有配置
const allConfigs = await getAllConfigs();

// 按分组获取
const aiConfigs = await getConfigsByGroup('ai');

// 监听配置变更
onConfigChanged('model_api_rate_limit', (newValue) => {
  console.log('限流值已更新为:', newValue);
});
```

### 前端 (React/TypeScript)

```typescript
import { admin } from '../utils/supabase';

// 获取所有配置
const { data } = await admin.getConfigs();

// 获取单个配置
const { data } = await admin.getConfig('model_api_rate_limit');

// 更新配置（实时生效，无需重启）
const { data } = await admin.updateConfig('model_api_rate_limit', {
  value: '50',
});
```

## 性能说明

- 配置服务使用**内存缓存**，默认 TTL 为 60 秒
- 配置更新时**立即清除缓存**，确保下次读取获取最新值
- 数据库查询失败时**返回默认值**，确保系统可用性
- 适合**低频读取**的配置场景，不适合高频率变化的配置
