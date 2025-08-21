// src/lib/pdf2img.ts
export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  // import the ES module entry for pdf.js (legacy build)
  loadPromise = import('pdfjs-dist/legacy/build/pdf.mjs').then((lib) => {
    // worker is served from public/ at runtime
    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    await page.render({ canvasContext: context, viewport }).promise;

    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const originalName = file.name.replace(/\.pdf$/i, '');
          const imageFile = new File([blob], `${originalName}.png`, {
            type: 'image/png',
          });

          resolve({
            imageUrl: URL.createObjectURL(blob),
            file: imageFile,
          });
        } else {
          resolve({
            imageUrl: '',
            file: null,
            error: 'Failed to create image blob',
          });
        }
      }, 'image/png', 1.0);
    });
  } catch (err) {
    return { imageUrl: '', file: null, error: `Failed to convert PDF: ${err}` };
  }
}
