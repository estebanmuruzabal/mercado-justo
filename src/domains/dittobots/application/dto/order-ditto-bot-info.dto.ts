export type OrderDittoBotInfoDto = {
  id: string
  orderId: string
  orderItemId: string | null
  productId: string | null
  productName: string
  serialNumber: string
  activationCode: string
  canCopyActivationCode: boolean
  status: string
  firmwareVersion: string | null
  activatedAt: string | null
}

export type OrderDittoBotInfoByOrderDto = Record<string, OrderDittoBotInfoDto[]>
