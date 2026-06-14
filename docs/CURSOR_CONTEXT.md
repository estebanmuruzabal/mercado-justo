# Cursor / Ditto Architecture Context

## Prioridad

Este documento complementa [CLAUDE.md](../CLAUDE.md). Ante conflicto, prevalece la sección **Ditto Domain Architecture**.

## Estado de migración

- Estructura objetivo: `src/domains/` + `src/shared/` + `app/`
- Durante migración: re-exports en paths legacy son **temporales** — NO agregar código nuevo ahí
- Consultar `domains/{x}/index.ts` antes de crear utilidades

## Checklist antes de escribir código

1. ¿A qué dominio pertenece este cambio?
2. ¿Ya existe entidad/tipo/repository equivalente?
3. ¿La UI necesita un DTO nuevo en `application/dto/`?
4. ¿Hay evento de dominio existente en `shared/events/`?
5. ¿Requiere migration + regenerar supabase types?

## Reglas heredadas (siguen vigentes)

- Providers/stores globales NO van en `presentation/` de otros dominios
- `ListingType` canónico: `src/domains/marketplace/listings/domain/listing-types.ts` (alineado con DB enum)
- Componentes `shared/ui`: solo presentación, sin lógica de negocio
- Tests de reglas de negocio: junto al `domain/` o engine correspondiente

## Anti-patterns detectados (NO replicar)

- Importar `@/server/*` desde componentes (usar `@/domains/*/index`)
- Importar tipos desde `*.actions.ts` en UI (usar `application/dto/`)
- Handlers de eventos importando services directamente desde capas inferiores
- Duplicar geocoding, roles, routes, cart en múltiples carpetas
- Crear carpetas `utils/`, `helpers/`, `common/` fuera de `shared/`

## Dónde va código nuevo

| Tipo | Ubicación |
|------|-----------|
| Server Action | `src/domains/{domain}/application/actions/` |
| Query | `src/domains/{domain}/application/queries/` |
| Componente de feature | `src/domains/{domain}/presentation/components/` |
| UI genérico | `src/shared/ui/` |
| Supabase client | `src/shared/database/supabase/` |
| Rutas | `src/shared/routing/routes.ts` |
