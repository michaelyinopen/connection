import http from 'http'
import express from 'express'
import type { Request, Response } from 'express'
import session from 'express-session'
import sqliteSessionStore from 'better-sqlite3-session-store'
import { WebSocketServer, WebSocket } from 'ws'

import { db } from './db.ts'
import { createUser } from './users.ts'
import { getNextSocketId } from './getNextSocketId.ts'

const port = process.env.PORT

class WebSocketWithUserId extends WebSocket {
  id: number
  isAlive: boolean
}

declare module "express-session" {
  interface SessionData {
    userId: number
  }
}

const app = express()
const map = new Map()
const SqliteStore = sqliteSessionStore(session)

const sessionParser = session({
  store: new SqliteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000 //ms = 15min
    },
  }),
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8640000000 //ms = 100 days
  },
  rolling: true,
})

app.use(sessionParser)

app.post('/api/login', function (request, response) {
  //
  // "Log in" user and set userId to session.
  //
  console.log('logging in')
  const id = request.session.userId ?? createUser()

  request.session.userId = id
  response.send({ result: 'OK', message: 'Session updated' })
})

app.delete('/api/logout', function (request, response) {
  const ws = map.get(request.session.userId)

  request.session.destroy(function () {
    if (ws) ws.close()

    response.send({ result: 'OK', message: 'Session destroyed' })
  })
})

const server = http.createServer(app)

const wss = new WebSocketServer({
  // port: 8080,
  WebSocket: WebSocketWithUserId,
  clientTracking: false,
  noServer: true,
  // allowSynchronousEvents: true,
})

server.on('upgrade', function (request, socket, head) {
  socket.on('error', console.error)

  const req = request as Request

  sessionParser(req, ({} as Response), () => {
    if (!req.session?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    socket.removeListener('error', console.error)

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request)
    })
  })
})

function heartbeat(this: WebSocketWithUserId) {
  this.isAlive = true
}

wss.on('connection', function connection(ws, request) {
  // (request as Request).session.userId
  const socketId = getNextSocketId()
  map.set(socketId, ws)

  ws.id = socketId
  ws.isAlive = true
  ws.on('error', console.error)

  ws.on('pong', heartbeat)

  ws.on('close', () => {
    map.delete(socketId)
  })
})

const interval = setInterval(function ping() {
  map.values().forEach(function each(ws) {
    if (ws.isAlive === false) {
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('close', () => clearInterval(interval))

//
// Start the server.
//
server.listen(port, function () {
  console.log('Listening on http://localhost:%s', port)
})
