import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Search,
  Loader2,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';

export interface UserCompanyItem {
  id: string;
  name: string;
  nip: string;
  city: string;
  street: string;
  createdAt: string;
}

const PAGE_SIZE = 5;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd.MM.yyyy', { locale: pl });
};

const columnHelper = createColumnHelper<UserCompanyItem>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Firma',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="leading-tight py-0.5">
          <p className="font-semibold text-blue-900 text-sm truncate max-w-47.5 sm:max-w-xs">
            {row.name}
          </p>
          <span className="text-[11px] text-gray-500">NIP: {row.nip}</span>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'address',
    header: 'Lokalizacja',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="text-xs text-gray-600 truncate block max-w-42.5">
          {row.city}, {row.street}
        </span>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Dodano',
    cell: (info) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(info.getValue())}</span>
    ),
  }),
];

export const UserCompaniesTable = ({ userId }: { readonly userId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [createdAtFrom, setCreatedAtFrom] = useState<string>('');
  const [createdAtTo, setCreatedAtTo] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, createdAtFrom, createdAtTo]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'user-companies',
      userId,
      { pageNumber, debouncedSearch, sortBy, sortDescending, createdAtFrom, createdAtTo },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: PAGE_SIZE,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        CreatedAtFrom: createdAtFrom ? new Date(createdAtFrom).toISOString() : undefined,
        CreatedAtTo: createdAtTo ? new Date(createdAtTo).toISOString() : undefined,
      };

      const response = await api.get(`/user/${userId}/companies`, { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });

  const companies = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || companies.length;

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const formError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Błąd pobierania firm.',
          ),
        }
      : null;

  const isFilterActive = Boolean(createdAtFrom || createdAtTo);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <Building2 className="w-4 h-4 text-blue-900" />
          <h2 className="text-sm font-semibold text-gray-900">Przypisane firmy</h2>
          <span className="text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-medium">
            {totalItems}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj firmy..."
              className="w-full border border-gray-300 rounded-md bg-white pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="name">Nazwa</option>
              <option value="nip">NIP</option>
              <option value="city">Miasto</option>
              <option value="createdat">Data</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSortDescending(!sortDescending)}
              className="h-7 w-7 border-gray-300 text-gray-600 hover:bg-gray-100"
              title={sortDescending ? 'Malejąco' : 'Rosnąco'}
            >
              {sortDescending ? (
                <ArrowDownWideNarrow className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpNarrowWide className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-7 px-2.5 flex items-center gap-1.5 border-gray-300 text-gray-700 text-xs hover:bg-gray-100"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtry</span>
              {isFilterActive && <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />}
            </Button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                  <span className="font-semibold text-gray-800">Filtruj po dacie dodania</span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Od daty:</label>
                  <input
                    type="date"
                    value={createdAtFrom}
                    onChange={(e) => setCreatedAtFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Do daty:</label>
                  <input
                    type="date"
                    value={createdAtTo}
                    onChange={(e) => setCreatedAtTo(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedAtFrom('');
                      setCreatedAtTo('');
                    }}
                    className="text-gray-500 hover:text-gray-800 underline"
                  >
                    Wyczyść
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-6 px-3 bg-blue-900 text-white text-[11px]"
                  >
                    Gotowe
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="m-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{formError.title}</span>
          </div>
          <button type="button" onClick={() => setIsErrorDismissed(true)}>
            <X className="w-3.5 h-3.5 text-red-400 hover:text-red-700" />
          </button>
        </div>
      )}

      <div className="relative min-h-63.75 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-900 mb-2" />
            <p className="text-xs text-gray-400">Wczytywanie firm...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-xs text-gray-400 py-12">
            Brak przypisanych firm spełniających kryteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-400 bg-gray-50/40">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2 font-medium">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between text-xs text-gray-500 mt-auto">
          <span>
            Strona {pageNumber} z {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber === 1 || isFetching}
              className="h-7 w-7 border-gray-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
              disabled={pageNumber >= totalPages || isFetching}
              className="h-7 w-7 border-gray-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
