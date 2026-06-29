import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useTemplatesStore } from '../../store';

/* ---------------------------------------------------------------
 * FilterSelect — 模块级组件，函数引用稳定，避免 React 卸载重挂
 * --------------------------------------------------------------- */
interface FilterSelectProps {
  label: string;
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  dropdownKey: string;
  openDropdown: string | null;
  setOpenDropdown: (key: string | null) => void;
}

const FilterSelect = ({
  label,
  items,
  selectedItem,
  onSelect,
  dropdownKey,
  openDropdown,
  setOpenDropdown,
}: FilterSelectProps) => {
  const isOpen = openDropdown === dropdownKey;

  return (
    <div className="relative flex-1 min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <button
        onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all text-sm"
      >
        <span
          className={
            selectedItem === '全部' ? 'text-gray-400 truncate' : 'text-gray-900 truncate'
          }
        >
          {selectedItem}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* CSS 显隐替代条件渲染，保持 DOM 挂载以保留 scrollTop */}
      <div
        className={`absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto transition-opacity duration-150 ${
          isOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
        // iOS 惯性滚动兼容
        style={{ WebkitOverflowScrolling: 'touch' as any }}
      >
        {items.map((item) => {
          const isSelected = selectedItem === item;
          return (
            <div
              key={item}
              role="option"
              aria-selected={isSelected}
              // 用 div + onMouseDown 替代 button + onClick，避免移动端 touch→click 误合成
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
                setOpenDropdown(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                isSelected
                  ? 'text-purple-600 bg-purple-50 font-medium'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------
 * FilterPanel — 主面板
 * --------------------------------------------------------------- */
const FilterPanel = () => {
  // 细粒度订阅 — 只订阅当前组件用到的属性，避免无关 store 变更触发重渲染
  const categories = useTemplatesStore((s) => s.categories);
  const occasions = useTemplatesStore((s) => s.occasions);
  const styles = useTemplatesStore((s) => s.styles);
  const selectedCategory = useTemplatesStore((s) => s.selectedCategory);
  const selectedOccasion = useTemplatesStore((s) => s.selectedOccasion);
  const selectedStyle = useTemplatesStore((s) => s.selectedStyle);
  const setSelectedCategory = useTemplatesStore((s) => s.setSelectedCategory);
  const setSelectedOccasion = useTemplatesStore((s) => s.setSelectedOccasion);
  const setSelectedStyle = useTemplatesStore((s) => s.setSelectedStyle);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => {
    setSelectedCategory('全部');
    setSelectedOccasion('全部');
    setSelectedStyle('全部');
  };

  const hasActiveFilters =
    selectedCategory !== '全部' || selectedOccasion !== '全部' || selectedStyle !== '全部';

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8" ref={panelRef}>
      <div className="flex items-center justify-between mb-4">
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

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <FilterSelect
          label="分类"
          items={categories}
          selectedItem={selectedCategory}
          onSelect={setSelectedCategory}
          dropdownKey="category"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
        />
        <FilterSelect
          label="场合"
          items={occasions}
          selectedItem={selectedOccasion}
          onSelect={setSelectedOccasion}
          dropdownKey="occasion"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
        />
        <FilterSelect
          label="风格"
          items={styles}
          selectedItem={selectedStyle}
          onSelect={setSelectedStyle}
          dropdownKey="style"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
        />
      </div>
    </div>
  );
};

export default FilterPanel;
