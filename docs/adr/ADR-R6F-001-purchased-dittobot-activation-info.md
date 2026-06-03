# ADR-R6F-001: Purchased DittoBot Activation Info

## Status

Accepted for R6.0f prep.

## Context

Buyers need the serial number and activation code after purchasing a DittoBot. Physical inventory must remain separate from commercial catalog and stock:

- Product/catalog identity stays commercial (`publication`, transactional `listing_variant.id`).
- Physical unit identity stays operational (`ditto_bot_inventory_unit`).
- `listing.stock` is never the source of truth for DittoBot physical availability.

The schema already has nullable traceability columns from physical inventory to commerce:

- `ditto_bot_inventory_unit.order_id`
- `ditto_bot_inventory_unit.order_item_id`

The current checkout path creates `order` and `order_item`, validates DittoBot stock, but does not yet assign a specific physical unit or populate those traceability columns.

## Decision

The purchase and sales UI may display DittoBot activation information only when `ditto_bot_inventory_unit` is already linked to the order through `order_id` / `order_item_id`.

Visibility rules:

- Buyer of the order: full `serial_number` and full `activation_code`.
- SuperAdmin: full `serial_number` and full `activation_code`.
- Vendor/seller: `serial_number`, unit status, and masked `activation_code` only.

The UI must not invent serials or activation codes. If no physical unit is linked to the order, the DittoBot section remains hidden.

## Consequences

R6.0f fulfillment still needs the write path that selects assigned DittoBot units and marks them `sold` with `order_id`, `order_item_id`, `seller_vendor_id`, and `sold_at`.
