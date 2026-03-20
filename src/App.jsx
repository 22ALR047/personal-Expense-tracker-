import { useEffect, useMemo, useRef, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import './App.css'

const STORAGE_KEY = 'expense-tracker-transactions-v2'
const THEME_KEY = 'expense-tracker-theme'
const DEFAULT_FORM = {
  title: '',
  amount: '',
  category: '',
  type: 'expense',
}
const CATEGORIES = ['Food', 'Rent', 'Salary', 'Transport', 'Utilities', 'Shopping', 'Health', 'Other']
const CHART_COLORS = ['#22c55e', '#0ea5e9', '#eab308', '#f97316', '#ef4444', '#a855f7', '#14b8a6', '#64748b']
const MAX_AMOUNT_CENTS = 9_000_000_000_000_000

function parseAmountToCents(raw) {
  const value = raw.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return null
  }

  const [whole = '0', fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number((fraction + '00').slice(0, 2))
  return Number.isInteger(cents) ? cents : null
}

function formatCurrency(cents) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function safeDate(value) {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatDate(value) {
  const timestamp = safeDate(value)
  if (timestamp === 0) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item) => {
        return (
          item &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.category === 'string' &&
          (item.type === 'income' || item.type === 'expense') &&
          Number.isInteger(item.amountCents) &&
          item.amountCents > 0
        )
      })
      .map((item) => ({
        ...item,
        createdAt: safeDate(item.createdAt) ? item.createdAt : new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-cyan-500'

  return (
    <div className={`${bgColor} fixed left-1/2 top-3 z-[9999] w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg px-4 py-3 text-center text-sm font-semibold text-white shadow-lg animate-slide-in`}>
      {message}
    </div>
  )
}

function App() {
  const formRef = useRef(null)
  const [transactions, setTransactions] = useState(readTransactions)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored ? stored === 'dark' : false
  })
  const [searchText, setSearchText] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  const getDateRange = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)

    return {
      'all': null,
      'month': startOfMonth.getTime(),
      '3months': threeMonthsAgo.getTime(),
    }[dateFilter]
  }

  const filteredAndSorted = useMemo(() => {
    const normalized = searchText.toLowerCase()
    const dateMs = getDateRange()

    return [...transactions]
      .filter((item) => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false
        if (dateMs && safeDate(item.createdAt) < dateMs) return false
        if (!normalized) return true
        return item.title.toLowerCase().includes(normalized) || item.category.toLowerCase().includes(normalized)
      })
      .sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt))
  }, [transactions, searchText, dateFilter, typeFilter])

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, item) => {
        if (item.type === 'income') {
          acc.income += item.amountCents
        } else {
          acc.expense += item.amountCents
        }
        return acc
      },
      { income: 0, expense: 0 },
    )
  }, [transactions])

  const netBalance = summary.income - summary.expense

  const chartData = useMemo(() => {
    const expenseItems = transactions.filter((item) => item.type === 'expense')
    const totalExpense = expenseItems.reduce((sum, item) => sum + item.amountCents, 0)

    if (!totalExpense) {
      return []
    }

    const grouped = expenseItems.reduce((acc, item) => {
      const key = item.category.trim() || 'Other'
      acc[key] = (acc[key] || 0) + item.amountCents
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([name, valueCents]) => ({
        name,
        valueCents,
        value: valueCents / 100,
        percent: (valueCents / totalExpense) * 100,
      }))
      .sort((a, b) => b.valueCents - a.valueCents)
  }, [transactions])

  const orderedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => safeDate(b.createdAt) - safeDate(a.createdAt))
  }, [transactions])

  function resetForm() {
    setForm(DEFAULT_FORM)
    setEditingId(null)
    setError('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const title = form.title.trim()
    const category = form.category.trim()
    const amountCents = parseAmountToCents(form.amount)

    if (!title || !category || !form.type) {
      setError('Please complete all fields before saving.')
      return
    }

    if (amountCents === null || amountCents <= 0) {
      setError('Amount must be a valid number greater than 0 and up to 2 decimals.')
      return
    }

    if (amountCents > MAX_AMOUNT_CENTS) {
      setError('Amount is too large. Please use a smaller number.')
      return
    }

    const payload = {
      title,
      category,
      type: form.type,
      amountCents,
      updatedAt: new Date().toISOString(),
    }

    if (editingId) {
      setTransactions((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)))
      setToast({ message: '✓ Transaction updated successfully', type: 'success' })
    } else {
      setTransactions((prev) => [
        {
          id: createId(),
          createdAt: new Date().toISOString(),
          ...payload,
        },
        ...prev,
      ])
      setToast({ message: '✓ Transaction added successfully', type: 'success' })
    }

    resetForm()
  }

  function handleEdit(item) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      amount: (item.amountCents / 100).toFixed(2),
      category: item.category,
      type: item.type,
    })
    setError('')
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((item) => item.id !== id))
    if (editingId === id) {
      resetForm()
    }
    setToast({ message: '✓ Transaction deleted', type: 'success' })
  }

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 transition-colors ${
      isDark 
        ? 'bg-slate-950 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.26),_transparent_35%)]' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50'
    }`}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="mx-auto max-w-6xl space-y-6">
        <header className={`animate-rise rounded-2xl border p-6 backdrop-blur transition-colors ${
          isDark
            ? 'border-emerald-500/30 bg-slate-900/70'
            : 'border-emerald-500/20 bg-white/80 shadow-lg'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                Personal Wealth and Expense Tracker
              </p>
              <h1 className={`mt-2 text-3xl font-semibold sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Manage money with clarity
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Add transactions manually, track totals, and view expense categories instantly.
              </p>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`rounded-full p-3 transition ${
                isDark 
                  ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              }`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow">
            <p className="text-xs uppercase tracking-wider text-emerald-700">Total Income</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(summary.income)}</p>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow">
            <p className="text-xs uppercase tracking-wider text-rose-700">Total Expense</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(summary.expense)}</p>
          </article>

          <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow">
            <p className="text-xs uppercase tracking-wider text-cyan-700">Net Balance</p>
            <p className={`mt-2 text-2xl font-semibold ${netBalance >= 0 ? 'text-cyan-600' : 'text-amber-600'}`}>
              {formatCurrency(netBalance)}
            </p>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <article ref={formRef} className={`rounded-2xl border p-5 backdrop-blur transition-all ${
            editingId
              ? 'border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-200/50'
              : 'border-slate-200 bg-white/80 shadow-lg'
          }`}>
            <h2 className="text-xl font-semibold text-slate-900">Transaction Entry</h2>
            <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-slate-700">Title</span>
                <input
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Salary, Groceries, Rent"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-400 transition focus:ring-2"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Amount</span>
                <input
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="1250.50"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-400 transition focus:ring-2"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-slate-700">Type</span>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-400 transition focus:ring-2"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-slate-700">Category</span>
                <input
                  name="category"
                  type="text"
                  list="categories"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Food, Rent, Salary"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-400 transition focus:ring-2"
                  required
                />
                <datalist id="categories">
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>

              {error && (
                <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 sm:col-span-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                  {editingId ? 'Update' : 'Add'} Transaction
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-lg backdrop-blur">
            <h2 className="text-xl font-semibold text-slate-900">Expense by Category</h2>
            {chartData.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Add expense transactions to view the chart.</p>
            ) : (
              <>
                <div className="mt-3 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={92} paddingAngle={2}>
                        {chartData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, item) => {
                          const cents = item?.payload?.valueCents
                          if (Number.isInteger(cents)) {
                            return formatCurrency(cents)
                          }
                          if (typeof value === 'number') {
                            return formatCurrency(Math.round(value * 100))
                          }
                          return value
                        }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <ul className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {chartData.map((item, index) => (
                    <li key={item.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="text-slate-600">{item.percent.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        </section>

        <section className={`rounded-2xl border p-5 backdrop-blur transition-colors ${
          isDark
            ? 'border-slate-700 bg-slate-900/70'
            : 'border-slate-200 bg-white/80 shadow-lg'
        }`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Transactions</h2>
          
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by title or category..."
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring-2 ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-400'
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
              }`}
            />
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring-2 ${
                  isDark
                    ? 'border-slate-600 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">All types</option>
                <option value="income">Income only</option>
                <option value="expense">Expense only</option>
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring-2 ${
                  isDark
                    ? 'border-slate-600 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="3months">Last 3 months</option>
              </select>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {filteredAndSorted.length} of {transactions.length} transaction(s)
            </p>
          </div>

          {transactions.length === 0 ? (
            <p className={`mt-4 rounded-xl border p-4 text-sm ${
              isDark
                ? 'border-slate-700 bg-slate-800/80 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              Get started by adding your first transaction.
            </p>
          ) : filteredAndSorted.length === 0 ? (
            <p className={`mt-4 rounded-xl border p-4 text-sm ${
              isDark
                ? 'border-slate-700 bg-slate-800/80 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              No transactions match your filters.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {filteredAndSorted.slice(0, 15).map((item) => (
                <li key={item.id} className={`interactive-row flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between transition ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.category} • {formatDate(item.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-semibold ${item.type === 'income' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
                      {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amountCents)}
                    </p>
                    <button type="button" onClick={() => handleEdit(item)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isDark
                        ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10'
                        : 'border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                    }`}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      isDark
                        ? 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10'
                        : 'border-rose-300 text-rose-700 hover:bg-rose-100'
                    }`}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
