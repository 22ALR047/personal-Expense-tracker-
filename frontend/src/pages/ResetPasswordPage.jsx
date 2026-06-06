import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

/* ─────────────────────────── STYLES ─────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.rp-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', system-ui, sans-serif;
  background:
    radial-gradient(circle at top right, rgba(32, 117, 97, 0.08), transparent 30%),
    radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
  padding: 20px;
}

.rp-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 24px 64px rgba(2, 6, 23, 0.12);
  padding: 40px 32px;
  animation: rp-slideup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes rp-slideup {
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.rp-heading {
  margin-bottom: 32px;
  text-align: center;
}
.rp-heading h1 {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
  letter-spacing: -0.75px;
  font-family: 'Sora', 'Inter', sans-serif;
}
.rp-heading p {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.rp-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rp-field {
  width: 100%;
  padding: 15px 22px;
  font-size: 14px;
  font-family: inherit;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.9);
  border: 1.5px solid rgba(15, 23, 42, 0.08);
  border-radius: 9999px;
  outline: none;
  transition: all .2s;
}
.rp-field::placeholder { color: #9ca3af; }
.rp-field:focus {
  background: #fff;
  border-color: #207561;
  box-shadow: 0 0 0 4px rgba(32,117,97,.12);
}

.rp-pw-wrap { position: relative; }
.rp-pw-wrap .rp-field { padding-right: 50px; }
.rp-pw-toggle {
  position: absolute; right: 18px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: #94a3b8; display: flex; align-items: center;
  padding: 0; transition: color .2s;
}
.rp-pw-toggle:hover { color: #207561; }

.rp-error {
  background: #fef2f2; border: 1px solid #fecaca;
  color: #dc2626; border-radius: 12px;
  padding: 11px 16px; font-size: 13px; font-weight: 500;
  text-align: center;
}

.rp-submit {
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
.rp-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #0b1220, #207561);
  box-shadow: 0 6px 18px rgba(15, 23, 42,.22);
}
.rp-submit:active:not(:disabled) { transform: scale(.98); }
.rp-submit:disabled { opacity: .7; cursor: not-allowed; }

.rp-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rp-spin .75s linear infinite;
}
@keyframes rp-spin { to { transform: rotate(360deg); } }

.rp-success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(32, 117, 97, 0.1);
  color: #207561;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.rp-footer {
  text-align: center; font-size: 14px;
  color: #6b7280; font-weight: 500; margin-top: 24px;
}
.rp-footer a {
  color: #207561; font-weight: 800;
  text-decoration: underline;
}
.rp-footer a:hover { color: #1b6351; }
`

/* ─────────────────────────── ICONS ─────────────────────────── */
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
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset token. Please request a new link.')
      return
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password. Please try again.')
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>
      <div className="rp-page">
        <div className="rp-card">
          {!success ? (
            <>
              <div className="rp-heading">
                <h1>Reset Password</h1>
                <p>Choose a secure new password for your account.</p>
              </div>

              {!token ? (
                <div className="rp-error">
                  ⚠️ No reset token found. Please check the link from your email or request a new reset.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rp-form" noValidate>
                  <div className="rp-pw-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="New Password"
                      className="rp-field"
                      required
                    />
                    <button type="button" className="rp-pw-toggle" onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  <div className="rp-pw-wrap">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm New Password"
                      className="rp-field"
                      required
                    />
                    <button type="button" className="rp-pw-toggle" onClick={() => setShowConfirmPw(v => !v)}>
                      {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {error && <div className="rp-error">⚠️ {error}</div>}

                  <button type="submit" disabled={loading} className="rp-submit">
                    {loading && <span className="rp-spinner" />}
                    Save New Password
                  </button>
                </form>
              )}

              <p className="rp-footer">
                Back to <Link to="/login">Log in</Link>
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div className="rp-success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="rp-heading">
                <h1>All Set!</h1>
                <p>Your password has been successfully reset. You can now log in with your new password.</p>
              </div>
              <button onClick={() => navigate('/login')} className="rp-submit">
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
