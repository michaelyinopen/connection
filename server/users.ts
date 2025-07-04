import { db } from './db.ts'

db.exec('CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY);')

const createUserStatement = db.prepare('INSERT INTO users DEFAULT VALUES;')

export function createUser() {
  const info = createUserStatement.run()
  return info.lastInsertRowid as number
}
