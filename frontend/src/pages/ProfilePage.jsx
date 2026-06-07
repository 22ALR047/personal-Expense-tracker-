import { formatCurrency } from '../utils/themeHelpers'

export default function ProfilePage({ currentUser, transactions = [], isDark, setIsDark }) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amountCents, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0)

  function toggleTheme() {
    setIsDark(v => !v)
  }

  function handleExportAll() {
    if (transactions.length === 0) {
      alert("No transaction logs to export.")
      return
    }
    const headers = ['Title', 'Amount (INR)', 'Category', 'Type', 'Date', 'Description']
    const rows = transactions.map(t => [
      `"${t.title.replace(/"/g, '""')}"`,
      (t.amountCents / 100).toFixed(2),
      `"${t.category}"`,
      t.type,
      new Date(t.createdAt).toLocaleDateString('en-IN'),
      `"${(t.description || '').replace(/"/g, '""')}"`
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `expenso_backup_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleResetAllBudgets() {
    if (window.confirm("Are you sure you want to reset all budget limits to defaults?")) {
      localStorage.removeItem('expense-tracker-budgets')
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-rise w-full">
      <div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">Profile</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">Account Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-7 bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-5 pb-6 border-b border-slate-100 dark:border-[#22223a]">
            <div className="w-16 h-16 rounded-full bg-[#207561] flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{currentUser?.name || 'User'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{currentUser?.email || 'user@example.com'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 py-6 border-b border-slate-100 dark:border-[#22223a]">
            <div className="text-center pb-4 sm:pb-0">
              <p className="text-2xl font-black text-[#207561]">{formatCurrency(totalIncome)}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Total Income</p>
            </div>
            <div className="text-center py-4 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-100 dark:border-[#22223a]">
              <p className="text-2xl font-black text-red-500">{formatCurrency(totalExpense)}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Total Expense</p>
            </div>
            <div className="text-center pt-4 sm:pt-0">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{transactions.length}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">Transactions</p>
            </div>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">Dark Mode</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Toggle dark theme</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={isDark}
                className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-[#207561]' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column Wrapper */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Account Details Card */}
          <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 mb-4">Account Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Name', value: currentUser?.name || '—' },
                { label: 'Email', value: currentUser?.email || '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-slate-50 dark:border-[#22223a] last:border-0">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl p-6 shadow-sm flex flex-col gap-4 text-left">
            <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">System Actions</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-2">Useful utilities for backup and settings</p>
            
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={handleExportAll}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-850 border border-slate-200/40 dark:border-slate-800/60 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                📥 Export Backup (CSV)
              </button>
              <button
                onClick={handleResetAllBudgets}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-rose-200/30 dark:border-red-900/20 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                🗑️ Reset Budget Limits
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
