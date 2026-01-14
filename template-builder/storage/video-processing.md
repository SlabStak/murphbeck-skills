# Video Processing

Production-ready video processing with FFmpeg, transcoding, thumbnails, and streaming preparation.

## Overview

Comprehensive video processing patterns for transcoding, format conversion, thumbnail generation, HLS/DASH streaming, and metadata extraction.

## Quick Start

```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
pip install moviepy ffmpeg-python
```

## TypeScript Implementation

### FFmpeg Video Processor

```typescript
// src/services/video-processor.ts
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as ffprobePath } from '@ffprobe-installer/ffprobe';
import { mkdir, unlink, readdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
  aspectRatio: string;
  audioCodec?: string;
  audioBitrate?: number;
  audioChannels?: number;
  format: string;
  size: number;
}

interface TranscodeOptions {
  format?: string;
  codec?: 'h264' | 'h265' | 'vp9' | 'av1';
  width?: number;
  height?: number;
  bitrate?: string;
  audioBitrate?: string;
  fps?: number;
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  crf?: number;
  startTime?: number;
  duration?: number;
  watermark?: {
    input: string;
    position?: 'center' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
    opacity?: number;
  };
}

interface ThumbnailOptions {
  count?: number;
  width?: number;
  height?: number;
  timestamps?: number[] | string[];
  folder?: string;
  filename?: string;
}

interface HLSOptions {
  segmentDuration?: number;
  qualities?: Array<{
    width: number;
    height: number;
    bitrate: string;
    audioBitrate?: string;
  }>;
  outputDir: string;
}

export class VideoProcessor extends EventEmitter {
  private tempDir: string;

  constructor(tempDir: string = './temp/video') {
    super();
    this.tempDir = tempDir;
  }

  async initialize(): Promise<void> {
    await mkdir(this.tempDir, { recursive: true });
  }

  // Get video metadata
  async getMetadata(input: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err) return reject(err);

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
        const format = metadata.format;

        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        resolve({
          duration: format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          codec: videoStream.codec_name || 'unknown',
          bitrate: parseInt(format.bit_rate || '0'),
          fps: this.parseFps(videoStream.r_frame_rate || '0/1'),
          aspectRatio: videoStream.display_aspect_ratio || 'unknown',
          audioCodec: audioStream?.codec_name,
          audioBitrate: audioStream?.bit_rate ? parseInt(audioStream.bit_rate) : undefined,
          audioChannels: audioStream?.channels,
          format: format.format_name || 'unknown',
          size: format.size || 0,
        });
      });
    });
  }

  // Transcode video
  async transcode(
    input: string,
    output: string,
    options: TranscodeOptions = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(input);

      // Video codec
      if (options.codec) {
        const codecMap: Record<string, string> = {
          h264: 'libx264',
          h265: 'libx265',
          vp9: 'libvpx-vp9',
          av1: 'libaom-av1',
        };
        command = command.videoCodec(codecMap[options.codec] || 'libx264');
      }

      // Resize
      if (options.width || options.height) {
        const scale = options.width && options.height
          ? `${options.width}:${options.height}`
          : options.width
            ? `${options.width}:-2`
            : `-2:${options.height}`;
        command = command.size(scale);
      }

      // Bitrate
      if (options.bitrate) {
        command = command.videoBitrate(options.bitrate);
      }

      // Audio bitrate
      if (options.audioBitrate) {
        command = command.audioBitrate(options.audioBitrate);
      }

      // FPS
      if (options.fps) {
        command = command.fps(options.fps);
      }

      // Preset (for x264/x265)
      if (options.preset) {
        command = command.outputOptions([`-preset ${options.preset}`]);
      }

      // CRF (quality)
      if (options.crf !== undefined) {
        command = command.outputOptions([`-crf ${options.crf}`]);
      }

      // Time range
      if (options.startTime !== undefined) {
        command = command.setStartTime(options.startTime);
      }
      if (options.duration !== undefined) {
        command = command.setDuration(options.duration);
      }

      // Watermark
      if (options.watermark) {
        const positions: Record<string, string> = {
          topleft: '10:10',
          topright: 'W-w-10:10',
          bottomleft: '10:H-h-10',
          bottomright: 'W-w-10:H-h-10',
          center: '(W-w)/2:(H-h)/2',
        };
        const pos = positions[options.watermark.position || 'bottomright'];

        command = command
          .input(options.watermark.input)
          .complexFilter([
            `[1:v]format=rgba,colorchannelmixer=aa=${options.watermark.opacity || 0.5}[watermark]`,
            `[0:v][watermark]overlay=${pos}`,
          ]);
      }

      // Format
      if (options.format) {
        command = command.format(options.format);
      }

      // Progress events
      command
        .on('progress', (progress) => {
          this.emit('progress', {
            percent: progress.percent,
            timemark: progress.timemark,
          });
        })
        .on('end', () => resolve(output))
        .on('error', reject)
        .save(output);
    });
  }

  // Generate thumbnails
  async generateThumbnails(
    input: string,
    options: ThumbnailOptions = {}
  ): Promise<string[]> {
    const folder = options.folder || this.tempDir;
    await mkdir(folder, { recursive: true });

    const baseFilename = options.filename || uuidv4();
    const count = options.count || 1;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(input);

      if (options.width || options.height) {
        const size = options.width && options.height
          ? `${options.width}x${options.height}`
          : options.width
            ? `${options.width}x?`
            : `?x${options.height}`;
        command = command.size(size);
      }

      command
        .on('end', async () => {
          const files = await readdir(folder);
          const thumbnails = files
            .filter((f) => f.startsWith(baseFilename))
            .map((f) => path.join(folder, f))
            .sort();
          resolve(thumbnails);
        })
        .on('error', reject)
        .screenshots({
          count,
          folder,
          filename: `${baseFilename}_%i.png`,
          timestamps: options.timestamps,
        });
    });
  }

  // Generate video thumbnail at specific time
  async getThumbnailAt(
    input: string,
    timestamp: number | string,
    output: string,
    options?: { width?: number; height?: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(input)
        .seekInput(timestamp)
        .frames(1);

      if (options?.width || options?.height) {
        const scale = options.width && options.height
          ? `${options.width}:${options.height}`
          : options.width
            ? `${options.width}:-1`
            : `-1:${options.height}`;
        command = command.size(scale);
      }

      command
        .on('end', () => resolve(output))
        .on('error', reject)
        .save(output);
    });
  }

  // Generate animated GIF preview
  async generateGifPreview(
    input: string,
    output: string,
    options: {
      startTime?: number;
      duration?: number;
      width?: number;
      fps?: number;
    } = {}
  ): Promise<string> {
    const {
      startTime = 0,
      duration = 5,
      width = 320,
      fps = 10,
    } = options;

    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions([
          `-vf fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
        ])
        .on('end', () => resolve(output))
        .on('error', reject)
        .save(output);
    });
  }

  // Generate HLS streaming files
  async generateHLS(input: string, options: HLSOptions): Promise<{
    masterPlaylist: string;
    playlists: string[];
  }> {
    await mkdir(options.outputDir, { recursive: true });

    const qualities = options.qualities || [
      { width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
      { width: 1280, height: 720, bitrate: '2800k', audioBitrate: '128k' },
      { width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
      { width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
    ];

    const segmentDuration = options.segmentDuration || 10;
    const playlists: string[] = [];

    // Generate each quality variant
    for (const quality of qualities) {
      const qualityDir = path.join(
        options.outputDir,
        `${quality.height}p`
      );
      await mkdir(qualityDir, { recursive: true });

      const playlistPath = path.join(qualityDir, 'playlist.m3u8');

      await new Promise<void>((resolve, reject) => {
        ffmpeg(input)
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            `-b:v ${quality.bitrate}`,
            `-b:a ${quality.audioBitrate || '128k'}`,
            `-vf scale=${quality.width}:${quality.height}`,
            '-preset fast',
            '-g 48',
            '-keyint_min 48',
            '-sc_threshold 0',
            '-hls_time ' + segmentDuration,
            '-hls_playlist_type vod',
            '-hls_segment_filename',
            path.join(qualityDir, 'segment_%03d.ts'),
          ])
          .on('end', () => {
            playlists.push(playlistPath);
            resolve();
          })
          .on('error', reject)
          .save(playlistPath);
      });
    }

    // Generate master playlist
    const masterPlaylist = path.join(options.outputDir, 'master.m3u8');
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n';

    for (const quality of qualities) {
      const bandwidth = parseInt(quality.bitrate) * 1000;
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
      masterContent += `${quality.height}p/playlist.m3u8\n`;
    }

    const { writeFile } = await import('fs/promises');
    await writeFile(masterPlaylist, masterContent);

    return {
      masterPlaylist,
      playlists,
    };
  }

  // Extract audio from video
  async extractAudio(
    input: string,
    output: string,
    options?: { format?: string; bitrate?: string }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(input).noVideo();

      if (options?.bitrate) {
        command = command.audioBitrate(options.bitrate);
      }

      command
        .on('end', () => resolve(output))
        .on('error', reject)
        .save(output);
    });
  }

  // Trim video
  async trim(
    input: string,
    output: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    return this.transcode(input, output, {
      startTime,
      duration: endTime - startTime,
    });
  }

  // Concatenate videos
  async concatenate(inputs: string[], output: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      inputs.forEach((input) => {
        command.input(input);
      });

      command
        .on('end', () => resolve(output))
        .on('error', reject)
        .mergeToFile(output, this.tempDir);
    });
  }

  // Compress video
  async compress(
    input: string,
    output: string,
    options?: { targetSize?: number; crf?: number }
  ): Promise<string> {
    const metadata = await this.getMetadata(input);

    // Calculate target bitrate for target size
    let crf = options?.crf || 28;

    if (options?.targetSize) {
      const targetBitrate = Math.floor(
        (options.targetSize * 8) / metadata.duration / 1000
      );
      // Estimate CRF based on target bitrate
      // This is a rough estimation
      if (targetBitrate < 500) crf = 32;
      else if (targetBitrate < 1000) crf = 28;
      else if (targetBitrate < 2000) crf = 24;
      else crf = 20;
    }

    return this.transcode(input, output, {
      codec: 'h264',
      crf,
      preset: 'slow',
    });
  }

  private parseFps(fpsString: string): number {
    const parts = fpsString.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    return parseFloat(fpsString);
  }
}

// Factory function
export function createVideoProcessor(tempDir?: string): VideoProcessor {
  return new VideoProcessor(tempDir);
}
```

### Express Video API

```typescript
// src/routes/video.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createVideoProcessor } from '../services/video-processor';
import path from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const videoProcessor = createVideoProcessor('./temp/video');
const UPLOAD_DIR = './uploads/videos';

const upload = multer({
  storage: multer.diskStorage({
    destination: './temp/uploads',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Initialize
videoProcessor.initialize();
mkdir(UPLOAD_DIR, { recursive: true });

// Get video metadata
router.post('/metadata', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const metadata = await videoProcessor.getMetadata(req.file.path);

    // Cleanup
    await unlink(req.file.path);

    res.json(metadata);
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// Transcode video
router.post('/transcode', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const { width, height, format, codec, bitrate, quality } = req.body;
    const outputFilename = `${uuidv4()}.${format || 'mp4'}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    // Track progress
    videoProcessor.on('progress', (progress) => {
      console.log(`Transcoding progress: ${progress.percent}%`);
    });

    await videoProcessor.transcode(req.file.path, outputPath, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      format: format || 'mp4',
      codec: codec || 'h264',
      bitrate,
      crf: quality ? parseInt(quality) : undefined,
    });

    // Cleanup input
    await unlink(req.file.path);

    const metadata = await videoProcessor.getMetadata(outputPath);

    res.json({
      filename: outputFilename,
      url: `/videos/${outputFilename}`,
      ...metadata,
    });
  } catch (error) {
    console.error('Transcode error:', error);
    res.status(500).json({ error: 'Transcoding failed' });
  }
});

// Generate thumbnails
router.post('/thumbnails', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const { count, width, height } = req.body;
    const thumbnailDir = path.join(UPLOAD_DIR, 'thumbnails');

    const thumbnails = await videoProcessor.generateThumbnails(req.file.path, {
      count: count ? parseInt(count) : 4,
      width: width ? parseInt(width) : 320,
      height: height ? parseInt(height) : undefined,
      folder: thumbnailDir,
    });

    // Cleanup input
    await unlink(req.file.path);

    res.json({
      thumbnails: thumbnails.map((t) => ({
        path: t,
        url: `/videos/thumbnails/${path.basename(t)}`,
      })),
    });
  } catch (error) {
    console.error('Thumbnails error:', error);
    res.status(500).json({ error: 'Thumbnail generation failed' });
  }
});

// Generate GIF preview
router.post('/gif-preview', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const { startTime, duration, width } = req.body;
    const outputFilename = `${uuidv4()}.gif`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    await videoProcessor.generateGifPreview(req.file.path, outputPath, {
      startTime: startTime ? parseFloat(startTime) : 0,
      duration: duration ? parseFloat(duration) : 5,
      width: width ? parseInt(width) : 320,
    });

    // Cleanup input
    await unlink(req.file.path);

    res.json({
      filename: outputFilename,
      url: `/videos/${outputFilename}`,
    });
  } catch (error) {
    console.error('GIF preview error:', error);
    res.status(500).json({ error: 'GIF generation failed' });
  }
});

// Generate HLS streaming
router.post('/hls', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const videoId = uuidv4();
    const outputDir = path.join(UPLOAD_DIR, 'hls', videoId);

    const result = await videoProcessor.generateHLS(req.file.path, {
      outputDir,
      segmentDuration: 10,
    });

    // Cleanup input
    await unlink(req.file.path);

    res.json({
      videoId,
      masterPlaylist: `/videos/hls/${videoId}/master.m3u8`,
      qualities: result.playlists.map((p) => ({
        quality: path.basename(path.dirname(p)),
        playlist: `/videos/hls/${videoId}/${path.basename(path.dirname(p))}/playlist.m3u8`,
      })),
    });
  } catch (error) {
    console.error('HLS error:', error);
    res.status(500).json({ error: 'HLS generation failed' });
  }
});

// Trim video
router.post('/trim', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const { startTime, endTime } = req.body;

    if (startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'startTime and endTime required' });
    }

    const ext = path.extname(req.file.originalname);
    const outputFilename = `${uuidv4()}${ext}`;
    const outputPath = path.join(UPLOAD_DIR, outputFilename);

    await videoProcessor.trim(
      req.file.path,
      outputPath,
      parseFloat(startTime),
      parseFloat(endTime)
    );

    // Cleanup input
    await unlink(req.file.path);

    res.json({
      filename: outputFilename,
      url: `/videos/${outputFilename}`,
    });
  } catch (error) {
    console.error('Trim error:', error);
    res.status(500).json({ error: 'Trimming failed' });
  }
});

// Extract audio
router.post('/extract-audio', upload.single('video'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video provided' });
    }

    const { format, bitrate } = req.body;
    const audioFormat = format || 'mp3';
    const outputFilename = `${uuidv4()}.${audioFormat}`;
    const outputPath = path.join(UPLOAD_DIR, 'audio', outputFilename);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await videoProcessor.extractAudio(req.file.path, outputPath, {
      format: audioFormat,
      bitrate,
    });

    // Cleanup input
    await unlink(req.file.path);

    res.json({
      filename: outputFilename,
      url: `/videos/audio/${outputFilename}`,
    });
  } catch (error) {
    console.error('Audio extraction error:', error);
    res.status(500).json({ error: 'Audio extraction failed' });
  }
});

export default router;
```

## Python Implementation

```python
# video_processing/processor.py
import ffmpeg
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
import subprocess
import json
import uuid
import os


@dataclass
class VideoMetadata:
    duration: float
    width: int
    height: int
    codec: str
    bitrate: int
    fps: float
    audio_codec: Optional[str]
    audio_bitrate: Optional[int]
    format: str
    size: int


@dataclass
class TranscodeOptions:
    width: Optional[int] = None
    height: Optional[int] = None
    codec: str = 'libx264'
    bitrate: Optional[str] = None
    audio_bitrate: Optional[str] = None
    fps: Optional[int] = None
    crf: Optional[int] = None
    preset: str = 'medium'
    start_time: Optional[float] = None
    duration: Optional[float] = None


class VideoProcessor:
    def __init__(self, temp_dir: str = './temp/video'):
        self.temp_dir = Path(temp_dir)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def get_metadata(self, input_path: str) -> VideoMetadata:
        """Get video metadata using ffprobe."""
        probe = ffmpeg.probe(input_path)

        video_stream = next(
            (s for s in probe['streams'] if s['codec_type'] == 'video'),
            None
        )
        audio_stream = next(
            (s for s in probe['streams'] if s['codec_type'] == 'audio'),
            None
        )
        format_info = probe['format']

        if not video_stream:
            raise ValueError('No video stream found')

        # Parse FPS
        fps_parts = video_stream.get('r_frame_rate', '0/1').split('/')
        fps = int(fps_parts[0]) / int(fps_parts[1]) if len(fps_parts) == 2 else 0

        return VideoMetadata(
            duration=float(format_info.get('duration', 0)),
            width=video_stream.get('width', 0),
            height=video_stream.get('height', 0),
            codec=video_stream.get('codec_name', 'unknown'),
            bitrate=int(format_info.get('bit_rate', 0)),
            fps=fps,
            audio_codec=audio_stream.get('codec_name') if audio_stream else None,
            audio_bitrate=int(audio_stream.get('bit_rate', 0)) if audio_stream else None,
            format=format_info.get('format_name', 'unknown'),
            size=int(format_info.get('size', 0))
        )

    def transcode(
        self,
        input_path: str,
        output_path: str,
        options: TranscodeOptions = TranscodeOptions()
    ) -> str:
        """Transcode video with options."""
        stream = ffmpeg.input(input_path)

        # Time range
        if options.start_time is not None:
            stream = ffmpeg.input(input_path, ss=options.start_time)
        if options.duration is not None:
            stream = stream.filter('trim', duration=options.duration)

        # Video processing
        video = stream.video

        # Scale if dimensions specified
        if options.width or options.height:
            w = options.width or -2
            h = options.height or -2
            video = video.filter('scale', w, h)

        # FPS
        if options.fps:
            video = video.filter('fps', fps=options.fps)

        # Audio
        audio = stream.audio

        # Output options
        output_options = {
            'vcodec': options.codec,
            'preset': options.preset,
        }

        if options.bitrate:
            output_options['b:v'] = options.bitrate
        if options.audio_bitrate:
            output_options['b:a'] = options.audio_bitrate
        if options.crf is not None:
            output_options['crf'] = options.crf

        # Run
        output = ffmpeg.output(video, audio, output_path, **output_options)
        ffmpeg.run(output, overwrite_output=True)

        return output_path

    def generate_thumbnails(
        self,
        input_path: str,
        output_dir: str,
        count: int = 4,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> List[str]:
        """Generate thumbnails at equal intervals."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        metadata = self.get_metadata(input_path)
        interval = metadata.duration / (count + 1)

        thumbnails = []
        for i in range(1, count + 1):
            timestamp = interval * i
            filename = f'thumb_{i:03d}.jpg'
            filepath = str(output_path / filename)

            stream = ffmpeg.input(input_path, ss=timestamp)
            stream = stream.filter('scale', width or 320, height or -1)
            stream = ffmpeg.output(stream, filepath, vframes=1)
            ffmpeg.run(stream, overwrite_output=True)

            thumbnails.append(filepath)

        return thumbnails

    def generate_thumbnail_at(
        self,
        input_path: str,
        output_path: str,
        timestamp: float,
        width: Optional[int] = None,
        height: Optional[int] = None
    ) -> str:
        """Generate single thumbnail at specific time."""
        stream = ffmpeg.input(input_path, ss=timestamp)

        if width or height:
            stream = stream.filter('scale', width or -1, height or -1)

        stream = ffmpeg.output(stream, output_path, vframes=1)
        ffmpeg.run(stream, overwrite_output=True)

        return output_path

    def generate_gif_preview(
        self,
        input_path: str,
        output_path: str,
        start_time: float = 0,
        duration: float = 5,
        width: int = 320,
        fps: int = 10
    ) -> str:
        """Generate animated GIF preview."""
        stream = ffmpeg.input(input_path, ss=start_time, t=duration)

        # Apply filters for GIF optimization
        stream = (
            stream
            .filter('fps', fps=fps)
            .filter('scale', width, -1, flags='lanczos')
            .filter('split')
        )

        # Use palettegen and paletteuse for better quality
        # This requires a more complex filter graph
        (
            ffmpeg
            .input(input_path, ss=start_time, t=duration)
            .output(
                output_path,
                vf=f'fps={fps},scale={width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
            )
            .run(overwrite_output=True)
        )

        return output_path

    def generate_hls(
        self,
        input_path: str,
        output_dir: str,
        segment_duration: int = 10,
        qualities: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate HLS streaming files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        if not qualities:
            qualities = [
                {'width': 1920, 'height': 1080, 'bitrate': '5000k', 'audio_bitrate': '192k'},
                {'width': 1280, 'height': 720, 'bitrate': '2800k', 'audio_bitrate': '128k'},
                {'width': 854, 'height': 480, 'bitrate': '1400k', 'audio_bitrate': '128k'},
                {'width': 640, 'height': 360, 'bitrate': '800k', 'audio_bitrate': '96k'},
            ]

        playlists = []

        for quality in qualities:
            quality_dir = output_path / f"{quality['height']}p"
            quality_dir.mkdir(exist_ok=True)

            playlist_path = str(quality_dir / 'playlist.m3u8')
            segment_pattern = str(quality_dir / 'segment_%03d.ts')

            (
                ffmpeg
                .input(input_path)
                .output(
                    playlist_path,
                    vcodec='libx264',
                    acodec='aac',
                    **{
                        'b:v': quality['bitrate'],
                        'b:a': quality.get('audio_bitrate', '128k'),
                        'vf': f"scale={quality['width']}:{quality['height']}",
                        'preset': 'fast',
                        'g': 48,
                        'keyint_min': 48,
                        'sc_threshold': 0,
                        'hls_time': segment_duration,
                        'hls_playlist_type': 'vod',
                        'hls_segment_filename': segment_pattern,
                    }
                )
                .run(overwrite_output=True)
            )

            playlists.append(playlist_path)

        # Generate master playlist
        master_path = str(output_path / 'master.m3u8')
        with open(master_path, 'w') as f:
            f.write('#EXTM3U\n#EXT-X-VERSION:3\n')
            for quality in qualities:
                bandwidth = int(quality['bitrate'].replace('k', '')) * 1000
                f.write(f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={quality['width']}x{quality['height']}\n")
                f.write(f"{quality['height']}p/playlist.m3u8\n")

        return {
            'master_playlist': master_path,
            'playlists': playlists
        }

    def extract_audio(
        self,
        input_path: str,
        output_path: str,
        format: str = 'mp3',
        bitrate: Optional[str] = None
    ) -> str:
        """Extract audio from video."""
        stream = ffmpeg.input(input_path)

        output_options = {'vn': None}  # No video
        if bitrate:
            output_options['b:a'] = bitrate

        stream = ffmpeg.output(stream.audio, output_path, **output_options)
        ffmpeg.run(stream, overwrite_output=True)

        return output_path

    def trim(
        self,
        input_path: str,
        output_path: str,
        start_time: float,
        end_time: float
    ) -> str:
        """Trim video to time range."""
        return self.transcode(
            input_path,
            output_path,
            TranscodeOptions(
                start_time=start_time,
                duration=end_time - start_time
            )
        )

    def compress(
        self,
        input_path: str,
        output_path: str,
        crf: int = 28
    ) -> str:
        """Compress video."""
        return self.transcode(
            input_path,
            output_path,
            TranscodeOptions(crf=crf, preset='slow')
        )


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import aiofiles
import shutil

app = FastAPI()
processor = VideoProcessor()


@app.post('/metadata')
async def get_video_metadata(file: UploadFile = File(...)):
    """Get video metadata."""
    # Save uploaded file temporarily
    temp_path = f'./temp/{uuid.uuid4()}{Path(file.filename).suffix}'

    async with aiofiles.open(temp_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    try:
        metadata = processor.get_metadata(temp_path)
        return metadata.__dict__
    finally:
        os.unlink(temp_path)


@app.post('/transcode')
async def transcode_video(
    file: UploadFile = File(...),
    width: Optional[int] = None,
    height: Optional[int] = None,
    codec: str = 'libx264',
    crf: int = 23,
):
    """Transcode video."""
    input_path = f'./temp/{uuid.uuid4()}{Path(file.filename).suffix}'
    output_path = f'./uploads/videos/{uuid.uuid4()}.mp4'

    # Ensure directories exist
    Path('./temp').mkdir(exist_ok=True)
    Path('./uploads/videos').mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(input_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    try:
        processor.transcode(
            input_path,
            output_path,
            TranscodeOptions(
                width=width,
                height=height,
                codec=codec,
                crf=crf
            )
        )

        metadata = processor.get_metadata(output_path)

        return {
            'path': output_path,
            'url': f'/videos/{Path(output_path).name}',
            **metadata.__dict__
        }
    finally:
        os.unlink(input_path)


@app.post('/thumbnails')
async def generate_thumbnails(
    file: UploadFile = File(...),
    count: int = 4,
    width: int = 320,
):
    """Generate video thumbnails."""
    input_path = f'./temp/{uuid.uuid4()}{Path(file.filename).suffix}'
    output_dir = f'./uploads/thumbnails/{uuid.uuid4()}'

    async with aiofiles.open(input_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    try:
        thumbnails = processor.generate_thumbnails(
            input_path,
            output_dir,
            count=count,
            width=width
        )

        return {
            'thumbnails': [
                {'path': t, 'url': f'/thumbnails/{Path(t).parent.name}/{Path(t).name}'}
                for t in thumbnails
            ]
        }
    finally:
        os.unlink(input_path)
```

## CLAUDE.md Integration

```markdown
## Video Processing Commands

### Transcoding
- "transcode video" - Convert format/codec
- "compress video" - Reduce file size
- "resize video" - Change dimensions

### Thumbnail Generation
- "generate video thumbnails" - Create preview images
- "create GIF preview" - Animated preview
- "extract frame" - Single frame extraction

### Streaming
- "generate HLS" - Create streaming files
- "create DASH manifest" - MPEG-DASH output
- "segment video" - Split into chunks

### Audio Operations
- "extract audio" - Get audio track
- "replace audio" - Swap audio track
- "add background music" - Overlay audio
```

## AI Suggestions

1. **"Implement video watermarking"** - Add dynamic watermarks
2. **"Add subtitle embedding"** - Burn-in or soft subtitles
3. **"Implement scene detection"** - Auto-split at scene changes
4. **"Add video concatenation"** - Merge multiple videos
5. **"Implement adaptive bitrate"** - ABR streaming setup
6. **"Add video stabilization"** - Remove camera shake
7. **"Implement video filters"** - Color correction, effects
8. **"Add thumbnail sprites"** - Video preview sprites
9. **"Implement video analytics"** - Scene/content analysis
10. **"Add DRM protection"** - Encrypted streaming
