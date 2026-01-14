# Media Optimization

Production-ready media optimization for images, videos, and documents with compression, format conversion, and delivery optimization.

## Overview

Comprehensive media optimization patterns for reducing file sizes, improving load times, and delivering optimal formats based on client capabilities.

## Quick Start

```bash
npm install sharp imagemin imagemin-webp imagemin-avif svgo
pip install pillow-avif-plugin svglib
```

## TypeScript Implementation

### Image Optimizer

```typescript
// src/optimization/image-optimizer.ts
import sharp, { FormatEnum } from 'sharp';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminPngquant from 'imagemin-pngquant';
import imageminMozjpeg from 'imagemin-mozjpeg';
import { optimize as svgOptimize } from 'svgo';

interface OptimizationOptions {
  quality?: number;
  format?: keyof FormatEnum | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  progressive?: boolean;
  stripMetadata?: boolean;
  preserveAnimation?: boolean;
}

interface OptimizationResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

interface FormatScore {
  format: string;
  score: number;
  reasons: string[];
}

export class ImageOptimizer {
  private defaultQuality: number;

  constructor(defaultQuality: number = 80) {
    this.defaultQuality = defaultQuality;
  }

  // Optimize image with automatic format selection
  async optimize(
    input: Buffer,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    const originalSize = input.length;
    const metadata = await sharp(input).metadata();

    // Determine optimal format
    const format = options.format === 'auto' || !options.format
      ? this.selectOptimalFormat(metadata)
      : options.format;

    let image = sharp(input);

    // Strip metadata unless preservation requested
    if (options.stripMetadata !== false) {
      image = image.withMetadata({});
    }

    // Resize if needed
    if (options.maxWidth || options.maxHeight) {
      image = image.resize({
        width: options.maxWidth,
        height: options.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimization
    const quality = options.quality || this.defaultQuality;

    switch (format) {
      case 'webp':
        image = image.webp({
          quality,
          effort: 6,
          smartSubsample: true,
        });
        break;

      case 'avif':
        image = image.avif({
          quality,
          effort: 6,
        });
        break;

      case 'jpeg':
      case 'jpg':
        image = image.jpeg({
          quality,
          mozjpeg: true,
          progressive: options.progressive !== false,
        });
        break;

      case 'png':
        image = image.png({
          quality,
          compressionLevel: 9,
          effort: 10,
        });
        break;

      case 'gif':
        if (options.preserveAnimation && metadata.pages && metadata.pages > 1) {
          // Animated GIF - use sharp's animated support
          image = image.gif({
            effort: 10,
          });
        } else {
          // Static - convert to PNG for better compression
          image = image.png({
            quality,
            compressionLevel: 9,
          });
        }
        break;

      default:
        image = image.webp({ quality });
    }

    const { data, info } = await image.toBuffer({ resolveWithObject: true });

    const savings = originalSize - data.length;

    return {
      buffer: data,
      format: info.format,
      width: info.width,
      height: info.height,
      originalSize,
      optimizedSize: data.length,
      savings,
      savingsPercent: Math.round((savings / originalSize) * 100),
    };
  }

  // Batch optimize multiple images
  async optimizeBatch(
    images: Array<{ id: string; buffer: Buffer }>,
    options: OptimizationOptions = {}
  ): Promise<Map<string, OptimizationResult>> {
    const results = new Map<string, OptimizationResult>();

    await Promise.all(
      images.map(async ({ id, buffer }) => {
        const result = await this.optimize(buffer, options);
        results.set(id, result);
      })
    );

    return results;
  }

  // Generate multiple format variants
  async generateVariants(
    input: Buffer,
    formats: Array<keyof FormatEnum> = ['webp', 'avif', 'jpeg'],
    options: Omit<OptimizationOptions, 'format'> = {}
  ): Promise<Map<string, OptimizationResult>> {
    const variants = new Map<string, OptimizationResult>();

    await Promise.all(
      formats.map(async (format) => {
        const result = await this.optimize(input, { ...options, format });
        variants.set(format, result);
      })
    );

    return variants;
  }

  // Generate responsive image set
  async generateResponsiveSet(
    input: Buffer,
    widths: number[] = [320, 640, 960, 1280, 1920],
    options: OptimizationOptions = {}
  ): Promise<Map<number, OptimizationResult>> {
    const results = new Map<number, OptimizationResult>();
    const metadata = await sharp(input).metadata();
    const originalWidth = metadata.width || 0;

    await Promise.all(
      widths
        .filter((w) => w <= originalWidth)
        .map(async (width) => {
          const result = await this.optimize(input, {
            ...options,
            maxWidth: width,
          });
          results.set(width, result);
        })
    );

    return results;
  }

  // Optimize SVG
  async optimizeSvg(
    input: string,
    options?: { removeComments?: boolean; removeMetadata?: boolean }
  ): Promise<{
    output: string;
    originalSize: number;
    optimizedSize: number;
    savings: number;
  }> {
    const originalSize = Buffer.byteLength(input, 'utf-8');

    const result = svgOptimize(input, {
      plugins: [
        'preset-default',
        'removeDimensions',
        ...(options?.removeComments ? ['removeComments'] : []),
        ...(options?.removeMetadata ? ['removeMetadata'] : []),
      ],
    });

    const optimizedSize = Buffer.byteLength(result.data, 'utf-8');

    return {
      output: result.data,
      originalSize,
      optimizedSize,
      savings: originalSize - optimizedSize,
    };
  }

  // Generate blur placeholder (LQIP)
  async generatePlaceholder(
    input: Buffer,
    options?: { width?: number; blur?: number }
  ): Promise<{
    dataUrl: string;
    buffer: Buffer;
  }> {
    const width = options?.width || 20;
    const blur = options?.blur || 5;

    const buffer = await sharp(input)
      .resize(width)
      .blur(blur)
      .jpeg({ quality: 20 })
      .toBuffer();

    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return { dataUrl, buffer };
  }

  // Generate dominant color placeholder
  async getDominantColor(input: Buffer): Promise<string> {
    const { dominant } = await sharp(input)
      .resize(1, 1)
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(async ({ data }) => {
        const stats = await sharp(input).stats();
        return stats;
      });

    return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
  }

  // Select optimal format based on image characteristics
  private selectOptimalFormat(metadata: sharp.Metadata): keyof FormatEnum {
    const hasAlpha = metadata.hasAlpha;
    const isAnimated = metadata.pages && metadata.pages > 1;
    const format = metadata.format;

    // Preserve animated images
    if (isAnimated) {
      return 'webp'; // WebP supports animation
    }

    // For images with transparency
    if (hasAlpha) {
      return 'webp'; // WebP handles transparency well
    }

    // Photos and complex images
    if (format === 'jpeg' || format === 'jpg') {
      return 'webp'; // WebP typically better than JPEG
    }

    // Simple graphics, logos
    if (format === 'png') {
      return 'webp';
    }

    return 'webp'; // Default to WebP
  }

  // Analyze image and recommend optimization
  async analyze(input: Buffer): Promise<{
    metadata: sharp.Metadata;
    recommendations: FormatScore[];
    estimatedSavings: Record<string, number>;
  }> {
    const metadata = await sharp(input).metadata();
    const originalSize = input.length;

    // Test different formats
    const formats: Array<keyof FormatEnum> = ['webp', 'avif', 'jpeg', 'png'];
    const estimatedSavings: Record<string, number> = {};
    const recommendations: FormatScore[] = [];

    for (const format of formats) {
      try {
        const result = await this.optimize(input, { format, quality: 80 });
        estimatedSavings[format] = result.savingsPercent;

        const score = this.calculateFormatScore(format, metadata, result);
        recommendations.push(score);
      } catch {
        // Format not supported for this image
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      metadata,
      recommendations,
      estimatedSavings,
    };
  }

  private calculateFormatScore(
    format: string,
    metadata: sharp.Metadata,
    result: OptimizationResult
  ): FormatScore {
    const reasons: string[] = [];
    let score = 0;

    // Size savings
    if (result.savingsPercent > 30) {
      score += 30;
      reasons.push(`${result.savingsPercent}% size reduction`);
    } else if (result.savingsPercent > 15) {
      score += 15;
      reasons.push(`${result.savingsPercent}% size reduction`);
    }

    // Browser support
    if (format === 'webp') {
      score += 25;
      reasons.push('95%+ browser support');
    } else if (format === 'avif') {
      score += 15;
      reasons.push('Growing browser support, best compression');
    } else if (format === 'jpeg') {
      score += 20;
      reasons.push('Universal browser support');
    }

    // Feature support
    if (metadata.hasAlpha) {
      if (format === 'webp' || format === 'avif' || format === 'png') {
        score += 10;
        reasons.push('Preserves transparency');
      } else {
        score -= 20;
        reasons.push('Does not support transparency');
      }
    }

    return { format, score, reasons };
  }
}

// Factory function
export function createImageOptimizer(defaultQuality?: number): ImageOptimizer {
  return new ImageOptimizer(defaultQuality);
}
```

### Document Optimizer

```typescript
// src/optimization/document-optimizer.ts
import { PDFDocument } from 'pdf-lib';

interface PDFOptimizationOptions {
  compressImages?: boolean;
  removeMetadata?: boolean;
  linearize?: boolean;
  imageQuality?: number;
}

interface PDFOptimizationResult {
  buffer: Buffer;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  pageCount: number;
}

export class DocumentOptimizer {
  // Optimize PDF
  async optimizePDF(
    input: Buffer,
    options: PDFOptimizationOptions = {}
  ): Promise<PDFOptimizationResult> {
    const originalSize = input.length;

    // Load PDF
    const pdfDoc = await PDFDocument.load(input, {
      ignoreEncryption: true,
    });

    // Remove metadata if requested
    if (options.removeMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    // Save with compression
    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const buffer = Buffer.from(optimizedBytes);

    return {
      buffer,
      originalSize,
      optimizedSize: buffer.length,
      savings: originalSize - buffer.length,
      pageCount: pdfDoc.getPageCount(),
    };
  }

  // Merge multiple PDFs
  async mergePDFs(inputs: Buffer[]): Promise<Buffer> {
    const mergedDoc = await PDFDocument.create();

    for (const input of inputs) {
      const pdfDoc = await PDFDocument.load(input);
      const pages = await mergedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => mergedDoc.addPage(page));
    }

    const bytes = await mergedDoc.save();
    return Buffer.from(bytes);
  }

  // Extract pages from PDF
  async extractPages(
    input: Buffer,
    pageNumbers: number[]
  ): Promise<Buffer> {
    const sourcePdf = await PDFDocument.load(input);
    const extractedPdf = await PDFDocument.create();

    const pageIndices = pageNumbers.map((n) => n - 1); // Convert to 0-indexed
    const pages = await extractedPdf.copyPages(sourcePdf, pageIndices);

    pages.forEach((page) => extractedPdf.addPage(page));

    const bytes = await extractedPdf.save();
    return Buffer.from(bytes);
  }

  // Get PDF info
  async getPDFInfo(input: Buffer): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  }> {
    const pdfDoc = await PDFDocument.load(input);

    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
    };
  }
}

export function createDocumentOptimizer(): DocumentOptimizer {
  return new DocumentOptimizer();
}
```

### Express Optimization API

```typescript
// src/routes/optimize.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createImageOptimizer } from '../optimization/image-optimizer';
import { createDocumentOptimizer } from '../optimization/document-optimizer';

const router = Router();
const imageOptimizer = createImageOptimizer(80);
const documentOptimizer = createDocumentOptimizer();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Optimize image
router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { quality, format, maxWidth, maxHeight } = req.body;

    const result = await imageOptimizer.optimize(req.file.buffer, {
      quality: quality ? parseInt(quality) : undefined,
      format: format || 'auto',
      maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
    });

    res.json({
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      savings: result.savings,
      savingsPercent: result.savingsPercent,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// Download optimized image
router.post('/image/download', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { quality, format, maxWidth, maxHeight } = req.body;

    const result = await imageOptimizer.optimize(req.file.buffer, {
      quality: quality ? parseInt(quality) : 80,
      format: format || 'webp',
      maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
      maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
    });

    res.set('Content-Type', `image/${result.format}`);
    res.set('X-Original-Size', result.originalSize.toString());
    res.set('X-Optimized-Size', result.optimizedSize.toString());
    res.set('X-Savings-Percent', result.savingsPercent.toString());
    res.send(result.buffer);
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// Generate responsive variants
router.post('/image/responsive', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { widths, format, quality } = req.body;
    const widthArray = widths ? widths.split(',').map(Number) : [320, 640, 960, 1280, 1920];

    const results = await imageOptimizer.generateResponsiveSet(req.file.buffer, widthArray, {
      format: format || 'webp',
      quality: quality ? parseInt(quality) : 80,
    });

    const response: Record<number, any> = {};
    for (const [width, result] of results) {
      response[width] = {
        size: result.optimizedSize,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Responsive generation error:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Analyze image
router.post('/image/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const analysis = await imageOptimizer.analyze(req.file.buffer);

    res.json({
      metadata: {
        format: analysis.metadata.format,
        width: analysis.metadata.width,
        height: analysis.metadata.height,
        hasAlpha: analysis.metadata.hasAlpha,
        isAnimated: (analysis.metadata.pages || 1) > 1,
      },
      recommendations: analysis.recommendations,
      estimatedSavings: analysis.estimatedSavings,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Generate placeholder
router.post('/image/placeholder', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { width, blur } = req.body;

    const result = await imageOptimizer.generatePlaceholder(req.file.buffer, {
      width: width ? parseInt(width) : 20,
      blur: blur ? parseInt(blur) : 5,
    });

    res.json({
      dataUrl: result.dataUrl,
      size: result.buffer.length,
    });
  } catch (error) {
    console.error('Placeholder error:', error);
    res.status(500).json({ error: 'Placeholder generation failed' });
  }
});

// Optimize PDF
router.post('/pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF provided' });
    }

    const { removeMetadata } = req.body;

    const result = await documentOptimizer.optimizePDF(req.file.buffer, {
      removeMetadata: removeMetadata === 'true',
    });

    res.json({
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      savings: result.savings,
      pageCount: result.pageCount,
    });
  } catch (error) {
    console.error('PDF optimization error:', error);
    res.status(500).json({ error: 'PDF optimization failed' });
  }
});

// Optimize SVG
router.post('/svg', upload.single('svg'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No SVG provided' });
    }

    const svgContent = req.file.buffer.toString('utf-8');
    const result = await imageOptimizer.optimizeSvg(svgContent);

    res.json({
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      savings: result.savings,
    });
  } catch (error) {
    console.error('SVG optimization error:', error);
    res.status(500).json({ error: 'SVG optimization failed' });
  }
});

export default router;
```

## Python Implementation

```python
# optimization/image_optimizer.py
from PIL import Image
from io import BytesIO
from typing import Optional, Dict, List, Tuple, Any
from dataclasses import dataclass
import pillow_avif  # Enable AVIF support


@dataclass
class OptimizationResult:
    buffer: bytes
    format: str
    width: int
    height: int
    original_size: int
    optimized_size: int
    savings: int
    savings_percent: float


class ImageOptimizer:
    def __init__(self, default_quality: int = 80):
        self.default_quality = default_quality

    def optimize(
        self,
        input_data: bytes,
        quality: Optional[int] = None,
        format: str = 'auto',
        max_width: Optional[int] = None,
        max_height: Optional[int] = None,
        strip_metadata: bool = True,
    ) -> OptimizationResult:
        """Optimize image."""
        original_size = len(input_data)
        quality = quality or self.default_quality

        # Load image
        img = Image.open(BytesIO(input_data))

        # Convert mode if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            if format.lower() in ('jpeg', 'jpg'):
                img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Resize if needed
        if max_width or max_height:
            img.thumbnail(
                (max_width or img.width, max_height or img.height),
                Image.LANCZOS
            )

        # Select format
        if format == 'auto':
            format = self._select_optimal_format(img)

        # Optimize and save
        output = BytesIO()

        save_kwargs = {'optimize': True}

        if format.lower() in ('jpeg', 'jpg'):
            save_kwargs['quality'] = quality
            save_kwargs['progressive'] = True
            format = 'JPEG'
        elif format.lower() == 'webp':
            save_kwargs['quality'] = quality
            save_kwargs['method'] = 6
            format = 'WEBP'
        elif format.lower() == 'avif':
            save_kwargs['quality'] = quality
            format = 'AVIF'
        elif format.lower() == 'png':
            save_kwargs['compress_level'] = 9
            format = 'PNG'

        # Strip metadata
        if strip_metadata:
            # Create clean copy without EXIF
            clean_img = Image.new(img.mode, img.size)
            clean_img.putdata(list(img.getdata()))
            img = clean_img

        img.save(output, format=format, **save_kwargs)
        optimized_data = output.getvalue()

        savings = original_size - len(optimized_data)

        return OptimizationResult(
            buffer=optimized_data,
            format=format.lower(),
            width=img.width,
            height=img.height,
            original_size=original_size,
            optimized_size=len(optimized_data),
            savings=savings,
            savings_percent=round((savings / original_size) * 100, 1)
        )

    def generate_variants(
        self,
        input_data: bytes,
        formats: List[str] = ['webp', 'avif', 'jpeg'],
        quality: int = 80,
    ) -> Dict[str, OptimizationResult]:
        """Generate multiple format variants."""
        variants = {}

        for fmt in formats:
            try:
                result = self.optimize(input_data, quality=quality, format=fmt)
                variants[fmt] = result
            except Exception:
                pass  # Format not supported

        return variants

    def generate_responsive_set(
        self,
        input_data: bytes,
        widths: List[int] = [320, 640, 960, 1280, 1920],
        format: str = 'webp',
        quality: int = 80,
    ) -> Dict[int, OptimizationResult]:
        """Generate responsive image set."""
        results = {}
        img = Image.open(BytesIO(input_data))
        original_width = img.width

        for width in widths:
            if width <= original_width:
                result = self.optimize(
                    input_data,
                    quality=quality,
                    format=format,
                    max_width=width
                )
                results[width] = result

        return results

    def generate_placeholder(
        self,
        input_data: bytes,
        width: int = 20,
        blur: int = 5,
    ) -> Dict[str, Any]:
        """Generate blur placeholder."""
        img = Image.open(BytesIO(input_data))

        # Resize to tiny
        ratio = width / img.width
        new_height = int(img.height * ratio)
        img = img.resize((width, new_height), Image.LANCZOS)

        # Apply blur
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(radius=blur))

        # Convert to RGB for JPEG
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Save as low quality JPEG
        output = BytesIO()
        img.save(output, 'JPEG', quality=20)
        buffer = output.getvalue()

        import base64
        data_url = f'data:image/jpeg;base64,{base64.b64encode(buffer).decode()}'

        return {
            'data_url': data_url,
            'buffer': buffer,
            'width': width,
            'height': new_height,
        }

    def get_dominant_color(self, input_data: bytes) -> str:
        """Get dominant color from image."""
        img = Image.open(BytesIO(input_data))
        img = img.resize((1, 1), Image.LANCZOS)
        pixel = img.getpixel((0, 0))

        if isinstance(pixel, int):
            return f'rgb({pixel}, {pixel}, {pixel})'

        r, g, b = pixel[:3]
        return f'rgb({r}, {g}, {b})'

    def _select_optimal_format(self, img: Image.Image) -> str:
        """Select optimal format based on image."""
        has_alpha = img.mode in ('RGBA', 'LA', 'P')

        if has_alpha:
            return 'webp'

        return 'webp'  # Default to WebP for best compression


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
from typing import Optional

app = FastAPI()
optimizer = ImageOptimizer()


@app.post('/optimize')
async def optimize_image(
    file: UploadFile = File(...),
    quality: int = Form(80),
    format: str = Form('auto'),
    max_width: Optional[int] = Form(None),
    max_height: Optional[int] = Form(None),
):
    """Optimize image."""
    content = await file.read()

    try:
        result = optimizer.optimize(
            content,
            quality=quality,
            format=format,
            max_width=max_width,
            max_height=max_height
        )

        return {
            'original_size': result.original_size,
            'optimized_size': result.optimized_size,
            'savings': result.savings,
            'savings_percent': result.savings_percent,
            'format': result.format,
            'width': result.width,
            'height': result.height
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post('/optimize/download')
async def optimize_and_download(
    file: UploadFile = File(...),
    quality: int = Form(80),
    format: str = Form('webp'),
):
    """Optimize and return image."""
    content = await file.read()

    result = optimizer.optimize(content, quality=quality, format=format)

    return Response(
        content=result.buffer,
        media_type=f'image/{result.format}',
        headers={
            'X-Original-Size': str(result.original_size),
            'X-Optimized-Size': str(result.optimized_size),
            'X-Savings-Percent': str(result.savings_percent)
        }
    )


@app.post('/placeholder')
async def generate_placeholder(
    file: UploadFile = File(...),
    width: int = Form(20),
    blur: int = Form(5),
):
    """Generate blur placeholder."""
    content = await file.read()
    result = optimizer.generate_placeholder(content, width=width, blur=blur)

    return {
        'data_url': result['data_url'],
        'size': len(result['buffer']),
        'width': result['width'],
        'height': result['height']
    }
```

## CLAUDE.md Integration

```markdown
## Media Optimization Commands

### Image Optimization
- "optimize image" - Auto-compress with best format
- "convert to WebP" - Modern format conversion
- "generate responsive images" - Create srcset variants

### Analysis
- "analyze image" - Get optimization recommendations
- "compare formats" - Test different formats
- "check image size" - Get dimensions and file size

### Placeholders
- "generate LQIP" - Low-quality placeholder
- "get dominant color" - Color placeholder
- "create blur placeholder" - Blur-up preview

### Documents
- "optimize PDF" - Compress PDF file
- "merge PDFs" - Combine documents
- "optimize SVG" - Minify vector graphics
```

## AI Suggestions

1. **"Implement AVIF fallback chain"** - Progressive enhancement
2. **"Add WebP detection"** - Client capability detection
3. **"Implement lazy loading"** - Native lazy load support
4. **"Add image CDN integration"** - On-the-fly optimization
5. **"Implement sprite generation"** - CSS sprite sheets
6. **"Add video optimization"** - Compress video files
7. **"Implement content-aware cropping"** - Smart focal points
8. **"Add batch optimization API"** - Bulk processing
9. **"Implement caching layer"** - Cache optimized variants
10. **"Add quality auto-selection"** - SSIM-based quality
