export interface AddDealProductItem {
  productId: string;
  name: string;
  dimension?: string;
  quantity: number;
  unitPrice: number;
  stockPrice?: number;
}

export interface AddDealPayload {
  closeDate: string;
  currencyId: string;
  companyId: string;
  contactId: string;
  products: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface ContactDealResponse {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  isPrimary: boolean;
  companyId: string;
  companyName: string;
  nip: string;
}

export interface DealAssignableContactResponse {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  email: string;
  isPrimary: boolean;
}

export interface UserDealItem {
  id: string;
  name: string;
  status: string;
  closeDate: string;
  value: number;
  decimalPlace: number;
  currency: string;
  companyName: string;
}

export interface SaleDetailResponse {
  id: string;
  name: string;
  value: number;
  status: string;
  closeDate: string;
  currencyCode: string;
  decimalPlaces: number;
  ownerFirstName: string;
  ownerLastName: string;
  companyName: string;
  contactFirstName?: string;
  contactLastName?: string;
  invoicedAmount: number;
  paidAmount: number;
  isOverdueInvoices: boolean;
  paymentPercentage: number;
}

export interface UserSalesResponse {
  id: string;
  name: string;
  nip: string;
  status: string;
  closeDate: string;
  value: number;
  decimalPlace: number;
  currency: string;
  companyName: string;
  ownerId?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

export interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SalesListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  dateFrom?: string;
  dateTo?: string;
  statusType?: string;
  ownerId?: string;
}

export interface PaginatedSalesResponse {
  items: UserSalesResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface CompanySaleItem {
  id: string;
  salesmanFirstName: string;
  salesmanLastName: string;
  name: string;
  value: number;
  decimalPlaces: number;
  code: string;
  status: string;
  createdAt: string;
}

export interface PaginatedCompanySalesResponse {
  items: CompanySaleItem[];
  totalPages: number;
  totalCount: number;
}

export interface ChangeDealStatusPayload {
  targetStatus: string;
  language?: string;
  customRecipientEmail?: string;
}

export interface ChangeStatusResponse {
  status: string;
  sentToEmail?: string | null;
}

export interface DealProductResponse {
  dealProductId: string;
  productId: string;
  name: string;
  steelGrade: string;
  dimensions: string;
  quantity: number;
  unitSymbol: string;
  baseUnitPrice: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  decimalPlaces: number;
}

export interface DealProductsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  productCategory?: string;
  steelGrade?: string;
}

export interface PaginatedDealProductsResponse {
  items: DealProductResponse[];
  totalPages: number;
  totalCount?: number;
  totalItems?: number;
}
