# 电子贺卡制作网站 - 注册登录完善与后台管理功能 PRD

## Overview
- **Summary**: 完善现有注册和登录功能，添加管理员后台管理系统，包括用户管理、模板管理、贺卡管理等功能。
- **Purpose**: 提升用户认证体验，提供管理员对网站内容和用户的管理能力。
- **Target Users**: 普通用户（注册登录）、管理员（后台管理）

## Goals
- 完善用户注册登录功能，包括密码找回、邮箱验证、社交登录等
- 实现管理员后台管理系统
- 提供用户管理、模板管理、贺卡管理功能
- 增强系统安全性

## Non-Goals (Out of Scope)
- 第三方支付集成
- 高级数据分析仪表盘
- 多租户架构

## Background & Context
当前系统已有基础的注册登录功能，但缺少密码找回、邮箱验证等完善功能。同时缺少管理员后台管理能力，需要添加完整的后台管理系统。

## Functional Requirements
- **FR-1**: 用户注册功能完善（邮箱验证、密码强度要求）
- **FR-2**: 用户登录功能完善（密码找回、记住我、社交登录）
- **FR-3**: 管理员登录功能
- **FR-4**: 用户管理（查看、禁用、删除用户）
- **FR-5**: 模板管理（添加、编辑、删除模板）
- **FR-6**: 贺卡管理（查看用户贺卡、删除违规贺卡）
- **FR-7**: 管理员权限控制

## Non-Functional Requirements
- **NFR-1**: 密码必须加密存储（BCrypt）
- **NFR-2**: 登录失败5次后账号锁定15分钟
- **NFR-3**: 后台管理页面响应时间 < 200ms
- **NFR-4**: 管理员操作日志记录

## Constraints
- **Technical**: React + TypeScript + Supabase
- **Business**: 需要区分普通用户和管理员角色
- **Dependencies**: Supabase Auth 和 Database

## Assumptions
- 管理员账号由系统管理员手动创建
- 邮箱服务已配置（用于发送验证邮件和密码找回邮件）

## Acceptance Criteria

### AC-1: 用户注册带邮箱验证
- **Given**: 用户访问注册页面
- **When**: 用户填写邮箱、用户名、密码并提交
- **Then**: 系统发送验证邮件到用户邮箱，用户点击链接后激活账号
- **Verification**: `programmatic`
- **Notes**: 未验证的用户无法登录

### AC-2: 密码强度验证
- **Given**: 用户在注册或修改密码时
- **When**: 用户输入密码
- **Then**: 系统验证密码强度（至少8位，包含大小写字母和数字）
- **Verification**: `programmatic`

### AC-3: 密码找回功能
- **Given**: 用户忘记密码
- **When**: 用户点击"忘记密码"并输入注册邮箱
- **Then**: 系统发送密码重置链接到邮箱
- **Verification**: `programmatic`

### AC-4: 管理员登录
- **Given**: 管理员访问登录页面
- **When**: 管理员输入正确的管理员账号密码
- **Then**: 管理员进入后台管理系统
- **Verification**: `programmatic`

### AC-5: 用户列表管理
- **Given**: 管理员在后台管理页面
- **When**: 管理员查看用户列表
- **Then**: 显示所有用户，支持搜索和筛选，可禁用/启用用户
- **Verification**: `human-judgment`

### AC-6: 模板管理
- **Given**: 管理员在模板管理页面
- **When**: 管理员点击添加/编辑模板
- **Then**: 可以上传模板图片、设置分类、场合、风格等信息
- **Verification**: `human-judgment`

### AC-7: 贺卡管理
- **Given**: 管理员在贺卡管理页面
- **When**: 管理员查看用户贺卡列表
- **Then**: 可以查看贺卡预览，删除违规贺卡
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要支持Google/Facebook社交登录？
- [ ] 是否需要管理员操作日志功能？
- [ ] 是否需要批量导入模板功能？