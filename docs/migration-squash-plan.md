# Migration Squash Plan (P2)

**Context:** Pre-R5.4 schema audit found **28 NOTICE** lines on fresh `supabase db reset` — all from idempotent `DROP … IF EXISTS` before objects that never existed on a clean install. Behavior is correct; noise is cosmetic.

**Goal:** Reduce reset noise and migration count without changing final schema state.

## Current state

| Metric | Value |
|--------|-------|
| Migration files | 43 (after R5.4a hardening) |
| NOTICE on reset | ~28 |
| ERROR on reset | 0 |

## Strategy (recommended: baseline squash at milestone)

### Phase 1 — Document only (this file)

- Do **not** squash mid-sprint.
- Squash after R5.5 or next production deploy milestone.

### Phase 2 — Generate baseline

1. `supabase db reset` on clean local.
2. `pg_dump --schema-only` of `public` + required extensions.
3. Single file: `supabase/migrations/20260701000000_baseline_marketplace_ditto.sql`
4. Archive old migrations to `supabase/migrations/_archive/` (or delete after team sign-off).

### Phase 3 — NOTICE elimination in baseline

Remove from baseline (objects created once, no drop-before-create):

- Redundant `DROP POLICY IF EXISTS "Staff can view all *"` in staff read migration chain
- Redundant `DROP CONSTRAINT IF EXISTS` where constraint is created in same migration
- Redundant `DROP TRIGGER IF EXISTS` before first CREATE on fresh DB

Keep `IF NOT EXISTS` / idempotent patterns only where re-run safety matters (extensions, seeds).

### Phase 4 — Verification

```bash
supabase db reset
# Expect: 0 ERROR, NOTICE count near 0 (pgcrypto extension may still NOTICE once)
npm run db:types
npm test -- --run
```

## Files with highest NOTICE contribution

| Migration | NOTICE source |
|-----------|---------------|
| `20260529150100_add_admin_read_policies.sql` | 7× DROP POLICY staff read |
| `20260531190000_publication_architecture_completion.sql` | 3× DROP TRIGGER sync |
| `20260602120000_offer_subdomain_completion.sql` | 1× DROP TRIGGER |
| `20260531120000_add_user_status_and_admin_user_management.sql` | 2× DROP POLICY super-admin |
| Various status CHECK migrations | 9× DROP CONSTRAINT |

## Risk

- Squash breaks environments that applied partial migration history — only safe when all envs track `dev` head.
- CI must use `supabase db reset` from scratch, not incremental from old baseline.

## Decision

**Defer squash to post-R5.5.** No action required for R5.4a beyond this plan.
