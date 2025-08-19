import { useTranslation } from "react-i18next";

// -------------------------- Header --------------------------
export default function Header({ tab, setTab }: { tab: 'dashboard' | 'menu' | 'tables'; setTab: (t: 'dashboard' | 'menu' | 'tables') => void }) {
    const { t } = useTranslation();

    const tabs: { id: 'dashboard' | 'menu' | 'tables'; label: string }[] = [
        { id: 'dashboard', label: t('Dashboard') },
        { id: 'menu', label: t('Menu Manager') },
        { id: 'tables', label: t('Table Manager') },
    ];

    return (
        <header className="bg-white/80 backdrop-blur sticky top-0 z-10 border-b">
            <div className="mx-auto max-w-7xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white grid place-items-center font-bold">Fd</div>
                    <h1 className="text-xl sm:text-2xl font-semibold">Foodie MX</h1>
                </div>
                <nav className="flex gap-2">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${tab === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'
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