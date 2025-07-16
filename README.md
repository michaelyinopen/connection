# @michaelyinopen/connection

This repo contains a server to provide a websocket connection, and a React client that connects with the server.

- The client does not need to login, and keeps an identity using a persistent(100 days) cookie.
- First, an https request is made. Then, the connection is upgraded to a websocket connection.
- The server will keep pinging the client to check for broken connections.
- The client will show offline, connecting, or online status.
- The client will attempt to reconnect with a backoff.

## Live DEMO
https://connection.michael-yin.net

## Technologies

- Node
- Express
- SQLite
- ws
- React
- Vite
- Typescript

## Status
- Offline
- Connecting/ Retrying
- Online (open web socket connection)

## User session
The user keeps a cookie id in the browser. The server stores these user sessions in a SQLite database.

1 user = 1 browser

How to handle different tabs of the same browser?

## Troubleshoot
`console.log` messages in the browser could help identify issues.

## Database
An SQLite file located according to the environmental setting.

## How to run
1. Create a `.env` file at `server` directory that includes
```
NODE_ENV=Development
DATABASE_PATH=sessions.db
PORT=8080
SESSION_SECRET=keyboard cat
```

2. 
```
npm run start-server

// another terminal
npm run dev
```

3. Visit `http://localhost:5173/` in browser.
