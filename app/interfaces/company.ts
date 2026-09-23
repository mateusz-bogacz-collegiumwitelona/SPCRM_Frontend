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

export interface CompanyAddressFormData {
  addressId?: string;
  street: string;
  city: string;
  zipCode: string;
  longitude: number;
  latitude: number;
  type: string;
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

export interface EditCompanyRequest {
  id: string;
  name?: string;
  nip?: string;
}

export interface EditCompanyDetailResponse {
  id: string;
  name: string;
  nip: string;
}
