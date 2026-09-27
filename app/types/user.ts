import type { BasePaginationParams } from '~/types/table';

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

export interface ChangeUserRolePayload {
  userId: string;
  role: string;
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

export interface UserListParams extends BasePaginationParams {
  role?: string;
  isBlocked?: boolean;
}

export interface UserCompanyItem {
  id: string;
  name: string;
  nip: string;
  city: string;
  street: string;
  createdAt: string;
}

export interface UserCompaniesParams extends BasePaginationParams {
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface UserContactsParams extends BasePaginationParams {
  companyName?: string;
  isPrimary?: boolean;
}

export interface UserSalesParams extends BasePaginationParams {
  statusType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserTasksParams extends BasePaginationParams {
  status?: string;
  priority?: string;
}

export interface UserBaseActionData {
  id: string;
  fullName: string;
}

export interface UserRoleActionData extends UserBaseActionData {
  role: string;
}
