import { useMemo, useState, useEffect } from 'react'

const BUDGET_STORAGE_KEY = 'expense-tracker-budgets'

// Categories must match TransactionsPage exactly
const DEFAULT_BUDGETS = {
  Groceries: { limit: 0 },
  'Eating Out': { limit: 0 },
  Transport: { limit: 0 },
  Shopping: { limit: 0 },
  Utilities: { limit: 0 },
  Rent: { limit: 0 },
  Entertainment: { limit: 0 },
  Other: { limit: 0 },
}

const COLORS = ['#207561', '#2fa882', '#4dc4a0', '#86d8c0', '#ff7ee2', '#d97706', '#3b82f6', '#f43f5e', '#6366f1', '#f97316', '#64748b', '#10b981', '#22c55e']
const EMOJI = { 
  Groceries: '🛒', 
  'Eating Out': '🍽️', 
  Transport: '🚗', 
  Shopping: '🛍️', 
  Utilities: '💡', 
  Rent: '🏠', 
  Entertainment: '🎭', 
  Other: '📌',
  
  // Backward compatibility
  Taxi: '🚕',
  Coffee: '☕',
  Electronics: '📱',
  Gym: '🏋️‍♂️',
  Health: '❤️',
  Education: '📚',
  Fuel: '⛽'
}

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

function loadBudgets() {
  try {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed['Outing'] !== undefined) {
        parsed['Eating Out'] = parsed['Outing']
        delete parsed['Outing']
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(parsed))
      }
      // Merge with defaults so new categories are picked up
      return { ...DEFAULT_BUDGETS, ...parsed }
    }
  } catch { /* ignore */ }
  return DEFAULT_BUDGETS
}

export default function BudgetPage({ transactions = [] }) {
  const [budgets, setBudgets] = useState(loadBudgets)
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')

  // Persist budgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets))
  }, [budgets])

  function resetBudgets() {
    if (window.confirm("Are you sure you want to reset all budget limits to defaults?")) {
      localStorage.removeItem(BUDGET_STORAGE_KEY)
      setBudgets(DEFAULT_BUDGETS)
    }
  }

  // Only count expenses from the current month
  const spentByCategory = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const map = {}
    transactions
      .filter(t => {
        if (t.type !== 'expense') return false
        const d = new Date(t.createdAt)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .forEach(t => {
        let cat = t.category || 'Other'
        // Map old category to new simplified category for budget aggregation
        if (DEFAULT_BUDGETS[cat] === undefined) {
          if (cat === 'Coffee' || cat === 'Eating Out') cat = 'Eating Out'
          else if (cat === 'Taxi' || cat === 'Fuel') cat = 'Transport'
          else if (cat === 'Electronics' || cat === 'Shopping') cat = 'Shopping'
          else if (cat === 'Gym' || cat === 'Education') cat = 'Entertainment'
          else cat = 'Other'
        }
        map[cat] = (map[cat] || 0) + t.amountCents
      })
    return map
  }, [transactions])

  const budgetData = useMemo(() => {
    return Object.keys(DEFAULT_BUDGETS).map((category) => {
      const budget = budgets[category] || { limit: 0 }
      const spent = spentByCategory[category] || 0
      const percent = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0
      const remaining = budget.limit - spent
      return { category, limit: budget.limit, spent, remaining, percent }
    })
  }, [budgets, spentByCategory])

  const totalBudget = useMemo(() => {
    return Object.keys(DEFAULT_BUDGETS).reduce((s, category) => s + (budgets[category]?.limit || 0), 0)
  }, [budgets])
  const totalSpent = useMemo(() => Object.values(spentByCategory).reduce((s, v) => s + v, 0), [spentByCategory])
  const totalPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  function handleEdit(category) {
    setEditing(category)
    setEditValue((budgets[category]?.limit / 100).toString())
  }

  function saveEdit() {
    if (!editing) return
    const val = parseFloat(editValue)
    if (!isNaN(val) && val >= 0) {
      setBudgets(prev => ({ ...prev, [editing]: { ...prev[editing], limit: Math.round(val * 100) } }))
    }
    setEditing(null)
    setEditValue('')
  }

  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6 animate-rise">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">Budget Management</p>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">{monthName}</h1>
            <button
              onClick={resetBudgets}
              className="text-[10px] font-extrabold px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded-full cursor-pointer transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6 text-left sm:text-right w-full sm:w-auto justify-between sm:justify-end">
          <div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Budget</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{fmt(totalBudget)}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Spent</p>
            <p className="text-lg font-black text-[#207561]">{fmt(totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Overall Budget Usage</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{Math.round(totalPercent)}%</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${totalPercent}%`,
              background: totalSpent > totalBudget
                ? '#ef4444'
                : 'linear-gradient(90deg, #207561, #2fa882)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">{fmt(totalSpent)} spent</span>
          <span className={`font-bold ${totalSpent > totalBudget ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {totalSpent > totalBudget
              ? `${fmt(totalSpent - totalBudget)} over budget`
              : `${fmt(totalBudget - totalSpent)} remaining`
            }
          </span>
        </div>
      </div>

      {/* Budget cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetData.map((item, i) => {
          const isOver = item.spent > item.limit
          const isEditing = editing === item.category
          const emoji = EMOJI[item.category] || '📌'

          return (
            <div key={item.category} className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm transition-all duration-150 hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] + '18' }}
                  >
                    {emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{item.category}</span>
                      {isOver && (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 uppercase tracking-wider">
                          Exceeded
                        </span>
                      )}
                      {!isOver && item.limit > 0 && (item.spent / item.limit) >= 0.8 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-extrabold bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 uppercase tracking-wider">
                          80%+ Used
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Limit: {fmt(item.limit)}</div>
                  </div>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">₹</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-20 text-right text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(null) }}
                    />
                    <button onClick={saveEdit} className="text-[10px] font-bold text-[#207561] hover:underline cursor-pointer px-1">Save</button>
                  </div>
                ) : (
                  <button onClick={() => handleEdit(item.category)} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-[#207561] dark:hover:text-[#2fa882] cursor-pointer transition-colors">Edit</button>
                )}
              </div>

              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percent}%`,
                    backgroundColor: isOver ? '#ef4444' : COLORS[i % COLORS.length],
                  }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">{fmt(item.spent)} spent</span>
                <span className={`font-bold ${isOver ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {isOver ? `${fmt(Math.abs(item.remaining))} over` : `${fmt(item.remaining)} left`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
