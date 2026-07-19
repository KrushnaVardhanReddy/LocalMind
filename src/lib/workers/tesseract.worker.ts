import { createWorker } from 'tesseract.js';

interface DocumentWorkerMessage {
  id: string;
  action: string;
  payload?: any;
}

self.onmessage = async (e: MessageEvent<DocumentWorkerMessage>) => {
  const { id, action, payload } = e.data;

  if (action === 'EXTRACT_TEXT_OCR') {
    try {
      const { file, language = 'eng' } = payload;

      let imageUrl: string;

      // Handle both File and ArrayBuffer
      if (file instanceof File) {
        imageUrl = URL.createObjectURL(file);
      } else if (file instanceof ArrayBuffer) {
        const blob = new Blob([file]);
        imageUrl = URL.createObjectURL(blob);
      } else {
         throw new Error("Invalid file type provided for OCR.");
      }

      const worker = await createWorker(language, 1, {
        logger: m => {
           if (m.status === 'recognizing text') {
              self.postMessage({
                id,
                success: true,
                progress: m.progress, // Send back recognition progress
                status: 'recognizing text'
              });
           } else {
             self.postMessage({
                id,
                success: true,
                progress: m.progress, // Send back loading progress
                status: m.status
             });
           }
        }
      });

      const { data: { text, confidence } } = await worker.recognize(imageUrl);

      await worker.terminate();

      URL.revokeObjectURL(imageUrl);

      self.postMessage({
        id,
        success: true,
        data: { text, confidence },
        status: 'completed'
      });

    } catch (error: any) {
      self.postMessage({
        id,
        success: false,
        error: error.message || 'An error occurred during OCR extraction.',
        status: 'error'
      });
    }
  }
};
