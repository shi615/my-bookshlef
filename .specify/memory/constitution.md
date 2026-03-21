<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification)
Modified principles: N/A — first authoring
Added sections:
  - Core Principles (I–VI)
  - Technology Stack
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (structure-only)
  - .specify/templates/spec-template.md ✅ no changes needed (structure-only)
  - .specify/templates/tasks-template.md ✅ no changes needed (structure-only)
Follow-up TODOs: none — all placeholders resolved
-->

# My Bookshelf Constitution

## Core Principles

### I. GCP-First Backend

All server-side logic, data storage, AI processing, and authentication MUST run on
GCP. No self-hosted backend infrastructure is permitted. The canonical service mapping
for this project is:

- **Auth** → Firebase Authentication
- **Database** → Firestore
- **AI/ML** → Vertex AI / Gemini API
- **File storage** → Cloud Storage (book cover images, assets)
- **Server / API** → Cloud Run (containerized Next.js API routes)
- **Search** → Firestore queries; escalate to Vertex AI Search only when Firestore
  queries provably cannot meet requirements

Any deviation (e.g., using a non-GCP service) MUST be documented in the plan's
Complexity Tracking table with explicit justification.

### II. Next.js Frontend

The web UI MUST be built with Next.js (App Router, TypeScript). Specific rules:

- Server Components are the default for data-heavy or read-only views
- Client Components are used only where browser interactivity is required
- Styling MUST use Tailwind CSS; no additional CSS-in-JS libraries unless justified
- Next.js is the single frontend artifact — no separate React SPA alongside it
- All API calls from the frontend MUST go through Next.js API routes or Server
  Actions; the browser MUST NOT call GCP services directly (except Firebase Auth SDK)

### III. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory for all features:

1. Tests written and approved by user BEFORE any implementation starts
2. Tests MUST fail (red) before implementation begins
3. Implement until tests pass (green), then refactor
4. Unit tests: Jest or Vitest
5. Integration tests MUST use Firebase Local Emulator Suite — mocking Firestore or
   Firebase Auth in integration tests is PROHIBITED to prevent mock/prod divergence
6. No feature is considered complete without passing tests at both unit and
   integration levels

### IV. AI via Gemini

All AI/ML features (recommendations, metadata extraction, smart search, summaries)
MUST use Vertex AI / Gemini API. Rules:

- No third-party AI services (OpenAI, Anthropic, Cohere, etc.) are permitted
- AI calls MUST go through a dedicated server-side service layer
- The browser MUST NOT call Vertex AI or Gemini endpoints directly
- Prompts and AI logic are server-side only (Next.js API routes / Server Actions)
- AI feature responses MUST be validated before being persisted or displayed

### V. Security by Design

- Firebase Authentication is required for all user-facing write operations
- All Firestore Security Rules MUST enforce access control at the database level;
  API-level checks alone are insufficient
- GCP IAM: each service MUST use a least-privilege service account
- Secrets and credentials MUST be stored in GCP Secret Manager — never in source
  code, environment files committed to the repository, or logs
- Authentication state MUST be verified server-side on all sensitive routes

### VI. Simplicity (YAGNI)

Start with the minimum viable implementation for each feature:

- No premature abstraction; add layers only when a second real use case demands it
- Direct GCP SDK usage is preferred over custom wrapper layers
- Three similar code blocks are acceptable; abstract only on the fourth genuine need
- Any added complexity MUST be justified in the plan's Complexity Tracking table
- Feature flags, backwards-compatibility shims, and speculative extensibility are
  prohibited unless required by a concrete current requirement

## Technology Stack

The following stack is locked for all features. Deviations require constitution
amendment.

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14+ / App Router / TypeScript |
| Styling | Tailwind CSS |
| Auth | Firebase Authentication |
| Database | Firestore |
| File storage | Cloud Storage |
| Server / deployment | Cloud Run (containerized) |
| AI / ML | Vertex AI / Gemini API |
| Local dev emulation | Firebase Local Emulator Suite |
| CI / CD | Cloud Build |

## Development Workflow

- **Local development**: `firebase emulators:start` provides Firestore + Auth
  emulators; the app MUST run fully locally against emulators without hitting
  production GCP services
- **Feature flow**: `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` →
  `/speckit.implement`
- **Constitution check**: every plan.md MUST include a Constitution Check gate that
  is passed before Phase 0 research begins and re-verified after Phase 1 design
- **Deployment**: features are deployed to Cloud Run via Cloud Build triggers on
  merge to `main`

## Governance

This constitution supersedes all other practices and preferences. Amendment procedure:

1. Propose amendment with rationale in a constitution PR
2. Increment version (MAJOR: principle removal/redefinition; MINOR: new principle
   or section; PATCH: wording/clarification)
3. Run the consistency propagation checklist across templates before merging
4. All PRs and spec reviews MUST verify compliance with current constitution version

**Version**: 1.0.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
