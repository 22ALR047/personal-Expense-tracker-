import { useState, useRef, useEffect, useCallback } from 'react'

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

const QUICK_CHIPS = [
  { id: 'summary',   label: '📈 Financial summary' },
  { id: 'income',    label: '💼 My income' },
  { id: 'leak',      label: '🔍 Biggest expense' },
  { id: 'eating',    label: '🍽️ Eating Out' },
  { id: 'save',      label: '💰 How to save more?' },
  { id: 'topcat',    label: '🏆 Top category' },
  { id: 'reduce',    label: '✂️ Cut expenses' },
  { id: '503020',    label: '📊 50/30/20 plan' },
  { id: 'coffee',    label: '☕ Coffee habit' },
  { id: 'budget',    label: '📋 Budget limits' },
  { id: 'goals',     label: '🎯 Savings goals' },
  { id: 'groceries', label: '🛒 Groceries' },
]

export default function InsightsPage({ currentUser, transactions = [] }) {
  const [goals, setGoals] = useState([])
  const [messages, setMessages] = useState([
    {
      from: 'ai',
      text: "Hi! I'm Spark ✨ — your personal finance AI.\n\nAsk me anything about your spending, income, savings goals, or budget. You can type a question or tap one of the quick chips below!",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/goals?userId=${currentUser.id}`)
      if (res.ok) setGoals(await res.json())
    } catch { /* silent */ }
  }, [currentUser])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // ── Metrics ───────────────────────────────────────────────────────────────
  const metrics = (() => {
    const now = new Date()
    const cm = now.getMonth(), cy = now.getFullYear()
    let monthIncome = 0, monthExpense = 0
    const categoryExpenses = {}
    transactions.forEach(t => {
      const d = new Date(t.createdAt)
      if (d.getMonth() === cm && d.getFullYear() === cy) {
        if (t.type === 'income') monthIncome += t.amountCents
        else {
          monthExpense += t.amountCents
          categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amountCents
        }
      }
    })
    return { monthIncome, monthExpense, netIncome: monthIncome - monthExpense, categoryExpenses }
  })()

  // ── AI Response Generator ─────────────────────────────────────────────────
  function generateResponse(id, freeText) {
    const ce = metrics.categoryExpenses

    if (id === 'summary') {
      let t = `📈 **Financial Summary — This Month**\n\n`
      t += `💰 Income: ${fmt(metrics.monthIncome)}\n`
      t += `💸 Expenses: ${fmt(metrics.monthExpense)}\n`
      t += `📊 Net Balance: ${fmt(metrics.netIncome)}\n\n`
      const top = Object.entries(ce).sort((a, b) => b[1] - a[1]).slice(0, 3)
      if (top.length) { t += `Top spending:\n`; top.forEach(([c, a], i) => { t += `${i + 1}. ${c} — ${fmt(a)}\n` }) }
      t += metrics.netIncome > 0
        ? `\n🎉 Great! You have a surplus of ${fmt(metrics.netIncome)} this month.`
        : `\n⚠️ You're overspending by ${fmt(Math.abs(metrics.netIncome))} this month.`
      return t
    }

    if (id === 'income') {
      let t = `💼 **Income This Month**\n\n`
      t += `• Total Income: ${fmt(metrics.monthIncome)}\n`
      t += `• Total Expenses: ${fmt(metrics.monthExpense)}\n`
      t += `• Net Savings: ${fmt(metrics.netIncome)}\n\n`
      if (!metrics.monthIncome) t += `⚠️ No income logged yet. Add your salary/freelance earnings in Transactions.`
      else if (metrics.netIncome > 0) t += `🎉 You're saving ${Math.round((metrics.netIncome / metrics.monthIncome) * 100)}% of your income!`
      else t += `⚠️ Spending more than you earn. Review your expenses.`
      return t
    }

    if (id === 'leak') {
      const cats = Object.entries(ce).sort((a, b) => b[1] - a[1])
      if (!cats.length) return `No expenses recorded this month yet. Add some transactions to track leaks.`
      const [top, amt] = cats[0]
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      return `🔍 **Biggest Expense: ${top}**\n\nYou spent ${fmt(amt)} here (${pct}% of total expenses).\n\nTip: Set a budget limit for ${top} in the Budget page.`
    }

    if (id === 'eating') {
      const amt = ce['Eating Out'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `🍽️ No Eating Out expenses this month! Either cooking at home or not logged yet.`
      return `🍽️ **Eating Out: ${fmt(amt)}** (${pct}% of expenses)\n\n${pct > 20 ? '⚠️ Above the recommended 15%. Try limiting to weekends to save more.' : '✅ This is within a healthy dining-out range!'}`
    }

    if (id === 'save') {
      const dining = ce['Eating Out'] || 0, shop = ce['Shopping'] || 0, coff = ce['Coffee'] || 0
      let t = `💰 **How to Save More This Month:**\n\n`
      if (dining > 200000) t += `• Cut Eating Out by 25% → saves ${fmt(dining * 0.25)}\n`
      else t += `• Cook at home 2× more/week → saves ~₹1,200\n`
      if (shop > 150000) t += `• Delay non-essential shopping 2 weeks → saves ${fmt(shop * 0.3)}\n`
      if (coff > 50000) t += `• Brew coffee at home → saves ${fmt(coff * 0.6)}\n`
      t += `\nCurrent net balance: ${fmt(metrics.netIncome)}`
      return t
    }

    if (id === 'topcat') {
      const cats = Object.entries(ce).sort((a, b) => b[1] - a[1])
      if (!cats.length) return `🏆 No expense categories yet. Add transactions to see your top spender.`
      const [top, amt] = cats[0]
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      let t = `🏆 **#1 Spending Category: ${top}**\n${fmt(amt)} (${pct}%)\n\n`
      if (cats.length > 1) { t += `All categories:\n`; cats.slice(0, 5).forEach(([c, a], i) => { t += `${i + 1}. ${c} — ${fmt(a)}\n` }) }
      return t
    }

    if (id === 'reduce') {
      const optional = ['Eating Out', 'Coffee', 'Shopping', 'Taxi', 'Gym', 'Entertainment']
      const cuts = Object.entries(ce).filter(([c]) => optional.includes(c)).sort((a, b) => b[1] - a[1])
      if (!cuts.length) return `✂️ Your expenses look lean! Most spending is in essential categories.`
      let t = `✂️ **Where You Can Cut Expenses:**\n\n`
      cuts.slice(0, 4).forEach(([c, a]) => { t += `• ${c} (${fmt(a)}) → cut 25% = save ${fmt(a * 0.25)}/month\n` })
      const total = cuts.slice(0, 4).reduce((s, [, a]) => s + Math.round(a * 0.25), 0)
      t += `\n💡 Total potential savings: ${fmt(total)}/month`
      return t
    }

    if (id === '503020') {
      const inc = metrics.monthIncome || 5000000
      return `📊 **50/30/20 Budget Plan**\n\nBased on your income of ${fmt(inc)}:\n\n🏠 Needs (50%): ${fmt(inc * 0.5)}\n   (Rent, Groceries, Utilities, Health)\n\n🎉 Wants (30%): ${fmt(inc * 0.3)}\n   (Eating Out, Shopping, Coffee, Taxi)\n\n💰 Savings (20%): ${fmt(inc * 0.2)}\n   (Emergency fund, Investments, Goals)`
    }

    if (id === 'coffee') {
      const amt = ce['Coffee'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `☕ ₹0 on Coffee this month — excellent discipline!`
      if (pct > 8) return `☕ **High Coffee Spending!**\n\nYou spent ${fmt(amt)} on Coffee (${pct}% of expenses).\n\nSwitching to home brewing 4×/week could save ~${fmt(amt * 0.7 * 12)}/year!`
      return `☕ **Coffee: ${fmt(amt)}** (${pct}%)\n\nModerate and healthy — enjoy mindfully! ☕`
    }

    if (id === 'budget') {
      try {
        const stored = localStorage.getItem('expense-tracker-budgets')
        if (!stored) return `📋 No budget limits set yet.\n\nGo to the **Budget** page to define monthly limits for each category.`
        const budgets = JSON.parse(stored)
        const active = Object.entries(budgets).filter(([, b]) => b.limit > 0)
        if (!active.length) return `📋 All budget limits are ₹0.\n\nGo to the Budget page and click Edit to set limits.`
        let t = `📋 **Your Budget Limits:**\n\n`
        active.forEach(([cat, b]) => {
          const spent = ce[cat] || 0
          const pct = Math.round((spent / b.limit) * 100)
          t += `${spent > b.limit ? '🔴' : pct >= 80 ? '🟡' : '🟢'} ${cat}: ${fmt(spent)} / ${fmt(b.limit)} (${pct}%)\n`
        })
        return t
      } catch { return `📋 Could not read budget data.` }
    }

    if (id === 'goals') {
      if (!goals.length) return `🎯 No savings goals yet!\n\nGo to **Savings Goals** to create targets like Emergency Fund or Vacation.`
      let t = `🎯 **Your Savings Goals:**\n\n`
      goals.forEach(g => {
        const pct = Math.round((g.currentAmountCents / g.targetAmountCents) * 100)
        t += `${pct >= 100 ? '✅' : pct >= 50 ? '🔄' : '🎯'} ${g.title}: ${fmt(g.currentAmountCents)} / ${fmt(g.targetAmountCents)} (${pct}%)\n`
      })
      return t
    }

    if (id === 'groceries') {
      const amt = ce['Groceries'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `🛒 No Grocery expenses this month. Log supermarket visits under "Groceries".`
      return `🛒 **Groceries: ${fmt(amt)}** (${pct}%)\n\n${pct > 30 ? '⚠️ Above 30%. Consider meal planning to reduce waste.' : '✅ Healthy grocery budget!'}`
    }

    // ── Free text fallback ────────────────────────────────────────────────
    const q = (freeText || '').toLowerCase()
    const catKw = {
      'Eating Out': ['eating', 'restaurant', 'food', 'dine', 'lunch', 'dinner', 'swiggy', 'zomato', 'outing'],
      Coffee: ['coffee', 'cafe', 'espresso', 'starbucks', 'tea'],
      Groceries: ['grocer', 'supermarket', 'vegetable', 'fruit', 'milk'],
      Shopping: ['shopping', 'clothes', 'amazon', 'mall'],
      Taxi: ['taxi', 'uber', 'ola', 'cab', 'ride', 'auto'],
      Rent: ['rent', 'lease', 'flat', 'apartment', 'pg'],
      Utilities: ['utility', 'bill', 'electricity', 'internet', 'wifi', 'recharge'],
      Gym: ['gym', 'fitness', 'workout'],
      Health: ['health', 'doctor', 'medicine', 'hospital'],
      Salary: ['salary', 'income', 'paycheck', 'pay', 'earned'],
    }
    for (const [cat, kws] of Object.entries(catKw)) {
      if (kws.some(k => q.includes(k))) {
        if (cat === 'Salary') return generateResponse('income')
        const amt = ce[cat] || 0
        return `You spent **${fmt(amt)}** on ${cat} this month.${!amt ? '\n\nNo entries logged yet for this category.' : ''}`
      }
    }
    if (q.includes('balance') || q.includes('net') || q.includes('surplus') || q.includes('summary')) return generateResponse('summary')
    if (q.includes('save') || q.includes('saving')) return generateResponse('save')
    if (q.includes('budget')) return generateResponse('budget')
    if (q.includes('goal')) return generateResponse('goals')
    if (q.includes('cut') || q.includes('reduc') || q.includes('spend less')) return generateResponse('reduce')
    if (q.includes('top') || q.includes('most') || q.includes('highest') || q.includes('biggest')) return generateResponse('topcat')
    if (q.includes('50') || q.includes('plan') || q.includes('budg')) return generateResponse('503020')
    if (q.includes('coffee')) return generateResponse('coffee')
    if (q.includes('grocery') || q.includes('groceries')) return generateResponse('groceries')

    return `I didn't quite catch that! 🤔\n\nTry asking:\n• "How much did I spend on Eating Out?"\n• "What is my total income this month?"\n• "Where can I cut expenses?"\n• "Give me a 50/30/20 budget plan"`
  }

  function sendMessage(chipId, chipLabel) {
    const userText = chipId ? chipLabel.replace(/^[^ ]+ /, '') : input.trim()
    if (!userText) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: chipId ? chipLabel : userText }])
    setTyping(true)
    setTimeout(() => {
      const reply = generateResponse(chipId || 'custom', chipId ? '' : userText)
      setMessages(prev => [...prev, { from: 'ai', text: reply }])
      setTyping(false)
    }, 600)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(null, null) }
  }

  return (
    <div className="flex flex-col h-full animate-rise" style={{ maxHeight: 'calc(100vh - 120px)' }}>

      {/* ── Header ── */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">AI Assistant</p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">Spark AI Chat ✨</h1>
      </div>

      {/* ── Chat Window ── */}
      <div className="flex-1 bg-white dark:bg-[#16162a] border border-slate-100 dark:border-[#22223a] rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#207561] to-[#2fa882] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <span className="text-sm">✨</span>
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-line shadow-sm ${
                  m.from === 'user'
                    ? 'bg-[#207561] text-white rounded-br-sm'
                    : 'bg-slate-50 dark:bg-[#0f0f1e] text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-[#22223a]'
                }`}
              >
                {m.text}
              </div>
              {m.from === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-black text-slate-600 dark:text-slate-300">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#207561] to-[#2fa882] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <span className="text-sm">✨</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#0f0f1e] border border-slate-100 dark:border-[#22223a] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
                <div className="w-2 h-2 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Chips */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-[#22223a] flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => sendMessage(chip.id, chip.label)}
              className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-[#22223a] text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0f0f1e] hover:bg-[#207561] hover:text-white hover:border-[#207561] transition-all duration-150 cursor-pointer whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="px-4 pb-4 pt-2 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Spark anything about your finances…"
            className="flex-1 text-sm font-semibold border border-slate-200 dark:border-[#22223a] rounded-2xl px-4 py-3 outline-none focus:border-[#207561] bg-slate-50 dark:bg-[#0f0f1e] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all"
          />
          <button
            onClick={() => sendMessage(null, null)}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-2xl bg-[#207561] text-white flex items-center justify-center cursor-pointer hover:bg-[#1b6351] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-[#207561]/20 flex-shrink-0"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
