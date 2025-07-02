import sqlite from 'better-sqlite3'

const db = new sqlite("sessions.db")
db.pragma('journal_mode = WAL')
db.defaultSafeIntegers(false)

export { db } 
