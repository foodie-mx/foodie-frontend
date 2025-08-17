// -------------------------- Utils --------------------------
import type {MenuItem, Order} from "./Types.ts";

export const currency = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
export const uid = () => Math.random().toString(36).slice(2, 10)

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

export const withinLastNDays = (dateISO: string, n: number) => {
    const d = new Date(dateISO)
    const now = new Date()
    const start = new Date(startOfDay(now).getTime() - (n - 1) * 86400000)
    return d >= start && d <= now
}

// total reflects base price + modifier delta * qty
export function computeOrderTotal(order: Order, menuIndex: Record<string, MenuItem>): number {
    return order.items.reduce((sum, it) => {
        const mi = menuIndex[it.menuItemId]
        if (!mi) return sum
        const mod = it.modifierName ? mi.modifiers.find(m => m.name === it.modifierName) : undefined
        const price = mi.price + (mod?.priceDelta ?? 0)
        return sum + price * it.qty
    }, 0)
}