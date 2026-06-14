# DittoBot — Commercial identity keys

**ADR:** [ADR-R6E-001](./adr/ADR-R6E-001-commercial-identity-contract.md)  
**Related:** [R6.0e checkout investigation](./r6.0e-checkout-investigation.md), [R6.0bc implementation](./r6.0bc-implementation-report.md)

## Summary

DittoBot uses the same commercial identity contract as the rest of the marketplace. Do not introduce `offer_variant.id` as a business key.

## Keys by concern

| Concern | Use this ID | Notes |
|---------|-------------|--------|
| Product catalog / discovery | `publication.id` | Same UUID as `listing.id` after `sync_listing_to_publication` |
| Add to cart / checkout / orders | `listing_variant.id` | FK on `cart_line`, `order_item`, `transaction_line` |
| Physical inventory units | `ditto_bot_inventory_unit.product_id` | Points at `publication.id` |
| Public sellable stock | RPC `ditto_bot_public_stock_by_product` | Counts **assigned** units with vendor; not `listing.stock` |

## Prohibited

- `offer_variant.id` as cart, order, inventory, or fulfillment key
- `listing.stock` for DittoBot sellable quantity (catalog stock is forced to `0`; stock lives on inventory units)

## Discovery → cart flow

1. Discovery reads `publication` + `resolveCommercialSnapshots()`.
2. `CommercialSnapshot.variantId` must be `listing_variant.id` (via `legacy_variant_id` on synced offer rows).
3. Client adds to cart with that id; checkout resolves to the same `listing_variant.id` for `order_item`.

Legacy carts may still hold `offer_variant.id`; checkout resolver maps them via `legacy_variant_id` until telemetry shows zero fallback hits in production.

## Stock

- **Admin / lots:** assign units in `ditto_bot_inventory_unit` (`assigned` + `assigned_vendor_id`).
- **Public UI:** `countDittoBotPublicStockByProductIds` → assigned-only RPC.
- **Checkout gate:** `validateDittoBotCheckoutStock` before order insert.

## See also

- [DittoBot UI spec](./dittobot-ui-spec.md)
- [ADR index](./adr/README.md)
