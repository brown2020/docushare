# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/docushare`
- Branch: `dev`
- Work mode: full
- Run folder: `agent-runs/2026-06-20-codebase-pass`
- Verifiable gates: `npm run lint`, `npm run build`, Git remote read, dry-run push, source search, and targeted route/component inspection.
- Human-decision blockers: product roadmap choices, broad architecture rewrites, unavailable Firebase/Stripe/provider credentials, and any risky major dependency migration.
- Resume policy: read `run-state.md`, `task-queue.md`, latest phase report, Git status, and `origin/dev` sync state before continuing.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint/build pass or failures are classified as baseline/environment | Baseline report pushed |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Highest-priority confirmed issues have targeted checks and quality gate | Fix batch pushed or blocked/deferred with evidence |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe package/dead-code changes pass lint/build or are deferred | Cleanup report pushed |
| Review | Judge Loop | Diff and reports pass review or produce bounded tasks | Review report pushed |
| Stabilization Loop | Stabilization Loop, Judge Loop | No P0/P1, confirmed races, introduced regressions, or high-confidence architecture failures remain | Stabilization report pushed |
| Integrator | Final Completion Gate | Remote/push checks pass, tree clean, branch synced, reports complete | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `agent-runs/2026-06-20-codebase-pass/00-orchestration-plan.md`, `run-state.md`, `task-queue.md` | Startup planning and resume state |
| T-002 | `AGENTS.md`, `SPEC.md`, `README.md`, `01-preflight-and-repo-docs.md` | Current-state repo docs and first phase report |
| T-003 | `02-baseline-validation.md` | Baseline lint/build classification |
| T-004 | `03-findings-backlog.md`, `task-queue.md` | Findings backlog and architecture scorecard |
| T-005+ | Source files named by findings | Bounded fixes only after backlog evidence |
