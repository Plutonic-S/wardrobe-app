'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  mode: 'dress-me' | 'canvas';
  onModeChange: (mode: 'dress-me' | 'canvas') => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4"
    >
      <motion.div
        className="flex-1 sm:flex-initial"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant={mode === 'dress-me' ? 'default' : 'outline'}
          onClick={() => onModeChange('dress-me')}
          className={cn(
            'w-full sm:w-auto min-h-[44px] sm:min-h-0 relative overflow-hidden',
            mode === 'dress-me' && 'bg-purple-600 hover:bg-purple-700'
          )}
        >
          {mode === 'dress-me' && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-0 bg-purple-600"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Dress Me
          </span>
        </Button>
      </motion.div>

      <motion.div
        className="flex-1 sm:flex-initial"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant={mode === 'canvas' ? 'default' : 'outline'}
          onClick={() => onModeChange('canvas')}
          className={cn(
            'w-full sm:w-auto min-h-[44px] sm:min-h-0 relative overflow-hidden',
            mode === 'canvas' && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {mode === 'canvas' && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-0 bg-blue-600"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Canvas
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
}
