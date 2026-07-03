import { useState } from 'react';
import { X } from 'lucide-react';
import type { PuzzleTemplate } from '../../types';
import { puzzleCategories, getTemplatesByCategory } from './puzzleTemplates';
import { parseClipPath, convertPercentToUnit } from '../../lib/clipPathUtils';

interface PuzzleTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: PuzzleTemplate) => void;
}

const PAGE_SIZE = 7;

export default function PuzzleTemplateModal({ isOpen, onClose, onSelect }: PuzzleTemplateModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const templates = getTemplatesByCategory(selectedCategory);
  const totalPages = Math.ceil(templates.length / PAGE_SIZE);
  const paginatedTemplates = templates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleTemplateSelect = (template: PuzzleTemplate) => {
    onSelect(template);
    onClose();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getClipPathInfo = (cell: PuzzleTemplate['cells'][0], idx: number, templateId: string) => {
    const info = parseClipPath(cell.shapePath, cell.shapeType);
    if (info.useSvgClipPath && info.svgPathData) {
      return {
        ...info,
        clipPathValue: `url(#template-clip-${templateId}-${idx})`,
      };
    }
    return info;
  };

  const getBorderRadius = (cell: PuzzleTemplate['cells'][0]) => {
    if (cell.shapeType === 'circle') return '50%';
    if (!cell.shapeType && !cell.shapePath) return '4px';
    return '0px';
  };

  const renderTemplatePreview = (template: PuzzleTemplate) => {
    return (
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '0', height: '0' }}>
          {template.cells.map((cell, idx) => {
            const info = getClipPathInfo(cell, idx, template.id);
            if (info.useSvgClipPath && info.svgPathData) {
              return (
                <clipPath key={`clip-${idx}`} id={`template-clip-${template.id}-${idx}`} clipPathUnits="objectBoundingBox">
                  <path d={convertPercentToUnit(info.svgPathData)} />
                </clipPath>
              );
            }
            return null;
          })}
        </svg>
        {template.cells.map((cell, idx) => {
          const info = getClipPathInfo(cell, idx, template.id);
          const clipPath = info.clipPathValue || undefined;
          return (
            <div
              key={idx}
              className="absolute bg-gradient-to-br from-purple-400 to-pink-400"
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
                opacity: 0.6 + (idx % 3) * 0.15,
                borderRadius: getBorderRadius(cell),
                clipPath: clipPath,
                WebkitClipPath: clipPath,
              }}
            />
          );
        })}
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
            {template.cells.length}图
          </span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">选择拼图模板</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {puzzleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-7 gap-3">
            {paginatedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent group-hover:border-blue-400 group-hover:shadow-lg transition-all">
                  {renderTemplatePreview(template)}
                </div>
                <span className="text-xs text-gray-600 text-center max-w-full truncate group-hover:text-blue-500">
                  {template.name}
                </span>
              </button>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              暂无该分类的模板
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              共 {templates.length} 个模板
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-2.5 py-1 text-xs rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
