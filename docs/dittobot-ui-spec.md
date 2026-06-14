# DittoBot UI Specification (R5.4)

**IDs for catalog vs purchase:** [dittobot-commercial-identity.md](./dittobot-commercial-identity.md) (`publication.id` for product/inventory; `listing_variant.id` for cart/checkout).

## Pantallas

| Ruta | Actor | Estados |
|------|-------|---------|
| `/admin/dittobots` | Super Admin | empty · loading · success · error |
| `/profile/dittobots` | Authenticated user | empty · con bots · error activación |
| `/recetas` | Grower (activated bot) | list · create · rate · redirect if not grower |

## Mis DittoBots — estados

### Empty
- Explicación Grower + DittoBot
- CTA **Comprar** → `/contacto`
- Formulario **Activar** (serial + código)

### Con bots
- Lista: serial, model, status, activated_at, region
- Configuración mínima inline por dispositivo (no pantalla final)

## Configuración dispositivo (MVP inline → futuro)

```text
Mis Dispositivos Ditto
└── Configuración (FUTURO — pantalla dedicada)
    ├── nombre amigable (friendly_name)
    ├── ubicación (location_lat/lng/region)
    ├── heredar ubicación usuario (inherits_user_location)
    └── mostrar en mapa comunitario (is_public_on_map, default false)
```

R5.4 implementa toggles inline en `mis-dittobots-panel.tsx`. Pantalla dedicada → R5.5+.

## Admin DittoBot Inventory

Columnas: serial, model, status, location_region, is_public_on_map, owner, activated_at, lat/lng.

Super Admin **siempre** ve ubicación completa independiente de `is_public_on_map`.

## Mapa comunitario (future hooks)

Dominio: `device-map.hooks.ts` — capas `dittobots`, `ditto_clima`, `productions`, `public_protocols`, `growers`.

Grower Network = agregación de `PublicDittoDeviceMapPin` (dispositivos públicos), no pins por usuario.

**No expuesto en R5.4.**

## Recetas (/recetas)

Semántica dominio = `publication_type = 'recipe'` (Ditto Protocol).

- Listar propios + biblioteca comunitaria (approved + published + public)
- Crear borrador mínimo + link producto opcional (`uses` edge)
- Calificar protocolos de biblioteca (`publication_review`)
