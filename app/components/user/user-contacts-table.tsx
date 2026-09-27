import { useEffect, useMemo, useState } from 'react';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Building2,
  Filter,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { getErrorMessage } from '~/constants/error-mapper';
import type { ApiError, FormErrorState } from '~/types/api-error';
import type { UserContactItem } from '~/types/contact';
import { useUserContacts } from '~/hooks/use-users';
import { CompactTable } from '~/components/table/compact-table';
import { useDebounce } from '~/hooks/use-debounce';

const PAGE_SIZE = 5;

const columnHelper = createColumnHelper<UserContactItem>();

const columns = [
  columnHelper.display({
    id: 'fullName',
    header: 'Osoba kontaktowa',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="leading-tight py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-900 text-sm truncate max-w-47.5 sm:max-w-xs">
              {row.firstName} {row.lastName}
            </span>
            {row.isPrimary && (
              <span title="Główny kontakt" className="inline-flex">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 block truncate max-w-42.5">
            {row.jobTitle || 'Brak stanowiska'}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor('companyName', {
    header: 'Firma',
    cell: (info) => (
      <div className="flex items-center gap-1.5 text-xs text-gray-700 truncate max-w-42.5">
        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="truncate">{info.getValue()}</span>
      </div>
    ),
  }),
];

export const UserContactsTable = ({ userId }: { readonly userId: string }) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('lastname');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [companyNameFilter, setCompanyNameFilter] = useState('');
  const [isPrimaryFilter, setIsPrimaryFilter] = useState<string>('');

  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, companyNameFilter, isPrimaryFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useUserContacts({
    userId,
    pageNumber,
    pageSize: PAGE_SIZE,
    debouncedSearch,
    sortBy,
    sortDescending,
    companyNameFilter,
    isPrimaryFilter,
  });

  const contacts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || contacts.length;

  const table = useReactTable({
    data: contacts,
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
            responseData?.message || activeError?.message || 'Błąd pobierania kontaktów.',
          ),
        }
      : null;

  const isFilterActive = Boolean(companyNameFilter || isPrimaryFilter);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 shrink-0">
          <Users className="w-4 h-4 text-blue-900" />
          <h2 className="text-sm font-semibold text-gray-900">Przypisane kontakty</h2>
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
              placeholder="Szukaj osoby..."
              className="w-full border border-gray-300 rounded-md bg-white pl-8 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="lastname">Nazwisko</option>
              <option value="firstname">Imię</option>
              <option value="companyname">Firma</option>
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
                  <span className="font-semibold text-gray-800">Filtruj kontakty</span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label htmlFor="company-name-filter" className="block text-gray-500 mb-1">
                    Nazwa firmy:
                  </label>
                  <input
                    id="company-name-filter"
                    type="text"
                    value={companyNameFilter}
                    onChange={(e) => setCompanyNameFilter(e.target.value)}
                    placeholder="Wpisz nazwę firmy..."
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label htmlFor="is-primary-filter" className="block text-gray-500 mb-1">
                    Typ kontaktu:
                  </label>
                  <select
                    id="is-primary-filter"
                    value={isPrimaryFilter}
                    onChange={(e) => setIsPrimaryFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="">Wszystkie</option>
                    <option value="true">Tylko główne kontakty</option>
                    <option value="false">Tylko dodatkowe kontakty</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyNameFilter('');
                      setIsPrimaryFilter('');
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

      <CompactTable
        table={table}
        isLoading={isLoading}
        isFetching={isFetching}
        totalItems={totalItems}
        pageNumber={pageNumber}
        totalPages={totalPages}
        onPageChange={setPageNumber}
        emptyMessage="Brak przypisanych kontaktów spełniających kryteria"
        loadingMessage="Wczytywanie kontaktów..."
      />
    </div>
  );
};
