import { useMemo } from 'react';
import type { CardPage, CardElement } from '../../types';
import { getElementVisualStyle } from '../../lib/elementStyle';

interface PageThumbnailProps {
  page: CardPage;
}

/**
 * 页面缩略图组件
 * 为页面列表中的每一页渲染其实际内容（背景 + 所有元素）的缩略版本
 * 复用了与 Canvas 相同的 getElementVisualStyle 样式计算，确保缩略图与画布一致
 * 通过 Zustand store 的数据订阅实现实时更新
 */
const PageThumbnail = ({ page }: PageThumbnailProps) => {
  // 按 zIndex 升序排列，与 Canvas 一致
  const elements = useMemo(
    () => [...(page.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [page.elements]
  );

  /** 渲染单个元素（精简版，无交互） */
  const renderMiniElement = (element: CardElement) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: element.size ? `${element.size.width}%` : 'auto',
      height: element.size ? `${element.size.height}%` : 'auto',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: Math.max(Math.round(element.zIndex || 1), 1),
      pointerEvents: 'none',
      userSelect: 'none',
    };
    const style = getElementVisualStyle(element, baseStyle);

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={style}
          className="px-1 py-0.5 leading-tight"
        >
          {element.content}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <div
          key={element.id}
          style={style}
        >
          <img
            src={element.content}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            draggable={false}
          />
        </div>
      );
    }

    if (element.type === 'shape') {
      return (
        <div
          key={element.id}
          style={style}
        />
      );
    }

    if (element.type === 'icon') {
      return (
        <div
          key={element.id}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {element.content}
        </div>
      );
    }

    if (element.type === 'group') {
      const childElements = (element.childElements || []) as CardElement[];
      const gx = element.position.x || 0;
      const gy = element.position.y || 0;
      const gw = element.size?.width || 100;
      const gh = element.size?.height || 100;

      return (
        <div
          key={element.id}
          style={{
            ...style,
            border: '1px dashed #94a3b8',
            borderRadius: '4px',
            overflow: 'visible',
          }}
        >
          {childElements.map((child) => {
            const childLayoutStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${((child.position.x || 0) - gx) / gw * 100}%`,
              top: `${((child.position.y || 0) - gy) / gh * 100}%`,
              width: child.size ? `${child.size.width / gw * 100}%` : 'auto',
              height: child.size ? `${child.size.height / gh * 100}%` : 'auto',
              transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
              zIndex: Math.max(Math.round(child.zIndex || 1), 1),
              pointerEvents: 'none',
              userSelect: 'none',
            };
            const childStyle = getElementVisualStyle(child, childLayoutStyle);

            if (child.type === 'image') {
              return (
                <img
                  key={child.id}
                  src={child.content}
                  alt=""
                  style={childStyle}
                  className="object-cover"
                  draggable={false}
                />
              );
            }
            if (child.type === 'shape') {
              return <div key={child.id} style={childStyle} />;
            }
            return (
              <div key={child.id} style={childStyle}>
                {child.content}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundImage: page.backgroundUrl ? `url(${page.backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: page.backgroundColor || '#ffffff',
      }}
    >
      {/* 渲染所有元素 */}
      {elements.map(renderMiniElement)}

      {/* 空白页提示 */}
      {elements.length === 0 && !page.backgroundUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[10px] pointer-events-none">
          空白页
        </div>
      )}
    </div>
  );
};

export default PageThumbnail;
