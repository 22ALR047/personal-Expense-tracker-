import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = ['Groceries', 'Eating Out', 'Taxi', 'Coffee', 'Shopping', 'Electronics', 'Utilities', 'Health', 'Education', 'Fuel', 'Other']
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly']

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

export default function RecurringPage({ currentUser, onTransactionsUpdated }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextDueDate, setNextDueDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRecurring = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/recurring?userId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to fetch recurring items')
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchRecurring()
  }, [fetchRecurring])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !amount || !nextDueDate) {
      setError('Please fill in all required fields.')
      return
    }

    const amtFloat = parseFloat(amount)
    if (isNaN(amtFloat) || amtFloat <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          type,
          amountCents: Math.round(amtFloat * 100),
          frequency,
          nextDueDate: new Date(nextDueDate).toISOString(),
          userId: currentUser.id
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create recurring subscription.')
      }

      const newItem = await res.json()
      setItems(prev => [newItem, ...prev])
      setTitle('')
      setAmount('')
      setNextDueDate('')
      setSuccess('Subscription added successfully!')
      
      // Trigger a run on the backend to process it immediately if due
      const procRes = await fetch('/api/recurring/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
      const procData = await procRes.json()
      if (procData.postedCount > 0 && onTransactionsUpdated) {
        onTransactionsUpdated()
        fetchRecurring()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this recurring schedule?')) return
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-rise">
      {/* Form Card */}
      <div className="lg:col-span-1 bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm h-fit">
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">Add Subscription</h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-5">Create a auto-billing schedule</p>

        {error && <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl font-semibold mb-4">{error}</p>}
        {success && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-xl font-semibold mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. Netflix, Gym, Rent"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-3 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-3 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Amount (INR)</label>
              <input
                type="number"
                placeholder="₹ Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-3 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Next Due Date</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={e => setNextDueDate(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#207561] text-white border-none rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-[#207561]/15 hover:bg-[#1b6351] hover:shadow-lg transition-all duration-150"
          >
            Create Subscription
          </button>
        </form>
      </div>

      {/* Subscriptions List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">Active Schedules</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-6">Transactions will be posted automatically on these dates</p>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading active subscription templates...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-3xl">🔄</span>
              <p className="mt-2 text-sm font-semibold">No recurring schedules registered yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-slate-50 dark:border-[#22223a] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${item.type === 'income' ? 'bg-[#207561]/10 text-[#207561]' : 'bg-red-500/10 text-red-500'}`}>
                      {item.type === 'income' ? '↙' : '↗'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {item.category} • {item.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-5">
                    <div>
                      <p className={`text-sm font-extrabold ${item.type === 'income' ? 'text-[#207561]' : 'text-red-500'}`}>
                        {item.type === 'income' ? '+' : '-'}{fmt(item.amountCents)}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        Next due: {new Date(item.nextDueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors border-none bg-transparent"
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
