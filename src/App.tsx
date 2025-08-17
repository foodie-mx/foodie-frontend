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
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
} from 'recharts'
import type {MenuItem, Order, OrderItem, Table} from "./model/Types.ts";
import {computeOrderTotal, currency, isSameDay, uid, withinLastNDays} from "./model/Utils.ts";
import {seedMenu, seedOrders, seedTables} from "./model/SeedData.ts";
import {loadState, saveState} from "./model/Storage.ts";

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

// -------------------------- Header --------------------------
function Header({ tab, setTab }: { tab: 'dashboard' | 'menu' | 'tables'; setTab: (t: any) => void }) {
    return (
        <header className="bg-white/80 backdrop-blur sticky top-0 z-10 border-b">
            <div className="mx-auto max-w-7xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">Fd</div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Foodie MX</h1>
                </div>
                <nav className="flex gap-2">
                    {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'menu', label: 'Menu' },
                        { id: 'tables', label: 'Tables & Orders' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                                tab === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    )
}

// -------------------------- Dashboard --------------------------
function Dashboard({
                       orders,
                       menuIndex,
                   }: {
    orders: Order[]
    menuItems: MenuItem[]
    menuIndex: Record<string, MenuItem>
}) {
    const now = new Date()
    const daySum = useMemo(() =>
        orders
            .filter(o => (o.status === 'paid' || o.status === 'served') && isSameDay(new Date(o.createdAt), now))
            .reduce((s, o) => s + computeOrderTotal(o, menuIndex), 0), [orders, menuIndex])

    const weekSum = useMemo(() =>
        orders
            .filter(o => (o.status === 'paid' || o.status === 'served') && withinLastNDays(o.createdAt, 7))
            .reduce((s, o) => s + computeOrderTotal(o, menuIndex), 0), [orders, menuIndex])

    const monthSum = useMemo(() =>
        orders
            .filter(o => (o.status === 'paid' || o.status === 'served') && withinLastNDays(o.createdAt, 30))
            .reduce((s, o) => s + computeOrderTotal(o, menuIndex), 0), [orders, menuIndex])

    const activeOrders = useMemo(() => orders.filter(o => o.status === 'in_progress'), [orders])

    const topSellers = useMemo(() => {
        const map = new Map<string, number>()
        orders.forEach(o => {
            o.items.forEach(it => {
                map.set(it.menuItemId, (map.get(it.menuItemId) ?? 0) + it.qty)
            })
        })
        const rows = Array.from(map.entries())
            .map(([id, qty]) => ({ name: menuIndex[id]?.name ?? id, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 7)
        return rows
    }, [orders, menuIndex])

    const last14Days = useMemo(() => {
        const days = [...Array(14)].map((_, idx) => {
            const d = new Date(now.getTime() - (13 - idx) * 86400000)
            const label = `${d.getMonth() + 1}/${d.getDate()}`
            const total = orders
                .filter(o => (o.status === 'paid' || o.status === 'served') && isSameDay(new Date(o.createdAt), d))
                .reduce((s, o) => s + computeOrderTotal(o, menuIndex), 0)
            return { day: label, total: Number(total.toFixed(2)) }
        })
        return days
    }, [orders, menuIndex])

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI title="Today" value={currency(daySum)} subtitle="Sales" color="indigo" />
                <KPI title="Last 7 days" value={currency(weekSum)} subtitle="Sales" color="emerald" />
                <KPI title="Last 30 days" value={currency(monthSum)} subtitle="Sales" color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-3">Sales Trend (last 14 days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={last14Days} margin={{ left: -10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-3">Top Sellers</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSellers} margin={{ left: -10, right: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="qty" fill="#22c55e" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">Active Orders</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="text-left text-slate-500">
                            <th className="py-2">Order</th>
                            <th>Table</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Created</th>
                        </tr>
                        </thead>
                        <tbody>
                        {activeOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-500">No active orders.</td>
                            </tr>
                        )}
                        {activeOrders.map(o => (
                            <tr key={o.id} className="border-t">
                                <td className="py-2 font-medium">#{o.id.slice(0, 6)}</td>
                                <td>{o.tableId}</td>
                                <td>
                                    {o.items.map((it, idx) => {
                                        const mi = menuIndex[it.menuItemId]
                                        return (
                                            <span key={idx} className="inline-block mr-2">
                          {it.qty}× {mi?.name}
                                                {it.modifierName ? ` (${it.modifierName})` : ''}
                        </span>
                                        )
                                    })}
                                </td>
                                <td className="font-semibold">{currency(computeOrderTotal(o, menuIndex))}</td>
                                <td>{new Date(o.createdAt).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}

function KPI({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: 'indigo'|'emerald'|'amber' }) {
    const colors: Record<string, string> = {
        indigo: 'from-indigo-500 to-indigo-600',
        emerald: 'from-emerald-500 to-emerald-600',
        amber: 'from-amber-500 to-amber-600',
    }
    return (
        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center justify-between">
            <div>
                <div className="text-slate-500 text-sm">{title}</div>
                <div className="text-2xl font-semibold">{value}</div>
                <div className="text-slate-500 text-xs">{subtitle}</div>
            </div>
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors[color]} text-white grid place-items-center font-semibold`}>$</div>
        </div>
    )
}

// -------------------------- Menu Manager --------------------------
function MenuManager({
                         menuItems,
                         onCreate,
                         onUpdate,
                         onDelete,
                     }: {
    menuItems: MenuItem[]
    onCreate: (mi: Omit<MenuItem, 'id'>) => void
    onUpdate: (mi: MenuItem) => void
    onDelete: (id: string) => void
}) {
    const [query, setQuery] = useState('')
    const [editing, setEditing] = useState<MenuItem | null>(null)
    const [draft, setDraft] = useState<Omit<MenuItem, 'id'>>({ name: '', category: '', price: 0, modifiers: [] })

    const filtered = menuItems.filter(m =>
        [m.name, m.category].join(' ').toLowerCase().includes(query.toLowerCase())
    )

    const startCreate = () => {
        setEditing(null)
        setDraft({ name: '', category: '', price: 0, modifiers: [] })
    }

    const startEdit = (m: MenuItem) => {
        setEditing(m)
        setDraft({ name: m.name, category: m.category, price: m.price, modifiers: m.modifiers })
    }

    const submit = () => {
        if (!draft.name.trim()) return
        if (editing) {
            onUpdate({ ...editing, ...draft })
        } else {
            onCreate(draft)
        }
        setEditing(null)
        setDraft({ name: '', category: '', price: 0, modifiers: [] })
    }

    const removeModifier = (idx: number) => {
        setDraft(d => ({ ...d, modifiers: d.modifiers.filter((_, i) => i !== idx) }))
    }

    return (
        <section className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search menu..."
                        className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button onClick={startCreate} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">Add Item</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                        <tr className="text-left text-slate-500">
                            <th className="py-2">Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Modifiers</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(m => (
                            <tr key={m.id} className="border-t">
                                <td className="py-2 font-medium">{m.name}</td>
                                <td>{m.category}</td>
                                <td>{currency(m.price)}</td>
                                <td>{m.modifiers.map(mod => mod.name).join(', ') || '—'}</td>
                                <td className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => startEdit(m)} className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200">Edit</button>
                                        <button onClick={() => onDelete(m.id)} className="px-3 py-1 rounded-lg bg-rose-600 text-white">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-3">{editing ? 'Edit Item' : 'New Item'}</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-500">Name</label>
                            <input
                                value={draft.name}
                                onChange={e => setDraft({ ...draft, name: e.target.value })}
                                className="w-full rounded-xl border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Category</label>
                            <input
                                value={draft.category}
                                onChange={e => setDraft({ ...draft, category: e.target.value })}
                                className="w-full rounded-xl border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Base Price</label>
                            <input
                                type="number"
                                step="0.01"
                                value={draft.price}
                                onChange={e => setDraft({ ...draft, price: Number(e.target.value) })}
                                className="w-full rounded-xl border px-3 py-2"
                            />
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">Modifiers</div>
                                <button
                                    onClick={() => setDraft(d => ({ ...d, modifiers: [...d.modifiers, { name: '', priceDelta: 0 }] }))}
                                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
                                >Add</button>
                            </div>
                            <div className="space-y-2">
                                {draft.modifiers.map((mod, idx) => (
                                    <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                                        <input
                                            value={mod.name}
                                            onChange={e => setDraft(d => {
                                                const ms = [...d.modifiers]
                                                ms[idx] = { ...ms[idx], name: e.target.value }
                                                return { ...d, modifiers: ms }
                                            })}
                                            placeholder="Name"
                                            className="col-span-3 rounded-lg border px-3 py-2"
                                        />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={mod.priceDelta}
                                            onChange={e => setDraft(d => {
                                                const ms = [...d.modifiers]
                                                ms[idx] = { ...ms[idx], priceDelta: Number(e.target.value) }
                                                return { ...d, modifiers: ms }
                                            })}
                                            placeholder="Δ Price"
                                            className="col-span-1 rounded-lg border px-3 py-2"
                                        />
                                        <button onClick={() => removeModifier(idx)} className="px-3 py-2 rounded-lg bg-rose-600 text-white">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">Save</button>
                            <button onClick={() => { setEditing(null); setDraft({ name: '', category: '', price: 0, modifiers: [] }) }} className="px-4 py-2 rounded-xl bg-slate-100">Clear</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// -------------------------- Table & Order Manager --------------------------
function TableManager({
                          tables,
                          orders,
                          menuItems,
                          menuIndex,
                          onCreateOrder,
                          onUpdateOrderStatus,
                          onMarkTableClean,
                      }: {
    tables: Table[]
    orders: Order[]
    menuItems: MenuItem[]
    menuIndex: Record<string, MenuItem>
    onCreateOrder: (o: Omit<Order, 'id' | 'createdAt' | 'status'>) => void
    onUpdateOrderStatus: (id: string, s: Order['status']) => void
    onMarkTableClean: (tableId: string) => void
}) {
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [composerItems, setComposerItems] = useState<OrderItem[]>([])
    const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'needs_cleaning'>('all')

    const visibleTables = tables.filter(t => (filter === 'all' ? true : t.status === filter))

    const tableOrders = (tableId: string) => orders.filter(o => o.tableId === tableId)

    const addComposerItem = (menuItemId: string) => setComposerItems(items => {
        const existingIdx = items.findIndex(i => i.menuItemId === menuItemId && !i.modifierName)
        if (existingIdx !== -1) {
            const copy = [...items]
            copy[existingIdx] = { ...copy[existingIdx], qty: copy[existingIdx].qty + 1 }
            return copy
        }
        return [...items, { menuItemId, qty: 1 }]
    })

    const create = () => {
        if (!selectedTable || composerItems.length === 0) return
        onCreateOrder({ tableId: selectedTable, items: composerItems })
        setComposerItems([])
    }

    const inc = (idx: number) => setComposerItems(is => is.map((it, i) => (i === idx ? { ...it, qty: it.qty + 1 } : it)))
    const dec = (idx: number) => setComposerItems(is => is.flatMap((it, i) => (i === idx ? (it.qty > 1 ? [{ ...it, qty: it.qty - 1 }] : []) : [it])))

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tables Panel */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Tables</h3>
                        <div className="flex gap-2">
                            {(['all','available','occupied','needs_cleaning'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-sm ${filter===f? 'bg-slate-900 text-white':'bg-slate-100'}`}>{f.replace('_',' ')}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {visibleTables.map(t => (
                            <div key={t.id} className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold">{t.name}</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        t.status==='available' ? 'bg-emerald-100 text-emerald-700' : t.status==='occupied' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>{t.status.replace('_',' ')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedTable(t.id)} className={`flex-1 px-3 py-2 rounded-xl ${selectedTable===t.id? 'bg-indigo-600 text-white':'bg-slate-100'}`}>Select</button>
                                    {t.status==='needs_cleaning' && (
                                        <button onClick={() => onMarkTableClean(t.id)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">Mark Clean</button>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">Orders: {tableOrders(t.id).length}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Composer */}
                <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
                    <h3 className="font-semibold">New Order</h3>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">Table</label>
                        <select value={selectedTable} onChange={e=>setSelectedTable(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                            <option value="">Select a table</option>
                            {tables.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">Add Items</label>
                        <div className="grid grid-cols-2 gap-2">
                            {menuItems.map(mi => (
                                <button key={mi.id} onClick={()=>addComposerItem(mi.id)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-left">
                                    <div className="font-medium text-sm">{mi.name}</div>
                                    <div className="text-xs text-slate-500">{currency(mi.price)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">Items</label>
                        {composerItems.length===0 && <div className="text-sm text-slate-500">No items yet.</div>}
                        <div className="space-y-2">
                            {composerItems.map((it, idx) => {
                                const mi = menuIndex[it.menuItemId]
                                return (
                                    <div key={idx} className="border rounded-xl p-2 flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate">{mi?.name}</div>
                                            {mi?.modifiers?.length ? (
                                                <select
                                                    value={it.modifierName ?? ''}
                                                    onChange={e => setComposerItems(items => items.map((x, i) => i===idx ? { ...x, modifierName: e.target.value || undefined } : x))}
                                                    className="text-xs rounded-lg border px-2 py-1 mt-1"
                                                >
                                                    <option value="">No modifier</option>
                                                    {mi.modifiers.map(m => (
                                                        <option key={m.name} value={m.name}>{m.name} {m.priceDelta>=0?'+':''}{currency(m.priceDelta)}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="text-xs text-slate-500">No modifiers</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={()=>dec(idx)} className="h-8 w-8 rounded-lg bg-slate-100">-</button>
                                            <div className="w-6 text-center">{it.qty}</div>
                                            <button onClick={()=>inc(idx)} className="h-8 w-8 rounded-lg bg-slate-100">+</button>
                                        </div>
                                        <div className="text-sm font-semibold">
                                            {(() => {
                                                const mod = it.modifierName ? mi?.modifiers.find(m=>m.name===it.modifierName) : undefined
                                                const price = (mi?.price ?? 0) + (mod?.priceDelta ?? 0)
                                                return currency(price * it.qty)
                                            })()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <button onClick={create} className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">Create Order</button>
                </div>
            </div>

            {/* Order Board */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">Orders Board</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['in_progress','served','paid'] as const).map(col => (
                        <div key={col} className="rounded-xl border bg-slate-50">
                            <div className="px-3 py-2 font-medium border-b bg-white rounded-t-xl">{col.replace('_',' ')}</div>
                            <div className="p-3 space-y-3">
                                {orders.filter(o => o.status===col).map(o => (
                                    <div key={o.id} className="bg-white rounded-xl border p-3 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="font-semibold">#{o.id.slice(0,6)} • {o.tableId}</div>
                                            <div className="text-slate-500">{new Date(o.createdAt).toLocaleTimeString()}</div>
                                        </div>
                                        <ul className="text-sm list-disc pl-5">
                                            {o.items.map((it, idx) => {
                                                const mi = menuIndex[it.menuItemId]
                                                return (
                                                    <li key={idx}>{it.qty}× {mi?.name}{it.modifierName ? ` (${it.modifierName})` : ''}</li>
                                                )
                                            })}
                                        </ul>
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">{currency(computeOrderTotal(o, menuIndex))}</div>
                                            <div className="flex gap-2">
                                                {col==='in_progress' && (
                                                    <button onClick={() => onUpdateOrderStatus(o.id, 'served')} className="px-3 py-1 rounded-lg bg-amber-500 text-white">Mark Served</button>
                                                )}
                                                {col!=='paid' && (
                                                    <button onClick={() => onUpdateOrderStatus(o.id, 'paid')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white">Mark Paid</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {orders.filter(o=>o.status===col).length===0 && (
                                    <div className="text-sm text-slate-500">No orders.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
