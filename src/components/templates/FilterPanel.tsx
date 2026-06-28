import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => {
    setSelectedCategory('全部');
    setSelectedOccasion('全部');
    setSelectedStyle('全部');
  };

  const hasActiveFilters =
    selectedCategory !== '全部' || selectedOccasion !== '全部' || selectedStyle !== '全部';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  interface FilterSelectProps {
    label: string;
    items: string[];
    selectedItem: string;
    onSelect: (item: string) => void;
    dropdownKey: string;
  }

  const FilterSelect = ({ label, items, selectedItem, onSelect, dropdownKey }: FilterSelectProps) => (
    <div className="relative flex-1 min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <button
        onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border border-gray-200 rounded-lg bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all text-sm"
      >
        <span className={selectedItem === '全部' ? 'text-gray-400 truncate' : 'text-gray-900 truncate'}>
          {selectedItem}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            openDropdown === dropdownKey ? 'rotate-180' : ''
          }`}
        />
      </button>
      {openDropdown === dropdownKey && (
        <div className="absolute z-20 mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item}
              onClick={() => {
                onSelect(item);
                setOpenDropdown(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedItem === item
                  ? 'text-purple-600 bg-purple-50 font-medium'
                  : 'text-gray-700 hover:bg-purple-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8" ref={dropdownRef}>
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
        />
        <FilterSelect
          label="场合"
          items={occasions}
          selectedItem={selectedOccasion}
          onSelect={setSelectedOccasion}
          dropdownKey="occasion"
        />
        <FilterSelect
          label="风格"
          items={styles}
          selectedItem={selectedStyle}
          onSelect={setSelectedStyle}
          dropdownKey="style"
        />
      </div>
    </div>
  );
};

export default FilterPanel;
