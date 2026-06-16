import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowDownWideNarrow, Filter } from 'lucide-react';
import { api } from '~/api/api';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Complete':
      return { label: 'Zakończona', style: 'bg-[#d4edda] text-[#28a745]' };
    case 'InProgress':
      return { label: 'W trakcie', style: 'bg-blue-100 text-[#004a8f]' };
    case 'ToDo':
      return { label: 'Do zrobienia', style: 'bg-yellow-100 text-yellow-800' };
    case 'Cancelled':
      return { label: 'Anulowana', style: 'bg-red-100 text-red-700' };
    default:
      return { label: status, style: 'bg-gray-100 text-gray-600' };
  }
};

const columnHelper = createColumnHelper<any>();
const columns = [
  columnHelper.display({
    id: 'salesman',
    header: 'Sprzedawca',
    cell: (info) => (
      <div className="flex flex-col">
        <span className="text-[#004a8f] font-normal text-sm">
          {info.row.original.salesmanFirstName} {info.row.original.salesmanLastName}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">{info.row.original.name}</span>
      </div>
    ),
  }),
  columnHelper.display({
    id: 'amount',
    header: 'Kwota',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-sm text-gray-600 font-semibold">
          {new Intl.NumberFormat('pl-PL', {
            minimumFractionDigits: row.decimalPlaces,
            maximumFractionDigits: row.decimalPlaces,
          }).format(row.value)}{' '}
          {row.code}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusConfig(info.getValue()).style}`}
      >
        {getStatusConfig(info.getValue()).label}
      </span>
    ),
  }),
  columnHelper.accessor('createdAt', {
    header: 'Data utworzenia',
    cell: (info) => (
      <span className="text-sm text-gray-500">
        {new Date(info.getValue()).toLocaleDateString('pl-PL')}
      </span>
    ),
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: () => (
      <a href="#" className="text-[#004a8f] hover:underline font-medium text-sm">
        Szczegóły
      </a>
    ),
  }),
];

export const SalesSection: React.FC<{ clientId?: string; getDisplayRange: any }> = ({
  clientId,
  getDisplayRange,
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [mobileSales, setMobileSales] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['company-sales', clientId, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/company/sales', {
        params: { companyId: clientId, PageNumber: page, PageSize: pageSize },
      });
      return res.data.data;
    },
    enabled: !!clientId,
  });

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || 0;

  useEffect(() => setPage(1), [search, pageSize]);

  useEffect(() => {
    if (items.length > 0) {
      if (page === 1) setMobileSales(items);
      else
        setMobileSales((prev) => [
          ...prev,
          ...items.filter((item) => !prev.some((p) => p.id === item.id)),
        ]);
    }
  }, [items, page]);

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <>
      {/* MOBILE */}
      <section className="block lg:hidden">
        <h2 className="text-xl text-[#004a8f] font-normal mb-3 mt-6 flex justify-between items-center">
          Sprzedaż: {isLoading && <span className="text-sm text-gray-400">Ładowanie...</span>}
        </h2>
        {mobileSales.length === 0 && !isLoading ? (
          <div className="p-4 text-gray-500 bg-gray-50 rounded-lg text-sm text-center border">
            Brak historii sprzedaży.
          </div>
        ) : (
          <div className="space-y-3">
            {mobileSales.map((s) => (
              <div key={s.id} className="border border-black rounded-lg p-3 bg-white text-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[#004a8f] leading-tight">
                    <p>
                      Kto: {s.salesmanFirstName} {s.salesmanLastName}
                    </p>
                    <p className="font-semibold">
                      Kwota:{' '}
                      {new Intl.NumberFormat('pl-PL', {
                        minimumFractionDigits: s.decimalPlaces,
                      }).format(s.value)}{' '}
                      {s.code}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getStatusConfig(s.status).style}`}
                  >
                    {getStatusConfig(s.status).label}
                  </span>
                </div>
                <div className="border-t border-black pt-2 flex justify-between items-center text-xs">
                  <p>Utworzono: {new Date(s.createdAt).toLocaleDateString('pl-PL')}</p>
                  <a href="#" className="text-[#004a8f] hover:underline">
                    Szczegóły
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {page < totalPages && (
          <button
            className="w-full bg-[#004a8f] text-white py-2.5 rounded-lg mt-3 text-base font-medium"
            onClick={() => setPage((p) => p + 1)}
          >
            Pokaż więcej
          </button>
        )}
      </section>

      {/* DESKTOP */}
      <div className="hidden lg:flex mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <h2 className="text-xl font-normal text-gray-800 w-32">Sprzedaż</h2>
            <input
              type="text"
              placeholder="Wyszukaj sprzedawcę..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="border rounded-md px-3 py-2 text-sm bg-white">
              <option>Data zawarcia</option>
            </select>
            <Button variant="outline" className="px-3">
              <ArrowDownWideNarrow className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtry
            </Button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-6 py-4 text-sm font-semibold">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Pobieranie...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Brak danych.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="p-4 border-t flex items-center justify-between text-xs bg-white rounded-b-lg">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded-md p-1.5"
          >
            <option value={4}>4</option>
            <option value={10}>10</option>
          </select>
          <div className="text-gray-500">{getDisplayRange(page, pageSize, totalItems)}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              Strona {page} z {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
