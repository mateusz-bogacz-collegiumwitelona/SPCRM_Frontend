import { useEffect, useMemo, useRef, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Edit2, Plus } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/components/guards/auth-guard';
import { RoleGuard } from '~/components/guards/role-guard';
import { DataTable } from '~/components/table/data-table';
import { mergeById } from '~/utils/table-helpers';
import { AddCurrencyDialog } from '~/components/currency/dialogs/add-currency-dialog';
import { EditCurrencyDialog } from '~/components/currency/dialogs/edit-currency-dialog';
import { ROLES } from '~/constants/roles';
import { useCurrenciesList, useCurrencyMutations } from '~/hooks/use-currencies';
import type { CurrencySimple } from '~/types/currency';
import { useDebounce } from '~/hooks/use-debounce';
import { CurrencyMobileCard } from '~/components/currency/currency-mobile-card';
import { QueryErrorBanner } from '~/components/ui/query-error-banner';

interface CurrencyTableMeta {
  onEdit: (currency: { id: string; name: string; code: string; decimalPlace: number }) => void;
}

const columnHelper = createColumnHelper<CurrencySimple>();

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

export default function CurrenciesList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<{
    id: string;
    name: string;
    code: string;
    decimalPlace: number;
  } | null>(null);

  const [accumulatedMobileCurrencies, setAccumulatedMobileCurrencies] = useState<CurrencySimple[]>(
    [],
  );
  const isMobileAppend = useRef(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

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
  } = useCurrenciesList({
    pageNumber,
    pageSize,
    debouncedSearch,
    sortBy,
    sortDescending,
  });

  const { addMutation, editMutation } = useCurrencyMutations();

  const desktopCurrencies = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopCurrencies.length;

  useEffect(() => {
    const items: CurrencySimple[] = data?.items || [];
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

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.ADMIN]} redirectTo="/dashboard">
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

          <QueryErrorBanner
            error={queryError}
            fallbackMessage="Nie udało się pobrać listy użytkowników."
            className="mb-6"
          />

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
              setIsAddOpen(false);
            }}
            isLoading={addMutation.isPending}
          />

          <EditCurrencyDialog
            currency={editingCurrency}
            isOpen={Boolean(editingCurrency)}
            onClose={() => setEditingCurrency(null)}
            onSave={async (payload) => {
              await editMutation.mutateAsync(payload);
              setEditingCurrency(null);
            }}
            isLoading={editMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
