// src/features/outfit-builder/services/outfit-snapshot.service.tsx

'use client';

import React from 'react';
import html2canvas from 'html2canvas';
import { createRoot, Root } from 'react-dom/client';
import { OutfitRenderer } from '../components/shared/OutfitRenderer';
import type {
  DressMeRenderData,
  CanvasRenderData,
} from '../components/shared/OutfitRenderer';
import type { CompositionData, OutfitDocument } from '../types/outfit.types';
import { getSlotPositions } from '../components/shared/OutfitRenderer';

// ============================================================================
// MONKEY-PATCH HTML2CANVAS TO HANDLE MODERN COLORS
// ============================================================================

/**
 * CRITICAL FIX: Replace modern color functions with fallback colors
 * This prevents html2canvas from crashing when it encounters unsupported colors
 */
function sanitizeColorString(colorString: string): string {
  if (!colorString) return 'transparent';
  
  // If it's a modern color function, return a safe fallback
  if (
    colorString.includes('lab(') ||
    colorString.includes('lch(') ||
    colorString.includes('oklab(') ||
    colorString.includes('oklch(')
  ) {
    // Return transparent for backgrounds, black for text
    if (colorString.includes('background')) return 'transparent';
    return '#000000';
  }
  
  return colorString;
}

// Intercept getComputedStyle to sanitize colors BEFORE html2canvas reads them
if (typeof window !== 'undefined') {
  const originalGetComputedStyle = window.getComputedStyle.bind(window);
  
  // Store the original to avoid infinite loops
  let isIntercepting = false;
  
  window.getComputedStyle = function(element: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    // Call original with proper binding
    const styles = originalGetComputedStyle(element, pseudoElt);
    
    // Only intercept when html2canvas is running
    if (!isIntercepting) {
      return styles;
    }
    
    // Create a proxy to sanitize color values
    return new Proxy(styles, {
      get(target, prop) {
        // Handle method calls correctly
        if (typeof target[prop as keyof CSSStyleDeclaration] === 'function') {
          return (target[prop as keyof CSSStyleDeclaration] as () => unknown).bind(target);
        }
        
        const value = target[prop as keyof CSSStyleDeclaration];
        
        // If it's a color property and a string, sanitize it
        if (
          typeof prop === 'string' &&
          typeof value === 'string' &&
          (prop.toLowerCase().includes('color') || prop === 'background')
        ) {
          return sanitizeColorString(value);
        }
        
        return value;
      }
    });
  } as typeof window.getComputedStyle;
  
  // Function to enable/disable interception
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__html2canvas_intercepting = {
    enable: () => { isIntercepting = true; },
    disable: () => { isIntercepting = false; }
  };
}

// Suppress console warnings as backup
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.warn = function (...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('Attempting to parse an unsupported color')) {
    return; // Silently ignore
  }
  originalConsoleWarn.apply(console, args);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.error = function (...args: any[]) {
  const message = args[0]?.toString() || '';
  if (message.includes('Attempting to parse an unsupported color')) {
    return; // Silently ignore
  }
  originalConsoleError.apply(console, args);
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Snapshot generation result
 */
export interface SnapshotResult {
  url: string;
  publicId: string;
  composition: CompositionData;
  checksum: string;
}

/**
 * Snapshot generation options
 */
export interface SnapshotOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number; // 0-1 for JPEG, ignored for PNG
  scale?: number;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Snapshot generation progress
 */
export interface SnapshotProgress {
  stage: 'preparing' | 'rendering' | 'loading-images' | 'capturing' | 'uploading';
  progress: number; // 0-100
}

// ============================================================================
// CONSTANTS
// ============================================================================

const IMAGE_LOAD_TIMEOUT = 10000; // 10 seconds per image
const RENDER_STABILIZATION_DELAY = 300; // Reduced from 500ms
const MAX_UPLOAD_RETRIES = 3;
const UPLOAD_RETRY_DELAY = 1000; // 1 second between retries

// ============================================================================
// MAIN SNAPSHOT GENERATION
// ============================================================================

/**
 * Generate snapshot of outfit with improved error handling and performance
 */
export async function generateOutfitSnapshot(
  outfitId: string,
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData,
  options: SnapshotOptions = {}
): Promise<SnapshotResult> {
  // Use different default dimensions based on mode
  // Dress-me: 900x1140 (vertical rectangle)
  // Canvas: 1000x1000 (square, will be cropped to content)
  const defaultWidth = mode === 'dress-me' ? 900 : 1000;
  const defaultHeight = mode === 'dress-me' ? 1140 : 1000;

  const {
    width = defaultWidth,
    height = defaultHeight,
    format = 'png',
    quality = 0.9,
    scale = 2,
    maxRetries = MAX_UPLOAD_RETRIES,
    onProgress,
  } = options;

  // Generate checksum for this configuration
  const checksum = generateChecksum(mode, renderData);

  // Report progress
  onProgress?.(10);

  // Create container with improved positioning
  const container = createHiddenContainer(outfitId, width, height);

  try {
    // 1. Render outfit component
    console.log('[Snapshot] Step 1: Rendering component...');
    console.log('[Snapshot] Mode:', mode);
    console.log('[Snapshot] Render data sample:', mode === 'dress-me' ? 
      `config: ${(renderData as DressMeRenderData).configuration}` :
      `items: ${(renderData as CanvasRenderData).items.length}`
    );
    
    onProgress?.(20);
    const root = createRoot(container);

    await renderOutfitComponent(root, mode, renderData, width, height);
    onProgress?.(40);
    console.log('[Snapshot] Step 1: Component rendered');
    console.log('[Snapshot] Container has content:', container.innerHTML.length, 'chars');
    console.log('[Snapshot] Container preview:', container.innerHTML.substring(0, 300));

    // 2. Wait for images with improved loading
    console.log('[Snapshot] Step 2: Waiting for images...');
    await waitForImagesWithProgress(container, (imageProgress) => {
      // Map image loading progress from 40-60%
      onProgress?.(40 + imageProgress * 0.2);
    });
    onProgress?.(60);
    console.log('[Snapshot] Step 2: Images loaded');

    // 3. Capture with optimized settings
    console.log('[Snapshot] Step 3: Capturing canvas...');
    
    // CRITICAL: Make container visible but off-screen for html2canvas to capture properly
    // html2canvas cannot capture elements with visibility:hidden
    container.style.visibility = 'visible';
    container.style.position = 'fixed';
    container.style.left = '-9999px'; // Move off-screen instead of hiding
    container.style.top = '-9999px';
    
    const canvas = await captureWithHtml2Canvas(container, {
      width,
      height,
      scale,
      format,
      mode, // Pass the actual mode to the capture function
    });
    
    // Move back (will be removed shortly anyway)
    container.style.left = '0';
    container.style.top = '0';
    container.style.visibility = 'hidden';
    
    onProgress?.(80);
    console.log('[Snapshot] Step 3: Canvas captured, dimensions:', canvas.width, 'x', canvas.height);

    // 4. Convert to blob with format support
    console.log('[Snapshot] Step 4: Converting to blob...');
    const blob = await canvasToBlob(canvas, format, quality);
    console.log('[Snapshot] Step 4: Blob created, size:', blob.size, 'bytes');

    // 5. Upload with retry logic
    console.log('[Snapshot] Step 5: Uploading...');
    onProgress?.(90);
    const uploadResult = await uploadWithRetry(
      blob,
      outfitId,
      maxRetries,
      checksum
    );
    onProgress?.(100);
    console.log('[Snapshot] Step 5: Upload complete, URL:', uploadResult.url);

    // 6. Build composition data
    console.log('[Snapshot] Step 6: Building composition...');
    const composition = buildCompositionData(mode, renderData);
    console.log('[Snapshot] Step 6: Composition built');

    // 7. Cleanup
    root.unmount();
    document.body.removeChild(container);

    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      composition,
      checksum,
    };
  } catch (error) {
    console.error('[Snapshot] ERROR during generation:', error);
    console.error('[Snapshot] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Ensure cleanup on error
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create hidden container with better positioning and forced hex colors
 */
function createHiddenContainer(
  outfitId: string,
  width: number,
  height: number
): HTMLDivElement {
  const container = document.createElement('div');
  container.id = `outfit-renderer-${outfitId}`;
  
  // DON'T use className - avoid Tailwind classes entirely
  // Use inline styles with hex colors only
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${width}px`,
    height: `${height}px`,
    visibility: 'hidden',
    pointerEvents: 'none',
    zIndex: '-9999',
    overflow: 'hidden',
    
    // Force simple hex colors (no CSS variables, no modern color functions)
    backgroundColor: 'transparent',
    color: '#000000',
    borderColor: 'transparent',
    
    // Override any inherited Tailwind styles
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    lineHeight: '1.5',
    
    // Ensure no transforms or filters that might cause issues
    transform: 'none',
    filter: 'none',
    backdropFilter: 'none',
  });
  
  // Add a data attribute for debugging
  container.setAttribute('data-snapshot-container', 'true');
  
  document.body.appendChild(container);
  return container;
}

/**
 * Render outfit component with promise wrapper
 */
async function renderOutfitComponent(
  root: Root,
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData,
  width: number,
  height: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    const component = mode === 'dress-me' ? (
      <OutfitRenderer
        mode="dress-me"
        dressMe={renderData as DressMeRenderData}
        size={{ width, height }}
        onRenderComplete={() => resolve()}
      />
    ) : (
      <OutfitRenderer
        mode="canvas"
        canvas={renderData as CanvasRenderData}
        size={{ width, height }}
        onRenderComplete={() => resolve()}
      />
    );
    
    root.render(component);
  });
}

/**
 * Force all elements to use simple hex colors for html2canvas compatibility
 * This aggressively overrides all color-related styles to prevent modern color function errors
 */
function forceHexColors(container: HTMLElement): void {
  console.log('[forceHexColors] Converting all colors to hex/transparent...');
  
  // Get ALL elements including the container itself
  const allElements = [container, ...Array.from(container.querySelectorAll('*'))];
  
  allElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    
    // Remove all Tailwind/utility classes that might use CSS variables
    // Keep only essential positioning classes
    const classList = Array.from(element.classList);
    classList.forEach(className => {
      // Remove color-related classes
      if (
        className.includes('bg-') || 
        className.includes('text-') || 
        className.includes('border-') ||
        className.includes('shadow-') ||
        className.includes('ring-') ||
        className.includes('divide-') ||
        className.includes('accent-') ||
        className.includes('decoration-') ||
        className.includes('placeholder-') ||
        className.includes('caret-')
      ) {
        element.classList.remove(className);
      }
    });
    
    // Force inline styles with hex colors only
    const style = element.style;
    
    // Background
    style.backgroundColor = 'transparent';
    style.backgroundImage = 'none';
    
    // Text
    style.color = '#000000';
    
    // Borders
    style.borderColor = 'transparent';
    style.borderTopColor = 'transparent';
    style.borderRightColor = 'transparent';
    style.borderBottomColor = 'transparent';
    style.borderLeftColor = 'transparent';
    style.outlineColor = 'transparent';
    
    // Shadows
    style.boxShadow = 'none';
    style.textShadow = 'none';
    
    // Effects that might use colors
    style.filter = 'none';
    style.backdropFilter = 'none';
    
    // Remove any CSS variable references
    const computedStyle = window.getComputedStyle(element);
    
    // Check for problematic color functions in computed styles
    const colorProps = [
      'color', 'backgroundColor', 'borderColor',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'caretColor'
    ];
    
    colorProps.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      // If it contains modern color functions, force override
      if (value && (
        value.includes('lab(') || 
        value.includes('lch(') || 
        value.includes('oklab(') || 
        value.includes('oklch(') ||
        value.includes('var(')  // CSS variables
      )) {
        if (prop === 'backgroundColor') {
          style.backgroundColor = 'transparent';
        } else {
          style.setProperty(prop, 'transparent', 'important');
        }
      }
    });
  });
  
  console.log('[forceHexColors] Color conversion complete');
}

/**
 * Wait for images with progress reporting
 */
async function waitForImagesWithProgress(
  container: HTMLElement,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Force all colors to hex/transparent before html2canvas processes them
  forceHexColors(container);
  
  const images = container.querySelectorAll<HTMLImageElement>('img');

  console.log('[waitForImages] Found', images.length, 'images in container');
  images.forEach((img, i) => {
    console.log(`[waitForImages] Image ${i + 1}:`, {
      src: img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      hasParent: !!img.parentElement,
    });
  });

  if (images.length === 0) {
    console.warn('[waitForImages] No images found!');
    onProgress?.(100);
    return;
  }

  let loadedCount = 0;
  const totalImages = images.length;

  const imagePromises = Array.from(images).map((img, index) =>
    new Promise<boolean>((resolve) => {
      // Check if already loaded
      if (img.complete && img.naturalHeight !== 0) {
        console.log(`[waitForImages] Image ${index + 1} already loaded:`, img.src);
        loadedCount++;
        onProgress?.((loadedCount / totalImages) * 100);
        resolve(true);
        return;
      }

      // CRITICAL: Ensure crossOrigin is set BEFORE setting src
      // For local images, we need to use absolute URLs
      if (!img.src.startsWith('http')) {
        const absoluteUrl = new URL(img.src, window.location.origin).href;
        console.log(`[waitForImages] Converting relative URL to absolute:`, img.src, '→', absoluteUrl);
        img.crossOrigin = 'anonymous';
        img.src = absoluteUrl;
      } else if (img.src.includes('cloudinary.com') || img.src.includes(window.location.host)) {
        img.crossOrigin = 'anonymous';
      }

      const timeoutId = setTimeout(() => {
        console.error(`[waitForImages] Image ${index + 1} load TIMEOUT after ${IMAGE_LOAD_TIMEOUT}ms:`, img.src);
        loadedCount++;
        onProgress?.((loadedCount / totalImages) * 100);
        resolve(false);
      }, IMAGE_LOAD_TIMEOUT);

      img.onload = () => {
        clearTimeout(timeoutId);
        console.log(`[waitForImages] Image ${index + 1} loaded successfully:`, img.src, `(${img.naturalWidth}x${img.naturalHeight})`);
        loadedCount++;
        onProgress?.((loadedCount / totalImages) * 100);
        resolve(true);
      };

      img.onerror = (e) => {
        clearTimeout(timeoutId);
        console.error(`[waitForImages] Image ${index + 1} FAILED to load:`, img.src, e);
        loadedCount++;
        onProgress?.((loadedCount / totalImages) * 100);
        resolve(false);
      };
    })
  );

  await Promise.all(imagePromises);

  // Shorter stabilization delay
  await new Promise((resolve) => setTimeout(resolve, RENDER_STABILIZATION_DELAY));
}

/**
 * Calculate bounding box of all items in canvas mode
 */
function calculateCanvasBounds(container: HTMLElement): { x: number; y: number; width: number; height: number } | null {
  const items = container.querySelectorAll('[class*="absolute"]');
  if (items.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  items.forEach((item) => {
    const element = item as HTMLElement;
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate position relative to container
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    const right = x + rect.width;
    const bottom = y + rect.height;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  // Add generous padding - 25% on each side, minimum 100px
  // This ensures the outfit fills the container nicely without being too tight
  const paddingX = Math.max(160, (maxX - minX) * 0.25);
  const paddingY = Math.max(40, (maxY - minY) * 0.1);

  return {
    x: Math.max(0, minX - paddingX),
    y: Math.max(0, minY - paddingY),
    width: (maxX - minX) + (paddingX * 2),
    height: (maxY - minY) + (paddingY * 2),
  };
}

/**
 * Capture with html2canvas using optimized settings
 */
async function captureWithHtml2Canvas(
  container: HTMLElement,
  options: {
    width: number;
    height: number;
    scale: number;
    format: 'png' | 'jpeg';
    mode: 'dress-me' | 'canvas';
  }
): Promise<HTMLCanvasElement> {
  // CRITICAL FIX: Inject temporary stylesheet to override ALL CSS variables and colors
  // This prevents html2canvas from seeing modern color functions
  const styleId = `snapshot-style-override-${Date.now()}`;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    #${container.id} * {
      /* Override all color properties with safe hex values */
      color: #000000 !important;
      background-color: transparent !important;
      border-color: transparent !important;
      outline-color: transparent !important;
      text-decoration-color: transparent !important;
      
      /* Remove shadows and effects */
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      
      /* Reset CSS variables to safe values */
      --tw-bg-opacity: 1 !important;
      --tw-text-opacity: 1 !important;
      --tw-border-opacity: 1 !important;
      --tw-ring-opacity: 0 !important;
      --tw-shadow: none !important;
    }
    
    /* Keep images visible */
    #${container.id} img {
      opacity: 1 !important;
      visibility: visible !important;
    }
  `;
  document.head.appendChild(style);

  try {
    // Enable color interception for html2canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__html2canvas_intercepting) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__html2canvas_intercepting.enable();
    }
    
    // Console warnings are suppressed globally at module level
    // IMPORTANT: Capture the container at its actual size
    // Note: backgroundColor: null is correct per html2canvas docs but @types/html2canvas is outdated
    const html2canvasOptions = {
      width: options.width,
      height: options.height,
      backgroundColor: null, // null = transparent background
      useCORS: true,
      allowTaint: false,
      logging: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = await html2canvas(container, html2canvasOptions as any);

    console.log('[captureWithHtml2Canvas] Captured canvas:', {
      actualWidth: canvas.width,
      actualHeight: canvas.height,
      expectedWidth: options.width * options.scale,
      expectedHeight: options.height * options.scale,
      containerWidth: container.offsetWidth,
      containerHeight: container.offsetHeight,
      mode: options.mode,
    });

    // Only crop to content bounds in canvas mode
    let finalCanvas = canvas;

    const shouldCrop = options.mode === 'canvas';

    if (shouldCrop) {
      const bounds = calculateCanvasBounds(container);
      if (bounds) {        
        // Create cropped canvas
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = Math.ceil(bounds.width);
        croppedCanvas.height = Math.ceil(bounds.height);
        const ctx = croppedCanvas.getContext('2d');
        
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the cropped region from the original canvas
          ctx.drawImage(
            canvas,
            bounds.x, bounds.y, bounds.width, bounds.height,  // Source rectangle
            0, 0, croppedCanvas.width, croppedCanvas.height    // Destination rectangle
          );
          
          finalCanvas = croppedCanvas;
        }
      }
    }

    // Scale up the canvas to higher resolution
    if (options.scale > 1) {
      console.log('[captureWithHtml2Canvas] Scaling canvas up to', options.scale, 'x');
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = finalCanvas.width * options.scale;
      scaledCanvas.height = finalCanvas.height * options.scale;
      const ctx = scaledCanvas.getContext('2d');
      if (ctx) {
        // Use high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(finalCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        return scaledCanvas;
      }
    }

    return finalCanvas;
  } finally {
    // Disable color interception
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__html2canvas_intercepting) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__html2canvas_intercepting.disable();
    }
    
    // Clean up temporary stylesheet
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  }
}

/**
 * Convert canvas to blob with format support
 */
async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  quality: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      mimeType,
      format === 'jpeg' ? quality : undefined // Quality only applies to JPEG
    );
  });
}

/**
 * Upload with retry logic
 */
async function uploadWithRetry(
  blob: Blob,
  outfitId: string,
  maxRetries: number,
  checksum: string
): Promise<{ url: string; publicId: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', blob, `outfit-${outfitId}.png`);
      formData.append('outfitId', outfitId);
      formData.append('checksum', checksum);

      const response = await fetch('/api/upload/snapshot', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();
      return {
        url: result.data.url,
        publicId: result.data.publicId,
      };
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise((resolve) => 
          setTimeout(resolve, UPLOAD_RETRY_DELAY * attempt)
        );
      }
    }
  }

  throw new Error(
    `Failed to upload snapshot after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Generate checksum for render data to detect changes
 */
export function generateChecksum(
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData
): string {
  const data = mode === 'dress-me' 
    ? (renderData as DressMeRenderData)
    : (renderData as CanvasRenderData);

  // Create a simple hash from the data
  const jsonString = JSON.stringify({
    mode,
    configuration: (data as DressMeRenderData).configuration,
    items: mode === 'dress-me' 
      ? Object.entries((data as DressMeRenderData).items)
          .filter(([, item]) => item) // Use comma to indicate unused first element
          .map(([category, item]) => {
            const itemWithId = item as { id?: string };
            return `${category}:${itemWithId?.id || ''}`;
          })
          .sort()
          .join(',')
      : (data as CanvasRenderData).items
          .map(item => `${item.clothItemId}:${item.position.x},${item.position.y}:${item.rotation}`)
          .sort()
          .join(','),
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Check if snapshot needs regeneration
 */
export function needsRegeneration(
  outfit: OutfitDocument | { previewImage?: { url?: string; checksum?: string } },
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData
): boolean {
  // No snapshot exists
  if (!outfit.previewImage?.url) {
    return true;
  }

  // Generate current checksum
  const currentChecksum = generateChecksum(mode, renderData);

  // Compare with stored checksum
  return currentChecksum !== outfit.previewImage?.checksum;
}

/**
 * Build composition JSON from render data
 */
function buildCompositionData(
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData
): CompositionData {
  if (mode === 'dress-me') {
    const dressMe = renderData as DressMeRenderData;
    const slotPositions = getSlotPositions(dressMe.configuration);

    const slotPositionsRecord: Record<string, {
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
    }> = {};

    Object.entries(slotPositions).forEach(([key, value]) => {
      slotPositionsRecord[key] = value;
    });

    return {
      layout: dressMe.configuration === '4-part' ? 'side-by-side' : 'vertical-stack',
      dressMe: {
        slotPositions: slotPositionsRecord,
      },
      renderOptions: {
        backgroundColor: 'transparent',
        showBorders: false,
        padding: 40,
      },
    };
  } else {
    const canvas = renderData as CanvasRenderData;

    return {
      layout: 'canvas-free',
      canvas: {
        items: canvas.items.map((item) => ({
          itemId: item.clothItemId,
          position: item.position,
          size: item.size,
          rotation: item.rotation,
          zIndex: item.zIndex,
        })),
        viewport: canvas.viewport || {
          zoom: 1,
          pan: { x: 0, y: 0 },
        },
      },
      renderOptions: {
        backgroundColor: 'transparent',
        showBorders: false,
        padding: 20,
      },
    };
  }
}

/**
 * Delete snapshot from storage
 */
export async function deleteSnapshot(publicId: string): Promise<void> {
  const response = await fetch('/api/upload/snapshot', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || 'Failed to delete snapshot'
    );
  }
}

/**
 * Regenerate snapshot for existing outfit
 */
export async function regenerateSnapshot(
  outfitId: string,
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData,
  oldPublicId?: string,
  options?: SnapshotOptions
): Promise<SnapshotResult> {
  // Delete old snapshot if exists
  if (oldPublicId) {
    try {
      await deleteSnapshot(oldPublicId);
    } catch (error) {
      console.warn('Failed to delete old snapshot:', error);
      // Continue with generation
    }
  }

  // Generate new snapshot
  return generateOutfitSnapshot(outfitId, mode, renderData, options);
}

/**
 * Batch regenerate snapshots
 */
export async function batchRegenerateSnapshots(
  outfits: Array<{
    id: string;
    mode: 'dress-me' | 'canvas';
    renderData: DressMeRenderData | CanvasRenderData;
    oldPublicId?: string;
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ id: string; result?: SnapshotResult; error?: Error }>> {
  const results: Array<{ id: string; result?: SnapshotResult; error?: Error }> = [];
  
  for (let i = 0; i < outfits.length; i++) {
    const outfit = outfits[i];
    onProgress?.(i + 1, outfits.length);

    try {
      const result = await regenerateSnapshot(
        outfit.id,
        outfit.mode,
        outfit.renderData,
        outfit.oldPublicId,
        {
          scale: 1.5, // Lower scale for batch to save memory
        }
      );
      
      results.push({ id: outfit.id, result });
    } catch (error) {
      results.push({ id: outfit.id, error: error as Error });
    }

    // Small delay between generations to avoid memory issues
    if (i < outfits.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Validate render data
 */
export function isValidRenderData(
  mode: 'dress-me' | 'canvas',
  renderData: DressMeRenderData | CanvasRenderData
): boolean {
  if (mode === 'dress-me') {
    const dressMe = renderData as DressMeRenderData;

    // Check configuration
    if (!['2-part', '3-part', '4-part'].includes(dressMe.configuration)) {
      return false;
    }

    // Check for at least one item
    const hasItems =
      !!dressMe.items.tops ||
      !!dressMe.items.outerwear ||
      !!dressMe.items.bottoms ||
      !!dressMe.items.dresses ||
      !!dressMe.items.footwear ||
      (!!dressMe.items.accessories && dressMe.items.accessories.length > 0);

    return hasItems;
  } else {
    const canvas = renderData as CanvasRenderData;
    return canvas.items && canvas.items.length > 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const outfitSnapshotService = {
  generateOutfitSnapshot,
  deleteSnapshot,
  regenerateSnapshot,
  batchRegenerateSnapshots,
  generateChecksum,
  needsRegeneration,
  isValidRenderData,
};

export default outfitSnapshotService;