export const ErrorMapper: Record<string, string> = {
  // Basic
  VALIDATION_ERROR: 'Wystąpił błąd walidacji. Proszę sprawdzić wprowadzone dane.',
  INTERNAL_ERROR: 'Wystąpił błąd wewnętrzny. Proszę spróbować ponownie później.',
  BAD_REQUEST: 'Nieprawidłowe żądanie. Proszę sprawdzić wprowadzone dane.',
  NOT_FOUND: 'Nie znaleziono żądanego zasobu.',
  INVALID_DATE: 'Nieprawidłowa data',
  INVALID_SORT_COLUMN: 'Nieprawidłowa kolumna sortowania',

  // Validation
  VAL_001: 'Email jest wymagany',
  VAL_002: 'Email jest nieprawidłowy',
  VAL_003: 'Hasło jest wymagane',
  VAL_004: 'Tytuł jest wymagany',
  VAL_005: 'Nieprawidłowa długość tytułu',
  VAL_006: 'Wiadomość jest wymagana',
  VAL_007: 'Nieprawidłowa długość wiadomości',
  VAL_008: 'Nazwa jest wymagana',
  VAL_009: 'Nieprawidłowa długość nazwy',
  VAL_010: 'Nieprawidłowy format numeru telefonu',
  VAL_011: 'Nieprawidłowy format linku',
  VAL_012: 'Id jest wymagane',
  VAL_013: 'Nieprawidłowy format id',
  VAL_014: 'Nieprawidłowy numer strony',
  VAL_015: 'Nieprawidłowa liczba elementów na stronie',
  VAL_016: 'Nieprawidłowy typ kontaktu',
  VAL_017: 'Opis kontaktu jest wymagany',
  VAL_018: 'Nieprawidłowa długość opisu kontaktu',
  VAL_019: 'Numer telefonu jest wymagany',
  VAL_020: 'Nieprawidłowa format numeru telefonu',
  VAL_021: 'Nieprawidłowa format linku',
  VAL_022: 'Link jest wymagany',

  // Domain / Auth
  AUTH_001: 'Nie znaleziono użytkownika',
  AUTH_002: 'Email nie został potwierdzony',
  AUTH_003: 'Nieprawidłowe dane logowania',
  AUTH_004: 'Nie przydzielono roli użytkownika',
  AUTH_005: 'Nie autoryzowany dostęp',

  // Company
  COM_001: 'Nie znaleziono firmy',

  // Contact
  CON_001: 'Nieprawidłowy typ drogi kontaktowej',
  CON_002: 'Główna droga kontaktowa jest wymagana',
  CON_003: 'Nie znaleziono kontaktu',

  // Product
  PROD_001: 'Nie znaleziono produktu',

  // Note
  NOTE_001: 'Nie znaleziono notatki',
  NOTE_003: 'Tytuł notatki musi mieć od 1 do 50 znaków',
  NOTE_004: 'Zawartość notatki musi mieć od 1 do 500 znaków',
  NOTE_005: 'Nie znaleziono obiektu do którego ma być przypisana notatka',

  // Mailing
  MAIL_001: 'Nie znaleziono klienta do którego ma być wysłany mailing',

  // Promotion
  PROMO_001: 'Nieprawidłowa wartość przeceny',
  PROMO_002: 'Nieprawidłowa cena promocyjna',
};

export const getErrorMessage = (code?: string, fallbackMessage?: string): string => {
  if (!code) {
    return fallbackMessage || 'Wystąpił nieznany błąd.';
  }
  return ErrorMapper[code] || fallbackMessage || 'Wystąpił nieznany błąd.';
};
