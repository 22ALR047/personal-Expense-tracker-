import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const cssStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

.onboarding-page {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 32px 48px;
  background:
    radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 32%),
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
  color: #0f172a;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.onboarding-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.onboarding-logo-text {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.75px;
}

.onboarding-login-btn {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  background-color: rgba(15, 23, 42, 0.06);
  border: none;
  padding: 12px 24px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.onboarding-login-btn:hover {
  background-color: rgba(15, 23, 42, 0.1);
}

.onboarding-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  width: 100%;
  margin: 60px auto;
  gap: 80px;
}

.onboarding-left {
  flex: 1;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.onboarding-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(32, 117, 97, 0.1);
  color: #207561;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
}

.onboarding-title {
  font-size: 52px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 0;
  font-family: 'Sora', 'Inter', sans-serif;
}

.onboarding-caption {
  font-size: 16px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.onboarding-cta-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 12px;
}

.onboarding-started-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #0f172a, #1f2937);
  color: #ffffff;
  padding: 16px 32px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(32, 117, 97, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.onboarding-started-btn:hover {
  background: linear-gradient(135deg, #111827, #0f172a);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.24);
}

.onboarding-started-btn:active {
  transform: scale(0.98);
}

.onboarding-started-btn svg {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
}

.onboarding-started-btn:hover svg {
  transform: translateX(4px);
}

.onboarding-dots {
  display: flex;
  gap: 8px;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.onboarding-dot.active {
  width: 24px;
  border-radius: 9999px;
  background-color: #0f172a;
}

.onboarding-right {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

.onboarding-tabs {
  display: flex;
  background-color: rgba(255, 255, 255, 0.72);
  padding: 6px;
  border-radius: 9999px;
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.onboarding-tab-btn {
  flex: 1;
  border: none;
  background: none;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}

.onboarding-tab-btn.active {
  background-color: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 10px rgba(15,23,42,0.08);
}

.onboarding-preview-card {
  width: 100%;
  background: #ffffff;
  border-radius: 24px;
  border: 1.5px solid rgba(15, 23, 42, 0.08);
  padding: 12px;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.onboarding-preview-img-container {
  width: 100%;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #f9fafb;
  border: 1px solid #f3f4f6;
}

.onboarding-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.onboarding-preview-desc {
  font-size: 14px;
  color: #475569;
  text-align: center;
  padding: 0 16px 8px 16px;
  line-height: 1.6;
  margin: 0;
}

.onboarding-footer {
  text-align: center;
  border-top: 1.5px solid rgba(15, 23, 42, 0.08);
  padding-top: 24px;
  margin-top: 24px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* ── Responsive ── */
@media (max-width: 1023px) {
  .onboarding-page {
    padding: 24px;
  }
  .onboarding-main {
    flex-direction: column;
    gap: 48px;
    margin: 32px auto;
  }
  .onboarding-left {
    max-width: 100%;
    align-items: center;
    text-align: center;
  }
  .onboarding-badge {
    align-self: center;
  }
  .onboarding-title {
    font-size: 38px;
  }
  .onboarding-cta-row {
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  .onboarding-started-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .onboarding-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  .onboarding-logo {
    justify-content: center;
  }
  .onboarding-login-btn {
    width: 100%;
    text-align: center;
  }
  .onboarding-title {
    font-size: 30px;
    line-height: 1.25;
  }
  .onboarding-tabs {
    flex-direction: column;
    border-radius: 20px;
    padding: 8px;
    gap: 6px;
  }
  .onboarding-tab-btn {
    width: 100%;
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 12px;
  }
  .onboarding-preview-img-container {
    height: 180px;
  }
  .onboarding-preview-desc {
    font-size: 13px;
    padding: 0 8px 4px 8px;
  }
}
`

const TrackerLogo = () => (
  <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="9" width="7.5" height="18" rx="3.75" transform="rotate(-25 6 9)" fill="#86efac" />
    <rect x="19" y="5" width="7.5" height="18" rx="3.75" transform="rotate(25 19 5)" fill="#207561" />
  </svg>
)

export default function Onboarding() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      label: 'Spend Dashboard',
      description: 'Log and monitor daily expenses in real-time with automatic category tags.',
      image: '/images/dashboard_preview.png'
    },
    {
      label: 'Visual Analytics',
      description: 'Understand cash flows and analyze spending patterns with clean monthly charts.',
      image: '/images/analytics_growth.png'
    },
    {
      label: 'Smart Budgets',
      description: 'Set custom category limits and get alerts before you overspend.',
      image: '/images/budget_tracking.png'
    }
  ]

  function handleGetStarted() {
    navigate('/login')
  }

  return (
    <>
      <style>{cssStyles}</style>

      <div className="onboarding-page">
        {/* Header Section */}
        <header className="onboarding-header">
          <div className="onboarding-logo">
            <TrackerLogo />
            <span className="onboarding-logo-text">Expenso Tracker</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="onboarding-login-btn"
          >
            Sign In
          </button>
        </header>

        {/* Main Section */}
        <main className="onboarding-main">
          {/* Left Column: Heading and description */}
          <div className="onboarding-left">
            <div className="onboarding-badge">
              <span>🚀</span>
              <span>Personal Wealth Optimizer</span>
            </div>

            <h1 className="onboarding-title">
              Easy way to monitor your expense
            </h1>
            
            <p className="onboarding-caption">
              Simplify your finances, track spending instantly, and visualize budget goals. Your personal path to financial freedom starts here.
            </p>

            <div className="onboarding-cta-row">
              <button 
                onClick={handleGetStarted}
                className="onboarding-started-btn"
              >
                <span>Get Started</span>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="onboarding-dots">
                {tabs.map((_, index) => (
                  <span 
                    key={index} 
                    className={`onboarding-dot ${activeTab === index ? 'active' : ''}`}
                    onClick={() => setActiveTab(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Feature Showcase Slider */}
          <div className="onboarding-right">
            <div className="onboarding-tabs">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  className={`onboarding-tab-btn ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="onboarding-preview-card">
              <div className="onboarding-preview-img-container">
                <img 
                  src={tabs[activeTab].image} 
                  alt={tabs[activeTab].label} 
                  className="onboarding-preview-img"
                />
              </div>
              <p className="onboarding-preview-desc">
                {tabs[activeTab].description}
              </p>
            </div>
          </div>
        </main>



      </div>
    </>
  )
}
