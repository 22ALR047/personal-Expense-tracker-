import { useState, useMemo, useEffect } from 'react'

const EXPENSE_CATEGORIES = ['Groceries', 'Eating Out', 'Transport', 'Shopping', 'Utilities', 'Rent', 'Entertainment', 'Other']
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Other']
const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])]

const EMOJI = { 
  // Simplified categories
  Groceries: '🛒', 
  'Eating Out': '🍽️', 
  Transport: '🚗', 
  Shopping: '🛍️', 
  Utilities: '💡', 
  Rent: '🏠', 
  Entertainment: '🎭', 
  Salary: '💼', 
  Freelance: '💻', 
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

const AUTO_CATEGORIES = {
  'grocery': 'Groceries', 'groceries': 'Groceries', 'supermarket': 'Groceries', 'walmart': 'Groceries', 'target': 'Groceries', 'milk': 'Groceries', 'vegetables': 'Groceries', 'fruits': 'Groceries', 'food hall': 'Groceries',
  'restaurant': 'Eating Out', 'dinner': 'Eating Out', 'lunch': 'Eating Out', 'breakfast': 'Eating Out', 'mcdonald': 'Eating Out', 'burger': 'Eating Out', 'pizza': 'Eating Out', 'kfc': 'Eating Out', 'subway': 'Eating Out', 'domino': 'Eating Out',
  'uber': 'Transport', 'lyft': 'Transport', 'cab': 'Transport', 'taxi': 'Transport', 'ola': 'Transport', 'ride': 'Transport', 'train': 'Transport', 'bus': 'Transport',
  'starbucks': 'Eating Out', 'coffee': 'Eating Out', 'cafe': 'Eating Out', 'espresso': 'Eating Out', 'tea': 'Eating Out', 'dunkin': 'Eating Out',
  'amazon': 'Shopping', 'clothing': 'Shopping', 'shoes': 'Shopping', 'mall': 'Shopping', 'clothes': 'Shopping', 'zara': 'Shopping', 'hm': 'Shopping',
  'apple': 'Shopping', 'phone': 'Shopping', 'laptop': 'Shopping', 'charger': 'Shopping', 'software': 'Shopping', 'best buy': 'Shopping', 'gadget': 'Shopping',
  'electricity': 'Utilities', 'water bill': 'Utilities', 'internet': 'Utilities', 'wifi': 'Utilities', 'gas': 'Utilities', 'netflix': 'Entertainment', 'spotify': 'Entertainment', 'youtube premium': 'Entertainment', 'bill': 'Utilities', 'utility': 'Utilities',
  'rent': 'Rent', 'house rent': 'Rent', 'flat rent': 'Rent', 'room rent': 'Rent', 'lease': 'Rent',
  'gym': 'Entertainment', 'workout': 'Entertainment', 'fitness': 'Entertainment', 'exercise': 'Entertainment', 'cult': 'Entertainment',
  'doctor': 'Other', 'hospital': 'Other', 'medicine': 'Other', 'pharmacy': 'Other', 'dentist': 'Other', 'insurance': 'Other',
  'book': 'Other', 'books': 'Other', 'course': 'Other', 'tuition': 'Other', 'school': 'Other', 'college': 'Other',
  'petrol': 'Transport', 'diesel': 'Transport', 'gas station': 'Transport', 'fuel': 'Transport', 'shell': 'Transport',
  'salary': 'Salary', 'paycheck': 'Salary', 'dividend': 'Salary',
  'freelance': 'Freelance', 'upwork': 'Freelance', 'fiverr': 'Freelance', 'project': 'Freelance', 'consulting': 'Freelance'
}

function fmt(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}


export default function TransactionsPage({ transactions = [], loading, handleAdd, handleUpdate, handleDelete }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title:'', amount:'', category:'Groceries', type:'expense', description:'' })
  const [editId, setEditId] = useState(null)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  function clearFilters() {
    setCatFilter('all')
    setStartDate('')
    setEndDate('')
    setSearch('')
    setFilter('all')
  }

  useEffect(() => {
    const fn = () => { resetForm(); setModal(true) }
    window.addEventListener('open-add-transaction', fn)
    return () => window.removeEventListener('open-add-transaction', fn)
  }, [])

  function resetForm() {
    setForm({ title:'', amount:'', category:'Groceries', type:'expense', description:'' })
    setEditId(null); setErr('')
  }

  function handleTitleChange(val) {
    setForm(p => {
      const updated = { ...p, title: val }
      const lower = val.toLowerCase()
      for (const [key, cat] of Object.entries(AUTO_CATEGORIES)) {
        if (lower.includes(key)) {
          updated.category = cat
          if (cat === 'Salary' || cat === 'Freelance') {
            updated.type = 'income'
          } else {
            updated.type = 'expense'
          }
          break
        }
      }
      return updated
    })
  }

  function exportCSV() {
    if (transactions.length === 0) return
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
    link.setAttribute("download", `expenso_transactions_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function openEdit(t) {
    setEditId(t.id)
    let category = t.category
    const list = t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    if (!list.includes(category)) {
      if (category === 'Coffee' || category === 'Eating Out') category = 'Eating Out'
      else if (category === 'Taxi' || category === 'Fuel') category = 'Transport'
      else if (category === 'Electronics' || category === 'Shopping') category = 'Shopping'
      else if (category === 'Gym' || category === 'Education') category = 'Entertainment'
      else category = 'Other'
    }
    setForm({ title:t.title, amount:(t.amountCents/100).toString(), category, type:t.type, description:t.description||'' })
    setErr(''); setModal(true)
  }

  async function submit(e) {
    e.preventDefault(); setErr('')
    if (!form.title.trim()) { setErr('Title is required'); return }
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) { setErr('Enter a valid amount'); return }
    setSaving(true)
    try {
      const payload = { title:form.title.trim(), category:form.category, type:form.type, amountCents:Math.round(amt*100), description:form.description }
      if (editId) await handleUpdate(editId, payload)
      else await handleAdd(payload)
      setModal(false); resetForm()
    } catch(ex) { setErr(ex.message) }
    finally { setSaving(false) }
  }

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (filter !== 'all') list = list.filter(t => t.type === filter)
    if (catFilter !== 'all') list = list.filter(t => t.category === catFilter)
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      list = list.filter(t => new Date(t.createdAt) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      list = list.filter(t => new Date(t.createdAt) <= end)
    }
    if (search) {
      list = list.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      )
    }
    return list.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
  }, [transactions, filter, catFilter, startDate, endDate, search])

  const totals = useMemo(() => {
    return filtered.reduce((a,t) => {
      if(t.type==='income') a.income += t.amountCents
      else a.expense += t.amountCents
      return a
    }, {income:0, expense:0})
  }, [filtered])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {/* Header + Search */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',gap:8}}>
          {['all','income','expense'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={
              filter===f
                ? 'bg-[#207561] text-white'
                : 'bg-[#fff] text-[#6b7280] dark:bg-[#16162a] dark:text-slate-400 dark:border dark:border-[#22223a]'
            } style={{
              padding:'7px 18px',borderRadius:9999,border:'none',cursor:'pointer',
              fontWeight:700,fontSize:12,fontFamily:'inherit',
              boxShadow:'0 1px 4px rgba(0,0,0,0.07)',transition:'all .15s'
            }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button onClick={exportCSV} className="bg-[#fff] text-[#475569] border-[#e5e7eb] dark:bg-[#16162a] dark:text-slate-300 dark:border-[#22223a]" style={{
            padding:'8px 14px',borderRadius:10,borderWidth:'1.5px',borderStyle:'solid',fontSize:13,fontFamily:'inherit',
            cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:6,
            boxShadow:'0 1px 4px rgba(0,0,0,0.05)',transition:'all 0.15s'
          }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>


          <div style={{position:'relative',width:'100%',maxWidth:220}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"
              className="bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#16162a] dark:text-slate-200 dark:border-slate-600" style={{width:'100%',padding:'9px 14px 9px 36px',borderRadius:10,borderWidth:'1.5px',borderStyle:'solid',fontSize:13,fontFamily:'inherit',outline:'none'}} />
            <svg style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',opacity:.4}} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style={{
        borderRadius: 18,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full sm:w-auto">
          {/* Category Selector */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category Filter</span>
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                borderWidth: '1.5px',
                borderStyle: 'solid',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer',
                minWidth: 150
              }}
            >
              <option value="all">All Categories</option>
              {(filter === 'income' ? INCOME_CATEGORIES : filter === 'expense' ? EXPENSE_CATEGORIES : ALL_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Start Date Picker */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full sm:w-auto bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600 dark:[color-scheme:dark]"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                borderWidth: '1.5px',
                borderStyle: 'solid',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>

          {/* End Date Picker */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full sm:w-auto bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600 dark:[color-scheme:dark]"
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                borderWidth: '1.5px',
                borderStyle: 'solid',
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(catFilter !== 'all' || startDate !== '' || endDate !== '' || search !== '' || filter !== 'all') && (
          <button
            onClick={clearFilters}
            className="w-full sm:w-auto bg-[#fee2e2] text-[#dc2626] dark:bg-red-950/20 dark:text-red-400"
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a]" style={{borderRadius:18,boxShadow:'0 1px 6px rgba(0,0,0,0.06)',padding:'16px 20px',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{width:40,height:40,borderRadius:12,background:'#e8f5f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>💰</div>
          <div><div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>Income</div>
          <div style={{fontSize:20,fontWeight:900,color:'#207561'}}>{fmt(totals.income)}</div></div>
        </div>
        <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a]" style={{borderRadius:18,boxShadow:'0 1px 6px rgba(0,0,0,0.06)',padding:'16px 20px',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{width:40,height:40,borderRadius:12,background:'#fff0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>💸</div>
          <div><div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>Expense</div>
          <div style={{fontSize:20,fontWeight:900,color:'#ef4444'}}>{fmt(totals.expense)}</div></div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a]" style={{borderRadius:18,boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'#9ca3af',fontSize:13}}>Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:48,textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>📭</div>
            <div className="dark:text-slate-200" style={{fontWeight:700,fontSize:14}}>No transactions found</div>
            <div style={{color:'#9ca3af',fontSize:12,marginTop:4}}>Add your first entry using the "Add Entry" button above</div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,minWidth:650}}>
                <thead>
                  <tr className="dark:border-slate-700" style={{borderBottom:'1.5px solid #f3f4f6'}}>
                    {['Transaction','Category','Type','Date','Amount','Actions'].map(h=>(
                      <th key={h} style={{padding:'14px 20px',textAlign:h==='Amount'||h==='Actions'?'right':'left',fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t,i) => (
                      <tr key={t.id} className="dark:border-slate-800/50" style={{borderBottom:i<filtered.length-1?'1px solid #f9fafb':'none',transition:'background .1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'13px 20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div className={t.type==='income'?'dark:bg-green-950/40':'dark:bg-red-950/40'} style={{width:36,height:36,borderRadius:10,background:t.type==='income'?'#e8f5f0':'#fff0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                            {EMOJI[t.category]||'📌'}
                          </div>
                          <div>
                            <div className="dark:text-slate-200" style={{fontWeight:700,fontSize:13}}>{t.title}</div>
                            {t.description && <div style={{fontSize:11,color:'#9ca3af'}}>{t.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'13px 20px'}}><span className="bg-[#f3f4f6] text-[#374151] dark:bg-slate-800 dark:text-slate-300" style={{padding:'4px 10px',borderRadius:9999,fontSize:11,fontWeight:600}}>{t.category}</span></td>
                      <td style={{padding:'13px 20px'}}><span className={t.type==='income'?'bg-[#dcfce7] text-[#166534] dark:bg-green-900/40 dark:text-green-400':'bg-[#fee2e2] text-[#991b1b] dark:bg-red-900/40 dark:text-red-400'} style={{padding:'4px 10px',borderRadius:9999,fontSize:11,fontWeight:700}}>{t.type}</span></td>
                      <td className="dark:text-slate-400" style={{padding:'13px 20px',fontSize:12}}>{fmtDate(t.createdAt)}</td>
                      <td style={{padding:'13px 20px',textAlign:'right',fontWeight:800,fontSize:14,color:t.type==='income'?'#207561':'#ef4444'}}>
                        {t.type==='income'?'+':'-'}{fmt(t.amountCents)}
                      </td>
                      <td style={{padding:'13px 20px',textAlign:'right'}}>
                        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                          <button onClick={()=>openEdit(t)} className="bg-[#fff] text-[#374151] border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-300 dark:border-slate-600" style={{padding:'5px 12px',borderRadius:8,borderWidth:1,borderStyle:'solid',cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit'}}>Edit</button>
                          <button onClick={()=>setDeleteId(t.id)} style={{padding:'5px 12px',borderRadius:8,border:'none',background:'#fee2e2',cursor:'pointer',fontSize:11,fontWeight:700,color:'#dc2626',fontFamily:'inherit'}}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
              {filtered.map((t) => (
                <div key={t.id} className="p-4 flex flex-col gap-3">
                  {/* Header: Title and Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${t.type==='income'?'bg-emerald-50 text-emerald-600 dark:bg-green-950/40':'bg-red-50 text-red-500 dark:bg-red-950/40'}`}>
                        {EMOJI[t.category]||'📌'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{fmtDate(t.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black shrink-0 ${t.type==='income'?'text-[#207561]':'text-red-500'}`}>
                      {t.type==='income'?'+':'-'}{fmt(t.amountCents)}
                    </span>
                  </div>

                  {/* Description Note if exists */}
                  {t.description && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 px-3 py-2 rounded-xl border border-slate-100/50 dark:border-slate-800/10">
                      {t.description}
                    </p>
                  )}

                  {/* Footer Badges and Actions */}
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <div className="flex gap-2">
                      <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">{t.category}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${t.type==='income'?'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400':'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>{t.type}</span>
                    </div>

                    <div className="flex gap-2.5">
                      <button 
                        onClick={() => openEdit(t)} 
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800/60 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteId(t.id)} 
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
          <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a]" style={{borderRadius:20,padding:32,width:340,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}}>
            <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
            <div className="dark:text-slate-200" style={{fontWeight:800,fontSize:16,marginBottom:8}}>Delete Transaction?</div>
            <div style={{color:'#6b7280',fontSize:13,marginBottom:24}}>This action cannot be undone.</div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDeleteId(null)} className="bg-[#fff] text-[#374151] border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-300 dark:border-slate-600" style={{flex:1,padding:'11px',borderWidth:'1.5px',borderStyle:'solid',borderRadius:12,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
              <button onClick={async()=>{await handleDelete(deleteId);setDeleteId(null)}} style={{flex:1,padding:'11px',border:'none',borderRadius:12,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',background:'#dc2626',color:'#fff'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60,padding:20}}>
          <div className="bg-white dark:bg-[#16162a] dark:border dark:border-[#22223a] p-5 sm:p-8" style={{borderRadius:24,width:'100%',maxWidth:460,boxShadow:'0 20px 60px rgba(0,0,0,0.15)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <h2 className="dark:text-slate-200" style={{fontSize:18,fontWeight:900}}>{editId?'Edit':'Add'} Transaction</h2>
              <button onClick={()=>{setModal(false);resetForm()}} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#9ca3af',lineHeight:1}}>✕</button>
            </div>

            {/* Type toggle */}
            <div className="bg-[#f3f4f6] dark:bg-slate-800" style={{display:'flex',borderRadius:12,padding:3,marginBottom:20}}>
              {['expense','income'].map(t=>(
                <button key={t} type="button" onClick={()=>{
                  setForm(p => {
                    const list = t === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
                    const defaultCat = list[0]
                    const category = list.includes(p.category) ? p.category : defaultCat
                    return { ...p, type: t, category }
                  })
                }} style={{
                  flex:1,padding:'9px',borderRadius:10,border:'none',cursor:'pointer',
                  fontWeight:700,fontSize:13,fontFamily:'inherit',transition:'all .15s',
                  background:form.type===t?(t==='income'?'#207561':'#ef4444'):'transparent',
                  color:form.type===t?'#fff':'#6b7280'
                }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
              ))}
            </div>

            <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label className="dark:text-slate-300" style={{fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>Title *</label>
                <input value={form.title} onChange={e=>handleTitleChange(e.target.value)} placeholder="e.g. Coffee at Starbucks"
                  className="bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600" style={{width:'100%',padding:'11px 14px',borderRadius:11,borderWidth:'1.5px',borderStyle:'solid',fontSize:14,fontFamily:'inherit',outline:'none'}} />
              </div>

              <div>
                <label className="dark:text-slate-300" style={{fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>Amount (₹) *</label>
                <input value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0.00" type="number" min="0" step="0.01"
                  className="bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600" style={{width:'100%',padding:'11px 14px',borderRadius:11,borderWidth:'1.5px',borderStyle:'solid',fontSize:14,fontFamily:'inherit',outline:'none'}} />
              </div>

              <div>
                <label className="dark:text-slate-300" style={{fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>Category</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}
                  className="bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600" style={{width:'100%',padding:'11px 14px',borderRadius:11,borderWidth:'1.5px',borderStyle:'solid',fontSize:14,fontFamily:'inherit',outline:'none',cursor:'pointer'}}>
                  {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="dark:text-slate-300" style={{fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>Note (optional)</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Any notes…"
                  className="bg-[#fff] text-slate-700 border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-200 dark:border-slate-600" style={{width:'100%',padding:'11px 14px',borderRadius:11,borderWidth:'1.5px',borderStyle:'solid',fontSize:14,fontFamily:'inherit',outline:'none'}} />
              </div>

              {err && <div className="dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400" style={{padding:'10px 14px',borderRadius:10,fontSize:12,fontWeight:600}}>⚠️ {err}</div>}

              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button type="button" onClick={()=>{setModal(false);resetForm()}} className="bg-[#fff] text-[#374151] border-[#e5e7eb] dark:bg-[#0f0f1e] dark:text-slate-300 dark:border-slate-600" style={{flex:1,padding:'12px',borderWidth:'1.5px',borderStyle:'solid',borderRadius:12,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{flex:1,padding:'12px',border:'none',borderRadius:12,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',background:'#207561',color:'#fff',opacity:saving?.7:1}}>
                  {saving?'Saving…':(editId?'Save Changes':'Add Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
