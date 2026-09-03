export const ErrorMapper: Record<string, string> = {
  // Basic
  VALIDATION_ERROR: 'Wystąpił błąd walidacji. Proszę sprawdzić wprowadzone dane.',
  INTERNAL_ERROR: 'Wystąpił błąd wewnętrzny. Proszę spróbować ponownie później.',
  BAD_REQUEST: 'Nieprawidłowe żądanie. Proszę sprawdzić wprowadzone dane.',
  NOT_FOUND: 'Nie znaleziono żądanego zasobu.',
  INVALID_DATE: 'Nieprawidłowa data',
  INVALID_SORT_COLUMN: 'Nieprawidłowa kolumna sortowania',
  INVALID_OPERATION: 'Nieprawidłowa operacja',

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
  VAL_020: 'Nieprawidłowy format numeru telefonu',
  VAL_021: 'Nieprawidłowy format profilu LinkedIn',
  VAL_022: 'Link do profilu LinkedIn jest wymagany',

  // Domain / Auth
  AUTH_001: 'Nie znaleziono użytkownika',
  AUTH_002: 'Email nie został potwierdzony',
  AUTH_003: 'Nieprawidłowe dane logowania',
  AUTH_004: 'Nie przydzielono roli użytkownika',
  AUTH_005: 'Nieautoryzowany dostęp',

  // Company
  COM_001: 'Nie znaleziono firmy',
  COM_002: 'Firma już istnieje',

  // Company Address
  CAD_001: 'Adres już istnieje',
  CAD_002: 'Nieprawidłowy numer NIP',
  CAD_003: 'Nieprawidłowy kod pocztowy',
  CAD_004: 'Adres siedziby głównej jest wymagany',
  CAD_005: 'Adres jest wymagany',
  CAD_006: 'Ulica jest wymagana',
  CAD_007: 'Nieprawidłowa długość nazwy ulicy',
  CAD_008: 'Miasto jest wymagane',
  CAD_009: 'Nieprawidłowa długość nazwy miasta',
  CAD_010: 'Typ adresu jest wymagany',
  CAD_011: 'Numer NIP jest wymagany',
  CAD_012: 'Kod pocztowy jest wymagany',
  CAD_013: 'Nie znaleziono adresu',

  // Contact
  CON_001: 'Nieprawidłowy typ drogi kontaktowej',
  CON_002: 'Główna droga kontaktowa jest wymagana',
  CON_003: 'Nie znaleziono kontaktu',
  CON_004: 'Nieprawidłowa szerokość geograficzna',
  CON_005: 'Nieprawidłowa długość geograficzna',
  CON_006: 'Nieprawidłowy typ adresu',

  // Product
  PROD_001: 'Nie znaleziono produktu',
  PROD_002: 'Produkt o podanych parametrach już istnieje',
  PROD_003: 'Nieprawidłowa kategoria produktu',
  PROD_004: 'Nieprawidłowa nazwa produktu',
  PROD_005: 'Nieprawidłowy gatunek stali produktu',
  PROD_006: 'Nieprawidłowy wymiar produktu (musi być większy od zera)',
  PROD_007: 'Nieprawidłowa waga produktu (musi być większa od zera)',
  PROD_008: 'Nieprawidłowa cena jednostkowa produktu',
  PROD_009: 'Nieprawidłowa ilość produktu na stanie',
  PROD_010: 'Średnica jest wymagana dla kategorii rur oraz drutów',

  // Note
  NOTE_001: 'Nie znaleziono notatki',
  NOTE_003: 'Tytuł notatki musi mieć od 1 do 50 znaków',
  NOTE_004: 'Zawartość notatki musi mieć od 1 do 500 znaków',
  NOTE_005: 'Nie znaleziono obiektu, do którego ma być przypisana notatka',

  // Mailing
  MAIL_001: 'Nie znaleziono klienta, do którego ma być wysłany mailing',

  // Promotion
  PROMO_001: 'Nieprawidłowa wartość przeceny',
  PROMO_002: 'Nieprawidłowa cena promocyjna',
  PROMO_003: 'Nie znaleziono promocji',
  PROMO_004: 'Aktywna promocja na ten produkt już istnieje',
  PROM_005: 'Nieprawidłowa nazwa promocji',
  PROM_006: 'Nieprawidłowa minimalna ilość promocyjna',
  PROM_007: 'Nieprawidłowa minimalna waga promocyjna',
  PROM_008: 'Nie można jednocześnie wybrać rabatu procentowego oraz stałej ceny promocyjnej',

  // Currency
  CUR_001: 'Nie znaleziono wybranej waluty lub waluta już istnieje',
  CUR_002: 'Nieprawidłowa liczba miejsc po przecinku',
  CUR_003: 'Nieprawidłowa długość kodu waluty',
  CUR_004: 'Nieprawidłowy format kodu waluty',
  CUR_005: 'Kod waluty jest wymagany',
  CUR_006: 'Waluta o podanej nazwie już istnieje',
  CUR_007: 'Waluta o podanym kodzie już istnieje',

  // Steel Grade
  ST_001: 'Nie można usunąć gatunku stali, ponieważ jest przypisany do istniejących produktów',
  ST_002: 'Zduplikowany produkt do zmiany gatunku stali. Coś jest nie tak.',
  ST_003: 'Gatunek stali już istnieje',
  ST_004: 'Nieprawidłowa nazwa gatunku stali',
  ST_005: 'Nieprawidłowa gęstość gatunku stali',
  ST_006: 'Nieprawidłowa norma gatunku stali',

  // Unit of Measure
  UOM_001: 'Jednostka miary już istnieje',
  UOM_002: 'Nieprawidłowa nazwa jednostki miary',
  UOM_003: 'Nieprawidłowy symbol jednostki miary',
  UOM_004: 'Nieprawidłowy przelicznik jednostki bazowej',
  UOM_005: 'Nie znaleziono jednostki miary',

  // Offer
  OFF_001: 'Nie znaleziono oferty',
};

export const getErrorMessage = (code?: string, fallbackMessage?: string): string => {
  if (!code) {
    return fallbackMessage || 'Wystąpił nieznany błąd.';
  }
  return ErrorMapper[code] || fallbackMessage || 'Wystąpił nieznany błąd.';
};
