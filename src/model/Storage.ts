// -------------------------- Storage --------------------------
import type {MenuItem, Order, Table} from "./Types.ts";

const LS_KEY = 'restaurant_manager_state_v1'

type Persisted = { menuItems: MenuItem[]; tables: Table[]; orders: Order[] }

export function loadState(): Persisted | null {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch {
        return null
    }
}

export function saveState(state: Persisted) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state))
    } catch {
        // ignore
    }
}