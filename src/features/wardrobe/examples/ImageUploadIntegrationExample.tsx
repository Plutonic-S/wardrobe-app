"use client";

/**
 * Complete ImageUploadModal Integration Examples
 * Demonstrates various ways to integrate ImageUploadModal with your application
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { WardrobeItemCard } from '../components/WardrobeItemCard';
import { ClothResponse } from '../types/wardrobe.types';

/**
 * Example 1: Basic Integration with Wardrobe Page
 * Shows minimal integration with upload modal
 */
export function BasicWardrobeIntegration() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<ClothResponse[]>([]);

  const handleUploadSuccess = useCallback((itemId: string) => {
    console.log('Item uploaded successfully:', itemId);
    setIsUploadModalOpen(false);

    // Fetch the new item and add to list
    fetchAndAddItem(itemId);
  }, []);

  const fetchAndAddItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/wardrobe/${itemId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const newItem: ClothResponse = await response.json();
        setWardrobeItems((prev) => [newItem, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching new item:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Wardrobe</h1>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {wardrobeItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">No items yet</p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wardrobeItems.map((item) => (
            <WardrobeItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

/**
 * Example 2: Integration with Navigation
 * Navigates to item detail page after successful upload
 */
export function NavigationIntegration() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadSuccess = useCallback(
    (itemId: string) => {
      // Close modal
      setIsUploadModalOpen(false);

      // Navigate to the item detail page
      router.push(`/wardrobe/${itemId}`);

      // Or navigate to wardrobe page
      // router.push('/wardrobe');
    },
    [router]
  );

  return (
    <div>
      <Button onClick={() => setIsUploadModalOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

/**
 * Example 3: Integration with React Query
 * Uses React Query for data fetching and cache invalidation
 */
export function ReactQueryIntegration() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Assuming you have a React Query setup
  // const queryClient = useQueryClient();
  // const { data: items } = useQuery({
  //   queryKey: ['wardrobe'],
  //   queryFn: fetchWardrobeItems,
  // });

  const handleUploadSuccess = useCallback((itemId: string) => {
    console.log('Item uploaded:', itemId);

    // Invalidate and refetch wardrobe items
    // queryClient.invalidateQueries({ queryKey: ['wardrobe'] });

    // Or optimistically add the new item
    // queryClient.setQueryData(['wardrobe'], (old: ClothResponse[]) => {
    //   return [newItem, ...old];
    // });

    setIsUploadModalOpen(false);
  }, []);

  return (
    <div>
      <Button onClick={() => setIsUploadModalOpen(true)}>
        Add Item
      </Button>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

/**
 * Example 4: Integration with Custom Endpoints
 * Uses custom API endpoints for upload and metadata
 */
export function CustomEndpointsIntegration() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadSuccess = useCallback((itemId: string) => {
    console.log('Item uploaded to custom endpoint:', itemId);
    setIsUploadModalOpen(false);
  }, []);

  return (
    <div>
      <Button onClick={() => setIsUploadModalOpen(true)}>
        Add Item
      </Button>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        uploadEndpoint="/api/v2/items/upload"
        metadataEndpoint="/api/v2/items/{imageId}/details"
      />
    </div>
  );
}

/**
 * Example 5: Floating Action Button (FAB)
 * Mobile-friendly FAB for adding items
 */
export function FABIntegration() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadSuccess = useCallback((itemId: string) => {
    console.log('Item uploaded:', itemId);
    setIsUploadModalOpen(false);
  }, []);

  return (
    <>
      {/* Your page content */}
      <div className="min-h-screen">
        {/* ... */}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsUploadModalOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow z-50"
        aria-label="Add item"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

/**
 * Example 6: Empty State with Upload
 * Shows upload modal as primary action when wardrobe is empty
 */
export function EmptyStateIntegration() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<ClothResponse[]>([]);

  const handleUploadSuccess = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/wardrobe/${itemId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const newItem: ClothResponse = await response.json();
        setWardrobeItems([newItem]);
      }
    } catch (error) {
      console.error('Error fetching new item:', error);
    }

    setIsUploadModalOpen(false);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {wardrobeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <div className="p-6 bg-gray-100 rounded-full">
                <Upload className="w-16 h-16 text-gray-400" aria-hidden="true" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Start Building Your Wardrobe
              </h2>
              <p className="text-lg text-gray-600">
                Upload images of your clothing items to organize your wardrobe,
                create outfits, and get personalized style recommendations.
              </p>
            </div>

            <Button
              onClick={() => setIsUploadModalOpen(true)}
              size="lg"
              className="mt-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Item
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wardrobeItems.map((item) => (
            <WardrobeItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

/**
 * Example 7: Programmatic Opening
 * Opens modal based on URL parameter or other conditions
 */
export function ProgrammaticIntegration() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Open modal on mount if URL has ?upload=true
  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   if (params.get('upload') === 'true') {
  //     setIsUploadModalOpen(true);
  //   }
  // }, []);

  const handleUploadSuccess = useCallback(
    (itemId: string) => {
      console.log('Item uploaded:', itemId);
      setIsUploadModalOpen(false);

      // Clear URL parameter
      router.push('/wardrobe');
    },
    [router]
  );

  return (
    <div>
      <Button onClick={() => setIsUploadModalOpen(true)}>
        Add Item
      </Button>

      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}

/**
 * Example 8: Complete Page with All Features
 * Full-featured wardrobe page with upload modal integration
 */
export function CompletePageIntegration() {
  const router = useRouter();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<ClothResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = useCallback(async (itemId: string) => {
    console.log('Item uploaded successfully:', itemId);

    try {
      setIsLoading(true);

      // Fetch the new item
      const response = await fetch(`/api/wardrobe/${itemId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const newItem: ClothResponse = await response.json();

        // Add to the beginning of the list
        setWardrobeItems((prev) => [newItem, ...prev]);

        // Show success notification (use your notification system)
        // toast.success('Item added successfully!');
      }
    } catch (error) {
      console.error('Error fetching new item:', error);
      // toast.error('Failed to load new item');
    } finally {
      setIsLoading(false);
      setIsUploadModalOpen(false);
    }
  }, []);

  const handleItemClick = useCallback(
    (item: ClothResponse) => {
      router.push(`/wardrobe/${item.id}`);
    },
    [router]
  );

  const handleFavoriteToggle = useCallback(
    async (itemId: string, isFavorite: boolean) => {
      try {
        const response = await fetch(`/api/wardrobe/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorite: isFavorite }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to update favorite');
        }

        // Update local state
        setWardrobeItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, favorite: isFavorite } : item
          )
        );
      } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error; // Re-throw to trigger optimistic update revert
      }
    },
    []
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wardrobe</h1>
          <p className="text-gray-600 mt-1">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && wardrobeItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Start Building Your Wardrobe
            </h2>
            <p className="text-gray-600">
              Upload images of your clothing items to organize your wardrobe and
              create amazing outfits.
            </p>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              size="lg"
              className="mt-4 gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Item
            </Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && wardrobeItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wardrobeItems.map((item) => (
            <WardrobeItemCard
              key={item.id}
              item={item}
              onClick={handleItemClick}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
