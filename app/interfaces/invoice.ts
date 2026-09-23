export interface InvoiceDetailResponse {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentDate?: string | null;
  companyId: string;
  companyName: string;
  companyNip: string;
  dealId?: string | null;
  dealName?: string | null;
}

export interface InvoicePaymentSummaryResponse {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currencyCode: string;
  decimalPlaces: number;
  paymentsCount: number;
  isOverDue: boolean;
  paymentDate?: string | null;
}

export interface InvoicePaymentListResponse {
  paymentId: string;
  amount: number;
  currencyCode: string;
  decimalPlaces: number;
  paymentDate: string;
  referenceNumber?: string | null;
  note?: string | null;
  createdByFirstName?: string | null;
  createdByLastName?: string | null;
}

export interface InvoiceProductsListResponse {
  invoiceProductId: string;
  productName: string;
  steelGrade?: string | null;
  unitSymbol: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceListResponse {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  companyName: string;
  companyNip: string;
  currencyCode: string;
  decimalPlaces: number;
  issueDate: string;
  dueDate: string;
  isOverDue: boolean;
}
