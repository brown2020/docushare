# Repository Guidance

## Project Shape

DocuShare is a Next.js 16 App Router application using React 19, TypeScript, Tailwind CSS 4, Tiptap 3, Firebase Auth/Firestore/Storage, Stripe, and AI SDK providers.

Important areas:

- `src/app/`: pages, layouts, and API route handlers.
- `src/proxy.ts`: route protection for dashboard, profile, and payment pages based on the Firebase session cookie.
- `src/providers/AuthProvider.tsx`: Firebase client auth state plus session-cookie creation and deletion.
- `src/lib/auth/session.ts`: Firebase Admin session cookie creation and verification.
- `src/firebase/`: Firebase client and admin initialization.
- `src/components/CollaborativeEditor.tsx`: Tiptap editor, Firestore document initialization, snapshot subscription, and debounced saves.
- `src/components/menus/` and `src/extensions/`: editor controls and custom Tiptap extensions.
- `src/zustand/`: client-side profile, auth, and payment stores.
- `agent-runs/`: generated workflow reports for codebase-improvement runs.

## Commands

- `npm run dev`: start the local Next.js development server.
- `npm run lint`: run ESLint across the repo.
- `npm run build`: create the production build and run Next.js type checks.
- `npm run start`: start the production server after a build.

There is no dedicated test script at the moment. Use `npm run lint` first, then `npm run build` when source or route behavior changes.

## Operating Notes

- Work on `dev` for the codebase-improvement workflow.
- Keep Firebase Auth client state and server session-cookie behavior aligned. Protected server data should use `getAuthenticatedUser()` or equivalent Firebase Admin verification, not only client state.
- Keep document access checks server-side for `/api/docs`, `/api/docs/stats`, `/api/share`, `/api/ai`, and `/api/image`.
- Avoid broad package or lockfile churn. This repo uses npm with `package-lock.json`.
- Preserve the editor's Firestore lifecycle when changing `CollaborativeEditor`: initial load, initialization, snapshot subscription, debounced save, and unmount cleanup are tightly coupled.
- Treat `README.md`, `SPEC.md`, and this file as current-state documentation. Do not add unapproved roadmap commitments during codebase-health work.
