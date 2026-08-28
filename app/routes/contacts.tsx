import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Edit2,
  Filter,
  MoreHorizontal,
  Star,
  UserCog,
} from 'lucide-react';

import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/api-error';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MainLayout } from '~/components/layout/main-layout';
import { Link } from 'react-router';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { DataTable } from '~/components/common/data-table';
import { mergeById } from '~/utils/table-helpers';
import {
  EditContactDialog,
  type EditContactRequest,
} from '~/components/contact/edit-contact-dialog';
import { SetCompanyPrimaryContactDialog } from '~/components/companies/set-company-primary-contact-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { ChangeContactOwnerDialog } from '~/components/contact/change-contact-owner-dialog';
import { useAuth } from '~/context/auth-context';

interface ContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  ownerFirstName: string;
  ownerLastName: string;
  isPrimary: boolean;
}

interface OwnerOption {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface ContactListTableMeta {
  onEdit: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onChangeOwner: (id: string) => void;
}

const parseIsPrimaryFilter = (filterValue: string): boolean | undefined => {
  if (filterValue === 'true') return true;
  if (filterValue === 'false') return false;
  return undefined;
};

const columnHelper = createColumnHelper<ContactResponse>();

const columns = [
  columnHelper.display({
    id: 'fullName',
    header: 'Imię i nazwisko',
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-blue-900">
            {row.firstName} {row.lastName}
          </span>
          {row.jobTitle && <span className="text-xs text-gray-500 mt-0.5">{row.jobTitle}</span>}
        </div>
      );
    },
  }),
  columnHelper.accessor('companyName', {
    header: 'Firma',
    cell: (info) => <span className="text-gray-700">{info.getValue()}</span>,
  }),
  columnHelper.display({
    id: 'owner',
    header: 'Opiekun',
    cell: (info) => {
      const row = info.row.original;
      const ownerName = `${row.ownerFirstName || ''} ${row.ownerLastName || ''}`.trim();
      return <span className="text-gray-500">{ownerName || 'Brak'}</span>;
    },
  }),
  columnHelper.accessor('isPrimary', {
    header: 'Główny kontakt',
    cell: (info) => {
      const isPrimary = info.getValue();
      return (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            isPrimary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {isPrimary ? 'Tak' : 'Nie'}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const meta = info.table.options.meta as ContactListTableMeta;
      const isPrimary = info.row.original.isPrimary;

      return (
        <div className="flex items-center justify-start gap-2">
          <Link
            to={`/contact/${info.row.original.id}`}
            className="text-xs font-medium text-blue-900 hover:underline px-2"
          >
            Szczegóły
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-[#004a8f]"
              >
                <span className="sr-only">Otwórz menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-40 bg-white">
              <DropdownMenuItem
                onClick={() => meta.onEdit(info.row.original.id)}
                className="cursor-pointer text-sm text-gray-700 focus:bg-gray-50"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                <span>Edytuj</span>
              </DropdownMenuItem>

              <RoleGuard allowedRoles={['Manager', 'Admin']}>
                <DropdownMenuItem
                  onClick={() => meta.onChangeOwner(info.row.original.id)}
                  className="cursor-pointer text-sm text-gray-700 focus:bg-gray-50"
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Zmień opiekuna</span>
                </DropdownMenuItem>
              </RoleGuard>

              {!isPrimary && (
                <DropdownMenuItem
                  onClick={() => meta.onSetPrimary(info.row.original.id)}
                  className="cursor-pointer text-sm text-gray-700 focus:bg-green-50"
                >
                  <Star className="mr-2 h-4 w-4 text-gray-400" />
                  <span>Ustaw główny</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }),
];

const ContactMobileCard = ({
  contact,
  onEdit,
  onChangeOwner,
  onSetPrimary,
}: {
  readonly contact: ContactResponse;
  readonly onEdit: (id: string) => void;
  readonly onChangeOwner: (id: string) => void;
  readonly onSetPrimary: (id: string) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-start justify-between gap-2">
      <div className="overflow-hidden">
        <p className="text-sm font-bold text-blue-900 truncate">
          {contact.firstName} {contact.lastName}
        </p>
        {contact.jobTitle && (
          <p className="text-xs font-semibold text-gray-600 mb-1 truncate">{contact.jobTitle}</p>
        )}
        <p className="text-xs text-gray-500 mb-1">{contact.companyName}</p>
        <p className="text-sm text-gray-700">
          Opiekun: {contact.ownerFirstName || ''} {contact.ownerLastName || ''}
        </p>
      </div>
      {contact.isPrimary && (
        <span className="flex shrink-0 items-center justify-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Główny
        </span>
      )}
    </div>
    <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-end gap-3">
      <button
        type="button"
        onClick={() => onEdit(contact.id)}
        className="text-xs font-medium text-gray-500 hover:text-[#004a8f] hover:underline"
      >
        Edytuj
      </button>

      <button
        type="button"
        onClick={() => onChangeOwner(contact.id)}
        className="text-xs font-medium text-gray-500 hover:text-[#004a8f] hover:underline"
      >
        Zmień opiekuna
      </button>

      {!contact.isPrimary && (
        <button
          type="button"
          onClick={() => onSetPrimary(contact.id)}
          className="text-xs font-medium text-gray-500 hover:text-green-600 hover:underline"
        >
          Ustaw główny
        </button>
      )}
      <Link
        to={`/contact/${contact.id}`}
        className="text-xs font-medium text-blue-900 hover:underline"
      >
        Szczegóły
      </Link>
    </div>
  </div>
);

export default function ContactList() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [isPrimaryFilter, setIsPrimaryFilter] = useState<string>('');
  const [accumulatedMobileContacts, setAccumulatedMobileContacts] = useState<ContactResponse[]>([]);
  const isMobileAppend = useRef(false);

  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [changingOwnerContactId, setChangingOwnerContactId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const [ownerFilter, setOwnerFilter] = useState<string>('');
  const { user } = useAuth();
  const isManagerOrAdmin = user?.roles.some((r) => ['Manager', 'Admin'].includes(r));

  const editContactMutation = useMutation({
    mutationFn: async (updatedContact: EditContactRequest) => {
      return await api.patch('/contacts/edit', updatedContact);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setEditingContactId(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się zapisać zmian.';
      alert(getErrorMessage(code, fallback));
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return await api.patch(`/contacts/${contactId}/set-primary`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSettingPrimaryId(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się zmienić głównego kontaktu.';
      alert(getErrorMessage(code, fallback));
      setSettingPrimaryId(null);
    },
  });

  const changeOwnerMutation = useMutation({
    mutationFn: async (payload: { contactId: string; newOwnerId: string }) => {
      return await api.patch('/contacts/change-owner', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setChangingOwnerContactId(null);
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (error as Error)?.message || 'Nie udało się zmienić opiekuna.';
      alert(getErrorMessage(code, fallback));
      setChangingOwnerContactId(null);
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 100);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = false;
    setPageNumber(1);
  }, [
    debouncedSearch,
    sortBy,
    sortDescending,
    pageSize,
    companyFilter,
    isPrimaryFilter,
    ownerFilter,
  ]);

  const { data: companiesResponse } = useQuery({
    queryKey: ['contact-companies'],
    queryFn: async () => {
      const response = await api.get('/contacts/companies');
      return response.data?.value || response.data?.data || response.data || [];
    },
  });

  const { data: availableOwners = [] } = useQuery<OwnerOption[]>({
    queryKey: ['available-owners'],
    queryFn: async () => {
      const res = await api.get('/contacts/available-owners');
      return res.data?.data || [];
    },
    enabled: Boolean(isManagerOrAdmin),
  });

  const availableCompanies: string[] = Array.isArray(companiesResponse) ? companiesResponse : [];

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'contacts',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        companyFilter,
        isPrimaryFilter,
        ownerFilter,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        CompanyName: companyFilter || undefined,
        IsPrimary: parseIsPrimaryFilter(isPrimaryFilter),
        OwnerId: ownerFilter === 'me' ? user?.userId : ownerFilter || undefined,
      };
      const response = await api.get('/contacts', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopContacts = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopContacts.length;

  useEffect(() => {
    const items: ContactResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileContacts(items);
      return;
    }

    setAccumulatedMobileContacts((prev) => mergeById(prev, items));
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
    data: desktopContacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onEdit: (id: string) => setEditingContactId(id),
      onSetPrimary: (id: string) => setSettingPrimaryId(id),
      onChangeOwner: (id: string) => setChangingOwnerContactId(id),
    } satisfies ContactListTableMeta,
  });

  const errorMessage = isError
    ? getErrorMessage(
        (queryError as ApiError)?.response?.data?.errorCode,
        'Nie udało się pobrać listy kontaktów.',
      )
    : null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6">
            <h1 className="text-lg lg:text-2xl font-semibold">Kontakty</h1>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full md:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Wyszukaj..."
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
                  <option value="lastName">Nazwisko</option>
                  <option value="firstName">Imię</option>
                  <option value="companyName">Firma</option>
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

                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full sm:w-auto flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtry</span>
                    {(companyFilter || isPrimaryFilter) && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                      </span>
                    )}
                  </Button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj listę</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col">
                          <label
                            htmlFor="contact-company-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Firma
                          </label>
                          <select
                            id="contact-company-filter"
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie firmy</option>
                            {availableCompanies.map((company) => (
                              <option key={company} value={company}>
                                {company}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="contact-primary-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Kontakt główny
                          </label>
                          <select
                            id="contact-primary-filter"
                            value={isPrimaryFilter}
                            onChange={(e) => setIsPrimaryFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszystkie</option>
                            <option value="true">Tylko główne kontakty</option>
                            <option value="false">Tylko dodatkowe</option>
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label
                            htmlFor="contact-owner-filter"
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            Opiekun
                          </label>
                          <select
                            id="contact-owner-filter"
                            value={ownerFilter}
                            onChange={(e) => setOwnerFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                          >
                            <option value="">Wszyscy</option>
                            <option value="me">Tylko moje kontakty</option>

                            {isManagerOrAdmin &&
                              availableOwners.map(
                                (owner) =>
                                  owner.id !== user?.userId && (
                                    <option key={owner.id} value={owner.id}>
                                      {owner.firstName} {owner.lastName}
                                    </option>
                                  ),
                              )}
                          </select>
                        </div>

                        <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyFilter('');
                              setIsPrimaryFilter('');
                              setOwnerFilter('');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-900 underline"
                          >
                            Wyczyść
                          </button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowFilters(false)}
                            className="h-8 px-4 bg-blue-900 text-white hover:bg-blue-800 text-xs"
                          >
                            Zamknij
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          <DataTable
            table={table}
            isLoading={isLoading}
            isError={isError}
            data={accumulatedMobileContacts}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(contact) => contact.id}
            renderMobileCard={(contact) => (
              <ContactMobileCard
                contact={contact}
                onEdit={setEditingContactId}
                onChangeOwner={setChangingOwnerContactId}
                onSetPrimary={setSettingPrimaryId}
              />
            )}
            emptyMessage="Brak wyników do wyświetlenia."
            loadingMessage="Wczytywanie kontaktów..."
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

          <EditContactDialog
            contactId={editingContactId}
            isOpen={Boolean(editingContactId)}
            onClose={() => setEditingContactId(null)}
            onSave={async (editData) => {
              await editContactMutation.mutateAsync(editData);
            }}
            isLoading={editContactMutation.isPending}
          />

          <SetCompanyPrimaryContactDialog
            isOpen={Boolean(settingPrimaryId)}
            onClose={() => setSettingPrimaryId(null)}
            onConfirm={async () => {
              if (settingPrimaryId) {
                await setPrimaryMutation.mutateAsync(settingPrimaryId);
              }
            }}
            isLoading={setPrimaryMutation.isPending}
          />

          <ChangeContactOwnerDialog
            isOpen={Boolean(changingOwnerContactId)}
            onClose={() => setChangingOwnerContactId(null)}
            onSave={async (newOwnerId) => {
              if (changingOwnerContactId) {
                await changeOwnerMutation.mutateAsync({
                  contactId: changingOwnerContactId,
                  newOwnerId,
                });
              }
            }}
            isLoading={changeOwnerMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
