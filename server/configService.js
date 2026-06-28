// =====================================================
// 通用系统配置服务
// 支持缓存、类型转换、变更监听、分组管理
// =====================================================

import { EventEmitter } from 'events';

// 默认缓存 TTL（毫秒）
const CACHE_TTL = 60 * 1000; // 60秒
// 默认限流值（当配置读取失败时使用）
const DEFAULT_RATE_LIMIT = 20;

// 缓存条目结构：{ value, type, timestamp, raw }
const cache = new Map();
// 事件发射器（用于配置变更通知）
const emitter = new EventEmitter();

let dbPool = null;

/**
 * 初始化配置服务
 * @param {object} pool - PostgreSQL 连接池
 */
export function initConfigService(pool) {
  dbPool = pool;
}

/**
 * 根据 type 字段转换值为正确的类型
 */
function castValue(value, type) {
  switch (type) {
    case 'integer':
    case 'int':
      const intVal = parseInt(value, 10);
      return isNaN(intVal) ? 0 : intVal;
    case 'boolean':
    case 'bool':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return Boolean(value);
    case 'json':
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return value;
      }
    case 'float':
    case 'number':
      const floatVal = parseFloat(value);
      return isNaN(floatVal) ? 0 : floatVal;
    case 'string':
    default:
      return String(value);
  }
}

/**
 * 从数据库加载配置值
 * @param {string} key - 配置键
 * @returns {Promise<{value: string, type: string, description: string, group_name: string} | null>}
 */
async function loadFromDb(key) {
  if (!dbPool) {
    console.warn(`[ConfigService] 数据库连接未初始化`);
    return null;
  }

  try {
    const result = await dbPool.query(
      'SELECT key, value, type, description, group_name FROM system_configs WHERE key = $1',
      [key]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    console.error(`[ConfigService] 读取配置 "${key}" 失败:`, error.message);
    return null;
  }
}

/**
 * 获取配置值（带缓存）
 * @param {string} key - 配置键
 * @param {*} defaultValue - 默认值（配置不存在或读取失败时返回）
 * @returns {Promise<*>} 配置值（已按 type 转换类型）
 */
export async function getConfig(key, defaultValue = null) {
  // 1. 检查缓存是否有效
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  // 2. 缓存失效或不存在，重新从数据库加载
  const row = await loadFromDb(key);

  if (row) {
    const typedValue = castValue(row.value, row.type);
    // 更新缓存
    cache.set(key, {
      value: typedValue,
      type: row.type,
      raw: row.value,
      description: row.description,
      group_name: row.group_name,
      timestamp: Date.now(),
    });
    return typedValue;
  }

  // 3. 数据库中不存在或读取失败，返回默认值
  if (defaultValue !== null) {
    return defaultValue;
  }

  // 如果是 rate_limit 配置，使用内置默认值
  if (key === 'model_api_rate_limit') {
    return DEFAULT_RATE_LIMIT;
  }

  return null;
}

/**
 * 获取配置的完整信息（含元数据）
 * @param {string} key - 配置键
 * @returns {Promise<object|null>}
 */
export async function getConfigDetail(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached, key };
  }

  const row = await loadFromDb(key);
  if (row) {
    const typedValue = castValue(row.value, row.type);
    const detail = {
      key: row.key,
      value: typedValue,
      type: row.type,
      raw: row.value,
      description: row.description,
      group_name: row.group_name,
      timestamp: Date.now(),
    };
    cache.set(key, detail);
    return detail;
  }

  return null;
}

/**
 * 获取所有配置
 * @returns {Promise<Array>}
 */
export async function getAllConfigs() {
  if (!dbPool) {
    console.warn('[ConfigService] 数据库连接未初始化');
    return [];
  }

  try {
    const result = await dbPool.query(
      'SELECT key, value, type, description, group_name, created_at, updated_at FROM system_configs ORDER BY group_name, key'
    );

    // 更新缓存
    const configs = result.rows.map(row => {
      const typedValue = castValue(row.value, row.type);
      cache.set(row.key, {
        value: typedValue,
        type: row.type,
        raw: row.value,
        description: row.description,
        group_name: row.group_name,
        timestamp: Date.now(),
      });
      return {
        key: row.key,
        value: typedValue,
        type: row.type,
        description: row.description,
        group_name: row.group_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return configs;
  } catch (error) {
    console.error('[ConfigService] 获取所有配置失败:', error.message);
    return [];
  }
}

/**
 * 按分组获取配置
 * @param {string} groupName - 分组名称
 * @returns {Promise<Array>}
 */
export async function getConfigsByGroup(groupName) {
  const allConfigs = await getAllConfigs();
  return allConfigs.filter(c => c.group_name === groupName);
}

/**
 * 更新配置值
 * @param {string} key - 配置键
 * @param {string} value - 新的配置值（字符串形式）
 * @param {object} options - 可选参数 { description, type, group_name }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function setConfig(key, value, options = {}) {
  if (!dbPool) {
    return { success: false, error: '数据库连接未初始化' };
  }

  try {
    // 检查配置是否存在
    const existing = await dbPool.query(
      'SELECT id FROM system_configs WHERE key = $1',
      [key]
    );

    if (existing.rows.length > 0) {
      // 更新已有配置
      const updateFields = ['value = $1'];
      const updateParams = [String(value)];
      let paramIndex = 2;

      if (options.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateParams.push(options.description);
      }
      if (options.type !== undefined) {
        updateFields.push(`type = $${paramIndex++}`);
        updateParams.push(options.type);
      }
      if (options.group_name !== undefined) {
        updateFields.push(`group_name = $${paramIndex++}`);
        updateParams.push(options.group_name);
      }

      updateParams.push(key);
      await dbPool.query(
        `UPDATE system_configs SET ${updateFields.join(', ')} WHERE key = $${paramIndex}`,
        updateParams
      );
    } else {
      // 创建新配置
      await dbPool.query(
        `INSERT INTO system_configs (key, value, description, type, group_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          key,
          String(value),
          options.description || null,
          options.type || 'string',
          options.group_name || 'general',
        ]
      );
    }

    // 清除缓存，下次读取时自动加载最新值
    cache.delete(key);

    // 发射变更事件，通知监听者
    emitter.emit('configChanged', key, String(value));
    // 同时也发射特定 key 的事件
    emitter.emit(`configChanged:${key}`, String(value));

    return { success: true };
  } catch (error) {
    console.error(`[ConfigService] 更新配置 "${key}" 失败:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 注册配置变更监听
 * @param {string} key - 要监听的配置键（'*' 监听所有变更）
 * @param {function} callback - 回调函数 (newValue) => void
 */
export function onConfigChanged(key, callback) {
  if (key === '*') {
    emitter.on('configChanged', callback);
  } else {
    emitter.on(`configChanged:${key}`, callback);
  }
}

/**
 * 移除配置变更监听
 * @param {string} key
 * @param {function} callback
 */
export function removeConfigListener(key, callback) {
  if (key === '*') {
    emitter.removeListener('configChanged', callback);
  } else {
    emitter.removeListener(`configChanged:${key}`, callback);
  }
}

/**
 * 清除所有缓存
 */
export function clearCache() {
  cache.clear();
  console.log('[ConfigService] 配置缓存已清除');
}

/**
 * 获取默认限流值
 */
export function getDefaultRateLimit() {
  return DEFAULT_RATE_LIMIT;
}
