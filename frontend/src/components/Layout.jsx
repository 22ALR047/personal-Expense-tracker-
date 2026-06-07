import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/transactions',
    label: 'Transactions',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },

  {
    path: '/budget',
    label: 'Budget',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },

  {
    path: '/goals',
    label: 'Savings Goals',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function Layout({ currentUser, onLogout, isDark, setIsDark, transactions = [] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  function triggerAdd() {
    if (location.pathname !== '/transactions') navigate('/transactions')
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-add-transaction')), 100)
  }

  const pageLabel = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard'

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-6 py-7 pb-5 border-b border-white/20">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="#207561" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div>
          <div className="text-base font-extrabold text-white leading-tight tracking-tight">Expenso</div>
          <div className="text-[10px] font-medium text-white/65">Tracker</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
              ${location.pathname.startsWith(item.path)
                ? 'bg-white/25 text-white font-bold shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            <span className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        {/* Mobile-only prominent Add Entry CTA */}
        <div className="px-3.5 py-2 mt-2 lg:hidden flex-shrink-0">
          <button
            onClick={() => {
              setMobileOpen(false)
              triggerAdd()
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#207561] hover:bg-slate-100 rounded-xl text-sm font-bold shadow-sm transition-all duration-150 cursor-pointer"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </button>
        </div>
      </nav>

      {currentUser && (
        <div className="px-3 py-4 border-t border-white/15">
          <div className="flex items-center gap-2.5 px-3.5 pb-2">
            <div className="w-[34px] h-[34px] rounded-full bg-white/30 flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-white/55 truncate">{currentUser.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:bg-red-500/20 hover:text-red-400 transition-all duration-150 cursor-pointer"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'dark' : ''} bg-[#eef2f7] dark:bg-[#080d18] text-slate-900 dark:text-slate-100`}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#207561] text-white sticky top-0 h-screen flex-shrink-0 shadow-[0_20px_60px_rgba(32,117,97,0.15)]">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#207561] px-5 py-3.5 flex items-center justify-between text-white shadow-lg shadow-[#207561]/10">
        <span className="text-base font-extrabold tracking-tight text-white">Expenso Tracker</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerAdd}
            className="p-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer flex items-center justify-center"
            title="Add Entry"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIsDark(v => !v)}
            className="p-1 rounded-xl text-white/80 hover:text-white cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button className="text-white p-1 cursor-pointer" onClick={() => setMobileOpen(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-[22px] h-[22px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#207561] flex flex-col animate-slide-in-left text-white">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pt-0 pt-14 h-full overflow-hidden">
        {/* Top Bar */}
        <div className="hidden lg:flex bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 px-8 h-16 items-center justify-between flex-shrink-0 sticky top-0 z-10 shadow-sm">
          <div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{pageLabel}</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Welcome back, {currentUser?.name?.split(' ')[0]}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDark(v => !v)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 cursor-pointer"
              title="Toggle theme"
            >
              {isDark ? (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={triggerAdd}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#207561] text-white border-none rounded-full text-sm font-semibold cursor-pointer shadow-md shadow-[#207561]/15 hover:bg-[#1b6351] hover:shadow-lg transition-all duration-150"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Entry
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-5 pb-24 sm:pb-8 sm:p-7 lg:p-8 overflow-y-auto bg-[#eef2f7] dark:bg-[#080d18]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
