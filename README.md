# Expenso Tracker ✨

Expenso Tracker is a premium, modern, and feature-rich personal finance management web and mobile application. Built using React, TailwindCSS, Express, and SQLite, and packaged with Capacitor, Expenso Tracker helps users log transactions, manage recurring schedules, track debts/loans, set savings goals, configure budget limits, and receive smart financial recommendations from **Spark AI**, an built-in client-side financial coach.

---

## 🚀 Key Features

- **📊 Dynamic Dashboard**: Net balance charts (using Recharts), income/expense trackers, and interactive category breakdowns.
- **💸 Transaction Ledger**: Complete CRUD actions for transactions with searching, sorting, and category filters.
- **📋 Smart Budgeting**: Set limits for individual categories with progressive warning thresholds (e.g., 80% used indicators, over-budget warnings).
- **📈 Advanced Analytics**: Visual reports detailing income versus expenses and visual spending patterns.
- **🎯 Savings Goals**: Track progress toward specific savings milestones with funding management (MacBook, Emergency Fund, etc.).
- **👥 Debts & Loans Ledger**: Manage borrowed and lent amounts with quick settle actions that automatically log transaction adjustments.
- **🔄 Recurring Subscriptions**: Automatically posts recurring daily, weekly, monthly, or yearly bills (e.g., Netflix, Rent) on their due dates.
- **✨ Spark AI Assistant**: An interactive personal financial coach that analyzes your real-time data to suggest savings strategies, coffee habit improvements, grocery hacks, and budget compliance tips.
- **🌓 Adaptive Dark Mode**: Instantly toggle between a premium light theme and a sleek dark mode.
- **📱 Mobile Ready**: Configured with Capacitor to run on Android and iOS devices.

---

## 🛠️ Technology Stack

- **Frontend**: React (v19), React Router Dom (v7), Vite, Recharts, TailwindCSS
- **Backend**: Express.js, Node.js, Nodemailer (with Ethereal sandbox fallback)
- **Database**: SQLite3, SQLite wrapper
- **Mobile Integration**: Capacitor CLI, Core, Android
- **Utilities**: Concurrently, Nodemon

---

## 📦 Setup & Installation

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Clone the Repository & Install Dependencies
```bash
# Install package dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (refer to the existing template):
```env
# SMTP Configuration (Optional - for sending password reset emails)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-gmail-app-password
```
*Note: If no SMTP configuration is supplied, the server will automatically default to a secure Ethereal sandbox test account, displaying verification links directly in the console for development testing.*

---

## 💻 Running the Application

To run the frontend and backend concurrently in development mode:
```bash
npm run dev
```

- **Frontend** runs at: `http://localhost:5173`
- **Backend API** runs at: `http://localhost:5005`

### Running Backend Individually:
```bash
npm run dev:backend
```

### Running Frontend Individually:
```bash
npm run dev:frontend
```

---

## 🛠️ Production Build

To build the project for production:
```bash
npm run build
```

This compiles the assets into the `dist/` directory, which is served automatically by the Express backend.

---

## 📱 Mobile Deployment (Capacitor)

1. Build the web assets:
   ```bash
   npm run build
   ```
2. Sync with Capacitor:
   ```bash
   npx cap sync
   ```
3. Open in Android Studio / Xcode:
   ```bash
   npx cap open android
   ```
