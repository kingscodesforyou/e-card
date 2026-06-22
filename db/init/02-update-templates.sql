-- =====================================================
-- 更新模板标签为中文
-- =====================================================

-- 更新模板分类、场合、风格为中文
UPDATE templates SET
    category = CASE 
        WHEN category = 'birthday' THEN '生日'
        WHEN category = 'festival' THEN '节日'
        WHEN category = 'wedding' THEN '婚礼'
        WHEN category = 'graduation' THEN '祝福'
        ELSE category
    END,
    occasion = CASE 
        WHEN occasion = 'birthday' THEN '生日'
        WHEN occasion = 'new_year' THEN '新年'
        WHEN occasion = 'christmas' THEN '圣诞节'
        WHEN occasion = 'wedding' THEN '婚礼'
        WHEN occasion = 'graduation' THEN '毕业'
        ELSE occasion
    END,
    style = CASE 
        WHEN style = 'warm' THEN '温馨'
        WHEN style = 'traditional' THEN '传统'
        WHEN style = 'festive' THEN '华丽'
        WHEN style = 'elegant' THEN '优雅'
        WHEN style = 'youth' THEN '青春'
        ELSE style
    END;

-- =====================================================
-- 更新完成提示
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '模板标签已更新为中文！';
END $$;