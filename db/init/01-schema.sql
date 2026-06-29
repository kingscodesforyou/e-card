-- =====================================================
-- 电子贺卡系统 - PostgreSQL 数据库初始化脚本
-- 版本: 1.0.0
-- 创建时间: 2024
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_disabled BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- 用户索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- =====================================================
-- 2. 模板表 (templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    occasion VARCHAR(50) NOT NULL,
    style VARCHAR(50) NOT NULL,
    thumbnail_url TEXT,
    background_url TEXT,
    pages JSONB DEFAULT '[]'::jsonb,
    default_elements JSONB DEFAULT '[]'::jsonb,
    background_music_url TEXT,
    usage_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 模板索引
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_occasion ON templates(occasion);
CREATE INDEX IF NOT EXISTS idx_templates_style ON templates(style);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_usage ON templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created ON templates(created_at DESC);

-- =====================================================
-- 3. 贺卡表 (cards)
-- =====================================================
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    pages JSONB DEFAULT '[]'::jsonb,
    background_music_url TEXT,
    background_music_loop BOOLEAN DEFAULT TRUE,
    cover TEXT,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 贺卡索引
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_template ON cards(template_id);
CREATE INDEX IF NOT EXISTS idx_cards_public ON cards(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_title ON cards USING gin(to_tsvector('simple', title));

-- =====================================================
-- 4. 收藏表 (favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT favorites_unique UNIQUE (user_id, template_id)
);

-- 收藏索引
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_template ON favorites(template_id);

-- =====================================================
-- 5. 管理员操作日志表 (admin_action_logs)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 日志索引
CREATE INDEX IF NOT EXISTS idx_logs_admin ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_action ON admin_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_logs_target ON admin_action_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON admin_action_logs(created_at DESC);

-- =====================================================
-- 6. 模板分类表 (template_categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    availab BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 模板分类种子数据
INSERT INTO template_categories (name, sort_order) VALUES
    ('金融理财', 1),
    ('教育培训', 2),
    ('政务融媒', 3),
    ('医疗保健', 4),
    ('美容健身', 5),
    ('餐饮美食', 6),
    ('房产装修', 7),
    ('旅游出行', 8),
    ('休闲娱乐', 9),
    ('汽车行业', 10),
    ('生活服务', 11),
    ('商超百货', 12),
    ('其他', 13)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. 模板场合表 (template_occasions)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    availab BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 模板场合种子数据
INSERT INTO template_occasions (name, sort_order) VALUES
    ('商务邀请', 1),
    ('活动邀请', 2),
    ('宴会邀请', 3),
    ('人才招聘', 4),
    ('招生培训', 5),
    ('党建公益', 6),
    ('营销卖货', 7),
    ('企业介绍', 8),
    ('企业期刊', 9),
    ('企业庆典', 10),
    ('行政办公', 11),
    ('总结汇报', 12),
    ('通知公告', 13),
    ('祝福问候', 14),
    ('日签打卡', 15),
    ('个人简历', 16),
    ('纪念相册', 17),
    ('攻略指南', 18),
    ('新闻资讯', 19),
    ('建党节', 20),
    ('建军节', 21),
    ('七夕', 22),
    ('小暑', 23),
    ('大暑', 24),
    ('立秋', 25),
    ('处暑', 26),
    ('国际禁毒日', 27),
    ('香港回归纪念日', 28),
    ('接吻日', 29),
    ('七七抗战纪念日', 30),
    ('全国保险公众宣传日', 31),
    ('世界人口日', 32),
    ('中国航海日', 33),
    ('夏三伏', 34),
    ('那达慕', 35),
    ('全国海洋宣传日', 36),
    ('全国特奥日', 37),
    ('人类月球日', 38),
    ('世界肝炎日', 39)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 8. 模板风格表 (template_styles)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 模板风格种子数据
INSERT INTO template_styles (name, sort_order) VALUES
    ('简约', 1),
    ('商务', 2),
    ('中国风', 3),
    ('手绘', 4),
    ('卡通', 5),
    ('时尚', 6),
    ('清新', 7),
    ('奢华', 8),
    ('复古', 9),
    ('立体', 10),
    ('科技', 11),
    ('国潮', 12),
    ('炫酷', 13),
    ('喜庆', 14),
    ('插画', 15),
    ('孟菲斯', 16),
    ('炫彩', 17),
    ('玻璃风', 18),
    ('膨胀风', 19),
    ('毛绒风', 20),
    ('酸性', 21),
    ('漫画', 22),
    ('搞笑', 23),
    ('拼接风', 24),
    ('Y2K', 25),
    ('赛博朋克', 26)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 9. 短信验证码表 (sms_codes)
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'login',
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 验证码索引
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_expires ON sms_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_code ON sms_codes(phone, code, used) WHERE used = FALSE;

-- =====================================================
-- 10. 反馈表 (feedbacks)
-- =====================================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'suggestion',
    content TEXT NOT NULL,
    contact VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    admin_reply TEXT,
    replied_by UUID REFERENCES users(id),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 反馈索引
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created ON feedbacks(created_at DESC);

-- =====================================================
-- 触发器：自动更新时间戳
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新时间的表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始化管理员账号
-- =====================================================
INSERT INTO users (email, password_hash, name, is_admin, is_email_verified)
VALUES (
    'admin@ecard.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 密码: password
    '管理员',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 初始化示例模板数据
-- =====================================================
INSERT INTO templates (name, category, occasion, style, thumbnail_url, background_url, is_featured)
VALUES
    ('生日祝福', '生日', '生日', '温馨', '/templates/birthday-1.jpg', '/backgrounds/birthday-bg.jpg', TRUE),
    ('新年快乐', '节日', '新年', '传统', '/templates/newyear-1.jpg', '/backgrounds/newyear-bg.jpg', TRUE),
    ('圣诞祝福', '节日', '圣诞节', '华丽', '/templates/christmas-1.jpg', '/backgrounds/christmas-bg.jpg', TRUE),
    ('婚礼邀请', '婚礼', '婚礼', '优雅', '/templates/wedding-1.jpg', '/backgrounds/wedding-bg.jpg', FALSE),
    ('毕业纪念', '祝福', '毕业', '青春', '/templates/graduation-1.jpg', '/backgrounds/graduation-bg.jpg', FALSE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '管理员账号: admin@ecard.com';
    RAISE NOTICE '管理员密码: password';
END $$;
