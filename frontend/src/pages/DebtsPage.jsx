import { useState, useEffect, useCallback } from 'react'

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

export default function DebtsPage({ currentUser, onTransactionsUpdated }) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [personName, setPersonName] = useState('')
  const [type, setType] = useState('borrowed') // borrowed (I owe), lent (Owed to me)
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchDebts = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/debts?userId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to retrieve debts')
      const data = await res.json()
      setDebts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!personName.trim() || !amount || !dueDate) {
      setError('Please fill in all required fields.')
      return
    }

    const amtFloat = parseFloat(amount)
    if (isNaN(amtFloat) || amtFloat <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: personName.trim(),
          type,
          amountCents: Math.round(amtFloat * 100),
          dueDate: new Date(dueDate).toISOString(),
          description: description.trim(),
          userId: currentUser.id
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to register debt.')
      }

      const newDebt = await res.json()
      setDebts(prev => [newDebt, ...prev])
      setPersonName('')
      setAmount('')
      setDueDate('')
      setDescription('')
      setSuccess('Debt/loan entry added successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleMarkPaid(debt) {
    try {
      // 1. Update debt status to paid
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      })

      if (!res.ok) throw new Error('Failed to update status')
      const updated = await res.json()
      setDebts(prev => prev.map(d => d.id === debt.id ? updated : d))

      // 2. Auto-post corresponding transaction
      const txnType = debt.type === 'lent' ? 'income' : 'expense'
      const txnTitle = debt.type === 'lent' ? `Repayment from ${debt.personName}` : `Repaid loan to ${debt.personName}`
      
      const txnRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: txnTitle,
          category: 'Other',
          type: txnType,
          amountCents: debt.amountCents,
          userId: currentUser.id,
          description: `Resolved debt: ${debt.description || 'no details'}`
        })
      })

      if (txnRes.ok && onTransactionsUpdated) {
        onTransactionsUpdated()
      }
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this debt entry?')) return
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDebts(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Calculators
  const totalBorrowed = debts.filter(d => d.type === 'borrowed' && d.status === 'pending').reduce((s, d) => s + d.amountCents, 0)
  const totalLent = debts.filter(d => d.type === 'lent' && d.status === 'pending').reduce((s, d) => s + d.amountCents, 0)
  const netBalance = totalLent - totalBorrowed

  return (
    <div className="flex flex-col gap-6 animate-rise">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">Owed to Me (Lent)</p>
          <p className="text-2xl font-black text-[#207561] mt-1">{fmt(totalLent)}</p>
        </div>
        <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">I Owe (Borrowed)</p>
          <p className="text-2xl font-black text-red-500 mt-1">{fmt(totalBorrowed)}</p>
        </div>
        <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">Net Position</p>
          <p className={`text-2xl font-black mt-1 ${netBalance >= 0 ? 'text-[#207561]' : 'text-red-500'}`}>
            {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">Add Debt / Loan</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-5">Keep track of debts</p>

          {error && <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl font-semibold mb-4">{error}</p>}
          {success && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-xl font-semibold mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul, Priya"
                value={personName}
                onChange={e => setPersonName(e.target.value)}
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
                  <option value="borrowed">Borrowed (I Owe)</option>
                  <option value="lent">Lent (Owed to Me)</option>
                </select>
              </div>
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
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Notes / Description</label>
              <textarea
                placeholder="e.g. Lunch split, ticket booking"
                rows="2"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#207561] text-white border-none rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-[#207561]/15 hover:bg-[#1b6351] hover:shadow-lg transition-all duration-150"
            >
              Add Entry
            </button>
          </form>
        </div>

        {/* Debt Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">Active Ledger</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-6">List of pending and paid entries</p>

            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading ledger entries...</div>
            ) : debts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-3xl">👥</span>
                <p className="mt-2 text-sm font-semibold">No debt records found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {debts.map(debt => {
                  const isPaid = debt.status === 'paid'
                  const isLent = debt.type === 'lent'
                  return (
                    <div key={debt.id} className="flex items-center justify-between border-b border-slate-50 dark:border-[#22223a] pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isPaid ? 'bg-slate-100 dark:bg-[#22223a] text-slate-400' : isLent ? 'bg-[#207561]/10 text-[#207561]' : 'bg-red-500/10 text-red-500'}`}>
                          {isPaid ? '✓' : isLent ? '↙' : '↗'}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isPaid ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                            {debt.personName} <span className="text-xs font-semibold text-slate-400">({isLent ? 'Lent' : 'Borrowed'})</span>
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            Due: {new Date(debt.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            {debt.description && ` • ${debt.description}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className={`text-sm font-extrabold ${isPaid ? 'text-slate-400 dark:text-slate-600 line-through' : isLent ? 'text-[#207561]' : 'text-red-500'}`}>
                            {isLent ? '+' : '-'}{fmt(debt.amountCents)}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                            {debt.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkPaid(debt)}
                              className="px-2.5 py-1 bg-[#207561] hover:bg-[#1b6351] text-white text-[10px] font-bold rounded-lg border-none cursor-pointer shadow-sm transition-colors"
                            >
                              Settle
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(debt.id)}
                            className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors border-none bg-transparent"
                          >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
