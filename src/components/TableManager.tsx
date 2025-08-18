// -------------------------- Table & Order Manager --------------------------
import type { MenuItem, Order, OrderItem, Table } from "../model/Types.ts";
import { useState } from "react";
import { computeOrderTotal, currency } from "../model/Utils.ts";
import { useTranslation } from "react-i18next";

const TableManager = ({
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
}) => {
    const { t } = useTranslation();
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

    const filterOptions: { key: 'all' | 'available' | 'occupied' | 'needs_cleaning', label: string }[] = [
        { key: 'all', label: t('All Tables') },
        { key: 'available', label: t('Available') },
        { key: 'occupied', label: t('Occupied') },
        { key: 'needs_cleaning', label: t('Needs Cleaning') },
    ];

    const orderStatusKeys = [
        { key: 'in_progress', label: t('In Progress') },
        { key: 'served', label: t('Served') },
        { key: 'paid', label: t('Paid') },
    ];

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tables Panel */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{t("Tables")}</h3>
                        <div className="flex gap-2">
                            {filterOptions.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setFilter(f.key)}
                                    className={`px-3 py-1 rounded-lg text-sm ${filter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {visibleTables.map(tl => (
                            <div key={tl.id} className="bg-white rounded-2xl shadow-sm border p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold">{tl.name}</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${tl.status === 'available' ? 'bg-emerald-100 text-emerald-700' : tl.status === 'occupied' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                        }`}>{t(tl.status.replace('_', ' '))}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelectedTable(tl.id)} className={`flex-1 px-3 py-2 rounded-xl ${selectedTable === tl.id ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>{t("Select")}</button>
                                    {tl.status === 'needs_cleaning' && (
                                        <button onClick={() => onMarkTableClean(tl.id)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">{t("Mark Clean")}</button>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500">{t("Orders")}: {tableOrders(tl.id).length}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Composer */}
                <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
                    <h3 className="font-semibold">{t("New Order")}</h3>
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">{t("Table")}</label>
                        <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} className="w-full rounded-xl border px-3 py-2">
                            <option value="">{t("Select a table")}</option>
                            {tables.map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">{t("Add Items")}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {menuItems.map(mi => (
                                <button key={mi.id} onClick={() => addComposerItem(mi.id)} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-left">
                                    <div className="font-medium text-sm">{mi.name}</div>
                                    <div className="text-xs text-slate-500">{currency(mi.price)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500">{t("Items")}</label>
                        {composerItems.length === 0 && <div className="text-sm text-slate-500">{t("No items yet.")}</div>}
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
                                                    onChange={e => setComposerItems(items => items.map((x, i) => i === idx ? { ...x, modifierName: e.target.value || undefined } : x))}
                                                    className="text-xs rounded-lg border px-2 py-1 mt-1"
                                                >
                                                    <option value="">{t("No modifier")}</option>
                                                    {mi.modifiers.map(m => (
                                                        <option key={m.name} value={m.name}>{m.name} {m.priceDelta >= 0 ? '+' : ''}{currency(m.priceDelta)}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="text-xs text-slate-500">{t("No modifiers")}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => dec(idx)} className="h-8 w-8 rounded-lg bg-slate-100">-</button>
                                            <div className="w-6 text-center">{it.qty}</div>
                                            <button onClick={() => inc(idx)} className="h-8 w-8 rounded-lg bg-slate-100">+</button>
                                        </div>
                                        <div className="text-sm font-semibold">
                                            {(() => {
                                                const mod = it.modifierName ? mi?.modifiers.find(m => m.name === it.modifierName) : undefined
                                                const price = (mi?.price ?? 0) + (mod?.priceDelta ?? 0)
                                                return currency(price * it.qty)
                                            })()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <button onClick={create} className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">{t("Create Order")}</button>
                </div>
            </div>

            {/* Order Board */}
            <div className="bg-white rounded-2xl shadow-sm border p-4">
                <h3 className="font-semibold mb-3">{t("Orders Board")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {orderStatusKeys.map(col => (
                        <div key={col.key} className="rounded-xl border bg-slate-50">
                            <div className="px-3 py-2 font-medium border-b bg-white rounded-t-xl">{col.label}</div>
                            <div className="p-3 space-y-3">
                                {orders.filter(o => o.status === col.key).map(o => (
                                    <div key={o.id} className="bg-white rounded-xl border p-3 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="font-semibold">#{o.id.slice(0, 6)} • {o.tableId}</div>
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
                                                {col.key === 'in_progress' && (
                                                    <button onClick={() => onUpdateOrderStatus(o.id, 'served')} className="px-3 py-1 rounded-lg bg-amber-500 text-white">{t("Mark Served")}</button>
                                                )}
                                                {col.key !== 'paid' && (
                                                    <button onClick={() => onUpdateOrderStatus(o.id, 'paid')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white">{t("Mark Paid")}</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {orders.filter(o => o.status === col.key).length === 0 && (
                                    <div className="text-sm text-slate-500">{t("No orders.")}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
export default TableManager;