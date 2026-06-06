import { useState, useRef, useEffect, useCallback } from 'react'

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

const QUICK_CHIPS = [
  { id: 'summary',   label: '📈 Summary' },
  { id: 'income',    label: '💼 My income' },
  { id: 'leak',      label: '🔍 Biggest expense' },
  { id: 'eating',    label: '🍽️ Eating Out' },
  { id: 'save',      label: '💰 Save more?' },
  { id: 'topcat',    label: '🏆 Top category' },
  { id: 'reduce',    label: '✂️ Cut expenses' },
  { id: '503020',    label: '📊 50/30/20 plan' },
  { id: 'coffee',    label: '☕ Coffee habit' },
  { id: 'budget',    label: '📋 Budget limits' },
  { id: 'goals',     label: '🎯 Savings goals' },
  { id: 'groceries', label: '🛒 Groceries' },
]

export default function SparkChat({ currentUser, transactions = [] }) {
  const [open, setOpen] = useState(false)
  const [goals, setGoals] = useState([])
  const [messages, setMessages] = useState([
    { from: 'ai', text: "Hi! I'm Spark ✨\n\nAsk me anything about your spending, income, or savings!" },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const fetchGoals = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/goals?userId=${currentUser.id}`)
      if (res.ok) setGoals(await res.json())
    } catch { /* silent */ }
  }, [currentUser])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

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

  // ── Recommendation Generator ──────────────────────────────────────────────
  function getRecommendation(id) {
    const ce = metrics.categoryExpenses
    const cats = Object.entries(ce).sort((a, b) => b[1] - a[1])
    const topCat = cats[0]?.[0] || null
    const topAmt = cats[0]?.[1] || 0
    const savingsRate = metrics.monthIncome > 0 ? Math.round((metrics.netIncome / metrics.monthIncome) * 100) : 0

    const recs = {
      summary: metrics.netIncome < 0
        ? `💡 Recommendation: You're overspending! Set budget limits on the Budget page for your top 3 categories. Even reducing ${topCat ? topCat : 'discretionary'} spending by 20% can fix this.`
        : savingsRate < 20
          ? `💡 Recommendation: You're saving only ${savingsRate}% of income. Aim for 20%+. Consider creating a Savings Goal to stay motivated.`
          : `💡 Recommendation: Excellent ${savingsRate}% savings rate! Put the surplus into a Savings Goal — try the "Emergency Fund" goal (3 months of expenses).`,
      income: metrics.netIncome > 0
        ? `💡 Recommendation: Invest your surplus of ${fmt(metrics.netIncome)} — start a Savings Goal or allocate it as: 50% Emergency Fund, 30% short-term goal, 20% fun money.`
        : `💡 Recommendation: Log all income sources in Transactions (salary, freelance, etc.) to get an accurate net balance. Then set budget limits to control spending.`,
      leak: topCat
        ? `💡 Recommendation: Set a monthly budget cap of ${fmt(topAmt * 0.8)} for ${topCat} on the Budget page. That's a 20% cut which adds up to ${fmt(topAmt * 0.2 * 12)} saved per year!`
        : `💡 Recommendation: Add your transactions to discover expense leaks and get personalized advice.`,
      eating: (() => {
        const amt = ce['Eating Out'] || 0
        const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
        return pct > 20
          ? `💡 Recommendation: Meal-prep on Sundays to reduce weekday dining. Set a budget of ${fmt(amt * 0.7)} for Eating Out — that saves ${fmt(amt * 0.3)}/month or ${fmt(amt * 0.3 * 12)}/year!`
          : `💡 Recommendation: You're doing great! Keep a log of restaurant vs. home meals to maintain this healthy ratio.`
      })(),
      save: `💡 Recommendation: Set up a Savings Goal on the Goals page. Even saving ₹500/week = ₹26,000/year. Automate it by budgeting "Savings" as a fixed monthly expense.`,
      topcat: topCat
        ? `💡 Recommendation: Go to the Budget page and set a limit of ${fmt(topAmt * 0.8)} for ${topCat}. Review it weekly — small habit changes in your top category make the biggest impact.`
        : `💡 Recommendation: Add transactions regularly so Spark can identify and help you optimize your highest spending area.`,
      reduce: `💡 Recommendation: Apply the "24-hour rule" — wait 24 hours before any non-essential purchase. This alone can cut impulse spending by 30%. Also set budget limits on the Budget page.`,
      '503020': `💡 Recommendation: Start small — track just one week using the 50/30/20 split. If Wants exceed 30%, pick one category to reduce first (usually Eating Out or Shopping gives quickest results).`,
      coffee: (() => {
        const amt = ce['Coffee'] || 0
        return amt > 50000
          ? `💡 Recommendation: Buy a French press or moka pot (₹500–₹1,500 one-time cost). You'll recover the cost in 2–3 weeks and save thousands annually!`
          : `💡 Recommendation: Keep tracking coffee expenses to stay mindful. If it creeps up, set a ₹500/month Coffee budget limit.`
      })(),
      budget: (() => {
        try {
          const stored = localStorage.getItem('expense-tracker-budgets')
          if (!stored) return `💡 Recommendation: Go to the Budget page and set limits for at least 3 categories: Eating Out, Shopping, and your biggest expense. Start with realistic limits, then tighten each month.`
          const budgets = JSON.parse(stored)
          const overBudget = Object.entries(budgets).filter(([cat, b]) => b.limit > 0 && (ce[cat] || 0) > b.limit)
          return overBudget.length
            ? `💡 Recommendation: You've exceeded budget in ${overBudget.map(([c]) => c).join(', ')}. Lower your spending in those categories or increase the limit if it's unrealistic.`
            : `💡 Recommendation: Great budget discipline! Review and tighten limits by 10% next month to accelerate savings.`
        } catch { return `💡 Recommendation: Set budgets for your top 3 spending categories on the Budget page.` }
      })(),
      goals: goals.length
        ? `💡 Recommendation: Contribute to your goals every month — even ₹200 counts! Go to Savings Goals and add a deposit. Consistency beats large one-time transfers.`
        : `💡 Recommendation: Create your first Savings Goal on the Goals page! Try "Emergency Fund" (target: 3× monthly expenses = ${fmt(metrics.monthExpense * 3)}).`,
      groceries: (() => {
        const amt = ce['Groceries'] || 0
        const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
        return pct > 30
          ? `💡 Recommendation: Plan meals for the week before shopping. Buy in bulk for staples (rice, lentils, oils). A ₹200 weekly savings = ₹10,400/year!`
          : `💡 Recommendation: You're managing groceries well. Consider buying seasonal produce and comparing prices across stores to save 10–15% more.`
      })(),
    }

    return recs[id] || `💡 Recommendation: Track all your expenses regularly and set a budget for your top 3 spending categories. Small consistent habits = big financial wins!`
  }

  // ── AI Response Generator ─────────────────────────────────────────────────
  function generateResponse(id, freeText) {
    const ce = metrics.categoryExpenses

    let answer = ''

    if (id === 'summary') {
      let t = `📈 Financial Summary\n\n💰 Income: ${fmt(metrics.monthIncome)}\n💸 Expenses: ${fmt(metrics.monthExpense)}\n📊 Net: ${fmt(metrics.netIncome)}\n\n`
      const top = Object.entries(ce).sort((a, b) => b[1] - a[1]).slice(0, 3)
      if (top.length) { t += `Top spending:\n`; top.forEach(([c, a], i) => { t += `${i + 1}. ${c} — ${fmt(a)}\n` }) }
      t += metrics.netIncome > 0 ? `\n🎉 Surplus of ${fmt(metrics.netIncome)}!` : `\n⚠️ Overspending by ${fmt(Math.abs(metrics.netIncome))}.`
      answer = t
    } else if (id === 'income') {
      let t = `💼 Income This Month\n\n• Income: ${fmt(metrics.monthIncome)}\n• Expenses: ${fmt(metrics.monthExpense)}\n• Net: ${fmt(metrics.netIncome)}\n\n`
      if (!metrics.monthIncome) t += `⚠️ No income logged yet. Add salary/freelance in Transactions.`
      else if (metrics.netIncome > 0) t += `🎉 Saving ${Math.round((metrics.netIncome / metrics.monthIncome) * 100)}% of income!`
      else t += `⚠️ Spending more than earned.`
      answer = t
    } else if (id === 'leak') {
      const cats = Object.entries(ce).sort((a, b) => b[1] - a[1])
      if (!cats.length) return `No expenses recorded yet. Add transactions to track leaks.`
      const [top, amt] = cats[0]
      answer = `🔍 Biggest Expense: ${top}\n\n${fmt(amt)} — ${Math.round((amt / (metrics.monthExpense || 1)) * 100)}% of total expenses this month.`
    } else if (id === 'eating') {
      const amt = ce['Eating Out'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `🍽️ No Eating Out expenses this month! Either cooking at home or not logged yet.`
      answer = `🍽️ Eating Out: ${fmt(amt)} (${pct}%)\n\n${pct > 20 ? '⚠️ Above the 15% recommended level.' : '✅ Within a healthy range!'}`
    } else if (id === 'save') {
      const dining = ce['Eating Out'] || 0, shop = ce['Shopping'] || 0, coff = ce['Coffee'] || 0
      let t = `💰 How to Save More This Month:\n\n`
      if (dining > 200000) t += `• Cut Eating Out 25% → save ${fmt(dining * 0.25)}\n`
      else t += `• Cook at home 2× more/week → save ~₹1,200\n`
      if (shop > 150000) t += `• Delay shopping 2 weeks → save ${fmt(shop * 0.3)}\n`
      if (coff > 50000) t += `• Brew coffee at home → save ${fmt(coff * 0.6)}\n`
      t += `\nCurrent net balance: ${fmt(metrics.netIncome)}`
      answer = t
    } else if (id === 'topcat') {
      const cats = Object.entries(ce).sort((a, b) => b[1] - a[1])
      if (!cats.length) return `🏆 No expenses yet. Add transactions first.`
      let t = `🏆 Top Spending Categories:\n\n`
      cats.slice(0, 5).forEach(([c, a], i) => { t += `${i + 1}. ${c} — ${fmt(a)}\n` })
      answer = t
    } else if (id === 'reduce') {
      const optional = ['Eating Out', 'Coffee', 'Shopping', 'Taxi', 'Gym']
      const cuts = Object.entries(ce).filter(([c]) => optional.includes(c)).sort((a, b) => b[1] - a[1])
      if (!cuts.length) return `✂️ Expenses look lean! Most spending is in essential categories.`
      let t = `✂️ Where You Can Cut:\n\n`
      cuts.slice(0, 4).forEach(([c, a]) => { t += `• ${c} (${fmt(a)}): cut 25% → save ${fmt(a * 0.25)}/mo\n` })
      const total = cuts.slice(0, 4).reduce((s, [, a]) => s + Math.round(a * 0.25), 0)
      t += `\nTotal potential savings: ${fmt(total)}/month`
      answer = t
    } else if (id === '503020') {
      const inc = metrics.monthIncome || 5000000
      answer = `📊 50/30/20 Budget Plan\n\nBased on your income of ${fmt(inc)}:\n\n🏠 Needs (50%): ${fmt(inc * 0.5)}\n   Rent, Groceries, Utilities, Health\n\n🎉 Wants (30%): ${fmt(inc * 0.3)}\n   Eating Out, Shopping, Coffee\n\n💰 Savings (20%): ${fmt(inc * 0.2)}\n   Goals, Emergency Fund`
    } else if (id === 'coffee') {
      const amt = ce['Coffee'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `☕ ₹0 on Coffee this month — great discipline!\n\n💡 Recommendation: Keep it up! If you ever start buying coffee out, set a ₹300/month limit on the Budget page.`
      if (pct > 8) answer = `☕ High Coffee Spending!\n\n${fmt(amt)} (${pct}% of expenses)\n\nHome brewing 4×/week could save ~${fmt(amt * 0.7 * 12)}/year!`
      else answer = `☕ Coffee: ${fmt(amt)} (${pct}%) — moderate and healthy!`
    } else if (id === 'budget') {
      try {
        const stored = localStorage.getItem('expense-tracker-budgets')
        if (!stored) return `📋 No budgets set yet.\n\n💡 Recommendation: Go to the Budget page and set limits for at least 3 categories. Start with Eating Out, Shopping, and your biggest expense.`
        const budgets = JSON.parse(stored)
        const active = Object.entries(budgets).filter(([, b]) => b.limit > 0)
        if (!active.length) return `📋 All limits are ₹0.\n\n💡 Recommendation: Go to Budget page → click Edit on any category to set a limit.`
        let t = `📋 Your Budget Limits:\n\n`
        active.forEach(([cat, b]) => {
          const spent = ce[cat] || 0, pct = Math.round((spent / b.limit) * 100)
          t += `${spent > b.limit ? '🔴' : pct >= 80 ? '🟡' : '🟢'} ${cat}: ${fmt(spent)} / ${fmt(b.limit)} (${pct}%)\n`
        })
        answer = t
      } catch { return `📋 Could not read budget data.` }
    } else if (id === 'goals') {
      if (!goals.length) return `🎯 No goals yet!\n\n💡 Recommendation: Go to Savings Goals → create your first goal! Try "Emergency Fund" with a target of ${fmt(metrics.monthExpense * 3)} (3 months of expenses).`
      let t = `🎯 Your Savings Goals:\n\n`
      goals.forEach(g => {
        const pct = Math.round((g.currentAmountCents / g.targetAmountCents) * 100)
        t += `${pct >= 100 ? '✅' : pct >= 50 ? '🔄' : '🎯'} ${g.title}: ${pct}%\n`
      })
      answer = t
    } else if (id === 'groceries') {
      const amt = ce['Groceries'] || 0
      const pct = Math.round((amt / (metrics.monthExpense || 1)) * 100)
      if (!amt) return `🛒 No grocery expenses logged this month.\n\n💡 Recommendation: Log supermarket visits under "Groceries" category to track food spending accurately.`
      answer = `🛒 Groceries: ${fmt(amt)} (${pct}%)\n\n${pct > 30 ? '⚠️ Above 30%. Meal planning can help.' : '✅ Healthy grocery spending!'}`
    } else {
      // Free text
      const q = (freeText || '').toLowerCase()
      const catKw = {
        'Eating Out': ['eating', 'restaurant', 'food', 'dine', 'lunch', 'dinner', 'swiggy', 'zomato'],
        Coffee: ['coffee', 'cafe', 'espresso', 'starbucks', 'tea'],
        Groceries: ['grocer', 'supermarket', 'vegetable', 'milk'],
        Shopping: ['shopping', 'clothes', 'amazon', 'mall'],
        Taxi: ['taxi', 'uber', 'ola', 'cab', 'ride'],
        Rent: ['rent', 'lease', 'flat', 'apartment'],
        Utilities: ['utility', 'bill', 'electricity', 'internet', 'wifi'],
        Gym: ['gym', 'fitness', 'workout'],
        Health: ['health', 'doctor', 'medicine', 'hospital'],
      }
      for (const [cat, kws] of Object.entries(catKw)) {
        if (kws.some(k => q.includes(k))) {
          const amt = ce[cat] || 0
          answer = `You spent ${fmt(amt)} on ${cat} this month.${!amt ? '\n\nNo entries logged yet.' : ''}`
          break
        }
      }
      if (!answer) {
        if (q.includes('balance') || q.includes('summary') || q.includes('net')) return generateResponse('summary')
        if (q.includes('income') || q.includes('salary')) return generateResponse('income')
        if (q.includes('save') || q.includes('saving')) return generateResponse('save')
        if (q.includes('budget')) return generateResponse('budget')
        if (q.includes('goal')) return generateResponse('goals')
        if (q.includes('cut') || q.includes('reduc')) return generateResponse('reduce')
        if (q.includes('top') || q.includes('most') || q.includes('biggest')) return generateResponse('topcat')
        if (q.includes('50') || q.includes('plan')) return generateResponse('503020')
        return `I didn't catch that 🤔\n\nTry:\n• "How much on Eating Out?"\n• "What's my income?"\n• "Where can I cut expenses?"`
      }
    }

    // Append recommendation to every answer
    const rec = getRecommendation(id)
    return `${answer}\n\n─────────────────\n${rec}`
  }

  function sendMessage(chipId, chipLabel) {
    const userText = chipId ? chipLabel : input.trim()
    if (!userText) return
    setInput('')
    setMessages(prev => [...prev, { from: 'user', text: userText }])
    setTyping(true)
    setTimeout(() => {
      const reply = generateResponse(chipId || 'custom', chipId ? '' : userText)
      setMessages(prev => [...prev, { from: 'ai', text: reply }])
      setTyping(false)
      if (!open) setUnread(u => u + 1)
    }, 600)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(null, null) }
  }

  return (
    <>
      {/* ── Floating Bubble Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#207561] text-white shadow-xl shadow-[#207561]/40 flex items-center justify-center cursor-pointer hover:bg-[#1b6351] hover:scale-105 active:scale-95 transition-all duration-200"
        title="Chat with Spark AI"
      >
        {open ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat Panel ── */}
      {open && (
        <div className="fixed bottom-24 right-0 sm:right-6 z-50 w-full sm:w-[340px] max-w-[calc(100vw-32px)] sm:max-w-none max-h-[520px] flex flex-col rounded-3xl shadow-2xl shadow-black/20 border border-slate-100 dark:border-[#22223a] bg-white dark:bg-[#16162a] overflow-hidden mx-4 sm:mx-0"
          style={{ animation: 'sparkSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>

          <style>{`
            @keyframes sparkSlideUp {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-[#207561] flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base flex-shrink-0">✨</div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-sm text-white leading-tight">Spark AI</div>
              <div className="text-[10px] text-white/65 font-medium">Your finance coach</div>
            </div>
            <button
              onClick={() => setMessages([{ from: 'ai', text: "Hi! I'm Spark ✨\n\nAsk me anything about your finances!" }])}
              className="text-white/60 hover:text-white text-[10px] font-bold cursor-pointer bg-transparent border-none"
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#207561]/10 dark:bg-[#207561]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">✨</div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line font-medium ${
                  m.from === 'user'
                    ? 'bg-[#207561] text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-[#0f0f1e] text-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#207561]/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">✨</div>
                <div className="bg-slate-100 dark:bg-[#0f0f1e] rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#207561] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Chips */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0 border-t border-slate-100 dark:border-[#22223a]">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip.id}
                onClick={() => sendMessage(chip.id, chip.label)}
                className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-[#22223a] text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0f0f1e] hover:bg-[#207561] hover:text-white hover:border-[#207561] transition-all duration-150 cursor-pointer whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything…"
              className="flex-1 text-sm font-medium border border-slate-200 dark:border-[#22223a] rounded-2xl px-3.5 py-2.5 outline-none focus:border-[#207561] bg-slate-50 dark:bg-[#0f0f1e] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all"
            />
            <button
              onClick={() => sendMessage(null, null)}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-2xl bg-[#207561] text-white flex items-center justify-center cursor-pointer hover:bg-[#1b6351] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-md shadow-[#207561]/20"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
