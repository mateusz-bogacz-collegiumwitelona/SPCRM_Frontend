export interface MailingClientResponse {
  companyName: string;
  nip: string;
  contactFirstName: string;
  contactLastName: string;
  contactId: string;
}

export interface MailingProductResponse {
  productId: string;
  name: string;
  dimmension: string;
  stockQuantity: number;
  stockPrice: number;
  promotionalPrice?: number;
}

export interface SendMailingPayload {
  to: string[];
  language: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
    currencyCode: string;
  }[];
}
