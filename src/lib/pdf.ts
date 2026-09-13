import * as pdfjsLib from 'pdfjs-dist';

export interface ParseResult {
  text: string;
  pages: number;
}

const MAX_TEXT_CHARS = 1_000_000;

/**
 * Extracts text from a PDF entirely in the browser.
 * The worker file is served from /public/pdf.worker.mjs.
 */
export async function parsePdf(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<ParseResult> {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;

  const total = doc.numPages;
  const pages: string[] = [];
  let chars = 0;

  try {
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((it) => ('str' in it ? (it as { str: string }).str : ''))
        .join(' ');

      onProgress?.(i, total);
      page.cleanup();

      chars += line.length;
      if (chars > MAX_TEXT_CHARS) {
        pages.push('… [text truncated after 1M characters]');
        break;
      }
      pages.push(`--- Page ${i} ---\n${line}`);
    }
  } finally {
    await loadingTask.destroy();
  }

  return { text: pages.join('\n\n'), pages: total };
}