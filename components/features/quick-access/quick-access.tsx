// components/quick-access.tsx
'use client'

import Link from 'next/link'

export function QuickAccess() {
  const items = [
    { name: 'Cultivos', href: '/cultivos' },
    { name: 'Sensores', href: '/sensores' },
    { name: 'Marketplace', href: '/market' },
    { name: 'Comunidad', href: '/comunidad' },
    { name: 'Automatización', href: '/auto' },
  ]

  return (
    <div className="w-full overflow-x-auto border-b">
      <div className="flex gap-4 px-4 py-3 min-w-max">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm hover:bg-gray-100"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  )
}