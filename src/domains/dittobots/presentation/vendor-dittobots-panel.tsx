'use client'

import { useState } from 'react'
import { Bot, ChevronDown, ChevronRight } from 'lucide-react'

import type {
  VendorInventoryUnitRow,
  VendorStockAggregate,
} from '@/domains/dittobots/application/queries/vendor-ditto-bots.queries'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

function StockTab({
  stock,
  unitsByProduct,
}: {
  stock: VendorStockAggregate[]
  unitsByProduct: Record<string, VendorInventoryUnitRow[]>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock asignado</CardTitle>
        <CardDescription>
          Unidades donde tu tienda es assigned_vendor o seller_vendor.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {stock.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No tenés stock DittoBot asignado.</p>
        ) : (
          stock.map((row) => {
            const isOpen = expanded === row.productId
            const units = unitsByProduct[row.productId] ?? []
            return (
              <div key={row.productId} className='rounded-lg border'>
                <button
                  type='button'
                  className='flex w-full items-center justify-between gap-4 p-4 text-left'
                  onClick={() => setExpanded(isOpen ? null : row.productId)}
                >
                  <div className='flex items-center gap-2'>
                    {isOpen ? (
                      <ChevronDown className='h-4 w-4' />
                    ) : (
                      <ChevronRight className='h-4 w-4' />
                    )}
                    <span className='font-medium'>{row.productTitle}</span>
                  </div>
                  <div className='flex flex-wrap gap-2 text-xs'>
                    <Badge variant='secondary'>Asignado: {row.assignedCount}</Badge>
                    <Badge variant='outline'>Disponible: {row.availableCount}</Badge>
                    <Badge variant='outline'>Reservado: {row.reservedCount}</Badge>
                    <Badge>Vendido: {row.soldCount}</Badge>
                  </div>
                </button>
                {isOpen ? (
                  <div className='border-t px-4 pb-4'>
                    <table className='mt-2 w-full text-xs'>
                      <thead>
                        <tr className='text-left text-muted-foreground'>
                          <th className='py-1 pr-3'>Serial</th>
                          <th className='py-1'>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map((u) => (
                          <tr key={u.id} className='border-t'>
                            <td className='py-1.5 pr-3 font-mono'>{u.serialNumber}</td>
                            <td className='py-1.5'>{u.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function PlaceholderTab({ title, phase }: { title: string; phase: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground'>Disponible en {phase}.</p>
      </CardContent>
    </Card>
  )
}

export function VendorDittoBotsPanel({
  stock,
  unitsByProduct,
}: {
  stock: VendorStockAggregate[]
  unitsByProduct: Record<string, VendorInventoryUnitRow[]>
}) {
  return (
    <Tabs defaultValue='stock'>
      <TabsList>
        <TabsTrigger value='stock'>Stock</TabsTrigger>
        <TabsTrigger value='sales'>Ventas</TabsTrigger>
        <TabsTrigger value='activations'>Activaciones</TabsTrigger>
        <TabsTrigger value='warranty'>Garantías</TabsTrigger>
      </TabsList>
      <TabsContent value='stock' className='mt-4'>
        <StockTab stock={stock} unitsByProduct={unitsByProduct} />
      </TabsContent>
      <TabsContent value='sales' className='mt-4'>
        <PlaceholderTab title='Ventas DittoBot' phase='R6.0e' />
      </TabsContent>
      <TabsContent value='activations' className='mt-4'>
        <PlaceholderTab title='Activaciones' phase='R6.0e' />
      </TabsContent>
      <TabsContent value='warranty' className='mt-4'>
        <PlaceholderTab title='Garantías' phase='R6.0e' />
      </TabsContent>
    </Tabs>
  )
}

export function VendorDittoBotsHeader({ storeName }: { storeName: string }) {
  return (
    <div className='space-y-1'>
      <h1 className='flex items-center gap-2 text-3xl font-bold'>
        <Bot className='h-7 w-7' />
        Mis DittoBots
      </h1>
      <p className='text-sm text-muted-foreground'>{storeName}</p>
    </div>
  )
}
