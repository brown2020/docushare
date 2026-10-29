# DocuShare Current-State Spec

## Purpose

DocuShare is a collaborative document authoring application with rich editing, document sharing, Firebase-backed persistence, user profiles, payments, and AI-assisted writing.

## Current Implementation

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS 4 plus local UI primitives in `src/components/ui`.
- Authentication: Firebase email/password and Google sign-in on the client, Firebase Admin session cookies on the server, and route redirects in `src/proxy.ts`.
- Persistence: Firestore stores documents, user profiles, payment records, and document-sharing metadata. Firebase Storage is used for uploaded images and documents.
- Editor: Tiptap 3 is configured through `src/extensions/extension-kit.ts`; `src/components/CollaborativeEditor.tsx` loads/saves document content and listens for Firestore updates.
- AI: `src/app/api/ai/route.ts` selects user-configured provider keys from Firestore and routes requests through AI SDK providers.
- Uploads: `src/app/api/image/route.ts` requires an authenticated session for upload and read. It accepts JPG, PNG, GIF, WEBP, PDF, TXT, MD, CSV, and DOCX (5 MB max), sniffs the bytes, stores them under `uploads/{uid}/{uuid}.ext`, and streams them back only to the owner or to someone who can read a document that references the file. PDF, TXT, MD, CSV, and DOCX text is inserted into the editor so the existing AI commands can read it. Other types return a clear error.
- Payments: Stripe dependencies and payment components/actions support checkout and payment status flows.

## Key Workflows

- Sign in/sign up: `src/components/auth/*` uses Firebase email/password and Google through `src/providers/AuthProvider.tsx`, then posts an ID token to `/api/auth/session`.
- Protected navigation: `src/proxy.ts` redirects unauthenticated requests away from dashboard, profile, and payment pages when the `__session` cookie is absent.
- Document list and stats: `/api/docs` and `/api/docs/stats` read owned and shared documents for the verified session user.
- Sharing: `/api/share` verifies the session user, looks up the target user by email with Firebase Admin, and updates the document `share` array.
- Editing: `CollaborativeEditor` initializes a Firestore document when needed, loads existing Tiptap JSON content, subscribes to snapshot updates, and debounces saves.
- AI generation: authenticated users call `/api/ai`; model availability is derived from provider API keys stored in the user's profile document. Platform-key usage spends credits. A new account receives 1,000 starter credits once from the server (`claimStarterCredits`), even if the email is not verified. The grant is stored in `users/{uid}/private/starterCredits` and is not repeated after the balance is spent or after a Stripe purchase. Clients cannot write `credits`.
- Uploading: the editor Upload control posts to `/api/image`. Images become image blocks. PDF and the text document types above become a file link plus the extracted text, which AI commands read from the selection.

## Architecture Notes

- Server trust boundary: Firebase Admin verification in `src/lib/auth/session.ts` is the server-side source of truth for authenticated API routes.
- Client auth boundary: `src/hooks/useFirebaseAuth.ts` adapts provider state for UI components and should not be treated as server authorization.
- Data boundary: route handlers under `src/app/api` own Firestore Admin access for protected reads/writes; client components should prefer these routes for sensitive operations.
- Firestore rules boundary: user subcollections are scoped to the authenticated user ID, while document updates preserve owner metadata and allow only owners to change sharing metadata.
- Editor boundary: Tiptap extension configuration lives in `src/extensions`, while UI controls live under `src/components/menus` and `src/components/panels`.
- State boundary: Zustand stores hold UI/profile/payment state and should not bypass server authorization for protected operations.

## Validation

- Available project checks: `npm run lint` and `npm run build`.
- No dedicated automated test suite is currently defined in `package.json`.
- Codebase-improvement reports for this pass live under `agent-runs/2026-06-20-codebase-pass/`.

## Quality Risks

- Server API routes depend on Firebase Admin credentials being present at runtime.
- Firestore rules changes should be covered by emulator tests when a rules test harness is added.
- The editor save/snapshot flow is asynchronous and should be changed only with targeted validation because it touches initialization, remote updates, and local selection restoration.

## Roadmap

No product roadmap priorities are approved by this codebase-improvement pass.
