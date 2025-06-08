# Plan implementacji widoku NoteEditView

## 1. Przegląd

Widok `NoteEditView` umożliwia użytkownikom edycję istniejących notatek podróżniczych. Po przejściu do tego widoku, formularz zostanie wstępnie wypełniony danymi wybranej notatki. Użytkownik może zmodyfikować dane i zapisać zmiany lub anulować edycję, powracając do widoku szczegółów notatki. Widok ten jest chroniony i dostępny tylko dla zalogowanych użytkowników będących właścicielami notatki.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/notes/:noteId/edit`
Parametr `:noteId` reprezentuje identyfikator edytowanej notatki. Ta ścieżka jest już zdefiniowana w `frontend/src/router/index.ts`.

## 3. Struktura komponentów

Hierarchia komponentów dla widoku `NoteEditView` będzie następująca:

```
NoteEditView.vue
├── (Element wskazujący ładowanie danych notatki, np. Spinner)
├── NoteForm.vue (komponent reużywalny)
│   ├── TextInput.vue (dla tytułu, miejsca)
│   ├── DateInput.vue (dla daty od, daty do - z Flowbite Datepicker)
│   ├── NumberInput.vue (dla liczby osób)
│   ├── TextareaInput.vue (dla kluczowych pomysłów)
│   ├── SubmitButton (przycisk "Zapisz zmiany", zintegrowany lub osobny)
│   └── CancelButton (przycisk "Anuluj", zintegrowany lub osobny)
└── (Miejsce na wyświetlanie komunikatów o błędach)
```

## 4. Szczegóły komponentów

### `NoteEditView.vue`

- **Opis komponentu:** Główny komponent widoku. Odpowiedzialny za:
  - Pobranie `noteId` z parametrów ścieżki.
  - Wczytanie danych notatki na podstawie `noteId` przy użyciu API.
  - Przekazanie wczytanych danych do komponentu `NoteForm` w celu ich wyświetlenia i edycji.
  - Obsługę zdarzeń zapisu (`@save`) i anulowania (`@cancel`) z `NoteForm`.
  - Komunikację z API w celu zapisania zmian w notatce.
  - Nawigację użytkownika po pomyślnym zapisie lub anulowaniu.
  - Wyświetlanie wskaźników ładowania i komunikatów o błędach.
- **Główne elementy HTML i komponenty dzieci:**
  - Kontener dla formularza.
  - Komponent `NoteForm`.
  - Elementy do wyświetlania stanu ładowania (np. `Spinner` z Flowbite).
  - Elementy do wyświetlania błędów (np. `Alert` z Flowbite).
- **Obsługiwane zdarzenia (od `NoteForm`):**
  - `save(formData: NoteUpdateInSchema)`: Wywoływane, gdy użytkownik chce zapisać zmiany.
  - `cancel()`: Wywoływane, gdy użytkownik anuluje edycję.
- **Warunki walidacji:** Delegowane do `NoteForm.vue`. `NoteEditView` obsługuje błędy walidacyjne zwrócone przez API (np. kod 422).
- **Typy:**
  - `NoteOutSchema` (do przechowywania danych wczytanej notatki).
  - `NoteUpdateInSchema` (do wysyłania zaktualizowanych danych do API).
  - `ApiErrorResponse`, `HttpValidationError` (do obsługi błędów).
- **Propsy:** Brak (jest to komponent widoku najwyższego poziomu dla tej ścieżki).

### `NoteForm.vue` (komponent reużywalny)

- **Opis komponentu:** Formularz służący do tworzenia i edycji notatek. W kontekście `NoteEditView`, będzie on wstępnie wypełniony danymi istniejącej notatki.
  - Składa się z pól formularza odpowiadających modelowi notatki.
  - Implementuje logikę walidacji pól formularza po stronie klienta.
  - Emituje zdarzenia `save` z danymi formularza lub `cancel`.
- **Główne elementy HTML i komponenty dzieci:**
  - Pola input dla: `title`, `place`, `date_from`, `date_to`, `number_of_people`, `key_ideas`. Wykorzystuje sub-komponenty takie jak `TextInput.vue`, `DateInput.vue`, `NumberInput.vue`, `TextareaInput.vue`.
  - Przyciski "Zapisz zmiany" (`SubmitButton`) i "Anuluj" (`CancelButton`).
- **Obsługiwane zdarzenia (emitowane):**
  - `save(formData: NoteUpdateInSchema)`: Emitowane po walidacji, gdy użytkownik klika przycisk zapisu.
  - `cancel()`: Emitowane, gdy użytkownik klika przycisk anulowania.
- **Warunki walidacji (zgodnie z API i PRD):**
  - `title`: Wymagane. Długość od 3 do 255 znaków. (Unikalność na użytkownika weryfikowana przez API).
  - `place`: Wymagane.
  - `date_from`: Wymagane. Poprawna data w formacie "YYYY-MM-DD".
  - `date_to`: Wymagane. Poprawna data w formacie "YYYY-MM-DD". Musi być równa lub późniejsza niż `date_from`.
  - `number_of_people`: Wymagane. Liczba całkowita dodatnia.
  - `key_ideas`: Opcjonalne. Maksymalna długość 5000 znaków.
- **Typy:**
  - Wewnętrzny model formularza, mapujący się na `NoteUpdateInSchema`.
- **Propsy (przyjmowane od `NoteEditView.vue`):**
  - `initialData: NoteOutSchema | null`: Obiekt z danymi notatki do wstępnego wypełnienia formularza.
  - `isSaving: boolean`: Informuje formularz o trwającym procesie zapisu (np. do dezaktywacji przycisku zapisu i wyświetlenia wskaźnika ładowania).
  - `isEditing: boolean` (ustawione na `true`): Może być używane do dostosowania etykiet lub zachowania (np. tekst przycisku "Zapisz zmiany" zamiast "Utwórz notatkę").

## 5. Typy

Do implementacji widoku `NoteEditView` wykorzystane zostaną następujące główne typy (zdefiniowane w `frontend/src/client/types.gen.ts`):

- **`NoteOutSchema`**: Służy do typowania danych notatki pobieranych z API (`GET /notes/{note_id}`).

  ```typescript
  export type NoteOutSchema = {
    id: number;
    user_id: string;
    title: string;
    place: string;
    date_from: string; // Format "YYYY-MM-DD"
    date_to: string;   // Format "YYYY-MM-DD"
    number_of_people: number;
    key_ideas?: string | null;
    created_at: string; // Format ISO datetime
    updated_at: string; // Format ISO datetime
  };
  ```

- **`NoteUpdateInSchema`**: Służy do typowania danych wysyłanych do API podczas aktualizacji notatki (`PUT /notes/{note_id}`). Komponent `NoteForm` będzie emitował dane zgodne z tym typem.

  ```typescript
  export type NoteUpdateInSchema = {
    title: string;
    place: string;
    date_from: string; // Format "YYYY-MM-DD"
    date_to: string;   // Format "YYYY-MM-DD"
    number_of_people: number;
    key_ideas?: string | null;
  };
  ```

- **`HttpValidationError`** i **`ErrorModel`**: Do obsługi błędów walidacji i innych błędów API.
- **Lokalny ViewModel dla formularza (wewnątrz `NoteForm.vue`):**
  Reaktywny obiekt (np. utworzony za pomocą `reactive` lub indywidualnych `ref`ów) przechowujący wartości pól formularza, inicjalizowany na podstawie `initialData`. Jego struktura będzie odpowiadać `NoteUpdateInSchema`.

## 6. Zarządzanie stanem

Stan w widoku `NoteEditView` będzie zarządzany głównie lokalnie w komponencie przy użyciu Vue 3 Composition API (`ref`, `reactive`).

- **`NoteEditView.vue`:**
  - `noteId: Ref<number>`: Przechowuje ID notatki pobrane z parametrów ścieżki.
  - `currentNote: Ref<NoteOutSchema | null>`: Przechowuje dane aktualnie edytowanej notatki, pobrane z API. Służy do przekazania jako `initialData` do `NoteForm`.
  - `isLoading: Ref<boolean>`: Wskaźnik ładowania danych notatki.
  - `isSaving: Ref<boolean>`: Wskaźnik trwającego procesu zapisu zmian.
  - `error: Ref<string | null>`: Przechowuje komunikaty o błędach (np. błędy API, błędy walidacji serwera).
- **`NoteForm.vue`:**
  - Będzie zarządzał stanem swoich pól formularza wewnętrznie, inicjalizując je na podstawie propa `initialData`.
- **Vuex Store (`stores/notes.ts`):**
  - Po pomyślnej aktualizacji notatki, `NoteEditView` powinien rozważyć zaktualizowanie odpowiedniej notatki w `notesStore`, jeśli jest tam przechowywana, aby zapewnić spójność danych w całej aplikacji. Można to zrobić poprzez wywołanie odpowiedniej akcji w store (np. `notesStore.updateCachedNote(updatedNoteData)`).

Nie przewiduje się potrzeby tworzenia nowego, dedykowanego hooka (composable) dla tego widoku, chyba że logika pobierania i edycji notatki okaże się bardziej złożona i reużywalna. Standardowe hooki Vue Router (`useRoute`, `useRouter`) będą używane.

## 7. Integracja API

Integracja z backendem będzie realizowana poprzez wywołania funkcji z wygenerowanego klienta API (`frontend/src/client/sdk.gen.ts`).

- **Pobieranie danych notatki:**
  - Po zamontowaniu komponentu `NoteEditView`, zostanie wywołana funkcja `notesNoteCbvGetNoteById`.
  - **Endpoint:** `GET /notes/{note_id}`
  - **Parametry:** `noteId` (pobrane z `useRoute().params`).
  - **Odpowiedź (sukces):** `NoteOutSchema`. Dane zostaną zapisane w `currentNote`.
  - **Odpowiedź (błąd):** Obsługa błędów 401, 403, 404 (szczegóły w sekcji "Obsługa błędów").
- **Aktualizacja notatki:**
  - Po otrzymaniu zdarzenia `save` od `NoteForm`, zostanie wywołana funkcja `notesNoteCbvUpdateNote`.
  - **Endpoint:** `PUT /notes/{note_id}`
  - **Parametry:** `noteId`.
  - **Ciało żądania:** `NoteUpdateInSchema` (dane z formularza).
  - **Odpowiedź (sukces):** Zaktualizowany obiekt `NoteOutSchema`. Użytkownik zostanie przekierowany do `NoteDetailView`.
  - **Odpowiedź (błąd):** Obsługa błędów 400, 401, 403, 404, 409, 422 (szczegóły w sekcji "Obsługa błędów").

## 8. Interakcje użytkownika

- **Wejście na stronę:** Użytkownik nawiguje do `/notes/:noteId/edit`.
  - System pobiera dane notatki. Wyświetlany jest wskaźnik ładowania.
  - Po załadowaniu, formularz `NoteForm` jest wypełniany danymi notatki.
- **Modyfikacja danych w formularzu:** Użytkownik zmienia wartości w polach formularza.
  - Walidacja po stronie klienta może wyświetlać komunikaty o błędach na bieżąco (np. przy utracie fokusu).
- **Kliknięcie "Zapisz zmiany":**
  - Formularz jest walidowany.
  - Jeśli walidacja klienta przejdzie pomyślnie, `NoteEditView` wysyła żądanie `PUT` do API. Przycisk "Zapisz zmiany" pokazuje stan ładowania.
  - **Sukces:** Użytkownik jest przekierowywany do widoku szczegółów notatki (`/notes/:noteId`). Może zostać wyświetlony komunikat o sukcesie (np. toast).
  - **Błąd:** Komunikat o błędzie jest wyświetlany w `NoteEditView`. Formularz pozostaje edytowalny.
- **Kliknięcie "Anuluj":**
  - Użytkownik jest przekierowywany z powrotem do widoku szczegółów notatki (`/notes/:noteId`) bez zapisywania zmian.
- **Próba dostępu bez uprawnień/do nieistniejącej notatki:**
  - Jeśli API zwróci 403 (brak uprawnień) lub 404 (notatka nie znaleziona) podczas pobierania danych, użytkownik zobaczy odpowiedni komunikat i może zostać przekierowany.

## 9. Warunki i walidacja

Walidacja będzie odbywać się na dwóch poziomach: po stronie klienta (w `NoteForm.vue`) i po stronie serwera (API).

- **Walidacja po stronie klienta (w `NoteForm.vue`):**
  - `title`: Wymagane, długość 3-255 znaków.
  - `place`: Wymagane.
  - `date_from`: Wymagane, poprawny format daty.
  - `date_to`: Wymagane, poprawny format daty, nie wcześniejsza niż `date_from`.
  - `number_of_people`: Wymagane, liczba dodatnia.
  - `key_ideas`: Maksymalnie 5000 znaków.
  - Komunikaty o błędach walidacji powinny być wyświetlane przy odpowiednich polach formularza. Stan przycisku "Zapisz zmiany" może zależeć od poprawności walidacji.
- **Walidacja po stronie serwera (obsługiwana w `NoteEditView.vue` po odpowiedzi z API):**
  - API zwróci kod `422 Unprocessable Entity` z szczegółami błędów walidacji, jeśli dane nie spełniają kryteriów serwera (np. `HttpValidationError`). Te błędy powinny być sparsowane i wyświetlone użytkownikowi, najlepiej przy odpowiednich polach formularza lub jako ogólny komunikat.
  - API zwróci kod `409 Conflict` jeśli tytuł notatki nie jest unikalny dla użytkownika. Ten błąd powinien być obsłużony i wyświetlony użytkownikowi.

## 10. Obsługa błędów

Błędy będą obsługiwane przy użyciu mechanizmów z `frontend/src/utils/api-errors.ts`.

- **Błędy pobierania danych notatki (`GET /notes/{note_id}`):**
  - `401 Unauthorized` (`AuthenticationError`): Przekierowanie na stronę logowania.
  - `403 Forbidden` (`AuthenticationError`): Wyświetlenie komunikatu "Nie masz uprawnień do edycji tej notatki." Możliwe przekierowanie na listę notatek.
  - `404 Not Found` (`NotFoundError`): Wyświetlenie komunikatu "Notatka nie została znaleziona." Możliwe przekierowanie na listę notatek.
  - Błędy sieciowe/serwera (`NetworkError`, `ServerError`, `UnknownApiError`): Wyświetlenie ogólnego komunikatu o błędzie.
- **Błędy zapisu zmian (`PUT /notes/{note_id}`):**
  - `400 Bad Request` (`BadRequestError`): Wyświetlenie komunikatu "Przesłano nieprawidłowe dane."
  - `401 Unauthorized`: Przekierowanie na stronę logowania.
  - `403 Forbidden`: Wyświetlenie komunikatu "Nie masz uprawnień do zapisu zmian w tej notatce."
  - `404 Not Found`: Wyświetlenie komunikatu "Notatka nie została znaleziona (nie można zapisać zmian)."
  - `409 Conflict` (`ConflictError`, np. `NoteAlreadyExistsError` jeśli pasuje, lub specyficzny komunikat): Wyświetlenie komunikatu "Notatka o tym tytule już istnieje. Wybierz inny tytuł."
  - `422 Unprocessable Entity` (`ApiValidationError`): Sparsowanie błędów walidacji z odpowiedzi API i wyświetlenie ich użytkownikowi (np. pod odpowiednimi polami formularza lub jako lista).
  - Błędy sieciowe/serwera: Wyświetlenie ogólnego komunikatu o błędzie.

Komponent `NoteEditView` powinien zawierać dedykowane miejsce na wyświetlanie tych błędów (np. komponent `Alert` z Flowbite).

## 11. Kroki implementacji

1. **Utworzenie pliku `NoteEditView.vue`:**
    - Stworzyć plik `frontend/src/views/NoteEditView.vue`.
    - Zaimplementować podstawową strukturę komponentu Vue 3 z `<script setup lang="ts">` i `<template>`.
2. **Implementacja logiki pobierania danych:**
    - W `setup` `NoteEditView.vue`, użyć `useRoute` do pobrania `noteId`.
    - Zdefiniować reaktywne zmienne stanu: `currentNote`, `isLoading`, `error`.
    - W hooku `onMounted` (lub `watchEffect` na `noteId`), wywołać `notesNoteCbvGetNoteById` z SDK.
    - Obsłużyć stany ładowania (ustawić `isLoading` na `true` przed wywołaniem API, na `false` po).
    - Obsłużyć sukces: zapisać dane w `currentNote`.
    - Obsłużyć błędy API (401, 403, 404, błędy serwera) i ustawić odpowiedni komunikat w `error`.
3. **Integracja `NoteForm.vue`:**
    - Zaimportować i użyć komponentu `NoteForm` w szablonie `NoteEditView.vue`.
    - Przekazać `currentNote` jako prop `initialData` do `NoteForm`.
    - Przekazać `isSaving` jako prop do `NoteForm`.
    - Przekazać `isEditing={true}` jako prop.
    - Dostosować `NoteForm.vue` (jeśli to konieczne), aby poprawnie przyjmował i przetwarzał `initialData` oraz prop `isEditing` (np. do zmiany tekstu przycisku submit). Upewnić się, że pola daty poprawnie obsługują format string "YYYY-MM-DD" z API i ewentualnie konwertują go na obiekty `Date` dla komponentu `DateInput` i z powrotem na string przy zapisie.
4. **Implementacja logiki zapisu zmian:**
    - W `NoteEditView.vue`, zdefiniować funkcję `handleSave(formData: NoteUpdateInSchema)`.
    - Ta funkcja będzie wywoływana przez zdarzenie `@save` z `NoteForm`.
    - Ustawić `isSaving` na `true`.
    - Wywołać `notesNoteCbvUpdateNote` z SDK, przekazując `noteId` i `formData`.
    - Obsłużyć sukces:
        - Zresetować `isSaving`.
        - Opcjonalnie: zaktualizować `notesStore`.
        - Użyć `useRouter().push()` do przekierowania na `/notes/${noteId}`.
        - Opcjonalnie: wyświetlić komunikat toast o sukcesie.
    - Obsłużyć błędy API (400, 401, 403, 404, 409, 422, błędy serwera):
        - Zresetować `isSaving`.
        - Ustawić odpowiedni komunikat w `error`. Dla błędu 422, sparsować szczegóły walidacji.
5. **Implementacja logiki anulowania:**
    - W `NoteEditView.vue`, zdefiniować funkcję `handleCancel()`.
    - Ta funkcja będzie wywoływana przez zdarzenie `@cancel` z `NoteForm`.
    - Użyć `useRouter().push()` do przekierowania na `/notes/${noteId}`.
6. **UI/UX:**
    - Dodać wskaźniki ładowania (np. `Spinner`) w `NoteEditView.vue` podczas pobierania danych i zapisywania zmian.
    - Dodać wyświetlanie komunikatów o błędach (np. komponent `Alert` z Flowbite).
    - Upewnić się, że formularz jest odpowiednio stylizowany zgodnie z Tailwind CSS i Flowbite, nawiązując do stylu `NoteCreateView.vue`.
7. **Testowanie:**
    - Przetestować ręcznie wszystkie ścieżki użytkownika:
        - Pomyślne załadowanie i wyświetlenie danych notatki.
        - Pomyślna edycja i zapis notatki.
        - Anulowanie edycji.
        - Obsługa różnych błędów API (walidacja, konflikty, brak autoryzacji, notatka nie znaleziona).
        - Zachowanie wskaźników ładowania.
    - Sprawdzić responsywność widoku.
8. **Refaktoryzacja i czyszczenie kodu:**
    - Upewnić się, że kod jest czysty, dobrze skomentowany i zgodny z przyjętymi standardami w projekcie.
    - Sprawdzić, czy wszystkie typy są poprawnie używane.

```
