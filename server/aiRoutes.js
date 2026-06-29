// =====================================================
// AI 服务路由
// 代理前端请求到 Agnes API（兼容 OpenAI 格式）
// =====================================================

// 必须在读取 process.env 之前加载 dotenv
import dotenv from 'dotenv';
dotenv.config();

const AGNES_API_BASE = process.env.AGNES_API_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';

// 调试：打印密钥前几位和后几位，确认读取是否正确
console.log('========================================');
console.log('[AI Routes] AGNES_API_BASE:', AGNES_API_BASE);
console.log('[AI Routes] AGNES_API_KEY loaded:', AGNES_API_KEY ? 'yes' : 'NO');
console.log('[AI Routes] AGNES_API_KEY length:', AGNES_API_KEY.length);
console.log('[AI Routes] AGNES_API_KEY prefix:', AGNES_API_KEY.substring(0, 8) + '...');
console.log('[AI Routes] AGNES_API_KEY suffix:', '...' + AGNES_API_KEY.substring(AGNES_API_KEY.length - 4));
console.log('[AI Routes] AGNES_API_KEY raw chars:', JSON.stringify(AGNES_API_KEY.substring(0, 15)) + '...');
console.log('========================================');

// =====================================================
// 通用 AI 调用函数
// =====================================================
async function callAgnesChat(messages, options = {}) {
  const { temperature = 0.8, max_tokens = 1024, stream = false } = options;

  const requestBody = JSON.stringify({
    model: 'agnes-2.0-flash',
    messages,
    temperature,
    max_tokens,
    stream,
  });

  const authHeader = `Bearer ${AGNES_API_KEY}`;

  console.log('[AI Debug] === 开始调用 Agnes Chat API ===');
  console.log('[AI Debug] URL:', `${AGNES_API_BASE}/chat/completions`);
  console.log('[AI Debug] Authorization header prefix:', authHeader.substring(0, 20) + '...');
  console.log('[AI Debug] Authorization header length:', authHeader.length);
  console.log('[AI Debug] Request body preview:', requestBody.substring(0, 200) + '...');

  const response = await fetch(`${AGNES_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  console.log('[AI Debug] Response status:', response.status);
  console.log('[AI Debug] Response status text:', response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[AI Debug] Response error body:', errorText);
    throw new Error(`Agnes API 错误 (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  console.log('[AI Debug] Response success, choices:', result.choices?.length);
  console.log('[AI Debug] === 调用结束 ===');
  return result;
}

// =====================================================
// 通用 AI 图片生成函数
// =====================================================
async function callAgnesImage(prompt, options = {}) {
  const { size = '1024x768', count = 1 } = options;

  const requestBody = JSON.stringify({
    model: 'agnes-image-2.1-flash',
    prompt,
    size,
    n: count,
    extra_body: {
      response_format: 'url',
    },
  });

  console.log('[AI Image Debug] URL:', `${AGNES_API_BASE}/images/generations`);
  console.log('[AI Image Debug] Authorization header prefix:', `Bearer ${AGNES_API_KEY}`.substring(0, 20) + '...');
  console.log('[AI Image Debug] Prompt:', prompt.substring(0, 100));

  const response = await fetch(`${AGNES_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log('[AI Image Debug] Error response:', errorText);
    throw new Error(`Agnes Image API 错误 (${response.status}): ${errorText}`);
  }

  return response.json();
}

// =====================================================
// 从 AI 响应中提取 JSON 的工具函数
// =====================================================
function extractJSON(content) {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    const arrayMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (arrayMatch) return JSON.parse(arrayMatch[1]);
    throw new Error('无法解析 AI 响应为 JSON');
  }
}

// =====================================================
// ① 生成祝福语
// POST /api/ai/greeting
// Body: { occasion: string, recipient: string, count?: number }
// =====================================================
export async function generateGreetings(req, res) {
  try {
    const { occasion, recipient, count = 5 } = req.body;

    if (!occasion) {
      return res.status(400).json({ error: '请选择场合' });
    }

    const systemPrompt = `你是一位专业的贺卡文案撰写师。根据用户提供的场合和收卡人，生成多条温暖、得体的祝福语。

规则：
- 每条祝福语 1-3 句话
- 风格多样：温馨、诗意、简洁、正式
- 仅返回 JSON 数组格式，如 ["祝福1", "祝福2", ...]
- 不要包含任何其他文字说明`;

    const userPrompt = recipient
      ? `场合：${occasion}\n收卡人：${recipient}\n\n请生成 ${count} 条祝福语。`
      : `场合：${occasion}\n\n请生成 ${count} 条通用的祝福语。`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.8 });

    const content = data.choices[0].message.content;

    let greetings;
    try {
      greetings = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        greetings = JSON.parse(jsonMatch[1]);
      } else {
        greetings = content.split('\n')
          .map(line => line.replace(/^\d+[\.\、\s]+/, '').trim())
          .filter(line => line.length > 5);
      }
    }

    if (!Array.isArray(greetings)) {
      greetings = [content];
    }

    res.json({ greetings });
  } catch (error) {
    console.error('生成祝福语错误:', error);
    res.status(500).json({ error: '生成祝福语失败，请稍后重试' });
  }
}

// =====================================================
// ② 智能模板推荐
// POST /api/ai/recommend
// Body: { description: string }
// =====================================================
export async function recommendTemplate(req, res) {
  try {
    const { description, categories: bodyCategories, occasions: bodyOccasions, styles: bodyStyles } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请输入描述' });
    }

    const categories = bodyCategories?.join(',') || '节日,生日,婚礼,感谢,祝福,其他';
    const occasions = bodyOccasions?.join(',') || '新年,春节,情人节,生日,婚礼,毕业,祝福,慰问';
    const styles = bodyStyles?.join(',') || '简约,商务,卡通,复古,时尚,清新';

    const systemPrompt = `你是一位贺卡模板推荐专家。根据用户的描述，从以下标签中选择最匹配的一个组合。

可用分类：${categories}
可用场合：${occasions}
可用风格：${styles}

规则：
- 仅返回 JSON 对象：{"category": "...", "occasion": "...", "style": "..."}
- 选择最匹配的单个组合
- 三个字段都必须从可用的标签中选择，不要捏造
- 如果描述不明确，选择最通用的选项
- 不要包含任何其他文字说明`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `用户描述：${description}` },
    ], { temperature: 0.3, max_tokens: 256 });

    const result = extractJSON(data.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('智能推荐错误:', error);
    res.status(500).json({ error: '智能推荐失败，请稍后重试' });
  }
}

// =====================================================
// ③ AI 文案润色/续写
// POST /api/ai/polish
// Body: { text: string, action: 'polish' | 'expand' | 'shorten' | 'translate_en' }
// =====================================================
export async function polishText(req, res) {
  try {
    const { text, action = 'polish' } = req.body;

    if (!text) {
      return res.status(400).json({ error: '请输入文字内容' });
    }

    const actionMap = {
      polish: { instruction: '润色以下文字，使其更加优美、流畅，保持原意不变', temp: 0.7 },
      expand: { instruction: '扩写以下文字，在保持原意基础上增加内容和细节，使其更丰富', temp: 0.8 },
      shorten: { instruction: '精简以下文字，在保持核心意思的前提下使其更简洁', temp: 0.5 },
      translate_en: { instruction: '将以下中文翻译成英文，保持原文的情感和语气', temp: 0.5 },
    };

    const config = actionMap[action] || actionMap.polish;

    const systemPrompt = `你是一位专业的文案编辑。${config.instruction}。

规则：
- 仅返回处理后的文字内容
- 不要包含任何解释、引号或额外文字
- 保持原文的风格和情感基调`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ], { temperature: config.temp, max_tokens: 2048 });

    const result = data.choices[0].message.content.trim();

    res.json({ result });
  } catch (error) {
    console.error('文案润色错误:', error);
    res.status(500).json({ error: '文案处理失败，请稍后重试' });
  }
}

// =====================================================
// ④ AI 配色方案建议
// POST /api/ai/color-scheme
// Body: { style: string, count?: number }
// =====================================================
export async function suggestColorScheme(req, res) {
  try {
    const { style, count = 3 } = req.body;

    if (!style) {
      return res.status(400).json({ error: '请提供风格信息' });
    }

    const systemPrompt = `你是一位专业的色彩设计师。根据提供的风格，生成 ${count} 套配色方案。

每套配色方案包含：
- name: 方案名称（中文）
- colors: 5 个十六进制颜色代码的数组

规则：
- 颜色要协调、美观，符合该风格特点
- 每套方案包含主色、辅助色、强调色、背景色和文字色
- 仅返回 JSON 数组格式
- 示例格式：[{"name": "经典商务", "colors": ["#1B3A5C", "#2D5F8A", "#4A90C4", "#F5F7FA", "#333333"]}]
- 不要包含任何其他文字说明`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `风格：${style}\n\n请为"${style}"风格生成 ${count} 套配色方案。` },
    ], { temperature: 0.7, max_tokens: 2048 });

    const result = extractJSON(data.choices[0].message.content);
    res.json({ schemes: Array.isArray(result) ? result : [] });
  } catch (error) {
    console.error('配色建议错误:', error);
    res.status(500).json({ error: '生成配色方案失败，请稍后重试' });
  }
}

// =====================================================
// ⑤ AI 背景图生成
// POST /api/ai/generate-background
// Body: { description: string, style?: string, size?: string }
// =====================================================
export async function generateBackground(req, res) {
  try {
    const { description, style, size = '1024x768' } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请输入描述' });
    }

    const prompt = style
      ? `${description}，风格：${style}，适合作为贺卡背景图，平整干净，留白充足`
      : `${description}，适合作为贺卡背景图，平整干净，留白充足`;

    const imageData = await callAgnesImage(prompt, { size });

    const imageUrl = imageData.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('图片生成未返回 URL');
    }

    res.json({ image_url: imageUrl });
  } catch (error) {
    console.error('背景图生成错误:', error);
    res.status(500).json({ error: '背景图生成失败，请稍后重试' });
  }
}

// =====================================================
// ⑥ AI 一句话生成模板
// POST /api/ai/generate-template
// Body: { description: string }
// =====================================================
export async function generateTemplate(req, res) {
  try {
    const { description, categories: bodyCategories, occasions: bodyOccasions, styles: bodyStyles } = req.body;

    if (!description) {
      return res.status(400).json({ error: '请输入模板描述' });
    }

    const categories = bodyCategories?.join(',') || '金融理财,教育培训,政务融媒,医疗保健,美容健身,餐饮美食,房产装修,旅游出行,休闲娱乐,汽车行业,生活服务,商超百货,其他';
    const occasions = bodyOccasions?.join(',') || '商务邀请,活动邀请,宴会邀请,人才招聘,招生培训,党建公益,营销卖货,企业介绍,企业期刊,企业庆典,行政办公,总结汇报,通知公告,祝福问候,日签打卡,个人简历,纪念相册,攻略指南,新闻资讯,建党节,建军节,七夕,小暑,大暑,立秋,处暑';
    const styles = bodyStyles?.join(',') || '简约,商务,中国风,手绘,卡通,时尚,清新,奢华,复古,立体,科技,国潮,炫酷,喜庆,插画,孟菲斯,炫彩,玻璃风,膨胀风,毛绒风,酸性,漫画,搞笑,拼接风,Y2K,赛博朋克';

	    const systemPrompt = `你是一位贺卡模板设计师。根据用户描述生成完整的贺卡模板 JSON。

画布规格：
- 宽高比：9:16（手机竖屏比例），宽度9，高度16
- x 坐标范围 0-100（从左到右），y 坐标范围 0-100（从上到下）
- 视觉重心在垂直方向的中上部区域，底部留白 10-15%
- 所有坐标和尺寸使用百分比值（0-100）

输出格式必须严格遵循以下接口：

{
  "name": "模板名称",
  "category": "分类（从可用分类中选择）",
  "occasion": "场合（从可用场合中选择）",
  "style": "风格（从可用风格中选择）",
  "pages": [
    {
      "pageNumber": 1,
      "backgroundColor": "#十六进制颜色",
      "elements": [
        {
          "type": "text",
          "content": "文字内容",
          "position": { "x": 百分比0-100, "y": 百分比0-100 },
          "size": { "width": 百分比0-100, "height": 百分比0-100 },
          "style": {
            "fontSize": 数字,
            "fontFamily": "字体名称",
            "color": "#十六进制",
            "textAlign": "center",
            "fontWeight": "bold"或"normal"
          }
        },
        {
          "type": "image",
          "content": "图片内容描述，如：金色烟花背景、红色灯笼装饰、梅花树枝",
          "position": { "x": 百分比0-100, "y": 百分比0-100 },
          "size": { "width": 百分比0-100, "height": 百分比0-100 },
          "style": {}
        }
      ]
    }
  ]
}

规则：
- 生成 1-4 页
- 每页 2-6 个元素
- 元素类型包含：
  · text：标题、正文、祝福语（要有实际中文内容）
  · image：装饰图、插图（content 写图片内容描述，如"红色灯笼装饰""金色烟花背景"，不要写URL）
  · shape：装饰线、几何图形（矩形、圆形）
- 每页至少包含一个 image 或 shape 类型元素作为装饰
- 颜色使用十六进制
- 文字元素要有实际内容（根据场景生成中文文案）
- 注意视觉平衡和留白
- 仅返回 JSON，不要包含任何其他文字`;

    const userPrompt = `用户描述：${description}

可用分类：${categories}
可用场合：${occasions}
可用风格：${styles}

    请根据描述生成贺卡模板 JSON。`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.6, max_tokens: 4096 });

    const result = extractJSON(data.choices[0].message.content);

    // 为 image 类型的元素生成真实图片（9:16 竖版）
    if (result.pages && Array.isArray(result.pages)) {
      let imageGenCount = 0;
      const MAX_IMAGES = 3; // 最多生成 3 张，避免耗时过长

      for (const page of result.pages) {
        if (!page.elements) continue;
        for (const element of page.elements) {
          if (element.type === 'image' && element.content && imageGenCount < MAX_IMAGES) {
            const imgPrompt = element.content;
            console.log(`[AI Template] 正在生成图片: ${imgPrompt.substring(0, 40)}`);
            try {
              const imageData = await callAgnesImage(imgPrompt, { size: '720x1280' });
              const imageUrl = imageData.data?.[0]?.url;
              if (imageUrl) {
                element.content = imageUrl; // 替换描述为真实图片 URL
                imageGenCount++;
                console.log(`[AI Template] 图片生成成功 ${imageGenCount}/${MAX_IMAGES}`);
              }
            } catch (imgErr) {
              console.error(`[AI Template] 图片生成失败:`, imgErr.message);
              // 保留原始描述文本，不阻塞返回
            }
          }
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('模板生成错误:', error);
    res.status(500).json({ error: '模板生成失败，请稍后重试' });
  }
}

// =====================================================
// ⑦ AI 智能布局建议
// POST /api/ai/suggest-layout
// Body: { elements: array, pageWidth: number, pageHeight: number }
// =====================================================
export async function suggestLayout(req, res) {
  try {
    const { elements, pageWidth = 360, pageHeight = 640 } = req.body;

    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ error: '请提供页面元素数据' });
    }

    const elementsJSON = JSON.stringify(elements.map(el => ({
      id: el.id,
      type: el.type,
      content: el.type === 'text' ? el.content.substring(0, 50) : el.content.substring(0, 30),
      position: el.position,
      size: el.size,
      style: {
        fontSize: el.style?.fontSize,
        textAlign: el.style?.textAlign,
        color: el.style?.color,
      },
    })));

    const systemPrompt = `你是一位专业的平面布局设计师。分析贺卡页面上的元素布局，给出优化建议。

输出格式：
{
  "suggestions": [
    {
      "elementId": "元素ID",
      "reason": "调整原因（中文，一句话）",
      "position": { "x": 新百分比, "y": 新百分比 },
      "size": { "width": 新百分比, "height": 新百分比 }
    }
  ],
  "summary": "整体布局建议说明（中文）"
}

规则：
- 只对有问题的元素提出修改建议
- 坐标和尺寸用百分比（0-100）
- 保持元素可见区域在画布范围内
- 考虑 3:4 的竖版比例
- 注意元素之间的间距和对齐
- 每次返回实际的数值调整（不仅仅是建议文字）
- 不做增减元素的操作`;

    const data = await callAgnesChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `画布尺寸：${pageWidth}px × ${pageHeight}px（9:16 手机竖屏）\n\n当前元素：${elementsJSON}\n\n请分析并给出布局优化建议。` },
    ], { temperature: 0.4, max_tokens: 2048 });

    const result = extractJSON(data.choices[0].message.content);
    res.json(result);
  } catch (error) {
    console.error('布局建议错误:', error);
    res.status(500).json({ error: '布局建议生成失败，请稍后重试' });
  }
}
