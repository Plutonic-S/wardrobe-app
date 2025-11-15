'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';

/**
 * Canvas Mode Component
 * Allows users to drag wardrobe items onto a canvas and position them freely
 */
export function CanvasMode() {
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default 320px
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = Math.max(250, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar - Resizable, shows wardrobe items */}
      <div className="relative" style={{ width: `${sidebarWidth}px` }}>
        <Sidebar />

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`
            absolute top-0 right-0 w-1 h-full cursor-col-resize
            bg-border hover:bg-primary transition-colors
            ${isResizing ? 'bg-primary' : ''}
          `}
          style={{ zIndex: 100 }}
        />
      </div>

      {/* Canvas - Main area, drop zone for items */}
      <div className="flex-1 relative border-l-2 border-border">
        <Canvas />
      </div>
    </div>
  );
}
