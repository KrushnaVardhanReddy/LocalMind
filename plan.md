1. **Initialize NER Worker in UI (`src/routes/docs/+page.svelte`)**
   - Import `WorkerManager`.
   - Add state for storing PII entities and NER processing status.
   - Initialize NER worker alongside Tesseract worker on mount.
2. **Build the Redaction UI (`src/routes/docs/+page.svelte`)**
   - Add a "Scan for PII" button after OCR text extraction is complete.
   - On click, send extracted text to `detectPII()` of NER worker.
   - Overlay highlight boxes on the document preview based on detected entities (match text in OCR words to get bounding boxes).
   - Display a sidebar list of detected entities with confidence, type, and toggle switch to include/exclude for redaction. Disable "Scan for PII" button if PII is already detected.
3. **Apply Redactions via MuPDF (`src/routes/docs/+page.svelte`)**
   - Add an "Apply Redactions" button, enabled after review.
   - On click, map chosen entities to OCR bounding boxes and calculate `RedactionRegion` (convert image percentage coordinate space to PDF points if needed, but the current UI works with raster previews or original images. Need to align coordinate space: `ocrResult.words` bbox).
   - Show confirmation modal warning redactions are permanent.
   - Call `applyRedactions` from `MuPDFWorkerContract` with the `RedactionRegion[]`.
   - Offer download for the redacted PDF.
   - Note: We need to modify `src/routes/docs/+page.svelte` to also use `mupdf` worker if we're working with PDFs, or we can handle PDF redactions specifically by passing original arraybuffer if it's a PDF.
4. **Pre-commit Instructions**
   - Verify code with `pre_commit_instructions` to ensure verification and proper format.
5. **Submit Changes**
   - Final submit with descriptive commit.
