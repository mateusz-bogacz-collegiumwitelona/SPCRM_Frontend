export interface AddPromotionRequest {
  name: string;
  productId: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyId?: string | null;
  contactId?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

export interface EditPromotionRequest {
  id: string;
  name?: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyId?: string | null;
  contactId?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

export interface PromotionSharedFormData {
  discountType: 'percentage' | 'fixed';
  discountPercentage: string;
  promotionalPrice: string;
  currencyId: string;
  contactId: string;
  startDate?: Date;
  endDate?: Date;
  minQuantity: string;
  minWeight: string;
}

export interface PromotionPricingPayloadResult {
  discountPercentage: number | null;
  promotionalPrice: number | null;
  currencyId: string | null;
}

export interface EditPromotionInitialData {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyCode?: string | null;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactCompanyName?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}
