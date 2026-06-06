import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

// Theme Helpers
import { 
  getCategoryMeta, 
  formatCurrency 
} from '../utils/themeHelpers'

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/95 text-white border border-slate-800 p-2.5 rounded-xl text-[10px] font-bold shadow-md">
        <p className="text-slate-400">Day {label}</p>
        <p className="text-[#ff7ee2] text-xs mt-0.5">{formatCurrency(payload[0].value * 100)}</p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage({ transactions }) {
  const [spendingTimeframe, setSpendingTimeframe] = useState('month')

  // 1. Filter expense transactions
  const expenseItems = useMemo(() => {
    return transactions.filter((item) => item.type === 'expense')
  }, [transactions])

  const totalExpenseCents = useMemo(() => {
    return expenseItems.reduce((sum, item) => sum + item.amountCents, 0)
  }, [expenseItems])

  const totalIncomeCents = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0)
  }, [transactions])

  const netBalanceCents = totalIncomeCents - totalExpenseCents

  // Determine if we should use mock data for visual preview
  const isDemoMode = expenseItems.length === 0

  // 2. Card 1: Available Balance
  const displayBalance = isDemoMode ? 1282310 : netBalanceCents

  // 3. Card 2: Total Spending & Donut Chart
  const displaySpending = isDemoMode ? 629400 : totalExpenseCents

  const donutData = useMemo(() => {
    if (isDemoMode) {
      return [
        { name: 'Food', value: 3459, color: '#ff7ee2', percent: 55 },
        { name: 'Travel', value: 1482, color: '#d97706', percent: 24 },
        { name: 'Electronics', value: 804, color: '#3b82f6', percent: 13 },
        { name: 'Other', value: 549, color: '#64748b', percent: 8 }
      ]
    }

    // Build real category data
    const grouped = expenseItems.reduce((acc, item) => {
      const key = item.category.trim() || 'Other'
      if (!acc[key]) acc[key] = 0
      acc[key] += item.amountCents
      return acc
    }, {})

    const total = Object.values(grouped).reduce((a, b) => a + b, 0)

    return Object.entries(grouped)
      .map(([name, valCents]) => {
        const meta = getCategoryMeta(name)
        return {
          name,
          value: valCents / 100,
          color: meta.color,
          percent: total > 0 ? Math.round((valCents / total) * 100) : 0
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [isDemoMode, expenseItems])

  // Center percentage calculation (representing primary spending category)
  const donutCenterPercent = useMemo(() => {
    if (donutData.length === 0) return '0%'
    return `${donutData[0].percent}%`
  }, [donutData])

  // 4. Card 3: Highest Spent
  const highestSpent = useMemo(() => {
    if (isDemoMode) {
      return { title: 'Sushi Stop', amount: 125000 }
    }
    if (expenseItems.length === 0) {
      return { title: 'No logs', amount: 0 }
    }
    const sorted = [...expenseItems].sort((a, b) => b.amountCents - a.amountCents)
    return { title: sorted[0].title, amount: sorted[0].amountCents }
  }, [isDemoMode, expenseItems])

  // 5. Spending Over Time Chart Data (01 to 13 days pink bar graph)
  const barChartData = useMemo(() => {
    const daysInTrend = 13
    const data = Array.from({ length: daysInTrend }, (_, i) => {
      const dayNum = i + 1
      return {
        name: dayNum < 10 ? `0${dayNum}` : `${dayNum}`,
        amount: 0
      }
    })

    if (!isDemoMode) {
      // Populate real data
      expenseItems.forEach((item) => {
        const d = new Date(item.createdAt)
        const day = d.getDate()
        if (day >= 1 && day <= daysInTrend) {
          data[day - 1].amount += item.amountCents / 100
        }
      })
    } else {
      // Replicate layout vertical pink bars
      const mockValues = [1200, 1500, 800, 1800, 1100, 600, 1400, 950, 1600, 1300, 700, 1100, 1250]
      for (let i = 0; i < daysInTrend; i++) {
        data[i].amount = mockValues[i]
      }
    }
    return data
  }, [isDemoMode, expenseItems])

  return (
    <div className="flex flex-col h-full w-full space-y-6 animate-rise">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center pb-5 border-b border-slate-200/50 dark:border-slate-800/40">
        <div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Analytics Dashboard</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Spending & Ratios
          </h1>
        </div>
        {isDemoMode && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff7ee2]/10 text-[#ff7ee2] text-[9px] font-black uppercase tracking-wider">
            ✨ Preview Mode
          </span>
        )}
      </div>

      {/* TOP ROW: 3 Cards (Available Balance, Total Spending, Highest Spent) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Available Balance */}
        <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Balance</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
              {formatCurrency(displayBalance)}
            </h2>
          </div>
          
          <button 
            onClick={() => alert("Details regarding linked wallets are local to this machine.")}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200/30 dark:border-slate-800/60 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
          >
            Details
          </button>
        </article>

        {/* CARD 2: Total Spending + Legend + Donut */}
        <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left grid grid-cols-1 sm:grid-cols-12 gap-4 sm:h-40 items-center">
          {/* Left Text */}
          <div className="sm:col-span-7 flex flex-col justify-between sm:h-full py-1">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spending</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {formatCurrency(displaySpending)}
              </h2>
            </div>
            <span className="text-[9px] font-extrabold text-[#ff7ee2] mt-1 block">
              ~ 12.5% From ₹5,820
            </span>
          </div>

          {/* Right Donut chart */}
          <div className="sm:col-span-5 h-24 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={38}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-slate-800 dark:text-white">
                {donutCenterPercent}
              </span>
            </div>
          </div>
        </article>

        {/* CARD 3: Highest Spent */}
        <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm text-left flex flex-col justify-between h-40">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Spent</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
              {formatCurrency(highestSpent.amount)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 text-sm">
              🍣
            </span>
            <div>
              <p className="font-extrabold text-[11px] text-slate-800 dark:text-white leading-tight">
                {highestSpent.title}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Top Expense Entry
              </p>
            </div>
          </div>
        </article>

      </div>

      {/* BOTTOM SECTION: Spending Over Time chart & Categories list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Spending Over Time pink bar chart (8 cols) */}
        <article className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-5 text-left">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider">Spending Over Time</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Daily expense intervals comparison</p>
            </div>

            {/* Timeframe switch pills */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-205/30">
              {['Month', 'Year', 'Week', 'Today'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSpendingTimeframe(tf.toLowerCase())}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    spendingTimeframe === tf.toLowerCase()
                      ? 'bg-[#1c1c1e] text-white dark:bg-white dark:text-[#1c1c1e] shadow-sm'
                      : 'text-slate-400 hover:text-slate-650'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Pink Bar Chart */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#ff7ee2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Donut Legend Categories Details List (4 cols) */}
        <article className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-5 text-left">
          <div>
            <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-wider">Spending by Category</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Top ratios in your budget limits</p>
          </div>

          <div className="space-y-3 pt-1">
            {donutData.map((item) => (
              <div 
                key={item.name}
                className="flex justify-between items-center p-3 rounded-2xl border border-slate-50 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/20"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(item.value * 100)}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                    {item.percent}% Ratio
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

      </div>

    </div>
  )
}
