import { X } from 'lucide-react';
import { useTemplatesStore } from '../../store';

const FilterPanel = () => {
  const {
    categories,
    occasions,
    styles,
    selectedCategory,
    selectedOccasion,
    selectedStyle,
    setSelectedCategory,
    setSelectedOccasion,
    setSelectedStyle,
  } = useTemplatesStore();

  const clearFilters = () => {
    setSelectedCategory('全部');
    setSelectedOccasion('全部');
    setSelectedStyle('全部');
  };

  const hasActiveFilters = selectedCategory !== '全部' || selectedOccasion !== '全部' || selectedStyle !== '全部';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors"
          >
            <X className="w-4 h-4" />
            清除筛选
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">分类</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">场合</h3>
          <div className="flex flex-wrap gap-2">
            {occasions.map((occasion) => (
              <button
                key={occasion}
                onClick={() => setSelectedOccasion(occasion)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedOccasion === occasion
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">风格</h3>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedStyle === style
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;