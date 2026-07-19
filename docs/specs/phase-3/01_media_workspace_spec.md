# Phase 3: Media Workspace Specification

## 1. Overview
The Media Workspace allows users to process, compress, convert, and transcribe media files (Images, Audio, Video) directly in the browser. It heavily utilizes WASM ports of powerful media engines to eliminate the need for cloud-based rendering or processing.

## 2. Core Features

### 2.1 Media Conversion & Compression
- **Engine**: FFmpeg WASM.
- **Capabilities**: Convert between video/audio formats (e.g., MP4 to WebM, WAV to MP3). Compress video size by adjusting bitrate or resolution. Extract audio from video. Generate thumbnails.

### 2.2 Audio Transcription
- **Engine**: Whisper WASM.
- **Capabilities**: Load an audio or video file and generate a highly accurate text transcript locally.

### 2.3 Image Processing
- **Engine**: magick-wasm (ImageMagick).
- **Capabilities**: Apply advanced filters, crop, composite, and perform batch format conversions (e.g., RAW to JPEG).
- **Metadata Inspection**: Read and optionally strip EXIF data from images and videos.

### 2.4 Barcode & QR Reading
- **Engine**: ZXing WASM.
- **Capabilities**: Decode barcodes and QR codes from uploaded images.

## 3. UI/UX Considerations
- Provide clear visual progress bars, especially for FFmpeg and Whisper tasks, which can take considerable time on lower-end hardware.
- Implement memory limits and warn users before processing files that might exceed browser memory constraints (e.g., > 2GB video files).

## 4. Architecture & Threading
- All WASM engines MUST run in isolated Web Workers to prevent UI freezing.
- Employ SharedArrayBuffer where possible for zero-copy data transfer between the UI and workers for large media files (requires strict COOP/COEP headers).
