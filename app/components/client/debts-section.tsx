import React, { useState, useEffect, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '~/components/ui/button';
import { api } from '~/api/api';

// Definiujemy interfejsy zastępujące 'any'
interface Debt {
  id: string;
  invoiceNumber: string;
  amountLeft: number;
  decimalPlaces: number;
  currencyCode: string;
  dueDate: string;
  daysOverdue: number;
}

interface DebtSummary {
  currencyCode: string;
  totalAmount: number;
  decimalPlace: number;
}

const columnHelper = createColumnHelper<Debt>();
const columns = [
  columnHelper.accessor('invoiceNumber', {
    header: 'Numer faktury',
    cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('amountLeft', {
    header: 'Do zapłaty',
    cell: (info) => (
      <span className="font-bold text-red-600">
        {info
          .getValue()
          .toLocaleString('pl-PL', { minimumFractionDigits: info.row.original.decimalPlaces })}{' '}
        {info.row.original.currencyCode}
      </span>
    ),
  }),
  columnHelper.accessor('dueDate', {
    header: 'Termin płatności',
    cell: (info) => (
      <span className="text-gray-500">{new Date(info.getValue()).toLocaleDateString('pl-PL')}</span>
    ),
  }),
  columnHelper.accessor('daysOverdue', {
    header: 'Status opóźnienia',
    cell: (info) =>
      info.getValue() > 0 ? (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          {info.getValue()} dni po terminie
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          W terminie
        </span>
      ),
  }),
];

export const DebtsSection: React.FC<{
  clientId?: string;
  getDisplayRange: (page: number, pageSize: number, totalItems: number) => string;
}> = ({ clientId, getDisplayRange }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mobileDebts, setMobileDebts] = useState<Debt[]>([]);
  const isMobileAppend = useRef(false);

  const { data: summaryResponse, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['company-debt-summary', clientId],
    queryFn: async () => {
      const response = await api.get('/company/debts/summary', {
        params: { CompanyId: clientId },
      });
      return response.data?.data || response.data?.value || [];
    },
    enabled: !!clientId,
  });

  const summary = Array.isArray(summaryResponse) ? summaryResponse : [];

  const { data: debtsRes, isFetching } = useQuery({
    queryKey: ['company-debts', { clientId, page, pageSize }],
    queryFn: async () => {
      const response = await api.get('/company/debts', {
        params: {
          CompanyId: clientId,
          PageNumber: page,
          PageSize: pageSize,
        },
      });
      return response.data?.data || response.data?.value || null;
    },
    enabled: !!clientId,
    placeholderData: keepPreviousData,
  });

  const items = debtsRes?.items || [];
  const totalPages = debtsRes?.totalPages || 1;
  const totalItems = debtsRes?.totalCount || items.length;

  useEffect(() => {
    isMobileAppend.current = false;
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (!debtsRes?.items) return;
    setMobileDebts((prev) => {
      if (page === 1) return debtsRes.items;
      return isMobileAppend.current
        ? [...prev, ...debtsRes.items.filter((n: Debt) => !prev.some((p) => p.id === n.id))]
        : debtsRes.items;
    });
  }, [debtsRes, page]);

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="border-b pb-3">
        <h2 className="text-xl font-normal text-gray-800">Sytuacja finansowa i zadłużenie</h2>
      </div>

      {isSummaryLoading ? (
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      ) : summary.length === 0 ? (
        <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg text-sm font-medium">
          Brak zaległych płatności. Wszystkie faktury tej firmy są opłacone.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((item: DebtSummary) => (
            <div
              key={item.currencyCode}
              className="bg-white p-4 border border-red-200 rounded-lg shadow-sm border-l-4 border-l-red-500"
            >
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Suma zadłużenia ({item.currencyCode})
              </p>
              <p className="text-2xl font-bold text-red-600">
                {item.totalAmount.toLocaleString('pl-PL', {
                  minimumFractionDigits: item.decimalPlace,
                })}{' '}
                {item.currencyCode}
              </p>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* MOBILE */}
          <div className="block lg:hidden space-y-4">
            {mobileDebts.map((debt) => (
              <div
                key={debt.id}
                className="rounded-lg border border-red-100 bg-white p-4 shadow-sm border-t-2 border-t-red-400 text-sm"
              >
                <div className="mb-2 flex justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{debt.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      Termin: {new Date(debt.dueDate).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${debt.daysOverdue > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {debt.daysOverdue > 0 ? `${debt.daysOverdue} dni po terminie` : 'W terminie'}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span className="text-xs text-gray-500">Do zapłaty:</span>
                  <span className="text-red-600">
                    {debt.amountLeft.toLocaleString('pl-PL', {
                      minimumFractionDigits: debt.decimalPlaces,
                    })}{' '}
                    {debt.currencyCode}
                  </span>
                </div>
              </div>
            ))}
            {page < totalPages && (
              <Button
                className="w-full bg-[#004a8f]"
                onClick={() => {
                  isMobileAppend.current = true;
                  setPage((p) => p + 1);
                }}
              >
                Pokaż więcej
              </Button>
            )}
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:flex bg-white border border-gray-200 rounded-lg shadow-sm flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          className="px-6 py-3.5 text-sm font-semibold text-gray-900 uppercase tracking-wider"
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-3.5 text-sm text-gray-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between p-4 text-xs bg-white border-t rounded-b-lg">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border rounded-md p-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <div className="text-gray-500">{getDisplayRange(page, pageSize, totalItems)}</div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => {
                    isMobileAppend.current = false;
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Poprzednia
                </Button>
                <span className="font-medium px-2">
                  {page} z {totalPages}
                </span>
                <Button
                  onClick={() => {
                    isMobileAppend.current = false;
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={page === totalPages || isFetching}
                  variant="outline"
                  size="sm"
                >
                  Następna
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
