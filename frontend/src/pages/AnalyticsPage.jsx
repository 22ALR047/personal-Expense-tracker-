import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

// Theme Helpers
import { 
  getCategoryMeta, 
  formatCurrency 
} from '../utils/themeHelpers'

const CATEGORY_EMOJIS = {
  // Database / Transactions Page categories
  'Groceries': '🛒',
  'Eating Out': '🍽️',
  'Taxi': '🚕',
  'Coffee': '☕',
  'Shopping': '🛍️',
  'Electronics': '📱',
  'Utilities': '💡',
  'Rent': '🏠',
  'Gym': '🏋️‍♂️',
  'Health': '❤️',
  'Education': '📚',
  'Fuel': '⛽',
  'Salary': '💼',
  'Freelance': '💻',
  'Other': '📌',
  
  // Theme Helper categories
  'Shop': '🛍️',
  'Electronic': '📱',
  'Transportation': '🚕',
  'Food': '🍽️',
  'Coffee': '☕',
  'Utilities': '💡',
  'Rent': '🏠',
  'Gym': '🏋️‍♂️',
  'Health': '❤️',
  'Education': '📚',
  'Fuel': '⛽',
  'Salary': '💼',
  'Freelance': '💻',
  'Other': '📌'
}

// Demo data for visual preview when user has 0 transactions
const DEMO_VALUES = {
  today: {
    balance: 1450000,
    spending: 65000,
    subtext: '~ 5.2% from daily average',
    donut: [
      { name: 'Food', value: 350, color: '#ff7ee2', percent: 54 },
      { name: 'Coffee', value: 150, color: '#b45309', percent: 23 },
      { name: 'Taxi', value: 150, color: '#d97706', percent: 23 }
    ],
    highest: { title: 'Lunch Meal', amount: 35000, category: 'Eating Out' }
  },
  week: {
    balance: 1342000,
    spending: 505000,
    subtext: '~ 8.5% weekly decrease',
    donut: [
      { name: 'Groceries', value: 2200, color: '#ff7ee2', percent: 44 },
      { name: 'Travel', value: 1200, color: '#d97706', percent: 24 },
      { name: 'Eating Out', value: 1100, color: '#f43f5e', percent: 22 },
      { name: 'Other', value: 550, color: '#64748b', percent: 10 }
    ],
    highest: { title: 'Weekly Groceries', amount: 220000, category: 'Groceries' }
  },
  month: {
    balance: 1282310,
    spending: 629400,
    subtext: '~ 12.5% From ₹5,820',
    donut: [
      { name: 'Food', value: 3459, color: '#ff7ee2', percent: 55 },
      { name: 'Travel', value: 1482, color: '#d97706', percent: 24 },
      { name: 'Electronics', value: 804, color: '#3b82f6', percent: 13 },
      { name: 'Other', value: 549, color: '#64748b', percent: 8 }
    ],
    highest: { title: 'Sushi Stop', amount: 125000, category: 'Eating Out' }
  },
  year: {
    balance: 4500000,
    spending: 12470000,
    subtext: '~ 18.2% within annual target',
    donut: [
      { name: 'Rent', value: 60000, color: '#6366f1', percent: 48 },
      { name: 'Food', value: 32000, color: '#ff7ee2', percent: 26 },
      { name: 'Travel', value: 18000, color: '#d97706', percent: 14 },
      { name: 'Other', value: 14700, color: '#64748b', percent: 12 }
    ],
    highest: { title: 'Annual Rent Payment', amount: 5000000, category: 'Rent' }
  }
}

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label, timeframe }) => {
  if (active && payload && payload.length) {
    let titleStr = label
    if (timeframe === 'today') {
      titleStr = `Hour ${label}:00`
    } else if (timeframe === 'month') {
      titleStr = `Day ${label}`
    }
    return (
      <div className="bg-slate-900/90 dark:bg-slate-950/95 text-white border border-slate-800 p-2.5 rounded-xl text-[10px] font-bold shadow-md">
        <p className="text-slate-400">{titleStr}</p>
        <p className="text-[#ff7ee2] text-xs mt-0.5">{formatCurrency(payload[0].value * 100)}</p>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage({ transactions = [] }) {
  const [spendingTimeframe, setSpendingTimeframe] = useState('month')

  // Determine if we should use mock data for visual preview
  const isDemoMode = false

  // Filter transactions based on the selected timeframe
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter((item) => {
      const itemDate = new Date(item.createdAt)
      
      if (spendingTimeframe === 'today') {
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        )
      }
      
      if (spendingTimeframe === 'week') {
        // Last 7 days (today and 6 days prior)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(now.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)
        return itemDate >= sevenDaysAgo && itemDate <= now
      }
      
      if (spendingTimeframe === 'month') {
        // Current calendar month
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        )
      }
      
      if (spendingTimeframe === 'year') {
        // Current calendar year
        return itemDate.getFullYear() === now.getFullYear()
      }
      
      return true
    })
  }, [transactions, spendingTimeframe])

  // Filter expense transactions for the selected timeframe
  const expenseItems = useMemo(() => {
    return filteredTransactions.filter((item) => item.type === 'expense')
  }, [filteredTransactions])

  // Filter overall transactions for balance
  const overallIncomeCents = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0)
  }, [transactions])

  const overallExpenseCents = useMemo(() => {
    return transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amountCents, 0)
  }, [transactions])

  const netBalanceCents = overallIncomeCents - overallExpenseCents

  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
  }, [transactions])

  // Timeframe-specific total expense and income
  const totalExpenseCents = useMemo(() => {
    return expenseItems.reduce((sum, item) => sum + item.amountCents, 0)
  }, [expenseItems])

  const totalIncomeCents = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amountCents, 0)
  }, [filteredTransactions])

  // Load total budget limits from localStorage
  const totalBudget = useMemo(() => {
    try {
      const stored = localStorage.getItem('expense-tracker-budgets')
      if (stored) {
        const parsed = JSON.parse(stored)
        return Object.values(parsed).reduce((sum, b) => sum + (b.limit || 0), 0)
      }
    } catch (e) {
      console.error(e)
    }
    return 0
  }, [])

  // Card 1: Available Balance (Overall balance)
  const displayBalance = isDemoMode 
    ? DEMO_VALUES[spendingTimeframe].balance 
    : netBalanceCents

  // Card 2: Total Spending
  const displaySpending = isDemoMode 
    ? DEMO_VALUES[spendingTimeframe].spending 
    : totalExpenseCents

  // Card 2 Subtext: Dynamic Spending Comparison
  const spendingPercentageText = useMemo(() => {
    if (isDemoMode) {
      return DEMO_VALUES[spendingTimeframe].subtext
    }
    if (totalBudget > 0) {
      const pct = (totalExpenseCents / totalBudget) * 100
      return `${pct.toFixed(1)}% of ${formatCurrency(totalBudget)} budget`
    }
    if (totalIncomeCents > 0) {
      const pct = (totalExpenseCents / totalIncomeCents) * 100
      return `${pct.toFixed(1)}% of timeframe income`
    }
    return 'No budget limits set'
  }, [isDemoMode, spendingTimeframe, totalExpenseCents, totalBudget, totalIncomeCents])

  // Donut Chart Data
  const donutData = useMemo(() => {
    if (isDemoMode) {
      return DEMO_VALUES[spendingTimeframe].donut
    }

    // Build real category data
    const grouped = expenseItems.reduce((acc, item) => {
      let key = item.category.trim() || 'Other'
      const validCategories = ['Groceries', 'Eating Out', 'Transport', 'Shopping', 'Utilities', 'Rent', 'Entertainment', 'Salary', 'Freelance', 'Other']
      if (!validCategories.includes(key)) {
        if (key === 'Coffee' || key === 'Eating Out') key = 'Eating Out'
        else if (key === 'Taxi' || key === 'Fuel') key = 'Transport'
        else if (key === 'Electronics' || key === 'Shopping') key = 'Shopping'
        else if (key === 'Gym' || key === 'Education') key = 'Entertainment'
        else key = 'Other'
      }
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
  }, [isDemoMode, spendingTimeframe, expenseItems])

  // Center percentage calculation (representing primary spending category)
  const donutCenterPercent = useMemo(() => {
    if (donutData.length === 0) return '0%'
    return `${donutData[0].percent}%`
  }, [donutData])

  // Card 3: Highest Spent
  const highestSpent = useMemo(() => {
    if (isDemoMode) {
      return DEMO_VALUES[spendingTimeframe].highest
    }
    if (expenseItems.length === 0) {
      return { title: 'No logs', amount: 0, category: 'Other' }
    }
    const sorted = [...expenseItems].sort((a, b) => b.amountCents - a.amountCents)
    return { title: sorted[0].title, amount: sorted[0].amountCents, category: sorted[0].category }
  }, [isDemoMode, spendingTimeframe, expenseItems])

  const highestSpentCategory = highestSpent.category || 'Other'
  const highestSpentMeta = getCategoryMeta(highestSpentCategory)
  const highestSpentEmoji = CATEGORY_EMOJIS[highestSpentCategory] || '📌'

  // Spending Over Time Chart Data
  const barChartData = useMemo(() => {
    const now = new Date()

    if (spendingTimeframe === 'today') {
      // 12 intervals of 2 hours
      const data = Array.from({ length: 12 }, (_, i) => {
        const hour = i * 2
        const label = hour < 10 ? `0${hour}` : `${hour}`
        return { name: label, amount: 0 }
      })

      if (!isDemoMode) {
        expenseItems.forEach((item) => {
          const d = new Date(item.createdAt)
          const hour = d.getHours()
          const index = Math.floor(hour / 2)
          if (index >= 0 && index < 12) {
            data[index].amount += item.amountCents / 100
          }
        })
      } else {
        const mockValues = [40, 0, 0, 0, 120, 250, 80, 150, 90, 310, 110, 50]
        for (let i = 0; i < 12; i++) {
          data[i].amount = mockValues[i]
        }
      }
      return data
    }

    if (spendingTimeframe === 'week') {
      // Last 7 days
      const data = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return {
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateStr: d.toDateString(),
          amount: 0
        }
      })

      if (!isDemoMode) {
        expenseItems.forEach((item) => {
          const itemDateStr = new Date(item.createdAt).toDateString()
          const match = data.find((day) => day.dateStr === itemDateStr)
          if (match) {
            match.amount += item.amountCents / 100
          }
        })
      } else {
        const mockValues = [450, 800, 300, 950, 600, 1200, 750]
        for (let i = 0; i < 7; i++) {
          data[i].amount = mockValues[i]
        }
      }
      return data
    }

    if (spendingTimeframe === 'year') {
      // 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const data = months.map((m) => ({ name: m, amount: 0 }))

      if (!isDemoMode) {
        expenseItems.forEach((item) => {
          const d = new Date(item.createdAt)
          const monthIndex = d.getMonth()
          if (monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex].amount += item.amountCents / 100
          }
        })
      } else {
        const mockValues = [8200, 9500, 7100, 11000, 8800, 12500, 9300, 10400, 11500, 8900, 9700, 13200]
        for (let i = 0; i < 12; i++) {
          data[i].amount = mockValues[i]
        }
      }
      return data
    }

    // Default: 'month'
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1
      return {
        name: dayNum < 10 ? `0${dayNum}` : `${dayNum}`,
        amount: 0
      }
    })

    if (!isDemoMode) {
      expenseItems.forEach((item) => {
        const d = new Date(item.createdAt)
        const day = d.getDate()
        if (day >= 1 && day <= daysInMonth) {
          data[day - 1].amount += item.amountCents / 100
        }
      })
    } else {
      // Generate some nice-looking mock curves for the calendar month
      for (let i = 0; i < daysInMonth; i++) {
        const dayNum = i + 1
        const amount = Math.abs(Math.sin(dayNum) * 1200) + 200
        data[i].amount = Math.round(amount)
      }
    }
    return data
  }, [isDemoMode, spendingTimeframe, expenseItems])

  return (
    <div className="flex flex-col h-full w-full space-y-6 animate-rise">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-5 border-b border-slate-200/50 dark:border-slate-800/40">
        <div>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Analytics Dashboard</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Spending & Ratios
          </h1>
        </div>
        {isDemoMode && (
          <span className="w-fit inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff7ee2]/10 text-[#ff7ee2] text-[9px] font-black uppercase tracking-wider">
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
              {spendingPercentageText}
            </span>
          </div>

          {/* Right Donut chart */}
          <div className="sm:col-span-5 h-24 relative flex justify-center items-center">
            {donutData.length === 0 ? (
              <span className="text-[9px] text-slate-400 text-center font-bold">No expenses</span>
            ) : (
              <>
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
              </>
            )}
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
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${highestSpentMeta.bg}`}>
              {highestSpentEmoji}
            </span>
            <div>
              <p className="font-extrabold text-[11px] text-slate-800 dark:text-white leading-tight">
                {highestSpent.title}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Top Expense Entry ({highestSpentCategory})
              </p>
            </div>
          </div>
        </article>

      </div>

      {/* BOTTOM SECTION: Spending Over Time chart & Categories list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Spending Over Time pink bar chart (8 cols) */}
        <article className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-5 text-left">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider">Spending Over Time</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">Daily expense intervals comparison</p>
            </div>

            {/* Timeframe switch pills */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-205/30 w-full sm:w-auto justify-between sm:justify-start">
              {['Month', 'Year', 'Week', 'Today'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSpendingTimeframe(tf.toLowerCase())}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
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
                <Tooltip content={<CustomTooltip timeframe={spendingTimeframe} />} />
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
            {donutData.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <div className="text-2xl mb-2">📊</div>
                <p className="text-xs font-semibold">No expense data for this timeframe</p>
              </div>
            ) : (
              donutData.map((item) => (
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
              ))
            )}
          </div>
        </article>

      </div>

      {/* RECENT TRANSACTIONS ROW */}
      <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 rounded-3xl shadow-sm text-left">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-wider">Recent Transactions</h3>
            <p className="text-[9px] text-slate-400 mt-0.5">Your latest activity</p>
          </div>
          <Link to="/transactions" className="text-xs font-bold text-[#ff7ee2] hover:underline no-underline">
            View All →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <div className="text-3xl mb-2">💸</div>
            <div className="text-xs font-semibold">No transactions yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map(t => {
              const emoji = CATEGORY_EMOJIS[t.category] || '📌'
              return (
                <div key={t.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-50 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${t.type === 'income' ? 'bg-[#e8f5f0] dark:bg-green-950/40' : 'bg-rose-50 dark:bg-rose-950/40'}`}>
                      {t.type === 'income' ? '💰' : emoji}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{t.title}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{t.category}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${t.type === 'income' ? 'text-[#207561]' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amountCents)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </article>

    </div>
  )
}

