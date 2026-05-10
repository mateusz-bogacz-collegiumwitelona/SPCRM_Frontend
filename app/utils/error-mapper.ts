export const ErrorMapper: Record<string, string> = {
  // Główne kody
  VALIDATION_ERROR: 'Formularz zawiera błędy.',
  INTERNAL_ERROR: 'Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie później.',
  BAD_REQUEST: 'Nieprawidłowe żądanie.',
  NOT_FOUND: 'Nie znaleziono zasobu.',

  // Autoryzacja
  AUTH_001: 'Nie znaleziono użytkownika.',
  AUTH_002: 'Adres e-mail nie został potwierdzony.',
  AUTH_003: 'Nieprawidłowy adres e-mail lub hasło.',
  AUTH_004: 'Konto nie ma przypisanych ról.',

  // Walidacja
  VAL_001: 'Adres e-mail jest wymagany.',
  VAL_002: 'Niepoprawny format adresu e-mail.',
  VAL_003: 'Hasło jest wymagane.',
  VAL_004: 'Tytuł jest wymagany.',
  VAL_005: 'Tytuł musi mieć od 5 do 100 znaków.',
  VAL_006: 'Treść wiadomości jest wymagana.',
  VAL_007: 'Treść musi mieć od 5 do 5000 znaków.',
};

export const getErrorMessage = (code?: string, fallbackMessage?: string): string => {
  if (!code) {
    return fallbackMessage || 'Wystąpił nieznany błąd.';
  }
  return ErrorMapper[code] || fallbackMessage || 'Wystąpił nieznany błąd.';
};
