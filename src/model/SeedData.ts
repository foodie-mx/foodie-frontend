// -------------------------- Seed Data --------------------------
import {uid} from "./Utils.ts";
import type {MenuItem, Order, Table} from "./Types.ts";

export const seedMenu: MenuItem[] = [
    {
        id: 'mi_pizza',
        name: 'Margherita Pizza',
        category: 'Entrees',
        price: 12,
        modifiers: [
            { name: 'Extra Cheese', priceDelta: 2 },
            { name: 'Gluten-Free Crust', priceDelta: 3 },
        ],
    },
    {
        id: 'mi_burger',
        name: 'Classic Burger',
        category: 'Entrees',
        price: 11,
        modifiers: [
            { name: 'Bacon', priceDelta: 2.5 },
            { name: 'Cheddar', priceDelta: 1.5 },
        ],
    },
    {
        id: 'mi_salad',
        name: 'Caesar Salad',
        category: 'Salads',
        price: 9,
        modifiers: [
            { name: 'Grilled Chicken', priceDelta: 3 },
            { name: 'Anchovies', priceDelta: 1 },
        ],
    },
    {
        id: 'mi_coffee',
        name: 'Iced Coffee',
        category: 'Drinks',
        price: 4,
        modifiers: [
            { name: 'Oat Milk', priceDelta: 0.5 },
            { name: 'Vanilla Syrup', priceDelta: 0.5 },
        ],
    },
]

export const seedTables: Table[] = Array.from({ length: 10 }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Table ${i + 1}`,
    status: i < 2 ? 'occupied' : 'available',
}))

export const seedOrders = (now = new Date()): Order[] => {
    const iso = (d: Date) => d.toISOString()
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)
    return [
        {
            id: uid(),
            tableId: 't1',
            items: [
                { menuItemId: 'mi_pizza', qty: 2 },
                { menuItemId: 'mi_coffee', modifierName: 'Oat Milk', qty: 2 },
            ],
            status: 'in_progress',
            createdAt: iso(now),
        },
        {
            id: uid(),
            tableId: 't2',
            items: [
                { menuItemId: 'mi_burger', modifierName: 'Bacon', qty: 1 },
                { menuItemId: 'mi_salad', modifierName: 'Grilled Chicken', qty: 1 },
            ],
            status: 'served',
            createdAt: iso(now),
        },
        {
            id: uid(),
            tableId: 't3',
            items: [
                { menuItemId: 'mi_burger', qty: 1 },
                { menuItemId: 'mi_coffee', modifierName: 'Vanilla Syrup', qty: 1 },
            ],
            status: 'paid',
            createdAt: iso(daysAgo(1)),
        },
        {
            id: uid(),
            tableId: 't4',
            items: [
                { menuItemId: 'mi_salad', qty: 2 },
            ],
            status: 'paid',
            createdAt: iso(daysAgo(7)),
        },
    ]
}