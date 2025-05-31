# VibeTravels PostgreSQL Database Schema

## 1. ENUM Types

```sql
CREATE TYPE user_travel_style_enum AS ENUM ('RELAX', 'ADVENTURE', 'CULTURE', 'PARTY');
CREATE TYPE user_travel_pace_enum AS ENUM ('CALM', 'MODERATE', 'INTENSE');
CREATE TYPE user_budget_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE plan_type_enum AS ENUM ('AI', 'MANUAL', 'HYBRID');
CREATE TYPE plan_status_enum AS ENUM ('PENDING_AI', 'ACTIVE', 'ARCHIVED');
```

## 2. Tables

### Table: `user`

(Managed by FastAPI Users, extended with custom fields. Assumes FastAPI Users default table structure with a UUID primary key named `id`.)

| Column Name      | Data Type                | Constraints                                  | Description                               |
|------------------|--------------------------|----------------------------------------------|-------------------------------------------|
| `id`             | `UUID`                   | `PRIMARY KEY`                                | User's unique identifier (from FastAPI Users) |
| `email`          | `VARCHAR(255)`           | `UNIQUE`, `NOT NULL`                         | User's email address (from FastAPI Users) |
| `hashed_password`| `VARCHAR(255)`           | `NOT NULL`                                   | User's hashed password (from FastAPI Users) |
| `is_active`      | `BOOLEAN`                | `DEFAULT TRUE`, `NOT NULL`                   | Whether the user account is active        |
| `is_superuser`   | `BOOLEAN`                | `DEFAULT FALSE`, `NOT NULL`                  | Whether the user has superuser privileges |
| `is_verified`    | `BOOLEAN`                | `DEFAULT FALSE`, `NOT NULL`                  | Whether the user's email is verified      |
| `created_at`     | `TIMESTAMP WITH TIME ZONE`| `DEFAULT NOW()`, `NOT NULL`                 | Timestamp of user creation                |
| `updated_at`     | `TIMESTAMP WITH TIME ZONE`| `DEFAULT NOW()`, `NOT NULL`                 | Timestamp of last user update             |

### Table: `user_profile`

(Assuming this is managed by FastAPI Users, but if not, it can be added as a separate table.)

| Column Name      | Data Type                | Constraints                                  | Description                               |
|------------------|--------------------------|----------------------------------------------|-------------------------------------------|
| `id`             | `INTEGER`                   | `PRIMARY KEY`                                | User's unique identifier (from FastAPI Users) |
| `user_id`        | `UUID`                   | `NOT NULL`, `REFERENCES "user"(id) ON DELETE CASCADE` | Foreign key to the user profile           |
| `travel_style`   | `user_travel_style_enum` | `NULL`                                       | User's preferred travel style             |
| `preferred_pace` | `user_travel_pace_enum`  | `NULL`                                       | User's preferred travel pace              |
| `budget`         | `user_budget_enum`       | `NULL`                                       | User's preferred budget                   |
| `created_at`     | `TIMESTAMP WITH TIME ZONE`| `DEFAULT NOW()`, `NOT NULL`                 | Timestamp of profile creation              |
| `updated_at`     | `TIMESTAMP WITH TIME ZONE`| `DEFAULT NOW()`, `NOT NULL`                 | Timestamp of last profile update           |

### Table: `Note`

| Column Name        | Data Type                  | Constraints                                                                                                                                                              | Description                                     |
|--------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| `id`               | `INTEGER`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                                                                                               | Note's unique identifier                        |
| `user_id`          | `UUID`                     | `NOT NULL`, `REFERENCES "user"(id) ON DELETE CASCADE`                                                                                                                    | Foreign key to the user who owns the note       |
| `title`            | `VARCHAR(255)`             | `NOT NULL`, `CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 255)`                                                                                                       | Title of the note                               |
| `place`            | `VARCHAR(255)`             | `NOT NULL`, `CHECK (LENGTH(place) >= 3 AND LENGTH(place) <= 255)`                                                                                                       | Location/place for the trip                     |
| `date_from`        | `DATE`                     | `NOT NULL`                                                                                                                                                               | Start date of the trip                          |
| `date_to`          | `DATE`                     | `NOT NULL`                                                                                                                                                               | End date of the trip                            |
| `number_of_people` | `INTEGER`                  | `NOT NULL`, `CHECK (number_of_people >= 1 AND number_of_people <= 20)`                                                                                                   | Number of people for the trip                   |
| `key_ideas`        | `TEXT`                     | `NULL`, `CHECK (LENGTH(key_ideas) <= 2000)`                                                                                                                              | Key ideas or raw notes for the trip             |
| `created_at`       | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`, `NOT NULL`                                                                                                                                              | Timestamp of note creation                      |
| `updated_at`       | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`, `NOT NULL`                                                                                                                                              | Timestamp of last note update                   |
|                    |                            | `CONSTRAINT unique_user_title UNIQUE (user_id, title)`                                                                                                                   | Ensures title is unique per user                |
|                    |                            | `CONSTRAINT date_check CHECK (date_from <= date_to AND date_to <= date_from + INTERVAL '14 days')`                                                                        | Ensures date_from ≤ date_to ≤ date_from + 14 days |

### Table: `Plan`

| Column Name     | Data Type                  | Constraints                                                                 | Description                                      |
|-----------------|----------------------------|-----------------------------------------------------------------------------|--------------------------------------------------|
| `id`            | `INTEGER`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                  | Plan's unique identifier                         |
| `note_id`       | `UUID`                     | `NOT NULL`, `REFERENCES "Note"(id) ON DELETE CASCADE`                       | Foreign key to the note this plan belongs to     |
| `plan_text`     | `TEXT`                     | `NOT NULL`, `CHECK (LENGTH(plan_text) <= 5000)`                             | The detailed text of the travel plan             |
| `type`          | `plan_type_enum`           | `NOT NULL`                                                                  | Type of the plan (AI, MANUAL, HYBRID)            |
| `status`        | `plan_status_enum`         | `NOT NULL`                                                                  | Status of the plan (PENDING_AI, ACTIVE, etc.)    |
| `generation_id` | `UUID`                     | `UNIQUE`, `NOT NULL`                                                        | Unique ID for each AI generation attempt         |
| `created_at`    | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`, `NOT NULL`                                                 | Timestamp of plan creation                       |
| `updated_at`    | `TIMESTAMP WITH TIME ZONE` | `DEFAULT NOW()`, `NOT NULL`                                                 | Timestamp of last plan update                    |

## 3. Relationships

* **User to Note**: One-to-Many (`user.id` -> `Note.user_id`)
  * A user can have multiple notes.
  * A note belongs to exactly one user.
  * Deletion of a user cascades to delete their notes.
* **Note to Plan**: One-to-Many (`Note.id` -> `Plan.note_id`)
  * A note can have multiple plans (e.g., different versions, rejected AI suggestions, one active plan).
  * A plan belongs to exactly one note.
  * Deletion of a note cascades to delete its associated plans.

## 4. Indexes

### On `Note` table

* `CREATE INDEX idx_note_user_id ON "Note"(user_id);` (Implicitly created for FK, but good to note)
* `CREATE INDEX idx_note_title_lower ON "Note"(LOWER(title));` (For case-insensitive partial search on title - Decision #10)

### On `Plan` table

* `CREATE INDEX idx_plan_note_id ON "Plan"(note_id);` (Implicitly created for FK, but good to note)
* `CREATE UNIQUE INDEX idx_plan_unique_active_note ON "Plan"(note_id) WHERE status = 'ACTIVE';` (Ensures only one active plan per note - Decision #7)
* `CREATE INDEX idx_plan_generation_id ON "Plan"(generation_id);` (Implicitly created for UNIQUE constraint, but good to note)

## 5. Row-Level Security (RLS)

* As per Decision #11, Row-Level Security (RLS) will be implemented at the application layer (FastAPI) rather than directly in PostgreSQL for this MVP. The application logic will ensure users can only access and modify their own data.

## 6. Additional Considerations and Best Practices

* **UUID Generation**: FastAPI Users also typically uses UUIDs for user IDs.
* **Timestamp Updates**: Trigger for automatic updates of `updated_at` fields will be provided in the SQLalchemy
* **FastAPI Users Table**: The schema for the `user` table assumes common fields provided by `fastapi-users`. The exact column names and types might vary slightly based on the specific `fastapi-users` backend (e.g., SQLAlchemy). The `created_at` and `updated_at` fields are good practice to add if not already managed by `fastapi-users`.
* **Constraints Naming**: Constraints are explicitly named (e.g., `unique_user_title`, `date_check`) for better manageability.
* **Normalization**: The schema is designed with normalization in mind (appears to be in 3NF).
* **PRD Field Lengths**: The `VARCHAR(255)` for `title` and `place` in the `Note` table, and `TEXT` for `key_ideas` and `plan_text` with `CHECK` constraints for length, align with PRD requirements.
