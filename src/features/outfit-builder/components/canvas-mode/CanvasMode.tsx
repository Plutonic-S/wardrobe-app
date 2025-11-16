'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Canvas } from './Canvas';
import { Button } from '@/components/ui/button';

/**
 * Canvas Mode Component
 * Allows users to drag wardrobe items onto a canvas and position them freely
 * Sidebar: 450px width on desktop, full-width on mobile, toggleable
 */
export function CanvasMode() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex w-full relative h-[600px] lg:h-[800px]">
      {/* Sidebar - Fixed 450px on desktop, full-width on mobile */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Toggle button - Shows when sidebar is closed */}
      {!isSidebarOpen && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-30 h-10 w-10 shadow-lg"
          aria-label="Open sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Canvas - Main area, drop zone for items */}
      <div className="flex-1 relative">
        <Canvas isSidebarOpen={isSidebarOpen} />
      </div>
    </div>
  );
}
