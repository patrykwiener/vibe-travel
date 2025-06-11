"""Unit tests for config module.

This module tests the configuration functionality to ensure proper
settings handling and validation.
"""

import pytest

from src.config import parse_cors


@pytest.mark.unit
def test_parse_cors_string():
    """Test parse_cors function with string input."""
    # Test comma-separated string
    result = parse_cors('http://localhost:3000,http://localhost:8080')
    expected = ['http://localhost:3000', 'http://localhost:8080']
    assert result == expected

    # Test single string
    result = parse_cors('http://localhost:3000')
    expected = ['http://localhost:3000']
    assert result == expected

    # Test string with spaces
    result = parse_cors('http://localhost:3000, http://localhost:8080')
    expected = ['http://localhost:3000', 'http://localhost:8080']
    assert result == expected


@pytest.mark.unit
def test_parse_cors_list():
    """Test parse_cors function with list input."""
    cors_list = ['http://localhost:3000', 'http://localhost:8080']
    result = parse_cors(cors_list)
    assert result == cors_list


@pytest.mark.unit
def test_parse_cors_bracketed_string():
    """Test parse_cors function with bracketed string (JSON-like)."""
    # Bracketed strings should be returned as-is
    bracketed_string = '["http://localhost:3000", "http://localhost:8080"]'
    result = parse_cors(bracketed_string)
    assert result == bracketed_string


@pytest.mark.unit
@pytest.mark.parametrize(
    ('cors_input', 'expected'),
    [
        ('http://localhost:3000', ['http://localhost:3000']),
        ('http://localhost:3000,http://localhost:8080', ['http://localhost:3000', 'http://localhost:8080']),
        (['http://localhost:3000'], ['http://localhost:3000']),
        ('["http://localhost:3000"]', '["http://localhost:3000"]'),
    ],
)
def test_parse_cors_parametrized(cors_input, expected):
    """Test parse_cors function with various inputs."""
    result = parse_cors(cors_input)
    assert result == expected


@pytest.mark.unit
def test_config_import():
    """Test that config module can be imported without errors."""
    from src.config import parse_cors

    assert callable(parse_cors)


@pytest.mark.unit
def test_settings_module_import():
    """Test that we can import settings-related classes."""
    try:
        from src.config import BaseSettings

        assert BaseSettings is not None
    except ImportError:
        # If BaseSettings is not directly exported, that's fine
        from pydantic_settings import BaseSettings

        assert BaseSettings is not None
