'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Heart,
  Calendar,
  Sun,
  Cloud,
  Snowflake,
  Leaf,
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { MetadataForm, type MetadataFormData } from '@/features/wardrobe/components/MetadataForm';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';
import { toast } from 'sonner';

// Helper Components
const ErrorAlert = ({ error, title = "Error" }: { error: string; title?: string }) => (
  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
    <div>
      <p className="font-medium text-destructive">{title}</p>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  </div>
);

const NotFoundState = ({ message, subMessage }: { message: string; subMessage: string }) => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
      <AlertCircle className="w-16 h-16 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{message}</h2>
        <p className="text-muted-foreground">{subMessage}</p>
      </div>
      <Button onClick={() => router.push('/wardrobe')}>
        <ArrowLeft className="w-4 h-4" />
        Back to Wardrobe
      </Button>
    </div>
  );
};

const MetadataRow = ({ 
  label, 
  value, 
  icon: Icon 
}: { 
  label: string; 
  value: string | number; 
  icon?: LucideIcon 
}) => (
  <>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
    <Separator />
  </>
);

const ColorPalette = ({ 
  item, 
  isHovered, 
  onHoverChange 
}: { 
  item: ClothResponse; 
  isHovered: boolean; 
  onHoverChange: (hovered: boolean) => void;
}) => {
  const handleColorClick = (color: string) => {
    navigator.clipboard.writeText(color);
    toast.success('Color copied!', { description: color, duration: 2000 });
  };

  return (
    <div
      className="absolute z-10 -top-4 -right-10"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="bg-card rounded-full shadow-lg p-2 transition-all duration-700 ease-in-out">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer transition-all duration-300 hover:scale-110"
            style={{ backgroundColor: item.dominantColor }}
            title={`Dominant: ${item.dominantColor}`}
            onClick={() => handleColorClick(item.dominantColor)}
          />
          <div
            className="overflow-hidden transition-all duration-700 ease-in-out"
            style={{
              maxHeight: isHovered ? '225px' : '0px',
              opacity: isHovered ? 1 : 0,
              transitionDelay: isHovered ? '0ms' : '150ms',
            }}
          >
            <div className="flex flex-col items-center gap-1.5">
              {item.colors
                .filter((color) => color !== item.dominantColor)
                .map((color, index) => (
                  <div
                    key={index}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-md cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ backgroundColor: color, animationDelay: `${index * 50}ms` }}
                    title={color}
                    onClick={() => handleColorClick(color)}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClothItemPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;

  const [item, setItem] = useState<ClothResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheckingOutfits, setIsCheckingOutfits] = useState(false);
  const [affectedOutfits, setAffectedOutfits] = useState<{ id: string; name: string; mode: string; previewUrl: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isColorPaletteHovered, setIsColorPaletteHovered] = useState(false);

  // Utility functions
  const formatRelativeDate = (date: Date | string) => {
    const diffInSeconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const intervals = [
      { threshold: 60, unit: 'second' },
      { threshold: 3600, unit: 'minute', divisor: 60 },
      { threshold: 86400, unit: 'hour', divisor: 3600 },
      { threshold: 604800, unit: 'day', divisor: 86400 },
      { threshold: 2592000, unit: 'week', divisor: 604800 },
      { threshold: Infinity, unit: 'month', divisor: 2592000 }
    ];
    
    if (diffInSeconds < 60) return 'just now';
    
    for (const { threshold, unit, divisor } of intervals) {
      if (diffInSeconds < threshold && divisor) {
        const value = Math.floor(diffInSeconds / divisor);
        return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
      }
    }
    return '';
  };

  const formatFullDate = (date: Date | string) => 
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

  const seasonIcons: Record<string, LucideIcon> = {
    summer: Sun, winter: Snowflake, autumn: Leaf, fall: Leaf, spring: Cloud
  };

  const getSeasonIcon = (season: string) => {
    const Icon = seasonIcons[season.toLowerCase()];
    return Icon ? <Icon className="w-3 h-3" /> : null;
  };

  const getWearCountColor = (count: number) => 
    count > 20 ? 'text-chart-2' : count > 5 ? 'text-chart-4' : 'text-muted-foreground';

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => 
    status === 'active' ? 'default' : status === 'archived' ? 'secondary' : 'outline';

  // API calls
  const fetchItem = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/wardrobe/${itemId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch item');
      const data = await response.json();
      setItem(data.data || data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  const apiCall = async (
    method: string, 
    body?: object, 
    onSuccess?: (data: ClothResponse) => void
  ) => {
    try {
      setError(null);
      const response = await fetch(`/api/wardrobe/${itemId}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) throw new Error(`Failed to ${method.toLowerCase()} item`);
      
      if (method !== 'DELETE') {
        const data = await response.json();
        onSuccess?.(data.data || data);
      } else {
        router.push('/wardrobe');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${method.toLowerCase()} item`);
      throw err;
    }
  };

  const handleUpdate = async (formData: MetadataFormData) => {
    setIsUpdating(true);
    await apiCall('PATCH', formData, (data) => {
      setItem(data);
      setIsEditing(false);
      toast.success('Item updated successfully');
    }).catch((err) => {
      toast.error('Failed to update item', { description: err.message });
    }).finally(() => setIsUpdating(false));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await apiCall('DELETE')
      .then(() => {
        toast.success('Item deleted successfully');
      })
      .catch((err) => {
        setIsDeleteDialogOpen(false);
        toast.error('Failed to delete item', { description: err.message });
      })
      .finally(() => setIsDeleting(false));
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    setIsFavoriting(true);
    const newFavoriteState = !item.favorite;
    await apiCall('PATCH', { favorite: newFavoriteState }, (data) => {
      setItem(data);
      toast.success(newFavoriteState ? 'Added to favorites' : 'Removed from favorites');
    })
      .catch((err) => {
        toast.error('Failed to update favorite status', { description: err.message });
      })
      .finally(() => setIsFavoriting(false));
  };

  const checkAffectedOutfits = async () => {
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

  const handleDeleteDialogOpen = async () => {
    await checkAffectedOutfits();
    setIsDeleteDialogOpen(true);
  };

  useEffect(() => { fetchItem(); }, [itemId, fetchItem]);

  // Render states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="space-y-4 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return <NotFoundState 
      message="Item Not Found" 
      subMessage="This clothing item may have been deleted or moved." 
    />;
  }

  if (!item) {
    return <NotFoundState 
      message="Item Not Found" 
      subMessage="The item you're looking for doesn't exist." 
    />;
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={isUpdating}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Item</h1>
        </div>
        
        {error && <ErrorAlert error={error} />}
        
        <Card>
          <CardContent className="pt-6">
            <MetadataForm
              initialValues={{
                name: item.name,
                category: item.category,
                subcategory: item.subcategory,
                season: item.season,
                styleType: item.styleType,
                tags: item.tags,
                brand: item.brand,
                purchaseDate: item.purchaseDate,
                price: item.price,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isUpdating}
              submitText="Save Changes"
              showCancelButton={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <Button variant="ghost" onClick={() => router.push('/wardrobe')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Wardrobe
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="destructive" onClick={handleDeleteDialogOpen} disabled={isDeleting || isCheckingOutfits} className="gap-2">
            {isCheckingOutfits ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isCheckingOutfits ? 'Checking...' : isDeleting ? 'Deleting...' : 'Delete'}</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this item? This action cannot be undone and the item will be permanently removed from your wardrobe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && <div className="mb-6"><ErrorAlert error={error} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 lg:gap-8">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="bg-accent border border-border rounded-xl shadow-md p-8 transition-shadow hover:shadow-lg relative">
            <div className="relative aspect-square w-full max-w-[600px] mx-auto">
              <Image
                src={item.optimizedUrl || item.originalUrl}
                alt={`${item.name} - ${item.category}`}
                fill
                className="object-contain transition-transform hover:scale-105 duration-500"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                unoptimized
              />
              <ColorPalette 
                item={item} 
                isHovered={isColorPaletteHovered}
                onHoverChange={setIsColorPaletteHovered}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
          {/* Essential Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <h1 className="text-3xl font-bold leading-tight">{item.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusVariant(item.status)} className="capitalize">
                    {item.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={isFavoriting}
                    className="gap-1.5 h-8"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${item.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs">{item.favorite ? 'Favorited' : 'Favorite'}</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                {['category', 'subcategory'].map((field) => (
                  <div key={field} className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {field}
                    </span>
                    <p className="text-sm font-medium capitalize">
                      {item[field as keyof ClothResponse] as string}
                    </p>
                  </div>
                ))}
              </div>

              {item.brand && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Brand</span>
                    <span className="text-sm font-medium">{item.brand}</span>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Season</span>
                <div className="flex flex-wrap gap-2">
                  {item.season.map((s) => (
                    <Badge key={s} variant="outline" className="gap-1.5 capitalize">
                      {getSeasonIcon(s)}
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Style</span>
                <span className="text-sm font-medium">{item.styleType}</span>
              </div>

              {item.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Item History */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Item History
              </h2>
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    Wear Count
                  </div>
                  <span className={`text-sm font-semibold ${getWearCountColor(item.wearCount)}`}>
                    {item.wearCount} {item.wearCount === 1 ? 'time' : 'times'}
                  </span>
                </div>
                <Separator />
                
                {item.price && <MetadataRow label="Price" value={`$${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}`} icon={DollarSign} />}
                {item.purchaseDate && <MetadataRow label="Purchased" value={formatFullDate(item.purchaseDate)} icon={ShoppingBag} />}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Added</span>
                  <span className="text-sm font-medium">{formatRelativeDate(item.createdAt)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}