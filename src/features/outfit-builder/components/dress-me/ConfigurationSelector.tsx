'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shuffle } from 'lucide-react';

const CONFIG_OPTIONS = [
  { value: '2-part', label: '2-Part (Dress)' },
  { value: '3-part', label: '3-Part (Top + Bottom)' },
  { value: '4-part', label: '4-Part (with Outerwear)' },
] as const;

interface ConfigurationSelectorProps {
  configuration: '2-part' | '3-part' | '4-part';
  onConfigurationChange: (config: '2-part' | '3-part' | '4-part') => void;
  onShuffle: () => void;
}

export function ConfigurationSelector({
  configuration,
  onConfigurationChange,
  onShuffle,
}: ConfigurationSelectorProps) {
  const [isShuffling, setIsShuffling] = useState(false);

  const handleShuffle = () => {
    setIsShuffling(true);
    onShuffle();
    setTimeout(() => setIsShuffling(false), 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-card/50 p-3 sm:p-4 rounded-lg border border-border/50"
    >
      {/* Configuration Label & Select */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <label className="text-sm font-medium whitespace-nowrap">
          Configuration:
        </label>
        <Select value={configuration} onValueChange={onConfigurationChange}>
          <SelectTrigger className="w-full sm:w-[200px] md:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONFIG_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shuffle Button */}
      <motion.div
        className="w-full sm:w-auto sm:ml-auto"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          onClick={handleShuffle}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          disabled={isShuffling}
        >
          <motion.div
            animate={{
              rotate: isShuffling ? 360 : 0,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
          >
            <Shuffle className="h-4 w-4 sm:mr-2" />
          </motion.div>
          <span className="ml-2 sm:ml-0">Shuffle</span>
        </Button>
      </motion.div>
    </motion.div>
  );
}
