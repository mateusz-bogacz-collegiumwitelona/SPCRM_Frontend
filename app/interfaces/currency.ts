export interface AddCurrencyRequestPayload {
  name: string;
  code: string;
  decimalPlaces: number;
}

export interface EditCurrencyRequestPayload {
  currencyId: string;
  name?: string;
  code?: string;
  decimalPlaces?: number;
}

export interface CurrencyOption {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}
