// =====================================================
// AI 服务层 - 封装前端 AI 功能调用
// =====================================================

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true';
const isMockMode = !useLocalApi && import.meta.env.VITE_USE_MOCK === 'true';

// =====================================================
// Mock 数据
// =====================================================

const mockGreetings: Record<string, string[]> = {
  '春节': [
    '新春佳节，万象更新，愿您和家人阖家欢乐，幸福安康！',
    '辞旧迎新，金蛇送福，祝您新的一年万事如意，心想事成！',
    '春风送暖，百花争艳，愿您的生活如春天般灿烂美好。',
    '新年新气象，愿您事业腾飞，家庭和睦，笑口常开！',
    '灯笼高挂，喜庆满堂，祝您春节快乐，岁岁平安！',
  ],
  '生日': [
    '愿你的每一天都如阳光般灿烂，每一刻都充满欢笑与感动。生日快乐！',
    '在新的一岁里，愿你遇见更美好的自己，所有梦想都开花结果。',
    '岁月如歌，愿你被时光温柔以待，生日快乐，幸福常伴！',
    '祝你生日快乐，愿你的世界永远充满爱与温暖。',
    '愿这特别的一天，为你开启一整年的好运与喜悦。生日快乐！',
  ],
  '婚礼': [
    '愿你们的爱情如美酒般越陈越香，携手共度每一个春夏秋冬。',
    '百年好合，永结同心，祝你们的新生活充满幸福与甜蜜！',
    '恭喜你们找到了彼此，愿未来的每一天都写满爱的故事。',
    '愿你们的婚姻像童话一样美好，像现实一样坚定。新婚快乐！',
    '执子之手，与子偕老。祝你们在爱的旅途上永远相伴相随。',
  ],
};

const mockRecommendResult = {
  category: '金融理财',
  occasion: '春节',
  style: '商务',
};

const mockPolishResult: Record<string, string> = {
  polish: '每一段时光都值得被铭记，每一个笑容都值得被珍藏。愿这份贺卡带给您温暖与感动。',
  expand: '在漫长的人生旅途中，每一个相遇都是命运的馈赠。愿这份精心准备的贺卡，能承载我深深的祝福，穿越千山万水，抵达您的心间。愿您在每一个平凡的日子里，都能发现不平凡的美好；在每一次回眸中，都能看见温暖的陪伴。',
  shorten: '愿温暖与感动常伴左右。',
  translate_en: 'Every moment is worth remembering, every smile is worth cherishing. May this card bring you warmth and joy.',
};

const mockColorSchemes = [
  { name: '经典商务', colors: ['#1B3A5C', '#2D5F8A', '#4A90C4', '#F5F7FA', '#333333'] },
  { name: '温暖喜庆', colors: ['#8B0000', '#CC3333', '#FF6B6B', '#FFF5F5', '#4A0000'] },
  { name: '清新雅致', colors: ['#2D5F5A', '#4A908A', '#80C4B8', '#F0F7F5', '#1A3330'] },
];

const mockBackgroundUrl = 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1024';

const mockGeneratedTemplate = {
  name: '春节商务贺卡',
  category: '金融理财',
  occasion: '春节',
  style: '商务',
  pages: [
    {
      pageNumber: 1,
      backgroundColor: '#8B0000',
      elements: [
        { type: 'text', content: '新春快乐', position: { x: 20, y: 15 }, size: { width: 60, height: 12 }, style: { fontSize: 48, fontFamily: 'SimSun', color: '#FFD700', textAlign: 'center', fontWeight: 'bold' } },
        { type: 'text', content: '恭贺新禧 · 万事如意', position: { x: 15, y: 35 }, size: { width: 70, height: 8 }, style: { fontSize: 24, fontFamily: 'Arial', color: '#FFFFFF', textAlign: 'center' } },
        { type: 'shape', content: 'divider', position: { x: 30, y: 48 }, size: { width: 40, height: 0.5 }, style: { backgroundColor: '#FFD700' } },
        { type: 'text', content: '尊敬的客户', position: { x: 15, y: 55 }, size: { width: 70, height: 6 }, style: { fontSize: 18, fontFamily: 'Arial', color: '#FFFFFF', textAlign: 'center' } },
        { type: 'text', content: '感谢您过去一年的信任与支持', position: { x: 10, y: 65 }, size: { width: 80, height: 6 }, style: { fontSize: 16, fontFamily: 'Arial', color: '#FFD700', textAlign: 'center' } },
        { type: 'text', content: '某某公司 敬贺', position: { x: 30, y: 80 }, size: { width: 40, height: 5 }, style: { fontSize: 14, fontFamily: 'Arial', color: '#FFFFFF', textAlign: 'center' } },
      ],
    },
  ],
};

const mockLayoutSuggestions = {
  suggestions: [
    { elementId: 'el-1', reason: '标题位置偏上，建议下移以保持视觉平衡', position: { x: 20, y: 20 }, size: { width: 60, height: 12 } },
    { elementId: 'el-2', reason: '副标题与标题间距过大，建议缩小', position: { x: 15, y: 38 }, size: { width: 70, height: 8 } },
  ],
  summary: '整体布局偏上，建议将主要元素下移 5-10%，使页面重心更加均衡。',
};

// =====================================================
// API 请求辅助函数
// =====================================================

async function aiApiRequest(endpoint: string, body: object, extraHeaders: Record<string, string> = {}) {
  const url = `${apiBaseUrl}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'AI 请求失败');
  }
  return data;
}

// =====================================================
// AI 服务接口
// =====================================================

export const ai = {
  /**
   * 生成祝福语
   */
  generateGreetings: async (
    occasion: string,
    recipient?: string,
    count: number = 5
  ): Promise<{ data: string[] | null; error: any }> => {
    if (isMockMode) {
      const greetings = mockGreetings[occasion] || mockGreetings['春节'];
      return { data: greetings.slice(0, count), error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/greeting', { occasion, recipient, count });
        return { data: result.greetings, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    const greetings = mockGreetings[occasion] || mockGreetings['春节'];
    return { data: greetings.slice(0, count), error: null };
  },

  /**
   * 智能模板推荐
   */
  recommendTemplate: async (
    description: string,
    labelOptions?: { categories: string[]; occasions: string[]; styles: string[] }
  ): Promise<{ data: { category: string; occasion: string; style: string } | null; error: any }> => {
    if (isMockMode) {
      return { data: mockRecommendResult, error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/recommend', {
          description,
          categories: labelOptions?.categories,
          occasions: labelOptions?.occasions,
          styles: labelOptions?.styles,
        });
        return { data: result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockRecommendResult, error: null };
  },

  /**
   * 文案润色/续写
   */
  polishText: async (
    text: string,
    action: 'polish' | 'expand' | 'shorten' | 'translate_en' = 'polish'
  ): Promise<{ data: string | null; error: any }> => {
    if (isMockMode) {
      return { data: mockPolishResult[action] || mockPolishResult.polish, error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/polish', { text, action });
        return { data: result.result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockPolishResult[action] || mockPolishResult.polish, error: null };
  },

  /**
   * 配色方案建议
   */
  suggestColorScheme: async (
    style: string,
    count: number = 3
  ): Promise<{ data: Array<{ name: string; colors: string[] }> | null; error: any }> => {
    if (isMockMode) {
      return { data: mockColorSchemes.slice(0, count), error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/color-scheme', { style, count });
        return { data: result.schemes, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockColorSchemes.slice(0, count), error: null };
  },

  /**
   * 背景图生成
   */
  generateBackground: async (
    description: string,
    style?: string
  ): Promise<{ data: string | null; error: any }> => {
    if (isMockMode) {
      return { data: mockBackgroundUrl, error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/generate-background', { description, style });
        return { data: result.image_url, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockBackgroundUrl, error: null };
  },

  /**
   * 一句话生成模板
   */
  generateTemplate: async (
    description: string,
    labelOptions?: { categories: string[]; occasions: string[]; styles: string[] }
  ): Promise<{ data: any | null; error: any }> => {
    if (isMockMode) {
      return { data: mockGeneratedTemplate, error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/generate-template', {
          description,
          categories: labelOptions?.categories,
          occasions: labelOptions?.occasions,
          styles: labelOptions?.styles,
        });
        return { data: result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockGeneratedTemplate, error: null };
  },

  /**
   * 智能布局建议
   */
  suggestLayout: async (
    elements: any[],
    pageWidth: number = 540,
    pageHeight: number = 720
  ): Promise<{ data: { suggestions: any[]; summary: string } | null; error: any }> => {
    if (isMockMode) {
      return { data: mockLayoutSuggestions, error: null };
    }
    if (useLocalApi) {
      try {
        const result = await aiApiRequest('/api/ai/suggest-layout', { elements, pageWidth, pageHeight });
        return { data: result, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }
    return { data: mockLayoutSuggestions, error: null };
  },
};
