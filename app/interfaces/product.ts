import { Box } from 'lucide-react';
import React from 'react';

export interface AddProductRequest {
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  stockQuantity: number;
  category: string;
}

export interface AddProductStockRequest {
  quantityToAdd: number;
}

export interface EditProductRequest {
  productId: string;
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  category: string;
}

export interface EditProductDetailResponse {
  productId: string;
  name: string;
  steelGradeId: string;
  unitId: string;
  currencyId: string;
  category: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  pricePerUnit: number;
}

export interface ProductFormData {
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter: number | '';
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  stockQuantity?: number;
  category: string;
}

export interface ProductDealItemResponse {
  dealId: string;
  dealName: string;
  companyName: string;
  status: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  decimalPlaces: number;
  closeDate: string;
}

export interface ProductInvoiceItemResponse {
  invoiceId: string;
  invoiceNumber: string;
  companyName: string;
  issueDate: string;
  dueDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
  decimalPlaces: number;
  isPaid: boolean;
}

export interface ActivePromotionResponse {
  name: string;
  discountPercentage?: number;
  promotionalPrice?: number;
  endDate?: string;
  minQuantity?: number;
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  steelGrade: string;
  category: string;
  dimensions: string;
  stockQuantity: number;
  decimalPlaces: number;
  currencyCode: string;
  reservedQuantity: number;
  unitSymbol: string;
  pricePerUnit: number;
  weight: number;
  activePromotion?: ActivePromotionResponse;
}
