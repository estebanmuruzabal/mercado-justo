# Cursor / Architecture Context

## Architecture Rules

- Providers/stores/reducers/global state must NEVER live inside `components/`
- Shared reusable business constants must always live in `lib/`
- Marketplace listing types must always come from `lib/listing.ts`
- Avoid duplicated string unions across the project
- Components should focus on UI/presentation only
- Shared business logic must be centralized and reusable
- Keep architecture modular and scalable

