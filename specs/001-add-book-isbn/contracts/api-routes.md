# API Contracts: Add Book via ISBN Scan

**Branch**: `001-add-book-isbn` | **Date**: 2026-03-21

All routes are Next.js App Router route handlers (`app/api/...`). All protected routes
require a valid session cookie (`session`) set by `POST /api/auth/login`.

---

## Auth Routes

### POST /api/auth/login

Exchange a Firebase ID token for a session cookie.

**Request**:
```json
{
  "idToken": "string"  // Firebase ID token from client SDK
}
```

**Response 200**:
```json
{ "ok": true }
```
Sets `Set-Cookie: session=<cookie>; HttpOnly; Secure; SameSite=Lax; Max-Age=432000`

**Response 401**:
```json
{ "error": "Invalid ID token" }
```

---

### POST /api/auth/logout

Clear the session cookie.

**Request**: no body

**Response 200**:
```json
{ "ok": true }
```
Sets `Set-Cookie: session=; Max-Age=0`

---

## Books Routes

### POST /api/books/scan

Extract an ISBN from an uploaded barcode image, then fetch book metadata.
**Protected** (requires session cookie).

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | `File` | Yes | JPEG, PNG, or HEIC; max 10 MB |

**Response 200 — ISBN recognised and book found in catalogue**:
```json
{
  "result": "found",
  "isbn": "9784101092058",
  "book": {
    "isbn": "9784101092058",
    "title": "ノルウェイの森",
    "authors": ["村上春樹"],
    "publisher": "新潮社",
    "publishedDate": "2004",
    "description": "...",
    "coverImageUrl": "https://books.google.com/...",
    "categories": ["Fiction"]
  }
}
```

**Response 200 — ISBN recognised but book not in catalogue**:
```json
{
  "result": "not_in_catalogue",
  "isbn": "9784101092058",
  "book": null
}
```

**Response 200 — ISBN not detected in image**:
```json
{
  "result": "barcode_not_detected",
  "isbn": null,
  "book": null
}
```

**Response 400**:
```json
{ "error": "Image file required" }
{ "error": "File too large (max 10 MB)" }
{ "error": "Unsupported file type. Use JPEG, PNG, or HEIC." }
```

**Response 401**: `{ "error": "Unauthorized" }`

**Response 500**: `{ "error": "Internal server error" }`

---

### POST /api/books/shelf

Save a book to the authenticated user's shelf.
**Protected** (requires session cookie).

**Request**:
```json
{
  "isbn": "9784101092058",
  "titleOverride": "string (optional)",
  "authorsOverride": ["string"] ,
  "coverImageUrlOverride": "string (optional — data URL or GCS URL)",
  "notes": "string (optional, default '')"
}
```

**Response 201**:
```json
{
  "entryId": "abc123",
  "isbn": "9784101092058",
  "readingStatus": "want_to_read",
  "dateAdded": "2026-03-21T10:00:00Z",
  "notes": ""
}
```

**Response 400**:
```json
{ "error": "isbn is required" }
{ "error": "Invalid ISBN format" }
```

**Response 401**: `{ "error": "Unauthorized" }`

**Response 409 — duplicate detected** (book already exists in user's shelf):
```json
{
  "error": "duplicate",
  "message": "This book is already in your shelf.",
  "existingEntries": [
    {
      "entryId": "xyz789",
      "dateAdded": "2025-11-01T08:00:00Z",
      "readingStatus": "read"
    }
  ]
}
```
Client MUST show a confirmation dialog and re-submit with `"confirmDuplicate": true` to
proceed.

**Re-submit with confirmed duplicate**:
```json
{
  "isbn": "9784101092058",
  "confirmDuplicate": true
}
```
Response is 201 as normal; no further 409.

---

### GET /api/books/shelf

Retrieve the authenticated user's bookshelf entries.
**Protected** (requires session cookie).

**Query parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | (none) | Filter by reading status: `want_to_read`, `reading`, or `read` |
| `limit` | `number` | `50` | Max entries to return (1–100) |
| `after` | `string` | (none) | Cursor for pagination (entryId of last item) |

**Response 200**:
```json
{
  "entries": [
    {
      "entryId": "abc123",
      "isbn": "9784101092058",
      "readingStatus": "want_to_read",
      "dateAdded": "2026-03-21T10:00:00Z",
      "notes": "",
      "book": {
        "title": "ノルウェイの森",
        "authors": ["村上春樹"],
        "coverImageUrl": "https://..."
      }
    }
  ],
  "nextCursor": "abc124 or null"
}
```

**Response 401**: `{ "error": "Unauthorized" }`

---

## Error Format

All error responses follow:
```json
{
  "error": "machine-readable code or short description",
  "message": "human-readable explanation (optional)"
}
```

HTTP status codes used: `200`, `201`, `400`, `401`, `409`, `500`.
