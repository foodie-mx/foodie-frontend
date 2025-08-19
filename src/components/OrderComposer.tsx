import type { MenuItem, Order, OrderItem, Table } from "../model/Types.ts";
import { useState } from "react";
import { currency } from "../model/Utils.ts";
import { useTranslation } from "react-i18next";

const OrderComposer = ({
    tables,
    menuItems,
    menuIndex,
    onCreateOrder,
}: {
    tables: Table[]
    menuItems: MenuItem[]
    menuIndex: Record<string, MenuItem>
    onCreateOrder: (o: Omit<Order, 'id' | 'createdAt' | 'status'>) => void
}) => {
    const { t } = useTranslation();
    const [selectedTable, setSelectedTable] = useState<string>('')
    const [composerItems, setComposerItems] = useState<OrderItem[]>([])

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

    const inc = (idx: number) => setComposerItems(orderItems => orderItems.map((it, i) => (i === idx ? { ...it, qty: it.qty + 1 } : it)))
    const dec = (idx: number) => setComposerItems(orderItems => orderItems.flatMap((it, i) => (i === idx ? (it.qty > 1 ? [{ ...it, qty: it.qty - 1 }] : []) : [it])))

    return (
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
    )
}

export default OrderComposer;
