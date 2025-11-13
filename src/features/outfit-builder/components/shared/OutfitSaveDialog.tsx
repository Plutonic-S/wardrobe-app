'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { OutfitMetadata } from '@/features/outfit-builder/types/outfit.types';

interface OutfitSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  metadata: Partial<OutfitMetadata>;
  onMetadataChange: (metadata: Partial<OutfitMetadata>) => void;
  isSaving: boolean;
  title?: string;
  description?: string;
  saveButtonText?: string;
}

export function OutfitSaveDialog({
  isOpen,
  onClose,
  onSave,
  metadata,
  onMetadataChange,
  isSaving,
  title = 'Save Outfit',
  description = 'Give your outfit a name and add some details',
  saveButtonText = 'Save',
}: OutfitSaveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 py-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium">Name *</label>
            <Input
              placeholder="e.g., Summer Casual"
              value={metadata.name}
              onChange={(e) =>
                onMetadataChange({ ...metadata, name: e.target.value })
              }
              className="min-h-[44px] sm:min-h-0"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Describe your outfit..."
              value={metadata.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onMetadataChange({
                  ...metadata,
                  description: e.target.value,
                })
              }
              rows={3}
              className="resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input
              placeholder="e.g., casual, summer, comfortable"
              value={metadata.tags?.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onMetadataChange({
                  ...metadata,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              className="min-h-[44px] sm:min-h-0"
            />
          </motion.div>
        </motion.div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            Cancel
          </Button>
          <motion.div
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            className="w-full sm:w-auto"
          >
            <Button
              onClick={onSave}
              disabled={!metadata.name || isSaving}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 min-h-[44px] sm:min-h-0"
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {saveButtonText}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
