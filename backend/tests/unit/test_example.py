"""Example unit tests demonstrating the test framework setup.

This module contains example tests that show how to use the testing
infrastructure, including fixtures, mocking, and async testing patterns.
"""

from unittest.mock import MagicMock, patch

import pytest

from tests.utils import generate_random_string


def test_example():
    """Example test to ensure the test framework is working."""
    assert True


def test_random_string_generation():
    """Test the random string generation utility."""
    # Test default length
    random_str = generate_random_string()
    assert len(random_str) == 10
    assert random_str.isalnum()

    # Test custom length
    custom_length = 15
    random_str_custom = generate_random_string(custom_length)
    assert len(random_str_custom) == custom_length
    assert random_str_custom.isalnum()


def test_mock_usage_example():
    """Example test showing how to use mocks."""
    # Create a mock service
    mock_service = MagicMock()
    mock_service.get_data.return_value = {'status': 'success', 'data': [1, 2, 3]}

    # Test the mock
    result = mock_service.get_data()
    assert result['status'] == 'success'
    assert result['data'] == [1, 2, 3]

    # Verify the method was called
    mock_service.get_data.assert_called_once()


@patch('tests.unit.test_example.some_external_function')
def test_patch_example(mock_external_function):
    """Example test showing how to use patch decorator."""
    # Configure the mock
    mock_external_function.return_value = 'mocked_value'

    # Call a function that uses the external function
    result = mock_external_function()

    # Verify the result and mock usage
    assert result == 'mocked_value'
    mock_external_function.assert_called_once()


def test_parametrized_example():
    """Example test showing parametrized testing with pytest.mark.parametrize."""

    @pytest.mark.parametrize(
        ('input_value', 'expected'),
        [
            (1, 2),
            (2, 4),
            (3, 6),
            (0, 0),
        ],
    )
    def test_multiply_by_two(input_value, expected):
        """Test a simple multiplication function."""
        result = input_value * 2
        assert result == expected

    # Run the parametrized test
    test_multiply_by_two(1, 2)
    test_multiply_by_two(2, 4)


@pytest.mark.asyncio
async def test_async_example():
    """Example async test to demonstrate async testing support."""

    async def async_function():
        """Simple async function for testing."""
        return 'async_result'

    result = await async_function()
    assert result == 'async_result'


def test_with_fixtures(mock_settings, mock_sync_service):
    """Example test using fixtures from conftest.py."""
    # Test mock_settings fixture
    assert mock_settings.environment == 'test'
    assert mock_settings.debug is True

    # Test mock_sync_service fixture
    mock_sync_service.process.return_value = 'processed'
    result = mock_sync_service.process()
    assert result == 'processed'


@pytest.mark.asyncio
async def test_with_async_fixtures(mock_async_service):
    """Example async test using async fixtures."""
    # Configure async mock
    mock_async_service.fetch_data.return_value = {'result': 'async_data'}

    # Test async service
    result = await mock_async_service.fetch_data()
    assert result['result'] == 'async_data'

    # Verify async mock was called
    mock_async_service.fetch_data.assert_called_once()


class TestExampleClass:
    """Example test class demonstrating class-based testing.

    This shows how to organize related tests in a class structure,
    though function-based tests are generally preferred for pytest.
    """

    def test_class_method_example(self):
        """Example test method in a test class."""
        data = {'key': 'value'}
        assert data['key'] == 'value'

    def test_another_class_method(self, mock_settings):
        """Example test method using fixtures."""
        assert mock_settings.environment == 'test'


# Helper functions for testing (normally these would be in the main codebase)
def some_external_function():
    """Example external function that might be patched in tests."""
    return 'real_value'


def multiply_by_two(value: int) -> int:
    """Example function for parametrized testing."""
    return value * 2
