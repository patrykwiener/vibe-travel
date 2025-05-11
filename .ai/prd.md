# Dokument wymagań produktu (PRD) - VibeTravels

## 1. Przegląd produktu
VibeTravels to aplikacja MVP służąca do planowania angażujących wycieczek poprzez zamianę prostych notatek w szczegółowe plany podróży z wykorzystaniem AI. Podstawowe funkcje obejmują zarządzanie notatkami, profil użytkownika z preferencjami turystycznymi oraz integrację z silnikiem AI (OpenRouter).

## 2. Problem użytkownika
- Planowanie interesujących wycieczek wymaga czasu, wiedzy i kreatywności.
- Użytkownicy mają trudności z wyszukaniem atrakcji, logistyką i dopasowaniem planu do preferencji.
- Brak narzędzia łączącego luźne pomysły w spójny, gotowy do realizacji plan.

## 3. Wymagania funkcjonalne
3.1 Notatki (CRUD)
- pola:
  - `title`: 3–255 znaków, unikalne per użytkownik
  - `place`: 3–255 znaków
  - `date_from` i `date_to`: format DDMMYYYY, spełniają warunek `date_from ≤ date_to ≤ date_from + 14 dni`
  - `number_of_people`: 1–20
  - `key_ideas`: max 5000 znaków

3.2 Profil użytkownika
- pola opcjonalne: `styl_podrozy`, `preferowane_tempo`, `budzet` (nullable)
- użytkownik może zapisać i aktualizować preferencje

3.3 Lista notatek
- case‑insensitive partial search po `title`
- paginacja offset/limit
- wyświetlanie tytułu, miejsca, dat i liczby osób

3.4 Generowanie planu
- przycisk "Generate Plan" uruchamia `POST /notes/:id/plan/generate`
- synchronizacja z OpenRouter SDK, timeout 5 s
- wynik to tekst (≤ 5000 znaków) z podziałem na dni/godziny
- type planu: `AI` (automatycznie generowany), `MANUAL` (ręcznie wprowadzony) lub `HYBRID` (połączenie obu)

3.5 Zarządzanie planem
- akceptacja propozycji zapisuje plan przez `POST /notes/:id/plan` z `generation_id`
- edycja wygenerowanego planu w tym samym edytorze
- odrzucenie czyści plan i pozwala na ponowną generację
- ręczne tworzenie planu przez `POST /notes/:id/plan` bez `generation_id`

3.6 API i walidacja
- `POST /notes/:id/plan/generate` → HTTP 201
- `POST /notes/:id/plan` → HTTP 201
- walidacja długości `plan_text` ≤ 5000 znaków
- obsługa błędów walidacji (HTTP 4xx)

3.7 Autoryzacja i wsparcie przeglądarki
- JWT z 30-dniową ważnością
- endpoints dostępne tylko dla uwierzytelnionych użytkowników
- wsparcie tylko w najnowszym Chrome
- brak trybu offline i mobilnego

## 4. Granice produktu
- brak współdzielenia planów między kontami
- brak zaawansowanego przetwarzania multimediów
- brak zaawansowanego planowania logistyki
- brak resetu hasła i potwierdzenia email
- brak wsparcia dla wielu przeglądarek i trybu offline

## 5. Historyjki użytkowników
- ID: US-001
  Tytuł: Rejestracja i logowanie
  Opis: Jako nowy użytkownik chcę założyć konto i zalogować się, aby uzyskać dostęp do notatek i planów wycieczek
  Kryteria akceptacji:
    - Użytkownik może zarejestrować się, podając unikalny adres email i hasło
    - Po rejestracji następuje automatyczne zalogowanie lub przekierowanie do ekranu logowania
    - Użytkownik może zalogować się poprawnymi danymi i otrzymuje token JWT
    - Próba logowania niepoprawnymi danymi wyświetla odpowiedni komunikat o błędzie

- ID: US-002
  Tytuł: Uzupełnienie profilu turystycznego
  Opis: Jako zarejestrowany użytkownik chcę uzupełnić preferencje (styl podróży, tempo, budżet), aby AI generowało dopasowane plany
  Kryteria akceptacji:
    - W profilu dostępne są pola styl_podrozy (wybór: Relaks, Przygoda, Kultura, Impreza), preferowane_tempo (wybór: Spokojne, Umiarkowane, Intensywne), budzet (wybór: Niski, Średni, Wysoki). Wszystkie pola są nullable i domyślnie ustawione na null.
    - Użytkownik może zapisać i zaktualizować swoje preferencje
    - Pola mogą pozostać puste
    - Zapis preferencji potwierdzony jest komunikatem o sukcesie

- ID: US-003
  Tytuł: Tworzenie notatki wycieczki
  Opis: Jako sporadyczny podróżnik chcę utworzyć notatkę (tytuł, miejsce, daty, liczba osób, pomysły), by móc wygenerować plan
  Kryteria akceptacji:
    - Użytkownik może utworzyć notatkę z wymaganymi polami
    - Tytuł i miejsce mają długość 3–255 znaków
    - date_from ≤ date_to ≤ date_from + 14 dni
    - number_of_people w zakresie 1–20
    - key_ideas max 5000 znaków
    - W przypadku nieprawidłowych danych wyświetlany jest komunikat błędu i żadne dane nie zostają zapisane

- ID: US-004
  Tytuł: Przeglądanie i wyszukiwanie notatek
  Opis: Jako użytkownik chcę przeglądać listę notatek z wyszukiwarką i paginacją, aby szybko znaleźć interesującą notatkę
  Kryteria akceptacji:
    - Lista notatek wyświetlana jest z tytułem, miejscem, datami i liczbą osób
    - Wyszukiwanie działa case-insensitive i partial match po tytule
    - Paginacja offset/limit umożliwia przechodzenie między stronami
    - Brak wyników wyszukiwania wyświetla komunikat "Brak notatek"

- ID: US-005
  Tytuł: Generowanie planu AI
  Opis: Jako użytkownik chcę wygenerować propozycję planu na podstawie notatki i preferencji, aby otrzymać szczegółowy plan wycieczki
  Kryteria akceptacji:
    - Kliknięcie "Generate Plan" wywołuje `POST /notes/:id/plan/generate`
    - Generacja korzysta z OpenRouter SDK i kończy się w maks. 5 sekundach
    - AI zwraca tekst planu (≤ 5000 znaków) z podziałem na dni/godziny
    - W przypadku błędu lub timeout użytkownik otrzymuje komunikat "Wystąpił błąd generowania planu"
    - Przycisk generuje tylko propozycję planu. Jeśli użytkownik nie zaakceptuje, plan nie zostanie zapisany ani przypisany do notatki

- ID: US-006
  Tytuł: Akceptacja i edycja planu
  Opis: Jako użytkownik chcę zaakceptować lub edytować wygenerowany plan przed jego zapisaniem
  Kryteria akceptacji:
    - Użytkownik może zaakceptować plan, co zapisuje go przez `POST /notes/:id/plan` z przekazanym generation_id
    - Użytkownik może edytować plan w tym samym edytorze i ponownie zapisać
    - Po zapisaniu planu przycisk "Generate Plan" pozostaje dostępny do regeneracji tej samej notatki

- ID: US-007
  Tytuł: Odrzucenie i regeneracja planu
  Opis: Jako użytkownik chcę odrzucić nieodpowiadającą mi propozycję i wygenerować nową
  Kryteria akceptacji:
    - Użytkownik może usunąć odrzucić propozycję planu poprzez naciśniecie przycisku i ponownie kliknąć "Generate Plan"
    - Interfejs czyści poprzedni tekst przed wysłaniem nowego żądania
    - Do momentu akceptacji propozycji planu, plan nie jest przypisywany do notatki, dlatego nawet po wygenerowaniu nowej propozycji, poprzednia nie jest usuwana do momentu akceptacji nowej propozycji
    - Użytkownik może odrzucić plan i ponownie kliknąć "Generate Plan", co spowoduje wygenerowanie nowego planu

- ID: US-008
  Tytuł: Ręczne tworzenie planu
  Opis: Jako użytkownik chcę ręcznie wprowadzić plan, jeśli nie korzystam z AI
  Kryteria akceptacji:
    - Brak pola generation_id w żądaniu oznacza manualny zapis planu
    - Użytkownik może wprowadzić plan o długości do 10000 znaków
    - Plan manualny jest zapisywany przez `POST /notes/:id/plan` i wyświetlany na widoku notatki

- ID: US-009
  Tytuł: Usuwanie notatki
  Opis: Jako użytkownik chcę usunąć niepotrzebną notatkę, aby utrzymać porządek
  Kryteria akceptacji:
    - Użytkownik może usunąć notatkę przez `DELETE /notes/:id`
    - System prosi o potwierdzenie przed usunięciem
    - Po potwierdzeniu notatka jest usuwana i znika z listy
    - Wraz z notatką usuwany jest takze odpowiadający jej plan

- ID: US-010
  Tytuł: Zarządzanie sesją z tokenem JWT
  Opis: Jako użytkownik chcę, aby moja sesja była bezpieczna i ograniczona czasowo
  Kryteria akceptacji:
    - Po zalogowaniu użytkownik otrzymuje token JWT ważny 30 dni
    - Endpoints są dostępne tylko po przekazaniu poprawnego tokenu
    - Token po 30 dniach wygasa, a użytkownik jest proszony o ponowne zalogowanie

- ID: US-011
  Tytuł: Walidacja danych notatki
  Opis: Jako użytkownik chcę otrzymywać jasne komunikaty o błędach przy podawaniu nieprawidłowych danych
  Kryteria akceptacji:
    - Dla niepoprawnych długości tytułu, dat i liczby osób wyświetlane są komunikaty o błędach
    - Backend zwraca HTTP 400 z opisem walidacji
    - Interfejs blokuje zapis notatki przy błędach w danych

## 6. Metryki sukcesu
- 90% użytkowników uzupełnia profil preferencji (metryka `profile_complete`)
- 75% użytkowników generuje co najmniej 3 plany wycieczek rocznie (metryka `AI_generation_count`) 