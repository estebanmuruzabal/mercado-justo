// components/profile/tabs/security.tsx
'use client'

import { PasswordInput } from '@/shared/ui/password-input'

export function Security() {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Seguridad</h2>
  
        <PasswordInput placeholder="Nueva contraseña" />
        <PasswordInput placeholder="Confirmar contraseña" />
  
        <button className="bg-black text-white px-4 py-2 rounded">
          Cambiar contraseña
        </button>
      </div>
    )
  }