# Multimodal AI Template

> Production-ready multimodal AI configurations for vision, audio, and document processing

## Overview

This template provides multimodal AI configurations with:
- Vision-language models
- Image analysis
- Document understanding
- Audio transcription
- Video processing

## Quick Start

```bash
# Install dependencies
pip install openai anthropic google-generativeai
pip install pillow pdf2image pytesseract
pip install openai-whisper

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
export GOOGLE_API_KEY=...
```

## Vision Language Models

```python
# multimodal/vision.py
from openai import OpenAI
from anthropic import Anthropic
import base64
from pathlib import Path
from typing import List, Optional, Union
import httpx


class VisionAnalyzer:
    """Analyze images with LLMs."""

    def __init__(self, provider: str = "openai"):
        self.provider = provider

        if provider == "openai":
            self.client = OpenAI()
        elif provider == "anthropic":
            self.client = Anthropic()
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def encode_image(self, image_path: str) -> tuple[str, str]:
        """Encode image to base64."""
        path = Path(image_path)
        suffix = path.suffix.lower()

        media_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }

        media_type = media_types.get(suffix, "image/jpeg")

        with open(image_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")

        return encoded, media_type

    def encode_image_url(self, url: str) -> tuple[str, str]:
        """Download and encode image from URL."""
        response = httpx.get(url)
        content_type = response.headers.get("content-type", "image/jpeg")
        encoded = base64.b64encode(response.content).decode("utf-8")
        return encoded, content_type

    def analyze_openai(
        self,
        image_source: str,
        prompt: str,
        model: str = "gpt-4o",
        detail: str = "auto",
    ) -> str:
        """Analyze image with OpenAI."""
        if image_source.startswith(("http://", "https://")):
            image_content = {
                "type": "image_url",
                "image_url": {"url": image_source, "detail": detail},
            }
        else:
            encoded, media_type = self.encode_image(image_source)
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{media_type};base64,{encoded}",
                    "detail": detail,
                },
            }

        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        image_content,
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            max_tokens=4096,
        )

        return response.choices[0].message.content

    def analyze_anthropic(
        self,
        image_source: str,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> str:
        """Analyze image with Anthropic."""
        if image_source.startswith(("http://", "https://")):
            encoded, media_type = self.encode_image_url(image_source)
        else:
            encoded, media_type = self.encode_image(image_source)

        response = self.client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": encoded,
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
        )

        return response.content[0].text

    def analyze(
        self,
        image_source: str,
        prompt: str,
        **kwargs,
    ) -> str:
        """Analyze image with configured provider."""
        if self.provider == "openai":
            return self.analyze_openai(image_source, prompt, **kwargs)
        else:
            return self.analyze_anthropic(image_source, prompt, **kwargs)

    def analyze_multiple(
        self,
        images: List[str],
        prompt: str,
        **kwargs,
    ) -> str:
        """Analyze multiple images together."""
        if self.provider == "openai":
            content = []

            for img in images:
                if img.startswith(("http://", "https://")):
                    content.append({
                        "type": "image_url",
                        "image_url": {"url": img},
                    })
                else:
                    encoded, media_type = self.encode_image(img)
                    content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{encoded}",
                        },
                    })

            content.append({"type": "text", "text": prompt})

            response = self.client.chat.completions.create(
                model=kwargs.get("model", "gpt-4o"),
                messages=[{"role": "user", "content": content}],
                max_tokens=4096,
            )

            return response.choices[0].message.content

        else:
            content = []

            for img in images:
                if img.startswith(("http://", "https://")):
                    encoded, media_type = self.encode_image_url(img)
                else:
                    encoded, media_type = self.encode_image(img)

                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": encoded,
                    },
                })

            content.append({"type": "text", "text": prompt})

            response = self.client.messages.create(
                model=kwargs.get("model", "claude-3-5-sonnet-20241022"),
                max_tokens=4096,
                messages=[{"role": "user", "content": content}],
            )

            return response.content[0].text


# Usage
if __name__ == "__main__":
    analyzer = VisionAnalyzer(provider="openai")

    # Analyze single image
    result = analyzer.analyze(
        "photo.jpg",
        "Describe this image in detail.",
    )
    print(result)

    # Analyze from URL
    result = analyzer.analyze(
        "https://example.com/image.jpg",
        "What objects are in this image?",
    )
    print(result)
```

## Document Understanding

```python
# multimodal/documents.py
from openai import OpenAI
import base64
from pathlib import Path
from typing import List, Dict, Any
import io


class DocumentProcessor:
    """Process documents with vision models."""

    def __init__(self):
        self.client = OpenAI()

    def pdf_to_images(self, pdf_path: str, dpi: int = 200) -> List[bytes]:
        """Convert PDF pages to images."""
        from pdf2image import convert_from_path

        images = convert_from_path(pdf_path, dpi=dpi)
        image_bytes = []

        for img in images:
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            image_bytes.append(buffer.getvalue())

        return image_bytes

    def analyze_document(
        self,
        document_path: str,
        prompt: str,
        model: str = "gpt-4o",
    ) -> str:
        """Analyze a document (PDF or image)."""
        path = Path(document_path)

        if path.suffix.lower() == ".pdf":
            images = self.pdf_to_images(document_path)
            return self._analyze_pages(images, prompt, model)
        else:
            with open(document_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode("utf-8")

            return self._analyze_single_image(image_data, prompt, model)

    def _analyze_single_image(
        self,
        image_base64: str,
        prompt: str,
        model: str,
    ) -> str:
        """Analyze a single image."""
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}",
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            max_tokens=4096,
        )

        return response.choices[0].message.content

    def _analyze_pages(
        self,
        pages: List[bytes],
        prompt: str,
        model: str,
    ) -> str:
        """Analyze multiple pages."""
        content = []

        for i, page_bytes in enumerate(pages):
            encoded = base64.b64encode(page_bytes).decode("utf-8")
            content.append({
                "type": "text",
                "text": f"Page {i + 1}:",
            })
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{encoded}",
                },
            })

        content.append({"type": "text", "text": prompt})

        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": content}],
            max_tokens=4096,
        )

        return response.choices[0].message.content

    def extract_text(self, document_path: str) -> str:
        """Extract text from document using OCR."""
        return self.analyze_document(
            document_path,
            "Extract all text from this document. Preserve formatting where possible.",
        )

    def extract_tables(self, document_path: str) -> str:
        """Extract tables from document."""
        return self.analyze_document(
            document_path,
            """Extract all tables from this document.
            Format each table as markdown. Include headers and all data.""",
        )

    def summarize_document(self, document_path: str) -> str:
        """Summarize document content."""
        return self.analyze_document(
            document_path,
            """Provide a comprehensive summary of this document including:
            1. Main topic/purpose
            2. Key points
            3. Important details
            4. Conclusions or recommendations""",
        )

    def extract_structured_data(
        self,
        document_path: str,
        schema: Dict[str, str],
    ) -> Dict[str, Any]:
        """Extract structured data according to schema."""
        import json

        schema_str = json.dumps(schema, indent=2)

        prompt = f"""Extract the following information from this document.
Return the data as valid JSON matching this schema:

{schema_str}

If a field cannot be found, use null."""

        result = self.analyze_document(document_path, prompt)

        try:
            return json.loads(result)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            match = re.search(r'\{.*\}', result, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"raw_response": result}
```

## Audio Transcription

```python
# multimodal/audio.py
from openai import OpenAI
from pathlib import Path
from typing import Optional, List, Dict
import tempfile
import os


class AudioProcessor:
    """Process audio with AI models."""

    def __init__(self):
        self.client = OpenAI()

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None,
        response_format: str = "text",
        timestamp_granularities: List[str] = None,
    ) -> str:
        """Transcribe audio using Whisper."""
        with open(audio_path, "rb") as audio_file:
            kwargs = {
                "model": "whisper-1",
                "file": audio_file,
                "response_format": response_format,
            }

            if language:
                kwargs["language"] = language
            if prompt:
                kwargs["prompt"] = prompt
            if timestamp_granularities:
                kwargs["timestamp_granularities"] = timestamp_granularities

            response = self.client.audio.transcriptions.create(**kwargs)

        if response_format == "text":
            return response
        else:
            return response.model_dump()

    def transcribe_with_timestamps(
        self,
        audio_path: str,
        language: Optional[str] = None,
    ) -> Dict:
        """Transcribe with word-level timestamps."""
        with open(audio_path, "rb") as audio_file:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["word", "segment"],
                language=language,
            )

        return {
            "text": response.text,
            "segments": response.segments,
            "words": response.words if hasattr(response, "words") else None,
            "language": response.language,
            "duration": response.duration,
        }

    def translate(self, audio_path: str) -> str:
        """Translate audio to English."""
        with open(audio_path, "rb") as audio_file:
            response = self.client.audio.translations.create(
                model="whisper-1",
                file=audio_file,
            )

        return response.text

    def generate_speech(
        self,
        text: str,
        voice: str = "alloy",
        model: str = "tts-1",
        output_path: str = None,
    ) -> bytes:
        """Generate speech from text."""
        response = self.client.audio.speech.create(
            model=model,
            voice=voice,
            input=text,
        )

        audio_bytes = response.content

        if output_path:
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

        return audio_bytes

    def transcribe_long_audio(
        self,
        audio_path: str,
        chunk_duration_ms: int = 600000,  # 10 minutes
    ) -> str:
        """Transcribe long audio files by chunking."""
        from pydub import AudioSegment

        audio = AudioSegment.from_file(audio_path)
        chunks = []

        for i in range(0, len(audio), chunk_duration_ms):
            chunk = audio[i:i + chunk_duration_ms]
            chunks.append(chunk)

        transcripts = []

        for i, chunk in enumerate(chunks):
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                chunk.export(f.name, format="mp3")
                transcript = self.transcribe(f.name)
                transcripts.append(transcript)
                os.unlink(f.name)

        return " ".join(transcripts)


# Local Whisper
class LocalWhisperProcessor:
    """Process audio with local Whisper model."""

    def __init__(self, model_size: str = "base"):
        import whisper
        self.model = whisper.load_model(model_size)

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        task: str = "transcribe",
    ) -> Dict:
        """Transcribe audio locally."""
        result = self.model.transcribe(
            audio_path,
            language=language,
            task=task,
        )

        return {
            "text": result["text"],
            "segments": result["segments"],
            "language": result["language"],
        }
```

## Video Processing

```python
# multimodal/video.py
from openai import OpenAI
import cv2
import base64
from pathlib import Path
from typing import List, Dict, Optional
import tempfile


class VideoProcessor:
    """Process video with AI models."""

    def __init__(self):
        self.client = OpenAI()
        self.audio_processor = None

    def extract_frames(
        self,
        video_path: str,
        num_frames: int = 10,
        uniform: bool = True,
    ) -> List[bytes]:
        """Extract frames from video."""
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if uniform:
            indices = [int(i * total_frames / num_frames) for i in range(num_frames)]
        else:
            import random
            indices = sorted(random.sample(range(total_frames), min(num_frames, total_frames)))

        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                _, buffer = cv2.imencode(".jpg", frame)
                frames.append(buffer.tobytes())

        cap.release()
        return frames

    def extract_audio(self, video_path: str) -> str:
        """Extract audio from video."""
        from moviepy.editor import VideoFileClip

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            audio_path = f.name

        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_path)
        video.close()

        return audio_path

    def analyze_video(
        self,
        video_path: str,
        prompt: str,
        num_frames: int = 10,
        include_audio: bool = True,
    ) -> Dict:
        """Analyze video content."""
        # Extract and analyze frames
        frames = self.extract_frames(video_path, num_frames)

        content = []
        for i, frame_bytes in enumerate(frames):
            encoded = base64.b64encode(frame_bytes).decode("utf-8")
            content.append({
                "type": "text",
                "text": f"Frame {i + 1}/{num_frames}:",
            })
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{encoded}",
                },
            })

        content.append({"type": "text", "text": prompt})

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": content}],
            max_tokens=4096,
        )

        visual_analysis = response.choices[0].message.content

        result = {"visual_analysis": visual_analysis}

        # Transcribe audio if requested
        if include_audio:
            if self.audio_processor is None:
                from .audio import AudioProcessor
                self.audio_processor = AudioProcessor()

            audio_path = self.extract_audio(video_path)
            try:
                transcript = self.audio_processor.transcribe(audio_path)
                result["audio_transcript"] = transcript
            finally:
                import os
                os.unlink(audio_path)

        return result

    def summarize_video(self, video_path: str) -> str:
        """Generate video summary."""
        analysis = self.analyze_video(
            video_path,
            """Analyze these video frames and provide:
            1. Overall description of the video content
            2. Key events or scenes
            3. Main subjects or objects
            4. Setting and context""",
        )

        summary = f"Visual Analysis:\n{analysis['visual_analysis']}"

        if "audio_transcript" in analysis:
            summary += f"\n\nAudio Transcript:\n{analysis['audio_transcript']}"

        return summary
```

## CLAUDE.md Integration

```markdown
# Multimodal AI

## Capabilities
- **Vision** - Image analysis and description
- **Documents** - PDF and document understanding
- **Audio** - Transcription and translation
- **Video** - Frame analysis and summarization

## Providers
- OpenAI GPT-4o for vision
- Anthropic Claude for vision
- OpenAI Whisper for audio

## Best Practices
- Use appropriate image sizes
- Chunk long documents
- Handle multiple pages
- Combine vision with audio for video
```

## AI Suggestions

1. **Optimize image sizes** - Reduce tokens
2. **Chunk long documents** - Handle multi-page
3. **Use appropriate detail level** - Balance quality/cost
4. **Cache encoded images** - Reduce processing
5. **Handle errors gracefully** - Unsupported formats
6. **Combine modalities** - Audio + visual
7. **Use local models** - When latency matters
8. **Batch processing** - Multiple images
9. **Extract structured data** - JSON output
10. **Validate file formats** - Pre-processing
