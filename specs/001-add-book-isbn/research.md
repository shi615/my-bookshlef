# Research: Add Book via ISBN Scan

**Branch**: `001-add-book-isbn` | **Date**: 2026-03-21

---

## Decision 1: Gemini Model for Barcode Extraction

**Decision**: Use `gemini-2.5-flash` on Vertex AI for barcode/ISBN extraction from images.

**Rationale**: Gemini 2.5 Flash ranks top-tier on OCR/barcode benchmarks (ELO 1655 on OCR
Arena) at lower cost than Pro models. It supports structured JSON output with
`responseMimeType: "application/json"`, which enables schema-enforced ISBN extraction
with confidence scores. Newer than `gemini-1.5-flash`, which should not be used for
this task.

**Alternatives considered**:
- `gemini-2.0-flash` — older generation, lower OCR quality than 2.5 Flash.
- Cloud Vision API (standalone barcode detection) — violates Constitution Principle IV
  (AI via Gemini). Not permitted.
- Gemini models with "Thinking" mode — degrades OCR quality; not appropriate for
  deterministic barcode extraction.

---

## Decision 2: Vertex AI SDK for Node.js

**Decision**: Use `@google/genai` (the Google Gen AI SDK for JavaScript/TypeScript).

**Rationale**: The previous `@google-cloud/vertexai` SDK was deprecated on 2025-06-24
and will be removed 2026-06-24. `@google/genai` is the current recommended SDK, supports
both Vertex AI and Gemini Developer API, and is actively maintained.

**Alternatives considered**:
- `@google-cloud/vertexai` — deprecated; would require migration before EOL.
- Vercel AI SDK (`@ai-sdk/google-vertex`) — adds unnecessary abstraction layer;
  violates Constitution Principle VI (Simplicity).

---

## Decision 3: Image Input Method for Gemini

**Decision**: Pass image as base64-encoded inline bytes in the API request body.
Do not upload to Cloud Storage before calling Gemini.

**Rationale**: Base64 inline supports up to 100 MB encoded payload (20 MB raw), which
covers the 10 MB maximum enforced by the app. Avoids the extra latency of a GCS upload
step and the operational overhead of managing temporary bucket objects. Constitution
Principle VI (Simplicity) favours the simpler path.

**Alternatives considered**:
- Upload to Cloud Storage first, then pass GCS URI — adds ~500ms latency, requires
  temporary object lifecycle management. No benefit at ≤10 MB.

---

## Decision 4: Firebase Auth + Next.js Session Pattern

**Decision**: Exchange Firebase ID token for an httpOnly session cookie via
`POST /api/auth/login`. Verify the session cookie on every protected API route using
`firebase-admin`.

**Rationale**: Session cookies are more secure than passing ID tokens on every request
(tokens are short-lived; cookies are httpOnly, preventing JS access). `firebase-admin`
verifies cookies server-side; the client never touches raw Firestore directly except
through API routes. Works with Next.js Node.js runtime (not Edge Runtime).

**Alternatives considered**:
- Pass ID token as `Authorization: Bearer <token>` header on every request — valid but
  requires client to refresh the token frequently; less idiomatic for web apps.
- `next-firebase-auth-edge` — needed only for Edge Runtime; overkill for Cloud Run
  deployment where Node.js runtime is used.

---

## Decision 5: Firestore Collection Structure

**Decision**:
- `/books/{isbn}` — shared catalogue cache (ISBN as document ID)
- `/users/{uid}/bookshelfEntries/{entryId}` — user's shelf entries (auto-generated ID)

**Rationale**: Subcollection scopes all entry queries naturally to a single user,
making security rules trivial (`request.auth.uid == uid`). Using ISBN as the Book
document ID enables O(1) lookups and deduplication without a query. Auto-generated IDs
for entries support multiple entries per ISBN without collision.

**Alternatives considered**:
- Single flat `bookshelfEntries` collection with `userId` field — requires composite
  indexes for queries; security rules are more complex.
- Embedding entries in the user document — Firestore 1 MB document limit becomes a
  concern for large shelves.

---

## Decision 6: Book Metadata — Cache vs Live API

**Decision**: Hybrid caching — check `/books/{isbn}` in Firestore first (30-day TTL);
on cache miss or expired entry, fetch from Google Books API and upsert Firestore.
Cache write happens server-side only (API route), never from the client.

**Rationale**: Google Books API is free for standard use but has per-project quotas.
Caching reduces repeated API calls for popular ISBNs. 30-day TTL balances freshness
with cost. Cache writes are server-side only to comply with Firestore security rules
(`/books/{isbn}` is write-restricted to admin/server).

**Google Books API details**:
- Endpoint: `GET https://www.googleapis.com/books/v1/volumes?q=isbn:{ISBN}&key={KEY}`
- Returns: `items[0].volumeInfo` with title, authors, publisher, publishedDate,
  description, imageLinks, categories
- Empty `items` array when ISBN not found
- Requires API key (not OAuth); managed via Secret Manager

**Alternatives considered**:
- Always live (no cache) — hits Google Books API quota for every scan.
- Always cached (no expiry) — stale metadata for corrected records.
- OpenLibrary API — third-party service; Google Books is a Google service with
  better coverage for Japanese-market books.

---

## Decision 7: Testing Strategy

**Decision**: Vitest for all tests. Firebase Local Emulator Suite for Firestore and
Auth in integration tests. Unit tests mock external services (Gemini, Google Books API).

**Rationale**: Constitution Principle III mandates Firebase Emulator for integration
tests (no mocking Firestore or Auth). Vitest is fast and native ESM-friendly, well-
suited for Next.js TypeScript projects.

**Emulator ports**:
- Firestore: `localhost:8080`
- Auth: `localhost:9099`

**Test organisation**:
- `tests/unit/` — pure business logic, no I/O (mock Gemini and Google Books API)
- `tests/integration/` — API routes against emulator; test full scan + save flow

---

## Resolved NEEDS CLARIFICATION Items

All technical unknowns from the initial plan template are resolved above.
No remaining NEEDS CLARIFICATION items.
