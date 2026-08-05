import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
  type Row,
} from '@tanstack/react-table';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowDownWideNarrow, Filter } from 'lucide-react';
import { api } from '~/api/api';

interface Sale {
  id: string;
  salesmanFirstName: string;
  salesmanLastName: string;
  name: string;
  value: number;
  decimalPlaces: number;
  code: string;
  status: string;
  createdAt: string;
}

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

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  return <span className={`text-xs px-2 py-0.5 rounded-full ${config.style}`}>{config.label}</span>;
};

const SaleCard = ({ s }: { s: Sale }) => (
  <div className="border border-black rounded-lg p-3 bg-white text-sm">
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
      <StatusBadge status={s.status} />
    </div>
    <div className="border-t border-black pt-2 flex justify-between items-center text-xs">
      <p>Utworzono: {new Date(s.createdAt).toLocaleDateString('pl-PL')}</p>
      <button className="text-[#004a8f] hover:underline">Szczegóły</button>
    </div>
  </div>
);

const TableRow = ({ row }: { row: Row<Sale> }) => (
  <tr className="border-b hover:bg-gray-50 transition-colors">
    {row.getVisibleCells().map((cell) => (
      <td key={cell.id} className="px-6 py-4">
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </td>
    ))}
  </tr>
);

const columnHelper = createColumnHelper<Sale>();
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
    cell: (info) => {
      const config = getStatusConfig(info.getValue());
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.style}`}
        >
          {config.label}
        </span>
      );
    },
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
      <button className="text-[#004a8f] hover:underline font-medium text-sm">Szczegóły</button>
    ),
  }),
];

const renderTableBody = (isLoading: boolean, items: Sale[], rows: Row<Sale>[]) => {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={5} className="p-6 text-center text-gray-500">
          Pobieranie...
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="p-6 text-center text-gray-500">
          Brak danych.
        </td>
      </tr>
    );
  }
  return rows.map((row) => <TableRow key={row.id} row={row} />);
};

export const CompanySalesSection: React.FC<{
  clientId?: string;
  getDisplayRange: (page: number, pageSize: number, total: number) => string;
}> = ({ clientId, getDisplayRange }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [mobileSales, setMobileSales] = useState<Sale[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['company-sales', clientId, page, pageSize],
    queryFn: async () => {
      const res = await api.get('/company/sales', {
        params: { companyId: clientId, PageNumber: page, PageSize: pageSize },
      });
      return res.data.data;
    },
    enabled: !!clientId,
    placeholderData: (previousData) => previousData,
  });

  const items: Sale[] = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalCount || 0;

  useEffect(() => {
    setPage(1);
    setMobileSales([]);
  }, [search, pageSize]);

  useEffect(() => {
    if (items.length > 0) {
      setMobileSales((prev) => {
        if (page === 1) return items;
        const newItems = items.filter((item) => !prev.some((p) => p.id === item.id));
        return [...prev, ...newItems];
      });
    }
  }, [items, page]);

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <section className="block xl:hidden">
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
              <SaleCard key={s.id} s={s} />
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

      <div className="hidden xl:flex mb-10 bg-white border border-gray-200 rounded-lg shadow-sm flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-normal text-gray-800">Sprzedaż</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-200">
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
            <tbody>{renderTableBody(isLoading, items, table.getRowModel().rows)}</tbody>
          </table>
        </div>
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
