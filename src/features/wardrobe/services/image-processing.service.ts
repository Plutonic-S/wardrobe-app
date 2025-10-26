import Image, { IImageDocument } from "@/lib/db/models/Image";
import { logger } from "@/lib/logger";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface UploadOptions {
  userId: string;
  file: File | Buffer;
  originalFilename: string;
}

interface ProcessingResult {
  image: IImageDocument | null;
  success: boolean;
  error?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface ColorPalette {
  dominantColor: string;
  colors: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Directory
  UPLOAD_BASE_DIR: path.join(process.cwd(), "public", "uploads", "clothing"),

  // Image optimization settings
  OPTIMIZED: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 85,
    format: "png" as const,
  },

  THUMBNAIL: {
    width: 300,
    height: 300,
    quality: 80,
    format: "webp" as const,
  },

  // File constraints
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "image/jpg"],

  // Processing
  PYTHON_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
};

// ============================================================================
// IMAGE PROCESSING SERVICE
// ============================================================================

export class ImageProcessingService {
  /**
   * Main entry point: Upload and process an image
   */
  static async uploadAndProcess(
    options: UploadOptions
  ): Promise<ProcessingResult> {
    const { userId, file, originalFilename } = options;

    try {
      logger.info("Starting image upload and processing", {
        userId,
        filename: originalFilename,
      });

      // Create image record
      const imageDoc = await this.createImageRecord(userId);

      // Save original file to disk
      const originalPath = await this.saveOriginalFile(
        userId,
        imageDoc.id,
        file
      );

      // Update image record with original URL and metadata
      imageDoc.originalUrl = this.getPublicUrl(originalPath);
      imageDoc.mimeType = await this.getMimeType(originalPath);
      const dimensions = await this.getImageDimensions(originalPath);
      imageDoc.width = dimensions.width;
      imageDoc.height = dimensions.height;
      imageDoc.size = await this.getFileSize(originalPath);
      await imageDoc.save();

      // Start background processing (async - doesn't block)
      this.processImageAsync(imageDoc.id, originalPath, userId);

      return { image: imageDoc, success: true };
    } catch (error) {
      logger.error("Error during image upload and processing", {
        userId,
        filename: originalFilename,
        error,
      });

      return {
        image: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Background processing: Remove background, optimize, create thumbnail, extract colors
   */

  static async processImageAsync(
    imageId: string,
    originalPath: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info("Starting background image processing", { imageId });

      // Mark as processing
      const imageDoc = await Image.findById(imageId);
      if (!imageDoc) {
        throw new Error("Image document not found");
      }
      await imageDoc.markAsProcessing();

      // Step 1: Remove background with Python rembg
      const processedPath = await this.removeBackgroundWithPython(
        originalPath,
        userId,
        imageId
      );

      // Step 2: Optimize the processed image
      const optimizedPath = await this.optimizeImage(processedPath);

      // Step 3: Create thumbnail
      const thumbnailPath = await this.createThumbnail(optimizedPath);

      // Step 4: Extract colors
      const colorPalette = await this.extractColors(optimizedPath);

      // Step 5: Update image record
      await imageDoc.markAsCompleted({
        optimizedUrl: this.getPublicUrl(optimizedPath),
        thumbnailUrl: this.getPublicUrl(thumbnailPath),
        dominantColor: colorPalette.dominantColor,
        colors: colorPalette.colors,
      });

      logger.info("Image processing completed successfully", {
        imageId,
        optimizedUrl: imageDoc.optimizedUrl,
      });
    } catch (error) {
      logger.error("Image processing failed", { error, imageId });

      // Mark as failed
      const imageDoc = await Image.findById(imageId);
      if (imageDoc) {
        await imageDoc.markAsFailed(
          error instanceof Error ? error.message : "Processing failed"
        );
      }
    }
  }

  /**
   * Retry failed image processing
   */
  static async retryProcessing(imageId: string): Promise<ProcessingResult> {
    try {
      const image = await Image.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      if (image.processingStatus !== "failed") {
        throw new Error("Only failed images can be retried");
      }

      // Check retry attempts stored in processingError
      const currentAttempts = this.getRetryAttempts(image.processingError);
      if (currentAttempts >= CONFIG.MAX_RETRIES) {
        logger.error("Max retries reached for image processing", { imageId });
        return {
          image: null,
          success: false,
          error: `Max retries (${CONFIG.MAX_RETRIES}) reached`,
        };
      }

      // Reset status and increment attempt counter
      await image.markAsProcessing();

      // Get original file path
      const originalPath = path.join(
        process.cwd(),
        "public",
        image.originalUrl
      );

      // Re-process with attempt tracking
      await this.processImageAsync(
        imageId,
        originalPath,
        image.userId.toString()
      );

      return {
        image,
        success: true,
      };
    } catch (error) {
      logger.error("Failed to retry processing", { error, imageId });
      return {
        image: null,
        success: false,
        error: error instanceof Error ? error.message : "Retry failed",
      };
    }
  }

  // ==========================================================================
  // BACKGROUND REMOVAL
  // ==========================================================================

  /**
   * Remove background using Python rembg library
   */
  private static async removeBackgroundWithPython(
    inputPath: string,
    userId: string,
    imageId: string
  ): Promise<string> {
    const userDir = path.join(CONFIG.UPLOAD_BASE_DIR, userId);
    const outputPath = path.join(userDir, `processed_${imageId}.png`);

    return new Promise((resolve, reject) => {
      logger.info("Starting Python background removal", { inputPath });

      // Use virtual environment Python with rembg installed
      // Path: /home/pluto/VsCode-v2/Fyp/butler/.venv/bin/python
      const pythonPath = "/home/pluto/VsCode-v2/Fyp/butler/.venv/bin/python";
      
      // Spawn Python process with rembg
      const pythonProcess = spawn(pythonPath, [
        "-c",
        `
from rembg import remove
from PIL import Image
import sys

try:
    input_path = "${inputPath}"
    output_path = "${outputPath}"
    
    # Open input image
    input_image = Image.open(input_path)
    
    # Remove background
    output_image = remove(input_image)
    
    # Save output
    output_image.save(output_path)
    
    print("SUCCESS")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
        `,
      ]);

      let stdout = "";
      let stderr = "";

      // Capture stdout
      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      pythonProcess.on("close", async (code) => {
        if (code === 0 && stdout.includes("SUCCESS")) {
          try {
            // Verify output file exists
            await fs.access(outputPath);
            logger.info("Background removal successful", { outputPath });
            resolve(outputPath);
          } catch {
            reject(new Error("Output file not created"));
          }
        } else {
          logger.error("Python background removal failed", {
            code,
            stderr,
            stdout,
          });
          reject(new Error(`Background removal failed: ${stderr || "Unknown error"}`));
        }
      });

      // Handle process errors
      pythonProcess.on("error", (error) => {
        logger.error("Failed to start Python process", { error });
        reject(new Error(`Failed to start Python: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error("Background removal timeout"));
      }, CONFIG.PYTHON_TIMEOUT);
    });
  }

  /**
   * Optimize image with Sharp
   */

  private static async optimizeImage(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace("processed_", "optimized_");

    try {
      await sharp(inputPath)
        .resize(CONFIG.OPTIMIZED.maxWidth, CONFIG.OPTIMIZED.maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ quality: CONFIG.OPTIMIZED.quality })
        .toFile(outputPath);

      logger.info("Image optimization successful", { outputPath });

      return outputPath;
    } catch (error) {
      logger.error("Image optimization failed", { error, inputPath });
      throw new Error(`Image optimization failed: ${error}`);
    }
  }

  /**
   * Create thumbnail
   */
  private static async createThumbnail(inputPath: string): Promise<string> {
    const outputPath = inputPath
      .replace("optimized_", "thumbnail_")
      .replace(".png", ".webp");

    try {
      await sharp(inputPath)
        .resize(CONFIG.THUMBNAIL.width, CONFIG.THUMBNAIL.height, {
          fit: "cover",
        })
        .webp({ quality: CONFIG.THUMBNAIL.quality })
        .toFile(outputPath);

      logger.info("Thumbnail created", { outputPath });
      return outputPath;
    } catch (error) {
      logger.error("Thumbnail creation failed", { error, inputPath });
      throw new Error(`Thumbnail creation failed: ${error}`);
    }
  }

  // ==========================================================================
  // COLOR EXTRACTION
  // ==========================================================================

  /**
   * Extract dominant color and color palette from image
   */
  private static async extractColors(imagePath: string): Promise<ColorPalette> {
    try {
      // Get image statistics using Sharp
      const { data } = await sharp(imagePath)
        .resize(100, 100, { fit: "inside" }) // Smaller for faster processing
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Extract RGB values
      const pixels: number[] = Array.from(data);
      const colorCounts = new Map<string, number>();

      // Count color occurrences
      for (let i = 0; i < pixels.length; i += 3) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Skip transparent/very light pixels
        if (r > 240 && g > 240 && b > 240) continue;

        const hex = this.rgbToHex(r, g, b);
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }

      // Get top 5 colors
      const sortedColors = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

      const dominantColor = sortedColors[0] || "#cccccc";

      return {
        dominantColor,
        colors: sortedColors,
      };
    } catch (error) {
      logger.error("Color extraction failed", { error, imagePath });
      return {
        dominantColor: "#cccccc",
        colors: ["#cccccc"],
      };
    }
  }

  /**
   * Convert RGB to hex color
   */
  private static rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Create initial image record in database
   */
  private static async createImageRecord(
    userId: string
  ): Promise<IImageDocument> {
    // Create a new document without saving (to avoid validation errors)
    const imageDoc = new Image({
      userId,
      originalUrl: "pending", // Temporary value to pass validation
      processingStatus: "pending",
      dominantColor: "#cccccc",
      colors: [],
      width: 1, // Temporary value to pass min validation
      height: 1, // Temporary value to pass min validation
      size: 1, // Temporary value to pass min validation
      mimeType: "image/png",
    });
    
    return imageDoc;
  }

  /**
   * Save uploaded file to disk
   */
  private static async saveOriginalFile(
    userId: string,
    imageId: string,
    file: File | Buffer
  ): Promise<string> {
    // Create user directory
    const userDir = path.join(CONFIG.UPLOAD_BASE_DIR, userId);
    await fs.mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = ".jpg";
    const filename = `original_${imageId}${ext}`;
    const filePath = path.join(userDir, filename);

    // Write file to disk
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      // File is a Web File/Blob - convert to Buffer
      const arrayBuf = await (file as File).arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    }

    await fs.writeFile(filePath, buffer);
    logger.info("Original file saved", { filePath });
    return filePath;
  }

  /**
   * Get public URL for a file path
   */
  private static getPublicUrl(filePath: string): string {
    const relativePath = filePath.replace(process.cwd() + "/public", "");
    return relativePath;
  }

  /**
   * Get MIME type from file
   */
  private static async getMimeType(filePath: string): Promise<string> {
    const metadata = await sharp(filePath).metadata();
    return `image/${metadata.format}` || "image/png";
  }

  /**
   * Get image dimensions
   */
  private static async getImageDimensions(
    filePath: string
  ): Promise<ImageDimensions> {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  /**
   * Get file size in bytes
   */
  private static async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Extract retry attempt count from error message
   * Format: "Error message [Attempt: X]"
   */
  private static getRetryAttempts(errorMessage?: string): number {
    if (!errorMessage) return 0;
    const match = errorMessage.match(/\[Attempt: (\d+)\]/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
