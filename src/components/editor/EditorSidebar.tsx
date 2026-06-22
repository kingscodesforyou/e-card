import { useState } from 'react';
import { Layers, Music, Settings, ChevronsUpDown } from 'lucide-react';
import PagesPanel from './PagesPanel';
import MusicPanel from './MusicPanel';
import PageSettingsPanel from './PageSettingsPanel';
import { LayersPanel } from './LayersPanel';

const EditorSidebar = () => {
  const [activeTab, setActiveTab] = useState<'pages' | 'layers' | 'music' | 'settings'>('pages');

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 ${
            activeTab === 'pages'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          页面
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 ${
            activeTab === 'layers'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChevronsUpDown className="w-4 h-4" />
          图层
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 ${
            activeTab === 'music'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Music className="w-4 h-4" />
          音乐
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 ${
            activeTab === 'settings'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          设置
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 p-3 min-h-0 overflow-hidden">
        <div className="h-full">
          {activeTab === 'pages' && <PagesPanel />}
          {activeTab === 'layers' && <LayersPanel />}
          {activeTab === 'music' && <MusicPanel />}
          {activeTab === 'settings' && <PageSettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default EditorSidebar;
