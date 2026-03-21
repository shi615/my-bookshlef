# Feature Specification: Add Book via ISBN Scan

**Feature Branch**: `001-add-book-isbn`
**Created**: 2026-03-21
**Status**: Draft
**Input**: User description: "添加书功能:上传或者拍照书的isbn，然后在gcp自动识别书的isbn，然后把书的相关信息保存在gcp，然后反映到前端。"

## Clarifications

### Session 2026-03-21

- Q: When a user tries to add a book already in their shelf, what happens after the warning? → A: Warn + allow — user sees the warning and can choose to add anyway or cancel.
- Q: Can the user select a reading status during the add flow, or is it fixed to "Want to Read"? → A: Fixed "Want to Read" at add time; user changes it from their shelf later.
- Q: Should the system recognize ISBNs from printed text as well as barcodes? → A: Barcode only — ISBN is extracted exclusively from the barcode stripe, not printed text.
- Q: What fields are available for manual entry when an ISBN is not found in the catalogue? → A: Title, author (required), and optional cover image upload.
- Q: Is the bookshelf private or can others view it? → A: Private only — visible to the owner only; no sharing or public access.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan ISBN and Add Book (Priority: P1)

A user wants to add a book to their digital bookshelf by taking a photo of (or
uploading an image of) the book's barcode. The system reads the ISBN from the image,
fetches the book's details automatically, and saves the book to the user's shelf —
all without manual data entry.

**Why this priority**: This is the core value proposition of the feature.
Zero-manual-entry book addition via image is the primary reason the feature exists.

**Independent Test**: Can be fully tested by uploading a clear barcode image and
confirming a book record appears in the user's bookshelf with correct title, author,
and cover. Delivers a complete end-to-end add-book experience.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the "Add Book" screen, **When** they upload a clear
   photo of a book's barcode, **Then** the system displays the recognized book's
   title, author, cover image, and description for confirmation.
2. **Given** the user is reviewing recognized book details, **When** they confirm the
   addition, **Then** the book appears in their bookshelf with status "Want to Read"
   and an accurate timestamp.
3. **Given** the user is reviewing recognized book details, **When** they cancel,
   **Then** no book is saved and the user is returned to their bookshelf.

---

### User Story 2 - Manual ISBN Fallback (Priority: P2)

When the image scan fails to recognize an ISBN (blurry photo, damaged barcode), the
user can manually type the ISBN number to still complete the add-book flow.

**Why this priority**: Fallback prevents the user from being blocked when image
recognition is imperfect. Significantly improves reliability without requiring a
second attempt.

**Independent Test**: Can be fully tested by triggering the manual entry form (or
skipping scan entirely), entering a valid ISBN, and confirming the book is added
correctly.

**Acceptance Scenarios**:

1. **Given** an image scan that fails to detect an ISBN, **When** the error is
   shown, **Then** the user is offered an option to enter the ISBN manually.
2. **Given** the user enters a valid ISBN-13 or ISBN-10 manually, **When** they
   submit, **Then** the system fetches and displays the book's details for
   confirmation.
3. **Given** the user enters an unrecognized or invalid ISBN, **When** they submit,
   **Then** the system shows a clear error message and allows re-entry.

---

### User Story 3 - Edit Details Before Saving (Priority: P3)

After the system auto-fills book details from the ISBN, the user can edit any field
(title, author, notes) before saving, in case the fetched data is incomplete or
contains errors.

**Why this priority**: Improves data quality for edge cases (rare editions,
multi-volume sets) without being part of the primary happy path.

**Independent Test**: Can be fully tested by modifying the auto-filled title field
and confirming the saved book record reflects the edited value.

**Acceptance Scenarios**:

1. **Given** auto-filled book details are displayed, **When** the user edits any
   field and confirms, **Then** the saved book record stores the user's edited values.
2. **Given** the user edits a field, **When** they decide to revert, **Then** they
   can reset the field to the originally fetched value.

---

### User Story 4 - Add Duplicate Book (Priority: P3)

When a user tries to add a book they already have on their shelf, the system warns
them and lets them decide whether to proceed or cancel. This supports legitimate use
cases such as owning multiple physical copies or different editions.

**Why this priority**: Rare scenario; the primary flow is unaffected. Handling it
gracefully avoids silent data issues without blocking normal usage.

**Independent Test**: Can be tested by adding the same ISBN twice — confirming the
warning appears on the second attempt, and that proceeding results in two entries
while cancelling results in no new entry.

**Acceptance Scenarios**:

1. **Given** a user whose shelf already contains a book with a given ISBN, **When**
   they attempt to add the same ISBN again, **Then** the system displays a warning:
   "This book is already in your shelf. Add another copy?"
2. **Given** the duplicate warning is shown, **When** the user confirms, **Then** a
   second BookshelfEntry is saved for the same ISBN.
3. **Given** the duplicate warning is shown, **When** the user cancels, **Then** no
   new entry is created and the user is returned to the review screen.

---

### Edge Cases

- What happens when the uploaded image contains multiple barcodes (e.g., price tag
  and ISBN on the same photo)? — System uses the ISBN barcode; if ambiguous, picks
  the first valid ISBN found.
- What happens when the ISBN is valid but the book is not in the catalogue? — System
  shows a "Book not found" message and offers a manual entry form with required fields
  (title, author) and an optional cover image upload.
- What happens when the user tries to add a book already in their shelf? — System
  shows a warning ("This book is already in your shelf. Add another copy?") and
  allows the user to confirm (creating a second entry) or cancel.
- What happens when the image upload fails due to network error? — System shows an
  error with a retry option; no partial data is saved.
- What happens with very large image files? — System accepts standard camera photos
  (up to 10 MB); displays an error for files that are too large.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept an image file upload (JPEG, PNG, HEIC) of a book
  barcode from the user's device.
- **FR-002**: System MUST accept live camera capture of a barcode as an alternative
  to file upload (on supported devices).
- **FR-003**: System MUST extract the ISBN number from the barcode stripe in the
  uploaded image without requiring user input. Recognition of printed ISBN text is
  out of scope.
- **FR-004**: System MUST support both ISBN-10 and ISBN-13 formats.
- **FR-005**: System MUST fetch the following book metadata using the extracted ISBN:
  title, author(s), publisher, publication year, cover image, and description.
- **FR-006**: System MUST display the fetched book details to the user for review
  before saving.
- **FR-007**: System MUST save the confirmed book record to the user's bookshelf
  with a default reading status of "Want to Read".
- **FR-008**: System MUST display the newly saved book in the user's bookshelf
  immediately after confirmation.
- **FR-009**: System MUST provide a manual ISBN entry option when image recognition
  fails.
- **FR-009a**: When a valid ISBN is not found in the catalogue, system MUST present
  a manual entry form with required fields (title, author) and an optional cover
  image upload; all other metadata fields (publisher, year, description) are omitted
  from this fallback form.
- **FR-010**: System MUST allow the user to edit auto-filled book details before
  saving.
- **FR-011**: System MUST show a warning ("This book is already in your shelf. Add
  another copy?") when the user attempts to add an ISBN already present in their
  shelf; the user MUST be able to confirm (creating a second BookshelfEntry) or
  cancel (no new entry created).
- **FR-012**: System MUST reject image files larger than 10 MB with a clear error
  message.
- **FR-013**: System MUST show a meaningful error message for each failure mode
  (unreadable barcode, ISBN not found, network error).

### Key Entities

- **Book**: Represents catalogue-level book data — ISBN (unique identifier), title,
  author(s), publisher, publication year, cover image URL, description, genre/category.
  Shared across users; same ISBN is not duplicated in the catalogue.
- **BookshelfEntry**: Represents a user's personal copy of a book on their shelf —
  links a user to a Book, stores reading status ("Want to Read" / "Reading" / "Read"),
  date added, and personal notes. A user may have multiple BookshelfEntries for the
  same ISBN (duplicate entries are allowed after explicit user confirmation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a book to their shelf in under 60 seconds from opening
  the "Add Book" screen to seeing it appear in their bookshelf.
- **SC-002**: ISBN recognition succeeds for at least 90% of clearly photographed,
  undamaged barcodes on first attempt.
- **SC-003**: Book metadata (title, author, cover) is correctly retrieved and
  displayed for at least 95% of successfully recognized ISBNs.
- **SC-004**: At least 80% of users complete the add-book flow without using the
  manual ISBN fallback (indicating scan quality meets expectations).
- **SC-005**: Users encounter zero data loss — no book record is partially saved;
  a book is either fully saved or not saved at all.

## Assumptions

- Users are authenticated before reaching the "Add Book" screen; this feature does
  not cover login or registration.
- The bookshelf is private — only the authenticated owner can view or modify their
  own shelf. No sharing, public links, or social visibility are in scope.
- A book catalogue service is available to look up metadata by ISBN; if a title is
  not found in the catalogue, the user falls back to manual detail entry.
- "Want to Read" is the appropriate default reading status for a newly added book;
  users can change it later from their shelf.
- Duplicate detection is per user (same ISBN can exist in different users' shelves).
- A user may intentionally hold multiple copies of the same book; duplicate entries
  are permitted after explicit confirmation.
