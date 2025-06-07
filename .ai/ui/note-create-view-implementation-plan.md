# Plan implementacji widoku NoteCreateView

## 1. Przegląd
Widok `NoteCreateView` umożliwia użytkownikom tworzenie nowych notatek podróżniczych. Formularz zawiera pola dla tytułu, miejsca, dat podróży, liczby osób oraz kluczowych pomysłów. Widok implementuje zarówno walidację po stronie klienta jak i serwera, obsługuje błędy oraz przekierowuje do szczegółów utworzonej notatki po pomyślnym zapisie.

## 2. Routing widoku
- **Ścieżka:** `/notes/new`
- **Typ:** Protected route (wymagana autoryzacja)
- **Layout:** BaseLayout
- **Przekierowania:**
  - Po sukcesie: `/notes/{id}` (NoteDetailView)
  - Po anulowaniu: `/notes` (NotesListView)
  - Bez autoryzacji: `/login`

## 3. Struktura komponentów
```
NoteCreateView
├── BaseLayout
│   └── main
│       ├── header
│       │   ├── h1 (Page title)
│       │   └── p (Description)
│       └── NoteCreateForm
│           ├── form
│           │   ├── TextInput (title)
│           │   ├── TextInput (place)
│           │   ├── DateInput (date_from)
│           │   ├── DateInput (date_to)
│           │   ├── NumberInput (number_of_people)
│           │   ├── TextareaInput (key_ideas)
│           │   └── ButtonGroup
│           │       ├── SubmitButton
│           │       └── CancelButton
```

## 4. Szczegóły komponentów

### NoteCreateView
- **Opis komponentu:** Główny kontener widoku odpowiedzialny za routing, layout i koordynację z NoteCreateForm
- **Główne elementy:** BaseLayout wrapper, page header z tytułem i opisem, NoteCreateForm component
- **Obsługiwane interakcje:** 
  - Przekazanie handler submit do NoteCreateForm
  - Nawigacja po sukcesie/anulowaniu
  - Obsługa błędów wysokopoziomowych
- **Obsługiwana walidacja:** Brak (delegowana do NoteCreateForm)
- **Typy:** `NoteOutSchema`, `ApiError`
- **Propsy:** Brak (główny widok)

### NoteCreateForm
- **Opis komponentu:** Samodzielny komponent formularza zawierający pełną logikę tworzenia notatki, stan formularza, walidację i integrację z API
- **Główne elementy:** HTML form element, grid layout dla dat, input components, button group, error handling
- **Obsługiwane interakcje:**
  - Zarządzanie stanem wszystkich pól formularza
  - Walidacja w czasie rzeczywistym i przy submit
  - API call do tworzenia notatki
  - Emit success/cancel events do parent
- **Obsługiwana walidacja:**
  - Client-side validation wszystkich pól
  - Server-side validation error handling
  - Custom validation dla zakresu dat
  - Character counting dla key_ideas
- **Typy:** `NoteCreateInSchema`, `NoteOutSchema`, `FormField`, `ValidationRule`, `ApiError`
- **Propsy:** `@success`, `@cancel`, `@error`

### TextInput
- **Opis komponentu:** Uniwersalny komponent tekstowy z walidacją i obsługą błędów
- **Główne elementy:** Label, input field, error message, help text
- **Obsługiwane interakcje:**
  - Real-time validation on blur
  - Error clearing on focus
  - Character counting (opcjonalnie)
- **Obsługiwana walidacja:**
  - Required field validation
  - Min/max length validation
  - Pattern matching (RegExp)
- **Typy:** `string`, `ValidationRule`, `FieldError`
- **Propsy:** `modelValue`, `label`, `id`, `placeholder?`, `required?`, `minLength?`, `maxLength?`, `error?`, `helpText?`

### DateInput
- **Opis komponentu:** Komponent daty wykorzystujący natywny HTML5 date input z custom walidacją zakresu
- **Główne elementy:** Label, date input field, error message, help text
- **Obsługiwane interakcje:**
  - Date range validation
  - Cross-field validation (date_from vs date_to)
  - Keyboard accessibility
- **Obsługiwana walidacja:**
  - Date format validation (YYYY-MM-DD)
  - Date range validation (max 14 dni)
  - Start date <= End date
- **Typy:** `string` (ISO date format), `DateValidationRule`
- **Propsy:** `modelValue`, `label`, `id`, `required?`, `min?`, `max?`, `error?`, `helpText?`

### NumberInput
- **Opis komponentu:** Komponent numeryczny z ograniczeniami min/max
- **Główne elementy:** Label, number input field, error message, help text
- **Obsługiwane interakcje:**
  - Numeric validation
  - Range validation
  - Increment/decrement controls
- **Obsługiwana walidacja:**
  - Numeric type validation
  - Min/max value validation (1-20)
  - Integer validation
- **Typy:** `number`, `NumberValidationRule`
- **Propsy:** `modelValue`, `label`, `id`, `min?`, `max?`, `step?`, `required?`, `error?`, `helpText?`

### TextareaInput
- **Opis komponentu:** Komponent textarea z licznikiem znaków i walidacją długości
- **Główne elementy:** Label, textarea field, character counter, error message, help text
- **Obsługiwane interakcje:**
  - Real-time character counting
  - Auto-resize (opcjonalnie)
  - Max length enforcement
- **Obsługiwana walidacja:**
  - Max length validation (5000 znaków)
  - Character counting display
- **Typy:** `string`, `TextValidationRule`
- **Propsy:** `modelValue`, `label`, `id`, `placeholder?`, `rows?`, `maxLength?`, `required?`, `error?`, `helpText?`

### SubmitButton
- **Opis komponentu:** Przycisk submit z obsługą loading state i walidacją formularza
- **Główne elementy:** Button element z primary styling, loading spinner, dynamic text
- **Obsługiwane interakcje:**
  - Form submission
  - Loading state display
  - Disable during processing
- **Obsługiwana walidacja:** Form validation check przed submitem
- **Typy:** `boolean` (isLoading), `string` (button text)
- **Propsy:** `isLoading?`, `disabled?`, `text?`, `loadingText?`

### CancelButton
- **Opis komponentu:** Przycisk anulowania z nawigacją powrotną
- **Główne elementy:** RouterLink jako button z secondary styling
- **Obsługiwane interakcje:** Nawigacja do poprzedniego widoku
- **Obsługiwana walidacja:** Brak
- **Typy:** `string` (route path)
- **Propsy:** `to`, `text?`

## 5. Typy

### Istniejące typy (z types.gen.ts)
```typescript
// Request/Response types
NoteCreateInSchema: {
  title: string
  place: string
  date_from: string  // YYYY-MM-DD format
  date_to: string    // YYYY-MM-DD format
  number_of_people: number
  key_ideas?: string | null
}

NoteOutSchema: {
  id: number
  user_id: string
  title: string
  place: string
  date_from: string
  date_to: string
  number_of_people: number
  key_ideas?: string | null
  created_at: string
  updated_at: string
}

ErrorModel: {
  detail: string | { [key: string]: string }
}

HttpValidationError: {
  detail?: Array<ValidationError>
}
```

### Nowe typy (do utworzenia)
```typescript
// Form management types
interface FormField<T = string> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

interface NoteFormData {
  title: FormField<string>
  place: FormField<string>
  date_from: FormField<string>
  date_to: FormField<string>
  number_of_people: FormField<number>
  key_ideas: FormField<string>
}

// Validation types
interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any, formData?: any) => string | null
}

interface FieldValidationRules {
  [fieldName: string]: ValidationRule[]
}

// API integration types
interface ApiError {
  message: string
  field?: string
  code?: string
}

interface FormState {
  isSubmitting: boolean
  hasChanges: boolean
  isValid: boolean
  errors: ApiError[]
}

// Component prop types
interface BaseInputProps {
  modelValue: any
  label: string
  id: string
  required?: boolean
  error?: string | null
  helpText?: string
  disabled?: boolean
}
```

## 6. Zarządzanie stanem

### Lokalny stan komponentu (NoteCreateForm)
```typescript
// Main form state w komponencie NoteCreateForm
const formData = ref<NoteFormData>({
  title: { value: '', error: null, touched: false, dirty: false },
  place: { value: '', error: null, touched: false, dirty: false },
  date_from: { value: '', error: null, touched: false, dirty: false },
  date_to: { value: '', error: null, touched: false, dirty: false },
  number_of_people: { value: 1, error: null, touched: false, dirty: false },
  key_ideas: { value: '', error: null, touched: false, dirty: false }
})

// Form state
const formState = ref<FormState>({
  isSubmitting: false,
  hasChanges: false,
  isValid: false,
  errors: []
})
```

### Struktura komponentu NoteCreateForm
```typescript
// NoteCreateForm.vue - samodzielny komponent z wbudowaną logiką
<script setup lang="ts">
interface Emits {
  (e: 'success', note: NoteOutSchema): void
  (e: 'cancel'): void
  (e: 'error', error: ApiError): void
}

// Lokalny stan formularza
// Funkcje walidacji
// Integracja z API
// Obsługa błędów
</script>
```

## 7. Integracja API

### Endpoint wykorzystywany
- **Funkcja:** `notesNoteCbvCreateNote` (z sdk.gen.ts)
- **Typ żądania:** `NotesNoteCbvCreateNoteData`
  ```typescript
  {
    body: NoteCreateInSchema
    path?: never
    query?: never
    url: '/api/v1/notes/'
  }
  ```
- **Typ odpowiedzi:** `NoteOutSchema` (success) | `ErrorModel` (error)

### Implementacja wywołania API w NoteCreateForm
```typescript
const submitNote = async (noteData: NoteCreateInSchema) => {
  try {
    formState.value.isSubmitting = true
    formState.value.errors = []
    
    const response = await notesNoteCbvCreateNote({
      body: noteData
    })
    
    // Emit success event do parent (NoteCreateView)
    emit('success', response.data)
    
  } catch (error) {
    handleApiError(error)
    emit('error', error)
  } finally {
    formState.value.isSubmitting = false
  }
}
```

## 8. Interakcje użytkownika

### Wypełnianie formularza
- **Akcja:** Użytkownik wpisuje tekst w pole
- **Obsługa:** Real-time validation, error clearing on focus, character counting
- **Wynik:** Aktualizacja stanu pola, wyświetlenie/ukrycie błędów

### Submit formularza
- **Akcja:** Kliknięcie przycisku "Create Note"
- **Obsługa:** Walidacja całego formularza, API call, loading state
- **Wynik:** Przekierowanie do szczegółów notatki lub wyświetlenie błędów

### Anulowanie
- **Akcja:** Kliknięcie przycisku "Cancel"
- **Obsługa:** Nawigacja bez zapisywania
- **Wynik:** Przekierowanie do listy notatek

### Walidacja dat
- **Akcja:** Zmiana daty w polach date_from/date_to
- **Obsługa:** Cross-field validation, sprawdzenie zakresu 14 dni
- **Wynik:** Aktualizacja błędów walidacji dla obu pól dat

## 9. Warunki i walidacja

### Walidacja po stronie klienta
- **title:** 3-255 znaków, wymagane
- **place:** 3-255 znaków, wymagane  
- **date_from:** format YYYY-MM-DD, wymagane, <= date_to
- **date_to:** format YYYY-MM-DD, wymagane, >= date_from, <= date_from + 14 dni
- **number_of_people:** 1-20, liczba całkowita, wymagane
- **key_ideas:** max 5000 znaków, opcjonalne

### Walidacja po stronie serwera
- **title:** unikalność w ramach użytkownika (409 Conflict)
- **Wszystkie pola:** szczegółowa walidacja (422 Validation Error)

### Wpływ na interfejs
- **Błędne pola:** czerwona ramka, komunikat błędu pod polem
- **Formularz nieprawidłowy:** przycisk submit disabled
- **Loading state:** spinner na przycisku, formularz disabled
- **Focus management:** przejście do pierwszego błędnego pola

## 10. Obsługa błędów

### Błędy walidacji (422)
```typescript
// Mapowanie błędów API na pola formularza
const handleValidationErrors = (errors: ValidationError[]) => {
  errors.forEach(error => {
    const fieldName = error.loc[error.loc.length - 1]
    if (formData.value[fieldName]) {
      formData.value[fieldName].error = error.msg
    }
  })
}
```

### Błąd konfliktu - title exists (409)
```typescript
// Wyświetlenie błędu przy polu title
formData.value.title.error = "Note with this title already exists"
```

### Błędy autoryzacji (401)
```typescript
// Przekierowanie do logowania
await router.push('/login')
```

### Błędy sieciowe
```typescript
// Generic error message
formState.value.errors = [{
  message: "Unable to create note. Please try again.",
  code: "network_error"
}]
```

### Obsługa timeout
```typescript
// 60s timeout dla API call
const controller = new AbortController()
setTimeout(() => controller.abort(), 60000)
```

## 11. Kroki implementacji

1. **Przygotowanie typów i interfejsów**
   - Utworzenie pliku `types/form.ts` z definicjami typów formularza
   - Definicja validation rules i error types

2. **Utworzenie komponentów UI**
   - `TextInput.vue` - uniwersalny input tekstowy
   - `DateInput.vue` - input dat z walidacją zakresu
   - `NumberInput.vue` - input numeryczny
   - `TextareaInput.vue` - textarea z licznikiem znaków
   - `SubmitButton.vue` - przycisk submit z loading state
   - `CancelButton.vue` - przycisk anulowania

3. **Implementacja komponentu NoteCreateForm**
   - Layout formularza z responsive grid
   - Integracja komponentów input
   - Lokalny stan formularza i logika walidacji
   - Walidacja cross-field dla dat
   - Integracja z API dla tworzenia notatki
   - Emit success/cancel/error events

4. **Aktualizacja NoteCreateView**
   - Integracja z NoteCreateForm component
   - Obsługa event handlers (success, cancel, error)
   - Implementacja nawigacji i przekierowań
   - Error boundary dla wysokopoziomowych błędów

5. **Konfiguracja routingu**
   - Dodanie protected route dla `/notes/new`
   - Konfiguracja navigation guards
   - Przekierowania po akcjach

6. **Testowanie i walidacja**
   - Unit testy dla NoteCreateForm i komponentów UI
   - Integration testy dla całego formularza
   - E2E testy dla całego flow tworzenia notatki
   - Accessibility testing

7. **Dokumentacja i optymalizacja**
   - Dokumentacja komponentów i ich interfejsów
   - Performance optimization
   - Bundle size analysis
   - Final code review
