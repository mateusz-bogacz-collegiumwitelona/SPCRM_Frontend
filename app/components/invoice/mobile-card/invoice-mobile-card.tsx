import React from 'react';
import type { InvoiceListResponse } from '~/types/invoice';
import { Link } from 'react-router';
import { formatCurrency } from '~/utils/data-formatters';
import { format } from 'date-fns';
import { cn } from '~/utils/utils';
import { Download } from 'lucide-react';

const renderInvoiceStatusBadge = (item: InvoiceListResponse) => {
  if (item.remainingAmount <= 0) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
        Opłacona
      </span>
    );
  }
  if (item.isOverDue) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        Zaległa
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      W toku
    </span>
  );
};

interface InvoiceMobileCardProps {
  readonly item: InvoiceListResponse;
  readonly onDownloadPdf: (invoice: { id: string; invoiceNumber: string }) => void;
}

export const InvoiceMobileCard = ({ item, onDownloadPdf }: InvoiceMobileCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <Link
          to={`/invoice/${item.id}`}
          className="text-sm font-bold text-blue-900 truncate hover:underline block"
        >
          {item.invoiceNumber}
        </Link>
        <p className="text-xs font-medium text-gray-900 mt-0.5">{item.companyName}</p>
        <p className="text-xs text-gray-500">NIP: {item.companyNip}</p>
      </div>
      <div>{renderInvoiceStatusBadge(item)}</div>
    </div>

    <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
      <span>
        Kwota:{' '}
        <strong className="text-gray-900">
          {formatCurrency(item.totalAmount, item.currencyCode, item.decimalPlaces)}
        </strong>
      </span>
      <span className={item.remainingAmount > 0 ? 'text-amber-700 font-semibold' : 'text-gray-500'}>
        Do spłaty: {formatCurrency(item.remainingAmount, item.currencyCode, item.decimalPlaces)}
      </span>
    </div>

    <div className="border-t border-gray-100 pt-3 mt-2 flex items-center justify-between">
      <span
        className={cn('text-[11px]', item.isOverDue ? 'text-red-600 font-bold' : 'text-gray-500')}
      >
        Termin: {format(new Date(item.dueDate), 'dd.MM.yyyy')}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onDownloadPdf({ id: item.id, invoiceNumber: item.invoiceNumber })}
          className="text-xs font-medium text-gray-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        <Link
          to={`/invoice/${item.id}`}
          className="text-xs font-medium text-blue-900 hover:underline"
        >
          Szczegóły
        </Link>
      </div>
    </div>
  </div>
);
