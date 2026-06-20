# DocuShare Current-State Spec

## Purpose

DocuShare is a collaborative document authoring application with rich editing, document sharing, Firebase-backed persistence, user profiles, payments, and AI-assisted writing.

## Current Implementation

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS 4 plus local UI primitives in `src/components/ui`.
- Authentication: Firebase Auth on the client, Firebase Admin session cookies on the server, and route redirects in `src/proxy.ts`.
- Persistence: Firestore stores documents, user profiles, payment records, and document-sharing metadata. Firebase Storage is used for uploaded images.
- Editor: Tiptap 3 is configured through `src/extensions/extension-kit.ts`; `src/components/CollaborativeEditor.tsx` loads/saves document content and listens for Firestore updates.
- AI: `src/app/api/ai/route.ts` selects user-configured provider keys from Firestore and routes requests through AI SDK providers.
- Images: `src/app/api/image/route.ts` requires an authenticated session for upload/read paths, accepts supported image media types, generates opaque upload filenames, validates read keys, and streams Firebase Storage downloads without writing a local cache.
- Payments: Stripe dependencies and payment components/actions support checkout and payment status flows.

## Key Workflows

- Sign in/sign up: `src/components/auth/*` uses Firebase Auth through `src/providers/AuthProvider.tsx`, then posts an ID token to `/api/auth/session`.
- Protected navigation: `src/proxy.ts` redirects unauthenticated requests away from dashboard, profile, and payment pages when the `__session` cookie is absent.
- Document list and stats: `/api/docs` and `/api/docs/stats` read owned and shared documents for the verified session user.
- Sharing: `/api/share` verifies the session user, looks up the target user by email with Firebase Admin, and updates the document `share` array.
- Editing: `CollaborativeEditor` initializes a Firestore document when needed, loads existing Tiptap JSON content, subscribes to snapshot updates, and debounces saves.
- AI generation: authenticated users call `/api/ai`; model availability is derived from provider API keys stored in the user's profile document.

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

- README content previously referenced Clerk even though the current source and package manifest use Firebase Auth.
- Server API routes depend on Firebase Admin credentials being present at runtime.
- `src/app/api/image/route.ts` mixes upload, signed URL generation, local filesystem caching, and image serving in one route.
- The editor save/snapshot flow is asynchronous and should be changed only with targeted validation because it touches initialization, remote updates, and local selection restoration.

## Roadmap

No product roadmap priorities are approved by this codebase-improvement pass.
