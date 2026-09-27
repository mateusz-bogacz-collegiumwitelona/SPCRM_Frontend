import type { BasePaginationParams } from '~/types/table';

export interface AddCompanyAddressRequest {
  street: string;
  city: string;
  zipCode: string;
  longitude: number;
  latitude: number;
  type: string;
}

export interface AddCompanyRequest {
  name: string;
  nip: string;
  addresses: AddCompanyAddressRequest[];
}

export interface AddressItemToEdit {
  id?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  type?: string;
}

export interface EditCompanyDetailResponse {
  id: string;
  name: string;
  nip: string;
}

export interface GetCompanyResponse {
  id: string;
  name: string;
  nip: string;
  lastDealDate?: string | null;
  isYour: boolean;
  ownerFistName?: string | null;
  ownerLastName?: string | null;
  city: string;
  street: string;
  zipCode: string;
  createdAt: string;
}

export interface ContactListTableMeta {
  onEdit: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onChangeOwner: (id: string) => void;
}

export interface CompanyAddress {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  type: string;
}

export interface CompanyAddressFormData {
  addressId?: string;
  street: string;
  city: string;
  zipCode: string;
  longitude: number;
  latitude: number;
  type: string;
}

export interface EditCompanyRequest {
  id: string;
  name?: string;
  nip?: string;
}

export interface CompanyDetailResponse {
  id: string;
  name: string;
  nip: string;
  ownerId?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  isYour: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface CompanyListParams extends BasePaginationParams {
  createdAtFrom?: string;
  createdAtTo?: string;
  isYour?: boolean;
}

export interface Debt {
  id: string;
  invoiceNumber: string;
  amountLeft: number;
  decimalPlaces: number;
  currencyCode: string;
  dueDate: string;
  daysOverdue: number;
}

export interface DebtSummary {
  currencyCode: string;
  totalAmount: number;
  decimalPlace: number;
}
