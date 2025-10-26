'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit3, Trash2, Archive, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import wardrobe components
import { WardrobeSidebar } from '@/features/wardrobe/components/WardrobeSidebar';
import { WardrobeGrid } from '@/features/wardrobe/components/WardrobeGrid';
import { ImageUploadModal } from '@/features/wardrobe/components/ImageUploadModal';
import { type MetadataFormData } from '@/features/wardrobe/components/MetadataForm';
import { MobileSidebarTrigger, SidebarToggleButton } from '@/features/wardrobe/components/SidebarToggleButton';

// Import hooks and types
import { useWardrobeData } from '@/features/wardrobe/hooks/useWardrobeData';
import { useSidebarState } from '@/features/wardrobe/hooks/useSidebarState';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';

type EditMode = 'delete' | 'archive' | 'donate' | null;

export default function WardrobePage() {
  const router = useRouter();
  const { user, isChecking } = useAuthGuard({
    requireAuth: true,
    redirectTo: '/login',
  });

  // Sidebar state management
  const { isOpen, isCollapsed, isMobile, toggleSidebar, closeSidebar, setIsOpen } = useSidebarState();

  // Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Wardrobe items state
  const [wardrobeItems, setWardrobeItems] = useState<ClothResponse[]>([]);
  const [isFetchingItems, setIsFetchingItems] = useState(true);

  // Edit mode state
  const [editMode, setEditMode] = useState<EditMode>(null);

  // Fetch wardrobe items from API
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      try {
        setIsFetchingItems(true);
        const url = `${window.location.origin}/api/wardrobe`;
        console.log('🔍 Fetching wardrobe items from:', url);

        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Wardrobe API response:', data);
          // ApiResponseHandler returns { success, data: { items, pagination, ... } }
          const items = data.data?.items || data.items || [];
          console.log('✅ Extracted items:', items.length, 'items');
          setWardrobeItems(items);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Failed to fetch wardrobe items:', response.status, errorData);
          setWardrobeItems([]); // Set empty array on error
        }
      } catch (error) {
        console.error('❌ Network error fetching wardrobe items:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        setWardrobeItems([]); // Set empty array on error
      } finally {
        setIsFetchingItems(false);
      }
    };

    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

  // Wardrobe data management
  const {
    items,
    filters,
    setFilters,
    activeCategory,
    navigateToCategory,
    isLoading,
    stats,
    handleFavoriteToggle,
  } = useWardrobeData({
    items: wardrobeItems, // Use fetched items
    enableStats: true,
    isLoading: isFetchingItems,
    onFavoriteToggle: async (itemId: string, isFavorite: boolean) => {
      try {
        const response = await fetch(`/api/wardrobe/${itemId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            favorite: isFavorite,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update favorite status');
        }

        // Update local state
        setWardrobeItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, favorite: isFavorite } : item
          )
        );
      } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error; // Re-throw to trigger optimistic update revert
      }
    },
  });

  // Count active filters for mobile trigger badge
  const activeFilterCount = [
    filters.searchTerm,
    filters.category,
    filters.season,
    filters.favorite,
    filters.status,
    filters.tags?.length,
  ].filter(Boolean).length;

  // Handle edit mode actions
  const handleEditAction = async (item: ClothResponse, action: 'delete' | 'archive' | 'donate') => {
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/wardrobe/${item.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to delete item');
        }

        // Remove from local state
        setWardrobeItems(prevItems => prevItems.filter(i => i.id !== item.id));
        console.log(`✅ Deleted item: ${item.name}`);
      } else {
        // Archive or donate
        const status = action === 'archive' ? 'archived' : 'donated';
        const response = await fetch(`/api/wardrobe/${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error(`Failed to ${action} item`);
        }

        // Remove from local state (archived/donated items shouldn't show in main view)
        setWardrobeItems(prevItems => prevItems.filter(i => i.id !== item.id));
        console.log(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)}d item: ${item.name}`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    }
  };

  // Handle item click
  const handleItemClick = (item: ClothResponse) => {
    // If in edit mode, perform the selected action
    if (editMode) {
      handleEditAction(item, editMode);
      return;
    }

    // Otherwise, navigate to item detail page
    router.push(`/wardrobe/${item.id}`);
  };

  // Handle successful upload
  const handleUploadSuccess = async (itemId: string, metadata?: MetadataFormData) => {
    // Close the modal first for better UX
    setIsUploadModalOpen(false);

    // If metadata contains tags, add them to the sidebar filter
    if (metadata?.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      const existingTags = filters.tags || [];
      const newTags = metadata.tags.filter((tag: string) => !existingTags.includes(tag));
      
      if (newTags.length > 0) {
        setFilters({
          ...filters,
          tags: [...existingTags, ...newTags],
        });
        console.log('✅ Added tags to filters:', newTags);
      }
    }

    // Refresh the wardrobe items
    try {
      const response = await fetch('/api/wardrobe', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.data?.items || data.items || [];
        console.log('✅ Refreshed wardrobe items:', items.length);
        setWardrobeItems(items);
      }
    } catch (error) {
      console.error('Error refreshing items:', error);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.75rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-3.75rem)] overflow-hidden">
      {/* Sidebar - Responsive */}
      <WardrobeSidebar
        activeCategory={activeCategory}
        filters={filters}
        onNavigate={navigateToCategory}
        onFiltersChange={setFilters}
        categoryCounts={stats?.byCategory}
        favoritesCount={stats?.favorites}
        isOpen={isOpen}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
        onClose={closeSidebar}
        onToggle={toggleSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Sidebar Trigger - Floating FAB */}
        <MobileSidebarTrigger
          onClick={() => setIsOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        {/* Desktop Expand Button - Shows when sidebar is collapsed */}
        {!isMobile && isCollapsed && (
          <div className="absolute top-6 left-6 z-10">
            <SidebarToggleButton
              isCollapsed={isCollapsed}
              onClick={toggleSidebar}
              isMobile={false}
            />
          </div>
        )}

        <div className={cn("p-6 md:p-8", isCollapsed && "ml-12")}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {activeCategory ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}` : 'All Items'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {stats?.total || 0} items in your collection
              </p>
            </div>
            <div className="flex gap-2">
              {/* Edit/Cancel Button */}
              {editMode ? (
                <Button
                  variant="outline"
                  onClick={() => setEditMode(null)}
                  className="border-border"
                >
                  Cancel
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-border">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditMode('delete')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditMode('archive')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditMode('donate')}>
                      <Heart className="h-4 w-4 mr-2" />
                      Donate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Add Item Button */}
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Grid */}
          <WardrobeGrid
            items={items}
            filters={filters}
            isLoading={isLoading}
            onItemClick={handleItemClick}
            onFavoriteToggle={handleFavoriteToggle}
            onAddItem={() => setIsUploadModalOpen(true)}
          />
        </div>
      </main>

      {/* Upload Modal */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
