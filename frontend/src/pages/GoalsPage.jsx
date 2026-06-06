import { useState, useEffect, useCallback } from 'react'

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

export default function GoalsPage({ currentUser }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Funding state
  const [fundingGoalId, setFundingGoalId] = useState(null)
  const [fundAmount, setFundAmount] = useState('')

  const fetchGoals = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/goals?userId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to fetch savings goals')
      const data = await res.json()
      setGoals(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!title.trim() || !targetAmount || !targetDate) {
      setError('Please fill in all required fields.')
      return
    }

    const targetFloat = parseFloat(targetAmount)
    if (isNaN(targetFloat) || targetFloat <= 0) {
      setError('Please enter a valid target amount.')
      return
    }

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          targetAmountCents: Math.round(targetFloat * 100),
          targetDate: new Date(targetDate).toISOString(),
          userId: currentUser.id
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create goal.')
      }

      const newGoal = await res.json()
      setGoals(prev => [newGoal, ...prev])
      setTitle('')
      setTargetAmount('')
      setTargetDate('')
      setSuccess('Savings goal created successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleFundSubmit(e, goal) {
    e.preventDefault()
    const amtFloat = parseFloat(fundAmount)
    if (isNaN(amtFloat) || amtFloat === 0) return

    const contributionCents = Math.round(amtFloat * 100)
    const newTotal = Math.max(0, goal.currentAmountCents + contributionCents)

    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmountCents: newTotal })
      })

      if (!res.ok) throw new Error('Failed to update funding')
      const updatedGoal = await res.json()
      setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g))
      setFundingGoalId(null)
      setFundAmount('')
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete goal')
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-rise">
      {/* Create Goal Form */}
      <div className="lg:col-span-1 bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm h-fit">
        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">New Savings Goal</h2>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-5">Plan for the future</p>

        {error && <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl font-semibold mb-4">{error}</p>}
        {success && <p className="text-xs text-emerald-500 bg-emerald-500/10 p-3 rounded-xl font-semibold mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Goal Name</label>
            <input
              type="text"
              placeholder="e.g. Macbook Pro, Emergency Fund"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Target Amount (INR)</label>
            <input
              type="number"
              placeholder="₹ Amount"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-xl px-4 py-2.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white dark:[color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#207561] text-white border-none rounded-xl text-sm font-semibold cursor-pointer shadow-md shadow-[#207561]/15 hover:bg-[#1b6351] hover:shadow-lg transition-all duration-150"
          >
            Create Savings Goal
          </button>
        </form>
      </div>

      {/* Goals Display */}
      <div className="lg:col-span-2 space-y-4">
        {loading ? (
          <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 text-center text-slate-400 shadow-sm py-12">
            Loading savings goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 text-center text-slate-400 shadow-sm py-12">
            <span className="text-3xl">🎯</span>
            <p className="mt-2 text-sm font-semibold">No savings goals created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const percent = Math.min(Math.round((goal.currentAmountCents / goal.targetAmountCents) * 100), 100)
              const remaining = Math.max(0, goal.targetAmountCents - goal.currentAmountCents)
              const isAchieved = goal.currentAmountCents >= goal.targetAmountCents

              return (
                <div key={goal.id} className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{goal.title}</h3>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        Target date: {new Date(goal.targetDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors border-none bg-transparent"
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="my-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className={isAchieved ? "text-[#207561] font-bold" : "text-slate-800 dark:text-slate-200"}>
                        {percent}% {isAchieved && '🏆'}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-gradient-to-r from-[#207561] to-[#2fa882]' : 'bg-[#207561]'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5">
                      <span>{fmt(goal.currentAmountCents)} saved</span>
                      <span>Target: {fmt(goal.targetAmountCents)}</span>
                    </div>
                  </div>

                  {fundingGoalId === goal.id ? (
                    <form onSubmit={(e) => handleFundSubmit(e, goal)} className="mt-3 flex items-center gap-1.5 animate-rise">
                      <input
                        type="number"
                        placeholder="₹ Add / Remove"
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="flex-1 text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#207561] bg-white dark:bg-[#0f0f1e] text-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#207561] text-white text-[10px] font-bold rounded-lg border-none cursor-pointer"
                      >
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFundingGoalId(null); setFundAmount('') }}
                        className="px-2 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-none cursor-pointer bg-transparent"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                        {isAchieved ? 'Goal Completed!' : `${fmt(remaining)} remaining`}
                      </span>
                      <button
                        onClick={() => setFundingGoalId(goal.id)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold border-none cursor-pointer transition-colors"
                      >
                        Manage Funds
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
