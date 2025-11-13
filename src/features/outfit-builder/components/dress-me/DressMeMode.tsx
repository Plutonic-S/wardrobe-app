'use client';

import { motion } from 'framer-motion';
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

      {/* Category Sliders with staggered animation */}
      <motion.div
        className="space-y-3 sm:space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {categories.map((category, index) => {
          const items = itemsByCategory[category] || [];
          const currentIndex = categoryIndexes[category] || 0;
          const isLocked = lockedCategories.includes(category);

          return (
            <motion.div
              key={category}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
              }}
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
      </motion.div>
    </motion.div>
  );
}
