-- =====================================================
-- 字体表 (fonts)
-- 为编辑器提供可选字体系列列表
-- =====================================================
CREATE TABLE IF NOT EXISTS fonts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('sans-serif','serif','handwriting','cursive','display','monospace')),
    google_font_name VARCHAR(255),
    weights INTEGER[] DEFAULT '{400}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_fonts_category ON fonts(category);
CREATE INDEX IF NOT EXISTS idx_fonts_active ON fonts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fonts_sort ON fonts(sort_order);

-- 更新时间触发器
DROP TRIGGER IF EXISTS update_fonts_updated_at ON fonts;
CREATE TRIGGER update_fonts_updated_at
    BEFORE UPDATE ON fonts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始化字体数据
-- =====================================================
INSERT INTO fonts (family, display_name, category, google_font_name, weights, sort_order, is_active) VALUES

    -- 无衬线 (sans-serif)
    ('Arial',            'Arial',             'sans-serif', NULL,                '{400,700}',          1, TRUE),
    ('Helvetica',        'Helvetica',         'sans-serif', NULL,                '{400,700}',          2, TRUE),
    ('Verdana',          'Verdana',           'sans-serif', NULL,                '{400,700}',          3, TRUE),
    ('Tahoma',           'Tahoma',            'sans-serif', NULL,                '{400,700}',          4, TRUE),
    ('SimHei',           '黑体',              'sans-serif', NULL,                '{400}',              5, TRUE),
    ('"Microsoft YaHei"','微软雅黑',          'sans-serif', NULL,                '{400,700}',          6, TRUE),
    ('"Microsoft JhengHei"','微软正黑体',     'sans-serif', NULL,                '{400,700}',          7, TRUE),
    ('DengXian',         '等线',              'sans-serif', NULL,                '{400}',              8, TRUE),
    ('YouYuan',          '幼圆',              'sans-serif', NULL,                '{400}',              9, TRUE),
    ('"Noto Sans SC"',   '思源黑体',          'sans-serif', 'Noto Sans SC',      '{400,500,700}',      10, TRUE),
    ('"Noto Sans"',      'Noto Sans',         'sans-serif', 'Noto Sans',         '{400,500,700}',      11, TRUE),
    ('"Open Sans"',      'Open Sans',         'sans-serif', 'Open Sans',         '{400,600,700}',      12, TRUE),
    ('"Roboto"',         'Roboto',            'sans-serif', 'Roboto',             '{400,500,700}',      13, TRUE),
    ('"Lato"',           'Lato',              'sans-serif', 'Lato',               '{400,700}',          14, TRUE),

    -- 衬线 (serif)
    ('SimSun',           '宋体',              'serif',      NULL,                '{400}',              20, TRUE),
    ('FangSong',         '仿宋',              'serif',      NULL,                '{400}',              21, TRUE),
    ('STSong',           '华文宋体',           'serif',      NULL,                '{400}',              22, TRUE),
    ('"Noto Serif SC"',  '思源宋体',          'serif',      'Noto Serif SC',     '{400,700}',          23, TRUE),
    ('"Playfair Display"','Playfair Display', 'serif',      'Playfair Display',  '{400,700}',          24, TRUE),
    ('"Merriweather"',   'Merriweather',      'serif',      'Merriweather',      '{400,700}',          25, TRUE),

    -- 手写体 (handwriting)
    ('KaiTi',            '楷体',              'handwriting',NULL,                '{400}',              30, TRUE),
    ('STKaiti',          '华文楷体',           'handwriting',NULL,                '{400}',              31, TRUE),
    ('"Ma Shan Zheng"',  '马善政体',          'handwriting','Ma Shan Zheng',     '{400}',              32, TRUE),
    ('"Long Cang"',      '龙藏体',            'handwriting','Long Cang',          '{400}',              33, TRUE),
    ('"ZCOOL KuaiLe"',   '站酷快乐体',        'handwriting','ZCOOL KuaiLe',      '{400}',              34, TRUE),
    ('"Dancing Script"', 'Dancing Script',    'handwriting','Dancing Script',    '{400,700}',          35, TRUE),
    ('"Pacifico"',       'Pacifico',          'handwriting','Pacifico',           '{400}',              36, TRUE),

    -- 书法体 (cursive)
    ('LiSu',             '隶书',              'cursive',    NULL,                '{400}',              40, TRUE),
    ('"Zhi Mang Xing"',  '志芒行书',          'cursive',    'Zhi Mang Xing',     '{400}',              41, TRUE),
    ('"Liu Jian Mao Cao"','柳建毛草体',       'cursive',    'Liu Jian Mao Cao',  '{400}',              42, TRUE),

    -- 装饰体 (display)
    ('Impact',           'Impact',            'display',    NULL,                '{400}',              50, TRUE),
    ('"ZCOOL XiaoWei"',  '站酷小魏体',        'display',    'ZCOOL XiaoWei',     '{400}',              51, TRUE),
    ('"ZCOOL QingKe HuangYou"','站酷庆科黄油体','display',  'ZCOOL QingKe HuangYou','{400}',           52, TRUE),

    -- 等宽 (monospace)
    ('"Fira Code"',      'Fira Code',         'monospace',  'Fira Code',         '{400,600}',          60, TRUE),
    ('"JetBrains Mono"', 'JetBrains Mono',    'monospace',  'JetBrains Mono',    '{400,600}',          61, TRUE)

ON CONFLICT DO NOTHING;

-- =====================================================
-- 完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '字体表初始化完成！共导入 36 种字体。';
END $$;
