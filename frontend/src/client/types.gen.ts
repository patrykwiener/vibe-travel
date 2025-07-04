// This file is auto-generated by @hey-api/openapi-ts

export type ErrorModel = {
    detail: string | {
        [key: string]: string;
    };
};

export type HttpValidationError = {
    detail?: Array<ValidationError>;
};

export type LimitOffsetPageNoteListItemOutSchema = {
    items: Array<NoteListItemOutSchema>;
    total?: number | null;
    limit: number | null;
    offset: number | null;
};

/**
 * Schema for creating a new note.
 *
 * This schema is used as input for the POST /notes endpoint to create
 * a new travel note.
 */
export type NoteCreateInSchema = {
    /**
     * Title of the note
     */
    title: string;
    /**
     * Location or place for the trip
     */
    place: string;
    /**
     * Start date of the trip
     */
    date_from: string;
    /**
     * End date of the trip
     */
    date_to: string;
    /**
     * Number of people for the trip
     */
    number_of_people: number;
    /**
     * Key ideas or additional notes for the trip
     */
    key_ideas?: string | null;
};

/**
 * Schema for note list item responses.
 *
 * This schema is used for individual items in the GET /notes response.
 */
export type NoteListItemOutSchema = {
    /**
     * Note's unique identifier
     */
    id: number;
    /**
     * Title of the note
     */
    title: string;
    /**
     * Location or place for the trip
     */
    place: string;
    /**
     * Start date of the trip
     */
    date_from: string;
    /**
     * End date of the trip
     */
    date_to: string;
    /**
     * Number of people for the trip
     */
    number_of_people: number;
};

/**
 * Schema for detailed note responses.
 *
 * This schema is used as output for the GET /notes/{note_id}, POST /notes,
 * and PUT /notes/{note_id} endpoints.
 */
export type NoteOutSchema = {
    /**
     * Note's unique identifier
     */
    id: number;
    /**
     * ID of the user who owns the note
     */
    user_id: string;
    /**
     * Title of the note
     */
    title: string;
    /**
     * Location or place for the trip
     */
    place: string;
    /**
     * Start date of the trip
     */
    date_from: string;
    /**
     * End date of the trip
     */
    date_to: string;
    /**
     * Number of people for the trip
     */
    number_of_people: number;
    /**
     * Key ideas or additional notes for the trip
     */
    key_ideas?: string | null;
    /**
     * Timestamp of note creation
     */
    created_at: string;
    /**
     * Timestamp of last note update
     */
    updated_at: string;
};

/**
 * Schema for updating an existing note.
 *
 * This schema is used as input for the PUT /notes/{note_id} endpoint to update
 * an existing travel note.
 */
export type NoteUpdateInSchema = {
    /**
     * Title of the note
     */
    title: string;
    /**
     * Location or place for the trip
     */
    place: string;
    /**
     * Start date of the trip
     */
    date_from: string;
    /**
     * End date of the trip
     */
    date_to: string;
    /**
     * Number of people for the trip
     */
    number_of_people: number;
    /**
     * Key ideas or additional notes for the trip
     */
    key_ideas?: string | null;
};

/**
 * Schema for creating or accepting a plan.
 *
 * This schema is used as input for the POST /notes/{note_id}/plan endpoint.
 * It supports three scenarios:
 * 1. Accept AI plan: Only generation_id is provided
 * 2. Hybrid plan: Both generation_id and plan_text are provided
 * 3. Manual plan: Only plan_text is provided
 */
export type PlanCreateInSchema = {
    /**
     * ID of the AI generated plan to accept
     */
    generation_id?: string | null;
    /**
     * Plan text for manual or hybrid plans
     */
    plan_text?: string | null;
};

/**
 * Schema for AI plan generation response.
 *
 * This schema is used as output for the POST /notes/{note_id}/plan/generate endpoint.
 */
export type PlanGenerateOutSchema = {
    /**
     * Unique ID for this AI generation attempt
     */
    generation_id: string;
    /**
     * AI-generated plan text
     */
    plan_text: string;
    /**
     * Status of the plan (always PENDING_AI for generation)
     */
    status?: PlanStatusEnum;
};

/**
 * Schema for plan responses.
 *
 * This schema is used as output for the GET /notes/{note_id}/plan,
 * POST /notes/{note_id}/plan, and PUT /notes/{note_id}/plan endpoints.
 */
export type PlanOutSchema = {
    /**
     * Plan's unique identifier
     */
    id: number;
    /**
     * ID of the note this plan belongs to
     */
    note_id: number;
    /**
     * The detailed text of the travel plan
     */
    plan_text: string;
    /**
     * Type of the plan (AI, MANUAL, HYBRID)
     */
    type: PlanTypeEnum;
    /**
     * Status of the plan (PENDING_AI, ACTIVE, ARCHIVED)
     */
    status: PlanStatusEnum;
    /**
     * Unique ID for the AI generation
     */
    generation_id: string;
    /**
     * Timestamp of plan creation
     */
    created_at: string;
    /**
     * Timestamp of last plan update
     */
    updated_at: string;
};

/**
 * Status of a travel plan.
 */
export type PlanStatusEnum = 'PENDING_AI' | 'ACTIVE' | 'ARCHIVED';

/**
 * Type of travel plan.
 */
export type PlanTypeEnum = 'AI' | 'MANUAL' | 'HYBRID';

/**
 * Schema for updating an existing plan.
 *
 * This schema is used as input for the PUT /notes/{note_id}/plan endpoint.
 */
export type PlanUpdateInSchema = {
    /**
     * Updated plan text
     */
    plan_text: string;
};

/**
 * User's preferred budget level.
 */
export type UserBudgetEnum = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * User create schema.
 */
export type UserCreate = {
    email: string;
    password: string;
    is_active?: boolean | null;
    is_superuser?: boolean | null;
    is_verified?: boolean | null;
};

/**
 * Schema for updating or creating a user profile.
 *
 * This schema is used as input for the PUT /profile endpoint to update
 * the authenticated user's travel preferences.
 */
export type UserProfileInSchema = {
    /**
     * User's preferred travel style - Can be RELAX, ADVENTURE, CULTURE, PARTY, or null
     */
    travel_style?: UserTravelStyleEnum | null;
    /**
     * User's preferred travel pace - Can be CALM, MODERATE, INTENSE, or null
     */
    preferred_pace?: UserTravelPaceEnum | null;
    /**
     * User's preferred budget - Can be LOW, MEDIUM, HIGH, or null
     */
    budget?: UserBudgetEnum | null;
};

/**
 * Schema for user profile responses.
 *
 * This schema is used as output for the GET /profile and PUT /profile endpoints.
 */
export type UserProfileOutSchema = {
    /**
     * User's preferred travel style
     */
    travel_style?: UserTravelStyleEnum | null;
    /**
     * User's preferred travel pace
     */
    preferred_pace?: UserTravelPaceEnum | null;
    /**
     * User's preferred budget
     */
    budget?: UserBudgetEnum | null;
    /**
     * Timestamp of the last profile update
     */
    updated_at: string;
};

/**
 * User read schema.
 */
export type UserRead = {
    id: string;
    email: string;
    is_active?: boolean;
    is_superuser?: boolean;
    is_verified?: boolean;
};

/**
 * User's preferred travel pace.
 */
export type UserTravelPaceEnum = 'CALM' | 'MODERATE' | 'INTENSE';

/**
 * User's preferred travel style.
 */
export type UserTravelStyleEnum = 'RELAX' | 'ADVENTURE' | 'CULTURE' | 'PARTY';

/**
 * User update schema.
 */
export type UserUpdate = {
    password?: string | null;
    email?: string | null;
    is_active?: boolean | null;
    is_superuser?: boolean | null;
    is_verified?: boolean | null;
};

export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};

export type Login = {
    grant_type?: string | null;
    username: string;
    password: string;
    scope?: string;
    client_id?: string | null;
    client_secret?: string | null;
};

export type NotesNoteCbvListNotesData = {
    body?: never;
    path?: never;
    query?: {
        /**
         * Search by note title
         */
        search_title?: string | null;
        limit?: number;
        offset?: number;
    };
    url: '/api/v1/notes/';
};

export type NotesNoteCbvListNotesErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesNoteCbvListNotesError = NotesNoteCbvListNotesErrors[keyof NotesNoteCbvListNotesErrors];

export type NotesNoteCbvListNotesResponses = {
    /**
     * Successful Response
     */
    200: LimitOffsetPageNoteListItemOutSchema;
};

export type NotesNoteCbvListNotesResponse = NotesNoteCbvListNotesResponses[keyof NotesNoteCbvListNotesResponses];

export type NotesNoteCbvCreateNoteData = {
    body: NoteCreateInSchema;
    path?: never;
    query?: never;
    url: '/api/v1/notes/';
};

export type NotesNoteCbvCreateNoteErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesNoteCbvCreateNoteError = NotesNoteCbvCreateNoteErrors[keyof NotesNoteCbvCreateNoteErrors];

export type NotesNoteCbvCreateNoteResponses = {
    /**
     * Successful Response
     */
    201: NoteOutSchema;
};

export type NotesNoteCbvCreateNoteResponse = NotesNoteCbvCreateNoteResponses[keyof NotesNoteCbvCreateNoteResponses];

export type NotesNoteCbvDeleteNoteData = {
    body?: never;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}';
};

export type NotesNoteCbvDeleteNoteErrors = {
    /**
     * Note not found or user does not have permission
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesNoteCbvDeleteNoteError = NotesNoteCbvDeleteNoteErrors[keyof NotesNoteCbvDeleteNoteErrors];

export type NotesNoteCbvDeleteNoteResponses = {
    /**
     * Successful Response
     */
    204: void;
};

export type NotesNoteCbvDeleteNoteResponse = NotesNoteCbvDeleteNoteResponses[keyof NotesNoteCbvDeleteNoteResponses];

export type NotesNoteCbvGetNoteByIdData = {
    body?: never;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}';
};

export type NotesNoteCbvGetNoteByIdErrors = {
    /**
     * Note not found or user does not have permission
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesNoteCbvGetNoteByIdError = NotesNoteCbvGetNoteByIdErrors[keyof NotesNoteCbvGetNoteByIdErrors];

export type NotesNoteCbvGetNoteByIdResponses = {
    /**
     * Successful Response
     */
    200: NoteOutSchema;
};

export type NotesNoteCbvGetNoteByIdResponse = NotesNoteCbvGetNoteByIdResponses[keyof NotesNoteCbvGetNoteByIdResponses];

export type NotesNoteCbvUpdateNoteData = {
    body: NoteUpdateInSchema;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}';
};

export type NotesNoteCbvUpdateNoteErrors = {
    /**
     * Note not found or user does not have permission
     */
    404: unknown;
    /**
     * Note title conflict
     */
    409: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesNoteCbvUpdateNoteError = NotesNoteCbvUpdateNoteErrors[keyof NotesNoteCbvUpdateNoteErrors];

export type NotesNoteCbvUpdateNoteResponses = {
    /**
     * Successful Response
     */
    200: NoteOutSchema;
};

export type NotesNoteCbvUpdateNoteResponse = NotesNoteCbvUpdateNoteResponses[keyof NotesNoteCbvUpdateNoteResponses];

export type NotesPlanRouterGeneratePlanData = {
    body?: never;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}/plan/generate';
};

export type NotesPlanRouterGeneratePlanErrors = {
    /**
     * Note not found or not owned by current user
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
    /**
     * Failed to generate plan due to internal error
     */
    500: unknown;
};

export type NotesPlanRouterGeneratePlanError = NotesPlanRouterGeneratePlanErrors[keyof NotesPlanRouterGeneratePlanErrors];

export type NotesPlanRouterGeneratePlanResponses = {
    /**
     * Successfully generated a plan proposal
     */
    201: PlanGenerateOutSchema;
};

export type NotesPlanRouterGeneratePlanResponse = NotesPlanRouterGeneratePlanResponses[keyof NotesPlanRouterGeneratePlanResponses];

export type NotesPlanRouterGetActivePlanData = {
    body?: never;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}/plan';
};

export type NotesPlanRouterGetActivePlanErrors = {
    /**
     * Note not found or not owned by the current user
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesPlanRouterGetActivePlanError = NotesPlanRouterGetActivePlanErrors[keyof NotesPlanRouterGetActivePlanErrors];

export type NotesPlanRouterGetActivePlanResponses = {
    /**
     * Successfully retrieved the active plan
     */
    200: PlanOutSchema;
    /**
     * No active plan exists for the note
     */
    204: void;
};

export type NotesPlanRouterGetActivePlanResponse = NotesPlanRouterGetActivePlanResponses[keyof NotesPlanRouterGetActivePlanResponses];

export type NotesPlanRouterCreateOrAcceptPlanData = {
    body: PlanCreateInSchema;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}/plan';
};

export type NotesPlanRouterCreateOrAcceptPlanErrors = {
    /**
     * Invalid input combinations
     */
    400: unknown;
    /**
     * Note not found, not owned by current user, or plan proposal not found
     */
    404: unknown;
    /**
     * An active plan already exists for this note
     */
    409: unknown;
    /**
     * Invalid input data
     */
    422: unknown;
};

export type NotesPlanRouterCreateOrAcceptPlanResponses = {
    /**
     * Successfully created or accepted a plan
     */
    201: PlanOutSchema;
};

export type NotesPlanRouterCreateOrAcceptPlanResponse = NotesPlanRouterCreateOrAcceptPlanResponses[keyof NotesPlanRouterCreateOrAcceptPlanResponses];

export type NotesPlanRouterUpdatePlanData = {
    body: PlanUpdateInSchema;
    path: {
        note_id: number;
    };
    query?: never;
    url: '/api/v1/notes/{note_id}/plan';
};

export type NotesPlanRouterUpdatePlanErrors = {
    /**
     * Note not found or no active plan exists for the note
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type NotesPlanRouterUpdatePlanError = NotesPlanRouterUpdatePlanErrors[keyof NotesPlanRouterUpdatePlanErrors];

export type NotesPlanRouterUpdatePlanResponses = {
    /**
     * Successfully updated the active plan
     */
    200: PlanOutSchema;
};

export type NotesPlanRouterUpdatePlanResponse = NotesPlanRouterUpdatePlanResponses[keyof NotesPlanRouterUpdatePlanResponses];

export type ProfileUserProfileCbvGetProfileData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/profile/';
};

export type ProfileUserProfileCbvGetProfileResponses = {
    /**
     * Successful Response
     */
    200: UserProfileOutSchema;
};

export type ProfileUserProfileCbvGetProfileResponse = ProfileUserProfileCbvGetProfileResponses[keyof ProfileUserProfileCbvGetProfileResponses];

export type ProfileUserProfileCbvUpdateProfileData = {
    body: UserProfileInSchema;
    path?: never;
    query?: never;
    url: '/api/v1/profile/';
};

export type ProfileUserProfileCbvUpdateProfileErrors = {
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type ProfileUserProfileCbvUpdateProfileError = ProfileUserProfileCbvUpdateProfileErrors[keyof ProfileUserProfileCbvUpdateProfileErrors];

export type ProfileUserProfileCbvUpdateProfileResponses = {
    /**
     * Successful Response
     */
    200: UserProfileOutSchema;
};

export type ProfileUserProfileCbvUpdateProfileResponse = ProfileUserProfileCbvUpdateProfileResponses[keyof ProfileUserProfileCbvUpdateProfileResponses];

export type UsersAuthJwtLoginData = {
    body: Login;
    path?: never;
    query?: never;
    url: '/api/v1/users/auth/jwt/login';
};

export type UsersAuthJwtLoginErrors = {
    /**
     * Bad Request
     */
    400: ErrorModel;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersAuthJwtLoginError = UsersAuthJwtLoginErrors[keyof UsersAuthJwtLoginErrors];

export type UsersAuthJwtLoginResponses = {
    /**
     * Successful Response
     */
    200: unknown;
    /**
     * No Content
     */
    204: void;
};

export type UsersAuthJwtLoginResponse = UsersAuthJwtLoginResponses[keyof UsersAuthJwtLoginResponses];

export type UsersAuthJwtLogoutData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/users/auth/jwt/logout';
};

export type UsersAuthJwtLogoutErrors = {
    /**
     * Missing token or inactive user.
     */
    401: unknown;
};

export type UsersAuthJwtLogoutResponses = {
    /**
     * Successful Response
     */
    200: unknown;
    /**
     * No Content
     */
    204: void;
};

export type UsersAuthJwtLogoutResponse = UsersAuthJwtLogoutResponses[keyof UsersAuthJwtLogoutResponses];

export type UsersRegisterRegisterData = {
    body: UserCreate;
    path?: never;
    query?: never;
    url: '/api/v1/users/auth/register';
};

export type UsersRegisterRegisterErrors = {
    /**
     * Bad Request
     */
    400: ErrorModel;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersRegisterRegisterError = UsersRegisterRegisterErrors[keyof UsersRegisterRegisterErrors];

export type UsersRegisterRegisterResponses = {
    /**
     * Successful Response
     */
    201: UserRead;
};

export type UsersRegisterRegisterResponse = UsersRegisterRegisterResponses[keyof UsersRegisterRegisterResponses];

export type UsersUsersCurrentUserData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/users/me';
};

export type UsersUsersCurrentUserErrors = {
    /**
     * Missing token or inactive user.
     */
    401: unknown;
};

export type UsersUsersCurrentUserResponses = {
    /**
     * Successful Response
     */
    200: UserRead;
};

export type UsersUsersCurrentUserResponse = UsersUsersCurrentUserResponses[keyof UsersUsersCurrentUserResponses];

export type UsersUsersPatchCurrentUserData = {
    body: UserUpdate;
    path?: never;
    query?: never;
    url: '/api/v1/users/me';
};

export type UsersUsersPatchCurrentUserErrors = {
    /**
     * Bad Request
     */
    400: ErrorModel;
    /**
     * Missing token or inactive user.
     */
    401: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersUsersPatchCurrentUserError = UsersUsersPatchCurrentUserErrors[keyof UsersUsersPatchCurrentUserErrors];

export type UsersUsersPatchCurrentUserResponses = {
    /**
     * Successful Response
     */
    200: UserRead;
};

export type UsersUsersPatchCurrentUserResponse = UsersUsersPatchCurrentUserResponses[keyof UsersUsersPatchCurrentUserResponses];

export type UsersUsersDeleteUserData = {
    body?: never;
    path: {
        id: string;
    };
    query?: never;
    url: '/api/v1/users/{id}';
};

export type UsersUsersDeleteUserErrors = {
    /**
     * Missing token or inactive user.
     */
    401: unknown;
    /**
     * Not a superuser.
     */
    403: unknown;
    /**
     * The user does not exist.
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersUsersDeleteUserError = UsersUsersDeleteUserErrors[keyof UsersUsersDeleteUserErrors];

export type UsersUsersDeleteUserResponses = {
    /**
     * Successful Response
     */
    204: void;
};

export type UsersUsersDeleteUserResponse = UsersUsersDeleteUserResponses[keyof UsersUsersDeleteUserResponses];

export type UsersUsersUserData = {
    body?: never;
    path: {
        id: string;
    };
    query?: never;
    url: '/api/v1/users/{id}';
};

export type UsersUsersUserErrors = {
    /**
     * Missing token or inactive user.
     */
    401: unknown;
    /**
     * Not a superuser.
     */
    403: unknown;
    /**
     * The user does not exist.
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersUsersUserError = UsersUsersUserErrors[keyof UsersUsersUserErrors];

export type UsersUsersUserResponses = {
    /**
     * Successful Response
     */
    200: UserRead;
};

export type UsersUsersUserResponse = UsersUsersUserResponses[keyof UsersUsersUserResponses];

export type UsersUsersPatchUserData = {
    body: UserUpdate;
    path: {
        id: string;
    };
    query?: never;
    url: '/api/v1/users/{id}';
};

export type UsersUsersPatchUserErrors = {
    /**
     * Bad Request
     */
    400: ErrorModel;
    /**
     * Missing token or inactive user.
     */
    401: unknown;
    /**
     * Not a superuser.
     */
    403: unknown;
    /**
     * The user does not exist.
     */
    404: unknown;
    /**
     * Validation Error
     */
    422: HttpValidationError;
};

export type UsersUsersPatchUserError = UsersUsersPatchUserErrors[keyof UsersUsersPatchUserErrors];

export type UsersUsersPatchUserResponses = {
    /**
     * Successful Response
     */
    200: UserRead;
};

export type UsersUsersPatchUserResponse = UsersUsersPatchUserResponses[keyof UsersUsersPatchUserResponses];

export type UtilsUtilsViewHealthCheckData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/v1/utils/health-check';
};

export type UtilsUtilsViewHealthCheckResponses = {
    /**
     * Successful Response
     */
    200: boolean;
};

export type UtilsUtilsViewHealthCheckResponse = UtilsUtilsViewHealthCheckResponses[keyof UtilsUtilsViewHealthCheckResponses];

export type ClientOptions = {
    baseUrl: `${string}://${string}` | (string & {});
};
