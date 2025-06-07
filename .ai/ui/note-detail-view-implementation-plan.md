# Plan implementacji widoku NoteDetailView

## 1. Przegląd

Widok `NoteDetailView` służy do wyświetlania szczegółów wybranej notatki oraz zarządzania powiązanym z nią planem podróży. Umożliwia generowanie planu przez AI, jego manualną edycję oraz zapisywanie. Widok ten jest kluczowym elementem aplikacji, gdzie użytkownik wchodzi w interakcję z główną funkcjonalnością generowania i dostosowywania planów podróży.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką: `/notes/:noteId`, gdzie `:noteId` to identyfikator notatki.

## 3. Struktura komponentów

```
NoteDetailView.vue (/notes/:noteId)
├── BaseLayout.vue (Layout główny aplikacji)
│   ├── div.container (Główny kontener widoku)
│   │   ├── h1 (Tytuł widoku, np. "Szczegóły Notatki")
│   │   ├── NoteDisplaySection.vue (Sekcja wyświetlająca dane notatki)
│   │   ├── div.actions-bar (Pasek z przyciskami akcji dla notatki)
│   │   │   ├── EditNoteButton.vue (Przycisk/link do edycji notatki)
│   │   │   └── DeleteNoteButton.vue (Przycisk do usuwania notatki)
│   │   ├── PlanSection.vue (Główna sekcja zarządzania planem)
│   │   │   ├── PlanTypeLabel.vue (Etykieta typu planu)
│   │   │   ├── PlanEditorTextarea.vue (Textarea do edycji planu)
│   │   │   ├── CharacterCounter.vue (Licznik znaków dla textarea)
│   │   │   ├── GeneratePlanButton.vue (Przycisk generowania planu AI)
│   │   │   └── SaveChangesPlanButton.vue (Przycisk zapisywania zmian w planie)
│   ├── ConfirmationModal.vue (Modal do potwierdzenia usunięcia notatki)
│   └── ConfirmationModal.vue (Modal do potwierdzenia nadpisania propozycji AI - `OverwritePlanModal`)
└── AppToast.vue (Komponent do wyświetlania powiadomień, zarządzany globalnie lub przez composable)
```

## 4. Szczegóły komponentów

### `NoteDetailView.vue`

- **Opis komponentu:** Główny kontener widoku, odpowiedzialny za pobranie danych notatki i planu, zarządzanie stanem ładowania i błędów oraz koordynację komponentów podrzędnych.
- **Główne elementy HTML i komponenty dzieci:** `BaseLayout`, `NoteDisplaySection`, `EditNoteButton`, `DeleteNoteButton`, `PlanSection`, `ConfirmationModal`.
- **Obsługiwane interakcje:** Pobieranie danych notatki i planu przy załadowaniu, obsługa nawigacji do edycji notatki, inicjowanie procesu usuwania notatki.
- **Warunki walidacji:** Sprawdzenie, czy `noteId` jest dostępne w parametrach ścieżki.
- **Typy:** `RouteParams` (dla `noteId`), `NoteRead`, `PlanRead`.
- **Propsy:** Brak (pobiera `noteId` z `$route.params`).

### `NoteDisplaySection.vue`

- **Opis komponentu:** Wyświetla szczegółowe informacje o notatce w trybie tylko do odczytu.
- **Główne elementy HTML:** `div`y, `span`y, `p` do wyświetlania pól: `title`, `place`, `date_from`, `date_to`, `number_of_people`, `key_ideas`.
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie).
- **Warunki walidacji:** Brak.
- **Typy:** `NoteRead`.
- **Propsy:**
  - `note: { type: Object as PropType<NoteRead>, required: true }`

### `EditNoteButton.vue`

- **Opis komponentu:** Przycisk lub link nawigujący do widoku edycji notatki (`NoteEditView`).
- **Główne elementy HTML:** `<router-link>` lub `<button>` stylizowany przez Flowbite.
- **Obsługiwane interakcje:** Kliknięcie powoduje nawigację do `/notes/:noteId/edit`.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `noteId: { type: [String, Number], required: true }`

### `DeleteNoteButton.vue`

- **Opis komponentu:** Przycisk inicjujący proces usuwania notatki (otwiera modal potwierdzający).
- **Główne elementy HTML:** `<button>` stylizowany przez Flowbite.
- **Obsługiwane interakcje:** Kliknięcie emituje zdarzenie `open-delete-modal`.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `isLoading: { type: Boolean, default: false }` (do wyświetlania stanu ładowania na przycisku)

### `PlanSection.vue`

- **Opis komponentu:** Centralny komponent do interakcji z planem podróży. Zarządza stanem edytora planu, typem planu oraz komunikacją z API planów.
- **Główne elementy HTML i komponenty dzieci:** `PlanTypeLabel`, `PlanEditorTextarea`, `CharacterCounter`, `GeneratePlanButton`, `SaveChangesPlanButton`.
- **Obsługiwane interakcje:** Wprowadzanie tekstu planu, generowanie planu AI, zapisywanie planu.
- **Warunki walidacji:** Długość tekstu planu (max 5000 znaków) - walidacja wizualna przez `CharacterCounter` i blokada zapisu.
- **Typy:** `PlanTypeEnum`, `PlanStoreState` (lub odpowiednie propsy i emitowane zdarzenia, jeśli stan jest zarządzany wyżej).
- **Propsy:**
  - `noteId: { type: [String, Number], required: true }`

### `PlanTypeLabel.vue`

- **Opis komponentu:** Wyświetla aktualny typ planu (AI, MANUAL, HYBRID).
- **Główne elementy HTML:** `<span>` lub `<p>`.
- **Obsługiwane interakcje:** Brak (dynamicznie aktualizowany).
- **Warunki walidacji:** Brak.
- **Typy:** `PlanTypeEnum`.
- **Propsy:**
  - `planType: { type: String as PropType<PlanTypeEnum | null>, default: null }`

### `PlanEditorTextarea.vue`

- **Opis komponentu:** Pole tekstowe (`<textarea>`) do wprowadzania i edycji tekstu planu.
- **Główne elementy HTML:** `<textarea>` stylizowana przez Flowbite.
- **Obsługiwane interakcje:** Wprowadzanie tekstu emituje zdarzenie `update:modelValue`.
- **Warunki walidacji:** Brak (obsługiwane przez rodzica lub `CharacterCounter`).
- **Typy:** Brak.
- **Propsy:**
  - `modelValue: { type: String, required: true }`
  - `maxLength: { type: Number, default: 5000 }`
  - `disabled: { type: Boolean, default: false }`

### `CharacterCounter.vue`

- **Opis komponentu:** Wyświetla licznik znaków dla `PlanEditorTextarea` (np. "123 / 5000") i zmienia kolor na czerwony po przekroczeniu limitu.
- **Główne elementy HTML:** `<span>` lub `<p>`.
- **Obsługiwane interakcje:** Brak (dynamicznie aktualizowany).
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `currentLength: { type: Number, required: true }`
  - `maxLength: { type: Number, required: true }`

### `GeneratePlanButton.vue`

- **Opis komponentu:** Przycisk do generowania planu AI. Zawsze aktywny (chyba że trwa generowanie). Pokazuje stan ładowania.
- **Główne elementy HTML:** `<button>` z ikoną spinnera Flowbite.
- **Obsługiwane interakcje:** Kliknięcie emituje zdarzenie `generate`.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `isLoading: { type: Boolean, default: false }`

### `SaveChangesPlanButton.vue`

- **Opis komponentu:** Przycisk do zapisywania zmian w planie. Aktywny, jeśli tekst planu został zmodyfikowany lub istnieje niezapisana propozycja AI. Pokazuje stan ładowania.
- **Główne elementy HTML:** `<button>` Flowbite.
- **Obsługiwane interakcje:** Kliknięcie emituje zdarzenie `save`.
- **Warunki walidacji:** Brak (stan `disabled` zarządzany przez props).
- **Typy:** Brak.
- **Propsy:**
  - `isLoading: { type: Boolean, default: false }`
  - `isDisabled: { type: Boolean, default: false }`

### `ConfirmationModal.vue` (Generyczny komponent Flowbite Modal)

- **Opis komponentu:** Modal do uzyskiwania potwierdzenia od użytkownika przed wykonaniem krytycznych akcji.
- **Główne elementy HTML:** Struktura modala Flowbite.
- **Obsługiwane interakcje:** Potwierdzenie (emituje `confirm`), anulowanie (emituje `cancel`).
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:**
  - `isVisible: { type: Boolean, required: true }`
  - `title: { type: String, required: true }`
  - `message: { type: String, required: true }`
  - `confirmText: { type: String, default: 'Potwierdź' }`
  - `cancelText: { type: String, default: 'Anuluj' }`

## 5. Typy

Na podstawie `frontend/src/client/types.gen.ts` oraz wymagań widoku:

- **`NoteRead`**: (z `types.gen.ts`) Obiekt notatki pobrany z API.

  ```typescript
  interface NoteRead {
    id: number;
    user_id: string;
    title: string;
    place?: string | null;
    date_from?: string | null; // Format YYYY-MM-DD
    date_to?: string | null;   // Format YYYY-MM-DD
    number_of_people?: number | null;
    key_ideas?: string | null;
    created_at: string; // ISO DateTime
    updated_at: string; // ISO DateTime
  }
  ```

- **`PlanRead`**: (z `types.gen.ts`) Obiekt planu pobrany z API.

  ```typescript
  interface PlanRead {
    plan_id: string; // UUID
    note_id: number;
    plan_text: string;
    plan_type: PlanTypeEnumApi; // 'AI', 'MANUAL', 'HYBRID' z API
    plan_status: string; // np. 'ACTIVE', 'PENDING_AI'
    generation_id?: string | null; // UUID
    created_at: string; // ISO DateTime
    updated_at: string; // ISO DateTime
  }
  ```

- **`PlanGenerationResult`**: (z `types.gen.ts`) Odpowiedź z `POST /notes/{note_id}/plan/generate`.

  ```typescript
  interface PlanGenerationResult {
    generation_id: string; // UUID
    plan_text: string;
    status: string; // np. 'PENDING_AI'
  }
  ```

- **`PlanCreateIn`**: (z `types.gen.ts`) Typ dla `POST /notes/{note_id}/plan`.

  ```typescript
  interface PlanCreateIn {
    generation_id?: string | null;
    plan_text?: string | null;
  }
  ```

- **`PlanUpdateIn`**: (z `types.gen.ts`) Typ dla `PUT /notes/{note_id}/plan`.

  ```typescript
  interface PlanUpdateIn {
    plan_text: string;
  }
  ```

- **`PlanTypeEnum`**: Lokalny typ dla stanu planu w UI.

  ```typescript
  type PlanTypeEnum = 'AI' | 'MANUAL' | 'HYBRID' | null;
  ```

- **`PlanStoreState`**: Stan dla Pinia store (`planStore`).

  ```typescript
  interface PlanStoreState {
    activeNoteId: number | string | null; // ID notatki, której plan dotyczy
    planId: string | null;          // ID zapisanego planu (z PlanRead.plan_id)
    planText: string;               // Aktualny tekst planu w edytorze
    currentPlanType: PlanTypeEnum;  // Aktualny typ planu (AI, MANUAL, HYBRID)
    generationId: string | null;    // ID ostatniej generacji AI (z PlanGenerationResult.generation_id)
    originalPlanTextForAI: string | null; // Oryginalny tekst z propozycji AI, do wykrywania zmian
    isModified: boolean;            // Czy planText został zmodyfikowany od ostatniego zapisu/załadowania
    // Stany ładowania
    isGeneratingPlan: boolean;
    isSavingPlan: boolean;
    isLoadingInitialPlan: boolean;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem planu będzie realizowane za pomocą dedykowanego modułu Pinia store o nazwie `planStore`.

**`stores/plan.ts`**:

- **State**: Zgodny z `PlanStoreState` opisanym powyżej.
- **Getters**:
  - `isPlanTextTooLong`: `(state) => state.planText.length > 5000`
  - `canSaveChanges`: `(state) => (state.isModified || (state.generationId !== null && state.planId === null)) && !this.isPlanTextTooLong` (logika dla aktywności przycisku "Save Changes")
- **Actions**:
  - `setActiveNoteId(noteId: number | string)`: Ustawia `activeNoteId` i resetuje resztę stanu.
  - `setInitialPlanData(planData: PlanRead)`: Ustawia stan na podstawie załadowanego planu.
    - `planId = planData.plan_id`
    - `planText = planData.plan_text`
    - `currentPlanType = planData.plan_type` (mapowanie z API na `PlanTypeEnum`)
    - `generationId = planData.generation_id`
    - `isModified = false`
    - `originalPlanTextForAI = planData.plan_type === 'AI' ? planData.plan_text : null`
  - `clearPlanData()`: Resetuje stan planu (gdy nie ma planu dla notatki lub przy opuszczaniu widoku).
  - `updatePlanText(newText: string)`: Aktualizuje `planText`.
    - `planText = newText`
    - `isModified = true`
    - Jeśli `currentPlanType === 'AI'` i `newText !== originalPlanTextForAI`, zmień `currentPlanType` na `'HYBRID'`.
    - Jeśli `originalPlanTextForAI` był `null` (lub plan był pusty) i `newText` nie jest pusty, ustaw `currentPlanType` na `'MANUAL'`.
  - `setGeneratedAIPlan(data: PlanGenerationResult)`: Ustawia stan po pomyślnym wygenerowaniu planu AI.
    - `planText = data.plan_text`
    - `currentPlanType = 'AI'`
    - `generationId = data.generation_id`
    - `originalPlanTextForAI = data.plan_text`
    - `isModified = false` // Świeżo wygenerowany, niezmodyfikowany
    - `planId = null`     // To nowa propozycja, nie zapisana, więc nie ma `planId`
  - `setSavedPlan(savedPlanData: PlanRead)`: Aktualizuje stan po zapisaniu planu.
    - `planId = savedPlanData.plan_id`
    - `planText = savedPlanData.plan_text`
    - `currentPlanType = savedPlanData.plan_type` (mapowanie)
    - `isModified = false`
    - `generationId = savedPlanData.generation_id` (może być `null` jeśli zapisano jako MANUAL lub HYBRID bez nowego `generation_id`)
    - `originalPlanTextForAI = savedPlanData.plan_type === 'AI' ? savedPlanData.plan_text : null`

W komponencie `NoteDetailView.vue` będą używane lokalne `ref`y do zarządzania stanem ładowania danych notatki (`isLoadingNote`, `errorNote`) oraz stanem modali (`showDeleteNoteModal`, `showOverwritePlanModal`).

## 7. Integracja API

Integracja z API będzie realizowana za pomocą wygenerowanego klienta `frontend/src/client/sdk.gen.ts`.

- **Pobieranie danych notatki:**
  - `GET /notes/{note_id}` -> `NotesService.getNote({ noteId })`
  - Wywoływane w `NoteDetailView` przy `onMounted`.
  - Odpowiedź: `NoteRead`.
- **Pobieranie danych planu:**
  - `GET /notes/{note_id}/plan` -> `PlansService.getPlan({ noteId })`
  - Wywoływane w `NoteDetailView` przy `onMounted`, po pobraniu notatki.
  - Odpowiedź: `PlanRead` lub `204 No Content`. Jeśli 204, `planStore.clearPlanData()`. Jeśli `PlanRead`, `planStore.setInitialPlanData()`.
- **Generowanie planu AI:**
  - `POST /notes/{note_id}/plan/generate` -> `PlansService.generatePlanForNote({ noteId })`
  - Wywoływane przez `PlanSection` (lub akcję w `planStore`).
  - Request Payload: Brak.
  - Odpowiedź: `PlanGenerationResult`. Sukces: `planStore.setGeneratedAIPlan()`.
- **Zapisywanie nowego planu (Create/Accept):**
  - `POST /notes/{note_id}/plan` -> `PlansService.createPlanForNote({ noteId, requestBody })`
  - Wywoływane przez `PlanSection` (lub akcję w `planStore`).
  - Request Payload (`PlanCreateIn`):
    - Akceptacja AI: `{ generation_id: planStore.generationId, plan_text: planStore.planText }` (lub tylko `generation_id` jeśli API na to pozwala i `plan_text` jest taki sam jak w propozycji)
    - Plan hybrydowy: `{ generation_id: planStore.generationId, plan_text: planStore.planText }`
    - Plan manualny: `{ plan_text: planStore.planText }`
  - Odpowiedź: `PlanRead`. Sukces: `planStore.setSavedPlan()`.
- **Aktualizacja istniejącego planu:**
  - `PUT /notes/{note_id}/plan` -> `PlansService.updatePlanForNote({ noteId, requestBody })` (zakładając, że `planId` jest częścią ścieżki lub identyfikowany przez backend na podstawie `noteId` jako aktywny plan; jeśli `planId` jest wymagany w ścieżce, endpoint w SDK może być inny, np. `PlansService.updatePlanById({ planId, requestBody })`). Zgodnie z opisem endpointu, `planId` nie jest w ścieżce, więc backend musi sam zidentyfikować aktywny plan do aktualizacji.
  - Wywoływane przez `PlanSection` (lub akcję w `planStore`), jeśli `planStore.planId` istnieje.
  - Request Payload (`PlanUpdateIn`): `{ plan_text: planStore.planText }`.
  - Odpowiedź: `PlanRead`. Sukces: `planStore.setSavedPlan()`.
- **Usuwanie notatki:**
  - `DELETE /notes/{note_id}` -> `NotesService.deleteNote({ noteId })`
  - Wywoływane w `NoteDetailView` po potwierdzeniu w modalu.
  - Sukces: Nawigacja do listy notatek, toast.

## 8. Interakcje użytkownika

- **Załadowanie widoku:**
  - Wyświetlany jest loader.
  - Pobierane są dane notatki i planu.
  - Po załadowaniu, `NoteDisplaySection` pokazuje dane notatki, a `PlanSection` stan planu (pusty, tekst planu, typ).
- **Kliknięcie "Edytuj Notatkę":** Nawigacja do `/notes/:noteId/edit`.
- **Kliknięcie "Usuń Notatkę":** Otwiera `ConfirmationModal` ("Czy na pewno chcesz usunąć notatkę?").
  - Potwierdzenie: Wywołanie API usuwania notatki. Po sukcesie, nawigacja do listy notatek i toast.
  - Anulowanie: Zamknięcie modala.
- **Wpisywanie tekstu w `PlanEditorTextarea`:**
  - `planStore.planText` jest aktualizowany.
  - `CharacterCounter` pokazuje aktualną liczbę znaków.
  - `planStore.isModified` ustawiane na `true`.
  - `planStore.currentPlanType` może się zmienić (np. z 'AI' na 'HYBRID', lub z pustego na 'MANUAL').
  - Przycisk "Zapisz Zmiany" staje się aktywny (jeśli warunki spełnione).
- **Kliknięcie "Generuj Plan":**
  - Jeśli `planStore.planText` nie jest pusty lub `planStore.isModified` jest `true`: Otwiera `OverwritePlanModal` ("Masz niezapisane zmiany lub istniejącą propozycję. Czy chcesz ją nadpisać i wygenerować nowy plan?").
    - Potwierdzenie: Kontynuuj generowanie.
    - Anulowanie: Zamknij modal, focus wraca na przycisk "Generuj Plan".
  - Przycisk "Generuj Plan" pokazuje loader i jest nieaktywny.
  - Wywołanie API generowania planu.
  - Sukces: `PlanEditorTextarea` wypełniona tekstem z AI, `planStore` zaktualizowany (`currentPlanType`='AI', `generationId` ustawione, `isModified`=false). Toast "Plan AI wygenerowany pomyślnie". Przycisk "Zapisz Zmiany" aktywny.
  - Błąd: Toast "Nie udało się wygenerować planu. Spróbuj ponownie." Przycisk "Generuj Plan" ponownie aktywny.
- **Kliknięcie "Zapisz Zmiany":**
  - Przycisk pokazuje loader i jest nieaktywny.
  - Wywołanie API zapisu/aktualizacji planu (logika w `planStore` decyduje czy POST czy PUT i jaki payload).
  - Sukces: `planStore` zaktualizowany (`planId` ustawione, `isModified`=false). Toast "Plan zapisany pomyślnie" / "Plan zaktualizowany pomyślnie". Focus pozostaje w edytorze planu.
  - Błąd: Toast "Nie udało się zapisać planu." Przycisk "Zapisz Zmiany" ponownie aktywny (jeśli błąd nie był walidacyjny).

## 9. Warunki i walidacja

- **Dostęp do widoku:** Tylko dla zalogowanych użytkowników. Implementowane przez `navigation-guards.ts`. Backend dodatkowo weryfikuje własność notatki.
- **Tekst planu (`plan_text`):** Maksymalnie 5000 znaków.
  - `CharacterCounter` wizualizuje limit.
  - `SaveChangesPlanButton` powinien być nieaktywny, jeśli limit przekroczony (sprawdzane przez getter `isPlanTextTooLong` w `planStore`).
  - Backendowa walidacja (HTTP 422).
- **Aktywność przycisku `SaveChangesPlanButton`:**
  - Aktywny, gdy (`planStore.isModified === true` LUB (`planStore.generationId !== null` I `planStore.planId === null`)) ORAZ `planStore.planText.length <= 5000`.
- **Aktywność przycisku `GeneratePlanButton`:**
  - Zawsze aktywny, chyba że trwa proces generowania (`planStore.isGeneratingPlan === true`).

## 10. Obsługa błędów

- **Błędy API (ogólne):** Wyświetlanie komunikatów błędów za pomocą Flowbite toasts (np. "Wystąpił błąd serwera", "Brak połączenia z internetem").
- **Błąd pobierania notatki (`GET /notes/{note_id}`):**
  - 401 Unauthorized: Automatyczne wylogowanie (obsługiwane przez interceptor API).
  - 403 Forbidden: Toast "Nie masz uprawnień do tej notatki." i ewentualnie przekierowanie.
  - 404 Not Found: Toast "Notatka nie została znaleziona." i przekierowanie na stronę 404 lub listę notatek.
- **Błąd pobierania planu (`GET /notes/{note_id}/plan`):**
  - 404 Not Found (jeśli nie jest traktowane jako 204): Traktowane jako brak planu, `planStore.clearPlanData()`.
- **Błąd generowania planu (`POST /notes/{note_id}/plan/generate`):**
  - 5xx, timeout: Toast "Wystąpił błąd podczas generowania planu. Spróbuj ponownie."
- **Błąd zapisywania/aktualizacji planu (`POST` lub `PUT /notes/{note_id}/plan`):**
  - 400 Bad Request, 422 Unprocessable Entity: Toast z komunikatem błędu walidacji (np. "Tekst planu jest za długi.").
  - 409 Conflict (dla POST, jeśli aktywny plan już istnieje): Toast "Aktywny plan już istnieje. Aby go zmodyfikować, edytuj go i zapisz." (Chociaż logika UI powinna używać PUT w takim przypadku).
- **Modale potwierdzające:** Używane przed krytycznymi operacjami (usuwanie notatki, nadpisywanie planu AI).

## 11. Kroki implementacji

1. **Utworzenie plików:**
    - Utwórz plik widoku `frontend/src/views/NoteDetailView.vue`.
    - Utwórz komponenty `frontend/src/components/notes/NoteDisplaySection.vue`, `frontend/src/components/notes/EditNoteButton.vue`, `frontend/src/components/notes/DeleteNoteButton.vue`.
    - Utwórz komponent `frontend/src/components/plans/PlanSection.vue` oraz jego subkomponenty: `PlanTypeLabel.vue`, `PlanEditorTextarea.vue`, `CharacterCounter.vue`, `GeneratePlanButton.vue`, `SaveChangesPlanButton.vue` w katalogu `frontend/src/components/plans/`.
    - Jeśli `ConfirmationModal.vue` nie istnieje jako generyczny komponent, stwórz go (np. w `frontend/src/components/ui/`).
2. **Routing:** Dodaj nową ścieżkę w `frontend/src/router/index.ts` dla `NoteDetailView`, zabezpieczając ją `beforeEnter: requireAuth`.
3. **Store Pinia:** Zdefiniuj `planStore` w `frontend/src/stores/plan.ts` zgodnie z opisem w sekcji "Zarządzanie stanem".
4. **Implementacja `NoteDetailView.vue`:**
    - Podstawowa struktura HTML z użyciem `BaseLayout`.
    - Logika `onMounted` do pobierania `noteId` z `$route.params`.
    - Wywołanie akcji pobierania danych notatki (np. z `notesStore` lub bezpośrednio API) i planu (inicjalizacja `planStore`).
    - Obsługa stanów ładowania i błędów dla pobierania danych.
    - Integracja `NoteDisplaySection`, `EditNoteButton`, `DeleteNoteButton`, `PlanSection`.
    - Implementacja logiki dla `DeleteNoteButton` (modal, wywołanie API, nawigacja, toast).
    - Implementacja modala `OverwritePlanModal`.
5. **Implementacja `NoteDisplaySection.vue`:** Wyświetlanie danych notatki przekazanych przez props.
6. **Implementacja `EditNoteButton.vue` i `DeleteNoteButton.vue`:** Proste komponenty z nawigacją lub emisją zdarzeń.
7. **Implementacja `PlanSection.vue`:**
    - Użycie `planStore` do odczytu stanu i wywoływania akcji.
    - Integracja subkomponentów (`PlanTypeLabel`, `PlanEditorTextarea`, etc.).
    - Przekazywanie propsów i obsługa zdarzeń od subkomponentów.
    - Logika wywoływania akcji generowania i zapisywania planu z `planStore`.
8. **Implementacja subkomponentów `PlanSection`:**
    - `PlanTypeLabel.vue`: Wyświetla `planStore.currentPlanType`.
    - `PlanEditorTextarea.vue`: Dwukierunkowe bindowanie z `planStore.planText` (przez akcję `updatePlanText`).
    - `CharacterCounter.vue`: Wyświetla `planStore.planText.length` i `maxLength`.
    - `GeneratePlanButton.vue`: Wywołuje akcję generowania planu; stan `isLoading` z `planStore.isGeneratingPlan`.
    - `SaveChangesPlanButton.vue`: Wywołuje akcję zapisywania planu; stany `isLoading` i `isDisabled` z `planStore`.
9. **Komponent `ConfirmationModal.vue`:** Implementacja generycznego modala Flowbite.
10. **Powiadomienia Toast:** Użyj istniejącego systemu toastów (np. Flowbite Toasts) do wyświetlania informacji o sukcesie/błędzie operacji. Można stworzyć composable `useToasts` jeśli jeszcze nie istnieje.
11. **Styling:** Użyj Tailwind CSS i komponentów Flowbite do ostylowania wszystkich elementów zgodnie z projektem.
12. **Dostępność (Accessibility):** Zadbaj o odpowiednie atrybuty ARIA, semantyczny HTML, kontrast kolorów i nawigację klawiaturą.
13. **Testowanie:** Napisz testy jednostkowe dla logiki w `planStore` oraz testy komponentów dla kluczowych interakcji.
14. **Refaktoryzacja i przegląd kodu.**
