export const ErrorMapper: Record<string, string> = {
  // Basic
  VALIDATION_ERROR: 'Wystąpił błąd walidacji. Proszę sprawdzić wprowadzone dane.',
  INTERNAL_ERROR: 'Wystąpił błąd wewnętrzny. Proszę spróbować ponownie później.',
  BAD_REQUEST: 'Nieprawidłowe żądanie. Proszę sprawdzić wprowadzone dane.',
  NOT_FOUND: 'Nie znaleziono żądanego zasobu.',
  INVALID_DATE: 'Nieprawidłowa data.',
  INVALID_SORT_COLUMN: 'Nieprawidłowa kolumna sortowania.',
  INVALID_OPERATION: 'Nieprawidłowa operacja.',
  DATA_INTEGRITY_ERROR: 'Błąd spójności danych. Operacja nie może zostać wykonana.',
  TOKEN_REQUIRED: 'Token autoryzacyjny jest wymagany.',
  TOKEN_INVALID: 'Token autoryzacyjny jest nieprawidłowy lub wygasł.',
  TOO_MANY_REQUESTS: 'Zbyt wiele żądań. Proszę odczekać chwilę przed ponowną próbą.',

  // Validation
  VAL_001: 'Email jest wymagany.',
  VAL_002: 'Email jest nieprawidłowy.',
  VAL_003: 'Hasło jest wymagane.',
  VAL_004: 'Tytuł jest wymagany.',
  VAL_005: 'Nieprawidłowa długość tytułu.',
  VAL_006: 'Wiadomość jest wymagana.',
  VAL_007: 'Nieprawidłowa długość wiadomości.',
  VAL_008: 'Nazwa jest wymagana.',
  VAL_009: 'Nieprawidłowa długość nazwy.',
  VAL_010: 'Nieprawidłowy format numeru telefonu.',
  VAL_011: 'Nieprawidłowy format linku.',
  VAL_012: 'Id jest wymagane.',
  VAL_013: 'Nieprawidłowy format id.',
  VAL_014: 'Nieprawidłowy numer strony.',
  VAL_015: 'Nieprawidłowa liczba elementów na stronie.',
  VAL_016: 'Nieprawidłowy typ kontaktu.',
  VAL_017: 'Opis kontaktu jest wymagany.',
  VAL_018: 'Nieprawidłowa długość opisu kontaktu.',
  VAL_019: 'Numer telefonu jest wymagany.',
  VAL_020: 'Nieprawidłowy format numeru telefonu.',
  VAL_021: 'Nieprawidłowy format profilu LinkedIn.',
  VAL_022: 'Link do profilu LinkedIn jest wymagany.',
  VAL_023: 'Nieprawidłowy format numeru faksu.',

  // Domain / Auth
  AUTH_001: 'Nie znaleziono użytkownika.',
  AUTH_002: 'Email nie został potwierdzony.',
  AUTH_003: 'Nieprawidłowe dane logowania.',
  AUTH_004: 'Nie przydzielono roli użytkownika.',
  AUTH_005: 'Nieautoryzowany dostęp.',

  // Company
  COM_001: 'Nie znaleziono firmy.',
  COM_002: 'Firma o podanych danych już istnieje.',
  CAD_002: 'Nieprawidłowy numer NIP.',
  CAD_011: 'Numer NIP jest wymagany.',

  // Company Address
  CAD_001: 'Adres już istnieje.',
  CAD_003: 'Nieprawidłowy kod pocztowy (wymagany format: 00-000).',
  CAD_004: 'Adres siedziby głównej jest wymagany.',
  CAD_005: 'Adres jest wymagany.',
  CAD_006: 'Ulica jest wymagana.',
  CAD_007: 'Nieprawidłowa długość nazwy ulicy.',
  CAD_008: 'Miasto jest wymagane.',
  CAD_009: 'Nieprawidłowa długość nazwy miasta.',
  CAD_010: 'Typ adresu jest wymagany.',
  CAD_012: 'Kod pocztowy jest wymagany.',
  CAD_013: 'Nie znaleziono adresu.',
  CAD_014: 'Współrzędne geograficzne są wymagane.',
  CAD_015: 'Szerokość geograficzna jest wymagana.',
  CAD_016: 'Długość geograficzna jest wymagana.',

  // Contact
  CON_001: 'Nieprawidłowy typ drogi kontaktowej.',
  CON_002: 'Główna droga kontaktowa jest wymagana.',
  CON_003: 'Nie znaleziono kontaktu.',
  CON_004: 'Szerokość geograficzna poza zakresem (-90 do 90).',
  CON_005: 'Długość geograficzna poza zakresem (-180 do 180).',
  CON_006: 'Nieprawidłowy typ adresu.',
  CON_007: 'Wartość drogi kontaktowej jest wymagana.',

  // Product
  PROD_001: 'Nie znaleziono produktu.',
  PROD_002: 'Produkt o podanych parametrach już istnieje.',
  PROD_003: 'Nieprawidłowa kategoria produktu.',
  PROD_004: 'Nieprawidłowa nazwa produktu.',
  PROD_005: 'Nieprawidłowy gatunek stali produktu.',
  PROD_006: 'Nieprawidłowy wymiar produktu (musi być większy od zera).',
  PROD_007: 'Nieprawidłowa waga produktu (musi być większa od zera).',
  PROD_008: 'Nieprawidłowa cena jednostkowa produktu.',
  PROD_009: 'Nieprawidłowa ilość produktu na stanie.',
  PROD_010: 'Średnica jest wymagana dla kategorii rur oraz drutów.',

  // Note
  NOTE_001: 'Nie znaleziono notatki.',
  NOTE_003: 'Tytuł notatki musi mieć od 1 do 50 znaków.',
  NOTE_004: 'Zawartość notatki musi mieć od 1 do 500 znaków.',
  NOTE_005: 'Nie znaleziono obiektu, do którego ma być przypisana notatka.',
  NOTE_006: 'Nieprawidłowy typ powiązania notatki.',

  // Mailing
  MAIL_001: 'Nie znaleziono klienta, do którego ma być wysłany mailing.',
  MAIL_002: 'Nieprawidłowa cena produktu w mailingu.',
  MAIL_003: 'Nieprawidłowa ilość produktu w mailingu.',

  // Promotion
  PROMO_001: 'Nieprawidłowa wartość przeceny (musi być między 1% a 100%).',
  PROMO_002: 'Nieprawidłowa cena promocyjna (musi być większa od zera).',
  PROMO_003: 'Nie znaleziono promocji.',
  PROMO_004: 'Aktywna promocja na ten produkt już istnieje.',
  PROM_005: 'Nieprawidłowa nazwa promocji.',
  PROM_006: 'Nieprawidłowa minimalna ilość promocyjna.',
  PROM_007: 'Nieprawidłowa minimalna waga promocyjna.',
  PROM_008: 'Nie można jednocześnie wybrać rabatu procentowego oraz stałej ceny promocyjnej.',
  PROM_009: 'Promocja o podanej nazwie już istnieje.',

  // Steel Grade
  ST_001: 'Nie można usunąć gatunku stali, ponieważ jest przypisany do istniejących produktów.',
  ST_002: 'Zduplikowany produkt do zmiany gatunku stali. Każdy produkt można przepisać tylko raz.',
  ST_003: 'Gatunek stali już istnieje.',
  ST_004: 'Nieprawidłowa nazwa gatunku stali.',
  ST_005: 'Nieprawidłowa gęstość gatunku stali (musi być większa od zera).',
  ST_006: 'Nieprawidłowa norma gatunku stali.',
  ST_007: 'Nie znaleziono gatunku stali.',

  // Currency
  CUR_001: 'Waluta o podanych danych nie została znaleziona lub już istnieje.',
  CUR_002: 'Nieprawidłowa liczba miejsc po przecinku (od 0 do 4).',
  CUR_003: 'Nieprawidłowa długość kodu waluty.',
  CUR_004: 'Nieprawidłowy format kodu waluty (wymagane dokładnie 3 litery, np. PLN).',
  CUR_005: 'Kod waluty jest wymagany.',
  CUR_006: 'Waluta o podanej nazwie już istnieje.',
  CUR_007: 'Waluta o podanym kodzie już istnieje.',

  // Unit of Measure
  UOM_001: 'Jednostka miary już istnieje.',
  UOM_002: 'Nieprawidłowa nazwa jednostki miary.',
  UOM_003: 'Nieprawidłowy symbol jednostki miary.',
  UOM_004: 'Nieprawidłowy przelicznik jednostki bazowej (musi być większy od zera).',
  UOM_005: 'Nie znaleziono jednostki miary.',

  // Offer
  OFF_001: 'Nie znaleziono oferty.',
  OFF_002: 'Ilość produktu w ofercie musi być większa od zera.',
  OFF_003: 'Cena ofertowa produktu musi być większa od zera.',
  OFF_004: 'Oferta musi zawierać co najmniej jeden produkt.',

  // Deal
  DEAL_001: 'Nie znaleziono transakcji.',
  DEAL_002: 'Ilość produktu w transakcji musi być większa od zera.',
  DEAL_003: 'Cena jednostkowa produktu w transakcji nie może być ujemna.',
  DEAL_004: 'Nie posiadasz uprawnień do tej transakcji.',
  DEAL_005: 'Transakcja musi zawierać co najmniej jeden produkt.',
  DEAL_006: 'Nieprawidłowy status transakcji.',

  // Task
  TASK_001: 'Nie znaleziono zadania.',
  TASK_002: 'Zadanie jest już przypisane.',
  TASK_003: 'Nie jesteś właścicielem tego zadania.',
  TASK_004: 'Tytuł zadania jest wymagany (do 150 znaków).',
  TASK_005: 'Opis zadania jest wymagany (do 1000 znaków).',
  TASK_006: 'Nieprawidłowy priorytet zadania.',
  TASK_007: 'Nieprawidłowy status zadania.',

  // User
  USR_001: 'Użytkownik o podanym adresie email już istnieje.',
  USR_002: 'Nieprawidłowe imię (wymagane, maksymalnie 50 znaków).',
  USR_003: 'Nieprawidłowe nazwisko (wymagane, maksymalnie 50 znaków).',
  USR_004: 'Nieprawidłowy adres email.',
  USR_005: 'Hasło musi mieć minimum 8 znaków i zawierać znak specjalny.',
  USR_006: 'Hasła nie są identyczne.',
  USR_007: 'Wybrana rola użytkownika jest nieprawidłowa.',
  USR_008: 'Nie można zablokować konta głównego administratora.',
  USR_009: 'Użytkownik nie jest obecnie zablokowany.',
  USR_010: 'Ustawienie nowego hasła nie powiodło się.',
  USR_011: 'Konto użytkownika jest zablokowane.',

  // Inventory & Invoice
  INV_001: 'Nie znaleziono faktury lub brak wystarczającej ilości towaru w magazynie.',
  INV_002: 'Wpłata nie może być pusta lub błąd wydania z magazynu.',
  INV_003: 'Kwota płatności musi być większa od zera.',
  INV_004: 'Data płatności jest wymagana.',
  INV_005: 'Numer referencyjny płatności nie może przekraczać 100 znaków.',
  INV_006: 'Notatka do płatności nie może przekraczać 500 znaków.',
};

export const getErrorMessage = (code?: string, fallbackMessage?: string): string => {
  if (!code) {
    return fallbackMessage || 'Wystąpił nieznany błąd.';
  }
  return ErrorMapper[code] || fallbackMessage || 'Wystąpił nieznany błąd.';
};
