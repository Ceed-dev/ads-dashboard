# Ceed Ads Admin Dashboard (Internal)

An internal web dashboard for Ceed staff (Biz/Ops/Engineering) to safely manage Advertisers and Ads stored in Firestore, without using the Firebase Console.
This data is consumed by the existing Ceed Ads Web SDK and iOS SDK via the backend endpoints POST /api/requests and POST /api/events.

Core requirement: Anything created/updated by this dashboard must match the Firestore schema expected by the current SDK-serving backend, so ads are served correctly without SDK changes.

## Table of Contents

- [Goals and Non-Goals](#goals-and-non-goals)
- [Tech Stack](#tech-stack)
- [High-Level Architecture](#high-level-architecture)
- [Required Components](#required-components)
- [Firestore Data Model](#firestore-data-model)
- [API Endpoints](#api-endpoints)
- [Validation and Business Rules](#validation-and-business-rules)
- [Admin UI Routes and Pages](#admin-ui-routes-and-pages)
- [Data Relationships](#data-relationships)
- [Firestore Query Patterns and Indexes](#firestore-query-patterns-and-indexes)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Definition of Done](#definition-of-done)

## Goals and Non-Goals

### Goals

- [User-visible] Provide internal UI to CRUD:
  - Advertisers (advertisers)
  - Ads (ads)
- [User-visible] Provide safe publishing workflow (preview + "publish gate").
- [Backend-only] Enforce authentication + RBAC for all dashboard APIs.
- [Backend-only] Ensure Firestore data matches the ad-serving backend + SDK expectations.

### Non-Goals (for this spec)

- [User-visible] No analytics/reporting UI (requests/events dashboards) as part of this dashboard.
- [Backend-only] No new ad formats (only action_card).
- [Backend-only] No changes to SDK public API contracts.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling/UI**: Tailwind CSS + shared UI primitives (buttons, dialogs, inputs)
- **Auth (Dashboard)**: Firebase Authentication (Google sign-in)
- **Session**: Server-side session cookie (HttpOnly) + middleware route protection
- **Database**: Firestore
- **Firestore access (Dashboard APIs)**: Firebase Admin SDK (server-side)
- **Client data fetching**: TanStack Query (React Query)
- **Validation**: Zod
- **Date handling**: date-fns (or equivalent)
- **Icons**: Lucide React (or equivalent)

Backend dependencies already used by the SDK-serving logic (must exist / be preserved):
- `franc` for language detection (expects eng / jpn codes)
- Google Cloud Translation API client (translate JP → EN for keyword matching)

## High-Level Architecture

### System overview (data flow)

```
(1) Admin Dashboard (internal users)
    UI -> Auth Session -> Admin APIs -> Firestore writes
                                  |
                                  v
(2) Firestore (source of truth)
    advertisers, ads, requests, events

(3) Existing SDK-serving backend (public)
    Web/iOS SDK -> POST /api/requests -> reads Firestore ads/advertisers -> returns ResolvedAd
             SDK -> POST /api/events   -> writes Firestore events
```

### Key principle

- Dashboard is the safe write-path for advertisers and ads.
- SDK-serving backend is the read-path for advertisers and ads and the write-path for requests/events.

## Required Components

### A) Authentication & RBAC (Dashboard)

- [User-visible] Login page (Google sign-in).
- [Backend-only] Session creation endpoint (exchange Firebase ID token → session cookie).
- [Backend-only] Next.js middleware to protect /admin/** routes.
- [Backend-only] Role lookup for the logged-in user.

#### Role model (Dashboard)

Roles: `admin`, `editor`, `viewer`

Permissions:
- `viewer`: read-only
- `editor`: create/update advertisers + ads, cannot manage roles
- `admin`: full CRUD + can archive/unarchive and manage internal users (optional; see below)

#### Internal user allowlist storage

Implement allowlist + role mapping via Firestore collection `adminUsers` (defined below).
If a Firebase-authenticated user does not exist in `adminUsers` (or is disabled), access is denied.

### B) Admin APIs (Dashboard-only)

- [Backend-only] CRUD endpoints for advertisers + ads (authenticated + role checked).
- [Backend-only] Centralized validation + normalization (Zod + helper functions).
- [Backend-only] Audit logging for every mutation (optional but recommended; schema below).

### C) Admin UI (Dashboard)

- [User-visible] Pages:
  - Advertisers: list, create, detail/edit
  - Ads: list, create, detail/edit, duplicate
- [User-visible] Live ad preview (Action Card) + EN/JP toggle + fallback behavior.
- [User-visible] Tag input with strict validation and helpful errors/suggestions.

### D) SDK-serving backend business logic (must be correct)

Even if already implemented, this spec assumes the backend MUST:

- [Backend-only] Use advertisers + ads schemas defined below.
- [Backend-only] POST /api/requests:
  - Detect language (franc)
  - Enforce per-conversation cooldown (60s)
  - Translate JP → EN for keyword matching
  - Match tags by exact word boundary logic
  - Return ResolvedAd consistent with existing Web/iOS SDKs
  - Log into requests
- [Backend-only] POST /api/events:
  - Accept impression/click events and log into events

## Firestore Data Model

Visibility rule: Every field is tagged as
- `[User-visible]` = stored AND shown in Admin UI
- `[Backend-only]` = stored but never shown in Admin UI (used only for internal logic)

### Collections overview

- `adminUsers` (dashboard access control)
- `advertisers` (served + managed)
- `ads` (served + managed)
- `requests` (SDK request logs)
- `events` (SDK interaction logs)
- `auditLogs` (admin mutation logs; recommended)

### adminUsers/{uid}

Used to allow/deny dashboard access and enforce role-based permissions.

```typescript
type AdminRole = "admin" | "editor" | "viewer";
type AdminUserStatus = "active" | "disabled";
```

Fields:
- [User-visible] `email`: string
- [User-visible] `displayName`?: string
- [User-visible] `role`: AdminRole
- [User-visible] `status`: AdminUserStatus
- [User-visible] `meta.createdAt`: Timestamp
- [User-visible] `meta.updatedAt`: Timestamp
- [User-visible] `meta.createdBy`: string (email)
- [User-visible] `meta.updatedBy`: string (email)

If you do not want a UI for managing adminUsers in MVP, you can still keep this collection and seed it manually.
In that case: show only "Access denied" if user not present.

### advertisers/{advertiserId}

```typescript
type AdvertiserStatus = "active" | "suspended";
```

Fields:
- [User-visible] `name`: string
- [User-visible] `status`: AdvertiserStatus
- [User-visible] `websiteUrl`?: string
- [User-visible] `meta.createdAt`: Timestamp
- [User-visible] `meta.updatedAt`: Timestamp
- [User-visible] `meta.createdBy`: string (email)
- [User-visible] `meta.updatedBy`: string (email)

Optional search helper (recommended for prefix search):
- [Backend-only] `search.nameLower`: string (=name.toLowerCase())

### ads/{adId}

```typescript
type AdStatus = "active" | "paused" | "archived";
type AdFormat = "action_card";
type LocalizedText = Partial<Record<"eng" | "jpn", string>>;
```

Fields:
- [User-visible] `advertiserId`: string (FK → advertisers)
- [User-visible] `format`: AdFormat (always "action_card")
- [User-visible] `title`: LocalizedText (must include eng)
- [User-visible] `description`: LocalizedText (must include eng)
- [User-visible] `ctaText`: LocalizedText (must include eng)
- [User-visible] `ctaUrl`: string (must be https://...)
- [User-visible] `tags`: string[] (normalized lowercase; strict allowed charset)
- [User-visible] `status`: AdStatus (default paused)
- [User-visible] `meta.createdAt`: Timestamp
- [User-visible] `meta.updatedAt`: Timestamp
- [User-visible] `meta.createdBy`: string (email)
- [User-visible] `meta.updatedBy`: string (email)

Optional search helper (recommended):
- [Backend-only] `search.titleEngLower`: string (=title.eng.toLowerCase())

### requests/{requestId} (SDK request logs)

Must align with the existing Web/iOS SDK request flow (appId, conversationId, messageId, contextText, optional userId, sdkVersion).

```typescript
type RequestStatus = "success" | "no_ad" | "error";
```

Fields:
- [Backend-only] `appId`: string
- [Backend-only] `conversationId`: string
- [Backend-only] `messageId`: string
- [Backend-only] `contextText`: string
- [Backend-only] `language`?: "eng" | "jpn" (franc code)
- [Backend-only] `decidedAdId`?: string (FK → ads)
- [Backend-only] `status`: RequestStatus
- [Backend-only] `reason`?: string (e.g., "cooldown", "no_match", "unsupported_language")
- [Backend-only] `latencyMs`?: number
- [Backend-only] `sdkVersion`?: string
- [Backend-only] `userId`?: string
- [Backend-only] `meta.createdAt`: Timestamp
- [Backend-only] `meta.updatedAt`: Timestamp

These logs are not required to be shown in Admin UI in this dashboard scope.

### events/{eventId} (SDK events logs)

```typescript
type EventType = "impression" | "click";
```

Fields:
- [Backend-only] `type`: EventType
- [Backend-only] `adId`: string (FK → ads)
- [Backend-only] `advertiserId`: string (FK → advertisers)
- [Backend-only] `requestId`: string (FK → requests)
- [Backend-only] `userId`?: string
- [Backend-only] `conversationId`?: string
- [Backend-only] `appId`?: string
- [Backend-only] `meta.createdAt`: Timestamp
- [Backend-only] `meta.updatedAt`: Timestamp

### auditLogs/{auditId} (recommended)

Used to track changes made by dashboard users.

Fields:
- [Backend-only] `actorUid`: string
- [Backend-only] `actorEmail`: string
- [Backend-only] `action`: string
  - Examples:
    - "advertiser.create", "advertiser.update", "advertiser.suspend"
    - "ad.create", "ad.update", "ad.publish", "ad.pause", "ad.archive", "ad.duplicate"
- [Backend-only] `entityType`: "advertiser" | "ad" | "adminUser"
- [Backend-only] `entityId`: string
- [Backend-only] `before`?: Record<string, unknown>
- [Backend-only] `after`?: Record<string, unknown>
- [Backend-only] `meta.createdAt`: Timestamp

## API Endpoints

### Authentication APIs (Dashboard)

These endpoints are used only for internal dashboard auth/session.

#### POST /api/auth/session

Purpose: Create session cookie from Firebase ID token.

Request:
- [Backend-only] `{ idToken: string }`

Response:
- [Backend-only] `{ ok: true }`

Behavior:
- [Backend-only] Verify ID token via Admin SDK.
- [Backend-only] Set HttpOnly session cookie (expiry: e.g., 5 days).
- [Backend-only] Reject if user not found/active in adminUsers.

#### POST /api/auth/logout

Purpose: Clear session cookie.

Response:
- [Backend-only] `{ ok: true }`

### Admin APIs (Authenticated + RBAC)

Base rule:
- [Backend-only] All endpoints require a valid session cookie and an active adminUsers/{uid} record.
- [Backend-only] viewer = read-only, editor/admin = write allowed (with some admin-only actions).

#### Advertisers

##### GET /api/admin/advertisers

Query params:
- [Backend-only] `q`?: string (prefix search by name)
- [Backend-only] `status`?: "active" | "suspended"
- [Backend-only] `limit`?: number (default 20, max 100)
- [Backend-only] `cursor`?: string (pagination cursor; last doc id or encoded snapshot token)

Response:
- [User-visible] `items`: AdvertiserDTO[] (fields shown in UI)
- [Backend-only] `nextCursor`?: string

AdvertiserDTO (returned fields):
- [User-visible] `id`: string
- [User-visible] `name`: string
- [User-visible] `status`: "active" | "suspended"
- [User-visible] `websiteUrl`?: string
- [User-visible] `meta.createdAt`
- [User-visible] `meta.updatedAt`
- [User-visible] `meta.createdBy`
- [User-visible] `meta.updatedBy`

##### POST /api/admin/advertisers

Role: editor or admin

Request:
- [User-visible] `name`: string
- [User-visible] `status`?: "active" | "suspended" (default "active")
- [User-visible] `websiteUrl`?: string

Response:
- [User-visible] `{ id: string }`

Backend behavior:
- [Backend-only] Validate fields (Zod)
- [Backend-only] Write meta fields and search.nameLower

##### GET /api/admin/advertisers/:advertiserId

Role: any active user
Response: AdvertiserDTO

##### PATCH /api/admin/advertisers/:advertiserId

Role: editor or admin

Request (partial):
- [User-visible] `name`?: string
- [User-visible] `status`?: "active" | "suspended"
- [User-visible] `websiteUrl`?: string

Backend behavior:
- [Backend-only] Update meta.updatedAt/meta.updatedBy and search.nameLower if name changes.
- [Backend-only] If changing status to suspended: enforce advertiser suspension policy (see rules).

#### Ads

##### GET /api/admin/ads

Query params:
- [Backend-only] `q`?: string (prefix search by title.eng)
- [Backend-only] `status`?: "active" | "paused" | "archived"
- [Backend-only] `advertiserId`?: string
- [Backend-only] `tag`?: string (exact tag filter using array-contains)
- [Backend-only] `limit`?: number (default 20, max 100)
- [Backend-only] `cursor`?: string

Response:
- [User-visible] `items`: AdDTO[]
- [Backend-only] `nextCursor`?: string

AdDTO (returned fields):
- [User-visible] `id`: string
- [User-visible] `advertiserId`: string
- [User-visible] `advertiserName`: string (derived)
- [User-visible] `format`: "action_card"
- [User-visible] `title`: { eng: string, jpn?: string }
- [User-visible] `description`: { eng: string, jpn?: string }
- [User-visible] `ctaText`: { eng: string, jpn?: string }
- [User-visible] `ctaUrl`: string
- [User-visible] `tags`: string[]
- [User-visible] `status`: "active" | "paused" | "archived"
- [User-visible] `meta.createdAt`
- [User-visible] `meta.updatedAt`
- [User-visible] `meta.createdBy`
- [User-visible] `meta.updatedBy`

##### POST /api/admin/ads

Role: editor or admin

Request:
- [User-visible] `advertiserId`: string
- [User-visible] `title.eng`: string (required)
- [User-visible] `title.jpn`?: string
- [User-visible] `description.eng`: string (required)
- [User-visible] `description.jpn`?: string
- [User-visible] `ctaText.eng`: string (required)
- [User-visible] `ctaText.jpn`?: string
- [User-visible] `ctaUrl`: string (https)
- [User-visible] `tags`: string[] (will be normalized)
- [User-visible] `status`?: "active" | "paused" (default "paused")
  (Creating directly as "active" must pass publish gate checks.)

Response:
- [User-visible] `{ id: string }`

Backend behavior:
- [Backend-only] Force format="action_card"
- [Backend-only] Normalize tags and validate
- [Backend-only] Validate ctaUrl https
- [Backend-only] Apply publish gate if status is "active"
- [Backend-only] Write meta fields and search.titleEngLower

##### GET /api/admin/ads/:adId

Role: any active user
Response: AdDTO

##### PATCH /api/admin/ads/:adId

Role: editor or admin

Request (partial): same fields as create, plus:
- [User-visible] `status`?: "active" | "paused" | "archived"

Backend behavior:
- [Backend-only] If ad is archived, reject edits unless action is explicit "unarchive" (admin-only) OR restrict by policy.
- [Backend-only] If setting status to "active", enforce publish gate checks.
- [Backend-only] If advertiser is suspended, reject "active".

##### POST /api/admin/ads/:adId/duplicate

Role: editor or admin

Response:
- [User-visible] `{ id: string }` (new adId)

Backend behavior:
- [Backend-only] Copy ad fields to new doc:
  - keep content fields
  - reset meta
  - force status="paused"

### Public SDK APIs (must stay compatible)

#### POST /api/requests (Public)

Request body (current SDK contract):
- [Backend-only] `appId`: string (required)
- [Backend-only] `conversationId`: string (required)
- [Backend-only] `messageId`: string (required)
- [Backend-only] `contextText`: string (required)
- [Backend-only] `userId`?: string
- [Backend-only] `sdkVersion`?: string

Response body:
- [Backend-only] `ok`: boolean
- [Backend-only] `requestId`: string | null
- [Backend-only] `ad`: ResolvedAd | null

ResolvedAd (must match SDK expectations):
- [Backend-only] `id`: string
- [Backend-only] `advertiserId`: string
- [Backend-only] `advertiserName`: string
- [Backend-only] `format`: "action_card"
- [Backend-only] `title`: string
- [Backend-only] `description`: string
- [Backend-only] `ctaText`: string
- [Backend-only] `ctaUrl`: string

Required server behavior:
- [Backend-only] Validate required fields.
- [Backend-only] Detect language via franc(contextText):
  - if `und`, treat as `eng`
  - only support `eng` and `jpn`; otherwise return ad=null with reason `unsupported_language`
- [Backend-only] Cooldown: 60 seconds per conversationId, based on last requests doc with:
  - same conversationId
  - status == "success"
  - most recent meta.createdAt
  - if elapsed < 60s → return ad=null and log request with reason `cooldown`
- [Backend-only] Decide ad:
  - if language is `jpn`, translate to English before matching
  - fetch candidate ads: ads where status == "active"
  - score by exact tag matches using:
    - normalize context to lowercase
    - split into words using `/\W+/`
    - tag match if `words.includes(tag)`
  - choose highest score; tie-break randomly
  - if score == 0, return ad=null with reason `no_match`
- [Backend-only] Resolve localized fields to detected language:
  - if language `jpn` and `title.jpn` exists → use it; else use `title.eng` (same for other fields)
- [Backend-only] Load advertiser name using advertisers/{advertiserId}.
- [Backend-only] Log request into requests with decidedAdId and status.

#### POST /api/events (Public)

Request body:
- [Backend-only] `type`: "impression" | "click" (required)
- [Backend-only] `adId`: string (required)
- [Backend-only] `advertiserId`: string (required)
- [Backend-only] `requestId`: string (required)
- [Backend-only] `userId`?: string
- [Backend-only] `conversationId`?: string
- [Backend-only] `appId`?: string

Response:
- [Backend-only] `{ success: true, eventId: string }`

Behavior:
- [Backend-only] Validate required fields and allowed type.
- [Backend-only] Store into events with timestamps.

## Validation and Business Rules

### Tag rules (must match matching logic)

- [User-visible] UI enforces and explains:
  - normalize to lowercase
  - trim whitespace
  - deduplicate
  - no spaces
  - no hyphens
  - allowed pattern: `^[a-z0-9_]+$`
  - length: 2–32
  - count: 1–20
- [Backend-only] Admin APIs enforce the same rules server-side.

### URL rules

- [User-visible] UI requires valid URL and blocks non-https.
- [Backend-only] Admin APIs enforce https:// and valid URL parsing.

### Publish gate (setting status="active")

Must pass ALL checks:
- [Backend-only] Advertiser exists and is status="active".
- [Backend-only] Required English fields exist and are non-empty:
  - title.eng, description.eng, ctaText.eng
- [Backend-only] ctaUrl valid https
- [Backend-only] tags valid per rules

### Advertiser suspension policy

- [Backend-only] If advertiser becomes suspended, ads under it must not remain active.

Implement one of the following (pick ONE and be explicit in code):

1. **Auto-pause on suspend (recommended)**:
   When advertiser status is set to suspended, batch update all ads with advertiserId to status="paused" if currently "active".

2. Strict gate only (minimum):
   Block future activation, but do not auto-change existing ads. (Not recommended operationally.)

This spec recommends (1) Auto-pause on suspend for safety and predictable serving behavior.

### Archived ads

- [User-visible] Archived ads are read-only in UI.
- [Backend-only] Admin APIs reject edits to archived ads unless admin performs explicit unarchive workflow (optional).

## Admin UI Routes and Pages

All routes below are protected by middleware + RBAC.

### /admin (layout)

- [User-visible] Sidebar navigation:
  - Advertisers
  - Ads
  - (Optional) Admin Users (Admin-only)

Shared UI behaviors:
- [User-visible] List pages: search, filters, pagination, sort by meta.updatedAt when not searching.
- [User-visible] Show updatedAt and status badges.
- [User-visible] Show doc IDs on detail pages.

### Advertisers

#### /admin/advertisers

- [User-visible] Table columns:
  - Name
  - Status
  - Website URL
  - Updated At
- [User-visible] Actions:
  - Create (Editor/Admin)
  - Edit (Editor/Admin)
  - View details (all)
- [User-visible] Filter: status
- [User-visible] Search: name prefix

#### /admin/advertisers/new

- [User-visible] Form inputs: name, status (default active), websiteUrl
- [User-visible] Save button disabled while saving; inline validation errors.

#### /admin/advertisers/:advertiserId

- [User-visible] View/edit fields + meta (created/updated timestamps + by whom)
- [User-visible] When setting status to suspended:
  - show confirmation (and explain effect: active ads will be paused)

### Ads

#### /admin/ads

- [User-visible] Table columns:
  - Title (English)
  - Advertiser name
  - Status
  - Tags count
  - Updated At
- [User-visible] Filters: advertiser, status, tag (exact)
- [User-visible] Search: title.eng prefix
- [User-visible] Actions:
  - Create (Editor/Admin)
  - Edit (Editor/Admin)
  - Duplicate (Editor/Admin)
  - View details (all)

#### /admin/ads/new

- [User-visible] Form:
  - Advertiser selector (by name; stores advertiserId)
  - Localized inputs (EN required, JP optional)
  - CTA URL
  - Tags input (chips)
  - Status (default paused)
- [User-visible] Live preview:
  - EN/JP toggle
  - fallback to EN if JP missing
- [User-visible] Publish gate feedback: if user tries Active and invalid, show reasons.

#### /admin/ads/:adId

- [User-visible] Same as create +:
  - Duplicate action
  - Archive action (Admin-only recommended)
- [User-visible] Archived: read-only view

## Data Relationships

- [Backend-only] ads.advertiserId → advertisers/{advertiserId}
- [Backend-only] requests.decidedAdId → ads/{adId}
- [Backend-only] events.adId → ads/{adId}
- [Backend-only] events.advertiserId → advertisers/{advertiserId}
- [Backend-only] events.requestId → requests/{requestId}

Derived UI joins:
- [User-visible] Ads list/detail show advertiserName by reading advertiser doc.

## Firestore Query Patterns and Indexes

### Query patterns (Admin UI)

**Advertisers list:**
- Filter by status
- Sort by meta.updatedAt desc
- Search by prefix using search.nameLower (if implemented)

**Ads list:**
- Filter by status, advertiserId, or array-contains tags
- Sort by meta.updatedAt desc
- Search by prefix using search.titleEngLower (if implemented)

**Pagination:**
- [Backend-only] Use orderBy(meta.updatedAt, desc) + startAfter(lastDoc) pagination cursor.

### Query patterns (SDK-serving backend)

**Cooldown lookup:**
- requests.where(conversationId==X).where(status=="success").orderBy(meta.createdAt desc).limit(1)

### Required Firestore composite indexes (minimum)

These are the indexes most likely required by the queries above.

1. **Requests cooldown query:**
   - Collection: requests
   - Fields:
     - conversationId ASC
     - status ASC
     - meta.createdAt DESC

2. **Ads list by status + updatedAt:**
   - Collection: ads
   - Fields:
     - status ASC
     - meta.updatedAt DESC

3. **Ads list by advertiserId + updatedAt:**
   - Collection: ads
   - Fields:
     - advertiserId ASC
     - meta.updatedAt DESC

4. **Ads list by advertiserId + status + updatedAt (if both filters supported together):**
   - Collection: ads
   - Fields:
     - advertiserId ASC
     - status ASC
     - meta.updatedAt DESC

5. **Ads list by tag (array-contains) + updatedAt:**
   - Collection: ads
   - Fields:
     - tags ARRAY_CONTAINS
     - meta.updatedAt DESC

6. **Advertisers list by status + updatedAt:**
   - Collection: advertisers
   - Fields:
     - status ASC
     - meta.updatedAt DESC

If prefix search is implemented via search.*Lower range queries, indexes may also be needed depending on ordering; keep searches ordered by the search field to reduce index complexity.

## Project Structure

Suggested additions (App Router):

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── admin/                       # protected route group (or (admin))
│   │   ├── layout.tsx               # sidebar layout
│   │   ├── advertisers/
│   │   │   ├── page.tsx             # list
│   │   │   ├── new/page.tsx         # create
│   │   │   └── [advertiserId]/page.tsx
│   │   └── ads/
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [adId]/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── session/route.ts
│       │   └── logout/route.ts
│       ├── admin/
│       │   ├── advertisers/route.ts
│       │   ├── advertisers/[advertiserId]/route.ts
│       │   ├── ads/route.ts
│       │   ├── ads/[adId]/route.ts
│       │   └── ads/[adId]/duplicate/route.ts
│       ├── requests/route.ts         # public SDK endpoint (must match contract)
│       └── events/route.ts           # public SDK endpoint (must match contract)
├── components/
│   ├── admin/
│   │   ├── AdvertiserForm.tsx
│   │   ├── AdForm.tsx
│   │   ├── TagInput.tsx
│   │   ├── ActionCardPreview.tsx
│   │   └── StatusBadge.tsx
│   └── ui/                           # shared primitives
├── lib/
│   ├── auth/
│   │   ├── session.ts                # create/verify session cookie helpers
│   │   └── requireRole.ts            # RBAC helpers
│   ├── firebase/
│   │   ├── admin.ts                  # Admin SDK init
│   │   └── client.ts                 # Client SDK init (login)
│   ├── db/
│   │   ├── advertisers.ts            # Firestore ops
│   │   ├── ads.ts
│   │   └── auditLogs.ts
│   ├── ads/
│   │   ├── decideByKeyword.ts         # backend ad decision logic (if not already)
│   │   └── toEnglish.ts               # translation helper
│   └── validations/
│       ├── advertisers.ts             # Zod schemas
│       ├── ads.ts
│       └── common.ts
└── types/
    ├── advertiser.ts
    ├── ad.ts
    ├── request.ts
    ├── event.ts
    └── adminUser.ts
```

## Environment Variables

```bash
# Firebase Client SDK (for login UI)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Firebase Admin SDK (for server-side Firestore + session verification)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Google Cloud Translation (required by /api/requests if JP translation is enabled)
GOOGLE_TRANSLATION_CREDENTIALS=  # JSON string or structured env approach

# Optional: Session cookie config
SESSION_COOKIE_NAME=ceed_admin_session
SESSION_EXPIRES_DAYS=5
```

## Definition of Done

- [User-visible] Internal user can:
  - Create advertiser
  - Create ad (EN required, JP optional)
  - Validate tags + https URL
  - Preview ad (EN/JP toggle)
  - Publish ad (set status=active) and see errors if blocked
- [Backend-only] Admin APIs enforce RBAC + validation server-side.
- [Backend-only] POST /api/requests serves ads based on Firestore ads/advertisers created by dashboard and returns ResolvedAd matching SDK expectations.
- [Backend-only] Suspending an advertiser prevents serving (recommended: auto-pause active ads under it).
- [Backend-only] All mutations write correct meta.* and write audit logs (if enabled).
