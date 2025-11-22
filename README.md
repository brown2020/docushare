<div align="center">

# DocuShare

Collaborative document authoring and automation platform built with the latest **Next.js 16** runtime, **React 19**, **Tiptap 3**, **Firebase**, **Clerk**, and integrated AI tooling.

</div>

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Development Workflow](#development-workflow)
5. [Available Scripts](#available-scripts)
6. [Architecture Highlights](#architecture-highlights)
7. [Quality & Tooling](#quality--tooling)
8. [Deployment](#deployment)
9. [Contributing](#contributing)
10. [License](#license)

---

## Project Overview

DocuShare provides real-time document editing with AI-assisted authoring, robust formatting, sharing, and billing flows. Core capabilities include:

- 🔐 **Clerk authentication** with protected application routes (`dashboard`, `profile`, payment flows).
- 📝 **Collaborative editor** powered by Tiptap 3 (`@tiptap/* 3.11.0`) with custom blocks (image blocks, AI menus, etc.).
- 🤖 **AI assistance** (OpenAI, Anthropic, Google Gemini, Mistral) through the `ai@5.0.98` SDK layer.
- ☁️ **Firebase persistence** plus Firestore-triggered stats and document sharing endpoints.
- 💳 **Stripe payments** (`stripe@20.0.0`, `@stripe/react-stripe-js@5.4.0`, `@stripe/stripe-js@8.5.2`) for upgrade and billing scenarios.
- 📊 **Document statistics + activity feeds** backed by Firestore queries.

---

## Tech Stack

| Category              | Libraries / Versions (from `package-lock.json`) |
|-----------------------|--------------------------------------------------|
| Framework             | `next@16.0.3`, `react@19.1.0`, `react-dom@19.1.0` |
| Editor / Collab       | `@tiptap/core@3.11.0`, `@tiptap/react@3.11.0`, `yjs@13.6.19`, `y-webrtc@10.3.0` |
| Authentication        | `@clerk/nextjs@6.0.2`, `@clerk/express@1.4.7` |
| Persistence           | `firebase@12.6.0`, `firebase-admin@13.0.2` |
| AI + LLMs             | `ai@5.0.98`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/mistral` |
| Payments              | `stripe@20.0.0`, `@stripe/react-stripe-js@5.4.0`, `@stripe/stripe-js@8.5.2` |
| UI / Styling          | `tailwindcss@4.0.9`, `@floating-ui/react@0.27.2`, `lucide-react@0.554.0` |

---

## Prerequisites

- **Node.js**: >= 18.18 (recommended for Next.js 16)
- **npm**: >= 9 (bundled with Node 18+)
- Accounts / credentials for:
  - [Firebase](https://firebase.google.com/) project (Firestore + Auth)
  - [Clerk](https://clerk.dev/) application
  - [Stripe](https://stripe.com/) account
  - AI providers (OpenAI, Anthropic, Google, Mistral) if using custom keys

---

## Getting Started

### Installation

```bash
git clone https://github.com/<your-org>/docushare.git
cd docushare
npm install
```

> **Note:** Because Tiptap v3 and some ecosystem packages have evolving peer-dependency graphs, you may need to run installs with `--legacy-peer-deps` in CI/CD environments.

### Environment Variables

Create a `.env.local` (Next.js) with the following keys (set all secrets before running the app):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for client SDK |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key for client Elements |
| `STRIPE_SECRET_KEY` | Stripe secret key for backend actions/webhooks |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firebase Admin credentials |
| `NEXT_PUBLIC_FIREBASE_APIKEY` / `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` / `NEXT_PUBLIC_FIREBASE_PROJECTID` / `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` / `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` / `NEXT_PUBLIC_FIREBASE_APPID` / `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | Firebase client SDK values |
| `DOCUMENT_COLLECTION` (optional override) | Firestore collection name for docs (`docs` default) |
| `IS_UAT` | When set to `1`, the AI layer returns canned responses for staging |

> Add any provider-specific AI keys (OpenAI, Anthropic, Google, Mistral, Fireworks) as needed. See `src/actions/generateActions.ts` for usage.

### Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Lint (Next.js ESLint config)
npm run lint

# Production build & type-check
npm run build

# Start production server
npm run start
```

Visit <http://localhost:3000> to access the app once `npm run dev` is running.

---

## Available Scripts

| Script          | Description |
|-----------------|-------------|
| `npm run dev`   | Development server with Turbopack HMR |
| `npm run build` | Creates optimized production build, runs TypeScript checks |
| `npm run start` | Starts Next.js in production mode (requires `npm run build` first) |
| `npm run lint`  | Runs ESLint (configured via `eslint-config-next`) |

---

## Architecture Highlights

- **App Router** (`src/app/`) with server components, route handlers (`/api/*`), and page-level layouts.
- **Editor System**:
  - `src/components/CollaborativeEditor.tsx` orchestrates Tiptap editor, custom menus, AI controls, and Firestore persistence.
  - Rich menu components under `src/components/menus` and custom extensions in `src/extensions`.
- **State & Context**:
  - `zustand` stores (e.g., `useAuthStore`, `useProfileStore`) manage UI state.
  - `ActiveDocContext` coordinates document selection across sidebar/editor.
- **API Routes**:
  - `/api/docs`, `/api/docs/stats`, `/api/share`, `/api/ai`, `/api/image` implement CRUD, sharing, stats, and AI/image utilities.
- **Authentication Guard**:
  - `src/proxy.ts` (Next.js 16 proxy/middleware) uses Clerk to protect routes like `/dashboard`, `/profile`, `/payment-*`.

Refer to the source tree for deeper exploration (`src/components`, `src/extensions`, `src/zustand`, etc.).

---

## Quality & Tooling

- **ESLint**: Next.js default rules + TypeScript support (`npm run lint`).
- **TypeScript**: Enabled across the repo; `npm run build` fails on type errors (as seen during upgrades).
- **Prettier / Formatting**: Not enforced via scripts but encouraged for contributions.
- **Testing**: (Not yet implemented) — contributions welcome to add unit/integration tests.

---

## Deployment

1. Ensure environment variables are configured (Vercel, Docker, or your platform of choice).
2. Run `npm run build` to produce the `.next` production bundle.
3. Execute `npm run start` behind your process manager (PM2, Docker, Vercel serverless, etc.).

> The project targets Node.js runtime for Next.js 16 proxies. Edge runtime is not currently used.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request describing the changes and testing performed.

For substantial changes, consider opening an issue to discuss the proposal first.

---

## License

This project is distributed under the MIT License. See [`LICENSE`](LICENSE) for details (add one if not yet present).

---

Happy building! 🛠️
