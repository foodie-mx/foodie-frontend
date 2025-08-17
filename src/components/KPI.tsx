export default function KPI({ title, value, subtitle, color }: { title: string; value: string; subtitle: string; color: 'indigo'|'emerald'|'amber' }) {
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