# DocuShare

Collaborative document authoring with a TipTap rich-text editor, Firebase persistence and sharing, multi-provider AI assistance, and optional Stripe credits. Live site: [https://docushare.ai](https://docushare.ai)

## Features

Verified from the current codebase:

- **Document dashboard** — create, open, list, and delete docs; document stats API
- **Rich editor** — TipTap 3 (headings, links, images, underline, align, font family/size, typography, markdown bridge)
- **Sharing** — share documents with other users by email (`/api/share`)
- **AI writing assist** — `/api/ai` routes to OpenAI, Anthropic, Google, or Mistral based on API keys stored on the user profile
- **Auth** — Firebase email/password and Google sign-in, plus HttpOnly session cookies (`/api/auth/session`); route protection via `src/proxy.ts`
- **Profile & credits** — store provider keys; Stripe payment attempt/success flows
- **Uploads** — authenticated `/api/image` for images plus PDF, TXT, MD, CSV, and DOCX (5 MB). Unsupported types return an error. Extracted document text is placed in the editor for AI.
- **Starter credits** — each new account receives 1,000 credits once from the server. Email verification is not required. Spent credits are not refilled; a Stripe pack adds 10,000 credits.
- **Theming / UI** — Tailwind CSS 4, local UI primitives, Lucide icons

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix, Lucide, Floating UI |
| Editor | TipTap 3 (+ collaboration extensions / Yjs-related packages in deps) |
| Language | TypeScript 6 |
| AI | Vercel AI SDK 6 + `@ai-sdk/openai`, `anthropic`, `google`, `mistral`; `openai` SDK |
| Backend | Firebase 12 + firebase-admin 13 |
| Payments | Stripe |
| Validation | Zod 4 |
| State | Zustand 5 |
| Rate limit dep | `@upstash/ratelimit` (dependency present) |
| Tests | Vitest 3 |
| Node (CI) | 22 |

`.npmrc` sets `legacy-peer-deps=true`.

## Project structure

```
docushare/
├── src/
│   ├── app/            # Pages + API (ai, auth, docs, image, share)
│   ├── components/     # Editor, dashboard, auth, payments, menus/panels
│   ├── extensions/     # TipTap extensions
│   ├── actions/        # Server actions (e.g. generation)
│   ├── firebase/, lib/, providers/, hooks/, zustand/
├── .env.example
├── firestore.rules
├── cors.json
└── .github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22+
- npm
- Firebase project (Auth, Firestore, Storage)
- At least one AI provider key (OpenAI and/or keys on the user profile)
- Stripe (optional)

### Install

```bash
git clone https://github.com/brown2020/docushare.git
cd docushare
git checkout dev
npm install
cp .env.example .env.local
# fill Firebase + Stripe + optional OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name | Purpose | Where to get it |
|------|---------|-----------------|
| `NEXT_PUBLIC_BASE_URL` | Public site URL (trailing slash ok) | You |
| `NEXT_PUBLIC_FIREBASE_APIKEY` | Firebase web API key | Firebase Console → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECTID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` | Messaging sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APPID` | App ID | Same |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | Analytics ID | Optional |
| `FIREBASE_TYPE` | Admin type (`service_account`) | Service account JSON |
| `FIREBASE_PROJECT_ID` | Admin project ID | Same |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID | Same |
| `FIREBASE_PRIVATE_KEY` | Private key | Same |
| `FIREBASE_CLIENT_EMAIL` | Client email | Same |
| `FIREBASE_CLIENT_ID` | Client ID | Same |
| `FIREBASE_AUTH_URI` / `FIREBASE_TOKEN_URI` / `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` / `FIREBASE_CLIENT_CERTS_URL` / `FIREBASE_UNIVERSE_DOMAIN` | Admin OAuth metadata | Same / Google defaults |
| `FIREBASE_STORAGE_BUCKET` | Admin storage bucket | Same |
| `FIREBASE_DATABASE_URL` | Optional RTDB URL if referenced | Firebase Console |
| `OPENAI_API_KEY` | Server OpenAI fallback | [platform.openai.com](https://platform.openai.com) |
| `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `MISTRAL_API_KEY`, `FIREWORKS_API_KEY` | Listed in `.env.example`; primary AI keys for chat are stored on the **user profile** | Respective provider consoles |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | Product name for credits | Stripe product config |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for `POST /api/stripe/webhook`. If unset, checkout is disabled and the webhook returns 503 so credits are not granted from the client | Stripe Dashboard → Webhooks → signing secret |
| `IS_UAT` | When `1`, AI calls return a canned response and do not debit credits. A zero balance is still rejected. Leave `0` locally; CI sets `1` for the production build | Optional |

Never commit real secrets. Prefer setting provider keys in the profile UI for multi-model AI.

## Firebase

- Rules: `firestore.rules` (deploy with the Firebase CLI; this repo does not deploy them)
- Indexes: `firestore.indexes.json` (owner/updatedAt and share/updatedAt). Stats queries fall back to an in-memory sort until these exist
- Storage rules: `storage.rules` (client read/write denied; uploads go through the Admin SDK)
- Storage CORS sample: `cors.json`
- Session cookie name used by the proxy: `__session`
- Credit packs are fulfilled only by the signed Stripe webhook (`payment_intent.succeeded`) into `users/{uid}/payments/{paymentIntentId}` and `users/{uid}/profile/userData.credits`
- New accounts receive 1,000 starter credits once. The marker is `users/{uid}/private/starterCredits`, which clients cannot write when `firestore.rules` is deployed

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run doctor` | react-doctor scan |

## Testing and CI

Vitest covers editor content helpers, Firebase auth errors, and route security.

GitHub Actions (`.github/workflows/ci.yml`) on `dev` / `main` and PRs: `npm ci` → lint → typecheck → test → build with `IS_UAT=1` and `NEXT_PUBLIC_*` Firebase/base URL secrets. Node 22.

## Deployment

Deploy as a Next.js app (e.g. Vercel) to [https://docushare.ai](https://docushare.ai). Configure Firebase Admin + client env vars, Stripe, and `STRIPE_WEBHOOK_SECRET`. Point Stripe at `POST /api/stripe/webhook` for `payment_intent.succeeded`. Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules` when they change. Do not rely on the client to grant credits.

## Contributing

- `main` — production
- `dev` — integration

See [AGENTS.md](./AGENTS.md) and [SPEC.md](./SPEC.md).

## License

[GNU Affero General Public License v3](./LICENSE.md) (AGPL-3.0).
