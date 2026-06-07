import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

.signup-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background:
    radial-gradient(circle at top right, rgba(32, 117, 97, 0.08), transparent 30%),
    radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
  overflow-x: hidden;
}

/* ── Left Pane ── */
.signup-left {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  min-height: 100vh;
  background: transparent;
}

.signup-left-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
}

.signup-heading {
  margin-bottom: 36px;
}

.signup-heading h2 {
  font-size: 40px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
  font-family: 'Sora', 'Inter', sans-serif;
}

.signup-heading p {
  font-size: 14px;
  color: #475569;
  font-weight: 400;
  line-height: 1.6;
  margin: 0;
}

/* ── Form View ── */
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.signup-input-wrapper {
  position: relative;
  width: 100%;
}

.signup-input {
  width: 100%;
  padding: 16px 24px;
  font-size: 14px;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.86);
  border: 1.5px solid transparent;
  border-radius: 9999px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.signup-input::placeholder {
  color: #9ca3af;
}

.signup-input:hover {
  background: #e5e7eb;
}

.signup-input:focus {
  background: #ffffff;
  border-color: #207561;
  box-shadow: 0 0 0 4px rgba(32, 117, 97, 0.12);
}

.signup-input-password {
  padding-right: 52px;
}

.signup-password-toggle {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  color: #94a3b8;
  transition: color 0.2s;
}

.signup-password-toggle:hover {
  color: #207561;
}

.signup-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
}

.signup-submit {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #0f172a, #207561);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(32, 117, 97, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  margin-top: 8px;
  box-sizing: border-box;
}

.signup-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #111827, #207561);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.22);
}

.signup-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.signup-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.signup-submit-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signup-login-link {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
  margin-top: 16px;
}

.signup-login-link a {
  color: #207561;
  font-weight: 700;
  text-decoration: underline;
  transition: color 0.2s;
}

.signup-login-link a:hover {
  color: #1b6351;
}

/* ── Right Pane ── */
.signup-right {
  width: 50%;
  min-height: 100vh;
  background:
    radial-gradient(circle at center, rgba(32, 117, 97, 0.16), transparent 38%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.88));
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.signup-right-illustration {
  width: 80%;
  max-width: 480px;
  height: auto;
  object-fit: contain;
  user-select: none;
  filter: drop-shadow(0 22px 50px rgba(2, 6, 23, 0.3));
}

/* ── Responsive ── */
@media (max-width: 1023px) {
  .signup-page {
    flex-direction: column-reverse;
    overflow-y: auto;
  }
  .signup-right {
    width: 100% !important;
    min-height: auto !important;
    background: transparent !important;
    display: flex !important;
    justify-content: center !important;
    padding: 40px 24px 0 !important;
  }
  .signup-right-illustration {
    width: 150px !important;
    height: 150px !important;
    border-radius: 50% !important;
    background: rgba(255, 255, 255, 0.98) !important;
    border: 1px solid rgba(15, 23, 42, 0.08) !important;
    object-fit: cover !important;
    object-position: center top !important;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12) !important;
  }
  .signup-left {
    min-height: auto !important;
    padding: 24px 24px 40px !important;
  }
}
`

const EyeIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeSlashIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
)

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    const isStrong = password.length >= 8 &&
                     /[A-Z]/.test(password) &&
                     /[a-z]/.test(password) &&
                     /[0-9]/.test(password) &&
                     /[^A-Za-z0-9]/.test(password)
    if (!isStrong) {
      setError('Please enter a strong password with symbols, numbers, uppercase, and lowercase letters (min. 8 characters).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account. Please try again.')
      onLogin(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{cssStyles}</style>

      <div className="signup-page">
        {/* Left pane: Form */}
        <div className="signup-left">
          <div className="signup-left-container">
            <div className="signup-heading">
              <h2>Sign up</h2>
              <p>Hello, friend! I&apos;m Expenso Tracker — a simpler way to track money with confidence.</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form" noValidate autoComplete="off">
              <div className="signup-input-wrapper">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="signup-input"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="signup-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="signup-input"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="signup-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (Min. 8 chars, strong)"
                  className="signup-input signup-input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="signup-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>

              {error && (
                <div className="signup-error">
                  &#9888;&#65039; {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="signup-submit"
              >
                {loading && <span className="signup-submit-spinner" />}
                Create Account
              </button>
            </form>

            <p className="signup-login-link">
              Already have an account?{' '}
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </div>

        {/* Right pane: Waving man illustration */}
        <div className="signup-right">
          <img
            src="/images/waving_man.png"
            alt="Waving illustration"
            className="signup-right-illustration"
          />
        </div>
      </div>
    </>
  )
}
