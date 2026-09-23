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
