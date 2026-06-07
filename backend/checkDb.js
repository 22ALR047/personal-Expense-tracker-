import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'

const dbPromise = open({
  filename: path.join(process.cwd(), 'database.sqlite'),
  driver: sqlite3.Database,
})

async function check() {
  const db = await dbPromise
  const txns = await db.all('SELECT * FROM transactions')
  console.log('Transactions in SQLite:', JSON.stringify(txns, null, 2))
}

check()
