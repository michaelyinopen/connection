import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
  const [online, setOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener("online", () => setOnline(true), { signal: controller.signal })
    window.addEventListener("offline", () => setOnline(false), { signal: controller.signal })

    return () => controller.abort()
  }, [])

  const [loggingIn, setLoggingIn] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginErrored, setLoginErrored] = useState(false)

  const supportsWebSocket = useMemo(() => 'WebSocket' in window && window.WebSocket.CLOSING === 2, [])
  const socketRef = useRef<WebSocket>(undefined)
  const [webSocketOpen, setWebSocketOpen] = useState(() => socketRef.current?.readyState === WebSocket.OPEN)

  useEffect(() => {
    const controller = new AbortController()

    const connect = () => {
      if (supportsWebSocket) {
        const socket = new WebSocket("/ws")
        socket.onopen = () => {
          console.log("ws opened")
          setWebSocketOpen(true)
        }
        socket.onerror = (event) => {
          console.log("ws errored", event)
          setWebSocketOpen(false)
          // check unauthorized, then retry login instead
          // reconnect
        }
        socket.onclose = () => {
          console.log("ws closed")
          setWebSocketOpen(false)
          // reconnect
        }
        socket.onmessage = e => {
          // do something useful
          const message = JSON.parse(e.data)
          console.log("e", message)
        }
        socketRef.current = socket
      }
    }

    const login = () => {
      setLoggingIn(true)
      fetch('api/login', {
        method: 'post',
        signal: controller.signal
      }).then((response) => {
        if (response.status == 200) {
          setLoggingIn(false)
          setLoggedIn(true)
          setLoginErrored(false)
          connect()
        }
        setLoggingIn(false)
        setLoginErrored(true)
        // retry login
      }).catch(() => {
        setLoggingIn(false)
        setLoginErrored(true)
        // retry login
      })
    }

    login()

    return () => {
      controller.abort()
      socketRef.current?.close()
    }
  }, [supportsWebSocket])

  return (
    <>
      <h1>@michaelyinopen/connection</h1>
      <div>
        <p>
          Online: {online ? 'true' : 'false'}<br />
          Login: {loggedIn ? 'logged in' : loggingIn ? 'in progress' : 'error'}<br />
          Websocket open: {webSocketOpen ? 'true' : 'false'}<br />
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
