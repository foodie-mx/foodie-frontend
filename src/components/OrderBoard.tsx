import type { Order, MenuItem } from "../model/Types";
import { computeOrderTotal, currency } from "../model/Utils";
import { useTranslation } from "react-i18next";

const OrderBoard = ({
    orders,
    menuIndex,
    onUpdateOrderStatus,
}: {
    orders: Order[]
    menuIndex: Record<string, MenuItem>
    onUpdateOrderStatus: (id: string, s: Order['status']) => void
}) => {
    const { t } = useTranslation();

    const orderStatusKeys = [
        { key: 'in_progress', label: t('In Progress') },
        { key: 'served', label: t('Served') },
        { key: 'paid', label: t('Paid') },
    ];

    return (
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
    );
};

export default OrderBoard;
