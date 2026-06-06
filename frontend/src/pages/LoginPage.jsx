import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

/* ─────────────────────────── STYLES ─────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.lp-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  font-family: 'Inter', system-ui, sans-serif;
  background:
    radial-gradient(circle at top right, rgba(32, 117, 97, 0.08), transparent 30%),
    radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
  overflow: hidden;
}

/* ── Left illustration pane ── */
.lp-left {
  width: 48%;
  min-height: 100vh;
  flex-shrink: 0;
  position: relative;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.88));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* left accent removed */

.lp-left-circle {
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18px 60px rgba(2, 6, 23, 0.28);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.lp-left-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  border-radius: 50%;
}

.lp-left-blob {
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.16) 0%, transparent 70%);
  top: -80px; left: -80px;
  z-index: 1;
}

/* ── Right form pane ── */
.lp-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
}

.lp-box {
  width: 100%;
  max-width: 400px;
}

.lp-heading { margin-bottom: 36px; }
.lp-heading h1 {
  font-size: 40px;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 10px;
  letter-spacing: -1px;
  font-family: 'Sora', 'Inter', sans-serif;
}
.lp-heading p {
  font-size: 14px;
  color: #475569;
  line-height: 1.65;
  margin: 0;
}

.lp-form { display: flex; flex-direction: column; gap: 14px; }

.lp-field {
  width: 100%;
  padding: 15px 22px;
  font-size: 14px;
  font-family: inherit;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.86);
  border: 1.5px solid transparent;
  border-radius: 9999px;
  outline: none;
  transition: all .2s;
}
.lp-field::placeholder { color: #9ca3af; }
.lp-field:focus {
  background: #fff;
  border-color: #207561;
  box-shadow: 0 0 0 4px rgba(32,117,97,.12);
}

.lp-pw-wrap { position: relative; }
.lp-pw-wrap .lp-field { padding-right: 50px; }
.lp-pw-toggle {
  position: absolute; right: 18px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: #94a3b8; display: flex; align-items: center;
  padding: 0; transition: color .2s;
}
.lp-pw-toggle:hover { color: #207561; }

.lp-row {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.lp-remember {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 13px; color: #475569; font-weight: 500;
}
.lp-remember input { accent-color: #207561; width: 15px; height: 15px; cursor: pointer; }
.lp-forgot {
  font-size: 13px; font-weight: 700; color: #207561;
  background: none; border: none; cursor: pointer;
  font-family: inherit; padding: 0;
}
.lp-forgot:hover { text-decoration: underline; }

/* ── Forgot Password Modal Styles ── */
.fpm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fpm-fadein 0.25s ease-out;
}
@keyframes fpm-fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fpm-container {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(2, 6, 23, 0.18);
  position: relative;
  font-family: 'Inter', system-ui, sans-serif;
  animation: fpm-slideup 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes fpm-slideup {
  from { transform: translateY(24px) scale(0.96); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.fpm-header {
  padding: 32px 32px 16px;
  position: relative;
}
.fpm-close {
  position: absolute;
  top: 24px; right: 24px;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
  z-index: 10;
}
.fpm-close:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.fpm-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  font-family: 'Sora', 'Inter', sans-serif;
}
.fpm-subtitle {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}
.fpm-body {
  padding: 0 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fpm-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fpm-hint {
  font-size: 13px;
  color: #0f766e;
  background: rgba(15, 118, 110, 0.08);
  border-radius: 12px;
  padding: 10px 14px;
  line-height: 1.5;
  font-weight: 500;
}
.fpm-success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(32, 117, 97, 0.1);
  color: #207561;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px auto 16px;
}

.lp-error {
  background: #fef2f2; border: 1px solid #fecaca;
  color: #dc2626; border-radius: 12px;
  padding: 11px 16px; font-size: 13px; font-weight: 500;
}

.lp-submit {
  width: 100%; padding: 16px;
  font-size: 16px; font-weight: 800;
  color: #fff; background: linear-gradient(135deg, #0f172a, #207561);
  border: none; border-radius: 9999px;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 4px 14px rgba(32,117,97,.25);
  transition: all .2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 8px;
}
.lp-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #0b1220, #207561);
  box-shadow: 0 6px 18px rgba(15, 23, 42,.22);
}
.lp-submit:active:not(:disabled) { transform: scale(.98); }
.lp-submit:disabled { opacity: .7; cursor: not-allowed; }

.lp-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: lp-spin .75s linear infinite;
}
@keyframes lp-spin { to { transform: rotate(360deg); } }

.lp-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 20px 0;
}
.lp-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
.lp-divider-text {
  font-size: 11px; font-weight: 700;
  color: #9ca3af; text-transform: uppercase; letter-spacing: .5px;
}

.lp-socials { display: flex; justify-content: center; gap: 16px; }
.lp-social-btn {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.9); border: 1.5px solid rgba(15, 23, 42, 0.08);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .2s;
}
.lp-social-btn:hover {
  border-color: #207561;
  box-shadow: 0 2px 10px rgba(32,117,97,.12);
  transform: translateY(-2px);
}

.lp-footer {
  text-align: center; font-size: 14px;
  color: #6b7280; font-weight: 500; margin-top: 24px;
}
.lp-footer a {
  color: #207561; font-weight: 800;
  text-decoration: underline;
}
.lp-footer a:hover { color: #1b6351; }

@media (max-width: 900px) {
  .lp-page {
    flex-direction: column;
    overflow-y: auto;
  }
  .lp-left {
    width: 100%;
    min-height: auto;
    background: transparent;
    display: flex;
    justify-content: center;
    padding: 40px 24px 0;
  }
  .lp-left-circle {
    width: 150px;
    height: 150px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  }
  .lp-left-blob {
    display: none;
  }
  .lp-right {
    padding: 24px 24px 40px;
  }
}
`

/* ─────────────────────────── ICONS / ILLUSTRATIONS ─────────────────────────── */


const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const EyeIcon = () => (
  <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
  </svg>
)

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotShowPw, setForgotShowPw] = useState(false)
  const [forgotShowConfirmPw, setForgotShowConfirmPw] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Reset Form, 2: Success
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleForgotSubmit(e) {
    e.preventDefault()
    if (!forgotEmail || !forgotNewPassword || !forgotConfirmPassword) {
      setForgotError('Please fill in all fields.')
      return
    }
    const isStrong = forgotNewPassword.length >= 8 &&
                     /[A-Z]/.test(forgotNewPassword) &&
                     /[a-z]/.test(forgotNewPassword) &&
                     /[0-9]/.test(forgotNewPassword) &&
                     /[^A-Za-z0-9]/.test(forgotNewPassword)
    if (!isStrong) {
      setForgotError('Please enter a strong password with symbols, numbers, uppercase, and lowercase letters (min. 8 characters).')
      return
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.')
      return
    }
    setForgotError('')
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setForgotStep(2)
    } catch (err) {
      setForgotError(err.message)
    } finally {
      setForgotLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid credentials. Please try again.')
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
      <style>{css}</style>
      <div className="lp-page">

        {/* ── LEFT: illustration ── */}
        <div className="lp-left">
          <div className="lp-left-blob" />
          <div className="lp-left-circle">
            <img
              src="/images/peeking_man.png"
              alt="Peeking illustration"
              className="lp-left-img"
            />
          </div>
        </div>

        {/* ── RIGHT: form ── */}
        <div className="lp-right">
          <div className="lp-box">
            <div className="lp-heading">
              <h1>Log in</h1>
              <p>Hello, friend! I&apos;m Expenso Tracker — a simpler way to track money with confidence.</p>
            </div>

            <form onSubmit={handleSubmit} className="lp-form" noValidate>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="lp-field"
                required
              />

              <div className="lp-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="lp-field"
                  required
                />
                <button type="button" className="lp-pw-toggle" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide' : 'Show'}>
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="lp-row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="lp-forgot"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotEmail('');
                    setForgotNewPassword('');
                    setForgotConfirmPassword('');
                    setForgotShowPw(false);
                    setForgotShowConfirmPw(false);
                    setForgotError('');
                    setShowForgotModal(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>

              {error && <div className="lp-error">⚠️ {error}</div>}

              <button type="submit" disabled={loading} className="lp-submit">
                {loading && <span className="lp-spinner" />}
                Let&apos;s start!
              </button>
            </form>

            <p className="lp-footer">
              Don&apos;t have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>

      </div>

      {showForgotModal && (
        <div className="fpm-overlay" onClick={() => {
          setShowForgotModal(false);
          setForgotEmail('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotShowPw(false);
          setForgotShowConfirmPw(false);
          setForgotError('');
          setForgotStep(1);
        }}>
          <div className="fpm-container" onClick={e => e.stopPropagation()}>
            <button className="fpm-close" onClick={() => {
              setShowForgotModal(false);
              setForgotEmail('');
              setForgotNewPassword('');
              setForgotConfirmPassword('');
              setForgotShowPw(false);
              setForgotShowConfirmPw(false);
              setForgotError('');
              setForgotStep(1);
            }} aria-label="Close">
              ✕
            </button>

            {forgotStep === 1 && (
              <>
                <div className="fpm-header">
                  <h2 className="fpm-title">Reset Password</h2>
                  <p className="fpm-subtitle">Enter your email and a new password to directly update your account.</p>
                </div>
                <div className="fpm-body">
                  <form onSubmit={handleForgotSubmit} className="fpm-form" noValidate>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="lp-field"
                      required
                    />

                    <div className="lp-pw-wrap">
                      <input
                        type={forgotShowPw ? 'text' : 'password'}
                        placeholder="New Password"
                        value={forgotNewPassword}
                        onChange={e => setForgotNewPassword(e.target.value)}
                        className="lp-field"
                        required
                      />
                      <button type="button" className="lp-pw-toggle" onClick={() => setForgotShowPw(v => !v)}
                        aria-label={forgotShowPw ? 'Hide' : 'Show'}>
                        {forgotShowPw ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    <div className="lp-pw-wrap">
                      <input
                        type={forgotShowConfirmPw ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={forgotConfirmPassword}
                        onChange={e => setForgotConfirmPassword(e.target.value)}
                        className="lp-field"
                        required
                      />
                      <button type="button" className="lp-pw-toggle" onClick={() => setForgotShowConfirmPw(v => !v)}
                        aria-label={forgotShowConfirmPw ? 'Hide' : 'Show'}>
                        {forgotShowConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    {forgotError && <div className="lp-error">⚠️ {forgotError}</div>}
                    <button type="submit" className="lp-submit" disabled={forgotLoading}>
                      {forgotLoading && <span className="lp-spinner" />}
                      Update Password
                    </button>
                  </form>
                </div>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <div className="fpm-header" style={{ textAlign: 'center' }}>
                  <div className="fpm-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="fpm-title">Password Updated</h2>
                  <p className="fpm-subtitle">Your password has been successfully updated in the system.</p>
                </div>
                <div className="fpm-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="fpm-hint" style={{ background: 'rgba(32, 117, 97, 0.08)', color: '#207561', textAlign: 'center' }}>
                    ✅ Your password was directly updated in the database. You can now use your new credentials to log in.
                  </div>

                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                      setForgotEmail('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotShowPw(false);
                      setForgotShowConfirmPw(false);
                      setForgotError('');
                    }}
                    className="lp-submit"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
