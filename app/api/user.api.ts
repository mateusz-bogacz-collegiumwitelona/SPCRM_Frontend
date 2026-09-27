import { api } from '~/api/api';
import type {
  AddUserRequestPayload,
  ChangeUserEmailPayload,
  ChangeUserRolePayload,
  DeleteUserPayload,
  EditUserRequestPayload,
  PaginatedUserCompaniesResponse,
  PaginatedUserContactsResponse,
  PaginatedUserSalesResponse,
  PaginatedUsersResponse,
  PaginatedUserTasksResponse,
  SetLockoutPayload,
  UserCompaniesParams,
  UserContactsParams,
  UserDetailResponse,
  UserListParams,
  UserSalesParams,
  UserSimpleListResponse,
  UserTasksParams,
} from '~/types/user';
import type { TeamUser } from '~/types/deal';

export const usersApi = {
  getList: async (params: UserListParams): Promise<PaginatedUsersResponse> => {
    const response = await api.get('/user', {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        Role: params.role || undefined,
        IsBlocked: params.isBlocked,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getRoles: async (): Promise<string[]> => {
    const response = await api.get('/user/roles');
    return response.data?.data || response.data?.value || response.data || [];
  },

  getDetails: async (userId: string): Promise<UserDetailResponse> => {
    const response = await api.get(`/user/${userId}`);
    return response.data?.value || response.data?.data || response.data;
  },

  getSimpleList: async (): Promise<UserSimpleListResponse[]> => {
    const response = await api.get('/user/simple');
    const list = response.data?.data ?? response.data?.value ?? response.data;
    return Array.isArray(list) ? list : [];
  },

  getUserCompanies: async (
    userId: string,
    params: UserCompaniesParams,
  ): Promise<PaginatedUserCompaniesResponse> => {
    const response = await api.get(`/user/${userId}/companies`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        CreatedAtFrom: params.createdAtFrom,
        CreatedAtTo: params.createdAtTo,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  create: async (payload: AddUserRequestPayload) => {
    const response = await api.post('/user/create', payload);
    return response.data;
  },

  lockout: async (payload: SetLockoutPayload) => {
    const response = await api.post('/user/lockout', payload);
    return response.data;
  },

  unlock: async (userId: string) => {
    const response = await api.post(`/user/${userId}/unlock`);
    return response.data;
  },

  delete: async (payload: DeleteUserPayload) => {
    const response = await api.delete('/user', { data: payload });
    return response.data;
  },

  edit: async (payload: EditUserRequestPayload) => {
    const response = await api.patch('/user', payload);
    return response.data;
  },

  changeEmail: async (payload: ChangeUserEmailPayload) => {
    const response = await api.post('/user/change-email', payload);
    return response.data;
  },

  changeRole: async (payload: ChangeUserRolePayload) => {
    const response = await api.patch('/user/role', payload);
    return response.data;
  },

  getUserContacts: async (
    userId: string,
    params: UserContactsParams,
  ): Promise<PaginatedUserContactsResponse> => {
    const response = await api.get(`/user/${userId}/contacts`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        CompanyName: params.companyName || undefined,
        IsPrimary: params.isPrimary,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getUserSales: async (
    userId: string,
    params: UserSalesParams,
  ): Promise<PaginatedUserSalesResponse> => {
    const response = await api.get(`/user/${userId}/sales`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        StatusType: params.statusType || undefined,
        DateFrom: params.dateFrom,
        DateTo: params.dateTo,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getUserTasks: async (
    userId: string,
    params: UserTasksParams,
  ): Promise<PaginatedUserTasksResponse> => {
    const response = await api.get(`/user/${userId}/tasks`, {
      params: {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SearchTerm: params.searchTerm || undefined,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        Status: params.status || undefined,
        Priority: params.priority || undefined,
      },
    });
    return response.data?.value || response.data?.data || response.data;
  },

  getTeamUsers: async (): Promise<TeamUser[]> => {
    const response = await api.get('/users');
    return response.data?.value || response.data?.data || response.data || [];
  },
};
