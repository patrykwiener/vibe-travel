# Plan implementacji widoku NotesListView

## 1. Przegląd

NotesListView to główny widok aplikacji służący do wyświetlania listy notatek podróżniczych użytkownika. Widok umożliwia przeglądanie, wyszukiwanie oraz nawigację do szczegółów notatek lub tworzenia nowych. Jest to chroniona trasa dostępna tylko dla zalogowanych użytkowników i stanowi domyślny widok po pomyślnym logowaniu.

## 2. Routing widoku

- **Ścieżka**: `/notes`
- **Typ trasy**: Chroniona (wymaga autoryzacji)
- **Domyślna**: Tak (przekierowanie po logowaniu)
- **Parametry**: Brak
- **Query params**: Opcjonalne dla deep linking paginacji i wyszukiwania

## 3. Struktura komponentów

```
NotesListView (główny kontener)
├── AppHeader (nawigacja aplikacji)
├── div.page-container
│   ├── div.page-header
│   │   ├── h1 (tytuł strony)
│   │   ├── p (opis)
│   │   └── CreateNoteButton (przycisk tworzenia)
│   ├── SearchInput (pole wyszukiwania)
│   ├── div.notes-grid (scroll container)
│   │   ├── NoteCard (v-for każda notatka)
│   │   ├── LoadingSpinner (na dole podczas ładowania kolejnych)
│   │   ├── EmptyStateMessage (gdy brak wyników)
│   │   └── EndOfListMessage (gdy wszystkie notatki załadowane)
```

## 4. Szczegóły komponentów

### NotesListView

- **Opis komponentu**: Główny kontener widoku listy notatek, zarządza stanem całego widoku, obsługuje logikę wyszukiwania i nieskończonego scrollowania
- **Główne elementy**: Header sekcja z tytułem i przyciskiem, pole wyszukiwania, siatka kart notatek z infinite scroll, wskaźniki ładowania
- **Obsługiwane interakcje**: Inicjalizacja danych, obsługa wyszukiwania, nieskończony scroll, przekierowania do innych widoków
- **Obsługiwana walidacja**: Sprawdzenie autoryzacji użytkownika, walidacja parametrów paginacji (offset/limit), walidacja długości zapytania wyszukiwania
- **Typy**: NotesListState, SearchFilters, InfiniteScrollInfo, NoteListItemOutSchema[]
- **Propsy**: Brak (główny widok)

### SearchInput

- **Opis komponentu**: Pole tekstowe z funkcjonalnością wyszukiwania z debouncing, zawiera przycisk czyszczenia i ikonę wyszukiwania
- **Główne elementy**: Input field, ikona wyszukiwania, przycisk "X" do czyszczenia, label dla accessibility
- **Obsługiwane interakcje**: Wprowadzanie tekstu z debouncing (300ms), czyszczenie pola wyszukiwania, obsługa klawiatury (Enter, Escape)
- **Obsługiwana walidacja**: Minimalna długość zapytania (2 znaki), maksymalna długość (255 znaków), sanityzacja inputu
- **Typy**: string (searchQuery), boolean (isSearching)
- **Propsy**: modelValue: string, placeholder?: string, isLoading?: boolean

### NoteCard

- **Opis komponentu**: Karta wyświetlająca podsumowanie pojedynczej notatki, klikalny element prowadzący do widoku szczegółów
- **Główne elementy**: Tytuł notatki, miejsce, daty (od-do), liczba osób, hover effects, focus states dla accessibility
- **Obsługiwane interakcje**: Kliknięcie → nawigacja do NoteDetailView, hover states, focus management dla klawiatury
- **Obsługiwana walidacja**: Sprawdzenie kompletności danych notatki, format dat, poprawność liczby osób (> 0)
- **Typy**: NoteListItemOutSchema
- **Propsy**: note: NoteListItemOutSchema (required)

### LoadingSpinner

- **Opis komponentu**: Wskaźnik ładowania wykorzystujący Flowbite spinner, wyświetlany podczas pobierania danych
- **Główne elementy**: Flowbite spinner component, tekst "Ładowanie...", centrowanie w kontenerze
- **Obsługiwane interakcje**: Brak (tylko wyświetlanie)
- **Obsługiwana walidacja**: Brak
- **Typy**: boolean (visible)
- **Propsy**: size?: 'sm' | 'md' | 'lg', text?: string

### EndOfListMessage

- **Opis komponentu**: Komunikat wyświetlany na końcu listy gdy wszystkie notatki zostały załadowane
- **Główne elementy**: Ikona, tekst "Wszystkie notatki zostały załadowane", stylizacja subtalna
- **Obsługiwane interakcje**: Brak (tylko informacyjny)
- **Obsługiwana walidacja**: Sprawdzenie czy rzeczywiście nie ma więcej danych do załadowania
- **Typy**: boolean (allLoaded)
- **Propsy**: totalLoaded: number, totalAvailable: number

### EmptyStateMessage

- **Opis komponentu**: Komunikat wyświetlany gdy brak notatek lub wyników wyszukiwania
- **Główne elementy**: Ikona, komunikat tekstowy, opcjonalny przycisk akcji (np. "Stwórz pierwszą notatkę")
- **Obsługiwane interakcje**: Opcjonalne kliknięcie przycisku akcji
- **Obsługiwana walidacja**: Sprawdzenie czy to brak notatek vs brak wyników wyszukiwania
- **Typy**: boolean (hasSearchQuery)
- **Propsy**: type: 'no-notes' | 'no-search-results', searchQuery?: string

### CreateNoteButton

- **Opis komponentu**: Przycisk do tworzenia nowej notatki, może być floating lub w headerze
- **Główne elementy**: Button z ikoną plus, tekst "Stwórz notatkę"
- **Obsługiwane interakcje**: Kliknięcie → nawigacja do NoteCreateView
- **Obsługiwana walidacja**: Sprawdzenie autoryzacji użytkownika
- **Typy**: Brak szczególnych
- **Propsy**: variant?: 'floating' | 'header'

## 5. Typy

```typescript
// Istniejące typy z API
interface NoteListItemOutSchema {
  id: number
  title: string
  place: string
  date_from: string // Format: YYYY-MM-DD
  date_to: string   // Format: YYYY-MM-DD
  number_of_people: number
}

interface LimitOffsetPageNoteListItemOutSchema {
  items: Array<NoteListItemOutSchema>
  total?: number | null
  limit: number | null
  offset: number | null
}

// Nowe typy dla ViewModelu
interface NotesListState {
  notes: NoteListItemOutSchema[]
  isLoading: boolean
  isLoadingMore: boolean
  isSearching: boolean
  error: string | null
  searchQuery: string
  infiniteScroll: InfiniteScrollInfo
}

interface SearchFilters {
  title?: string
  offset: number
  limit: number
}

interface InfiniteScrollInfo {
  currentOffset: number
  itemsPerPage: number
  totalItems: number
  hasMore: boolean
  allLoaded: boolean
}

interface NotesApiParams {
  offset?: number
  limit?: number
  search_title?: string
}
```

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany przez **Pinia store** (`useNotesStore`) z następującymi elementami:

```typescript
// Store state
const state = {
  notes: [] as NoteListItemOutSchema[],
  isLoading: false,
  isLoadingMore: false,
  isSearching: false,
  error: null as string | null,
  searchQuery: '',
  infiniteScroll: {
    currentOffset: 0,
    itemsPerPage: 10,
    totalItems: 0,
    hasMore: true,
    allLoaded: false
  }
}

// Store actions
const actions = {
  async fetchNotes(params: NotesApiParams),
  async loadMoreNotes(),
  async searchNotes(query: string),
  setSearchQuery(query: string),
  clearSearch(),
  resetState()
}
```

**Dodatkowe composables**:

- `useSearchDebounce()` - debouncing dla wyszukiwania (300ms delay)
- `useInfiniteScroll()` - logika wykrywania scrolla i ładowania kolejnych elementów

## 7. Integracja API

Wykorzystywany endpoint: `GET /notes`

**Typy żądania**:

```typescript
// Query parameters
interface NotesApiParams {
  offset?: number      // default: 0
  limit?: number       // default: 10  
  search_title?: string // opcjonalne
}
```

**Typy odpowiedzi**:

```typescript
// Sukces: 200 OK
type SuccessResponse = LimitOffsetPageNoteListItemOutSchema

// Błąd: 401 Unauthorized  
type ErrorResponse = ErrorModel
```

**Wywołania API**:

1. `notesNoteCbvListNotes()` - pobieranie listy notatek
2. Wykorzystanie auto-generated client z `@hey-api/openapi-ts`
3. Interceptory dla obsługi błędów i autoryzacji

## 8. Interakcje użytkownika

1. **Ładowanie początkowe**:
   - Użytkownik wchodzi na `/notes`
   - Automatyczne pobranie pierwszych 10 notatek
   - Wyświetlenie loading spinnera podczas ładowania

2. **Wyszukiwanie**:
   - Użytkownik wpisuje w pole wyszukiwania
   - Debouncing 300ms przed wysłaniem zapytania
   - Reset infinite scroll do początku
   - Wyświetlenie wyników lub komunikatu "Brak wyników"

3. **Czyszczenie wyszukiwania**:
   - Kliknięcie przycisku "X" lub wciśnięcie Escape
   - Wyczyszczenie pola i powrót do pełnej listy

4. **Nieskończony scroll**:
   - Użytkownik scrolluje w dół listy
   - Automatyczne załadowanie kolejnych 10 notatek gdy osiągnie koniec
   - Loading spinner na dole podczas ładowania
   - Komunikat "Wszystkie notatki załadowane" gdy brak więcej danych

5. **Nawigacja do szczegółów**:
   - Kliknięcie karty notatki
   - Przekierowanie do `/notes/{id}`

6. **Tworzenie nowej notatki**:
   - Kliknięcie przycisku "Stwórz notatkę"
   - Przekierowanie do `/notes/new`

## 9. Warunki i walidacja

**Autoryzacja**:

- Komponent: NotesListView
- Warunek: Użytkownik musi być zalogowany
- Działanie: Przekierowanie do `/login` jeśli nie zalogowany

**Wyszukiwanie**:

- Komponent: SearchInput
- Warunki: Minimalna długość 2 znaki, maksymalna 255 znaków
- Działanie: Blokada wysyłania zapytania poniżej minimum

**Nieskończony scroll**:

- Komponent: NotesListView
- Warunki: hasMore = true, nie trwa już ładowanie (isLoadingMore = false)
- Działanie: Wykrywanie scroll position i automatyczne ładowanie kolejnych elementów

**Dane notatki**:

- Komponent: NoteCard
- Warunki: Sprawdzenie kompletności pól (title, place, dates, number_of_people)
- Działanie: Fallback wartości dla brakujących danych

## 10. Obsługa błędów

**Błędy sieciowe**:

- Wyświetlenie toast notification z komunikatem błędu
- Przycisk "Spróbuj ponownie" do retry
- Zachowanie ostatniego stanu danych

**401 Unauthorized**:

- Automatyczne przekierowanie do strony logowania
- Wyczyszczenie store'a autoryzacji
- Toast z komunikatem "Sesja wygasła"

**Błędy walidacji (400)**:

- Wyświetlenie szczegółowych komunikatów błędów
- Podświetlenie problematycznych pól
- Zachowanie wprowadzonych danych

**Timeout/Server errors (5xx)**:

- Ogólny komunikat "Problem z serwerem"
- Przycisk retry
- Fallback do cached danych jeśli dostępne

**Puste wyniki**:

- Komunikat "Brak notatek" dla nowych użytkowników
- Komunikat "Brak wyników wyszukiwania" z opcją czyszczenia filtra

## 11. Kroki implementacji

1. **Przygotowanie store'a**:
   - Aktualizacja `useNotesStore` z nowymi typami i akcjami
   - Implementacja `useSearchDebounce` composable
   - Implementacja `useInfiniteScroll` composable

2. **Stworzenie komponentów bazowych**:
   - `SearchInput.vue` z debouncing
   - `LoadingSpinner.vue` (Flowbite)
   - `EmptyStateMessage.vue`
   - `EndOfListMessage.vue`

3. **Implementacja NoteCard**:
   - Layout karty z wymaganymi polami
   - Hover states i accessibility
   - Click handler z nawigacją

4. **Implementacja mechanizmu nieskończonego scrolla**:
   - Intersection Observer API do wykrywania końca listy
   - Automatyczne ładowanie kolejnych elementów
   - Loading states management

5. **Stworzenie głównego widoku NotesListView**:
   - Layout głównego kontenera z scroll container
   - Integration wszystkich komponentów
   - Lifecycle hooks (onMounted, onUnmounted)
   - Setup scroll listeners

6. **Integracja API**:
   - Konfiguracja wywołań API z offset/limit
   - Error handling i interceptory
   - Loading states management
   - Append logic dla nowych elementów

7. **Implementacja wyszukiwania**:
   - Podłączenie SearchInput do store'a
   - Debouncing logic
   - Reset infinite scroll przy wyszukiwaniu

8. **Implementacja logiki infinite scroll**:
   - useInfiniteScroll composable
   - Scroll event handling
   - Threshold detection dla triggera

9. **Obsługa błędów**:
   - Global error handling
   - Toast notifications
   - Retry mechanisms dla failed loads

10. **Testowanie i optymalizacja**:
    - Unit testy komponentów
    - Integration testy store'a
    - Performance optimization (virtual scrolling jeśli potrzebne)
    - Accessibility testing

11. **Finalizacja**:
    - Code review
    - Documentation update
    - Deployment verification
