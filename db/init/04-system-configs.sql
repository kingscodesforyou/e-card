-- =====================================================
-- 11. 系统配置表 (system_configs)
-- 用于存储包括限流配置在内的各类系统参数
-- =====================================================

CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL DEFAULT '',
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'string',
    group_name VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 配置表索引
CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);
CREATE INDEX IF NOT EXISTS idx_system_configs_group ON system_configs(group_name);

-- 配置表 updated_at 触发器
DROP TRIGGER IF EXISTS update_system_configs_updated_at ON system_configs;
CREATE TRIGGER update_system_configs_updated_at
    BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始化配置数据
-- =====================================================

-- 大模型API调用频率限制(rpm) - 默认20次/分钟
INSERT INTO system_configs (key, value, description, type, group_name)
VALUES (
    'model_api_rate_limit',
    '20',
    '大模型API调用频率限制(rpm)',
    'integer',
    'ai'
) ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '系统配置表初始化完成！';
    RAISE NOTICE '配置项: model_api_rate_limit = 20 (integer, ai)';
END $$;
