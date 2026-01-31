# Ceed Ads Admin Dashboard

Internal web dashboard for Ceed staff to manage Advertisers and Ads stored in Firestore.

## Overview

This dashboard provides a safe interface for Biz/Ops/Engineering teams to create, update, and manage ad content without direct Firebase Console access. All data managed here is consumed by the Ceed Ads Web SDK and iOS SDK via the backend endpoints.

**Core Principle**: Data created/updated by this dashboard must match the Firestore schema expected by the SDK-serving backend.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Firebase Authentication (Google sign-in) |
| Session | Server-side HttpOnly cookie |
| Database | Firestore |
| Server SDK | Firebase Admin SDK |
| Client Data | TanStack Query (React Query) |
| Validation | Zod |
| Date | date-fns |
| Icons | Lucide React |
| Language Detection | franc |
| Translation | Google Cloud Translation API |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project with Firestore enabled
- Google Cloud Translation API credentials (for JP translation)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ads-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with the following variables:

```bash
# Firebase Client SDK (for login UI)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Firebase Admin SDK (for server-side Firestore + session verification)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Cloud Translation (required for JP → EN translation in /api/requests)
GOOGLE_TRANSLATION_CREDENTIALS={"type":"service_account",...}

# Optional: Session configuration
SESSION_COOKIE_NAME=ceed_admin_session
SESSION_EXPIRES_DAYS=5
```

## Features

### Advertiser Management
- Create, view, and edit advertisers
- Suspend/activate advertisers
- Auto-pause ads when advertiser is suspended

### Ad Management
- Create ads with localized content (EN required, JP optional)
- Tag-based targeting with strict validation
- Live preview with EN/JP toggle
- Duplicate existing ads
- Publish gate enforcement

### Authentication & Authorization
- Google sign-in via Firebase Auth
- Role-based access control (admin, editor, viewer)
- Session-based route protection

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── admin/                  # Protected admin routes
│   │   ├── advertisers/        # Advertiser CRUD
│   │   ├── ads/                # Ad CRUD
│   │   └── settings/           # Dashboard settings
│   └── api/
│       ├── auth/               # Session management
│       ├── admin/              # Protected CRUD APIs
│       ├── requests/           # Public SDK endpoint
│       └── events/             # Public SDK endpoint
├── components/admin/           # Admin UI components
├── contexts/                   # React contexts (Theme, Language)
├── lib/
│   ├── ads/                    # Ad decision logic
│   ├── auth/                   # Session & RBAC helpers
│   ├── db/                     # Firestore operations
│   ├── firebase/               # Firebase SDK init
│   └── validations/            # Zod schemas
├── providers/                  # React Query provider
└── types/                      # TypeScript definitions
```

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `adminUsers` | Dashboard access control & roles |
| `advertisers` | Advertiser profiles |
| `ads` | Ad content & targeting |
| `requests` | SDK request logs |
| `events` | Impression/click events |
| `auditLogs` | Admin mutation history |

## API Endpoints

### Public (SDK)
- `POST /api/requests` - Ad request with keyword matching
- `POST /api/events` - Impression/click tracking

### Protected (Admin)
- `GET/POST /api/admin/advertisers` - List/create advertisers
- `GET/PATCH /api/admin/advertisers/:id` - Get/update advertiser
- `GET/POST /api/admin/ads` - List/create ads
- `GET/PATCH /api/admin/ads/:id` - Get/update ad
- `POST /api/admin/ads/:id/duplicate` - Duplicate ad

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Role Permissions

| Role | Read | Create/Update | Archive | Manage Users |
|------|------|---------------|---------|--------------|
| viewer | Yes | No | No | No |
| editor | Yes | Yes | No | No |
| admin | Yes | Yes | Yes | Yes |

## Tag Validation Rules

Tags must follow these rules:
- Lowercase only (`^[a-z0-9_]+$`)
- No spaces or hyphens
- Length: 2-32 characters
- Count: 1-20 tags per ad

## License

Internal use only.
