import saveAs from 'file-saver';

export interface PdfFilePayload {
  fileContents: string;
  fileName?: string;
  contentType?: string;
}

export function downloadBase64Pdf(payload: PdfFilePayload, fallbackFileName = 'dokument.pdf') {
  if (!payload?.fileContents) {
    throw new Error('Nie udało się pobrać zawartości pliku PDF.');
  }

  const byteCharacters = atob(payload.fileContents);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.codePointAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: payload.contentType || 'application/pdf' });
  saveAs(blob, payload.fileName || fallbackFileName);
}
