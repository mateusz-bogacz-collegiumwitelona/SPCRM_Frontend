# SPCRM (Simply Poor CRM) - Frontend

Frontendowa część aplikacji CRM (Customer Relationship Management) przeznaczonej dla firmy handlującej wyrobami stalowymi. Projekt realizowany w ramach pracy inżynierskiej.

## Technologie i narzędzia

Projekt wykorzystuje nowoczesny ekosystem frontendowy, nastawiony na wydajność, bezpieczeństwo typów i świetne Developer Experience (DX):

- **React 19 & React Router 7** – Główne biblioteki do budowy interfejsu i zarządzania routingiem (wsparcie dla SSR i Data Loadingu)
- **Vite** – Błyskawiczne narzędzie budujące (Bundler) i serwer deweloperski z Hot Module Replacement (HMR)
- **TypeScript** – Statyczne typowanie zapewniające bezpieczeństwo kodu
- **Tailwind CSS v4** – Utility-first CSS framework do szybkiego stylowania aplikacji
- **Shadcn UI & Radix UI** – Dostępne, bezgłowe (headless) i w pełni modyfikowalne komponenty interfejsu użytkownika
- **Axios** – Klient HTTP do komunikacji z API backendu
- **Lucide React** – Nowoczesna biblioteka ikon
- **ESLint** – Statyczna analiza kodu wyłapująca błędy logiczne i antywzorce (skonfigurowana pod Reacta i TypeScripta).
- **Prettier** – Automatyczny formater dbający o absolutną spójność wizualną bazy kodowej.

## Wymagania wstępne

Aby uruchomić projekt lokalnie, upewnij się, że masz zainstalowane:

- [Node.js](https://nodejs.org/) (zalecana wersja LTS, np. v20 lub v22)
- Menedżer pakietów `npm` (zainstalowany domyślnie z Node.js)

## Uruchomienie projektu lokalnie

1. **Instalacja zależności**
   Pobierz wszystkie wymagane pakiety definiowane w `package.json`:

   ```
   npm install
   ```

2. Konfiguracja zmiennych środowiskowych
   Skopiuj zawartość pliku .env.example i stwórz nowy plik .env. Upewnij się, że adres API jest poprawny (domyślnie wskazuje na port 8080, gdzie powinien działać lokalny backend):

   ```
   cp .env.example .env
   ```

   Twój plik .env powinien zawierać m.in.: VITE_API_URL=http://localhost:8080/api

3. Uruchomienie serwera deweloperskiego
   Wystartuj aplikację w trybie deweloperskim (z obsługą HMR):

   ```
   npm run dev
   ```

   Aplikacja będzie dostępna w przeglądarce pod adresem: http://localhost:5173

### Przydatne komendy

| Komenda                  | Opis                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| `npx prettier --write .` | Automatyczne formatowanie stylu i układu kodu we wszystkich plikach.     |
| `npx eslint . --fix`     | Wykrywanie błędów logicznych i automatyczna naprawa naruszeń zasad kodu. |
