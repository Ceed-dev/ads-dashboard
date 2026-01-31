# Ceed Ads Dashboard - Project Context

This document provides background context for AI assistants and developers working on this project.

## Purpose

The Ceed Ads Admin Dashboard is an **internal-only** web application that allows Ceed staff (Business, Operations, and Engineering teams) to safely manage advertising content stored in Firestore. It serves as the authoritative write-path for advertisers and ads, eliminating the need for direct Firebase Console access.

### Why This Dashboard Exists

1. **Safety**: Prevents accidental data corruption from manual Firestore edits
2. **Validation**: Enforces business rules and schema consistency
3. **Access Control**: RBAC ensures appropriate permissions per role
4. **Audit Trail**: Tracks all changes for compliance and debugging
5. **Workflow**: Provides preview and publish gate before ads go live

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        WRITE PATH                                │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐   │
│  │ Admin Users  │───>│ Dashboard   │───>│ Firestore        │   │
│  │ (Internal)   │    │ Admin APIs  │    │ (advertisers,    │   │
│  └──────────────┘    └─────────────┘    │  ads, auditLogs) │   │
│                                          └────────┬─────────┘   │
└────────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     │ reads
                                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        READ PATH                                 │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────┐   │
│  │ Web/iOS SDK  │───>│ /api/       │───>│ Firestore        │   │
│  │ (End Users)  │    │ requests    │    │ (ads, advertisers│   │
│  └──────────────┘    │ events      │    │  requests,events)│   │
│                      └─────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Write and Read Paths**
   - Dashboard = only authorized write-path for ad content
   - SDK endpoints = read ads, write request/event logs only

2. **Server-Side Sessions**
   - HttpOnly cookies prevent XSS token theft
   - Firebase Admin SDK verifies sessions server-side

3. **Schema Compatibility**
   - Dashboard writes must match SDK-serving backend expectations
   - Changes require coordination with SDK team

## Relationship with Other Repositories

### Ceed Ads SDK (Web)
- **Repository**: `ceed-ads-sdk-web`
- **Relationship**: Consumes `POST /api/requests` endpoint
- **Contract**: Returns `ResolvedAd` matching SDK expectations
- **Impact**: Schema changes here require SDK updates

### Ceed Ads SDK (iOS)
- **Repository**: `ceed-ads-sdk-ios`
- **Relationship**: Same as Web SDK
- **Contract**: Identical API contract

### Integration Points
- Both SDKs call `/api/requests` with conversation context
- This dashboard's `/api/requests` uses tag matching + language detection
- Ads created here are served to SDK users

## Ad Serving Flow

```
1. User sends message in app
         │
         ▼
2. SDK calls POST /api/requests
   { appId, conversationId, messageId, contextText }
         │
         ▼
3. Backend processes:
   a. Language detection (franc: eng/jpn)
   b. Cooldown check (60s per conversation)
   c. JP → EN translation (if needed)
   d. Tag matching (exact word boundary)
   e. Score & select best ad
         │
         ▼
4. Returns ResolvedAd or null
         │
         ▼
5. SDK displays Action Card (if ad returned)
         │
         ▼
6. User impression/click → POST /api/events
```

## Role-Based Access Control (RBAC)

### Role Hierarchy

| Role | Description | Typical Users |
|------|-------------|---------------|
| `viewer` | Read-only access | New team members, stakeholders |
| `editor` | Create/update content | Ad operations, content team |
| `admin` | Full access + user management | Engineering leads, managers |

### Permission Matrix

| Action | viewer | editor | admin |
|--------|--------|--------|-------|
| View advertisers/ads | Yes | Yes | Yes |
| Create advertiser/ad | No | Yes | Yes |
| Update advertiser/ad | No | Yes | Yes |
| Suspend advertiser | No | Yes | Yes |
| Archive ad | No | No | Yes |
| Unarchive ad | No | No | Yes |
| Manage adminUsers | No | No | Yes |

### Implementation

- Roles stored in `adminUsers` Firestore collection
- Checked server-side via `requireRole()` helper
- Middleware protects `/admin/**` routes
- API routes verify role before mutations

## Current Ad Format

### action_card (Only Format)

Currently, only the `action_card` format is supported:

```typescript
{
  format: "action_card",
  title: { eng: "Required", jpn?: "Optional" },
  description: { eng: "Required", jpn?: "Optional" },
  ctaText: { eng: "Required", jpn?: "Optional" },
  ctaUrl: "https://...",
  tags: ["keyword1", "keyword2"]
}
```

**Rendering**: Displayed as a card with title, description, and CTA button.

## Future Considerations

### Planned Ad Formats

The system is designed to support additional formats:

1. **banner** - Simple image-based ads
2. **video** - Video content with autoplay options
3. **carousel** - Multiple cards in a swipeable format
4. **native** - Customizable template-based ads

### Implementation Notes for New Formats

1. Add new format to `AdFormat` type
2. Update Zod validation schemas
3. Create format-specific preview component
4. Extend SDK rendering logic
5. Update publish gate rules if needed

### Other Future Features

- Analytics dashboard (request/event visualization)
- A/B testing support
- Scheduled publishing
- Bulk import/export
- Multi-region support

## Session History

### 2026-01-30: Initial Implementation
- Set up Next.js 16 with App Router
- Implemented Firebase Auth + session management
- Created Advertiser and Ad CRUD
- Added RBAC middleware
- Integrated TanStack Query for data fetching
- Implemented tag validation and publish gate

### 2026-01-31: Documentation
- Updated README.md with practical setup guide
- Created CONTEXT.md for AI/developer context

## Technical Debt & Known Issues

1. **Prefix search**: Currently basic; consider Algolia for better UX
2. **Pagination cursor**: Uses document ID; could use encoded snapshot
3. **Translation caching**: JP→EN calls not cached; add Redis if needed
4. **Audit log viewing**: No UI for viewing audit logs yet

## Testing Notes

- Use Firebase emulator for local development
- Create test adminUser with admin role
- Test all three roles for RBAC coverage
- Verify SDK contract compatibility after changes

## Contact

For questions about this project:
- Architecture decisions: Engineering Lead
- Business rules: Ad Operations team
- SDK integration: SDK team
