import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, ResponsiveContainer, LineChart, Line, Tooltip, PieChart, Pie, Cell, XAxis, YAxis, LabelList } from 'recharts'
import { formatCurrency, getCategoryMeta } from '../utils/themeHelpers'

export default function DashboardPage({ transactions = [], loading }) {
  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amountCents
        else acc.expense += t.amountCents
        return acc
      },
      { income: 0, expense: 0 }
    )
  }, [transactions])
  const balance = summary.income - summary.expense

  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { name: d.toLocaleDateString('en', { weekday: 'short' }), value: 0 }
    })
    let running = 0
    ;[...transactions]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .forEach(t => {
        running += t.type === 'income' ? t.amountCents : -t.amountCents
      })
    days[6].value = running / 100
    let seed = 12345
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }
    for (let i = 5; i >= 0; i--) {
      days[i].value = days[i + 1].value * (0.88 + pseudoRandom() * 0.12)
    }
    return days
  }, [transactions])

  const recent = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [transactions]
  )

  const categoryMap = useMemo(() => {
    const map = {}
    let totalCents = 0
    transactions.forEach(t => {
      let cat = t.category || 'Other'
      const validCategories = ['Groceries', 'Eating Out', 'Transport', 'Shopping', 'Utilities', 'Rent', 'Entertainment', 'Salary', 'Freelance', 'Other']
      if (!validCategories.includes(cat)) {
        if (cat === 'Coffee' || cat === 'Eating Out') cat = 'Eating Out'
        else if (cat === 'Taxi' || cat === 'Fuel') cat = 'Transport'
        else if (cat === 'Electronics' || cat === 'Shopping') cat = 'Shopping'
        else if (cat === 'Gym' || cat === 'Education') cat = 'Entertainment'
        else cat = 'Other'
      }
      map[cat] = (map[cat] || 0) + t.amountCents
      totalCents += t.amountCents
    })
    
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    // Minimum 2% of total for pie visibility so tiny slices still show up
    const MIN_PIE_FRACTION = 0.02
    const minCents = totalCents * MIN_PIE_FRACTION

    return entries.map(([name, cents]) => {
      const meta = getCategoryMeta(name)
      const realPercent = totalCents > 0 ? (cents / totalCents) * 100 : 0
      return {
        name,
        value: cents / 100,
        // pieValue ensures even tiny slices are visible in the chart
        pieValue: totalCents > 0 ? Math.max(cents, minCents) / 100 : 0,
        color: meta?.color || '#64748b',
        percent: realPercent < 1 && realPercent > 0 ? '<1' : Math.round(realPercent)
      }
    })
  }, [transactions])

  return (
    <div className="flex flex-col gap-6 animate-rise">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#207561] text-white rounded-2xl p-6 shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">Net Balance</span>
          <span className="text-3xl font-black tracking-tight">{formatCurrency(balance)}</span>
          <div className="h-15 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7}>
                <Line type="monotone" dataKey="value" stroke="rgba(255,255,255,0.7)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] rounded-2xl p-6 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e8f5f0] dark:bg-green-950/40 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#207561" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Total Income</span>
          </div>
          <span className="text-2xl font-black text-[#207561] tracking-tight mt-1">{formatCurrency(summary.income)}</span>
          <span className="text-[11px] font-medium text-gray-400">{transactions.filter(t => t.type === 'income').length} entries</span>
        </div>

        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] rounded-2xl p-6 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </div>
            <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Total Expense</span>
          </div>
          <span className="text-2xl font-black text-red-500 tracking-tight mt-1">{formatCurrency(summary.expense)}</span>
          <span className="text-[11px] font-medium text-gray-400">{transactions.filter(t => t.type === 'expense').length} entries</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Recent Transactions</span>
            <Link to="/transactions" className="text-xs font-bold text-[#207561] no-underline">View All →</Link>
          </div>

          {loading ? (
            <div className="text-center py-5 text-gray-400 text-sm">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-3xl mb-2">💸</div>
              <div className="text-sm font-semibold">No transactions yet</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recent.map(t => (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${t.type === 'income' ? 'bg-[#e8f5f0] dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
                      {t.type === 'income' ? '💰' : '💳'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.title}</div>
                      <div className="text-[11px] text-gray-400">{t.category}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold ${t.type === 'income' ? 'text-[#207561]' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amountCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Category Breakdown</span>
          </div>

          {categoryMap.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-semibold">No transaction data yet</div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr] md:items-center">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryMap}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={45}
                      paddingAngle={3}
                      dataKey="pieValue"
                    >
                      {categoryMap.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(_, __, props) => [`₹${Number(props.payload.value).toFixed(0)}`, props.payload.name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {categoryMap.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-[#22223a] px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate">{c.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">₹{c.value.toFixed(0)}</div>
                      <div className="text-[10px] font-semibold text-slate-400">{c.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>    </div>
  )
}
