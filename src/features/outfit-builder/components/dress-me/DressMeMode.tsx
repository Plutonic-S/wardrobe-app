'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CategorySlider } from './CategorySlider';
import { ConfigurationSelector } from './ConfigurationSelector';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';

const CATEGORY_LABELS: Record<string, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  dresses: 'Dresses',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessories: 'Accessories',
};

interface DressMeModeProps {
  configuration: '2-part' | '3-part' | '4-part';
  categories: string[];
  itemsByCategory: Record<string, ClothResponse[]>;
  categoryIndexes: Record<string, number>;
  lockedCategories: string[];
  onConfigurationChange: (config: '2-part' | '3-part' | '4-part') => void;
  onNavigateCategory: (category: string, direction: 'prev' | 'next', totalItems: number) => void;
  onToggleCategoryLock: (category: string) => void;
  onShuffle: () => void;
}

export function DressMeMode({
  configuration,
  categories,
  itemsByCategory,
  categoryIndexes,
  lockedCategories,
  onConfigurationChange,
  onNavigateCategory,
  onToggleCategoryLock,
  onShuffle,
}: DressMeModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Configuration Selector */}
      <ConfigurationSelector
        configuration={configuration}
        onConfigurationChange={onConfigurationChange}
        onShuffle={onShuffle}
      />

      {/* Category Sliders */}
      <div className="space-y-3 sm:space-y-4">
        <AnimatePresence mode="sync">
          {categories.map((category) => {
            const items = itemsByCategory[category] || [];
            const currentIndex = categoryIndexes[category] || 0;
            const isLocked = lockedCategories.includes(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CategorySlider
                  category={category}
                  label={CATEGORY_LABELS[category] || category}
                  items={items}
                  currentIndex={currentIndex}
                  isLocked={isLocked}
                  onNavigate={(direction) =>
                    onNavigateCategory(category, direction, items.length)
                  }
                  onToggleLock={() => onToggleCategoryLock(category)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
