# CLAUDE.md - DocuShare Project Guide

## Project Overview

DocuShare is a collaborative document authoring platform with AI-assisted writing capabilities. Features include real-time collaborative editing, AI content generation, document sharing, and user authentication with payments.

**License:** AGPL-3.0-only

## Tech Stack

- **Framework:** Next.js 16 with App Router, React 19, TypeScript 5
- **Editor:** Tiptap 3.11 with Yjs for collaboration
- **Styling:** Tailwind CSS 4
- **Auth:** Firebase Authentication (email/password, magic link, Google OAuth)
- **Database:** Firebase Firestore + Storage
- **Payments:** Stripe
- **AI:** Vercel AI SDK with OpenAI, Anthropic, Google, Mistral providers
- **State:** Zustand

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build with type checking
npm run start    # Run production server
npm run lint     # ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/               # API endpoints (docs, ai, image, share, auth)
│   ├── dashboard/         # Protected dashboard page
│   ├── profile/           # User profile page
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   └── payment-*/         # Payment flow pages
├── components/            # React components
│   ├── auth/              # Auth components (SignInForm, SignUpForm, UserMenu)
│   ├── CollaborativeEditor.tsx  # Main Tiptap editor
│   ├── Dashboard.tsx      # Dashboard layout
│   ├── DocumentsList.tsx  # Sidebar document list
│   ├── menus/             # Editor toolbars (TextMenu, LinkMenu)
│   ├── Models/            # Modal dialogs
│   └── ui/                # Reusable UI primitives (Button, Badge, Avatar, etc.)
├── providers/             # React context providers
│   └── AuthProvider.tsx   # Firebase auth context
├── hooks/                 # Custom hooks
│   └── useFirebaseAuth.ts # Firebase auth hook
├── extensions/            # Custom Tiptap extensions
│   └── extension-kit.ts   # Extension bundle configuration
├── actions/               # Server actions (AI, payments, storage)
├── zustand/               # State stores (auth, payments, profile)
├── firebase/              # Firebase client & admin config
├── lib/                   # Utilities & constants
│   └── auth/              # Auth utilities (session management)
└── middleware.ts          # Next.js middleware for route protection
```

## Key Patterns

### Authentication
Firebase Auth with cookie-based sessions for SSR support:
- `src/providers/AuthProvider.tsx` - Auth context provider
- `src/hooks/useFirebaseAuth.ts` - Auth hook for components
- `src/lib/auth/session.ts` - Session cookie management
- `src/app/api/auth/session/route.ts` - Session API endpoint

### Server Actions
AI generation, payments, and sensitive operations use `"use server"` directives:
- `src/actions/generateActions.ts` - AI content generation
- `src/actions/generateEditorActions.ts` - Editor AI actions
- `src/actions/paymentActions.ts` - Stripe payment intents

### State Management
Zustand stores with Firestore sync:
- `useAuthStore` - User auth state (synced from Firebase Auth)
- `usePaymentsStore` - Payment history
- `useProfileStore` - User profile data and API keys

### API Routes
Protected with Firebase session verification:
```typescript
const authUser = await getAuthenticatedUser();
if (!authUser) return Response(401);
const userId = authUser.uid;
```

### Document Persistence
- Firestore real-time snapshots with 500ms debounced saves
- Documents stored in `docs/{docId}` with owner/share permissions
- Initialization before snapshot subscription prevents race conditions

## Environment Variables

**Client-side (NEXT_PUBLIC_):**
- Firebase config (apiKey, authDomain, projectId, etc.)
- Stripe publishable key

**Server-side:**
- Firebase admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
- Stripe secret key
- AI provider API keys (OpenAI, Anthropic, Google, Mistral)
- `IS_UAT=1` for staging/demo mode

## Firestore Collections

```
docs/{docId}           # Documents (content, owner, share[], timestamps)
users/{uid}            # User data (email, name, photo, credits, etc.)
users/{uid}/profile    # User preferences, custom AI keys
users/{uid}/payments   # Payment records
```

## UI Components

Shared UI components in `src/components/ui/`:
- `Button` - Primary button with variants
- `Badge` - Status badges (success, warning, error, info)
- `Avatar` - User avatar with fallback initials
- `EmptyState` - Empty state with icon, title, description
- `LoadingState` - Loading spinner with optional text
- `Surface`, `Panel`, `Toolbar` - Layout components

## Testing

No testing framework implemented yet. Contributions welcome.

## Common Tasks

### Adding a new Tiptap extension
1. Create extension in `src/extensions/`
2. Register in `src/extensions/extension-kit.ts`

### Adding a new API endpoint
1. Create route handler in `src/app/api/{route}/route.ts`
2. Use `getAuthenticatedUser()` from `@/lib/auth/session` for protection
3. Return JSON responses with appropriate status codes

### Adding new AI functionality
1. Add server action in `src/actions/generateActions.ts`
2. Use `getModel()` helper for provider abstraction
3. Handle `IS_UAT` flag for test mode

### Adding a protected route
1. Add the route pattern to `protectedRoutes` in `src/middleware.ts`
2. Middleware will redirect unauthenticated users to `/signin`

## Path Aliases

`@/*` maps to `src/*` (configured in tsconfig.json)
