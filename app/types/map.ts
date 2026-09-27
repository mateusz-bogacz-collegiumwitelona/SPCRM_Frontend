export interface CompanyMapData {
  id: string;
  name: string;
  nip: string;
  street: string;
  city: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  type: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  street?: string;
  city?: string;
  zipCode?: string;
}
