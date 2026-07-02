import type { PuzzleTemplate } from '../../types';

export const puzzleCategories = [
  { id: 'all', name: '全部' },
  { id: '2', name: '2图' },
  { id: '3', name: '3图' },
  { id: '4', name: '4图' },
  { id: '5', name: '5图' },
  { id: '6', name: '6图' },
  { id: '7', name: '7图' },
  { id: '8', name: '8图' },
  { id: '9', name: '9图' },
  { id: '10+', name: '10+图' },
];

export const puzzleTemplates: PuzzleTemplate[] = [
  {
    id: 'puzzle-2-horizontal',
    name: '左右两图',
    category: 2,
    cells: [
      { x: 0, y: 0, width: 50, height: 100 },
      { x: 50, y: 0, width: 50, height: 100 },
    ],
  },
  {
    id: 'puzzle-2-vertical',
    name: '上下两图',
    category: 2,
    cells: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 100, height: 50 },
    ],
  },
  {
    id: 'puzzle-2-big-left',
    name: '左大右小',
    category: 2,
    cells: [
      { x: 0, y: 0, width: 65, height: 100 },
      { x: 65, y: 0, width: 35, height: 100 },
    ],
  },
  {
    id: 'puzzle-2-big-right',
    name: '右大左小',
    category: 2,
    cells: [
      { x: 0, y: 0, width: 35, height: 100 },
      { x: 35, y: 0, width: 65, height: 100 },
    ],
  },
  {
    id: 'puzzle-2-heart',
    name: '心形',
    category: 2,
    cells: [
      { x: 0, y: 10, width: 50, height: 90 },
      { x: 50, y: 10, width: 50, height: 90 },
    ],
  },
  {
    id: 'puzzle-3-top-big',
    name: '上大下两小',
    category: 3,
    cells: [
      { x: 0, y: 0, width: 100, height: 60 },
      { x: 0, y: 60, width: 50, height: 40 },
      { x: 50, y: 60, width: 50, height: 40 },
    ],
  },
  {
    id: 'puzzle-3-left-big',
    name: '左大右两小',
    category: 3,
    cells: [
      { x: 0, y: 0, width: 60, height: 100 },
      { x: 60, y: 0, width: 40, height: 50 },
      { x: 60, y: 50, width: 40, height: 50 },
    ],
  },
  {
    id: 'puzzle-3-diagonal',
    name: '斜角三图',
    category: 3,
    cells: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 25, y: 50, width: 50, height: 50 },
    ],
  },
  {
    id: 'puzzle-3-circle',
    name: '圆形三图',
    category: 3,
    cells: [
      { x: 0, y: 0, width: 60, height: 60 },
      { x: 60, y: 0, width: 40, height: 40 },
      { x: 60, y: 40, width: 40, height: 60 },
    ],
  },
  {
    id: 'puzzle-4-grid',
    name: '四宫格',
    category: 4,
    cells: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 0, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ],
  },
  {
    id: 'puzzle-4-diamond',
    name: '菱形',
    category: 4,
    cells: [
      { x: 25, y: 0, width: 50, height: 50 },
      { x: 0, y: 25, width: 50, height: 50 },
      { x: 50, y: 25, width: 50, height: 50 },
      { x: 25, y: 50, width: 50, height: 50 },
    ],
  },
  {
    id: 'puzzle-4-big-center',
    name: '中心大图',
    category: 4,
    cells: [
      { x: 0, y: 0, width: 35, height: 35 },
      { x: 65, y: 0, width: 35, height: 35 },
      { x: 0, y: 65, width: 35, height: 35 },
      { x: 35, y: 35, width: 30, height: 30 },
    ],
  },
  {
    id: 'puzzle-4-horizontal',
    name: '水平四图',
    category: 4,
    cells: [
      { x: 0, y: 0, width: 25, height: 100 },
      { x: 25, y: 0, width: 25, height: 100 },
      { x: 50, y: 0, width: 25, height: 100 },
      { x: 75, y: 0, width: 25, height: 100 },
    ],
  },
  {
    id: 'puzzle-5-cross',
    name: '十字形',
    category: 5,
    cells: [
      { x: 33, y: 0, width: 34, height: 33 },
      { x: 0, y: 33, width: 33, height: 34 },
      { x: 33, y: 33, width: 34, height: 34 },
      { x: 67, y: 33, width: 33, height: 34 },
      { x: 33, y: 67, width: 34, height: 33 },
    ],
  },
  {
    id: 'puzzle-5-big-top',
    name: '上大下四小',
    category: 5,
    cells: [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 25, height: 50 },
      { x: 25, y: 50, width: 25, height: 50 },
      { x: 50, y: 50, width: 25, height: 50 },
      { x: 75, y: 50, width: 25, height: 50 },
    ],
  },
  {
    id: 'puzzle-6-grid',
    name: '六宫格',
    category: 6,
    cells: [
      { x: 0, y: 0, width: 33.33, height: 33.33 },
      { x: 33.33, y: 0, width: 33.34, height: 33.33 },
      { x: 66.67, y: 0, width: 33.33, height: 33.33 },
      { x: 0, y: 33.33, width: 33.33, height: 33.34 },
      { x: 33.33, y: 33.33, width: 33.34, height: 33.34 },
      { x: 66.67, y: 33.33, width: 33.33, height: 33.34 },
    ],
  },
  {
    id: 'puzzle-6-2x3',
    name: '2×3布局',
    category: 6,
    cells: [
      { x: 0, y: 0, width: 50, height: 33.33 },
      { x: 50, y: 0, width: 50, height: 33.33 },
      { x: 0, y: 33.33, width: 50, height: 33.34 },
      { x: 50, y: 33.33, width: 50, height: 33.34 },
      { x: 0, y: 66.67, width: 50, height: 33.33 },
      { x: 50, y: 66.67, width: 50, height: 33.33 },
    ],
  },
  {
    id: 'puzzle-6-hexagon',
    name: '六边形',
    category: 6,
    cells: [
      { x: 33, y: 0, width: 34, height: 50 },
      { x: 0, y: 25, width: 33, height: 50 },
      { x: 67, y: 25, width: 33, height: 50 },
      { x: 33, y: 50, width: 34, height: 50 },
    ],
  },
  {
    id: 'puzzle-7-center',
    name: '中心七图',
    category: 7,
    cells: [
      { x: 33, y: 0, width: 34, height: 33 },
      { x: 0, y: 33, width: 33, height: 34 },
      { x: 67, y: 33, width: 33, height: 34 },
      { x: 33, y: 33, width: 34, height: 34 },
      { x: 0, y: 67, width: 33, height: 33 },
      { x: 33, y: 67, width: 34, height: 33 },
      { x: 67, y: 67, width: 33, height: 33 },
    ],
  },
  {
    id: 'puzzle-8-grid',
    name: '八宫格',
    category: 8,
    cells: [
      { x: 0, y: 0, width: 25, height: 25 },
      { x: 25, y: 0, width: 25, height: 25 },
      { x: 50, y: 0, width: 25, height: 25 },
      { x: 75, y: 0, width: 25, height: 25 },
      { x: 0, y: 25, width: 25, height: 25 },
      { x: 25, y: 25, width: 25, height: 25 },
      { x: 50, y: 25, width: 25, height: 25 },
      { x: 75, y: 25, width: 25, height: 25 },
    ],
  },
  {
    id: 'puzzle-9-grid',
    name: '九宫格',
    category: 9,
    cells: [
      { x: 0, y: 0, width: 33.33, height: 33.33 },
      { x: 33.33, y: 0, width: 33.34, height: 33.33 },
      { x: 66.67, y: 0, width: 33.33, height: 33.33 },
      { x: 0, y: 33.33, width: 33.33, height: 33.34 },
      { x: 33.33, y: 33.33, width: 33.34, height: 33.34 },
      { x: 66.67, y: 33.33, width: 33.33, height: 33.34 },
      { x: 0, y: 66.67, width: 33.33, height: 33.33 },
      { x: 33.33, y: 66.67, width: 33.34, height: 33.33 },
      { x: 66.67, y: 66.67, width: 33.33, height: 33.33 },
    ],
  },
  {
    id: 'puzzle-9-heart-grid',
    name: '心形拼图',
    category: 9,
    cells: [
      { x: 33, y: 0, width: 34, height: 33 },
      { x: 0, y: 33, width: 33, height: 33 },
      { x: 33, y: 33, width: 34, height: 34 },
      { x: 67, y: 33, width: 33, height: 33 },
      { x: 0, y: 67, width: 25, height: 33 },
      { x: 25, y: 67, width: 25, height: 33 },
      { x: 50, y: 67, width: 25, height: 33 },
      { x: 75, y: 67, width: 25, height: 33 },
    ],
  },
  {
    id: 'puzzle-10-plus',
    name: '十图以上',
    category: 10,
    cells: [
      { x: 0, y: 0, width: 20, height: 25 },
      { x: 20, y: 0, width: 20, height: 25 },
      { x: 40, y: 0, width: 20, height: 25 },
      { x: 60, y: 0, width: 20, height: 25 },
      { x: 80, y: 0, width: 20, height: 25 },
      { x: 0, y: 25, width: 20, height: 25 },
      { x: 20, y: 25, width: 20, height: 25 },
      { x: 40, y: 25, width: 20, height: 25 },
      { x: 60, y: 25, width: 20, height: 25 },
      { x: 80, y: 25, width: 20, height: 25 },
      { x: 0, y: 50, width: 33.33, height: 50 },
      { x: 33.33, y: 50, width: 33.34, height: 50 },
      { x: 66.67, y: 50, width: 33.33, height: 50 },
    ],
  },
];

export const getTemplatesByCategory = (categoryId: string): PuzzleTemplate[] => {
  if (categoryId === 'all') {
    return puzzleTemplates;
  }
  const count = parseInt(categoryId, 10);
  if (categoryId === '10+') {
    return puzzleTemplates.filter(t => t.category >= 10);
  }
  return puzzleTemplates.filter(t => t.category === count);
};
