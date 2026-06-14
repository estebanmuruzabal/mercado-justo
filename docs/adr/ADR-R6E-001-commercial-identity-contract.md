# ADR-R6E-001: Commercial identity contract (listing_variant vs offer_variant)

**Status:** Accepted  
**Date:** 2026-06-01  
**Related:** [R6.0e checkout investigation](../r6.0e-checkout-investigation.md), [DittoBot commercial identity](../dittobot-commercial-identity.md)

## Context

Mercado Justo runs a Strangler migration:

- **Write path:** `listing` + `listing_variant` (seller dashboard, DittoBot admin product create).
- **Read path (discovery):** `publication` + Offer BC (`offer`, `offer_variant`) synced from listing via DB triggers.
- **Transaction path:** `cart_line`, `order_item`, and `transaction_line` FK to `listing_variant(id)`.

R6.0e exposed a regression: discovery/cart could carry `offer_variant.id` while checkout queried `listing_variant` by id, causing `Variante no encontrada`.

## Decision

### Transactional identity (cart, checkout, orders, fulfillment via order lines)

Use **`listing_variant.id`** exclusively for persisted references:

- Client/server cart `variantId` (target state after discovery mapper fix).
- `cart_line.variant_id`
- `order_item.variant_id`
- `transaction_line.variant_id`
- Future fulfillment hooks that attach to order lines.

### Discovery identity

Use **`publication`** as the browse/discovery aggregate. Commercial fields (price, stock, default SKU) are read through **Offer BC** only:

```typescript
resolveCommercialSnapshots(publicationIds): Promise<Map<string, CommercialSnapshot>>
```

`CommercialSnapshot.variantId` MUST be **`listing_variant.id`** (via `offer_variant.legacy_variant_id` when source is `offer`). It must not expose bare `offer_variant.id` to cart or checkout.

### Offer BC role

- **Read-only** projection (see `assertOfferReadOnly` in Offer domain).
- `offer.id` and `offer_variant.id` are surrogate keys for the read model.
- **Must not** be stored in transactional business tables.
- `cart_line.line_kind = 'offer_variant'` is a historical label only; the FK still points at `listing_variant`.

### DittoBot-specific keys

| Concern | Canonical key |
|---------|----------------|
| Product catalog root | `publication.id` (= `listing.id` after `sync_listing_to_publication`) |
| Purchase / cart / order | `listing_variant.id` |
| Physical inventory units | `ditto_bot_inventory_unit.product_id` → `publication.id` |
| Public sellable stock | RPC on `publication.id` (assigned units), not `listing.stock` |

Do **not** use `offer_variant.id` as a DittoBot business key.

### Legacy compatibility (temporary)

`resolveCheckoutVariants` may accept cart lines that still contain `offer_variant.id` (old localStorage sessions). It resolves to `listing_variant.id` via `offer_variant.legacy_variant_id`. This fallback is **not** the long-term design.

Telemetry: `fallback_hits` counter in checkout resolver (see Observability).

## Consequences

- **Positive:** Single transactional SKU id; FK integrity; discovery can evolve on publication/offer without breaking orders.
- **Negative:** Two persisted rows per SKU during Strangler (`listing_variant` + `offer_variant`); requires discipline and comments to avoid new offer-id consumers.
- **Removal criteria:** When `fallback_hits` stays at zero across production releases, the offer→listing resolver branch may be deleted.

## Observability

- Metric: `getCheckoutVariantFallbackMetrics().fallbackHits`
- Log (non-test): `[commercial-identity] checkout_variant_fallback_hits=N cart_ids=[...]`
- Retire fallback when `fallback_hits === 0` for several consecutive releases.

## Compliance

New code MUST:

1. Pass `listing_variant.id` into cart/checkout/order paths.
2. Not add FKs or business logic keyed on `offer_variant.id`.
3. Keep Offer writes on the listing_variant Strangler path only.

See code comments referencing **ADR-R6E-001** in:

- `src/domains/marketplace/offer/application/mappers/listing-variant-adapter.ts`
- `src/domains/marketplace/offer/application/queries/offer.queries.ts`
- `src/domains/marketplace/orders/application/checkout-variant.resolver.ts`
