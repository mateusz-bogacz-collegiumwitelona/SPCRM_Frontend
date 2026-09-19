import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Ban,
  CheckCircle2,
  Filter,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { api } from '~/api/api';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MainLayout } from '~/components/layout/main-layout';
import { Link } from 'react-router';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { DataTable } from '~/components/table/data-table';
import { mergeById } from '~/utils/table-helpers';
import { getRoleConfig } from '~/utils/role-translator';
import { AddUserDialog, type AddUserRequestPayload } from '~/components/user/add-user-dialog';
import {
  LockoutUserDialog,
  type SetLockoutPayload,
  type UserToLockout,
} from '~/components/user/lockout-user-dialog';
import { UnlockUserDialog, type UserToUnlock } from '~/components/user/unlock-user-dialog';
import {
  DeleteUserDialog,
  type DeleteUserPayload,
  type UserToDelete,
} from '~/components/user/delete-user-dialog';
import {
  EditUserDialog,
  type EditUserRequestPayload,
  type UserToEdit,
} from '~/components/user/edit-user-dialog';
import {
  ChangeUserEmailDialog,
  type ChangeUserEmailPayload,
  type UserToChangeEmail,
} from '~/components/user/change-user-email-dialog';
import {
  ChangeUserRoleDialog,
  type ChangeUserRolePayload,
  type UserToChangeRole,
} from '~/components/user/change-user-role-dialog';

interface UserListResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isBlocked: boolean;
}

interface UserTableMeta {
  onLockout: (user: UserToLockout) => void;
  onUnlock: (user: UserToUnlock) => void;
  onDelete: (user: UserToDelete) => void;
  onEdit: (user: UserToEdit) => void;
  onChangeEmail: (user: UserToChangeEmail) => void;
  onChangeRole: (user: UserToChangeRole) => void;
}

const parseIsBlockedFilter = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const columnHelper = createColumnHelper<UserListResponse>();

const columns = [
  columnHelper.display({
    id: 'fullName',
    header: 'Imię i nazwisko',
    cell: (info) => {
      const row = info.row.original;
      return (
        <span className="font-medium text-blue-900">
          {row.firstName} {row.lastName}
        </span>
      );
    },
  }),
  columnHelper.accessor('role', {
    header: 'Rola',
    cell: (info) => {
      const config = getRoleConfig(info.getValue());
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${config.iconColor}`} />
          {config.label}
        </span>
      );
    },
  }),
  (columnHelper.accessor('isBlocked', {
    header: 'Status',
    cell: (info) => {
      const isBlocked = info.getValue();
      return isBlocked ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <Ban className="w-3.5 h-3.5" />
          Zablokowany
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aktywny
        </span>
      );
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Akcje',
    cell: (info) => {
      const user = info.row.original;
      const meta = info.table.options.meta as UserTableMeta;
      const isAdmin = user.role?.toLowerCase() === 'admin';
      const fullName = `${user.firstName} ${user.lastName}`;

      return (
        <div className="flex items-center gap-3">
          <Link
            to={`/user/${user.id}`}
            className="font-medium text-blue-900 hover:underline text-xs"
          >
            Profil
          </Link>

          <button
            type="button"
            onClick={() =>
              meta.onEdit({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
              })
            }
            className="text-xs font-medium text-blue-800 hover:text-blue-950 hover:underline cursor-pointer"
          >
            Edytuj
          </button>

          <button
            type="button"
            onClick={() =>
              meta.onChangeEmail({
                id: user.id,
                fullName,
              })
            }
            className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
          >
            Zmień e-mail
          </button>

          {user.isBlocked ? (
            <button
              type="button"
              onClick={() => meta.onUnlock({ id: user.id, fullName })}
              className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline cursor-pointer"
            >
              Odblokuj
            </button>
          ) : (
            !isAdmin && (
              <button
                type="button"
                onClick={() =>
                  meta.onLockout({
                    id: user.id,
                    fullName,
                    role: user.role,
                  })
                }
                className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                Zablokuj
              </button>
            )
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={() =>
                meta.onDelete({
                  id: user.id,
                  fullName,
                  role: user.role,
                })
              }
              className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer"
            >
              Usuń
            </button>
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={() =>
                meta.onChangeRole({
                  id: user.id,
                  fullName,
                  currentRole: user.role,
                })
              }
              className="text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
            >
              Zmień rolę
            </button>
          )}
        </div>
      );
    },
  })),
];

const UserMobileCard = ({
  user,
  onLockout,
  onUnlock,
  onDelete,
  onEdit,
  onChangeEmail,
  onChangeRole,
}: {
  readonly user: UserListResponse;
  readonly onLockout: (user: UserToLockout) => void;
  readonly onUnlock: (user: UserToUnlock) => void;
  readonly onDelete: (user: UserToDelete) => void;
  readonly onEdit: (user: UserToEdit) => void;
  readonly onChangeEmail: (user: UserToChangeEmail) => void;
  readonly onChangeRole: (user: UserToChangeRole) => void;
}) => {
  const roleConfig = getRoleConfig(user.role);
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-blue-900">{fullName}</p>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${roleConfig.bgColor} ${roleConfig.textColor}`}
            >
              <ShieldCheck className={`w-3 h-3 ${roleConfig.iconColor}`} />
              {roleConfig.label}
            </span>
          </div>
        </div>
        {user.isBlocked ? (
          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
            Zablokowany
          </span>
        ) : (
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0">
            Aktywny
          </span>
        )}
      </div>

      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          {user.isBlocked ? (
            <button
              type="button"
              onClick={() => onUnlock({ id: user.id, fullName })}
              className="text-green-700 font-medium hover:underline cursor-pointer"
            >
              Odblokuj
            </button>
          ) : (
            !isAdmin && (
              <button
                type="button"
                onClick={() =>
                  onLockout({
                    id: user.id,
                    fullName,
                    role: user.role,
                  })
                }
                className="text-amber-700 font-medium hover:underline cursor-pointer"
              >
                Zablokuj
              </button>
            )
          )}

          {!isAdmin && (
            <button
              type="button"
              onClick={() =>
                onDelete({
                  id: user.id,
                  fullName,
                  role: user.role,
                })
              }
              className="text-red-600 font-medium hover:underline cursor-pointer"
            >
              Usuń
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            onEdit({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            })
          }
          className="text-blue-800 font-medium hover:underline cursor-pointer"
        >
          Edytuj
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeEmail({
              id: user.id,
              fullName,
            })
          }
          className="text-slate-700 font-medium hover:underline cursor-pointer"
        >
          Zmień E-mail
        </button>

        {!isAdmin && (
          <button
            type="button"
            onClick={() =>
              onChangeRole({
                id: user.id,
                fullName,
                currentRole: user.role,
              })
            }
            className="text-indigo-700 font-medium hover:underline cursor-pointer"
          >
            Zmień rolę
          </button>
        )}

        <Link to={`/user/${user.id}`} className="font-medium text-blue-900 hover:underline">
          Szczegóły
        </Link>
      </div>
    </div>
  );
};

export default function UserList() {
  const queryClient = useQueryClient();

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('lastname');
  const [sortDescending, setSortDescending] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isBlockedFilter, setIsBlockedFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userToLockout, setUserToLockout] = useState<UserToLockout | null>(null);
  const [accumulatedMobileUsers, setAccumulatedMobileUsers] = useState<UserListResponse[]>([]);
  const isMobileAppend = useRef(false);
  const [userToUnlock, setUserToUnlock] = useState<UserToUnlock | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserToDelete | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserToEdit | null>(null);
  const [userToChangeEmail, setUserToChangeEmail] = useState<UserToChangeEmail | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<UserToChangeRole | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    isMobileAppend.current = true;
    setPageNumber(1);
  }, [debouncedSearch, sortBy, sortDescending, pageSize, roleFilter, isBlockedFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: [
      'users-list',
      {
        pageNumber,
        pageSize,
        debouncedSearch,
        sortBy,
        sortDescending,
        roleFilter,
        isBlockedFilter,
      },
    ],
    queryFn: async () => {
      const params = {
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        SortBy: sortBy,
        SortDescending: sortDescending,
        Role: roleFilter || undefined,
        IsBlocked: parseIsBlockedFilter(isBlockedFilter),
      };
      const response = await api.get('/user', { params });
      return response.data?.value || response.data?.data || response.data;
    },
    placeholderData: keepPreviousData,
  });

  const desktopUsers = useMemo(() => data?.items || [], [data]);
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || data?.totalCount || desktopUsers.length;

  useEffect(() => {
    const items: UserListResponse[] = data?.items;
    if (!items || items.length === 0) return;

    if (pageNumber === 1 || !isMobileAppend.current) {
      setAccumulatedMobileUsers(items);
      return;
    }

    setAccumulatedMobileUsers((prev) => mergeById(prev, items));
  }, [data, pageNumber]);

  const handleMobileLoadMore = () => {
    isMobileAppend.current = true;
    setPageNumber((prev) => prev + 1);
  };

  const handleDesktopPageChange = (newPage: number) => {
    isMobileAppend.current = false;
    setPageNumber(newPage);
  };

  const addUserMutation = useMutation({
    mutationFn: async (payload: AddUserRequestPayload) => {
      return await api.post('/user/create', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setIsAddUserOpen(false);
    },
  });

  const lockoutMutation = useMutation({
    mutationFn: async (payload: SetLockoutPayload) => {
      return await api.post('/user/lockout', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToLockout(null);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await api.post(`/user/${userId}/unlock`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToUnlock(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (payload: DeleteUserPayload) => {
      return await api.delete('/user', { data: payload });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      await queryClient.invalidateQueries({ queryKey: ['users-simple-list'] });
      setUserToDelete(null);
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (payload: EditUserRequestPayload) => {
      return await api.patch('/user', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToEdit(null);
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (payload: ChangeUserEmailPayload) => {
      return await api.post('/user/change-email', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToChangeEmail(null);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async (payload: ChangeUserRolePayload) => {
      return await api.patch('/user/role', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users-list'] });
      setUserToChangeRole(null);
    },
  });

  const table = useReactTable({
    data: desktopUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onLockout: (u: UserToLockout) => setUserToLockout(u),
      onUnlock: (u: UserToUnlock) => setUserToUnlock(u),
      onDelete: (u: UserToDelete) => setUserToDelete(u),
      onEdit: (u: UserToEdit) => setUserToEdit(u),
      onChangeEmail: (u: UserToChangeEmail) => setUserToChangeEmail(u),
      onChangeRole: (u: UserToChangeRole) => setUserToChangeRole(u),
    },
  });

  const [isErrorDimmissed, setIsErrorDismissed] = useState(false);
  const activeError = queryError as ApiError | null;
  const responseData = activeError?.response?.data;

  useEffect(() => {
    if (isError) {
      setIsErrorDismissed(false);
    }
  }, [isError, queryError]);

  const listError: FormErrorState | null =
    isError && !isErrorDimmissed
      ? {
          title: getErrorMessage(
            responseData?.errorCode,
            responseData?.message ||
              activeError?.message ||
              'Nie udało się pobrać listy użytkowników.',
          ),
          details:
            responseData?.errors && responseData.errors.length > 0
              ? responseData.errors
              : undefined,
        }
      : null;

  const isAnyFilterActive = Boolean(roleFilter) || isBlockedFilter !== '';

  const { data: rolesData } = useQuery<string[]>({
    queryKey: ['system-roles'],
    queryFn: async () => {
      const response = await api.get('/user/roles');
      return response.data?.data || response.data?.value || response.data || [];
    },
  });

  const roles = rolesData || [];

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin']}>
        <MainLayout>
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-t-lg shadow-sm mb-4 lg:mb-6 flex justify-between items-center">
            <h1 className="text-lg lg:text-2xl font-semibold">Użytkownicy systemu</h1>
            <Button
              type="button"
              onClick={() => setIsAddUserOpen(true)}
              className="bg-white text-blue-900 hover:bg-blue-50 font-medium flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Dodaj użytkownika</span>
            </Button>
          </div>

          <div className="mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-full lg:w-80 shrink-0">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Szukaj (imię, nazwisko, rola)..."
                className="w-full border border-gray-300 rounded-md bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="text-sm text-gray-500 hidden sm:inline-block shrink-0">
                  Sortuj po:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                >
                  <option value="lastname">Nazwisko</option>
                  <option value="firstname">Imię</option>
                  <option value="role">Rola</option>
                </select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortDescending(!sortDescending)}
                  className="shrink-0 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 px-3"
                  title={sortDescending ? 'Malejąco' : 'Rosnąco'}
                >
                  {sortDescending ? (
                    <ArrowDownWideNarrow className="w-4 h-4" />
                  ) : (
                    <ArrowUpNarrowWide className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="relative shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtry</span>
                  {isAnyFilterActive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-900" />
                    </span>
                  )}
                </Button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-72 max-w-xs bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Filtruj listę</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <label
                          htmlFor="user-role-filter"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Rola
                        </label>
                        <select
                          id="user-role-filter"
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                        >
                          <option value="">Wszystkie role</option>
                          {roles.map((roleName) => {
                            const config = getRoleConfig(roleName);
                            return (
                              <option key={roleName} value={roleName}>
                                {config.label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label
                          htmlFor="user-status-filter"
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Status blokady
                        </label>
                        <select
                          id="user-status-filter"
                          value={isBlockedFilter}
                          onChange={(e) => setIsBlockedFilter(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-900 text-gray-700"
                        >
                          <option value="">Wszystkie stany</option>
                          <option value="false">Tylko aktywni</option>
                          <option value="true">Zablokowani</option>
                        </select>
                      </div>

                      <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRoleFilter('');
                            setIsBlockedFilter('');
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
            data={accumulatedMobileUsers}
            pageNumber={pageNumber}
            totalPages={totalPages}
            isFetching={isFetching}
            onMobileLoadMore={handleMobileLoadMore}
            mobileCardKeyExtractor={(user) => user.id}
            renderMobileCard={(user) => (
              <UserMobileCard
                user={user}
                onLockout={(u) => setUserToLockout(u)}
                onUnlock={(u) => setUserToUnlock(u)}
                onDelete={(u) => setUserToDelete(u)}
                onEdit={(u) => setUserToEdit(u)}
                onChangeEmail={(u) => setUserToChangeEmail(u)}
                onChangeRole={(u) => setUserToChangeRole(u)}
              />
            )}
            emptyMessage="Brak użytkowników spełniających kryteria."
            loadingMessage="Wczytywanie listy użytkowników..."
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

          <AddUserDialog
            isOpen={isAddUserOpen}
            onClose={() => setIsAddUserOpen(false)}
            onSave={async (payload) => {
              await addUserMutation.mutateAsync(payload);
            }}
            isLoading={addUserMutation.isPending}
          />

          <LockoutUserDialog
            user={userToLockout}
            isOpen={Boolean(userToLockout)}
            onClose={() => setUserToLockout(null)}
            onLockout={async (payload) => {
              await lockoutMutation.mutateAsync(payload);
            }}
            isLoading={lockoutMutation.isPending}
          />

          <UnlockUserDialog
            user={userToUnlock}
            isOpen={Boolean(userToUnlock)}
            onClose={() => setUserToUnlock(null)}
            onUnlock={async (userId) => {
              await unlockMutation.mutateAsync(userId);
            }}
            isLoading={unlockMutation.isPending}
          />
          <DeleteUserDialog
            user={userToDelete}
            isOpen={Boolean(userToDelete)}
            onClose={() => setUserToDelete(null)}
            onDelete={async (payload) => {
              await deleteUserMutation.mutateAsync(payload);
            }}
            isLoading={deleteUserMutation.isPending}
          />

          <EditUserDialog
            user={userToEdit}
            isOpen={Boolean(userToEdit)}
            onClose={() => setUserToEdit(null)}
            onSave={async (payload) => {
              await editUserMutation.mutateAsync(payload);
            }}
            isLoading={editUserMutation.isPending}
          />

          <ChangeUserEmailDialog
            user={userToChangeEmail}
            isOpen={Boolean(userToChangeEmail)}
            onClose={() => setUserToChangeEmail(null)}
            onSave={async (payload) => {
              await changeEmailMutation.mutateAsync(payload);
            }}
            isLoading={changeEmailMutation.isPending}
          />

          <ChangeUserRoleDialog
            user={userToChangeRole}
            isOpen={Boolean(userToChangeRole)}
            onClose={() => setUserToChangeRole(null)}
            onSave={async (payload) => {
              await changeRoleMutation.mutateAsync(payload);
            }}
            isLoading={changeRoleMutation.isPending}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
