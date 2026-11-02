# Roadmap

No product roadmap items are approved.

## Dependency maintenance

November 2026 refresh on `dev` moved direct dependencies to the newest versions that still lint, typecheck, test, and build on Node 24.

- TypeScript 7.0 is the `tsc` used by `npm run typecheck` (`@typescript/native`). The `typescript` package stays on `@typescript/typescript6` so `eslint-config-next` / `typescript-eslint` can import a compiler API. TypeScript 7.0 does not ship that API.
- Production `npm audit` is clean. Five moderate findings remain in dev-only ESLint plugins (`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`) via `minimatch` 3.x. Those plugins call minimatch as a default export, so a minimatch 11 override breaks lint. The audit's suggested downgrade of `eslint-config-next` is not safe on Next.js 16.
- `mv` was removed. Nothing in the app imported it, its latest release still pulls `rimraf` 2 / `glob` 6 / `minimatch` 3, and the audit's suggested fix is a downgrade.
- Existing overrides stay: `@grpc/grpc-js`, `postcss-selector-parser`, and `jwks-rsa` → `jose` 5.10.0. Firestore's nested `glob` is overridden to 14.0.3 and its nested `gaxios` to 7.3.1. ESLint's own minimatch is overridden to 11.0.4.
- AI provider model IDs were not changed.
