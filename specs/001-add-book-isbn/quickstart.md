# Quickstart: Add Book via ISBN Scan

**Branch**: `001-add-book-isbn`

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- GCP project with the following APIs enabled:
  - Vertex AI API
  - Firestore API
  - Firebase Authentication
- Google Books API key (via Google Cloud Console)
- Vertex AI service account with `roles/aiplatform.user`

---

## Environment Variables

Create `.env.local` at the repo root:

```bash
# Firebase client (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Firebase Admin (server-side only — keep secret)
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google services (server-side only)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_BOOKS_API_KEY=...          # From Google Cloud Console → APIs & Services → Credentials
VERTEX_AI_LOCATION=asia-northeast1

# Local development
NEXT_PUBLIC_USE_EMULATOR=true     # Set to false in production
```

For production (Cloud Run), store secrets in **GCP Secret Manager** and mount as
environment variables — do not commit `.env.local` to the repository.

---

## Local Development

### 1. Start Firebase emulators

```bash
firebase emulators:start
```

Emulators start at:
- Firestore: `http://localhost:8080`
- Auth: `http://localhost:9099`
- Emulator UI: `http://localhost:4000`

### 2. Start Next.js dev server

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### 3. Add a book (dev flow)

1. Open `http://localhost:3000/books/add`
2. Upload or capture a barcode image
3. Review the auto-filled details
4. Confirm to save to your shelf

---

## Running Tests

### Unit tests (no emulator needed)

```bash
npm run test:unit
```

### Integration tests (requires emulator running)

```bash
# Terminal 1
firebase emulators:start

# Terminal 2
npm run test:integration
```

### All tests

```bash
npm run test
```

---

## Deploying to Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/my-bookshelf

# Deploy
gcloud run deploy my-bookshelf \
  --image gcr.io/$PROJECT_ID/my-bookshelf \
  --platform managed \
  --region asia-northeast1 \
  --set-env-vars NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID \
  --set-secrets FIREBASE_ADMIN_PRIVATE_KEY=firebase-admin-key:latest \
  --set-secrets GOOGLE_BOOKS_API_KEY=google-books-api-key:latest
```

---

## Key Source Files

| File | Purpose |
|---|---|
| `app/api/books/scan/route.ts` | POST — image → ISBN (Gemini) + metadata (Google Books) |
| `app/api/books/shelf/route.ts` | GET list / POST add entry |
| `app/api/auth/login/route.ts` | POST — exchange ID token for session cookie |
| `lib/gemini/isbn-extractor.ts` | Gemini Vision call for barcode → ISBN |
| `lib/books/catalogue.ts` | Google Books API lookup + Firestore cache |
| `lib/books/shelf.ts` | BookshelfEntry CRUD (server-side Firestore) |
| `lib/auth/session.ts` | Session cookie verification helper |
| `components/books/ISBNScanner.tsx` | Camera/upload UI |
| `firestore.rules` | Firestore security rules |
| `firebase.json` | Emulator configuration |
