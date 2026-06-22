import { useState, useEffect } from 'react';
import { Search, Trash2, Eye, Gift, X } from 'lucide-react';
import { admin, cards as cardsApi } from '../../utils/supabase';
import type { Card } from '../../types';

const CardManagementPage = () => {
  const [cardList, setCardList] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
    const result = await cardsApi.getAll();
    if (result.data) {
      setCardList(result.data);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredCards = cardList.filter(
    (card) => card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (cardId: string) => {
    if (!confirm('确定要删除该贺卡吗？')) return;
    const result = await admin.deleteCard(cardId);
    if (!result.error) {
      fetchCards();
    } else {
      setError('删除失败');
    }
  };

  const handlePreview = (card: Card) => {
    setSelectedCard(card);
    setShowPreviewModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">贺卡管理</h2>
          <p className="text-gray-500 mt-1">管理用户创建的贺卡</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索贺卡标题..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  贺卡信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  模板ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  元素数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    没有找到贺卡
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{card.title || '未命名贺卡'}</p>
                          <p className="text-sm text-gray-500">ID: {card.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {card.template_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(card.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {card.pages ? card.pages.reduce((sum, p) => sum + p.elements.length, 0) : 0} 个元素
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(card)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="预览"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPreviewModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">贺卡预览</h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedCard(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">贺卡标题</label>
                <p className="mt-1 text-gray-900">{selectedCard.title || '未命名贺卡'}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">用户ID</label>
                <p className="mt-1 text-gray-900">{selectedCard.user_id}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">模板ID</label>
                <p className="mt-1 text-gray-900">{selectedCard.template_id}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">创建时间</label>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedCard.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">页面与元素列表</label>
                <div className="mt-1 space-y-3 max-h-48 overflow-y-auto">
                  {selectedCard.pages && selectedCard.pages.map((page, idx) => (
                    <div key={page.id} className="border border-gray-200 rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">第 {idx + 1} 页 ({page.elements.length} 个元素)</p>
                      {page.elements.map((element) => (
                        <div
                          key={element.id}
                          className="p-2 bg-gray-50 rounded mt-1"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-900">{element.type}</span>
                            <span className="text-xs text-gray-500">{element.id.slice(0, 6)}...</span>
                          </div>
                          {element.type === 'text' && (
                            <p className="mt-1 text-sm text-gray-600 truncate">{element.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {selectedCard.background_music_url && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">背景音乐</label>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {selectedCard.background_music_url}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedCard(null);
                }}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManagementPage;