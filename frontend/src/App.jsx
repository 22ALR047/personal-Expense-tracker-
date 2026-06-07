import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Pages and Layout Components
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BudgetPage from './pages/BudgetPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Onboarding from './pages/Onboarding'
import ResetPasswordPage from './pages/ResetPasswordPage'
import GoalsPage from './pages/GoalsPage'
import SparkChat from './components/SparkChat'

const THEME_KEY = 'expense-tracker-theme'
const AUTH_USER_KEY = 'expense-tracker-user'

function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem(AUTH_USER_KEY)
    return stored ? JSON.parse(stored) : null
  })
  
  // Dark Theme State
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored ? stored === 'dark' : false
  })

  // Fetch transactions (using user-scoped query)
  const fetchTransactions = useCallback(async () => {
    if (!currentUser) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?userId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to retrieve logs')
      const data = await res.json()
      setTransactions(data)
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  // Load transactions on mount or when user changes
  useEffect(() => {
    if (currentUser) {
      fetch('/api/recurring/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.postedCount > 0) {
          fetchTransactions()
        }
      })
      .catch(err => console.error('Error processing recurring templates:', err))
    }
    fetchTransactions()
  }, [fetchTransactions, currentUser])

  // Sync theme to storage AND apply dark class to <html> for Tailwind dark mode
  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Authentication Handlers
  const handleLogin = (user) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    setCurrentUser(user)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_USER_KEY)
    setCurrentUser(null)
    setTransactions([])
  }

  // CRUD API Wrappers
  const handleAddTransaction = async (payload) => {
    if (!currentUser) throw new Error('Unauthorized')
    const userId = currentUser.id
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to insert transaction.')
    }

    const newTxn = await res.json()
    setTransactions((prev) => [newTxn, ...prev])
    return newTxn
  }

  const handleUpdateTransaction = async (id, payload) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update transaction.')
    }

    const updatedTxn = await res.json()
    setTransactions((prev) => prev.map((item) => (item.id === id ? updatedTxn : item)))
    return updatedTxn
  }

  const handleDeleteTransaction = async (id) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete transaction.')
    }

    setTransactions((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth pages */}
        <Route 
          path="/login" 
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage onLogin={handleLogin} />
            )
          } 
        />
        <Route 
          path="/" 
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Onboarding />
            )
          } 
        />
        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        {/* Dashboard Pages wrapped in Layout header tabs */}
        <Route 
          element={
            currentUser ? (
              <Layout 
                isDark={isDark} 
                setIsDark={setIsDark} 
                currentUser={currentUser}
                onLogout={handleLogout}
                transactions={transactions}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route 
            path="/dashboard" 
            element={
              <AnalyticsPage 
                currentUser={currentUser}
                transactions={transactions} 
              />
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <TransactionsPage 
                transactions={transactions} 
                loading={loading}
                handleAdd={handleAddTransaction}
                handleUpdate={handleUpdateTransaction}
                handleDelete={handleDeleteTransaction}
              />
            } 
          />
          <Route 
            path="/budget" 
            element={
              <BudgetPage 
                transactions={transactions} 
              />
            } 
          />
          <Route 
            path="/goals" 
            element={
              <GoalsPage 
                currentUser={currentUser}
              />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                currentUser={currentUser}
                transactions={transactions}
                isDark={isDark}
                setIsDark={setIsDark}
              />
            } 
          />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {currentUser && <SparkChat currentUser={currentUser} transactions={transactions} />}
    </BrowserRouter>
  )
}

export default App
