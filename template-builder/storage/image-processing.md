# Image Processing

Production-ready image processing with Sharp, Jimp, and Pillow for resizing, optimization, and transformations.

## Overview

Comprehensive image processing patterns for resizing, cropping, format conversion, optimization, watermarking, and metadata handling.

## Quick Start

```bash
npm install sharp jimp
pip install pillow
```

## TypeScript Implementation

### Sharp Image Processor

```typescript
// src/services/image-processor.ts
import sharp, { Sharp, ResizeOptions, FormatEnum } from 'sharp';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';

interface ProcessingOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  quality?: number;
  format?: keyof FormatEnum;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  watermark?: {
    input: Buffer | string;
    position?: 'center' | 'northwest' | 'northeast' | 'southwest' | 'southeast';
    opacity?: number;
  };
}

interface ImageInfo {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
  exif?: Record<string, any>;
}

interface ProcessingResult {
  buffer: Buffer;
  info: ImageInfo;
}

export class ImageProcessor {
  private defaultQuality: number;

  constructor(defaultQuality: number = 80) {
    this.defaultQuality = defaultQuality;
  }

  // Get image metadata
  async getInfo(input: Buffer | string): Promise<ImageInfo> {
    const image = sharp(input);
    const metadata = await image.metadata();
    const stats = await image.stats();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: metadata.size || 0,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
      exif: metadata.exif ? this.parseExif(metadata.exif) : undefined,
    };
  }

  // Process image with options
  async process(
    input: Buffer | string,
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    let image = sharp(input);

    // Auto-rotate based on EXIF orientation
    image = image.rotate();

    // Resize
    if (options.width || options.height) {
      image = image.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        position: options.position || 'center',
        withoutEnlargement: true,
      });
    }

    // Rotate
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    // Flip/Flop
    if (options.flip) {
      image = image.flip();
    }
    if (options.flop) {
      image = image.flop();
    }

    // Effects
    if (options.blur && options.blur > 0) {
      image = image.blur(options.blur);
    }
    if (options.sharpen) {
      image = image.sharpen();
    }
    if (options.grayscale) {
      image = image.grayscale();
    }

    // Watermark
    if (options.watermark) {
      image = await this.applyWatermark(image, options.watermark);
    }

    // Format conversion and quality
    const format = options.format || 'jpeg';
    const quality = options.quality || this.defaultQuality;

    switch (format) {
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        image = image.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        image = image.webp({ quality });
        break;
      case 'avif':
        image = image.avif({ quality });
        break;
      case 'heif':
        image = image.heif({ quality });
        break;
    }

    const { data, info } = await image.toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      info: {
        width: info.width,
        height: info.height,
        format: info.format,
        size: info.size,
        hasAlpha: info.channels === 4,
      },
    };
  }

  // Resize to specific dimensions
  async resize(
    input: Buffer | string,
    width: number,
    height?: number,
    fit: ResizeOptions['fit'] = 'cover'
  ): Promise<Buffer> {
    const { buffer } = await this.process(input, {
      width,
      height,
      fit,
    });
    return buffer;
  }

  // Create thumbnail
  async thumbnail(
    input: Buffer | string,
    size: number = 150,
    options?: { format?: keyof FormatEnum; quality?: number }
  ): Promise<Buffer> {
    const { buffer } = await this.process(input, {
      width: size,
      height: size,
      fit: 'cover',
      format: options?.format || 'jpeg',
      quality: options?.quality || 70,
    });
    return buffer;
  }

  // Optimize image
  async optimize(
    input: Buffer | string,
    options?: { format?: keyof FormatEnum; quality?: number; maxWidth?: number }
  ): Promise<ProcessingResult> {
    const info = await this.getInfo(input);

    const processOptions: ProcessingOptions = {
      format: options?.format || (info.format as keyof FormatEnum),
      quality: options?.quality || this.defaultQuality,
    };

    // Limit max width if specified
    if (options?.maxWidth && info.width > options.maxWidth) {
      processOptions.width = options.maxWidth;
      processOptions.fit = 'inside';
    }

    return this.process(input, processOptions);
  }

  // Convert format
  async convert(
    input: Buffer | string,
    format: keyof FormatEnum,
    quality?: number
  ): Promise<Buffer> {
    const { buffer } = await this.process(input, { format, quality });
    return buffer;
  }

  // Generate responsive images
  async generateResponsive(
    input: Buffer | string,
    widths: number[] = [320, 640, 960, 1280, 1920],
    options?: { format?: keyof FormatEnum; quality?: number }
  ): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>();
    const info = await this.getInfo(input);

    for (const width of widths) {
      // Skip widths larger than original
      if (width > info.width) continue;

      const { buffer } = await this.process(input, {
        width,
        fit: 'inside',
        format: options?.format,
        quality: options?.quality,
      });

      results.set(width, buffer);
    }

    return results;
  }

  // Apply watermark
  private async applyWatermark(
    image: Sharp,
    watermark: ProcessingOptions['watermark']
  ): Promise<Sharp> {
    if (!watermark) return image;

    const watermarkImage = sharp(watermark.input);

    if (watermark.opacity && watermark.opacity < 1) {
      // Apply opacity by manipulating alpha channel
      const { data, info } = await watermarkImage
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8Array(data);
      for (let i = 3; i < pixels.length; i += 4) {
        pixels[i] = Math.round(pixels[i] * watermark.opacity);
      }

      const adjustedWatermark = await sharp(pixels, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toBuffer();

      return image.composite([
        {
          input: adjustedWatermark,
          gravity: watermark.position || 'center',
        },
      ]);
    }

    return image.composite([
      {
        input: await watermarkImage.toBuffer(),
        gravity: watermark.position || 'center',
      },
    ]);
  }

  // Extract dominant colors
  async extractColors(input: Buffer | string, count: number = 5): Promise<string[]> {
    const { dominant, ...stats } = await sharp(input)
      .resize(100, 100, { fit: 'cover' })
      .stats();

    // Return dominant color and channel averages
    const colors: string[] = [];

    if (dominant) {
      colors.push(`rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`);
    }

    return colors;
  }

  // Create image collage
  async createCollage(
    images: Array<Buffer | string>,
    options: {
      width: number;
      height: number;
      columns?: number;
      gap?: number;
      background?: string;
    }
  ): Promise<Buffer> {
    const { width, height, columns = 2, gap = 10, background = '#ffffff' } = options;
    const rows = Math.ceil(images.length / columns);

    const cellWidth = Math.floor((width - gap * (columns + 1)) / columns);
    const cellHeight = Math.floor((height - gap * (rows + 1)) / rows);

    const composites: sharp.OverlayOptions[] = [];

    for (let i = 0; i < images.length; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;

      const x = gap + col * (cellWidth + gap);
      const y = gap + row * (cellHeight + gap);

      const resized = await sharp(images[i])
        .resize(cellWidth, cellHeight, { fit: 'cover' })
        .toBuffer();

      composites.push({
        input: resized,
        left: x,
        top: y,
      });
    }

    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background,
      },
    })
      .composite(composites)
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  private parseExif(exifBuffer: Buffer): Record<string, any> {
    // Simplified EXIF parsing - use exifr library for full parsing
    return {};
  }
}

// Factory function
export function createImageProcessor(defaultQuality?: number): ImageProcessor {
  return new ImageProcessor(defaultQuality);
}
```

### Express Image API

```typescript
// src/routes/images.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createImageProcessor } from '../services/image-processor';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const imageProcessor = createImageProcessor(85);
const upload = multer({ storage: multer.memoryStorage() });

const UPLOAD_DIR = './uploads/images';

// Upload and process image
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { width, height, format, quality } = req.body;

    const result = await imageProcessor.process(req.file.buffer, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      format: format || 'webp',
      quality: quality ? parseInt(quality) : 85,
    });

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${uuidv4()}.${result.info.format}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, result.buffer);

    res.json({
      filename,
      url: `/images/${filename}`,
      width: result.info.width,
      height: result.info.height,
      format: result.info.format,
      size: result.info.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// Resize image
router.post('/resize', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { width, height, fit } = req.body;

    if (!width && !height) {
      return res.status(400).json({ error: 'Width or height required' });
    }

    const buffer = await imageProcessor.resize(
      req.file.buffer,
      parseInt(width) || undefined!,
      height ? parseInt(height) : undefined,
      fit || 'cover'
    );

    res.set('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Resize error:', error);
    res.status(500).json({ error: 'Resize failed' });
  }
});

// Generate thumbnail
router.post('/thumbnail', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const size = parseInt(req.body.size) || 150;
    const format = req.body.format || 'jpeg';

    const buffer = await imageProcessor.thumbnail(req.file.buffer, size, {
      format,
      quality: 70,
    });

    res.set('Content-Type', `image/${format}`);
    res.send(buffer);
  } catch (error) {
    console.error('Thumbnail error:', error);
    res.status(500).json({ error: 'Thumbnail generation failed' });
  }
});

// Optimize image
router.post('/optimize', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { format, quality, maxWidth } = req.body;

    const result = await imageProcessor.optimize(req.file.buffer, {
      format,
      quality: quality ? parseInt(quality) : undefined,
      maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
    });

    res.set('Content-Type', `image/${result.info.format}`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// Convert format
router.post('/convert', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { format, quality } = req.body;

    if (!format) {
      return res.status(400).json({ error: 'Format required' });
    }

    const buffer = await imageProcessor.convert(
      req.file.buffer,
      format,
      quality ? parseInt(quality) : undefined
    );

    res.set('Content-Type', `image/${format}`);
    res.send(buffer);
  } catch (error) {
    console.error('Convert error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Generate responsive images
router.post('/responsive', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const widths = req.body.widths
      ? req.body.widths.split(',').map(Number)
      : [320, 640, 960, 1280, 1920];

    const format = req.body.format || 'webp';

    const images = await imageProcessor.generateResponsive(req.file.buffer, widths, {
      format,
      quality: 80,
    });

    await mkdir(UPLOAD_DIR, { recursive: true });
    const baseId = uuidv4();
    const urls: Record<number, string> = {};

    for (const [width, buffer] of images) {
      const filename = `${baseId}_${width}.${format}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, buffer);
      urls[width] = `/images/${filename}`;
    }

    res.json({ urls });
  } catch (error) {
    console.error('Responsive error:', error);
    res.status(500).json({ error: 'Responsive generation failed' });
  }
});

// Get image info
router.post('/info', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const info = await imageProcessor.getInfo(req.file.buffer);
    res.json(info);
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ error: 'Failed to get info' });
  }
});

// Dynamic image transformation
router.get('/transform/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { w, h, f, q, fit, blur, gray } = req.query;

    const filepath = path.join(UPLOAD_DIR, filename);

    const result = await imageProcessor.process(filepath, {
      width: w ? parseInt(w as string) : undefined,
      height: h ? parseInt(h as string) : undefined,
      format: (f as any) || 'webp',
      quality: q ? parseInt(q as string) : 80,
      fit: (fit as any) || 'cover',
      blur: blur ? parseFloat(blur as string) : undefined,
      grayscale: gray === 'true',
    });

    // Cache header for transformed images
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Content-Type', `image/${result.info.format}`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Transform error:', error);
    res.status(500).json({ error: 'Transformation failed' });
  }
});

export default router;
```

### Jimp Alternative

```typescript
// src/services/jimp-processor.ts
import Jimp from 'jimp';

interface JimpProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  blur?: number;
  grayscale?: boolean;
  rotate?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  brightness?: number;
  contrast?: number;
  watermark?: {
    image: Jimp;
    x: number;
    y: number;
    opacity?: number;
  };
}

export class JimpProcessor {
  // Load image
  async load(input: Buffer | string): Promise<Jimp> {
    return Jimp.read(input);
  }

  // Process image
  async process(input: Buffer | string, options: JimpProcessingOptions): Promise<Buffer> {
    let image = await this.load(input);

    // Resize
    if (options.width || options.height) {
      image = image.resize(
        options.width || Jimp.AUTO,
        options.height || Jimp.AUTO
      );
    }

    // Rotate
    if (options.rotate) {
      image = image.rotate(options.rotate);
    }

    // Flip
    if (options.flip) {
      if (options.flip === 'horizontal' || options.flip === 'both') {
        image = image.flip(true, false);
      }
      if (options.flip === 'vertical' || options.flip === 'both') {
        image = image.flip(false, true);
      }
    }

    // Effects
    if (options.blur) {
      image = image.blur(options.blur);
    }
    if (options.grayscale) {
      image = image.grayscale();
    }
    if (options.brightness !== undefined) {
      image = image.brightness(options.brightness);
    }
    if (options.contrast !== undefined) {
      image = image.contrast(options.contrast);
    }

    // Watermark
    if (options.watermark) {
      image = image.composite(
        options.watermark.image,
        options.watermark.x,
        options.watermark.y,
        {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: options.watermark.opacity || 1,
          opacityDest: 1,
        }
      );
    }

    // Set quality
    if (options.quality) {
      image = image.quality(options.quality);
    }

    return image.getBufferAsync(Jimp.MIME_JPEG);
  }

  // Create thumbnail with cover crop
  async thumbnail(input: Buffer | string, size: number): Promise<Buffer> {
    const image = await this.load(input);
    return image
      .cover(size, size)
      .quality(70)
      .getBufferAsync(Jimp.MIME_JPEG);
  }

  // Add text to image
  async addText(
    input: Buffer | string,
    text: string,
    options: { x: number; y: number; fontSize?: number; color?: string }
  ): Promise<Buffer> {
    const image = await this.load(input);
    const font = await Jimp.loadFont(
      options.fontSize === 32
        ? Jimp.FONT_SANS_32_BLACK
        : Jimp.FONT_SANS_16_BLACK
    );

    return image
      .print(font, options.x, options.y, text)
      .getBufferAsync(Jimp.MIME_PNG);
  }

  // Get image metadata
  async getMetadata(input: Buffer | string): Promise<{
    width: number;
    height: number;
    mime: string;
  }> {
    const image = await this.load(input);
    return {
      width: image.getWidth(),
      height: image.getHeight(),
      mime: image.getMIME(),
    };
  }
}
```

## Python Implementation

```python
# image_processing/processor.py
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont
from io import BytesIO
from typing import Optional, Tuple, List, Dict, Any, Union
from dataclasses import dataclass
from pathlib import Path
import hashlib


@dataclass
class ImageInfo:
    width: int
    height: int
    format: str
    mode: str
    size: int


@dataclass
class ProcessingResult:
    data: bytes
    info: ImageInfo


class ImageProcessor:
    def __init__(self, default_quality: int = 85):
        self.default_quality = default_quality

    def load(self, source: Union[bytes, str, Path]) -> Image.Image:
        """Load image from bytes or file path."""
        if isinstance(source, bytes):
            return Image.open(BytesIO(source))
        return Image.open(source)

    def get_info(self, source: Union[bytes, str, Path]) -> ImageInfo:
        """Get image metadata."""
        img = self.load(source)

        # Get file size
        if isinstance(source, bytes):
            size = len(source)
        else:
            size = Path(source).stat().st_size

        return ImageInfo(
            width=img.width,
            height=img.height,
            format=img.format or 'unknown',
            mode=img.mode,
            size=size
        )

    def process(
        self,
        source: Union[bytes, str, Path],
        width: Optional[int] = None,
        height: Optional[int] = None,
        fit: str = 'cover',
        format: str = 'JPEG',
        quality: Optional[int] = None,
        blur: Optional[float] = None,
        sharpen: bool = False,
        grayscale: bool = False,
        rotate: Optional[int] = None,
        flip: Optional[str] = None,
        brightness: Optional[float] = None,
        contrast: Optional[float] = None,
    ) -> ProcessingResult:
        """Process image with various transformations."""
        img = self.load(source)

        # Convert to RGB if necessary (for JPEG output)
        if format.upper() == 'JPEG' and img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Resize
        if width or height:
            img = self._resize(img, width, height, fit)

        # Rotate
        if rotate:
            img = img.rotate(rotate, expand=True)

        # Flip
        if flip:
            if flip in ('horizontal', 'both'):
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            if flip in ('vertical', 'both'):
                img = img.transpose(Image.FLIP_TOP_BOTTOM)

        # Effects
        if blur:
            img = img.filter(ImageFilter.GaussianBlur(radius=blur))
        if sharpen:
            img = img.filter(ImageFilter.SHARPEN)
        if grayscale:
            img = img.convert('L')
        if brightness is not None:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(brightness)
        if contrast is not None:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(contrast)

        # Save to buffer
        buffer = BytesIO()
        save_kwargs = {}

        if format.upper() in ('JPEG', 'JPG'):
            save_kwargs['quality'] = quality or self.default_quality
            save_kwargs['optimize'] = True
        elif format.upper() == 'PNG':
            save_kwargs['optimize'] = True
        elif format.upper() == 'WEBP':
            save_kwargs['quality'] = quality or self.default_quality

        img.save(buffer, format=format.upper(), **save_kwargs)
        data = buffer.getvalue()

        return ProcessingResult(
            data=data,
            info=ImageInfo(
                width=img.width,
                height=img.height,
                format=format.upper(),
                mode=img.mode,
                size=len(data)
            )
        )

    def _resize(
        self,
        img: Image.Image,
        width: Optional[int],
        height: Optional[int],
        fit: str
    ) -> Image.Image:
        """Resize image with different fit modes."""
        if fit == 'cover':
            # Crop to fill dimensions
            return self._resize_cover(img, width, height)
        elif fit == 'contain':
            # Fit within dimensions, maintain aspect ratio
            return self._resize_contain(img, width, height)
        elif fit == 'fill':
            # Stretch to fill
            if width and height:
                return img.resize((width, height), Image.LANCZOS)

        # Default: scale maintaining aspect ratio
        if width and height:
            img.thumbnail((width, height), Image.LANCZOS)
        elif width:
            ratio = width / img.width
            img = img.resize((width, int(img.height * ratio)), Image.LANCZOS)
        elif height:
            ratio = height / img.height
            img = img.resize((int(img.width * ratio), height), Image.LANCZOS)

        return img

    def _resize_cover(
        self,
        img: Image.Image,
        width: Optional[int],
        height: Optional[int]
    ) -> Image.Image:
        """Resize and crop to cover dimensions."""
        if not width:
            width = img.width
        if not height:
            height = img.height

        img_ratio = img.width / img.height
        target_ratio = width / height

        if img_ratio > target_ratio:
            # Image is wider, crop horizontally
            new_height = height
            new_width = int(height * img_ratio)
        else:
            # Image is taller, crop vertically
            new_width = width
            new_height = int(width / img_ratio)

        img = img.resize((new_width, new_height), Image.LANCZOS)

        # Center crop
        left = (new_width - width) // 2
        top = (new_height - height) // 2
        right = left + width
        bottom = top + height

        return img.crop((left, top, right, bottom))

    def _resize_contain(
        self,
        img: Image.Image,
        width: Optional[int],
        height: Optional[int]
    ) -> Image.Image:
        """Resize to fit within dimensions."""
        if not width:
            width = img.width
        if not height:
            height = img.height

        img.thumbnail((width, height), Image.LANCZOS)
        return img

    def thumbnail(
        self,
        source: Union[bytes, str, Path],
        size: int = 150,
        format: str = 'JPEG',
        quality: int = 70
    ) -> bytes:
        """Create square thumbnail."""
        result = self.process(
            source,
            width=size,
            height=size,
            fit='cover',
            format=format,
            quality=quality
        )
        return result.data

    def optimize(
        self,
        source: Union[bytes, str, Path],
        max_width: Optional[int] = None,
        quality: Optional[int] = None,
        format: Optional[str] = None
    ) -> ProcessingResult:
        """Optimize image for web."""
        info = self.get_info(source)

        # Determine optimal format
        if not format:
            format = info.format if info.format in ('JPEG', 'PNG', 'WEBP') else 'JPEG'

        options = {
            'format': format,
            'quality': quality or self.default_quality
        }

        if max_width and info.width > max_width:
            options['width'] = max_width
            options['fit'] = 'contain'

        return self.process(source, **options)

    def add_watermark(
        self,
        source: Union[bytes, str, Path],
        watermark: Union[bytes, str, Path],
        position: str = 'center',
        opacity: float = 0.5,
        scale: float = 0.2
    ) -> bytes:
        """Add watermark to image."""
        img = self.load(source).convert('RGBA')
        wm = self.load(watermark).convert('RGBA')

        # Scale watermark
        wm_width = int(img.width * scale)
        wm_height = int(wm.height * (wm_width / wm.width))
        wm = wm.resize((wm_width, wm_height), Image.LANCZOS)

        # Apply opacity
        if opacity < 1:
            alpha = wm.split()[3]
            alpha = alpha.point(lambda p: int(p * opacity))
            wm.putalpha(alpha)

        # Calculate position
        positions = {
            'center': ((img.width - wm_width) // 2, (img.height - wm_height) // 2),
            'northwest': (10, 10),
            'northeast': (img.width - wm_width - 10, 10),
            'southwest': (10, img.height - wm_height - 10),
            'southeast': (img.width - wm_width - 10, img.height - wm_height - 10),
        }
        pos = positions.get(position, positions['center'])

        # Composite
        img.paste(wm, pos, wm)

        # Convert back and save
        buffer = BytesIO()
        img.convert('RGB').save(buffer, 'JPEG', quality=self.default_quality)
        return buffer.getvalue()

    def generate_responsive(
        self,
        source: Union[bytes, str, Path],
        widths: List[int] = [320, 640, 960, 1280, 1920],
        format: str = 'WEBP',
        quality: int = 80
    ) -> Dict[int, bytes]:
        """Generate responsive image set."""
        info = self.get_info(source)
        results = {}

        for width in widths:
            if width > info.width:
                continue

            result = self.process(
                source,
                width=width,
                fit='contain',
                format=format,
                quality=quality
            )
            results[width] = result.data

        return results


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.responses import Response

app = FastAPI()
processor = ImageProcessor(default_quality=85)


@app.post('/process')
async def process_image(
    file: UploadFile = File(...),
    width: Optional[int] = Query(None),
    height: Optional[int] = Query(None),
    format: str = Query('webp'),
    quality: int = Query(80),
    fit: str = Query('cover'),
):
    content = await file.read()

    try:
        result = processor.process(
            content,
            width=width,
            height=height,
            format=format,
            quality=quality,
            fit=fit
        )

        return Response(
            content=result.data,
            media_type=f'image/{format.lower()}'
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post('/thumbnail')
async def create_thumbnail(
    file: UploadFile = File(...),
    size: int = Query(150),
):
    content = await file.read()

    try:
        data = processor.thumbnail(content, size=size)
        return Response(content=data, media_type='image/jpeg')
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post('/optimize')
async def optimize_image(
    file: UploadFile = File(...),
    max_width: Optional[int] = Query(None),
    quality: int = Query(85),
):
    content = await file.read()

    try:
        result = processor.optimize(
            content,
            max_width=max_width,
            quality=quality
        )
        return Response(
            content=result.data,
            media_type=f'image/{result.info.format.lower()}'
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Image Processing Commands

### Resize Operations
- "resize image" - Change dimensions
- "create thumbnail" - Generate thumbnail
- "generate responsive images" - Create srcset images

### Format Conversion
- "convert to WebP" - Modern format conversion
- "convert to AVIF" - Next-gen format
- "optimize JPEG" - Compress JPEG

### Transformations
- "crop image" - Extract region
- "rotate image" - Apply rotation
- "flip image" - Mirror horizontally/vertically

### Effects
- "add watermark" - Overlay watermark
- "apply blur" - Gaussian blur
- "adjust brightness" - Brightness control
- "grayscale conversion" - Remove color
```

## AI Suggestions

1. **"Implement lazy loading placeholders"** - Generate LQIP/blur placeholders
2. **"Add face detection cropping"** - Smart crop around faces
3. **"Implement image comparison"** - Generate visual diffs
4. **"Add color palette extraction"** - Get dominant colors
5. **"Implement image sprites"** - Combine multiple images
6. **"Add EXIF stripping"** - Remove metadata for privacy
7. **"Implement smart cropping"** - Saliency-based cropping
8. **"Add image caching layer"** - Redis-based transformation cache
9. **"Implement progressive JPEG"** - Better loading experience
10. **"Add batch processing"** - Process multiple images efficiently
