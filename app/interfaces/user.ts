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
