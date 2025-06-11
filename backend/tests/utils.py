"""Test utilities and helper functions.

This module contains generic utility functions and helpers that are commonly used
across multiple test files to reduce code duplication and improve test maintainability.
These functions are domain-agnostic and focus on common testing patterns.
"""

import secrets
import string


def generate_random_string(length: int = 10) -> str:
    """Generate a cryptographically secure random string of specified length.

    Args:
        length: The length of the string to generate (default: 10)

    Returns:
        A random string containing letters and digits
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))
