// components/cart-drawer.tsx
'use client'

export function CartDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      
      <div className="w-80 h-full bg-white shadow-xl p-4 animate-slide-in">
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Tu carrito</h2>
          <button onClick={onClose}>X</button>
        </div>

        <div className="space-y-2">
          <p className="text-sm">Producto 1</p>
          <p className="text-sm">Producto 2</p>
        </div>

      </div>

    </div>
  )
}