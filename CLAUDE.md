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

**Estado (2026-05-31):** R3.0 complete — read BC con `resolveRelationSnapshots()`. **Próximo:** R3.1 (writes, owner-aware RLS, `createRelation`).

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

**`includePrivate` contract (R3.0):**

- Requires `actor: RelationReadActor` (source owner, admin, or serviceRole) — ignored without authorization.
- Extends visibility for scheduled/expired/inherit-hidden edges only; does not mean "show everything".
- Current RLS only returns edges with `visibility IN ('public', 'inherit')` — private DB edges are not accessible yet.
- TODO(R3.1): Private relations become fully accessible only after owner-aware RLS policies.

**Registry strangler:** `@/domains/marketplace/shared/domain/relation-type-registry` is deprecated — migrate to `@/domains/marketplace/relations`. TODO(R3.2): remove shared re-export.

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