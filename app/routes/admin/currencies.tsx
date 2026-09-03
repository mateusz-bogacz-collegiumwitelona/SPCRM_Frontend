import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { AlertCircle, ArrowDownWideNarrow, ArrowUpNarrowWide, Edit2, Plus, X } from 'lucide-react';

import { api } from '~/api/api';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import { DataTable } from '~/components/common/data-table';
import { mergeById } from '~/utils/table-helpers';
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

interface CurrencyTableMeta {
  onEdit: (currency: { id: string; name: string; code: string; decimalPlace: number }) => void;
}

const columnHelper = createColumnHelper<CurrencyListResponse>();

const columns = [
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
      const meta = info.table.options.meta as CurrencyTableMeta;

      return (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              meta.onEdit({
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
];

const CurrencyMobileCard = ({
  currency,
  onEdit,
}: {
  readonly currency: CurrencyListResponse;
  readonly onEdit: (currency: {
    id: string;
    name: string;
    code: string;
    decimalPlace: number;
  }) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {currency.code}
        </span>
        <p className="text-sm font-semibold text-gray-900">{currency.name}</p>
      </div>
      <button
        type="button"
        onClick={() =>
          onEdit({
            id: currency.currencyId,
            name: currency.name,
            code: currency.code,
            decimalPlace: currency.decimalPlace,
          })
        }
        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edytuj
      </button>
    </div>
    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
      Miejsca po przecinku:{' '}
      <span className="font-medium text-gray-700">{currency.decimalPlace}</span>
    </div>
  </div>
);

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
      { pageNumber, pageSize, debouncedSearch, sortBy, sortDescending },
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

  const [isErrorDismissed, setIsErrorDismissed] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (payload: AddCurrencyRequestPayload) => {
      await api.post('/currency', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currencies-list'] });
      await queryClient.invalidateQueries({ queryKey: ['currencies-simple'] });
      setIsAddOpen(false);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: EditCurrencyRequestPayload) => {
      await api.patch('/currency', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currencies-list'] });
      await queryClient.invalidateQueries({ queryKey: ['currencies-simple'] });
      setEditingCurrency(null);
    },
  });

  const desktopCurrencies = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopCurrencies.length;

  useEffect(() => {
    const items: CurrencyListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileCurrencies(items);
      return;
    }

    setAccumulatedMobileCurrencies((prev) => mergeById(prev, items, (item) => item.currencyId));
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
    meta: {
      onEdit: (currency) => setEditingCurrency(currency),
    } satisfies CurrencyTableMeta,
  });

  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const listError: FormErrorState | null =
    isError && !isErrorDismissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message || activeError?.message || 'Nie udało się pobrać listy walut.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']} redirectTo="/dashboard">
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Słownik walut</h1>
            <Button
              type="button"
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
                  type="button"
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

          {listError && (
            <div className="mb-6 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{listError.title}</p>
                {listError.details && listError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {listError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsErrorDismissed(true)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileCurrencies}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(item) => item.currencyId}
            renderMobileCard={(item) => (
              <CurrencyMobileCard currency={item} onEdit={setEditingCurrency} />
            )}
            emptyMessage="Brak walut do wyświetlenia."
            loadingMessage="Ładowanie walut..."
            paginationProps={{
              pageNumber,
              pageSize,
              totalPages,
              totalItems,
              isFetching,
              onPageSizeChange: setPageSize,
              onPageChange: handleDesktopPageChange,
            }}
          />

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
            isOpen={Boolean(editingCurrency)}
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
