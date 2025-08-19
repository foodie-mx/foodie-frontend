import type { Table, Order, TableStatusFilter } from "../model/Types";
import { useTranslation } from "react-i18next";

const TablesPanel = ({
    tables,
    filter,
    setFilter,
    selectedTable,
    setSelectedTable,
    onMarkTableClean,
    tableOrders,
    tableStatusOptions,
}: {
    tables: Table[]
    filter: TableStatusFilter
    setFilter: (f: TableStatusFilter) => void
    selectedTable: string
    setSelectedTable: (id: string) => void
    onMarkTableClean: (tableId: string) => void
    tableOrders: (tableId: string) => Order[]
    tableStatusOptions: { key: TableStatusFilter, label: string }[]
}) => {
    const { t } = useTranslation();
    const visibleTables = tables.filter(tl => (filter === 'all' ? true : tl.status === filter));

    return (
        <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t("Tables")}</h3>
                <div className="flex gap-2">
                    {tableStatusOptions.map(f => (
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
                            <span className={`text-xs px-2 py-1 rounded-full ${tl.status === 'available' ? 'bg-emerald-100 text-emerald-700' : tl.status === 'occupied' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                {tableStatusOptions.find(opt => opt.key === tl.status)?.label}
                            </span>
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
    );
};

export default TablesPanel;
