'use client';

import { motion } from 'framer-motion';
import { Grid3x3 } from 'lucide-react';

export function CanvasPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-card border border-border rounded-lg p-6 sm:p-8 min-h-[400px] sm:min-h-[600px] flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-center text-muted-foreground"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <Grid3x3 className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Canvas Mode</h3>
        <p className="text-sm sm:text-base">Canvas mode UI coming soon</p>
      </motion.div>
    </motion.div>
  );
}
