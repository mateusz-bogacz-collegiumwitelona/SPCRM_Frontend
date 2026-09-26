import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '~/api/user.api';
import type {
  AddUserRequestPayload,
  ChangeUserEmailPayload,
  ChangeUserRolePayload,
  DeleteUserPayload,
  EditUserRequestPayload,
  SetLockoutPayload,
  UserCompaniesParams,
  UserContactsParams,
  UserListParams,
  UserSalesParams,
  UserTasksParams,
} from '~/interfaces/user';

export const userKeys = {
  all: ['users'] as const,
  list: (params: Record<string, unknown>) => [...userKeys.all, 'list', params] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
  simple: () => ['users-simple-list'] as const,
  details: (id?: string) => ['user-detail', id] as const,
  userCompanies: (userId?: string, params?: Record<string, unknown>) =>
    ['user-companies', userId, params] as const,
  userContacts: (userId?: string, params?: Record<string, unknown>) =>
    ['user-contacts', userId, params] as const,
  userSales: (userId?: string, params?: Record<string, unknown>) =>
    ['user-sales', userId, params] as const,
  userTasks: (userId?: string, params?: Record<string, unknown>) =>
    ['user-tasks', userId, params] as const,
};

const parseIsBlockedFilter = (value: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

interface UseUsersListProps {
  pageNumber: number;
  pageSize: number;
  debouncedSearch: string;
  sortBy: string;
  sortDescending: boolean;
  roleFilter: string;
  isBlockedFilter: string;
}

export function useUsersList({
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  roleFilter,
  isBlockedFilter,
}: UseUsersListProps) {
  const queryParams: UserListParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    role: roleFilter,
    isBlocked: parseIsBlockedFilter(isBlockedFilter),
  };

  return useQuery({
    queryKey: userKeys.list(queryParams as unknown as Record<string, unknown>),
    queryFn: () => usersApi.getList(queryParams),
    placeholderData: keepPreviousData,
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: usersApi.getRoles,
    staleTime: Infinity,
  });
}

export function useUserDetails(userId?: string) {
  return useQuery({
    queryKey: userKeys.details(userId),
    queryFn: () => usersApi.getDetails(userId || ''),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useUsersSimpleList(enabled = true) {
  return useQuery({
    queryKey: userKeys.simple(),
    queryFn: usersApi.getSimpleList,
    enabled,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const invalidateUserLists = async () => {
    await queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  const addUserMutation = useMutation({
    mutationFn: (payload: AddUserRequestPayload) => usersApi.create(payload),
    onSuccess: invalidateUserLists,
  });

  const lockoutMutation = useMutation({
    mutationFn: (payload: SetLockoutPayload) => usersApi.lockout(payload),
    onSuccess: invalidateUserLists,
  });

  const unlockMutation = useMutation({
    mutationFn: (userId: string) => usersApi.unlock(userId),
    onSuccess: invalidateUserLists,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (payload: DeleteUserPayload) => usersApi.delete(payload),
    onSuccess: async () => {
      await invalidateUserLists();
      await queryClient.invalidateQueries({ queryKey: userKeys.simple() });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: (payload: EditUserRequestPayload) => usersApi.edit(payload),
    onSuccess: invalidateUserLists,
  });

  const changeEmailMutation = useMutation({
    mutationFn: (payload: ChangeUserEmailPayload) => usersApi.changeEmail(payload),
    onSuccess: invalidateUserLists,
  });

  const changeRoleMutation = useMutation({
    mutationFn: (payload: ChangeUserRolePayload) => usersApi.changeRole(payload),
    onSuccess: invalidateUserLists,
  });

  return {
    addUserMutation,
    lockoutMutation,
    unlockMutation,
    deleteUserMutation,
    editUserMutation,
    changeEmailMutation,
    changeRoleMutation,
  };
}

interface UseUserCompaniesProps {
  userId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
  sortBy: string;
  sortDescending: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export function useUserCompanies({
  userId,
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  createdAtFrom,
  createdAtTo,
}: UseUserCompaniesProps) {
  const queryParams: UserCompaniesParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    createdAtFrom: createdAtFrom ? new Date(createdAtFrom).toISOString() : undefined,
    createdAtTo: createdAtTo ? new Date(createdAtTo).toISOString() : undefined,
  };

  return useQuery({
    queryKey: userKeys.userCompanies(userId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => usersApi.getUserCompanies(userId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });
}

interface UseUserContactsProps {
  userId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
  sortBy: string;
  sortDescending: boolean;
  companyNameFilter?: string;
  isPrimaryFilter?: string;
}

export function useUserContacts({
  userId,
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  companyNameFilter,
  isPrimaryFilter,
}: UseUserContactsProps) {
  const isPrimary =
    isPrimaryFilter === 'true' ? true : isPrimaryFilter === 'false' ? false : undefined;

  const queryParams: UserContactsParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch,
    sortBy,
    sortDescending,
    companyName: companyNameFilter,
    isPrimary,
  };

  return useQuery({
    queryKey: userKeys.userContacts(userId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => usersApi.getUserContacts(userId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });
}

interface UseUserSalesProps {
  userId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
  sortBy: string;
  sortDescending: boolean;
  statusFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useUserSales({
  userId,
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  statusFilter,
  dateFrom,
  dateTo,
}: UseUserSalesProps) {
  const queryParams: UserSalesParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch?.trim() || undefined,
    sortBy,
    sortDescending,
    statusType: statusFilter || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  };

  return useQuery({
    queryKey: userKeys.userSales(userId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => usersApi.getUserSales(userId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });
}

interface UseUserTasksProps {
  userId: string;
  pageNumber: number;
  pageSize: number;
  debouncedSearch?: string;
  sortBy: string;
  sortDescending: boolean;
  statusFilter?: string;
  priorityFilter?: string;
}

export function useUserTasks({
  userId,
  pageNumber,
  pageSize,
  debouncedSearch,
  sortBy,
  sortDescending,
  statusFilter,
  priorityFilter,
}: UseUserTasksProps) {
  const queryParams: UserTasksParams = {
    pageNumber,
    pageSize,
    searchTerm: debouncedSearch?.trim() || undefined,
    sortBy,
    sortDescending,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  };

  return useQuery({
    queryKey: userKeys.userTasks(userId, queryParams as unknown as Record<string, unknown>),
    queryFn: () => usersApi.getUserTasks(userId, queryParams),
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });
}

export function useAdminRecentUsers(pageSize = 5) {
  return useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const res = await usersApi.getList({
        pageNumber: 1,
        pageSize,
        sortBy: 'lastname',
        sortDescending: false,
      });
      return res?.items || [];
    },
  });
}
