# Agent Report

## Agent

Name: Codex

## Scope

Execution batches for the highest-priority Firestore access-control findings F-001/F-002 and image API findings F-003/F-004, plus follow-up image media type validation.

## Inputs

`firestore.rules`, `src/app/api/image/route.ts`, `SPEC.md`, findings backlog, task queue, `src/zustand/useProfileStore.ts`, `src/zustand/usePaymentsStore.ts`, `src/components/CollaborativeEditor.tsx`, `src/components/DocumentsList.tsx`, baseline lint/build results.

## Branch and Push

- Branch: `dev`
- Upstream: `origin/dev`
- Commit: pending checkpoint
- Pushed to: pending checkpoint
- Sync status: local `dev` matches `origin/dev` before fix edits.

## Loop

- Name: Task Queue Loop and Fix Validation Loop
- Goal: fix confirmed security/data-integrity findings in small, verifiable batches.
- Verify gate: targeted source changes address queued findings and lint/build pass.
- Stop condition: each fix batch is ready to commit/push or blocked by validation.
- Attempt: 2
- Result: passed.

## Run State

- Current phase: Execute Fixes and Improvements
- Current task: T-009
- Last pushed commit: ba50e6a
- Next action: commit/push image API fixes, then triage package/audit cleanup.
- Blockers: none.

## Commands Run

```text
nl -ba firestore.rules
git diff -- firestore.rules
npm run lint
npm run build
rg -n "api/image|image_key|upload|setImage|ImageUpload" src
npm run lint
npm run build
git diff -- src/app/api/image/route.ts
npm run lint
npm run build
```

## Findings

- F-001 fixed: nested `/users/{userId}/...` documents now require `request.auth.uid == userId`.
- F-002 fixed: shared document users can update only `name`, `content`, and `updatedAt`; owner/share metadata is preserved for shared users, and only owners can change `share`.
- F-003 fixed: image upload returns direct response objects instead of rejecting a route-handler promise with `Response` values.
- F-004 fixed: image GET now requires an authenticated session, rejects unsafe keys, and streams Firebase Storage downloads without writing to a local `public` cache.
- F-004 follow-up fixed: image upload now rejects unsupported media types server-side and generates filename extensions from an allowed image extension/content-type set.
- Remaining queued execution item: package/audit triage.

## Changes Made

- Added `isUser`, `isShared`, document metadata-preservation, owner-update, and shared-update helper rules.
- Replaced broad nested user subcollection access with same-user-only access.
- Replaced broad document update access with owner/shared update branches that limit changed fields.
- Refactored `src/app/api/image/route.ts` to remove the async Promise constructor, return explicit 401/400/500 responses, validate image media types, generate opaque upload filenames, validate image keys, require auth for GET, and serve Storage download buffers as web response bodies.
- Updated `SPEC.md` to document the current Firestore rules and image API boundaries.

## Verification

`npm run lint` passed. `npm run build` passed after converting the Firebase Storage download `Buffer` to `Uint8Array` for `NextResponse`. The follow-up image media type validation also passed lint/build. Firestore rules were reviewed statically because the repo does not include Firebase rules tests.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | Rules change preserves client/server call sites and narrows data access at the rules boundary. | None |
| Module cohesion | Pass | Image API no longer mixes local filesystem caching with Storage reads. | Re-review in stabilization |
| Public surface area | Watch | No public API changes in this batch. | Defer |
| Data and side-effect flow | Pass | User nested docs and document metadata writes are constrained in `firestore.rules`; image upload/read paths require auth and validation. | Re-review in stabilization |
| Async/cache/resource lifecycle | Watch | Not changed in this batch. | Defer |
| Duplication and dead code | Watch | Not changed in this batch. | Defer |
| Dependency lean-ness | Fail | Audit/package findings remain open. | Package cleanup phase |
| Testability | Watch | No Firestore rules test harness exists. | Document risk |

## Quality Gate

- Command: `npm run lint`; `npm run build`
- Result: passed
- Notes: first image build attempt failed because `NextResponse` does not accept a Node `Buffer`; converting to `Uint8Array` fixed it. Static rules review performed; no Firebase emulator/rules tests are present.

## Commit-Push Checkpoint

- Status inspected: pending.
- Diff checked: pending.
- Files staged: pending.
- Dry-run push: pending.
- Push: pending.
- Post-push sync: pending.

## Stabilization

- Cycle: not started.
- Completion criteria status: P0/P1 findings and queued image P2 findings addressed; package/audit item remains queued.
- Remaining blockers: none.

## Risks

- Firestore rules syntax/behavior was not emulator-tested because the repo has no rules test harness.
- Collaborative editing semantics assume shared users may update content/name/timestamps but not owner/share metadata.
- Existing documents that reference `/api/image?image_key=...` now require an authenticated session and a non-path-like image key. Uploads created by the updated POST route use opaque safe filenames.

## Open Questions

- None.

## Recommended Next Step

Commit and push the image API fixes, then run Package and Dead-Code Cleanup.
