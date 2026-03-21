# Implementation Plan: Add Book via ISBN Scan

**Branch**: `001-add-book-isbn` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-add-book-isbn/spec.md`

## Summary

Enable users to add books to their personal digital shelf by photographing or uploading
a barcode image. The server extracts the ISBN using Gemini Vision (Vertex AI), fetches
book metadata from Google Books API (with Firestore caching), and saves a
`BookshelfEntry` to Firestore. A manual ISBN fallback and duplicate-confirmation flow
handle edge cases. The full add-book flow must complete in under 60 seconds.

## Technical Context

**Language/Version**: TypeScript — Next.js 14+ (App Router) / Node.js 20
**Primary Dependencies**: `@google/genai` (Vertex AI / Gemini), `firebase-admin`,
`firebase` (client SDK), Google Books REST API
**Storage**: Firestore — `/books/{isbn}` (catalogue cache) +
`/users/{uid}/bookshelfEntries/{entryId}` (user shelf)
**Testing**: Vitest (unit + integration); Firebase Local Emulator Suite (Firestore +
Auth) for integration tests
**Target Platform**: Web app (browser) served from Cloud Run (Node.js runtime)
**Project Type**: web-app (Next.js monorepo — frontend + API routes in one project)
**Performance Goals**: Full scan-to-saved flow ≤ 60 s; Gemini barcode extraction ≤ 5 s
p95; shelf page load ≤ 2 s
**Constraints**: Image upload max 10 MB; barcode-only recognition (no printed text OCR);
private shelf only; no Edge Runtime (firebase-admin requires Node.js)
**Scale/Scope**: Personal app — single authenticated user; low concurrent load

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|---|---|---|
| I. GCP-First Backend | ✅ Pass | Vertex AI / Gemini (AI), Firestore (DB), Firebase Auth, Cloud Run (server), Cloud Storage (optional cover upload) — no self-hosted backend |
| II. Next.js Frontend | ✅ Pass | App Router, TypeScript, Tailwind CSS; shelf view = Server Component; scanner = Client Component; no separate SPA |
| III. Test-First | ✅ Pass | Unit tests (Vitest) + integration tests (Firebase Emulator) written before implementation; Red-Green-Refactor enforced |
| IV. AI via Gemini | ✅ Pass | Barcode extraction uses `gemini-2.5-flash` on Vertex AI via `@google/genai`; Cloud Vision API standalone not used |
| V. Security by Design | ✅ Pass | Firebase Auth session cookie; Firestore security rules enforce owner-only access; Google Books API key in Secret Manager |
| VI. Simplicity (YAGNI) | ✅ Pass | No wrapper layers; direct SDK calls; base64 image inline (no temp GCS upload); Google Books REST API called directly |

No violations — Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-book-isbn/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-routes.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   └── login/
│       └── page.tsx              # Login page (Client Component)
├── bookshelf/
│   └── page.tsx                  # User's shelf (Server Component)
├── books/
│   └── add/
│       └── page.tsx              # Add book flow (Client Component)
└── api/
    ├── auth/
    │   ├── login/
    │   │   └── route.ts          # POST: ID token → session cookie
    │   └── logout/
    │       └── route.ts          # POST: clear session cookie
    └── books/
        ├── scan/
        │   └── route.ts          # POST: image → ISBN + metadata
        └── shelf/
            ├── route.ts          # GET: list entries; POST: add entry
            └── [entryId]/
                └── route.ts      # PATCH / DELETE

components/
├── books/
│   ├── ISBNScanner.tsx           # Camera/upload UI (Client Component)
│   ├── BookConfirmCard.tsx       # Review details before saving
│   ├── ManualEntryForm.tsx       # Fallback when scan fails or ISBN not found
│   └── DuplicateWarningDialog.tsx # Confirmation dialog for duplicate add
└── ui/                           # Shared UI primitives

lib/
├── firebase/
│   ├── admin.ts                  # Firebase Admin SDK singleton
│   └── client.ts                 # Firebase client SDK init
├── gemini/
│   └── isbn-extractor.ts         # Gemini Vision → { isbn, confidence }
├── books/
│   ├── catalogue.ts              # Google Books API + Firestore cache (30-day TTL)
│   ├── shelf.ts                  # BookshelfEntry CRUD (server-side)
│   └── isbn.ts                   # ISBN-10 → ISBN-13 normalisation + validation
├── auth/
│   └── session.ts                # verifySessionCookie() helper
└── types/
    ├── book.ts
    └── bookshelf-entry.ts

tests/
├── unit/
│   ├── lib/books/isbn.test.ts
│   ├── lib/books/catalogue.test.ts
│   └── lib/gemini/isbn-extractor.test.ts
└── integration/
    ├── api/books/scan.test.ts    # Against Firebase Emulator
    └── api/books/shelf.test.ts   # Against Firebase Emulator

firestore.rules
firebase.json
```

**Structure Decision**: Next.js monorepo (Option 2 — Web Application). Frontend and
API routes live together in one Next.js project deployed as a single Cloud Run service.
No separate backend container — simplest deployment unit consistent with Principle VI.
