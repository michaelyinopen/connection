import { useEffect, useMemo, useRef, useState } from 'react'
import { createRetrier } from './retryBackoff'
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
  const [webSocketConnecting, setWebSocketConnecting] = useState(false)
  const [webSocketOpen, setWebSocketOpen] = useState(() => socketRef.current?.readyState === WebSocket.OPEN)

  useEffect(() => {
    const controller = new AbortController()
    const retrier = createRetrier()

    const connect = () => {
      if (supportsWebSocket) {
        setWebSocketConnecting(true)
        const socket = new WebSocket("/ws")
        socket.onerror = (event) => {
          console.log("ws errored", event)
          // onclose will be called
        }
        socket.onopen = () => {
          console.log("ws opened")
          setWebSocketConnecting(false)
          setWebSocketOpen(true)
          retrier.reset()
        }
        socket.onclose = () => {
          console.log("ws closed")
          setWebSocketConnecting(false)
          setWebSocketOpen(false)
          retrier.retryWebSocketConnect()
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
          retrier.setLoggedIn(new Date())
          connect()
          return
        }
        setLoggingIn(false)
        setLoginErrored(true)
        retrier.retryLogin()
      }).catch(() => {
        setLoggingIn(false)
        setLoginErrored(true)
        retrier.retryLogin()
      })
    }

    retrier.setRetryLogin(login)
    retrier.setRetryWebSocketConnect(connect)
    login()

    return () => {
      controller.abort()
      retrier.abort()
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
          Websocket open: {webSocketConnecting ? 'connecting' : webSocketOpen ? 'true' : 'false'}<br />
        </p>
      </div>
    </>
  )
}

export default App
