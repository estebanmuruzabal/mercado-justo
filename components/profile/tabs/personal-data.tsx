// components/profile/tabs/personal-data.tsx
'use client'

export function PersonalData({ user }: any) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Datos personales</h2>
  
        <input className="border p-2 w-full" defaultValue={user.email} />
        <input className="border p-2 w-full" placeholder="Nombre" />
  
        <div>
          <label>Foto</label>
          <input type="file" />
        </div>
  
        <button className="bg-black text-white px-4 py-2 rounded">
          Guardar
        </button>
      </div>
    )
  }