# Database Tables Needed for the Study Dashboard Backend

This document translates the current front-end data structures into a relational schema suitable for a FastAPI + SQLModel + PostgreSQL stack. It covers the entities required to persist the behaviour you see in the React client (see `src/components/HomeDashboard.jsx`, `src/pages/ImmerseMode.jsx`, `src/components/social/PostCard.jsx`, `src/components/CalendarPage.jsx`, and related files).

## Conventions

- `id` columns are UUIDs (`uuid4`) unless otherwise noted.
- `created_at` / `updated_at` are UTC timestamps with defaults (`sqlalchemy.func.now()` and auto update).
- Text columns use `TEXT` when long-form content is expected, otherwise `VARCHAR` with sensible limits.
- Boolean flags default to `FALSE`.
- Foreign keys cascade deletes to keep child rows in sync.
- Add B-tree indexes on all foreign keys and frequently filtered columns.

---

## 1. Core Identity & Social Graph

### `users`
Stores primary account and profile info (see `src/lib/profiles.js` for the properties currently hard-coded).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK | Primary identifier exposed to the client. |
| `email` | VARCHAR(255) UNIQUE | Optional for social-only accounts. |
| `username` | VARCHAR(50) UNIQUE | Display handle (`@username`). |
| `full_name` | VARCHAR(120) | e.g. "Aiko Tanaka". |
| `bio` | TEXT | "About" section. |
| `location` | VARCHAR(120) | City / region (Profile.jsx). |
| `profile_image_url` | TEXT | Avatar (`profileImage`). |
| `banner_image_url` | TEXT | Profile header (`backgroundImage`). |
| `joined_at` | DATE | `joined` field shown in Profile.jsx. |
| `followers_count` | INTEGER | Cached aggregate for fast render. |
| `following_count` | INTEGER | Cached aggregate. |
| `posts_count` | INTEGER | Cached aggregate. |
| `created_at` | TIMESTAMP | Server generated. |
| `updated_at` | TIMESTAMP | Auto updated. |

### `user_settings`
Preference bucket (language, theme, etc.), powered by the language picker (`src/components/LanguageSwitcher.jsx`).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id UNIQUE | One row per user. |
| `preferred_locale` | VARCHAR(10) | e.g. `en`, `ja`. |
| `timezone` | VARCHAR(64) | Optional, defaults to UTC. |
| `theme` | VARCHAR(32) | For dark / light / system. |
| `data` | JSONB | Extra flags without schema changes. |
| timestamps | TIMESTAMP |

### `user_presence`
Backs the status pill in the right rail (`presenceByUserId` in `src/App.jsx`).

| column | type | notes |
| --- | --- | --- |
| `user_id` | UUID PK/FK -> users.id | One record per user. |
| `status` | VARCHAR(16) | Enum: `online`, `offline`, `idle`. |
| `activity` | VARCHAR(120) | "Pair programming", etc. |
| `last_seen_at` | TIMESTAMP | Optional heartbeat. |

### `follows`
Represents follower/following counts surfaced in the profile cards.

| column | type | notes |
| --- | --- | --- |
| `follower_id` | UUID FK -> users.id |
| `followee_id` | UUID FK -> users.id |
| `created_at` | TIMESTAMP |
| **PK** | (`follower_id`, `followee_id`) |

Add a covering index on `followee_id` for follower counts and on `follower_id` for who the user follows.

### `user_tags`
Stores interest hashtags shown on the profile (`tags` array in `src/lib/profiles.js`).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `tag` | VARCHAR(50) | Stored without the leading `#`. |
| `created_at` | TIMESTAMP |
| **Constraint** | `(user_id, tag)` unique |

---

## 2. Social Feed

### `posts`
Matches the feed objects consumed by `PostCard.jsx` and created via `PostModal.jsx`.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id | Author (maps to `userId` in `src/lib/posts.js`). |
| `content` | TEXT | Long-form text (`post.content`). |
| `book_title` | VARCHAR(160) | Optional Book/Resource (PostModal). |
| `study_duration` | VARCHAR(32) | Human string ("45m"). |
| `subject` | VARCHAR(80) | Optional subject/tag field. |
| `image_url` | TEXT | Single hero image. |
| `like_count` | INTEGER | Derived from `post_likes`. |
| `comment_count` | INTEGER | Derived from `post_comments`. |
| `created_at` | TIMESTAMP | From `timestamp` / modal. |
| `updated_at` | TIMESTAMP |

### `post_media`
Allows future support for multiple attachments.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `post_id` | UUID FK -> posts.id |
| `media_type` | VARCHAR(20) | `image`, `video`, etc. |
| `url` | TEXT |
| `order_index` | INTEGER | Display ordering. |
| `metadata` | JSONB | Width/height, alt text. |

### `post_tags`
Normalises tag usage (`tags` array in `posts.js`). Pairs with `user_tags` to power discovery.

| column | type | notes |
| --- | --- | --- |
| `post_id` | UUID FK -> posts.id |
| `tag` | VARCHAR(50) |
| **PK** | (`post_id`, `tag`) |

If you need analytics across tags, add a dedicated `tags` dictionary table and point `post_tags.tag_id` at it.

### `post_comments`
Actual comment bodies (only counts are currently rendered, but the API will likely serve full threads).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `post_id` | UUID FK -> posts.id |
| `author_id` | UUID FK -> users.id |
| `body` | TEXT |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

Index `(post_id, created_at)` for chronological fetch.

### `post_likes`
Supports both the like counter and per-user toggles.

| column | type | notes |
| --- | --- | --- |
| `post_id` | UUID FK -> posts.id |
| `user_id` | UUID FK -> users.id |
| `created_at` | TIMESTAMP |
| **PK** | (`post_id`, `user_id`) |

---

## 3. Calendar Planner

Events are keyed by `YYYY-MM-DD` in the client (`CalendarPage.jsx:5` stores them in localStorage). The backend should persist richer objects.

### `calendar_events`

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `event_date` | DATE | The calendar cell. |
| `title` | VARCHAR(160) | Optional short label. |
| `notes` | TEXT | Body entered via modal / quick add. |
| `starts_at` | TIMESTAMP | Optional time-of-day. |
| `ends_at` | TIMESTAMP | Optional end. |
| `source` | VARCHAR(20) | `quick`, `modal`, `import`. |
| `order_index` | INTEGER | For deterministic ordering inside a day. |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

Add composite indexes on `(user_id, event_date)` and `(user_id, event_date, order_index)`.

### `calendar_event_reminders` (optional)
If you later support notifications, use a child table with trigger timestamps and delivery channels.

---

## 4. Task Lists & Widgets

### `task_lists`
Logical containers for todos. The UI currently only shows a "Today" list (`TodoWidget.jsx`), but modelling lists allows future expansion.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `name` | VARCHAR(50) |
| `description` | TEXT |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `tasks`
Represents individual todo items created in the widget.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `list_id` | UUID FK -> task_lists.id |
| `user_id` | UUID FK -> users.id | Redundant FK for quick filtering by owner. |
| `description` | TEXT |
| `is_completed` | BOOLEAN | Mirrors `item.done`. |
| `completed_at` | TIMESTAMP |
| `due_at` | TIMESTAMP | Optional future enhancement. |
| `order_index` | INTEGER | Maintain stable ordering. |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `immersive_workspaces`
Backs the layout, background, and settings saved in Immerse Mode (`src/pages/ImmerseMode.jsx`).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `name` | VARCHAR(80) | Allow multiple boards later on. |
| `background_type` | VARCHAR(16) | `image`, `video`, `color`. |
| `background_value` | TEXT | URL or asset key (`draftBackground.value`). |
| `background_color` | VARCHAR(9) | Hex color string. |
| `settings` | JSONB | Additional preferences. |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `immersive_widgets`
The draggable items rendered by `WidgetCanvas.jsx`.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `workspace_id` | UUID FK -> immersive_workspaces.id |
| `type` | VARCHAR(32) | `clock`, `timer`, `todo`, etc. |
| `title_key` | VARCHAR(120) | Optional translation key (`titleKey`). |
| `title` | VARCHAR(120) | Fallback label. |
| `grid_x` | INTEGER | From `grid.x`. |
| `grid_y` | INTEGER | From `grid.y`. |
| `grid_w` | INTEGER | Width units. |
| `grid_h` | INTEGER | Height units. |
| `settings` | JSONB | Widget-specific config. |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

Index `(workspace_id, grid_y, grid_x)` to fetch in layout order.

---

## 5. Study Dashboard Content

These tables drive the data displayed on the home dashboard cards (`HomeDashboard.jsx` constants).

### `courses`

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `name` | VARCHAR(120) |
| `emoji` | VARCHAR(8) | Matches `QUICK_LINKS` icons. |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `study_resources`
Represents the quick launch buttons (Linear Algebra, etc.).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `label` | VARCHAR(120) |
| `emoji` | VARCHAR(8) |
| `url` | TEXT | Optional external link. |
| `order_index` | INTEGER |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `assignments`
Combines the "Due within the week/month" lists.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `course_id` | UUID FK -> courses.id NULLABLE |
| `title` | VARCHAR(160) |
| `status` | VARCHAR(40) | Example: "In progress". |
| `due_at` | DATE | or TIMESTAMP if you track time. |
| `timeframe` | VARCHAR(16) | Enum: `week`, `month`, `later`. |
| `notes` | TEXT |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

Add indexes on `(user_id, timeframe)` and `(user_id, due_at)`.

### `focus_entries`
Supports the focus areas card (Deep Work, Review Loop) and could power personal reminders.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `title` | VARCHAR(120) |
| `description` | TEXT |
| `order_index` | INTEGER |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

### `progress_metrics`
Drives the circular stats (Day/Week/Month/Year blocks in `HomeDashboard.jsx`).

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `scope` | VARCHAR(16) | Enum: `day`, `week`, `month`, `year`, etc. |
| `value` | INTEGER | Current progress percentage. |
| `target_value` | INTEGER | Optional goal (default 100). |
| `captured_at` | DATE | Snapshot date. |
| `created_at` | TIMESTAMP |

Composite unique on `(user_id, scope, captured_at)` keeps one snapshot per day.

### `study_playlists`
Embeds the curated playlists in the sidebar.

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK |
| `user_id` | UUID FK -> users.id |
| `title` | VARCHAR(160) |
| `provider` | VARCHAR(40) | e.g. `youtube`, `spotify`. |
| `embed_url` | TEXT |
| `order_index` | INTEGER |
| `created_at` | TIMESTAMP |
| `updated_at` | TIMESTAMP |

---

## 6. Supporting / Utility Tables

### `attachments`
Reusable storage for images or files referenced by multiple features (posts, profiles, events). Store metadata and link through polymorphic join tables or separate FK columns.

### `audit_logs`
Optional but recommended for future admin tooling: record user actions (post created, event deleted, etc.) with metadata for compliance.

---

## Relationships Overview

- `users` 1—N `posts`, `calendar_events`, `tasks`, `assignments`, `focus_entries`, `progress_metrics`, `study_resources`, `study_playlists`, `immersive_workspaces`.
- `immersive_workspaces` 1—N `immersive_widgets`.
- `task_lists` 1—N `tasks`; `tasks.user_id` mirrors `task_lists.user_id` for efficient filtering.
- `courses` 1—N `assignments`; optional M—N between `users` and `courses` if you later share courses.
- `posts` 1—N `post_comments` & `post_media`; M—N with tags via `post_tags`; M—N with users via `post_likes`.
- `follows` encodes the social graph, producing follower/following counts for `users`.

---

## Next Steps

1. Define the SQLModel models mirroring these tables (leverage `sqlmodel.SQLModel`, `Field`, and relationship properties).
2. Create Alembic migrations to materialise the schema in PostgreSQL.
3. Back-fill seed data from the static JSON in `src/lib` so the React app can start consuming the API endpoints.
4. Incrementally replace the localStorage/sessionStorage usage in the front-end with calls to your FastAPI services.

This schema gives you parity with the current UI while leaving room for natural feature growth (multi-board layouts, richer events, collaborative study features).
