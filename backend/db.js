import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPromise = open({
  filename: path.join(__dirname, 'database.sqlite'),
  driver: sqlite3.Database,
})

export async function initDb() {
  const db = await dbPromise
  
  // 1. Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)

  // 2. Create transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      amountCents INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  // 3. Alter transactions table to add userId if it does not exist
  try {
    await db.exec('ALTER TABLE transactions ADD COLUMN userId TEXT;')
  } catch (err) {
    if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
      console.error('Error altering transactions table for userId:', err)
    }
  }

  // 4. Alter transactions table to add description if it does not exist
  try {
    await db.exec('ALTER TABLE transactions ADD COLUMN description TEXT;')
  } catch (err) {
    if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
      console.error('Error altering transactions table for description:', err)
    }
  }

  // 5. Create recurring_transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      amountCents INTEGER NOT NULL,
      frequency TEXT NOT NULL,
      nextDueDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)

  // 6. Create savings_goals table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      targetAmountCents INTEGER NOT NULL,
      currentAmountCents INTEGER NOT NULL,
      targetDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)

  // 7. Create debts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      personName TEXT NOT NULL,
      type TEXT NOT NULL,
      amountCents INTEGER NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)
  
  // Migration: Rename 'Outing' category to 'Eating Out'
  await db.exec("UPDATE transactions SET category = 'Eating Out' WHERE category = 'Outing';")
}

// User CRUD Helpers
export async function createUser(user) {
  const db = await dbPromise
  const { id, email, passwordHash, name, createdAt } = user
  await db.run(
    'INSERT INTO users (id, email, passwordHash, name, createdAt) VALUES (?, ?, ?, ?, ?)',
    [id, email, passwordHash, name, createdAt]
  )
  return user
}

export async function getUserByEmail(email) {
  const db = await dbPromise
  return db.get('SELECT * FROM users WHERE email = ?', [email])
}

export async function updateUserPassword(email, newPasswordHash) {
  const db = await dbPromise
  await db.run('UPDATE users SET passwordHash = ? WHERE email = ?', [newPasswordHash, email])
}


// Transaction CRUD Helpers (User Scoped)
export async function getTransactionsByUser(userId) {
  const db = await dbPromise
  return db.all(
    'SELECT * FROM transactions WHERE userId = ? OR (userId IS NULL AND ? = "guest") ORDER BY createdAt DESC',
    [userId, userId]
  )
}

export async function addTransaction(transaction) {
  const db = await dbPromise
  const { id, title, category, type, amountCents, createdAt, updatedAt, userId, description } = transaction
  await db.run(
    'INSERT INTO transactions (id, title, category, type, amountCents, createdAt, updatedAt, userId, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, title, category, type, amountCents, createdAt, updatedAt, userId || 'guest', description || '']
  )
  return transaction
}

export async function updateTransaction(id, updates) {
  const db = await dbPromise
  const { title, category, type, amountCents, updatedAt, description } = updates
  await db.run(
    'UPDATE transactions SET title = ?, category = ?, type = ?, amountCents = ?, updatedAt = ?, description = ? WHERE id = ?',
    [title, category, type, amountCents, updatedAt, description || '', id]
  )
  return db.get('SELECT * FROM transactions WHERE id = ?', [id])
}

export async function deleteTransaction(id) {
  const db = await dbPromise
  await db.run('DELETE FROM transactions WHERE id = ?', [id])
}

// Recurring Transactions helpers
export async function getRecurringByUser(userId) {
  const db = await dbPromise
  return db.all('SELECT * FROM recurring_transactions WHERE userId = ? ORDER BY createdAt DESC', [userId])
}

export async function addRecurring(item) {
  const db = await dbPromise
  const { id, userId, title, category, type, amountCents, frequency, nextDueDate, createdAt } = item
  await db.run(
    'INSERT INTO recurring_transactions (id, userId, title, category, type, amountCents, frequency, nextDueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, title, category, type, amountCents, frequency, nextDueDate, createdAt]
  )
  return item
}

export async function updateRecurringNextDueDate(id, nextDueDate) {
  const db = await dbPromise
  await db.run('UPDATE recurring_transactions SET nextDueDate = ? WHERE id = ?', [nextDueDate, id])
}

export async function deleteRecurring(id) {
  const db = await dbPromise
  await db.run('DELETE FROM recurring_transactions WHERE id = ?', [id])
}

// Savings Goals helpers
export async function getGoalsByUser(userId) {
  const db = await dbPromise
  return db.all('SELECT * FROM savings_goals WHERE userId = ? ORDER BY createdAt DESC', [userId])
}

export async function addGoal(goal) {
  const db = await dbPromise
  const { id, userId, title, targetAmountCents, currentAmountCents, targetDate, createdAt } = goal
  await db.run(
    'INSERT INTO savings_goals (id, userId, title, targetAmountCents, currentAmountCents, targetDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, title, targetAmountCents, currentAmountCents, targetDate, createdAt]
  )
  return goal
}

export async function updateGoalAmount(id, currentAmountCents) {
  const db = await dbPromise
  await db.run('UPDATE savings_goals SET currentAmountCents = ? WHERE id = ?', [currentAmountCents, id])
  return db.get('SELECT * FROM savings_goals WHERE id = ?', [id])
}

export async function deleteGoal(id) {
  const db = await dbPromise
  await db.run('DELETE FROM savings_goals WHERE id = ?', [id])
}

// Debts helpers
export async function getDebtsByUser(userId) {
  const db = await dbPromise
  return db.all('SELECT * FROM debts WHERE userId = ? ORDER BY createdAt DESC', [userId])
}

export async function addDebt(debt) {
  const db = await dbPromise
  const { id, userId, personName, type, amountCents, dueDate, status, createdAt, description } = debt
  await db.run(
    'INSERT INTO debts (id, userId, personName, type, amountCents, dueDate, status, createdAt, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, personName, type, amountCents, dueDate, status, createdAt, description || '']
  )
  return debt
}

export async function updateDebtStatus(id, status) {
  const db = await dbPromise
  await db.run('UPDATE debts SET status = ? WHERE id = ?', [status, id])
  return db.get('SELECT * FROM debts WHERE id = ?', [id])
}

export async function deleteDebt(id) {
  const db = await dbPromise
  await db.run('DELETE FROM debts WHERE id = ?', [id])
}
