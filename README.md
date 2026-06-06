# Expenso Tracker ✨

Expenso Tracker is a premium, modern, and feature-rich personal finance management web application. Built using React, TailwindCSS, Express, and SQLite, it helps users track their income and expenses, set savings goals, configure budget limits, view visual charts, and receive smart financial advice from **Spark AI**, a built-in client-side financial coach.

The project is structured as a monorepo with separate `frontend` and `backend` services to make local development and cloud deployment simple.

---

## 📁 Repository Structure

```
my-react-app/
  ├── package.json               # Monorepo task manager (runs frontend & backend concurrently)
  ├── README.md                  # Project documentation
  ├── frontend/                  # React Website (Vite + TailwindCSS + Recharts)
  │     ├── src/                 # React source code
  │     ├── public/              # Static public assets
  │     ├── index.html           # HTML template
  │     ├── vite.config.js       # Vite configuration
  │     └── vercel.json          # Vercel client-side routing rewrites
  └── backend/                   # Node.js + Express API
        ├── index.js             # Express server and router
        ├── db.js                # SQLite Database helpers & schema
        ├── database.sqlite      # SQLite local database file
        └── Dockerfile           # Docker configuration for backend deployment
```

---

## 🚀 Features

- **📊 Dynamic Dashboard**: Net balance trackers, income/expense summaries, and category charts built with Recharts.
- **💸 Transaction Ledger**: Log, edit, and delete transactions with full search, sorting, and category filters.
- **📋 Smart Budgets**: Set monthly limits for individual categories with over-spend alerts.
- **🎯 Savings Goals**: Track progress toward custom savings milestones (e.g., MacBook Pro, Emergency Fund).
- **✨ Spark AI Assistant**: An interactive personal financial coach widget that analyzes your transactions to give real-time advice on category spending, coffee habits, and saving strategies.
- **🌓 Dark Mode**: Seamless toggle between a premium light theme and a sleek dark theme.
- **📱 Responsive Layout**: Fully responsive, mobile-optimized design for smartphones and desktops.

---

## 💻 Local Development

### 1. Installation
Install all dependencies for both the frontend and backend in one command from the root directory:
```bash
npm run install-all
```

### 2. Run the Application
Start both the React development server and Express server concurrently:
```bash
npm run dev
```

* **Frontend** runs at: `http://localhost:5173`
* **Backend API** runs at: `http://localhost:5005`

---

## 🌎 Cloud Deployment

### 1. Backend (Render)
1. Create a new **Web Service** on Render and link your repository.
2. Configure settings:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npm rebuild sqlite3 --build-from-source`
   * **Start Command**: `node index.js`
   * **Instance Type**: `Free`

### 2. Frontend (Vercel)
1. Create a new **Project** on Vercel and link your repository.
2. Configure settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Vite`
3. Add the **Environment Variable**:
   * **Key**: `VITE_API_URL`
   * **Value**: Your live backend Render URL (e.g., `https://your-backend.onrender.com` — *no trailing slash*).
