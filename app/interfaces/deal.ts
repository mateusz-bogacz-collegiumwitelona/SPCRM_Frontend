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
