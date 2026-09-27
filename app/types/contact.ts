import type { ContactDealResponse } from '~/types/deal';

export interface Contact {
  type: string;
  value: string;
  label?: string;
  isPrimary: boolean;
}

export interface AddContactRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  details: AddContactDetailRequest[];
}

export interface AddContactDetailRequest {
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface ContactNote {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorFirstName: string;
  authorLastName: string;
  createdAt: string;
}

export interface EditContactDetailRequest {
  contactDetailId: string | null;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface EditContactRequest {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  details: EditContactDetailRequest[];
}

export interface ContactDetailResponse {
  contactDetailId: string;
  label: string;
  value: string;
  isPrimary: boolean;
  type: string;
}

export interface ContactTaskItem {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToFirstName: string;
  assignedToLastName: string;
  dealId?: string | null;
  dealName?: string | null;
}

export interface ContactOption {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
}

export interface UserContactItem {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  companyName: string;
  isPrimary: boolean;
}

export interface ContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  ownerFirstName: string;
  ownerLastName: string;
  isPrimary: boolean;
}

export interface OwnerOption {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface ContactListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  companyName?: string;
  isPrimary?: boolean;
  ownerId?: string;
}

export interface PaginatedContactsResponse {
  items: ContactResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface PagedContactsToDealResult {
  items: ContactDealResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SaleTaskResponse {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  priority: string;
  assignedToId: string;
  assignedToFirstName: string;
  assignedToLastName: string;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
}

export interface DealTasksParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  status?: string;
  priority?: string;
}

export interface TaskContactResponse {
  contactId: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  companyName: string;
  contactWays: Contact[];
}

export interface TaskDealResponse {
  dealId: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
}
