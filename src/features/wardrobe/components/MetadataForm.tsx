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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClothCategory } from '../types/wardrobe.types';

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
 * Form data interface
 */
export interface MetadataFormData {
  name: string;
  category: ClothCategory;
  tags: string[];
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
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
  }>({});

  // Character count
  const nameCharCount = name.length;
  const maxNameLength = 100;

  /**
   * Validates form data
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: { name?: string; category?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, category]);

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

      const submitData = {
        name: name.trim(),
        category,
        tags: tags.filter((tag) => tag.trim() !== ''),
      };
      
      console.log('✅ Calling onSubmit with:', submitData);
      onSubmit(submitData);
    },
    [name, category, tags, validateForm, onSubmit]
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
