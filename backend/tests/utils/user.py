from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.apps.users.models.user import User


def authentication_token_from_email(client: TestClient, email: str, db: Session) -> dict[str, str]:
    """Get authentication headers for a user by email.

    This function looks up a user by email and returns authentication
    headers that can be used for API requests.
    """
    # First check if user exists, if not create one
    user = db.query(User).where(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password='hashed_password',  # This should be properly hashed in real scenario
            is_active=True,
            is_superuser=False,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Login with the user credentials
    login_data = {
        'username': email,
        'password': 'test_password',  # This should match the user's actual password
    }
    r = client.post('/api/v1/users/auth/jwt/login', data=login_data)
    tokens = r.json()
    a_token = tokens['access_token']
    return {'Authorization': f'Bearer {a_token}'}
