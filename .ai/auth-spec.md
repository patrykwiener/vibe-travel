# Authentication Architecture Specification

This specification outlines the architecture for the Registration and Login functionality in the VibeTravels application as defined in US-001. The implementation leverages FastAPI Users for backend authentication and Vue.js 3 with Tailwind and Flowbite for the frontend.

## 1. User Interface Architecture

### 1.1 Page Structure

The authentication system requires the following new pages:

- **LoginView**: User login form
- **RegisterView**: User registration form
- **ForgotPasswordView**: Password recovery form (not implemented in MVP as per product boundaries)
- **AuthLayout**: Layout wrapper for authentication pages

The application will have two distinct layout states:

- **Authenticated Layout**: Shows navigation with access to Notes, Profile, etc. and includes a logout option
- **Unauthenticated Layout**: Shows only login/register options

### 1.2 Component Hierarchy

```
App.vue
├── AuthLayout.vue (new)
│   ├── LoginView.vue (new)
│   ├── RegisterView.vue (new)
│   └── ForgotPasswordView.vue (future, not in MVP)
└── MainLayout.vue (new)
    ├── NavigationBar.vue (new)
    ├── NotesView.vue (new)
    ├── ProfileView.vue (new)
    └── NoteDetailView.vue (new)
```

### 1.3 Component Responsibilities

#### AuthLayout.vue

- Provides a consistent layout for authentication-related views
- Contains the VibeTravels logo and branding elements
- Centers the authentication form
- Adds decorative elements specific to the authentication flow

#### LoginView.vue

- Email input field with validation
- Password input field with validation
- "Remember me" checkbox
- Login button
- Link to register page
- Error message display area

#### RegisterView.vue

- Email input field with validation
- Password input field with validation
- Password confirmation field with validation
- Register button
- Link to login page
- Error message display area

#### NavigationBar.vue

- Application logo
- Navigation links (Notes, Profile)
- User information display
- Logout button

### 1.4 State Management

The application will use Vue's Composition API and reactive state management:

- **AuthStore**: Manages authentication state including:
  - `isAuthenticated`: Boolean indicating if the user is logged in
  - `currentUser`: Object containing user information
  - `login()`: Method to authenticate user
  - `register()`: Method to register user
  - `logout()`: Method to end the session
  - `checkAuthStatus()`: Method to verify current authentication status

### 1.5 Routing

The application will implement the following routes:

```
/login - LoginView
/register - RegisterView
/notes - NotesView (authenticated)
/notes/:id - NoteDetailView (authenticated)
/profile - ProfileView (authenticated)
/ - Home/Dashboard or redirect to /notes if authenticated, otherwise redirect to /login
```

Route guards will prevent access to protected routes for unauthenticated users.

### 1.6 Validation and Error Handling

#### Login Form Validation

- Email: required, valid email format
- Password: required, minimum 8 characters

#### Registration Form Validation

- Email: required, valid email format, unique (checked on submission)
- Password: required, minimum 8 characters
- Password confirmation: must match password

#### Error Messages

- Invalid login credentials: "Invalid email or password."
- Registration email already exists: "An account with this email already exists."
- Registration validation errors: Field-specific error messages
- Server connection error: "Unable to connect to the server. Please try again later."

### 1.7 User Scenarios

#### Successful Login Flow

1. User navigates to `/login`
2. User enters valid email and password
3. User clicks "Login"
4. Client validates form data
5. Client sends login request to API
6. API returns successful response with JWT in cookie
7. Client updates authentication state
8. User is redirected to the main application (notes list)

#### Failed Login Flow

1. User navigates to `/login`
2. User enters invalid credentials
3. User clicks "Login"
4. Client validates form data
5. Client sends login request to API
6. API returns error response
7. Client displays error message
8. User remains on login page

#### Registration Flow

1. User navigates to `/register`
2. User enters email and password
3. User clicks "Register"
4. Client validates form data
5. Client sends registration request to API
6. API creates user account and returns success response
7. User is either automatically logged in or redirected to login page
8. Success message is displayed

## 2. Backend Integration

The backend authentication is already implemented using FastAPI Users, which provides the necessary endpoints:

### 2.1 Authentication Endpoints

- `POST /api/v1/users/auth/register` - User registration
- `POST /api/v1/users/auth/jwt/login` - User login
- `POST /api/v1/users/auth/jwt/logout` - User logout
- `GET /api/v1/users/me` - Get current user information

All these endpoints are already covered by the OpenAPI-generated client library in `/frontend/src/client/sdk.gen.ts`, which provides type-safe functions like:

- `usersRegisterRegister()` - for user registration
- `usersAuthJwtLogin()` - for user login
- `usersAuthJwtLogout()` - for user logout
- `usersUsersCurrentUser()` - for fetching current user information

### 2.2 Authentication Flow

1. **Registration**:
   - The frontend calls the `usersRegisterRegister()` function from the generated client with email and password.
   - FastAPI Users creates a new user in the database.
   - FastAPI Users triggers the `on_after_register` hook which creates a user profile.
   - The user is redirected to login or automatically logged in depending on implementation choice.

2. **Login**:
   - The frontend calls the `usersAuthJwtLogin()` function from the generated client with email and password.
   - FastAPI Users validates credentials and returns a JWT token in an HTTP-only cookie.
   - The frontend updates its authentication state.

3. **Authenticated Requests**:
   - All subsequent API requests through the generated client include the JWT cookie automatically.
   - The backend validates the JWT and provides the user data via `current_active_user` dependency.
   - The generated client handles authentication headers transparently for all API calls.

4. **Logout**:
   - The frontend calls the `usersAuthJwtLogout()` function from the generated client.
   - The backend invalidates the JWT token and clears the cookie.
   - The frontend updates its authentication state and redirects to the login page.

### 2.3 Data Models

The user data model is already defined in the application:

- `User` - SQLAlchemyBaseUserTableUUID model with standard FastAPI Users fields
- `UserProfile` - Related model containing user travel preferences

### 2.4 Security Considerations

- JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
- CSRF protection is enabled for cookie-based authentication
- Password hashing is handled by FastAPI Users (using bcrypt)
- JWT expiry is set to 30 days as per requirements

## 3. Implementation Plan

### 3.1 Frontend Implementation

1. **Create AuthStore**:
   - Implement authentication state management
   - Add methods for login, register, logout, and status checking
   - Handle automatic JWT cookie management

2. **Create Authentication Components**:
   - Implement AuthLayout.vue
   - Implement LoginView.vue with form validation
   - Implement RegisterView.vue with form validation

3. **Setup Router**:
   - Configure routes with authentication guards
   - Implement redirects for authenticated/unauthenticated states

4. **Implement API Client Integration**:
   - Utilize the existing OpenAPI-generated client (`/frontend/src/client/sdk.gen.ts`) for authentication operations
   - Extend the API client configuration in `/frontend/src/utils/api-config.ts` to handle authentication state
   - Add interceptors for handling authentication errors and token expiration

### 3.2 Testing Plan

1. **Unit Tests**:
   - Test form validation logic
   - Test authentication store methods

2. **Integration Tests**:
   - Test login flow
   - Test registration flow
   - Test authentication guards

3. **End-to-End Tests**:
   - Test complete user journeys from registration to application use

## 4. Non-Functional Requirements

- **Performance**: Authentication operations should complete within 1 second
- **Security**: Follow OWASP guidelines for secure authentication
- **Usability**: Forms should provide clear feedback and validation
- **Accessibility**: All forms should be accessible with keyboard navigation and screen readers
