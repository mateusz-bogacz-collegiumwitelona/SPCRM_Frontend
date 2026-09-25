import React, { useState } from 'react';
import { AlertCircle, Calendar, Download, FileText, Loader2, X } from 'lucide-react';
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
import type { AnalyticsPeriod } from '~/components/analytics/revenue-chart';
import { downloadBase64Pdf } from '~/utils/pdf-downloader';

interface DownloadAnalyticsReportDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly endpoint: string;
  readonly title?: string;
  readonly defaultPeriod?: AnalyticsPeriod;
}

export const DownloadAnalyticsReportDialog: React.FC<DownloadAnalyticsReportDialogProps> = ({
  isOpen,
  onClose,
  endpoint,
  title = 'Pobierz raport analityczny PDF',
  defaultPeriod = 'CurrentMonth',
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>(defaultPeriod);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  const handleClose = () => {
    if (isLoading) return;
    setPeriod(defaultPeriod);
    setFormError(null);
    onClose();
  };

  const handleDownload = async () => {
    setIsLoading(true);
    setFormError(null);

    try {
      const response = await api.get(endpoint, {
        params: { Period: period },
      });

      const payload = response.data?.value || response.data?.data || response.data;
      downloadBase64Pdf(payload, `Raport_${period}.pdf`);
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message ||
        apiError.message ||
        'Wystąpił błąd podczas generowania raportu PDF.';

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
            <FileText className="w-5 h-5 text-blue-900" />
            {title}
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
                      <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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
            Wybierz zakres czasu, który ma zostać podsumowany w dokumencie PDF:
          </p>

          <div className="space-y-2">
            <label
              htmlFor="period-month"
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                period === 'CurrentMonth'
                  ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Bieżący miesiąc</span>
              </div>
              <input
                id="period-month"
                type="radio"
                name="report-period"
                value="CurrentMonth"
                checked={period === 'CurrentMonth'}
                onChange={() => setPeriod('CurrentMonth')}
                className="text-blue-900 focus:ring-blue-900"
              />
            </label>

            <label
              htmlFor="period-half-year"
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                period === 'HalfYear'
                  ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Ostatnie pół roku (6 miesięcy)</span>
              </div>
              <input
                id="period-half-year"
                type="radio"
                name="report-period"
                value="HalfYear"
                checked={period === 'HalfYear'}
                onChange={() => setPeriod('HalfYear')}
                className="text-blue-900 focus:ring-blue-900"
              />
            </label>

            <label
              htmlFor="period-year"
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                period === 'CurrentYear'
                  ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">Bieżący rok kalendarzowy</span>
              </div>
              <input
                id="period-year"
                type="radio"
                name="report-period"
                value="CurrentYear"
                checked={period === 'CurrentYear'}
                onChange={() => setPeriod('CurrentYear')}
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
                <Loader2 className="w-4 h-4 animate-spin" /> Generowanie PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Pobierz raport
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
