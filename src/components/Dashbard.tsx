// -------------------------- Dashboard --------------------------
import type { MenuItem, Order } from "../model/Types.ts";
import { useMemo } from "react";
import { computeOrderTotal, currency, isSameDay, withinLastNDays } from "../model/Utils.ts";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import KPI from "./KPI.tsx";
import { useTranslation } from "react-i18next";

export default function Dashboard({
    orders,
    menuIndex,
}: {
    orders: Order[]
    menuItems: MenuItem[]
    menuIndex: Record<string, MenuItem>
}) {
    const { t } = useTranslation();
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
                <KPI title={t("Today")} value={currency(daySum)} subtitle={t("Sales")} color="indigo" />
                <KPI title={t("Last 7 days")} value={currency(weekSum)} subtitle={t("Sales")} color="emerald" />
                <KPI title={t("Last 30 days")} value={currency(monthSum)} subtitle={t("Sales")} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-4">
                    <h3 className="font-semibold mb-3">{t("Sales Trend (last 14 days)")}</h3>
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
                    <h3 className="font-semibold mb-3">{t("Top Sellers")}</h3>
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
                <h3 className="font-semibold mb-3">{t("Active Orders")}</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500">
                                <th className="py-2">{t("Order")}</th>
                                <th>{t("Table")}</th>
                                <th>{t("Items")}</th>
                                <th>{t("Total")}</th>
                                <th>{t("Created")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-500">{t("No active orders.")}</td>
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