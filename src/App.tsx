// /src/App.tsx (React + Tailwind + Recharts)
// =============================================================================
// PLAN (pseudocode)
// - App State
//   - menuItems: [{ id, name, category, price, modifiers: [{name, priceDelta}] }]
//   - tables: [{ id, name, status: 'available'|'occupied'|'needs_cleaning' }]
//   - orders: [{ id, tableId, items:[{menuItemId, modifierName, qty}], status:'in_progress'|'served'|'paid', createdAt }]
//   - ui: search/filter terms, edit targets
//   - persistence: localStorage sync on change
// - Derived Data & Helpers
//   - computeOrderTotal(order) -> number
//   - salesSummary(range: 'day'|'week'|'month') from paid+served orders
//   - activeOrders = orders.filter(status==='in_progress')
//   - topSellers -> aggregate quantities by menuItemId
// - Components
//   - App (layout shell + state + routerless tabs)
//   - Header (brand + tab switcher)
//   - Dashboard({orders, menuItems})
//     - KPI cards (day/week/month totals)
//     - Active Orders list
//     - Top Sellers bar chart
//     - Sales trend (last 14 days) line chart
//   - MenuManager({menuItems, onCreate, onUpdate, onDelete})
//     - List + Filters
//     - Drawer/Form for Create/Edit (name, category, price, modifiers CRUD)
//   - TableManager({tables, orders, menuItems, onCreateOrder, onUpdateOrder, onUpdateTable})
//     - Grid of tables by status
//     - New Order composer (select table, add items, modifiers, qty) -> create in_progress order
//     - Order board per table (update status: in_progress -> served -> paid)
// - UX/Styling
//   - Tailwind, soft cards, responsive grid, sticky header
// - Data Simulation
//   - Seed dummy JSON
//   - Optional: tick timer to mark some orders "served" for demo
// =============================================================================

import { useEffect, useMemo, useState } from 'react'
import type { MenuItem, Order, Table } from "./model/Types.ts";
import { uid } from "./model/Utils.ts";
import { seedMenu, seedOrders, seedTables } from "./model/SeedData.ts";
import { loadState, saveState } from "./model/Storage.ts";
import TableManager from "./components/TableManager.tsx";
import Header from "./components/Header.tsx";
import Dashboard from "./components/Dashboard.tsx";
import MenuManager from "./components/MenuManager.tsx";

// -------------------------- App --------------------------
export default function App() {
    const persisted = loadState()
    const [menuItems, setMenuItems] = useState<MenuItem[]>(persisted?.menuItems ?? seedMenu)
    const [tables, setTables] = useState<Table[]>(persisted?.tables ?? seedTables)
    const [orders, setOrders] = useState<Order[]>(persisted?.orders ?? seedOrders())
    const [tab, setTab] = useState<'dashboard' | 'menu' | 'tables'>('dashboard')

    useEffect(() => {
        saveState({ menuItems, tables, orders })
    }, [menuItems, tables, orders])

    const menuIndex = useMemo(() => Object.fromEntries(menuItems.map(m => [m.id, m])), [menuItems])

    // Demo: auto-progress a served order to paid after some time (for visual movement)
    useEffect(() => {
        const t = setInterval(() => {
            setOrders(prev => {
                const idx = prev.findIndex(o => o.status === 'served')
                if (idx === -1) return prev
                const copy = [...prev]
                const o = { ...copy[idx], status: 'paid' as const }
                copy[idx] = o
                // mark table needs cleaning when paid
                setTables(ts => ts.map(tb => (tb.id === o.tableId ? { ...tb, status: 'needs_cleaning' } : tb)))
                return copy
            })
        }, 12000)
        return () => clearInterval(t)
    }, [])

    // Handlers: Menu CRUD
    const createMenuItem = (mi: Omit<MenuItem, 'id'>) => setMenuItems(ms => [...ms, { ...mi, id: uid() }])
    const updateMenuItem = (mi: MenuItem) => setMenuItems(ms => ms.map(m => (m.id === mi.id ? mi : m)))
    const deleteMenuItem = (id: string) => setMenuItems(ms => ms.filter(m => m.id !== id))

    // Handlers: Orders & Tables
    const createOrder = (order: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
        const newOrder: Order = { ...order, id: uid(), createdAt: new Date().toISOString(), status: 'in_progress' }
        setOrders(os => [newOrder, ...os])
        setTables(ts => ts.map(t => (t.id === order.tableId ? { ...t, status: 'occupied' } : t)))
    }

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(os => os.map(o => (o.id === orderId ? { ...o, status } : o)))
        if (status === 'paid') {
            const order = orders.find(o => o.id === orderId)
            if (order) setTables(ts => ts.map(t => (t.id === order.tableId ? { ...t, status: 'needs_cleaning' } : t)))
        }
    }

    const markTableClean = (tableId: string) => setTables(ts => ts.map(t => (t.id === tableId ? { ...t, status: 'available' } : t)))

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <Header tab={tab} setTab={setTab} />
            <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
                {tab === 'dashboard' && (
                    <Dashboard orders={orders} menuItems={menuItems} menuIndex={menuIndex} />
                )}
                {tab === 'menu' && (
                    <MenuManager
                        menuItems={menuItems}
                        onCreate={createMenuItem}
                        onUpdate={updateMenuItem}
                        onDelete={deleteMenuItem}
                    />
                )}
                {tab === 'tables' && (
                    <TableManager
                        tables={tables}
                        orders={orders}
                        menuItems={menuItems}
                        menuIndex={menuIndex}
                        onCreateOrder={createOrder}
                        onUpdateOrderStatus={updateOrderStatus}
                        onMarkTableClean={markTableClean}
                    />
                )}
            </main>
        </div>
    )
}



