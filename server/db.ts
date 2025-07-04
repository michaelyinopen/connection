import sqlite from 'better-sqlite3'

const db = new sqlite(process.env.DATABASE_PATH)
db.pragma('journal_mode = WAL')
db.defaultSafeIntegers(false)

export { db } 
