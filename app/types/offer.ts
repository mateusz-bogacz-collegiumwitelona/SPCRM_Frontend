export interface EditableProductItem {
  productId: string;
  productName: string;
  steelGrade?: string;
  quantity: number;
  quotedPrice: number;
}

export interface OfferProductResponse {
  productId: string;
  productName: string;
  steelGrade: string;
  quantity: number;
  quotedPrice: number;
  currencyCode: string;
  decimalPlaces: number;
}

export interface OfferListResponse {
  offerId: string;
  offerName: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
  validUntil: string;
  status: string;
  isExpired: boolean;
}

export interface CompanySimpleListResponse {
  id: string;
  name: string;
}

export interface OfferListParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  sortBy: string;
  sortDescending: boolean;
  status?: string;
  companyName?: string;
  isExpired?: boolean;
  validUntilFrom?: string;
  validUntilTo?: string;
}

export interface PaginatedOffersResponse {
  items: OfferListResponse[];
  totalPages: number;
  totalItems?: number;
  totalCount?: number;
}

export interface OfferAllowedActionsResponse {
  canEdit: boolean;
  canDelete: boolean;
  canResendEmail: boolean;
  canExtendValidity: boolean;
  allowedStatusTransitions: string[];
}

export interface UpdateOfferProductItem {
  productId: string;
  quantity: number;
  quotedPrice: number;
}

export interface OfferClientDetailResponse {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  contactJobTitle?: string;
  companyName: string;
}

export interface OfferProductsParams {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
}

export interface PaginatedOfferProductsResponse {
  items: OfferProductResponse[];
  totalPages: number;
  totalCount?: number;
}
