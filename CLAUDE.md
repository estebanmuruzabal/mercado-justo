# Next.js 15.3 + Supabase + TypeScript Best Practices

## Ditto Domain Architecture (obligatorio)

Mercado Justo migra a Ditto. Toda contribución DEBE respetar arquitectura por dominios.

### Estructura canónica

- Código de negocio: `src/domains/{domain}/{submodule}/`
- Infraestructura compartida: `src/shared/`
- Rutas Next.js: `app/` (thin — solo composición, sin lógica de negocio)
- Cada módulo expone API pública SOLO via `index.ts`

### Capas internas (por módulo)

| Capa | Contenido | Puede importar |
|------|-----------|----------------|
| `domain/` | entidades, policies, errores | `shared/types`, `shared/utils` |
| `infrastructure/` | repos Supabase, adapters | `domain/`, `shared/database` |
| `application/` | actions, queries, DTOs, events | `domain/`, `infrastructure/` |
| `presentation/` | components, hooks, stores | `application/dto`, `shared/ui` |

### Reglas de dependencia (NUNCA violar)

1. `shared/` NO importa de `domains/`
2. `domains/A` NO importa `domains/B/application` directamente — usar `shared/events` o puertos en `domain/`
3. `app/` NO contiene queries Supabase — delegar a `domains/*/application`
4. UI NO importa tipos desde `*.actions.ts` — usar `application/dto/`
5. Server Actions viven en `domains/*/application/actions/`, NO en carpetas globales
6. Supabase client: solo via `shared/database/supabase/{client,server,service}.ts`

### Dominios y ownership

- **auth**: sesión, login, recovery
- **users**: perfiles, roles, admin de usuarios
- **marketplace**: listings, categories, orders, checkout, reviews
- **vendors**: tiendas, onboarding, storefront
- **logistics**: shipments, delivery batches, fulfillment
- **finance**: pagos, payouts (futuro)
- **community**: notifications, followers, chat, channels, blogs, comments
- **moderation**: reports, listing moderation
- **subscriptions**: planes (futuro)
- **dittobots**: Telegram y bots futuros

### Naming

- Archivos: `{verb}-{entity}.actions.ts`, `{entity}.queries.ts`, `{entity}.repository.ts`
- DTOs: `{Entity}Dto`, `{Entity}Row` solo en `infrastructure/mappers`
- Eventos: `{entity}.{past-tense}` (ej. `order.created`)
- Terminología: **vendor/store** (no "seller" en código nuevo)

### Prohibiciones

- NO crear carpetas `server/actions`, `server/queries`, `lib/`, `components/features/` para código nuevo
- NO duplicar tipos (ListingType, Role, Store) — buscar en `domain/` existente
- NO hardcodear URLs — usar `shared/routing/routes.ts`
- NO modificar DB sin migration en `supabase/migrations/`

### Marketplace Discovery — Discovery Boundary

Discovery es el **único subdominio autorizado** para:

- browse
- feed
- search
- map
- vendor storefront listings

**Ninguna página pública** puede importar `@/domains/marketplace/listings/application/queries/*`.

**Excepciones** (legacy paths internos):

- admin
- seller dashboard / listing manager
- checkout
- cart
- orders

Todas las **nuevas consultas públicas** deben entrar por `@/domains/marketplace/discovery`.

Permitido en UI pública: `listings/domain/*` (tipos DTO), `listings/presentation/*` (componentes).

### Marketplace Offer — Canonical Commerce Boundary (A5)

Offer BC expone **una única API pública** para datos comerciales (precio, stock, variantes):

```typescript
resolveCommercialSnapshots(publicationIds: string[]): Promise<Map<string, CommercialSnapshot>>
```

**Consumidores** (Discovery, Search, Vendor Storefront, API, Mobile) deben importar solo desde `@/domains/marketplace/offer`.

**Prohibido** fuera de `offer/**`: `OfferRepository`, `findVariants`, `findDefaultVariant`, deep imports de `offer/infrastructure/*` o `offer/domain/*`. El fallback Strangler (`listing_variant`) vive **dentro** de Offer BC y se expone opaco como `CommercialSnapshot.source: 'legacy'`.


### Marketplace Relations — Canonical Graph Boundary (B5 / C5)

**Estado (2026-05-31):** R4.0 phase complete — shared relation registry strangler removed. Registry source of truth: `relations/domain/registry/relation-type-registry.ts` only.

Relations BC expone **una única API pública** para lectura del grafo:

```typescript
resolveRelationSnapshots(publicationIds, options?): Promise<Map<string, RelationSnapshot[]>>
```

**Consumer → resolveRelationSnapshots() → Relations Repository → publication_relation**

Prohibido fuera de `relations/**`:

- `createClient().from('publication_relation')`
- deep imports de `infrastructure/**`, `domain/**`, `policies/**`, `mappers/**`
- acceso directo desde Discovery o Transaction

`RelationSnapshot` incluye `RelatedPublicationSummary` (B1) y `version: 1` (C1).

Repository methods are internal implementation details and must never become public APIs.

**`includePrivate` contract (R3.0 / R3.1):**

- Requires `actor: RelationReadActor` (source owner, admin, or serviceRole) — ignored without authorization.
- Authorization centralized in `application/auth/relation-read-authorization.service.ts` (`shouldIncludeRelationEdge`).
- `relation-policy.ts` is domain-only (B4/C2 visibility/temporal rules) — no actor auth logic.
- **R3.4 RLS (implemented):** additive policies on `publication_relation`:
  - `publication_relation_select_public` — `visibility IN ('public', 'inherit')` (unchanged)
  - `publication_relation_select_private_source_owner` — `visibility = 'private'` + source owner (`store`/`user` owner_id = auth.uid())
  - `publication_relation_select_staff` — platform staff via `is_staff()`
- Application auth mirrors SQL (defense in depth). `serviceRole` bypasses RLS only with Supabase service client; repository uses user JWT.

**R3.4 — App vs SQL parity:**

| Case | App | SQL (R3.4) |
|------|-----|------------|
| public edge | allow | allow (`select_public`) |
| private + source owner + includePrivate | allow | allow (`select_private_source_owner`) |
| private + non-owner | deny | deny |
| includePrivate without actor | deny | deny (app); SQL hides private |
| admin / isAdmin | allow | allow via `is_staff()` |
| serviceRole + user client | allow (app) | deny at DB (documented) |
| org owner | deny | deny |

**Rollback (R3.4 migration only):**

```sql
DROP POLICY IF EXISTS publication_relation_select_private_source_owner ON public.publication_relation;
DROP POLICY IF EXISTS publication_relation_select_staff ON public.publication_relation;
```

Migration: `supabase/migrations/20260603120000_publication_relation_owner_rls.sql`

**R3.3 — Owner-aware RLS preparation (historical):**

Ownership flow today:

1. **Repository** (`infrastructure/relation.repository.ts`) — JOIN `publication` and map ad-hoc `{ ownerType, ownerId }` from `owner_type` / `owner_id` columns. Does not use `OwnerRef` at repository boundary.
2. **Public filter (domain)** — `relation-policy.ts` / `isPublicRelationEdge()` — temporal + endpoint visibility; no actor.
3. **Private filter (application)** — `relation.queries.ts` builds `RelationOwnerContext` from source publication and calls `shouldIncludeRelationEdge()`.
4. **Authorization** — `application/auth/relation-read-authorization.service.ts` — `canRequestPrivateReads`, `isAuthorizedReadActor` (admin/serviceRole bypass; else `ownerRefFromPublicationRow` + `isStoreOwner` / `isUserOwner` from `shared/application/ownership-policy.ts`).
5. **DB RLS** — public/inherit via `publication_relation_select_public`; private via owner + staff policies (R3.4).

**Ownership source:**

| Layer | R3.4 state |
|-------|------------|
| Data | `publication.owner_type` / `owner_id` via JOIN in repository |
| DB enforcement | RLS policies on `publication_relation` (owner + staff) |
| Application | `shouldIncludeRelationEdge` mirrors SQL (defense in depth) |

**R3.3 publication-composition removal (Plan A):**

Pre-flight audit found zero call sites for `PublicationComposition` / `legacyCompositionToRelationType`. Entity was `@deprecated` dead code; legacy composition → relation mapping lives only in `relations/domain/registry/relation-type-registry.ts` (`relationTypeFromLegacyComposition`).

**R3.2 cleanup:**

- `canBypassPublicRelationFilter` removed (was deprecated wrapper in R3.1).
- Domain → Application dependency removed from `relation-policy.ts`.

**R4.0 — Registry source of truth (strangler removed):**

- Internal registry: `@/domains/marketplace/relations/domain/registry/relation-type-registry.ts`
- Public type-only: `import type { RelationType } from '@/domains/marketplace/relations'` (`export type` in `relations/index.ts` L9)
- **Type contract guarantee:** TypeScript compilation (`npm run build`) — not runtime validation; `RelationType` does not exist at runtime
- **C5 runtime boundary:** `Object.keys(relationsModule) === ['resolveRelationSnapshots']` only
- **No shared registry consumers remaining** — `shared/domain/relation-type-registry.ts` deleted (R4.0)

**R5.0 — Write model & governance audit (2026-05-31):**

Read path mature (R3–R4); **zero application write paths** for `publication_relation`. Graph edges today are migration-seeded only; active commerce/hierarchy stranglers bypass Relations BC.

#### A — Current write model map

| Operation | Location | Used? | Classification |
|-----------|----------|-------|----------------|
| CREATE `publication_relation` | `supabase/migrations/20260601120000_marketplace_pragmatic_evolution.sql` L234–248 (from `publication_composition`) | One-time migration | **Legacy** (SQL-only) |
| CREATE app path | — | No | **Missing** |
| UPDATE app path | — | No | **Missing** |
| DELETE app path | — | No | **Missing** |
| SELECT app path | `relations/infrastructure/relation.repository.ts` | Yes (Relations BC internal) | **Active** (read-only) |
| CREATE `listing_variant` | `listings/application/actions/listing-manager.actions.ts` L251–394 | Yes (seller dashboard) | **Legacy** — wrong BC for graph edges |
| CREATE/sync `offer` / `offer_variant` | Offer migrations + triggers | Yes (read via Offer BC) | **Legacy** — canonical for commercial variants |
| Recipe ingredients | `attributes_json` (`types/definitions/recipe.ts`) | Yes (implicit) | **Legacy** — not graph-modeled |
| `parent_publication_id` | `publication` row / listing-adapter | Read-only mapping | **Legacy** — parallel hierarchy strangler |
| `publication_composition` table | Migration L169–180; no app references | Orphan table post-migration | **Dead** |
| `assertNotSelfRelation`, `isAllowedRelation` | `relation-policy.ts`, registry | Tests only | **Dead** (not wired to writes) |
| `RelationDto` | `application/dto/relation.dto.ts` | Unused | **Dead** |
| `isActive` on relation | Domain entity; repo hardcodes `true` | Partial | **Missing** — DB column not landed (R3.2 B3) |
| Write RLS on `publication_relation` | — | Default deny | **Missing** |

**Relations BC file inventory:** 11 files under `relations/**`; no `application/actions/` or `application/commands/`; repository has no `.insert/.update/.delete/.upsert`.

#### B — Ownership audit

**Read model (explicit):** private edge authority = **source publication owner** (`store`/`user` via `owner_id = auth.uid()`), plus staff (`is_staff()`) and app admin/serviceRole bypass. Target owner has **no role** in read auth.

| Action | Current rule | Explicit? |
|--------|--------------|-----------|
| Create relation | None — RLS default deny | No |
| Update relation | None | No |
| Delete relation | None | No |
| Read public edge | Visibility + endpoint lifecycle (`relation-policy.ts`) | Yes |
| Read private edge | Source owner / admin / staff | Yes |
| Cascade on publication delete | FK `ON DELETE CASCADE` (both endpoints) | Yes (DB) |
| `created_by` column | Exists in schema; never set by app | Implicit only |

**Implicit rules:** org-owned publications denied at read auth (no org in RLS); serviceRole allowed in app but denied at DB when using user JWT (documented R3.4 gap). Write ownership **undefined** — design assumes source owner authority for CREATE/UPDATE/DELETE.

#### C — Relation invariant matrix

| RelationType | Self (A→A) | Duplicate (A→B×2) | Inverse (A→B + B→A) | Cycle | Cardinality | Overall |
|--------------|------------|-------------------|---------------------|-------|-------------|---------|
| `uses` | Not enforced (domain fn exists, test-only) | **Enforced** (DB UNIQUE) | Blocked by type pairing (recipe→product only) | Not enforced | N:N implicit | **Partial** |
| `hosted_at` | Not enforced | **Enforced** | Blocked (property cannot source) | Not enforced | N:N implicit | **Partial** |
| `promotes` | Not enforced | **Enforced** | Blocked by type pairing | Not enforced | N:N implicit | **Partial** |
| `maintains` | Not enforced | **Enforced** | Blocked by type pairing | Not enforced | N:N implicit | **Partial** |
| `commercial_variant_of` | Not enforced | **Enforced** | **Possible** (A→B and B→A are distinct rows) | **Possible** | 1:N intended, not enforced | **Partial**; **deprecated** (Offer BC canonical) |

**Enforcement layers:** DB enforces `relation_type` CHECK + UNIQUE `(source, target, type)`. Domain `isAllowedRelation()` and `assertNotSelfRelation()` exist but are **not invoked** on any write path. No cycle detection.

#### D — Governance model (design only — not implemented)

| Action | Source owner | Staff | Service role | Target owner |
|--------|--------------|-------|--------------|--------------|
| Create | Allow if `canEditPublication(source)` + `isAllowedRelation` + invariants | Allow | Allow (migrations/backfill) | Deny; optional consent for cross-vendor `uses` |
| Update metadata/visibility/schedule | Allow | Allow | Allow | Deny |
| Delete / soft-disable | Allow | Allow | Allow | Deny |
| Read private | Allow | Allow (`is_staff`) | App-only (JWT gap) | Deny |

**Conflicts:** (1) cross-vendor `uses` — recipe links another vendor's product; (2) `commercial_variant_of` writes must be **rejected** — Offer/listing_variant strangler owns variants; (3) org owner write should mirror read deny; (4) no relation-level moderation — staff override needed for writes.

#### E — Write API pressure

| Use case | Exists today? | Where | Classification |
|----------|---------------|-------|----------------|
| Commercial variants | Yes | `listing_variant` + Offer BC | **Unnecessary** (Relations) |
| Recipe → product (`uses`) | No (ingredients in JSON) | `recipe.ts` attributes | **Future** — recipe editor |
| Event → property (`hosted_at`) | No | Registry only | **Future** |
| Channel → product (`promotes`) | No | Registry only | **Future** |
| Service → property (`maintains`) | No | Registry only | **Future** |
| Bundles / contains | No | Not in registry | **Future** (new type?) |
| Discovery feed graph writes | No | R4.2 STOP | **Unnecessary** |

**No Immediate write consumers.** Pressure is **Future**, gated by publication-type editors (recipe, event, channel).

#### F — Proposed architecture (R5.1+ — do not create files until scoped)

```text
relations/
├── application/
│   ├── commands/           # create / update / deactivate-relation (internal Server Actions)
│   ├── auth/
│   │   ├── relation-read-authorization.service.ts   # exists
│   │   └── relation-write-authorization.service.ts  # NEW — source-owner authority
│   └── queries/relation.queries.ts                  # exists
├── domain/
│   ├── policies/relation-policy.ts                  # exists
│   ├── policies/relation-write-policy.ts            # NEW — wire assertNotSelfRelation, isAllowedRelation
│   └── invariants/relation-invariants.ts            # NEW — deprecated type rejection, cycle guard
└── index.ts                                         # C5 unchanged — resolveRelationSnapshots only
```

**C5 compatibility:** write commands stay **internal** to Relations BC (called from Publication/Listings editors). Do **not** add runtime exports to `relations/index.ts`. Same pattern as Offer (no public write on boundary).

#### R5.0 risks

1. **YAGNI** — implementing writes without a consumer repeats R4.x premature-expansion lesson.
2. **Cross-vendor consent** — `uses` across vendors needs product policy before commands.
3. **Strangler overlap** — variants/ingredients must not duplicate Offer BC or JSON attributes.
4. **C5 erosion** — leaking write exports or deep command imports breaks boundary tests.
5. **Schema gap** — no write RLS, no `is_active` column; R5.1 needs SQL phase before app writes.

#### R5.0 recommendation

**Proceed to R5.1 (conditional)** — not immediate implementation.

Implement write commands when the **first Future use case is scoped** (likely recipe editor `uses` edges). Until then: retain this audit, keep C5 intact, wire read path first when Discovery/detail needs graph data (R4.2′).

#### H — Editor ROI ranking

Prioritizes which publication-type editor should become the **first real write-model consumer** (R5.2 scope). Evidence from type registry, editor plugins, and strangler state.

| Feature | Relation type | User value | Technical cost | Triggers R5.2? | Classification |
|---------|---------------|------------|----------------|----------------|----------------|
| **Recipe Editor** | `uses` (recipe → product) | **High** — `COMPOSABLE` capability; recipe→product commerce funnel; replaces `ingredients` JSON strangler; migration already mapped `base_recipe` → `uses` | **Medium** — `ListingManager` wired for recipe; products/Offer/checkout mature; needs recipe-specific ingredient picker + cross-vendor link policy (consent deferred MVP) | **Yes — first** | **Build Now** |
| **Event Editor** | `hosted_at` (event/experience → property) | **Medium–High** — DittoWorld ecosystem; checkout already branches on `event`/`experience` types | **Medium–High** — `venue` still in JSON (`event.ts` placeholder); property targets persistable; generic `ListingManager` only; DittoWorld editor TBD | **Yes — second** | **Near Future** |
| **Service Maintenance** | `maintains` (service → property) | **Low–Medium** — niche property-ops / B2B; no product surface today | **Medium** — service + property both persistable via `ListingManager`; no maintenance UX spec | **Yes — third** | **Long Term** |
| **Channel Promotion** | `promotes` (channel → product/event/project) | **Medium** — community curation; multi-target discovery value | **High** — `channel.isPersistable = false`; `channel.editor` referenced but **no editor files exist**; needs persistable migration + full editor + multi-target picker | **No** (blocked) | **Long Term** |

**Scoring rationale:**

- **Recipe wins** on readiness: only candidate with explicit `COMPOSABLE` capability, active strangler to replace (`RECIPE_TYPE_DEFINITION.ingredients`), and mature target type (`product` + Offer BC). Registry type pairing (`recipe` → `product`) matches domain model.
- **Event ranks second** on product value but **`event.ts` is a placeholder** (“Replace with full editor UI when DittoWorld event flows ship”); `hosted_at` blocked until venue moves from JSON to graph.
- **Channel blocked** — not persistable, no editor implementation; `promotes` multi-target adds UI cost without foundation.
- **Service maintenance** — both endpoint types exist in market but no user story or editor differentiation; lowest ROI vs recipe/event.

**First real write-model consumer:**

```text
Recipe Editor → uses → product
```

Hypothesis **confirmed**. R5.2 should scope to: write RLS + `create-relation` command + recipe editor ingredient→product linking; defer `hosted_at`, `promotes`, `maintains` until their editors ship.

**Sequencing:**

| Phase | Scope |
|-------|-------|
| R5.1 | Write governance design + SQL (write RLS, optional `is_active`) — no editor |
| R5.2 | Recipe `uses` create-only — **first write consumer** |
| R5.2b | `uses` delete + DELETE RLS |
| R5.3 | Grower network + protocol governance (design-only) |
| R5.4+ | USABLE `uses`, Grower library RLS, Protocol Editor UI |

**R5.2 — Recipe uses create-only MVP (2026-05-31):**

Write model scoped exclusively to **INSERT `uses`** (recipe → product). Delete deferred to **R5.2b**.

#### Source of truth (ingredients)

| Ingredient Type | Source of Truth |
|-----------------|-----------------|
| Linked Product | Graph (`uses` edge) |
| Free Ingredient | `attributes_json.ingredients[]` |

Rules: linked products must **not** duplicate in JSON (`productPublicationId`, `targetPublicationId`, `linkedProductId`, `relationId` forbidden when graph-linked). Enforcement: `relations/domain/invariants/recipe-ingredient-source-of-truth.ts`.

#### Stable ingredient identity

| Kind | Primary identity | Prohibited |
|------|------------------|------------|
| Linked | `relationId` | name, array index, `sort_order` |
| Free | uuid in JSON `id` | name, array index, `sort_order` |

Contract: `relations/domain/contracts/recipe-ingredient-identity.ts`.

#### Migration exit strategy

| Phase | State |
|-------|-------|
| Phase 1 (R5.2) | JSON + Graph coexist — linked products graph-only |
| Phase 2 | Linked: graph only; free: JSON only |
| Phase 3 | **Recommend partial permanent coexistence** — free ingredients stay JSON; linked stay graph |

#### Write surface (R5.2)

| Component | Path |
|-----------|------|
| Create command (internal) | `application/commands/create-uses-relation.command.ts` |
| Write auth | `application/auth/relation-write-authorization.service.ts` — `canCreateUsesRelation` |
| Invariants | `domain/policies/uses-write-policy.ts` |
| Repo (minimal) | `loadPublicationTypesAndOwner`, `existsUsesRelation`, `insertUsesRelation` |
| RLS INSERT | `20260604120000_publication_relation_uses_write_rls.sql` |

**Not in R5.2:** `deleteUsesRelation`, DELETE RLS, publication recipe DTO, generic write infrastructure.

**C5:** `relations/index.ts` unchanged — runtime export `resolveRelationSnapshots` only. Commands are internal.

**Deferred debt:** cross-vendor target consent; delete path (R5.2b).

**Rollback (R5.2 INSERT policies only):**

```sql
DROP POLICY IF EXISTS publication_relation_insert_uses_source_owner ON public.publication_relation;
DROP POLICY IF EXISTS publication_relation_insert_uses_staff ON public.publication_relation;
```

**R5.3 — Ditto Grower Network & Protocol Governance (2026-05-31, design-only):**

Policy modules + docs only. **No** UI, pairing backend, SQL, Offer BC changes, or `relations/index.ts` (C5) changes.

#### Fundamental principle

**Ditto Grower is not a manual role.** Grower = operational membership in the Ditto network, derived from **DittoBot ownership** (≥1 registered bot). Marketplace **Seller ≠ Grower** — independent capabilities; Grower does not inherit from store/seller.

```text
Usuario → Registra DittoBot → Red Ditto → isGrowerMember → Protocolos / Biblioteca / Herramientas
```

Rejected model: `Usuario → Compra → Recetas` or `setRole('ditto-grower')`.

#### WP0 — DittoBot ownership & Grower activation

| Path | Role |
|------|------|
| `dittobots/domain/ditto-bot-ownership-port.ts` | `DittoBotOwnershipPort.countByUserId` |
| `dittobots/domain/ditto-bot-ownership.stub.ts` | Returns `0` until pairing (R5.5+) |
| `dittobots/domain/grower-capability.ts` | `hasDittoBot`, `canAccessGrowerFeatures`, `isGrowerMember` |

| Condition | Effect |
|-----------|--------|
| `dittoBotCount > 0` | Grower features enabled |
| `dittoBotCount = 0` | Create/edit suspended; existing protocols retained |
| Super-admin | `isSuperAdmin()` bypass — **not** `is_staff()` for Grower/protocol |

#### WP0.5 — Grower Network (design only)

Super Admin future section: **Ditto Growers** — dashboard, approximate map, health monitoring. Policies: `canViewGrowerNetwork`, `canContactGrower`, `canSuspendGrowerAccess` (**super-admin only**). Types: `GrowerNetworkMemberSummary`, `GrowerMapPin`, `deriveGrowerHealth(signals)`.

| Health | Meaning |
|--------|---------|
| `healthy` | OK |
| `attention_required` | Sensors/errors need review |
| `assistance_required` | Offline bots / failing protocols / out-of-range |

**Deferred:** UI (R5.6+), real telemetry (R5.6+), pairing (R5.5+).

#### WP1 — Protocol governance (`recipe-protocol-policy.ts`)

Recipe publication type = **Ditto Protocol**. `owner_type = 'user'` only — never store/seller.

**Visibility — community library**

| State | Who can view |
|-------|----------------|
| Approved + `published` + `visibility = public` | All Growers + super-admin |
| Draft / pending / rejected / non-approved | Author + super-admin only |
| Public / normal user / seller | **No** (Discovery excludes `recipe` always) |

**Moderation — `isSuperAdmin()` ONLY** (never moderator/support/`is_staff()`)

```text
Draft → Submitted (pending_review) → Approved → Published
                 ↘ Rejected
```

| Action | Grower (with bot) | Super-admin |
|--------|-------------------|-------------|
| Create / edit own draft | Yes | Yes |
| Submit for review | Yes | Yes |
| Approve / reject / archive | No | Yes |
| Moderate third parties | No | Yes |

**Not wired in R5.3:** `relation-write-authorization` — store-owner shim remains for R5.2 `uses` INSERT.

#### WP2 — Semantic reframe

- `types/definitions/recipe.ts` — protocol framing; v2 attribute rename table (comments only)
- `publication-type-registry` — `displayName: 'Protocolos'`, `ecosystem: 'bots'`

#### WP3 — Relations BC (docs)

Symbols `recipe-ingredient-*` unchanged until R5.4. Comments use **protocol input** language. R5.2 **product-only** `uses` shim documented; do not expand in R5.3.

#### WP4 — USABLE roadmap (R5.4)

```text
recipe → uses → target
```

| Phase | Target |
|-------|--------|
| R5.2 (code) | `product` only |
| R5.3 | Document transition |
| R5.4 | `USABLE` capability — product, resource, service, dittobot, project |

#### Sequencing (updated)

| Phase | Scope |
|-------|-------|
| R5.2 | `uses` create-only (product shim) |
| R5.2b | `uses` delete + DELETE RLS |
| **R5.3** | Grower + protocol **policies & docs** (this section) |
| R5.4 | USABLE `uses` + Grower library RLS + wire grower auth to writes |
| R5.5+ | DittoBot pairing UI + Protocol Editor |
| R5.6+ | Grower Network dashboard UI + telemetry |

#### R5.3 STOP GATE

**In scope:** policy modules, tests, port stub, CLAUDE/docs, comment reframe.

**Out of scope:** Recipe Editor UI, pairing, telemetry, dashboard UI, SQL, Offer BC, C5 exports, `uses` target expansion, manual `ditto-grower` role.

### Marketplace Discovery — Canonical Read Ownership Rule

Marketplace tiene **una sola fuente canónica por fase** (`DISCOVERY_SOURCE`):

| Fase | Valor | Canónico | Fallback |
|------|-------|----------|----------|
| A | `listing` | listing | — |
| B | `dual` | publication | listing |
| C | `publication` | publication | — |

Reglas:

1. **Ningún componente UI** puede leer simultáneamente `publication` y `listing`.
2. **Toda mezcla** ocurre exclusivamente dentro de `@/domains/marketplace/discovery`.
3. Prohibido en páginas públicas:

```typescript
// ❌ NUNCA
const listing = await fetchMarketplaceListings(...)
const publication = await buildDiscoveryFeed(...)
```

**Prohibido crear nuevas queries** en `listings/application/queries/` salvo excepciones arriba. Lectura pública nueva → `discovery/application/queries/` o `discovery/projections/`.

---

### 1. Type Generation is Non-Negotiable

```bash
# After ANY schema change:
supabase gen types --local > src/shared/types/supabase.ts && cp src/shared/types/supabase.ts types/supabase.ts

# Automate with git hooks:
# .husky/pre-commit
if git diff --cached --name-only | grep -q "supabase/migrations"; then
  npm run types:generate
  git add types/supabase.ts
fi
```

### 2. Server-First Architecture (Next.js 15.3)

```typescript
// ✅ Server Components by default
export default async function Page() {
  const data = await getServerData() // Direct DB calls
  return <ClientComponent initialData={data} />
}

// ✅ Use after() for non-blocking operations
import { after } from 'next/server'

export async function createPost(data: PostInput) {
  const post = await db.posts.create(data)
  
  after(async () => {
    // Non-blocking: analytics, cache warming, webhooks
    await trackEvent('post_created', { postId: post.id })
    await sendNotification(post.authorId)
  })
  
  return post
}
```

### 3. Supabase Client Separation

```typescript
// lib/supabase/client.ts - Browser only
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts - Server only
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```
### Supabase Migration-First Development

When working with Supabase databases, **ALWAYS** use migrations for ANY schema changes:
### Core Rules

1. **NEVER modify the database directly** - No manual CREATE TABLE, ALTER TABLE, etc.
    
2. **ALWAYS create a migration file** for schema changes:
    
    ```bash
    supabase migration new descriptive_name_here
    ```
    
3. **Migration naming convention**:
    
    - `create_[table]_table` - New tables
    - `add_[column]_to_[table]` - New columns
    - `update_[table]_[change]` - Modifications
    - `create_[name]_index` - Indexes
    - `add_[table]_rls` - RLS policies
4. **After EVERY migration**:
    ```bash
    supabase db reset                          # Apply locally
    supabase gen types --local > src/shared/types/supabase.ts && cp src/shared/types/supabase.ts types/supabase.ts  # Update types
    ```
5. **Example workflow for adding a field**:
    ```bash
    # Wrong ❌
    ALTER TABLE posts ADD COLUMN views INTEGER DEFAULT 0;
    
    # Right ✅
    supabase migration new add_views_to_posts
    # Then write SQL in the generated file
    # Then: supabase db reset && npm run db:types
    ```
6. **Include in EVERY migration**:
    
    - Enable RLS on new tables
    - Add proper indexes
    - Consider adding triggers for updated_at
7. **Commit both**:
    
    - Migration file (`supabase/migrations/*.sql`)
    - Updated types (`types/supabase.ts`)

This ensures reproducible database states across all environments and team members.

## 📁 Project Structure (Next.js 15.3 + Supabase)

```
├── app/                      # App Router
│   ├── (auth)/              # Auth group routes
│   ├── (dashboard)/         # Protected routes
│   ├── api/                 # API routes
│   └── globals.css          # Tailwind v4
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── features/            # Feature components
├── lib/
│   ├── supabase/           # Client configs
│   └── utils.ts            # cn() + helpers
├── server/                  # Server-only code
│   ├── queries/            # DB queries
│   └── actions/            # Server Actions
├── hooks/                   # Client hooks
├── test/                    # Test utilities
│   └── setup.ts            # Vitest setup
├── types/
│   └── supabase.ts         # Generated types
└── supabase/
    ├── migrations/         # Database migrations
    └── config.toml         # Supabase configuration
```

## 🎯 Next.js 15.3 Patterns

### Server Actions with Revalidation

```typescript
// server/actions/posts.ts
'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { after } from 'next/server'

export async function createPost(formData: PostInput) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .insert(formData)
    .select()
    .single()

  if (error) throw error

  // Immediate revalidation
  revalidateTag('posts')
  revalidatePath('/dashboard')
  
  // Deferred operations
  after(async () => {
    await notifySubscribers(data.id)
  })

  return data
}
```

### Form Component with Prefetching

```typescript
// Using Next.js 15.3 stable Form component
import Form from 'next/form'

export function SearchForm() {
  return (
    <Form action="/search" prefetch={true}>
      <input name="q" placeholder="Search..." />
      <button type="submit">Search</button>
    </Form>
  )
}
```

### Connection API for Performance

```typescript
// Warm connections early for better performance
import { connection } from 'next/server'

export default async function Layout({ children }) {
  // Pre-warm database connection
  await connection()
  
  // Pre-connect to external services
  await fetch('https://api.service.com/warmup', { 
    method: 'HEAD' 
  })
  
  return <>{children}</>
}
```

## 🔐 Authentication Pattern (Already Implemented)

The starter includes a complete authentication setup:
- Sign up/Sign in pages at `/signup` and `/signin`
- Protected dashboard routes under `app/(dashboard)/`
- Server actions in `server/actions/auth.ts`
- Auth middleware configuration
- Profile creation on signup

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

// app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  return <>{children}</>
}

// server/actions/auth.ts - Available auth actions
export async function signUp(formData: FormData)
export async function signIn(formData: FormData)
export async function signOut()
```

## 🎨 UI Components (shadcn/ui + Tailwind v4)

### Tailwind v4 Configuration

```css
/* app/globals.css */
@import "tailwindcss";

/* Define design tokens in @theme */
@theme {
  --color-primary: oklch(24% 0.15 256);
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(10% 0 0);
  
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius: 0.5rem;
}

/* No more @tailwind directives or @layer needed */
```

### Component Setup

```bash
# Initialize shadcn/ui with Tailwind v4
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button form card toast
```

```typescript
// Feature component using shadcn/ui
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function PostCard({ post }: { post: Post }) {
  const { toast } = useToast()
  
  async function handleLike() {
    const result = await likePost(post.id)
    
    toast({
      title: result.success ? "Liked!" : "Error",
      variant: result.success ? "default" : "destructive",
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
      </CardHeader>
      <CardContent>{post.content}</CardContent>
      <CardFooter>
        <Button onClick={handleLike}>Like</Button>
      </CardFooter>
    </Card>
  )
}
```

## 🔥 Real-time Subscriptions

```typescript
// hooks/use-realtime.ts
export function useRealtime<T extends keyof Database['public']['Tables']>(
  table: T,
  filter?: string
) {
  const [data, setData] = useState<Tables<T>[]>([])
  const supabase = createClient() // Client-side only

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table, filter },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [payload.new as Tables<T>, ...prev])
          }
          // Handle UPDATE, DELETE
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [table, filter])

  return data
}
```

## 🧪 Testing Infrastructure (Vitest)

### When to Test

- **Business logic** in utilities and hooks
- **Server Actions** with mocked Supabase client
- **Component behavior** not visual appearance
- **Error states** and edge cases

### Setup

```bash
npm i -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

// test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  }),
}))
```

### Testing Patterns

```typescript
// components/features/posts/__tests__/post-card.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PostCard } from '../post-card'

describe('PostCard', () => {
  const mockPost = {
    id: '1',
    title: 'Test Post',
    content: 'Test content',
    author: { name: 'John' },
  }

  it('renders post content', () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('calls onLike when like button clicked', async () => {
    const onLike = vi.fn()
    const user = userEvent.setup()
    
    render(<PostCard post={mockPost} onLike={onLike} />)
    await user.click(screen.getByRole('button', { name: /like/i }))
    
    expect(onLike).toHaveBeenCalledWith(mockPost.id)
  })
})

// server/actions/__tests__/posts.test.ts
import { createPost } from '../posts'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server')

describe('createPost', () => {
  it('creates post and returns data', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: { id: '1', title: 'New Post' }, 
              error: null 
            })),
          })),
        })),
      })),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    
    const result = await createPost({ title: 'New Post', content: 'Content' })
    expect(result).toEqual({ id: '1', title: 'New Post' })
  })

  it('throws error on database failure', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ 
              data: null, 
              error: new Error('Database error') 
            })),
          })),
        })),
      })),
    }
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    
    await expect(createPost({ title: 'Test', content: 'Test' }))
      .rejects.toThrow('Database error')
  })
})
```

## 📊 Database Patterns

### Type-Safe Queries

```typescript
// server/queries/posts.ts
import type { Database } from '@/types/supabase'

type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export async function getPosts() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user!inner(username, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### Row Level Security

```sql
-- Always enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public read, authenticated write
CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (published = true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
```

## 🚀 Performance Optimization

### Parallel Data Loading

```typescript
// Load data in parallel in Server Components
export default async function DashboardPage() {
  const [posts, profile, stats] = await Promise.all([
    getPosts(),
    getProfile(),
    getStats()
  ])
  
  return (
    <Dashboard 
      posts={posts} 
      profile={profile} 
      stats={stats} 
    />
  )
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList />
      </Suspense>
    </>
  )
}

async function PostsList() {
  const posts = await getPosts() // This can be slow
  return <>{posts.map(post => <PostCard key={post.id} post={post} />)}</>
}
```

## 🔧 Development Workflow

### Essential Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "db:types": "supabase gen types --local > src/shared/types/supabase.ts && cp src/shared/types/supabase.ts types/supabase.ts",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset"
  }
}
```

### Environment Variables

```typescript
// lib/env.ts - Validated env vars
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

## ⚡ Key Commands

```bash
# Development
npm run dev --turbo          # Fast refresh with Turbopack
supabase start              # Local Supabase

# Testing
npm run test                # Run tests in watch mode
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Generate coverage report

# Database
supabase db reset           # Reset + migrate
supabase gen types --local > src/shared/types/supabase.ts && cp src/shared/types/supabase.ts types/supabase.ts

# UI Components
npx shadcn@latest add       # Add components

# Production
npm run build              # Type-safe build
supabase db push          # Deploy migrations
```

## 🚨 Critical Rules

1. **Always regenerate types after schema changes**
2. **Use Server Components by default, Client Components when needed**
3. **Separate server and client Supabase instances**
4. **Use `after()` for non-blocking operations**
5. **Enable RLS on all tables**
6. **Compose UI with shadcn/ui components**
7. **Validate environment variables with Zod**
8. **Use Server Actions for mutations**
9. **Implement proper error boundaries**
10. **Stream data with Suspense for better UX**
11. **Test business logic, not implementation details**