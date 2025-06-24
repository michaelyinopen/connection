# @michaelyinopen/connection

This repo contains a server to provide a websocket connection, and a React client that connects with the server.

- The client does not need to login, and keeps an identity using a persistent(3 months) cookie.
- First, an https request is made. Then, the connection is upgraded to a websocket connection.
- The server will keep pinging the client to check for broken connections.
- The client will show offline, broken connection, or online status.
- The client will attempt to reconnect with a backoff.

## Technologies

- Node
- Express
- SQLite
- ws
- React
- Vite
- Typescript
