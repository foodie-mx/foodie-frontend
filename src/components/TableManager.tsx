// -------------------------- Table & Order Manager --------------------------
import type { MenuItem, Order, Table, TableStatusFilter } from "../model/Types.ts";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import OrderBoard from "./OrderBoard.tsx";
import TablesPanel from "./TablesPanel.tsx";
import OrderComposer from "./OrderComposer.tsx";

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
    const [filter, setFilter] = useState<TableStatusFilter>('all')

    const tableOrders = (tableId: string) => orders.filter(o => o.tableId === tableId)

    const tableStatusOptions: { key: TableStatusFilter, label: string }[] = [
        { key: 'all', label: t('All Tables') },
        { key: 'available', label: t('Available') },
        { key: 'occupied', label: t('Occupied') },
        { key: 'needs_cleaning', label: t('Needs Cleaning') },
    ];

    return (
        <section className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tables Panel */}
                <TablesPanel
                    tables={tables}
                    filter={filter}
                    setFilter={setFilter}
                    selectedTable={selectedTable}
                    setSelectedTable={setSelectedTable}
                    onMarkTableClean={onMarkTableClean}
                    tableOrders={tableOrders}
                    tableStatusOptions={tableStatusOptions}
                />

                {/* Composer */}
                <OrderComposer
                    tables={tables}
                    menuItems={menuItems}
                    menuIndex={menuIndex}
                    onCreateOrder={onCreateOrder}
                />

            </div>

            {/* Order Board */}
            <OrderBoard
                orders={orders}
                menuIndex={menuIndex}
                onUpdateOrderStatus={onUpdateOrderStatus}
            />
        </section>
    )
}
export default TableManager;