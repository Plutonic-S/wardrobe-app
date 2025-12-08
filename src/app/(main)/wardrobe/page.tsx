'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/features/auth/components/authGuard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit3, Trash2, Archive, Heart, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  const hasLoadedRef = useRef(false);

  // Edit mode state
  const [editMode, setEditMode] = useState<EditMode>(null);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ClothResponse | null>(null);
  const [isCheckingOutfits, setIsCheckingOutfits] = useState(false);
  const [affectedOutfits, setAffectedOutfits] = useState<{ id: string; name: string; mode: string; previewUrl: string | null }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch wardrobe items from API
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      try {
        // Only show skeleton on initial load
        if (!hasLoadedRef.current) {
          setIsFetchingItems(true);
        }
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
        hasLoadedRef.current = true;
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

  // Check affected outfits before delete
  const checkAffectedOutfits = async (itemId: string) => {
    setIsCheckingOutfits(true);
    try {
      const response = await fetch(`/api/wardrobe/${itemId}/check-outfits`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAffectedOutfits(data.data.outfits || []);
      }
    } catch (err) {
      console.error('Failed to check affected outfits:', err);
      setAffectedOutfits([]);
    } finally {
      setIsCheckingOutfits(false);
    }
  };

  // Confirm and delete item
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wardrobe/${itemToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove from local state
      setWardrobeItems(prevItems => prevItems.filter(i => i.id !== itemToDelete.id));
      console.log(`✅ Deleted item: ${itemToDelete.name}`);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setAffectedOutfits([]);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle edit mode actions
  const handleEditAction = async (item: ClothResponse, action: 'delete' | 'archive' | 'donate') => {
    try {
      if (action === 'delete') {
        // Show delete confirmation dialog
        setItemToDelete(item);
        await checkAffectedOutfits(item.id);
        setIsDeleteDialogOpen(true);
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
    // Note: Don't close the modal here - let the ImageUploadModal handle its own closing
    // This allows "Add Another Item" to work properly

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

    // If metadata contains seasons, add them to the sidebar filter
    if (metadata?.season && Array.isArray(metadata.season) && metadata.season.length > 0) {
      const existingSeasons = filters.season || [];
      const newSeasons = metadata.season.filter((s) => !existingSeasons.includes(s));
      
      if (newSeasons.length > 0) {
        setFilters({
          ...filters,
          season: [...existingSeasons, ...newSeasons],
        });
        console.log('✅ Added seasons to filters:', newSeasons);
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

        <div className={cn("p-6 md:p-8", isCollapsed && "md:ml-12")}>
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
            showCategoryHeadings={!activeCategory}
          />
        </div>
      </main>

      {/* Upload Modal */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete {itemToDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-base">
              <div>
              {isCheckingOutfits ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking for outfits that include this item...
                </div>
              ) : affectedOutfits.length > 0 ? (
                <div>
                  This item is used in <strong>{affectedOutfits.length}</strong> saved outfit{affectedOutfits.length > 1 ? 's' : ''}. Deleting the item will also delete those outfits.
                  <div className="mt-3 max-h-48 overflow-auto">
                    <ul className="space-y-2">
                      {affectedOutfits.map((o) => (
                        <li key={o.id} className="flex items-center gap-3">
                          {o.previewUrl ? (
                            <Image src={o.previewUrl} alt={o.name} width={40} height={40} className="w-10 h-10 rounded object-cover border" unoptimized />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted-foreground/10 border" />
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-medium block">{o.name}</span>
                            <span className="text-xs text-muted-foreground block">Mode: {o.mode}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">Are you sure you want to proceed?</div>
                </div>
              ) : (
                <span>Are you sure you want to delete this item? This action cannot be undone and the item will be permanently removed from your wardrobe.</span>
              )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : affectedOutfits.length > 0 ? `Delete item and ${affectedOutfits.length} outfit${affectedOutfits.length > 1 ? 's' : ''}` : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
