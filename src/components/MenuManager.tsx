// -------------------------- Menu Manager --------------------------
import type { MenuItem } from "../model/Types.ts";
import { useState } from "react";
import { currency } from "../model/Utils.ts";
import { useTranslation } from "react-i18next";

export default function MenuManager({
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
    const { t } = useTranslation();
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
                        placeholder={t("Search menu...")}
                        className="w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button onClick={startCreate} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">{t("Add Item")}</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2">{t("Name")}</th>
                                <th>{t("Category")}</th>
                                <th>{t("Price")}</th>
                                <th>{t("Modifiers")}</th>
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
                                            <button onClick={() => startEdit(m)} className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200">{t("Edit")}</button>
                                            <button onClick={() => onDelete(m.id)} className="px-3 py-1 rounded-lg bg-rose-600 text-white">{t("Delete")}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-3">{editing ? t('Edit Item') : t('New Item')}</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-slate-500">{t("Name")}</label>
                            <input
                                value={draft.name}
                                onChange={e => setDraft({ ...draft, name: e.target.value })}
                                className="w-full rounded-xl border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">{t("Category")}</label>
                            <input
                                value={draft.category}
                                onChange={e => setDraft({ ...draft, category: e.target.value })}
                                className="w-full rounded-xl border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">{t("Base Price")}</label>
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
                                <div className="font-medium">{t("Modifiers")}</div>
                                <button
                                    onClick={() => setDraft(d => ({ ...d, modifiers: [...d.modifiers, { name: '', priceDelta: 0 }] }))}
                                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
                                >{t("Add")}</button>
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
                                            placeholder={t("Name")}
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
                                            placeholder={t("Δ Price")}
                                            className="col-span-1 rounded-lg border px-3 py-2"
                                        />
                                        <button onClick={() => removeModifier(idx)} className="px-3 py-2 rounded-lg bg-rose-600 text-white">X</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium">{t("Save")}</button>
                            <button onClick={() => { setEditing(null); setDraft({ name: '', category: '', price: 0, modifiers: [] }) }} className="px-4 py-2 rounded-xl bg-slate-100">{t("Clear")}</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}