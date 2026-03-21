# Tasks: Add Book via ISBN Scan

**Input**: Design documents from `/specs/001-add-book-isbn/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Constitution Principle III (Test-First, NON-NEGOTIABLE) requires tests.
All test tasks MUST be written and confirmed to FAIL before the corresponding
implementation task begins.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US4)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialisation and base configuration

- [x] T001 Create Next.js 14 App Router project with TypeScript and Tailwind CSS (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`)
- [x] T002 [P] Configure Firebase emulator suite — Firestore port 8080, Auth port 9099 (`firebase.json`, `.firebaserc`)
- [x] T003 [P] Configure Vitest with Node environment and emulator setup file (`vitest.config.ts`, `tests/setup.ts`)
- [x] T004 [P] Configure ESLint and Prettier for TypeScript and Next.js (`.eslintrc.json`, `.prettierrc`)

**Checkpoint**: Project scaffolding complete; `npm run dev` starts without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can begin

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define TypeScript interfaces for Book and BookshelfEntry (`lib/types/book.ts`, `lib/types/bookshelf-entry.ts`)
- [x] T006 [P] Initialise Firebase Admin SDK singleton for server-side use (`lib/firebase/admin.ts`)
- [x] T007 [P] Initialise Firebase client SDK for browser use (`lib/firebase/client.ts`)
- [x] T008 Write unit tests for ISBN-10/ISBN-13 normalisation and validation — MUST FAIL before T009 (`tests/unit/lib/books/isbn.test.ts`)
- [x] T009 Implement ISBN normalisation (ISBN-10 → ISBN-13) and validation utility (`lib/books/isbn.ts`) — make T008 pass
- [x] T010 Implement session cookie verification helper using firebase-admin (`lib/auth/session.ts`) — depends on T006
- [x] T011 [P] Implement POST /api/auth/login route — exchange ID token for httpOnly session cookie (`app/api/auth/login/route.ts`) — depends on T010
- [x] T012 [P] Implement POST /api/auth/logout route — clear session cookie (`app/api/auth/logout/route.ts`) — depends on T010
- [x] T013 Write Firestore security rules: `/books/{isbn}` public-read/admin-write; `/users/{uid}/bookshelfEntries/{entryId}` owner-only (`firestore.rules`)

**Checkpoint**: Auth flow works end-to-end; ISBN utility tests pass; Firestore rules deployed to emulator

---

## Phase 3: User Story 1 — Scan ISBN and Add Book (Priority: P1) 🎯 MVP

**Goal**: User photographs or uploads a barcode image; system extracts ISBN via Gemini,
fetches metadata from Google Books API, and saves the book to the user's shelf.

**Independent Test**: Upload a clear barcode image → book appears in shelf with correct
title, author, and cover. Zero manual data entry required.

### Tests for User Story 1 — WRITE FIRST, MUST FAIL

> Write these tests before any implementation. Confirm red before writing code.

- [x] T014 [P] [US1] Unit tests for Gemini ISBN extractor — mock Vertex AI SDK, test structured output parsing (`tests/unit/lib/gemini/isbn-extractor.test.ts`)
- [x] T015 [P] [US1] Unit tests for book catalogue service — mock Google Books API + Firestore, test cache hit/miss/expiry (`tests/unit/lib/books/catalogue.test.ts`)
- [x] T016 [P] [US1] Integration tests for POST /api/books/scan — test barcode_not_detected, not_in_catalogue, and found responses against emulator (`tests/integration/api/books/scan.test.ts`)
- [x] T017 [P] [US1] Integration tests for GET and POST /api/books/shelf — test add entry and list entries against emulator (`tests/integration/api/books/shelf.test.ts`)

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement Gemini Vision ISBN extractor — send base64 image to gemini-2.5-flash, return `{ isbn, confidence }` (`lib/gemini/isbn-extractor.ts`) — depends on T014, T006
- [x] T019 [P] [US1] Implement Google Books API lookup + Firestore 30-day cache service (`lib/books/catalogue.ts`) — depends on T015, T005, T006
- [x] T020 [P] [US1] Implement BookshelfEntry CRUD service — create entry with default `want_to_read` status (`lib/books/shelf.ts`) — depends on T005, T006
- [x] T021 [US1] Implement POST /api/books/scan route — receive multipart image, call isbn-extractor, call catalogue, return scan result (`app/api/books/scan/route.ts`) — depends on T018, T019, T010, T009
- [x] T022 [US1] Implement GET and POST /api/books/shelf route — list user entries and add new BookshelfEntry (`app/api/books/shelf/route.ts`) — depends on T020, T010, T009
- [x] T023 [P] [US1] Build ISBNScanner client component — file upload input and camera capture button, POST image to /api/books/scan (`components/books/ISBNScanner.tsx`)
- [x] T024 [P] [US1] Build BookConfirmCard component — display fetched title, authors, cover and description with Confirm/Cancel buttons (`components/books/BookConfirmCard.tsx`)
- [x] T025 [US1] Build Add Book page — compose ISBNScanner and BookConfirmCard, handle scan result states, POST confirmed entry to /api/books/shelf (`app/books/add/page.tsx`) — depends on T023, T024, T021, T022
- [x] T026 [US1] Build Bookshelf page as Server Component — fetch user's shelf entries and render book grid (`app/bookshelf/page.tsx`) — depends on T022

**Checkpoint**: End-to-end scan-to-shelf flow works. US1 acceptance scenarios pass.

---

## Phase 4: User Story 2 — Manual ISBN Fallback (Priority: P2)

**Goal**: When barcode scan fails, user can type the ISBN manually to complete
the add-book flow.

**Independent Test**: Trigger manual entry form, type a valid ISBN, confirm book is
added to shelf correctly.

### Tests for User Story 2 — WRITE FIRST, MUST FAIL

- [x] T027 [P] [US2] Integration tests for manual ISBN entry — test scan route called with direct ISBN text path and not-in-catalogue manual entry path (`tests/integration/api/books/scan-manual.test.ts`)

### Implementation for User Story 2

- [x] T028 [P] [US2] Build ManualEntryForm component — text field for ISBN input with submit/cancel actions (`components/books/ManualEntryForm.tsx`)
- [x] T029 [P] [US2] Build ManualBookEntryForm component — required title and author fields, optional cover image upload for not-in-catalogue books (`components/books/ManualBookEntryForm.tsx`)
- [x] T030 [US2] Wire ManualEntryForm into Add Book page — show on `barcode_not_detected` scan result, re-submit with typed ISBN (`app/books/add/page.tsx`) — depends on T028, T025
- [x] T031 [US2] Wire ManualBookEntryForm into Add Book page — show on `not_in_catalogue` result, save with title/author/cover overrides (`app/books/add/page.tsx`) — depends on T029, T030

**Checkpoint**: Manual fallback paths work. US2 acceptance scenarios pass. US1 flow unaffected.

---

## Phase 5: User Story 3 — Edit Details Before Saving (Priority: P3)

**Goal**: User can edit any auto-filled book field before confirming, with option to
reset back to the fetched value.

**Independent Test**: Modify the auto-filled title field; confirm saved entry stores the
edited value; verify reset restores the original fetched value.

### Tests for User Story 3 — WRITE FIRST, MUST FAIL

- [x] T032 [P] [US3] Unit tests for override field merge logic — verify titleOverride, authorsOverride take precedence over catalogue fields in display (`tests/unit/lib/books/shelf-override.test.ts`)

### Implementation for User Story 3

- [x] T033 [P] [US3] Update BookConfirmCard to make all fields editable with inline inputs and per-field reset-to-original button (`components/books/BookConfirmCard.tsx`) — depends on T024
- [x] T034 [US3] Update POST /api/books/shelf route to accept and persist `titleOverride`, `authorsOverride`, `coverImageUrlOverride` fields (`app/api/books/shelf/route.ts`) — depends on T022
- [x] T035 [US3] Update Bookshelf page to merge and display override fields when present (`app/bookshelf/page.tsx`) — depends on T026

**Checkpoint**: Edit-before-save flow works. US3 acceptance scenarios pass. US1/US2 flows unaffected.

---

## Phase 6: User Story 4 — Add Duplicate Book (Priority: P3)

**Goal**: When a user adds a book already on their shelf, show a warning and let them
confirm or cancel. Two entries are allowed after explicit confirmation.

**Independent Test**: Add same ISBN twice — warning appears on second attempt; confirming
creates a second entry; cancelling creates no entry.

### Tests for User Story 4 — WRITE FIRST, MUST FAIL

- [x] T036 [P] [US4] Integration tests for duplicate detection — test 409 response on duplicate, test successful re-submit with confirmDuplicate flag (`tests/integration/api/books/shelf-duplicate.test.ts`)

### Implementation for User Story 4

- [x] T037 [P] [US4] Implement duplicate detection in BookshelfEntry service — query user's entries for matching ISBN before insert (`lib/books/shelf.ts`) — depends on T020
- [x] T038 [US4] Update POST /api/books/shelf route — return 409 with existing entries on duplicate; skip check when `confirmDuplicate: true` (`app/api/books/shelf/route.ts`) — depends on T037, T022
- [x] T039 [P] [US4] Build DuplicateWarningDialog component — shows existing entry details and Confirm/Cancel buttons (`components/books/DuplicateWarningDialog.tsx`)
- [x] T040 [US4] Wire DuplicateWarningDialog into Add Book page — intercept 409 response, show dialog, re-submit with `confirmDuplicate: true` on confirm (`app/books/add/page.tsx`) — depends on T039, T038, T025

**Checkpoint**: All four user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Reliability, UX completeness, and security hardening

- [x] T041 [P] Add Next.js error boundary UI for unhandled errors (`app/error.tsx`, `app/global-error.tsx`)
- [x] T042 [P] Add loading skeleton for bookshelf page while entries load (`app/bookshelf/loading.tsx`)
- [x] T043 [P] Security hardening — audit Firestore security rules against all data-model access patterns; verify httpOnly session cookie `Secure` and `SameSite=Lax` flags in production config
- [ ] T044 Run full test suite against Firebase emulator and validate all steps in `quickstart.md` end-to-end

**Checkpoint**: All tests green; full scan-to-shelf flow validated per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phases 3–6)**: All depend on Phase 2 completion; phases 3–6 can proceed
  sequentially in priority order (P1 → P2 → P3) or in parallel by team
- **Polish (Phase 7)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — start after Phase 2
- **US2 (P2)**: No dependency on US1 logic — shares Add Book page UI (T025); start after Phase 2
- **US3 (P3)**: Extends BookConfirmCard (T024) and shelf route (T022) from US1; start after US1
- **US4 (P3)**: Extends shelf service (T020) and shelf route (T022) from US1; start after US1

### Within Each User Story

1. Write tests → confirm they FAIL
2. Implement services and types
3. Implement API routes
4. Implement UI components
5. Wire together in page component
6. Confirm tests PASS

### Parallel Opportunities

- T002, T003, T004 — all Phase 1 setup tasks run in parallel
- T006, T007 — Firebase SDK inits run in parallel
- T011, T012 — auth login and logout routes run in parallel
- T014, T015, T016, T017 — all US1 test files can be written in parallel
- T018, T019, T020 — service implementations run in parallel (different files)
- T023, T024 — UI components run in parallel
- T028, T029 — US2 components run in parallel
- T039 — US4 dialog component runs in parallel with T037, T038

---

## Parallel Example: User Story 1

```bash
# Step 1 — Write all US1 tests in parallel (all must fail):
T014: tests/unit/lib/gemini/isbn-extractor.test.ts
T015: tests/unit/lib/books/catalogue.test.ts
T016: tests/integration/api/books/scan.test.ts
T017: tests/integration/api/books/shelf.test.ts

# Step 2 — Implement services in parallel:
T018: lib/gemini/isbn-extractor.ts
T019: lib/books/catalogue.ts
T020: lib/books/shelf.ts

# Step 3 — Implement UI components in parallel:
T023: components/books/ISBNScanner.tsx
T024: components/books/BookConfirmCard.tsx

# Step 4 — Wire together (sequential):
T021: app/api/books/scan/route.ts
T022: app/api/books/shelf/route.ts
T025: app/books/add/page.tsx
T026: app/bookshelf/page.tsx
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (T014 → T026)
4. **STOP and VALIDATE**: Upload a barcode image, confirm book appears in shelf
5. Deploy MVP to Cloud Run

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 complete → scan-to-shelf works (MVP)
3. US2 complete → manual fallback works
4. US3 complete → edit-before-save works
5. US4 complete → duplicate handling works
6. Polish → production-ready

---

## Notes

- All test tasks MUST be written and confirmed FAILING before their implementation tasks (Constitution Principle III)
- [P] = different files, no unresolved task dependencies
- [USN] maps task to its user story for traceability
- Each user story phase ends with an independently testable checkpoint
- Firebase Local Emulator must be running (`firebase emulators:start`) for all integration tests
- Commit after each task or logical group; do not batch large changes
