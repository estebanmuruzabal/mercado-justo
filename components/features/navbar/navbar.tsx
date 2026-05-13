// components/navbar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, User } from 'lucide-react'
import { useState } from 'react'
import { CartDrawer } from '../cart-drawer/cart-drawer'

export function Navbar({ email }: { email?: string }) {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartCount] = useState(2) // después lo conectás a estado real

  return (
    <>
      <div className="w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="font-bold">Ditto</span>
          </Link>

          {/* Acciones */}
          <div className="flex items-center gap-6">

            {/* Carrito */}
            <div className="relative cursor-pointer" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 text-xs bg-black text-white rounded-full px-1">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Perfil */}
            <div className="relative">
              <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="text-sm">{email}</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-md">
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 hover:bg-gray-100">
                    Settings
                  </Link>
                  <form action="/api/logout">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                      Logout
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  )
}