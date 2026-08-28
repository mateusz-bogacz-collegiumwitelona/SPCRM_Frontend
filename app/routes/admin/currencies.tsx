import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Plus,
} from 'lucide-react';

import { api } from '~/api/api';
import type ApiError from '~/interfaces/apiError';
import { getErrorMessage } from '~/utils/error-mapper';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import {
  AddCurrencyDialog,
  type AddCurrencyRequestPayload,
} from '~/components/currency/add-currency-dialog';
import {
  EditCurrencyDialog,
  type EditCurrencyRequestPayload,
} from '~/components/currency/edit-currency-dialog';

interface CurrencyListResponse {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

const columnHelper = createColumnHelper<CurrencyListResponse>();

export default function CurrenciesList() {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<{
    id: string;
    name: string;
    code: string;
    decimalPlace: number;
  } | null>(null);

  const [accumulatedMobileCurrencies, setAccumulatedMobileCurrencies] = useState<
    CurrencyListResponse[]
  >([]);
  const isMobileAppend = useRef(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
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
    queryKey: [
      'currencies-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
      };

      const response = await api.get('/currency', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: AddCurrencyRequestPayload) => {
      await api.post('/currency', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies-list'] });
      queryClient.invalidateQueries({ queryKey: ['currencies-simple'] });
      setIsAddOpen(false);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      alert(
        getErrorMessage(
          apiError.response?.data?.errorCode,
          'Wystąpił błąd podczas dodawania waluty.',
        ),
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: EditCurrencyRequestPayload) => {
      await api.patch('/currency', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies-list'] });
      queryClient.invalidateQueries({ queryKey: ['currencies-simple'] });
      setEditingCurrency(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      alert(
        getErrorMessage(apiError.response?.data?.errorCode, 'Wystąpił błąd podczas edycji waluty.'),
      );
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: 'Kod',
        cell: (info) => (
          <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded text-xs tracking-wider">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Nazwa waluty',
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('decimalPlace', {
        header: 'Miejsca po przecinku',
        cell: (info) => (
          <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Akcje',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEditingCurrency({
                    id: row.currencyId,
                    name: row.name,
                    code: row.code,
                    decimalPlace: row.decimalPlace,
                  })
                }
                className="text-gray-600 hover:text-blue-900 flex items-center gap-1.5 h-8 px-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Edytuj</span>
              </Button>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const desktopCurrencies = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopCurrencies.length;

  useEffect(() => {
    if (!data?.items) return;

    setAccumulatedMobileCurrencies((prev) => {
      if (pageNumber === 1) return data.items;
      if (isMobileAppend.current) {
        const newItems = data.items.filter(
          (newItem: CurrencyListResponse) => !prev.some((p) => p.currencyId === newItem.currencyId),
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
    data: desktopCurrencies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy walut.',
      )
    : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']} redirectTo="/dashboard">
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Słownik walut</h1>
            <Button
              onClick={() => setIsAddOpen(true)}
              className="bg-white text-blue-900 hover:bg-gray-100 font-medium text-xs sm:text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Dodaj walutę
            </Button>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj walutę (kod, nazwa)..."
                className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sortuj po:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="name">Nazwa</option>
                  <option value="code">Kod</option>
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
              <p className="text-gray-500 font-medium">Ładowanie walut...</p>
            </div>
          ) : desktopCurrencies.length === 0 && !isError ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
              <p className="text-gray-500 font-medium">Brak walut do wyświetlenia.</p>
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {accumulatedMobileCurrencies.map((c) => (
                  <div
                    key={c.currencyId}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
                          {c.code}
                        </span>
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCurrency({
                            id: c.currencyId,
                            name: c.name,
                            code: c.code,
                            decimalPlace: c.decimalPlace,
                          })
                        }
                        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edytuj
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
                      Miejsca po przecinku:{' '}
                      <span className="font-medium text-gray-700">{c.decimalPlace}</span>
                    </div>
                  </div>
                ))}

                {pageNumber < totalPages && (
                  <div className="mt-6 flex justify-center pt-2">
                    <Button
                      onClick={handleMobileLoadMore}
                      disabled={isFetching}
                      className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Wczytywanie...
                        </>
                      ) : (
                        'Pokaż więcej'
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
                              className={`border-b border-gray-200 px-6 py-4 text-sm font-semibold text-gray-900 ${
                                header.id === 'actions' ? 'text-right' : 'text-left'
                              }`}
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
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-blue-900 text-gray-700 shadow-sm"
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

          <AddCurrencyDialog
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSave={async (payload) => {
              await addMutation.mutateAsync(payload);
            }}
            isLoading={addMutation.isPending}
          />

          <EditCurrencyDialog
            currency={editingCurrency}
            isOpen={!!editingCurrency}
            onClose={() => setEditingCurrency(null)}
            onSave={async (payload) => {
              await editMutation.mutateAsync(payload);
            }}
            isLoading={editMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
