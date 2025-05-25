# Authentication Architecture Diagram

<authentication_analysis>
# Authentication Analysis for VibeTravels

## 1. Authentication Flows
Based on the provided documents and code analysis, the following authentication flows were identified:

1. **Registration Flow**: 
   - New user registration through `/api/v1/users/auth/register`
   - Email and password validation
   - User profile creation (handled by `on_after_register` hook)
   - Successfully registered users can proceed to login or are automatically logged in

2. **Login Flow**:
   - User authentication through `/api/v1/users/auth/jwt/login`
   - Credential validation
   - JWT token generation and storage in HTTP-only cookie
   - User redirection to the main application view

3. **Session Validation Flow**:
   - Each API request automatically includes JWT cookie
   - Backend validates JWT for protected endpoints
   - User can access protected resources if JWT is valid

4. **Logout Flow**:
   - User initiates logout through `/api/v1/users/auth/jwt/logout`
   - JWT cookie clearing
   - Redirection to login page

5. **Current User Information Flow**:
   - Retrieving current user data through `/api/v1/users/me` 
   - Used for displaying user information and verifying authentication status

## 2. Main Actors and Interactions

1. **Frontend (Browser/Vue.js)**:
   - Handles user interface for login/registration forms
   - Manages authentication state via AuthStore
   - Redirects users based on authentication status
   - Automatically sends JWT cookie with requests

2. **Backend (FastAPI)**:
   - Processes authentication requests 
   - Validates credentials against database
   - Issues JWT tokens upon successful authentication
   - Protects resources with authentication middleware
   - Handles profile creation after registration

3. **FastAPI Users**:
   - Provides authentication backends and strategies
   - Manages JWT token generation and validation
   - Offers user management functionality
   - Provides route protection via dependencies

4. **Cookie Transport**:
   - Handles JWT token storage in HTTP-only cookies
   - Manages cookie attributes for security

## 3. Token Verification and Refresh Process

- **Token Verification**:
  - JWT token is sent with every request as an HTTP-only cookie
  - `fastapi_users` middleware extracts and validates the token
  - Token expiry is checked
  - If valid, user information is available via `current_active_user` dependency
  - If invalid/expired, 401 Unauthorized response is returned

- **Token Lifetime**:
  - JWT lifetime is set to 7 days (per config.py) though PRD specifies 30 days
  - No explicit token refresh mechanism is implemented
  - User must re-authenticate after token expiration

## 4. Authentication Steps

1. **Registration**:
   - User submits email and password through registration form
   - Frontend validates data and sends to `/api/v1/users/auth/register`
   - Backend validates request and creates user account
   - `on_after_register` hook creates user profile
   - 201 Created response with user data

2. **Login**:
   - User enters credentials in login form
   - Frontend sends data to `/api/v1/users/auth/jwt/login`
   - Backend validates credentials
   - On success, JWT is issued in HTTP-only cookie
   - Frontend updates authentication state
   - User is redirected to dashboard/notes view

3. **Protected Resource Access**:
   - Frontend requests protected resource (e.g., notes)
   - JWT cookie is automatically included in request
   - Backend extracts and validates JWT
   - If valid, `current_active_user` dependency provides user information
   - Backend processes request with user context
   - On invalid/expired JWT, 401 Unauthorized response

4. **Logout**:
   - User clicks logout button
   - Frontend sends request to `/api/v1/users/auth/jwt/logout`
   - Backend invalidates session and clears cookie
   - Frontend updates authentication state
   - User is redirected to login page
</authentication_analysis>

```mermaid
sequenceDiagram
    autonumber
    
    participant Browser
    participant Vue as Vue.js (Frontend)
    participant Router as Vue Router
    participant Store as AuthStore
    participant API as FastAPI Backend
    participant Auth as FastAPI Users
    participant DB as Database

    %% User Registration
    Browser->>Vue: Navigate to registration page
    Vue->>Browser: Display registration form
    
    Browser->>Vue: Enter data (email, password)
    Vue->>Vue: Form validation
    
    Vue->>API: POST /api/v1/users/auth/register
    API->>Auth: Forward registration data
    Auth->>DB: Check email uniqueness
    
    alt Email exists
        DB-->>Auth: Email already exists
        Auth-->>API: 400 Bad Request
        API-->>Vue: Registration error
        Vue-->>Browser: Error message
    else Email is unique
        DB-->>Auth: Email is unique
        Auth->>DB: Save user
        Auth->>Auth: Call on_after_register hook
        Auth->>DB: Create user profile
        DB-->>Auth: Creation confirmation
        Auth-->>API: 201 Created (user data)
        API-->>Vue: Registration success
        
        Note over Vue,API: Automatic login or redirect
        Vue->>Router: Redirect to login
        Router->>Browser: Display login page
    end
    
    %% User Login
    Browser->>Vue: Navigate to login page
    Vue->>Browser: Display login form
    
    Browser->>Vue: Enter data (email, password)
    Vue->>Vue: Form validation
    
    Vue->>API: POST /api/v1/users/auth/jwt/login
    API->>Auth: Verify credentials
    Auth->>DB: Check user
    
    alt Invalid credentials
        DB-->>Auth: Invalid credentials
        Auth-->>API: 400 Bad Request
        API-->>Vue: Login error
        Vue-->>Browser: Error message
    else Valid credentials
        DB-->>Auth: Credentials valid
        Auth->>Auth: Generate JWT token (valid 30 days)
        Auth-->>API: JWT token
        API-->>Vue: Login success + JWT in HTTP-only cookie
        Vue->>Store: Update authentication state
        Store->>Vue: Logged in state
        Vue->>Router: Redirect to /notes
        Router->>Browser: Display notes list
    end

    %% Access to protected resources
    Browser->>Vue: Request resources (e.g., notes)
    Vue->>Store: Check authentication state
    Store-->>Vue: User is authenticated
    Vue->>API: GET /api/v1/notes (with JWT cookie)
    
    API->>Auth: Verify JWT token
    
    alt Token expired or invalid
        Auth-->>API: Invalid token
        API-->>Vue: 401 Unauthorized
        Vue->>Store: Clear authentication state
        Store-->>Vue: User logged out
        Vue->>Router: Redirect to login
        Router->>Browser: Display login page
    else Token valid
        Auth-->>API: Valid token (user data)
        API->>DB: Get user data
        DB-->>API: User data
        API->>DB: Get user resources
        DB-->>API: User resources
        API-->>Vue: 200 OK (resources)
        Vue-->>Browser: Display resources
    end

    %% Logout
    Browser->>Vue: Click logout button
    Vue->>API: POST /api/v1/users/auth/jwt/logout
    API->>Auth: Logout user
    Auth-->>API: Logout success (cookie cleared)
    API-->>Vue: 204 No Content (cookie cleared)
    Vue->>Store: Clear authentication state
    Store-->>Vue: Logged out state
    Vue->>Router: Redirect to login
    Router->>Browser: Display login page

    %% User profile retrieval
    Browser->>Vue: Navigate to profile
    Vue->>Store: Check authentication state
    Store-->>Vue: User is authenticated
    Vue->>API: GET /api/v1/profile/ (with JWT cookie)
    API->>Auth: Verify JWT token
    Auth-->>API: Valid token (user data)
    API->>DB: Get user profile
    DB-->>API: User profile
    API-->>Vue: 200 OK (profile data)
    Vue-->>Browser: Display profile
```

This sequence diagram illustrates the main authentication flows in the VibeTravels application according to the architecture specification. The diagram shows interactions between the browser, Vue.js components, FastAPI backend, and database, covering registration, login, protected resource access, logout, and user profile retrieval scenarios.
