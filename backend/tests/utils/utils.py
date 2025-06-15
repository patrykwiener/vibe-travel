from fastapi.testclient import TestClient

from src.config import settings


def get_superuser_token_headers(client: TestClient) -> dict[str, str]:
    """Get authentication headers for a superuser.

    This function logs in as the first superuser and returns
    the authentication headers that can be used for API requests.
    """
    login_data = {
        'username': settings.FIRST_SUPERUSER,
        'password': settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post('/api/v1/users/auth/jwt/login', data=login_data)
    tokens = r.json()
    a_token = tokens['access_token']
    return {'Authorization': f'Bearer {a_token}'}
