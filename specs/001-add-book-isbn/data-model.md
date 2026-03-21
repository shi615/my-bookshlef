# Data Model: Add Book via ISBN Scan

**Branch**: `001-add-book-isbn` | **Date**: 2026-03-21

---

## Firestore Collections

### `/books/{isbn}` — Shared Book Catalogue Cache

Document ID: ISBN-13 string (e.g., `9784101092058`). ISBN-10 values are normalised to
ISBN-13 before use as document IDs.

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `isbn` | `string` | No | Canonical ISBN-13; mirrors document ID |
| `title` | `string` | No | Book title from Google Books API |
| `authors` | `string[]` | No | Author name(s); empty array if unknown |
| `publisher` | `string` | Yes | Publisher name |
| `publishedDate` | `string` | Yes | Year or full date as returned by API (e.g., `"2021"`, `"2021-03-15"`) |
| `description` | `string` | Yes | Short synopsis |
| `coverImageUrl` | `string` | Yes | URL of cover thumbnail from Google Books API |
| `categories` | `string[]` | Yes | Genre/category tags |
| `source` | `string` | No | Always `"google_books"` |
| `cachedAt` | `Timestamp` | No | Server timestamp of last cache write |

**Identity & uniqueness**: One document per ISBN. ISBN-10 is normalised to ISBN-13
at ingestion time. Deduplication is enforced by using ISBN as the document ID.

**Lifecycle**: Written server-side only (API route via Firebase Admin SDK) on cache
miss. Never written by the client directly. TTL policy: if `cachedAt` is older than
30 days, the server refreshes the document on next access.

**Validation rules** (Firestore Security Rules):
- `allow read: if true;` — publicly readable (no personal data)
- `allow write: if false;` — only server (Admin SDK) may write

---

### `/users/{uid}/bookshelfEntries/{entryId}` — User's Personal Shelf

Document ID: auto-generated (allows multiple entries per ISBN).

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `entryId` | `string` | No | Mirrors document ID; for convenience in client reads |
| `isbn` | `string` | No | ISBN-13 (normalised); links to `/books/{isbn}` |
| `readingStatus` | `string` | No | Enum: `"want_to_read"` \| `"reading"` \| `"read"` |
| `dateAdded` | `Timestamp` | No | Server timestamp when entry was created |
| `updatedAt` | `Timestamp` | No | Server timestamp of last update |
| `notes` | `string` | No | User's personal notes; empty string if none |
| `titleOverride` | `string` | Yes | User-edited title (only set if different from catalogue) |
| `authorsOverride` | `string[]` | Yes | User-edited authors (only set if different from catalogue) |
| `coverImageUrlOverride` | `string` | Yes | User-uploaded cover URL (only set for not-in-catalogue books) |

**Identity & uniqueness**: No uniqueness constraint per ISBN — a user may have multiple
entries for the same ISBN (e.g., two physical copies). Duplicate creation requires
explicit user confirmation (FR-011).

**Default values on create**: `readingStatus = "want_to_read"`, `notes = ""`,
`dateAdded = serverTimestamp()`, `updatedAt = serverTimestamp()`.

**Override fields**: When the user edits auto-filled book details before saving (User
Story 3), the edited values are stored in `*Override` fields. When displaying a shelf
entry, the UI merges: override fields take precedence over catalogue fields.

**Lifecycle / state transitions**:
```
[created] → want_to_read → reading → read
                  ↑_________↗    ↑_______↗
                  (user can move back freely)
```
Reading status transitions are managed by a separate "update shelf entry" operation
(not in scope for this feature; this feature only creates entries).

**Validation rules** (Firestore Security Rules):
```javascript
match /users/{uid}/bookshelfEntries/{entryId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
  allow create: if
    request.auth != null &&
    request.auth.uid == uid &&
    request.resource.data.isbn is string &&
    request.resource.data.readingStatus in
      ['want_to_read', 'reading', 'read'] &&
    request.resource.data.dateAdded != null;
  allow update: if
    request.auth != null &&
    request.auth.uid == uid &&
    request.resource.data.isbn == resource.data.isbn;
}
```

---

## TypeScript Interfaces

```typescript
// lib/types/book.ts

export interface Book {
  isbn: string;              // ISBN-13
  title: string;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  categories: string[];
  source: 'google_books' | 'manual';
  cachedAt: Date;
}

export interface BookNotFound {
  isbn: string;
  found: false;
}
```

```typescript
// lib/types/bookshelf-entry.ts

export type ReadingStatus = 'want_to_read' | 'reading' | 'read';

export interface BookshelfEntry {
  entryId: string;
  isbn: string;              // ISBN-13 (normalised)
  readingStatus: ReadingStatus;
  dateAdded: Date;
  updatedAt: Date;
  notes: string;
  titleOverride?: string;
  authorsOverride?: string[];
  coverImageUrlOverride?: string;
}

export interface CreateBookshelfEntryInput {
  isbn: string;
  titleOverride?: string;
  authorsOverride?: string[];
  coverImageUrlOverride?: string;
  notes?: string;
  // readingStatus defaults to 'want_to_read' — not accepted from client
}
```

---

## ISBN Normalisation

Both ISBN-10 and ISBN-13 are accepted as user input. All internal storage uses
ISBN-13 only.

- ISBN-10 → ISBN-13: prepend `"978"`, recalculate check digit (standard algorithm)
- Strip hyphens before normalisation
- Validation: ISBN-10 check digit validation; ISBN-13 checksum validation

This normalisation happens in the server API route before any Firestore or Google
Books API operation.
