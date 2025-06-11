# Backend Testing Environment

This directory contains a complete testing environment for unit tests of the VibeTravels backend application.

## Structure

```
tests/
├── conftest.py          # Global pytest fixtures
├── utils.py             # Helper functions for tests
├── unit/                # Unit tests
│   └── test_example.py  # Example tests
└── integration/         # Integration tests (to be added)
```

## Configuration

### Installed test packages

- **pytest** - Testing framework
- **pytest-cov** - Code coverage
- **pytest-asyncio** - Support for asynchronous tests
- **httpx** - HTTP client for API tests
- **factory-boy** - Test data generation
- **faker** - Random data generation
- **coverage** - Code coverage reporting

### Pytest configuration

Configuration is in `setup.cfg`:

- Automatic detection of asynchronous tests
- Code coverage with minimum 80%
- Reporting in HTML, XML and terminal formats
- Test markers (unit, integration, slow)

## Fixtures

### Database

- **test_engine** - SQLite engine for synchronous tests
- **test_async_engine** - SQLite engine for asynchronous tests
- **db_session** - Database session with rollback after test
- **async_db_session** - Async database session with rollback after test

### HTTP Clients

- **test_client** - TestClient for synchronous API tests
- **async_test_client** - AsyncClient for asynchronous API tests

### Mocks

- **mock_settings** - Mock application settings
- **mock_async_service** - Generic AsyncMock
- **mock_sync_service** - Generic MagicMock

## Helper Functions (tests/utils.py)

### Random string generation

```python
from tests.utils import generate_random_string

# Generate secure random string
random_string = generate_random_string(length=10)
```

### Assertions

```python
from tests.utils import assert_dict_contains

# Check dictionary contents
assert_dict_contains({"status": "success"}, response.json())
```

## Running Tests

### All tests

```bash
make test
```

### Specific test

```bash
make test path=tests/unit/test_example.py
```

### With coverage

```bash
make test-all
```

### In CI environment

```bash
make test-ci
```

## Test Patterns

### Unit test

```python
def test_function():
    """Test basic functionality."""
    result = my_function(input_data)
    assert result == expected_output
```

### Test with fixtures

```python
def test_with_database(db_session):
    """Test using database fixture."""
    user = create_test_user(db_session)
    assert user.id is not None
```

### Asynchronous test

```python
async def test_async_function(async_db_session):
    """Test async functionality."""
    result = await async_function()
    assert result is not None
```

### API test

```python
def test_api_endpoint(test_client):
    """Test API endpoint."""
    response = test_client.get("/api/users")
    assert response.status_code == 200
    assert len(response.json()) >= 0
```

### Test with mocking

```python
from unittest.mock import patch

@patch('src.services.external_service.call_api')
def test_with_mock(mock_call_api):
    """Test with mocked external service."""
    mock_call_api.return_value = {'status': 'success'}
    
    result = my_service.process()
    
    assert result['status'] == 'success'
    mock_call_api.assert_called_once()
```

### Parametric test

```python
import pytest

@pytest.mark.parametrize('input_value,expected', [
    (1, 2),
    (2, 4),
    (3, 6),
])
def test_parametrized(input_value, expected):
    """Test with multiple inputs."""
    result = multiply_by_two(input_value)
    assert result == expected
```

## Test Markers

- **@pytest.mark.unit** - Unit tests
- **@pytest.mark.integration** - Integration tests
- **@pytest.mark.slow** - Slow tests (skipped by default)
- **@pytest.mark.asyncio** - Asynchronous tests

## Code Coverage

Coverage reports are generated in:

- **Terminal** - Summary in console
- **htmlcov/** - Detailed HTML report
- **coverage.xml** - XML report for CI/CD

**Minimum code coverage is set to 80% - tests will FAIL if coverage is lower!**

## Best Practices

1. **Test isolation** - Each test should be independent
2. **Clean data** - Use fixtures to create clean data
3. **Mocking** - Mock external dependencies
4. **Naming** - Use descriptive test names
5. **Documentation** - Add docstrings to tests
6. **Parametrization** - Use parametrization for tests with multiple cases

## Usage Examples

See `tests/unit/test_example.py` for complete examples using all testing environment features.
