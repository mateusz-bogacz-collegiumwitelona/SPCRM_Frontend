import type { UserContactItem } from '~/interfaces/contact';
import type { UserDealItem } from '~/interfaces/deal';
import type { UserTaskItem } from '~/interfaces/task';

export interface AddUserRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface ChangeUserEmailPayload {
  userId: string;
  newEmail: string;
}

export interface UserToChangeEmail {
  id: string;
  fullName: string;
}

export interface ChangeUserRolePayload {
  userId: string;
  role: string;
}

export interface UserToChangeRole {
  id: string;
  fullName: string;
  currentRole: string;
}

export interface DeleteUserPayload {
  userId: string;
  reassignToUserId: string;
}

export interface UserSimpleListResponse {
  id: string;
  firstName: string;
  lastName: string;
}

export interface EditUserRequestPayload {
  userId: string;
  firstName?: string;
  lastName?: string;
}

export interface UserToEdit {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SetLockoutPayload {
  userId: string;
  lockoutEnd?: string | null;
}

export interface UserToLockout {
  id: string;
  fullName: string;
  role: string;
}

export interface UserToUnlock {
  id: string;
  fullName: string;
}

export interface UserDetailResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pendingEmail?: string | null;
  isEmailVerified: boolean;
  isLocked: boolean;
  lockoutEndDate?: string | null;
  companyOwnerCount?: number | null;
  contactOwnerCount?: number | null;
  activeDealCount?: number | null;
  activeTaskCount?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserToDelete {
  id: string;
  fullName: string;
  role: string;
}

export interface RoleConfig {
  label: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

export interface UserListResponse {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isBlocked: boolean;
}

export interface UserListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  role?: string;
  isBlocked?: boolean;
}

export interface PaginatedUsersResponse {
  items: UserListResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface UserCompanyItem {
  id: string;
  name: string;
  nip: string;
  city: string;
  street: string;
  createdAt: string;
}

export interface UserCompaniesParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface PaginatedUserCompaniesResponse {
  items: UserCompanyItem[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}

export interface UserContactsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  companyName?: string;
  isPrimary?: boolean;
}

export interface PaginatedUserContactsResponse {
  items: UserContactItem[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}

export interface UserSalesParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  statusType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedUserSalesResponse {
  items: UserDealItem[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}

export interface UserTasksParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  status?: string;
  priority?: string;
}

export interface PaginatedUserTasksResponse {
  items: UserTaskItem[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}
