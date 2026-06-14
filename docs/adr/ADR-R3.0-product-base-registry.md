# ADR-R3.0: Product Base Registry & Dynamic Attribute Engine

## Status

Accepted — R3.0 Admin MVP shipped.

## Context

Mercado Justo had parallel form systems:

- `listing_template` (category JSONB)
- `publication_type_schema` (unused in seller UI)
- Hardcoded `BASE_TEMPLATE` in ListingManager
- DittoBot parallel catalog (`is_ditto_bot` shim)

Sellers could not share reusable master templates. Every new category/type risked new hardcoded forms.

## Decision

Introduce **Product Base** as the single Superadmin-managed template registry:

```text
Category → Subcategory → ProductBase → ProductBaseAttribute → Listing (R3.1+)
```

R3.0 scope is **admin-only**:

- Tables `product_base`, `product_base_attribute`
- Superadmin CRUD (list, create, edit, duplicate, activate/deactivate, delete draft/inactive)
- Domain validation (1 variant dimension max, image strategy rules, attribute type rules)
- Admin UI at `/admin/product-bases`

**Out of scope R3.0:** seller ListingManager wiring, discovery filters, DittoBot catalog migration, `listing.product_base_id` FK.

## Product Base contract

| Field | Purpose |
|-------|---------|
| `name`, `slug` | Identity |
| `category_id`, `subcategory_id` | Taxonomy anchor (existing `category` table) |
| `type` | `PRODUCT`, `SERVICE`, `PROPERTY`, `EXPERIENCE`, `DITTOBOT`, `DITTO_RECIPE` |
| `status` | `DRAFT`, `ACTIVE`, `INACTIVE` |
| `base_image_url`, `image_strategy` | Image policy |

## Product Base Attribute contract

16 supported types: TEXT, TEXTAREA, NUMBER, BOOLEAN, DATE, SELECT, MULTISELECT, IMAGE, FILE, LOCATION, EMAIL, PHONE, URL, CURRENCY, PERCENTAGE.

Flags:

- `required`, `is_visible`, `is_filterable`, `is_searchable`
- `is_variant_dimension` — **max 1 per base** (partial unique index + domain policy)
- `allow_variant_pricing` — only when `is_variant_dimension = true`

Values persist in listing JSON in R3.1 (`characteristics` / `attributes_json`), not duplicated on ProductBase rows.

## Image resolution (R3.1+)

Priority:

```text
listing.images[0] → productBase.baseImageUrl → placeholder
```

Strategies:

| Strategy | Behavior |
|----------|----------|
| `BASE_ONLY` | Listing cannot override image |
| `BASE_OR_LISTING` | Listing image if present, else base |
| `LISTING_REQUIRED` | Base image forbidden; seller must upload |

## Variants — no parallel Variant entity

R3.0 does **not** create Variant / VariantOption tables.

R3.2 will derive commercial rows from the single `is_variant_dimension` attribute:

- **`listing_variant` remains transactional identity** (ADR-R6E-001)
- Options come from ProductBaseAttribute.options
- Price/stock matrix per option lives on listing commercial layer

No Color + Size combinations in R3.x MVP.

## Ditto compatibility (R3.3)

DittoBots and Ditto Recipes become Product Bases:

- `ProductBase.type = DITTOBOT`
- `ProductBase.type = DITTO_RECIPE`

Published via normal listings. Deprecates parallel DittoBot catalog admin path.

## Database

Migration: `supabase/migrations/20260603140000_create_product_base_registry.sql`

RLS:

- SELECT active bases: authenticated
- SELECT all: staff (`is_staff()`)
- Writes: super-admin only (`is_super_admin()`)

## Sequencing

| Phase | Scope |
|-------|-------|
| **R3.0** | Admin registry (this ADR) |
| **R3.1** | `listing.product_base_id`; ListingManager dynamic render; JSON persist |
| **R3.2** | Variant dimension → `listing_variant` price/stock matrix |
| **R3.3** | DittoBot / Ditto Recipe migration off parallel catalog |
| **R3.4** | Strangler `listing_template` + `publication_type_schema` |

## Rollback (manual)

```sql
DROP TABLE IF EXISTS public.product_base_attribute;
DROP TABLE IF EXISTS public.product_base;
DROP FUNCTION IF EXISTS public.set_product_base_updated_at();
```
