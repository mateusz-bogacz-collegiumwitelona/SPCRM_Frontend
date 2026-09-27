import type { PdfFilePayload } from '~/types/pdf';

export function downloadBase64Pdf(payload: PdfFilePayload, fallbackFileName = 'dokument.pdf') {
  if (!payload?.fileContents) {
    throw new Error('Nie udało się pobrać zawartości pliku PDF.');
  }

  const byteCharacters = globalThis.atob(payload.fileContents);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.codePointAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: payload.contentType || 'application/pdf' });

  const fileName = payload.fileName || fallbackFileName;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
