# Frontend Testing Setup

This is the testing environment for the VibeTravels application frontend, configured according to the VITEST guidelines from the `copilot-instructions.md` file.

## 🧪 Tech Stack

- **Vitest** - A fast testing framework for Vue.js
- **Vue Test Utils** - Official tools for testing Vue components
- **@testing-library/vue** - Testing utilities with a user-centric approach
- **@testing-library/jest-dom** - Additional matchers for the DOM
- **jsdom** - DOM environment for tests
- **@vitest/coverage-v8** - Code coverage provider

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.ts          # Global test configuration
│   ├── setup.test.ts     # Test verifying configuration
│   ├── types.d.ts        # Type definitions for tests
│   └── utils.ts          # Utility functions for tests
├── components/
│   └── **/*.test.ts      # Component tests
├── stores/
│   └── **/*.test.ts      # Store tests (Pinia)
├── composables/
│   └── **/*.test.ts      # Composables tests
└── utils/
    └── **/*.test.ts      # Utility function tests
```

## 🚀 Available Commands

```bash
# Run tests in watch mode
npm run test

# Run tests with UI interface
npm run test:ui

# Run all tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with code coverage
npm run test:coverage
```

## 📋 Configuration

### vitest.config.ts

The main configuration file includes:

- `jsdom` environment configuration
- Setup files for global mocks
- Coverage configuration with `v8` provider
- Path aliases (`@/` → `./src/`)
- Exclusions for auto-generated API client
- Coverage reports in formats: text, json (without HTML)

### Test Setup (src/test/setup.ts)

Automatically configures:

- Global mocks (`IntersectionObserver`, `ResizeObserver`, `matchMedia`)
- Storage API mocks (`localStorage`, `sessionStorage`)
- Automatic clearing of mocks between tests

## 🛠️ Utility Functions

### renderWithProviders()

Function for rendering components with full context:

- Pinia store
- Vue Router
- All necessary providers

```typescript
import { renderWithProviders } from '@/test/utils'

const { getByTestId } = renderWithProviders(MyComponent)
```

### Mock Helpers

- `createMockApiResponse()` - Create mock API response
- `createMockApiError()` - Create mock API error
- `createMockUser()` - Create mock user
- `createMockNote()` - Create mock note

## 📝 Test Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByTestId } = renderWithProviders(MyComponent, {
      props: { title: 'Test Title' },
    })

    expect(getByTestId('component-title')).toHaveTextContent('Test Title')
  })

  it('should handle user interaction', async () => {
    const mockFn = vi.fn()
    const { getByRole, user } = renderWithProviders(MyComponent, {
      props: { onSubmit: mockFn },
    })

    await user.click(getByRole('button'))
    expect(mockFn).toHaveBeenCalledOnce()
  })
})
```

## 🎯 Best Practices

According to VITEST guidelines:

1.  **Use `vi` object for test doubles**
    - `vi.fn()` for function mocks
    - `vi.spyOn()` for monitoring existing functions
    - `vi.stubGlobal()` for global mocks

2.  **Master `vi.mock()` factory patterns**
    - Place mock factory at the top of the test file
    - Use `mockImplementation()` for dynamic control

3.  **Structure tests for maintainability**
    - Group tests in `describe` blocks
    - Use the Arrange-Act-Assert pattern
    - Add descriptive assertion messages

4.  **Leverage TypeScript in tests**
    - Enable strict typing
    - Use `expectTypeOf()` for type-level assertions
    - Ensure mocks preserve original type signatures

## 🔧 IDE Configuration

For the best development experience:

- Install the Vitest extension for VS Code
- Configuration will automatically detect tests in the workspace
- Use `vitest --ui` for visual navigation

## 📊 Coverage

Configurable coverage thresholds:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Reports generated in formats: text, json (without HTML for cleaner output) Frontend Testing Setup

To jest środowisko testowe dla frontendu aplikacji VibeTravels skonfigurowane zgodnie z wytycznymi VITEST z pliku `copilot-instructions.md`.

## 🧪 Tech Stack

- **Vitest** - Szybki framework testowy dla Vue.js
- **Vue Test Utils** - Oficjalne narzędzia do testowania komponentów Vue
- **@testing-library/vue** - Testing utilities z podejściem user-centric
- **@testing-library/jest-dom** - Dodatkowe matchery dla DOM
- **jsdom** - Środowisko DOM dla testów
- **@vitest/coverage-v8** - Code coverage provider

## 📁 Struktura Testów

```
src/
├── test/
│   ├── setup.ts          # Globalna konfiguracja testów
│   ├── setup.test.ts     # Test weryfikujący konfigurację
│   ├── types.d.ts        # Definicje typów dla testów
│   └── utils.ts          # Utility funkcje dla testów
├── components/
│   └── **/*.test.ts      # Testy komponentów
├── stores/
│   └── **/*.test.ts      # Testy stores (Pinia)
├── composables/
│   └── **/*.test.ts      # Testy composables
└── utils/
    └── **/*.test.ts      # Testy utility funkcji
```

## 🚀 Dostępne Komendy

```bash
# Uruchomienie testów w trybie watch
npm run test

# Uruchomienie testów z interfejsem UI
npm run test:ui

# Jednorazowe uruchomienie wszystkich testów
npm run test:run

# Uruchomienie testów w trybie watch
npm run test:watch

# Uruchomienie testów z pokryciem kodu
npm run test:coverage
```

## 📋 Konfiguracja

### vitest.config.ts

Główny plik konfiguracyjny zawiera:

- Konfigurację środowiska `jsdom`
- Setup files dla globalnych mocków
- Konfigurację coverage z provider `v8`
- Aliasy ścieżek (`@/` → `./src/`)
- Wykluczenia dla auto-generated API client
- Raporty coverage w formatach: text, json (bez HTML)

### Test Setup (src/test/setup.ts)

Automatycznie konfiguruje:

- Globalne mocki (`IntersectionObserver`, `ResizeObserver`, `matchMedia`)
- Mocki Storage API (`localStorage`, `sessionStorage`)
- Automatyczne czyszczenie mocków między testami

## 🛠️ Utility Funkcje

### renderWithProviders()

Funkcja renderująca komponenty z pełnym kontekstem:

- Pinia store
- Vue Router
- Wszystkie potrzebne providers

```typescript
import { renderWithProviders } from '@/test/utils'

const { getByTestId } = renderWithProviders(MyComponent)
```

### Mock Helpers

- `createMockApiResponse()` - Tworzenie mock odpowiedzi API
- `createMockApiError()` - Tworzenie mock błędów API
- `createMockUser()` - Tworzenie mock użytkownika
- `createMockNote()` - Tworzenie mock notatki

## 📝 Przykład Testu

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByTestId } = renderWithProviders(MyComponent, {
      props: { title: 'Test Title' },
    })

    expect(getByTestId('component-title')).toHaveTextContent('Test Title')
  })

  it('should handle user interaction', async () => {
    const mockFn = vi.fn()
    const { getByRole, user } = renderWithProviders(MyComponent, {
      props: { onSubmit: mockFn },
    })

    await user.click(getByRole('button'))
    expect(mockFn).toHaveBeenCalledOnce()
  })
})
```

## 🎯 Najlepsze Praktyki

Zgodnie z wytycznymi VITEST:

1. **Używaj `vi` object dla test doubles**

   - `vi.fn()` dla function mocks
   - `vi.spyOn()` dla monitorowania istniejących funkcji
   - `vi.stubGlobal()` dla global mocks

2. **Master `vi.mock()` factory patterns**

   - Umieszczaj mock factory na górze pliku testowego
   - Używaj `mockImplementation()` dla dynamicznej kontroli

3. **Strukturyzuj testy dla maintainability**

   - Grupuj testy w `describe` blocks
   - Używaj wzorca Arrange-Act-Assert
   - Dodawaj opisowe assertion messages

4. **Leverage TypeScript w testach**
   - Włącz strict typing
   - Używaj `expectTypeOf()` dla type-level assertions
   - Upewnij się, że mocki zachowują oryginalne sygnatury typów

## 🔧 Konfiguracja IDE

Dla najlepszego doświadczenia development:

- Zainstaluj rozszerzenie Vitest dla VS Code
- Konfiguracja automatycznie wykryje testy w workspace
- Użyj `vitest --ui` dla wizualnej nawigacji

## 📊 Coverage

Konfigurowalne progi pokrycia:

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

Raporty generowane w formatach: text, json (bez HTML dla czystszego output)
