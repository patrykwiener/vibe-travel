# Tech Stack

## Frontend

- Vue.js 3
- Tailwind 4
- Flowbite 3
- Typescript
- backend-based OpenAPI-generated API client

## Backend

- FastAPI
- Docker
- PostgreSQL

## AI Integration

Komunikacja z modelami przez usługę Openrouter.ai:

- OpenAI SDK
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

## Testing

### Backend Testing

- pytest - framework do testów Python
- pytest-cov - pokrycie kodu
- pytest-asyncio - testy asynchroniczne
- httpx - klient HTTP do testów API
- unittest.mock - mockowanie zależności
- factory_boy - generowanie danych testowych
- faker - generowanie losowych danych

### Frontend Testing

- Vitest - szybki framework testowy dla Vue.js
- Vue Test Utils - oficjalne narzędzia do testowania komponentów Vue
- @testing-library/vue - testing utilities
- MSW (Mock Service Worker) - mockowanie API

### E2E Testing

- Playwright - nowoczesny framework do testów end-to-end
- @playwright/test - test runner dla testów międzyprzeglądarkowych

## CI/CD i Hosting

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
