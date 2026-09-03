import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Globe, Loader2, Mail, Send, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

interface ResendOfferEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (language: string) => Promise<void>;
  isLoading: boolean;
  offerName?: string;
  recipientEmail?: string;
  recipientName?: string;
}

// Komponenty wektorowych flag
const PolandFlag = () => (
  <svg
    className="w-6 h-4 rounded-xs shadow-xs border border-gray-200 overflow-hidden"
    viewBox="0 0 640 480"
  >
    <g fillRule="evenodd">
      <path fill="#fff" d="M640 480H0V0h640z" />
      <path fill="#dc143c" d="M640 480H0V240h640z" />
    </g>
  </svg>
);

const UkFlag = () => (
  <svg
    className="w-6 h-4 rounded-xs shadow-xs border border-gray-200 overflow-hidden"
    viewBox="0 0 640 480"
  >
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path
      fill="#FFF"
      d="m75 0 244 181L562 0h78v62L400 240l240 178v62h-80L320 301 81 480H0v-60l239-180L0 63V0h75z"
    />
    <path
      fill="#C8102E"
      d="m424 288 216 162v30h-40L384 318zm-208 0L0 450v30h40l216-162zM0 0l216 162h40L40 0zm640 0L424 162h-40L600 0z"
    />
    <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z" />
    <path fill="#C8102E" d="M272 0h96v480h-96zM0 192h640v96H0z" />
  </svg>
);

const LANGUAGES = [
  { code: 'pl', label: 'Polski (PL)', FlagComponent: PolandFlag },
  { code: 'en', label: 'Angielski (EN)', FlagComponent: UkFlag },
];

export const ResendOfferEmailDialog: React.FC<ResendOfferEmailDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  offerName,
  recipientEmail,
  recipientName,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pl');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      setFormError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      setFormError(null);
      await onConfirm(selectedLanguage);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const code = responseData?.errorCode;
      const fallback =
        responseData?.message ||
        apiError.message ||
        'Wystąpił błąd podczas kolejkowania wysyłki wiadomości e-mail.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-115">
        <DialogHeader className="border-b border-gray-100 pb-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#004a8f] flex items-center justify-center mt-2">
            <Mail className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-normal text-gray-900 text-center">
            Ponowna wysyłka oferty
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            Zamierzasz ponownie przesłać ofertę {offerName ? <strong>„{offerName}”</strong> : ''}.
          </p>

          {recipientEmail && (
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-3 text-xs flex flex-col gap-1">
              <span className="text-gray-500 font-medium">Odbiorca:</span>
              <span className="font-semibold text-gray-900">
                {recipientName ? `${recipientName} ` : ''}({recipientEmail})
              </span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-500" />
              Język szablonu wiadomości
            </label>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                const Flag = lang.FlagComponent;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center justify-center gap-2.5 p-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#004a8f] bg-blue-50/60 text-[#004a8f] ring-1 ring-[#004a8f]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Flag />
                    <span className="font-semibold">{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
        </div>

        <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-[#004a8f] hover:bg-[#003870] text-white flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Wyślij e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
