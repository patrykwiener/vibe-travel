# Plan implementacji widoku UserProfileView

## 1. Przegląd

UserProfileView to widok umożliwiający użytkownikom przeglądanie i aktualizację swoich preferencji podróżnych. Widok zawiera formularz z trzema opcjonalnymi polami: styl podróży, preferowane tempo oraz budżet. Wszystkie pola mogą pozostać puste (null), a użytkownik otrzymuje potwierdzenie po pomyślnym zapisaniu preferencji.

## 2. Routing widoku

- **Ścieżka:** `/profile`
- **Ochrona:** Chroniona trasa wymagająca uwierzytelnienia (JWT)
- **Komponent:** `UserProfileView.vue`

## 3. Struktura komponentów

```
UserProfileView (główny widok)
├── LoadingSpinner (podczas ładowania danych)
├── UserProfileForm (formularz preferencji)
│   ├── SelectInput (travel_style) 
│   ├── SelectInput (preferred_pace)
│   ├── SelectInput (budget)
│   └── SubmitButton (przycisk zapisywania)
└── Toast/Alert (komunikaty sukcesu/błędu)
```

## 4. Szczegóły komponentów

### UserProfileView

- **Opis komponentu:** Główny widok zawierający formularz profilu użytkownika z obsługą stanu ładowania, błędów i komunikatów sukcesu
- **Główne elementy:** Container div z tłem, nagłówek sekcji, komponent LoadingSpinner, UserProfileForm, komunikaty sukcesu/błędu
- **Obsługiwane interakcje:**
  - Inicjalne ładowanie danych profilu
  - Obsługa submitu formularza
  - Wyświetlanie komunikatów zwrotnych
- **Obsługiwana walidacja:**
  - Sprawdzenie czy użytkownik jest zalogowany
  - Walidacja odpowiedzi API
  - Obsługa błędów sieci i autoryzacji
- **Typy:** `UserProfileOutSchema`, `ApiError`, loading states
- **Propsy:** Brak (widok główny)

### UserProfileForm  

- **Opis komponentu:** Formularz zawierający pola preferencji podróżnych z funkcją zapisywania
- **Główne elementy:** Form element, trzy komponenty SelectInput, SubmitButton, wyświetlanie daty ostatniej aktualizacji
- **Obsługiwane interakcje:**
  - Submit formularza
  - Walidacja danych przed wysłaniem
  - Emisja zdarzeń do widoku głównego
- **Obsługiwana walidacja:**
  - Sprawdzenie czy wartości są poprawnymi enum values lub null
  - Walidacja przed wysłaniem formularza
- **Typy:** `ProfileFormData`, `UserProfileInSchema`
- **Propsy:**
  - `modelValue: ProfileFormData` - dane formularza
  - `isLoading: boolean` - stan ładowania
  - `isSaving: boolean` - stan zapisywania
  - `lastUpdated: string` - data ostatniej aktualizacji

### SelectInput

- **Opis komponentu:** Komponent select z opcjami dla każdego pola preferencji (travel_style, preferred_pace, budget)
- **Główne elementy:** Label, select element z opcjami, obsługa Flowbite styling
- **Obsługiwane interakcje:**
  - Zmiana wybranej wartości
  - Obsługa wartości null ("Not specified")
- **Obsługiwana walidacja:**
  - Sprawdzenie czy wybrana wartość należy do dozwolonych opcji
  - Obsługa nullable values
- **Typy:** `SelectOption[]`, konkretne enum types
- **Propsy:**
  - `modelValue: string | null` - wybrana wartość
  - `options: SelectOption[]` - opcje do wyboru
  - `label: string` - etykieta pola
  - `placeholder: string` - tekst placeholder
  - `disabled: boolean` - czy pole jest wyłączone

### SubmitButton

- **Opis komponentu:** Przycisk zapisywania formularza z obsługą stanu ładowania
- **Główne elementy:** Button element z ikoną i tekstem, spinner podczas zapisywania
- **Obsługiwane interakcje:**
  - Kliknięcie w przycisk submit
  - Wyświetlanie stanu ładowania
- **Obsługiwana walidacja:**
  - Wyłączenie przycisku podczas zapisywania
  - Sprawdzenie czy formularz może być wysłany
- **Typy:** Brak specjalnych typów
- **Propsy:**
  - `isLoading: boolean` - czy trwa zapisywanie
  - `disabled: boolean` - czy przycisk jest wyłączony
  - `text: string` - tekst przycisku

## 5. Typy

### ProfileFormData (lokalny ViewModel)

```typescript
interface ProfileFormData {
  travel_style: UserTravelStyleEnum | null
  preferred_pace: UserTravelPaceEnum | null
  budget: UserBudgetEnum | null
}
```

### SelectOption (opcje w select)

```typescript
interface SelectOption {
  value: string | null
  label: string
}
```

### LoadingState (stan ładowania)

```typescript
interface LoadingState {
  isLoading: boolean
  isSaving: boolean
  errorMessage: string | null
  successMessage: string | null
}
```

### TravelStyleOptions, PaceOptions, BudgetOptions

```typescript
const TRAVEL_STYLE_OPTIONS: SelectOption[] = [
  { value: null, label: "Not specified" },
  { value: "RELAX", label: "Relax" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "CULTURE", label: "Culture" },
  { value: "PARTY", label: "Party" }
]

const PACE_OPTIONS: SelectOption[] = [
  { value: null, label: "Not specified" },
  { value: "CALM", label: "Calm" },
  { value: "MODERATE", label: "Moderate" }, 
  { value: "INTENSE", label: "Intense" }
]

const BUDGET_OPTIONS: SelectOption[] = [
  { value: null, label: "Not specified" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" }
]
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie UserProfileView przy użyciu Composition API:

- **Reactive state:** Dane formularza (`ProfileFormData`) zarządzane przez `ref()`
- **Loading states:** Oddzielne reactive refs dla `isLoading` i `isSaving`
- **Messages:** Reactive refs dla `errorMessage` i `successMessage`
- **Computed properties:** `lastUpdated` do formatowania daty ostatniej aktualizacji
- **Auth store:** Wykorzystanie istniejącego `useAuthStore()` do zarządzania profilem użytkownika

Nie ma potrzeby tworzenia dedykowanego store w Pinia, ponieważ dane profilu są już zarządzane w `authStore`.

## 7. Integracja API

### Pobranie profilu (GET)

- **Funkcja:** `profileUserProfileCbvGetProfile()`
- **Typ żądania:** Brak body (GET request)
- **Typ odpowiedzi:** `UserProfileOutSchema`
- **Obsługa:** Wywołanie przy `onMounted()` z obsługą błędów

### Aktualizacja profilu (PUT)  

- **Funkcja:** `profileUserProfileCbvUpdateProfile(options)`
- **Typ żądania:** `UserProfileInSchema` w `options.body`
- **Typ odpowiedzi:** `UserProfileOutSchema`
- **Obsługa:** Wywołanie przy submit formularza z walidacją i feedback

```typescript
// Przykład użycia
const updateProfile = async () => {
  try {
    const response = await profileUserProfileCbvUpdateProfile({
      body: {
        travel_style: formData.value.travel_style,
        preferred_pace: formData.value.preferred_pace,
        budget: formData.value.budget
      }
    })
    // Obsługa sukcesu
  } catch (error) {
    // Obsługa błędu
  }
}
```

## 8. Interakcje użytkownika

1. **Ładowanie widoku:**
   - Wyświetlenie spinera ładowania
   - Pobranie danych profilu z API
   - Wypełnienie formularza pobranymi danymi

2. **Zmiana wartości w select:**
   - Aktualizacja lokalnego stanu formularza
   - Usunięcie poprzednich komunikatów błędu/sukcesu

3. **Submit formularza:**
   - Walidacja danych lokalnie
   - Wyświetlenie stanu ładowania na przycisku
   - Wysłanie żądania PUT do API
   - Wyświetlenie komunikatu sukcesu lub błędu

4. **Obsługa błędów:**
   - Wyświetlenie komunikatu błędu pod formularzem
   - Utrzymanie danych formularza (nie resetowanie)

## 9. Warunki i walidacja

### Walidacja po stronie klienta

- **UserProfileView:** Sprawdzenie czy użytkownik jest uwierzytelniony przed załadowaniem
- **UserProfileForm:** Walidacja czy wszystkie wartości to poprawne enum values lub null
- **SelectInput:** Sprawdzenie czy wybrana opcja istnieje w dozwolonych wartościach

### Warunki wpływające na UI

- **Loading state:** Wyłączenie formularza podczas ładowania danych
- **Saving state:** Wyłączenie przycisku submit i wyświetlenie spinera
- **Error state:** Wyświetlenie komunikatu błędu i utrzymanie możliwości ponownego submit
- **Success state:** Wyświetlenie komunikatu sukcesu przez określony czas

### Walidacja API

- Obsługa błędów 400 (Bad Request) - niepoprawne enum values
- Obsługa błędów 422 (Validation Error) - szczegółowe błędy walidacji
- Obsługa błędów 401 (Unauthorized) - przekierowanie do logowania

## 10. Obsługa błędów

### Scenariusze błędów

1. **Błąd sieci (Network Error):**
   - Wyświetlenie komunikatu "Wystąpił problem z połączeniem. Spróbuj ponownie."
   - Utrzymanie danych formularza

2. **Błąd autoryzacji (401):**
   - Przekierowanie do strony logowania
   - Wyczyszczenie lokalnego stanu uwierzytelnienia

3. **Błędy walidacji (400/422):**
   - Wyświetlenie szczegółowych komunikatów błędów z API
   - Podświetlenie niepoprawnych pól

4. **Błąd serwera (5xx):**
   - Wyświetlenie ogólnego komunikatu błędu
   - Opcja ponownego wysłania

### Implementacja obsługi błędów

```typescript
try {
  await updateProfile()
  successMessage.value = "Profil został zaktualizowany pomyślnie!"
} catch (error) {
  if (error instanceof ApiError) {
    errorMessage.value = error.userMessage
  } else {
    errorMessage.value = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
  }
}
```

## 11. Kroki implementacji

1. **Przygotowanie typów i interfejsów:**
   - Utworzenie `ProfileFormData` interface
   - Utworzenie `SelectOption` interface
   - Zdefiniowanie stałych z opcjami dla select

2. **Implementacja komponentu SelectInput:**
   - Utworzenie generycznego komponentu select
   - Implementacja obsługi nullable values
   - Dodanie Flowbite styling

3. **Implementacja komponentu SubmitButton:**
   - Utworzenie przycisku z loading state
   - Implementacja disabled state

4. **Implementacja UserProfileForm:**
   - Połączenie SelectInput komponentów
   - Implementacja walidacji formularza
   - Obsługa submit wydarzenia

5. **Implementacja UserProfileView:**
   - Utworzenie głównego widoku z layout
   - Implementacja logiki pobierania danych
   - Integracja z API endpoints
   - Dodanie obsługi błędów i komunikatów

6. **Dodanie routingu:**
   - Skonfigurowanie chronionej trasy `/profile`
   - Dodanie navigation guards

7. **Testowanie i optymalizacja:**
   - Testowanie wszystkich scenariuszy użycia
   - Optymalizacja loading states
   - Sprawdzenie accessibility

8. **Integracja z istniejącym AuthStore:**
   - Wykorzystanie metod z authStore do zarządzania profilem
   - Aktualizacja store po zapisaniu profilu
