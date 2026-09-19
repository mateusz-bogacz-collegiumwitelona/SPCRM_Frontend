import React, { useState } from 'react';
import saveAs from 'file-saver';
import { Download, Globe, Loader2, X, AlertCircle } from 'lucide-react';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';

import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface DownloadInvoicePdfDialogProps {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const DownloadInvoicePdfDialog: React.FC<DownloadInvoicePdfDialogProps> = ({
  invoiceId,
  invoiceNumber,
  isOpen,
  onClose,
}) => {
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    if (isLoading) return;
    setLanguage('pl');
    setFormError(null);
    onClose();
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setFormError(null);

    try {
      const response = await api.get(`/invoice/${invoiceId}/pdf`, {
        params: { language },
      });

      const payload = response.data?.value || response.data?.data || response.data;
      const fileContents = payload?.fileContents;

      const fileName =
        payload?.fileName ||
        `${language === 'en' ? 'Invoice' : 'Faktura'}_${invoiceNumber.replaceAll(/[/\\?%*:|"<>]/g, '_')}.pdf`;

      if (!fileContents) throw new Error('Nie udało się pobrać zawartości pliku PDF.');

      const byteCharacters = atob(fileContents);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.codePointAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      saveAs(blob, fileName);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Wystąpił błąd podczas pobierania faktury.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-blue-900 text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-900" />
            Pobierz fakturę VAT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-gray-600">
            Wybierz język, w jakim ma zostać wygenerowany dokument PDF dla faktury{' '}
            <strong className="text-gray-900">{invoiceNumber}</strong>:
          </p>

          <div className="space-y-2">
            <label
              htmlFor="lang-pl"
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                language === 'pl'
                  ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Język polski (PL)</span>
              </div>
              <input
                id="lang-pl"
                type="radio"
                name="pdf-language"
                value="pl"
                checked={language === 'pl'}
                onChange={() => setLanguage('pl')}
                className="text-blue-900 focus:ring-blue-900"
              />
            </label>

            <label
              htmlFor="lang-en"
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                language === 'en'
                  ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Język angielski (EN)</span>
              </div>
              <input
                id="lang-en"
                type="radio"
                name="pdf-language"
                value="en"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="text-blue-900 focus:ring-blue-900"
              />
            </label>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-gray-100 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-300 text-gray-700"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Pobieranie...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Pobierz plik
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
