// components/home/search-hero.tsx

"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, User } from 'lucide-react'
import { useState } from 'react'
import { CartDrawer } from '../cart-drawer/cart-drawer'


export function SearchHero({ email }: { email?: string }) {
    const [open, setOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [cartCount] = useState(2) // después lo conectás a estado real
      
  return (
    <section className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">

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

      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-8">
        <div className="mb-8 flex items-center gap-10 text-sm font-medium">
          <button className="border-b-2 border-black pb-2">
            Products
          </button>

          <button className="pb-2 text-muted-foreground hover:text-black">
            Services
          </button>

          <button className="pb-2 text-muted-foreground hover:text-black">
            Properties
          </button>

          <button className="pb-2 text-muted-foreground hover:text-black">
            Experiences
          </button>
        </div>

        <div className="flex w-full max-w-4xl items-center rounded-full border bg-white p-2 shadow-lg">
          <div className="flex-1 px-5">
            <p className="text-xs font-semibold">Location</p>

            <Input
              placeholder="Search city or address"
              className="border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="h-10 w-px bg-border" />

          <div className="w-[180px] px-5">
            <p className="text-xs font-semibold">Distance</p>

            <Input
              placeholder="20 km"
              className="border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <Button
            size="icon"
            className="ml-2 h-14 w-14 rounded-full"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

        {/* Acciones */}
        <div className="flex items-center gap-6">
</div>
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

       {/* Cart Drawer */}
       {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </section>
  )
}

