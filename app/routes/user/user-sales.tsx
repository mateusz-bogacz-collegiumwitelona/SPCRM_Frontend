import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '~/components/ui/button';
import {
  Filter,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavigationBar } from '~/components/navigation-bar';
import { Navbar } from '~/components/unloged-navbar';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

interface UserSalesResponse {
  id: string;
  name: string;
  nip: string;
  status: string;
  closeDate: string;
  value: number;
  decimalPlace: number;
  currency: string;
  companyName: string;
}

const getStatusConfig = (rawStatus: string) => {
  const status = (rawStatus || '').toLowerCase();
  if (status.includes('trakcie') || status.includes('progress') || status.includes('w_trakcie')) {
    return { label: 'W trakcie', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  }
  if (status.includes('zakończ') || status.includes('complet')) {
    return { label: 'Zakończona', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
  }
  if (status.includes('oczek') || status.includes('pend')) {
    return { label: 'Oczekująca', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' };
  }
  return { label: rawStatus || 'Nieznany', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
};

const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const columnHelper = createColumnHelper<UserSalesResponse>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Nazwa',
    cell: (info) => <span className="font-medium text-blue-900">{info.getValue()}</span>,
  }),
  columnHelper.accessor('companyName', {
    header: 'Firma',
  }),
  columnHelper.accessor('nip', {
    header: 'NIP',
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor('value', {
    header: 'Kwota',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-medium text-gray-900">
          {row.value.toLocaleString('pl-PL', { minimumFractionDigits: row.decimalPlace })}{' '}
          {row.currency}
        </span>
      );
    },
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = getStatusConfig(info.getValue());
      return (
        <span
          className={`inline-flex items-center rounded-full ${status.bgColor} px-3 py-1 text-xs font-medium ${status.textColor}`}
        >
          {status.label}
        </span>
      );
    },
  }),
  columnHelper.accessor('closeDate', {
    header: 'Zakończenie',
    cell: (info) => <span className="text-gray-500">{formatDate(info.getValue())}</span>,
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: () => (
      <a href="#" className="font-medium text-blue-900 hover:underline">
        Szczegóły
      </a>
    ),
  }),
];

export default function UserSales() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  const [accumulatedMobileSales, setAccumulatedMobileSales] = useState<UserSalesResponse[]>([]);

  const isMobileAppend = useRef(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['sales', { pageNumber, pageSize, debouncedSearch, sortBy, sortDescending }],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch,
        SortBy: sortBy,
        SortDescending: sortDescending,
      };
      const response = await api.get('/sales', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopSales = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopSales.length;

  useEffect(() => {
    if (!data?.items) return;

    setAccumulatedMobileSales((prev) => {
      if (pageNumber === 1) return data.items;

      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: UserSalesResponse) => !prev.some((p) => p.id === newItem.id),
        );
        return [...prev, ...newItems];
      }

      return data.items;
    });
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };
  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };
  const table = useReactTable({
    data: desktopSales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy sprzedaży.',
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pl-20 pb-24 md:pb-0">
      <Navbar />
      <NavigationBar
        desktopClassName="top-20 border-r border-[#004a8f]/10 bg-[#004a8f]"
        spacerClassName="hidden"
        desktopWidthClassName="w-20"
      />

      <main className="mx-auto w-full max-w-400 p-4 lg:p-8">
        <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6">
          <h1 className="text-lg lg:text-2xl font-semibold">Sprzedaż</h1>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-full md:w-80 shrink-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Wyszukaj (Nazwa, Firma, NIP)..."
              className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500 hidden sm:block">Sortuj po:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 focus:border-blue-900 text-gray-700"
              >
                <option value="date">Data zawarcia</option>
                <option value="company">Firma</option>
                <option value="value">Kwota</option>
                <option value="name">Nazwa</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setSortDescending(!sortDescending)}
                className="shrink-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-3"
              >
                {sortDescending ? (
                  <ArrowDownWideNarrow className="w-4 h-4" />
                ) : (
                  <ArrowUpNarrowWide className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filtry</span>
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-900 mb-4" />
            <p className="text-gray-500 font-medium">Wczytywanie sprzedaży...</p>
          </div>
        ) : (!desktopSales || desktopSales.length === 0) && !isError ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-500 font-medium">Brak wyników do wyświetlenia.</p>
          </div>
        ) : (
          <>
            <div className="block lg:hidden space-y-4">
              {accumulatedMobileSales.map((item) => {
                const status = getStatusConfig(item.status);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-blue-900 truncate">
                          {item.companyName}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">NIP: {item.nip}</p>
                        <p className="text-sm font-medium text-gray-700">
                          {item.value.toLocaleString('pl-PL', {
                            minimumFractionDigits: item.decimalPlace,
                          })}{' '}
                          {item.currency}
                        </p>
                      </div>
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-full ${status.bgColor} px-3 py-1 text-xs font-medium ${status.textColor}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Zakończenie: {formatDate(item.closeDate)}
                      </p>
                      <p className="text-xs font-medium text-gray-900 truncate max-w-30">
                        {item.name}
                      </p>
                    </div>
                  </div>
                );
              })}

              {pageNumber < totalPages && (
                <div className="mt-6 flex justify-center pt-2">
                  <Button
                    onClick={handleMobileLoadMore}
                    disabled={isFetching}
                    className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Wczytywanie danych...
                      </>
                    ) : (
                      'Pokaż więcej wyników'
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden lg:block space-y-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="border-b border-gray-200 px-6 py-4 text-left text-sm font-semibold text-gray-900"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-6 py-4 text-sm text-gray-700">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Pozycji na stronie:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 focus:border-blue-900 text-gray-700 shadow-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="text-sm text-gray-500">
                  Wyświetlanie {Math.min((pageNumber - 1) * pageSize + 1, totalItems)} do{' '}
                  {Math.min(pageNumber * pageSize, totalItems)} z {totalItems} wyników
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleDesktopPageChange(Math.max(pageNumber - 1, 1))}
                    disabled={pageNumber === 1 || isFetching}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-sm font-medium text-gray-700 px-2">
                    Strona {pageNumber} z {totalPages}
                  </span>

                  <Button
                    onClick={() => handleDesktopPageChange(Math.min(pageNumber + 1, totalPages))}
                    disabled={pageNumber === totalPages || isFetching}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-blue-900 border-gray-300 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
