"use client";

/**
 * MetadataForm Component
 * Form for entering clothing item metadata after upload
 */

import { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClothCategory, Season } from '../types/wardrobe.types';

/**
 * Category display names
 */
const CATEGORY_LABELS: Record<ClothCategory, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

/**
 * Season display names
 */
const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

/**
 * Form data interface
 */
export interface MetadataFormData {
  name: string;
  category: ClothCategory;
  subcategory?: string;
  season: Season[];
  styleType?: string;
  tags: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;
}

export interface MetadataFormProps {
  /**
   * Initial form values
   */
  initialValues?: Partial<MetadataFormData>;

  /**
   * Callback when form is submitted
   */
  onSubmit: (data: MetadataFormData) => void;

  /**
   * Callback when form is cancelled
   */
  onCancel?: () => void;

  /**
   * Whether the form is submitting
   */
  isSubmitting?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Submit button text
   */
  submitText?: string;

  /**
   * Show cancel button
   */
  showCancelButton?: boolean;
}

/**
 * MetadataForm component
 */
export function MetadataForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
  submitText = 'Add to Wardrobe',
  showCancelButton = false,
}: MetadataFormProps) {
  // Form state
  const [name, setName] = useState(initialValues?.name || '');
  const [category, setCategory] = useState<ClothCategory | ''>(
    initialValues?.category || ''
  );
  const [subcategory, setSubcategory] = useState(initialValues?.subcategory || '');
  const [seasons, setSeasons] = useState<Season[]>(initialValues?.season || []);
  const [styleType, setStyleType] = useState(initialValues?.styleType || '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [purchaseDate, setPurchaseDate] = useState(
    initialValues?.purchaseDate ? new Date(initialValues.purchaseDate).toISOString().split('T')[0] : ''
  );
  const [price, setPrice] = useState(initialValues?.price?.toString() || '');

  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    price?: string;
  }>({});

  // Character count
  const nameCharCount = name.length;
  const maxNameLength = 100;

  /**
   * Validates form data
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: { name?: string; category?: string; price?: string } = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (name.length > maxNameLength) {
      newErrors.name = `Name must be ${maxNameLength} characters or less`;
    }

    // Validate category
    if (!category) {
      newErrors.category = 'Please select a category';
    }

    // Validate price
    if (price && (isNaN(Number(price)) || Number(price) < 0)) {
      newErrors.price = 'Price must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category, price]);

  /**
   * Toggle season selection
   */
  const toggleSeason = useCallback((season: Season) => {
    setSeasons((prev) =>
      prev.includes(season)
        ? prev.filter((s) => s !== season)
        : [...prev, season]
    );
  }, []);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      console.log('📝 Form submit triggered');
      event.preventDefault();

      console.log('📝 Form data:', { name, category, tags });
      
      const isValid = validateForm();
      console.log('📝 Form valid:', isValid);
      
      if (!isValid) {
        console.log('❌ Validation failed, not submitting');
        return;
      }

      if (!category) {
        console.log('❌ No category selected');
        return;
      }

      const submitData: MetadataFormData = {
        name: name.trim(),
        category,
        season: seasons,
        tags: tags.filter((tag) => tag.trim() !== ''),
      };

      // Add optional fields only if they have values
      if (subcategory.trim()) submitData.subcategory = subcategory.trim();
      if (styleType.trim()) submitData.styleType = styleType.trim();
      if (brand.trim()) submitData.brand = brand.trim();
      if (purchaseDate) submitData.purchaseDate = new Date(purchaseDate);
      if (price && !isNaN(Number(price))) submitData.price = Number(price);
      
      console.log('✅ Calling onSubmit with:', submitData);
      onSubmit(submitData);
    },
    [name, category, subcategory, seasons, styleType, tags, brand, purchaseDate, price, validateForm, onSubmit]
  );

  /**
   * Handles adding a tag
   */
  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();

    if (!trimmedTag) {
      return;
    }

    // Prevent duplicates
    if (tags.includes(trimmedTag)) {
      setTagInput('');
      return;
    }

    // Limit to 10 tags
    if (tags.length >= 10) {
      return;
    }

    setTags((prev) => [...prev, trimmedTag]);
    setTagInput('');
  }, [tagInput, tags]);

  /**
   * Handles tag input key down
   */
  const handleTagInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  /**
   * Removes a tag
   */
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  }, []);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)} noValidate>
      {/* Item Name */}
      <div className="space-y-2">
        <Label htmlFor="item-name" className="text-sm font-medium text-foreground">
          Item Name <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <div className="space-y-1">
          <Input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Black T-Shirt"
            maxLength={maxNameLength}
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : 'name-hint'}
            className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
          />
          <div className="flex items-center justify-between">
            {errors.name ? (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            ) : (
              <p id="name-hint" className="text-xs text-muted-foreground">
                Give your item a descriptive name
              </p>
            )}
            <span
              className={cn(
                'text-xs tabular-nums',
                nameCharCount > maxNameLength * 0.9 ? 'text-destructive' : 'text-muted-foreground/70'
              )}
              aria-live="polite"
            >
              {nameCharCount}/{maxNameLength}
            </span>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="item-category" className="text-sm font-medium text-foreground">
          Category <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as ClothCategory)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="item-category"
            className={cn(errors.category && 'border-destructive focus:ring-destructive')}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : 'category-hint'}
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category ? (
          <p id="category-error" className="text-sm text-destructive" role="alert">
            {errors.category}
          </p>
        ) : (
          <p id="category-hint" className="text-xs text-muted-foreground">
            Choose the category that best fits this item
          </p>
        )}
      </div>

      {/* Subcategory (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="item-subcategory" className="text-sm font-medium text-foreground">
          Subcategory <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="item-subcategory"
          type="text"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          placeholder="e.g., Polo, Hoodie, Jeans"
          disabled={isSubmitting}
          aria-describedby="subcategory-hint"
        />
        <p id="subcategory-hint" className="text-xs text-muted-foreground">
          Add a more specific category if needed
        </p>
      </div>

      {/* Season Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Seasons <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(SEASON_LABELS) as [Season, string][]).map(([season, label]) => (
            <div key={season} className="flex items-center space-x-2">
              <Checkbox
                id={`season-${season}`}
                checked={seasons.includes(season)}
                onCheckedChange={() => toggleSeason(season)}
                disabled={isSubmitting}
              />
              <Label
                htmlFor={`season-${season}`}
                className="text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Select when this item can be worn
        </p>
      </div>

      {/* Style Type (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="item-style" className="text-sm font-medium text-foreground">
          Style Type <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="item-style"
          type="text"
          value={styleType}
          onChange={(e) => setStyleType(e.target.value)}
          placeholder="e.g., Casual, Formal, Sporty"
          disabled={isSubmitting}
          aria-describedby="style-hint"
        />
        <p id="style-hint" className="text-xs text-muted-foreground">
          Describe the style or occasion
        </p>
      </div>

      {/* Brand (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="item-brand" className="text-sm font-medium text-foreground">
          Brand <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <Input
          id="item-brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g., Nike, Zara, H&M"
          disabled={isSubmitting}
          aria-describedby="brand-hint"
        />
        <p id="brand-hint" className="text-xs text-muted-foreground">
          Add the brand name if known
        </p>
      </div>

      {/* Purchase Date & Price Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Purchase Date */}
        <div className="space-y-2">
          <Label htmlFor="item-purchase-date" className="text-sm font-medium text-foreground">
            Purchase Date <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <div className="relative">
            <Input
              id="item-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={isSubmitting}
              aria-describedby="purchase-date-hint"
              className="pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <p id="purchase-date-hint" className="text-xs text-muted-foreground">
            When did you buy this item?
          </p>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="item-price" className="text-sm font-medium text-foreground">
            Price <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="item-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : 'price-hint'}
              className={cn(
                'pl-7',
                errors.price && 'border-destructive focus-visible:ring-destructive'
              )}
            />
          </div>
          {errors.price ? (
            <p id="price-error" className="text-sm text-destructive" role="alert">
              {errors.price}
            </p>
          ) : (
            <p id="price-hint" className="text-xs text-muted-foreground">
              How much did it cost?
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="item-tags" className="text-sm font-medium text-foreground">
          Tags <span className="text-muted-foreground font-normal">(Optional)</span>
        </Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              id="item-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Add a tag and press Enter"
              disabled={isSubmitting || tags.length >= 10}
              aria-describedby="tags-hint"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || isSubmitting || tags.length >= 10}
            >
              Add
            </Button>
          </div>
          <p id="tags-hint" className="text-xs text-muted-foreground">
            Add up to 10 tags to help organize your item
            {tags.length > 0 && ` (${tags.length}/10)`}
          </p>

          {/* Tag list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2" role="list" aria-label="Tags">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 gap-1"
                  role="listitem"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isSubmitting}
                    className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form actions */}
      <div className="flex gap-3 pt-4">
        {showCancelButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Adding...' : submitText}
        </Button>
      </div>
    </form>
  );
}
