import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// A lightweight .env parser to load configuration values
try {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const index = trimmedLine.indexOf('=')
        if (index > 0) {
          const key = trimmedLine.substring(0, index).trim()
          const value = trimmedLine.substring(index + 1).trim().replace(/^['"]|['"]$/g, '')
          process.env[key] = value
        }
      }
    })
  }
} catch (e) {
  console.error('Failed to load .env file:', e)
}

// In-memory store for reset tokens
const resetTokens = new Map()

// Helper function to send email via real SMTP or mock sandbox
async function sendResetLinkEmail(email, link) {
  let transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    console.log('Using custom SMTP configuration from .env');
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpPort === '465', // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  } else {
    console.log('No SMTP config found in .env. Creating Ethereal test SMTP account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const mailOptions = {
    from: smtpUser ? `"Expenso Support" <${smtpUser}>` : '"Expenso Support" <support@expenso.local>',
    to: email,
    subject: 'Expenso Tracker - Reset Your Password',
    text: `Hello,\n\nYou requested to reset your Expenso password.\n\nPlease reset your password by clicking the link below:\n\n${link}\n\nThis link is valid for 30 minutes.\n\nBest regards,\nExpenso Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #207561; margin-bottom: 20px; font-family: 'Sora', Arial, sans-serif;">Expenso Tracker</h2>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; color: #334155; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" target="_blank" style="display: inline-block; font-size: 16px; font-weight: 700; color: #ffffff; background-color: #207561; padding: 14px 28px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 12px rgba(32, 117, 97, 0.25);">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 13px; color: #207561; word-break: break-all; line-height: 1.6;">${link}</p>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-top: 20px;">This link is valid for 30 minutes. If you did not request a reset, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Expenso Tracker &bull; Secure Sandbox Environment</p>
      </div>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Message sent: %s', info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('Preview URL: %s', previewUrl);
    return previewUrl;
  }
  return null;
}

import {
  initDb,
  getTransactionsByUser,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  createUser,
  getUserByEmail,
  updateUserPassword,
  getRecurringByUser,
  addRecurring,
  updateRecurringNextDueDate,
  deleteRecurring,
  getGoalsByUser,
  addGoal,
  updateGoalAmount,
  deleteGoal,
  getDebtsByUser,
  addDebt,
  updateDebtStatus,
  deleteDebt
} from './db.js'

const app = express()
const PORT = process.env.PORT || 5005

// Keep the event loop alive in the environment
setInterval(() => {}, 60000)

app.use(cors())
app.use(express.json())

// Initialize Database on Startup
initDb()
  .then(() => {
    console.log('Database initialized successfully.')
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
  })

// Password hashing helper (SHA-256)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Strong password check helper (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)
function isStrongPassword(password) {
  return password &&
         password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[^A-Za-z0-9]/.test(password);
}

// ==================== AUTHENTICATION ROUTES ====================

// 1. User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' })
    }
    if (!password || !isStrongPassword(password)) {
      return res.status(400).json({ error: 'Please enter a strong password with symbols, numbers, uppercase, and lowercase letters (min. 8 characters).' })
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your name.' })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email.toLowerCase().trim())
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' })
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: email.toLowerCase().trim(),
      passwordHash: hashPassword(password),
      name: name.trim(),
      createdAt: new Date().toISOString()
    }

    await createUser(newUser)
    
    // Return user info (omit password hash)
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    })
  } catch (error) {
    console.error('Error during registration:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// 2. User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter email and password.' })
    }

    const user = await getUserByEmail(email.toLowerCase().trim())
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' })
    }

    const currentHash = hashPassword(password)
    if (user.passwordHash !== currentHash) {
      return res.status(400).json({ error: 'Invalid email or password.' })
    }

    // Login success, return user profile
    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// 3. Reset Password (Direct Database Update for Sandbox)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Please enter email and new password.' })
    }

    if (!newPassword || !isStrongPassword(newPassword)) {
      return res.status(400).json({ error: 'Please enter a strong password with symbols, numbers, uppercase, and lowercase letters (min. 8 characters).' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await getUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email address.' })
    }

    const newHash = hashPassword(newPassword)
    await updateUserPassword(user.email, newHash)

    res.json({ success: true, message: 'Password updated successfully!' })
  } catch (error) {
    console.error('Error during reset password:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})


// ==================== USER-SCOPED TRANSACTION ROUTES ====================

// 1. Get user transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest'
    const txns = await getTransactionsByUser(userId)
    res.json(txns)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// 2. Add a new transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { id, title, category, type, amountCents, createdAt, updatedAt, userId, description } = req.body

    // Simple validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' })
    }
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' })
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'Amount in cents must be a positive integer' })
    }

    const newTxn = {
      id: id || `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      category: category.trim(),
      type,
      amountCents,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: updatedAt || new Date().toISOString(),
      userId: userId || 'guest',
      description: description || ''
    }

    await addTransaction(newTxn)
    res.status(201).json(newTxn)
  } catch (error) {
    console.error('Error adding transaction:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// 3. Update an existing transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, category, type, amountCents, description } = req.body

    // Simple validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' })
    }
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be "income" or "expense"' })
    }
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'Amount in cents must be a positive integer' })
    }

    const updates = {
      title: title.trim(),
      category: category.trim(),
      type,
      amountCents,
      updatedAt: new Date().toISOString(),
      description: description || ''
    }

    const updatedTxn = await updateTransaction(id, updates)
    if (!updatedTxn) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    res.json(updatedTxn)
  } catch (error) {
    console.error('Error updating transaction:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// 4. Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params
    await deleteTransaction(id)
    res.json({ success: true, message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// ==================== RECURRING TRANSACTIONS ROUTES ====================
app.get('/api/recurring', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest'
    const items = await getRecurringByUser(userId)
    res.json(items)
  } catch (error) {
    console.error('Error fetching recurring:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/recurring', async (req, res) => {
  try {
    const { title, category, type, amountCents, frequency, nextDueDate, userId } = req.body
    if (!title || !category || !type || !amountCents || !frequency || !nextDueDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newItem = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: userId || 'guest',
      title: title.trim(),
      category: category.trim(),
      type,
      amountCents,
      frequency,
      nextDueDate,
      createdAt: new Date().toISOString()
    }
    await addRecurring(newItem)
    res.status(201).json(newItem)
  } catch (error) {
    console.error('Error adding recurring:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.delete('/api/recurring/:id', async (req, res) => {
  try {
    const { id } = req.params
    await deleteRecurring(id)
    res.json({ success: true, message: 'Recurring transaction deleted' })
  } catch (error) {
    console.error('Error deleting recurring:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/recurring/process', async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const recurringItems = await getRecurringByUser(userId)
    const now = new Date()
    let postedCount = 0

    for (const item of recurringItems) {
      let nextDue = new Date(item.nextDueDate)
      let updated = false
      // While the next due date is today or in the past, post a transaction
      while (nextDue <= now) {
        const txnId = `txn-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const newTxn = {
          id: txnId,
          title: `${item.title} (Recurring)`,
          category: item.category,
          type: item.type,
          amountCents: item.amountCents,
          createdAt: nextDue.toISOString(),
          updatedAt: nextDue.toISOString(),
          userId: item.userId,
          description: `Automatically posted recurring ${item.frequency} transaction.`
        }
        await addTransaction(newTxn)
        postedCount++
        updated = true

        // Calculate next due date
        if (item.frequency === 'daily') {
          nextDue.setDate(nextDue.getDate() + 1)
        } else if (item.frequency === 'weekly') {
          nextDue.setDate(nextDue.getDate() + 7)
        } else if (item.frequency === 'monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1)
        } else if (item.frequency === 'yearly') {
          nextDue.setFullYear(nextDue.getFullYear() + 1)
        } else {
          break; // Unknown frequency
        }
      }

      if (updated) {
        await updateRecurringNextDueDate(item.id, nextDue.toISOString())
      }
    }

    res.json({ success: true, postedCount })
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// ==================== SAVINGS GOALS ROUTES ====================
app.get('/api/goals', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest'
    const goals = await getGoalsByUser(userId)
    res.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/goals', async (req, res) => {
  try {
    const { title, targetAmountCents, targetDate, userId } = req.body
    if (!title || !targetAmountCents || !targetDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: userId || 'guest',
      title: title.trim(),
      targetAmountCents,
      currentAmountCents: 0,
      targetDate,
      createdAt: new Date().toISOString()
    }
    await addGoal(newGoal)
    res.status(201).json(newGoal)
  } catch (error) {
    console.error('Error adding goal:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { currentAmountCents } = req.body
    if (currentAmountCents === undefined) {
      return res.status(400).json({ error: 'currentAmountCents is required' })
    }

    const updatedGoal = await updateGoalAmount(id, currentAmountCents)
    res.json(updatedGoal)
  } catch (error) {
    console.error('Error updating goal:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params
    await deleteGoal(id)
    res.json({ success: true, message: 'Goal deleted successfully' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// ==================== DEBTS & LOANS ROUTES ====================
app.get('/api/debts', async (req, res) => {
  try {
    const userId = req.query.userId || 'guest'
    const debts = await getDebtsByUser(userId)
    res.json(debts)
  } catch (error) {
    console.error('Error fetching debts:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.post('/api/debts', async (req, res) => {
  try {
    const { personName, type, amountCents, dueDate, description, userId } = req.body
    if (!personName || !type || !amountCents || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const newDebt = {
      id: `debt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: userId || 'guest',
      personName: personName.trim(),
      type,
      amountCents,
      dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: description || ''
    }
    await addDebt(newDebt)
    res.status(201).json(newDebt)
  } catch (error) {
    console.error('Error adding debt:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.put('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!status) {
      return res.status(400).json({ error: 'status is required' })
    }

    const updatedDebt = await updateDebtStatus(id, status)
    res.json(updatedDebt)
  } catch (error) {
    console.error('Error updating debt:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.delete('/api/debts/:id', async (req, res) => {
  try {
    const { id } = req.params
    await deleteDebt(id)
    res.json({ success: true, message: 'Debt deleted successfully' })
  } catch (error) {
    console.error('Error deleting debt:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// Serve built frontend in production
const distPath = path.join(process.cwd(), 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
