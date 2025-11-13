'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Lock, Unlock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import type { ClothResponse } from '@/features/wardrobe/types/wardrobe.types';

interface CategorySliderProps {
  category: string;
  label: string;
  items: ClothResponse[];
  currentIndex: number;
  isLocked: boolean;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleLock: () => void;
}

export function CategorySlider({
  label,
  items,
  currentIndex,
  isLocked,
  onNavigate,
  onToggleLock,
}: CategorySliderProps) {
  const currentItem = items[currentIndex];
  const [direction, setDirection] = useState<'prev' | 'next'>('next');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isLocked && items.length > 0) {
        setDirection('next');
        onNavigate('next');
      }
    },
    onSwipedRight: () => {
      if (!isLocked && items.length > 0) {
        setDirection('prev');
        onNavigate('prev');
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const handleNavigate = (dir: 'prev' | 'next') => {
    setDirection(dir);
    onNavigate(dir);
  };

  // Animation variants for image transitions
  const variants = {
    enter: (direction: 'prev' | 'next') => ({
      x: direction === 'next' ? 100 : -100,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: 'prev' | 'next') => ({
      x: direction === 'next' ? -100 : 100,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-lg p-3 sm:p-4"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-foreground text-sm sm:text-base">{label}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLock}
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
        >
          <motion.div
            animate={{
              rotate: isLocked ? [0, -10, 10, -10, 0] : 0,
              scale: isLocked ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.4 }}
          >
            {isLocked ? (
              <Lock className="h-4 w-4 text-purple-600" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.div>
        </Button>
      </div>

      {/* Slider */}
      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          No items in this category
        </motion.div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          {/* Previous Button - Hidden on mobile */}
          {!isMobile && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNavigate('prev')}
                disabled={isLocked}
                className="hidden sm:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Current Item with swipe support */}
          <div
            {...(isMobile ? swipeHandlers : {})}
            className="flex-1 flex items-center justify-center w-full touch-pan-y"
          >
            {currentItem ? (
              <div className="text-center w-full">
                {/* Image Container - Responsive sizing */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg mb-2 flex items-center justify-center overflow-hidden border border-border relative mx-auto">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentIndex}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                      }}
                      className="absolute inset-0"
                    >
                      {currentItem.optimizedUrl || currentItem.thumbnailUrl ? (
                        <Image
                          src={currentItem.optimizedUrl || currentItem.thumbnailUrl}
                          alt={currentItem.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Item Name */}
                <motion.p
                  key={`name-${currentIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-medium text-foreground text-sm sm:text-base truncate px-2"
                >
                  {currentItem.name}
                </motion.p>

                {/* Counter */}
                <motion.p
                  key={`counter-${currentIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-xs sm:text-sm text-muted-foreground"
                >
                  {currentIndex + 1} / {items.length}
                </motion.p>

                {/* Mobile swipe indicator */}
                {isMobile && !isLocked && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-muted-foreground mt-2 sm:hidden"
                  >
                    Swipe to browse
                  </motion.p>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground text-sm"
              >
                No item selected
              </motion.div>
            )}
          </div>

          {/* Next Button - Hidden on mobile */}
          {!isMobile && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleNavigate('next')}
                disabled={isLocked}
                className="hidden sm:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
