// -------------------------- Types --------------------------
type Modifier = { name: string; priceDelta: number }

export type MenuItem = {
    id: string
    name: string
    category: string
    price: number
    modifiers: Modifier[]
}

export type Table = {
    id: string
    name: string
    status: 'available' | 'occupied' | 'needs_cleaning'
}

export type OrderItem = {
    menuItemId: string
    modifierName?: string
    qty: number
}

export type Order = {
    id: string
    tableId: string
    items: OrderItem[]
    status: 'in_progress' | 'served' | 'paid'
    createdAt: string // ISO
}

export type TableStatusFilter = 'all' | 'available' | 'occupied' | 'needs_cleaning'