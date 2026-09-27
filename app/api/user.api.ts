import { client } from '~/lib/client';
import type {
  AddUserRequestPayload,
  ChangeUserEmailPayload,
  ChangeUserRolePayload,
  DeleteUserPayload,
  EditUserRequestPayload,
  SetLockoutPayload,
  UserCompaniesParams,
  UserCompanyItem,
  UserContactsParams,
  UserDetailResponse,
  UserListParams,
  UserListResponse,
  UserSalesParams,
  UserSimpleListResponse,
  UserTasksParams,
} from '~/types/user';
import type { TeamUser, UserDealItem } from '~/types/deal';
import type { PaginatedResponse } from '~/types/table';
import type { UserContactItem } from '~/types/contact';
import type { UserTaskItem } from '~/types/task';

export const usersApi = {
  getList: async (params: UserListParams): Promise<PaginatedResponse<UserListResponse>> => {
    const response = await client.get('/user', {
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
    const response = await client.get('/user/roles');
    return response.data?.data || response.data?.value || response.data || [];
  },

  getDetails: async (userId: string): Promise<UserDetailResponse> => {
    const response = await client.get(`/user/${userId}`);
    return response.data?.value || response.data?.data || response.data;
  },

  getSimpleList: async (): Promise<UserSimpleListResponse[]> => {
    const response = await client.get('/user/simple');
    const list = response.data?.data ?? response.data?.value ?? response.data;
    return Array.isArray(list) ? list : [];
  },

  getUserCompanies: async (
    userId: string,
    params: UserCompaniesParams,
  ): Promise<PaginatedResponse<UserCompanyItem>> => {
    const response = await client.get(`/user/${userId}/companies`, {
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
    const response = await client.post('/user/create', payload);
    return response.data;
  },

  lockout: async (payload: SetLockoutPayload) => {
    const response = await client.post('/user/lockout', payload);
    return response.data;
  },

  unlock: async (userId: string) => {
    const response = await client.post(`/user/${userId}/unlock`);
    return response.data;
  },

  delete: async (payload: DeleteUserPayload) => {
    const response = await client.delete('/user', { data: payload });
    return response.data;
  },

  edit: async (payload: EditUserRequestPayload) => {
    const response = await client.patch('/user', payload);
    return response.data;
  },

  changeEmail: async (payload: ChangeUserEmailPayload) => {
    const response = await client.post('/user/change-email', payload);
    return response.data;
  },

  changeRole: async (payload: ChangeUserRolePayload) => {
    const response = await client.patch('/user/role', payload);
    return response.data;
  },

  getUserContacts: async (
    userId: string,
    params: UserContactsParams,
  ): Promise<PaginatedResponse<UserContactItem>> => {
    const response = await client.get(`/user/${userId}/contacts`, {
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
  ): Promise<PaginatedResponse<UserDealItem>> => {
    const response = await client.get(`/user/${userId}/sales`, {
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
  ): Promise<PaginatedResponse<UserTaskItem>> => {
    const response = await client.get(`/user/${userId}/tasks`, {
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
    const response = await client.get('/users');
    return response.data?.value || response.data?.data || response.data || [];
  },
};
