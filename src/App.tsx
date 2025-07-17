import { useEffect, useMemo, useRef, useState } from 'react'
import { createRetrier } from './retryBackoff'
import { getStatus, OnlineStatus } from './onlineStatus'
import { OfflineIcon } from './icons/OfflineIcon'
import { OnlineIcon } from './icons/OnlineIcon'
import { LoadingIcon } from './icons/LoadingIcon'
import './App.css'

function App() {
  const [online, setOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener("online", () => setOnline(true), { signal: controller.signal })
    window.addEventListener("offline", () => setOnline(false), { signal: controller.signal })

    return () => controller.abort()
  }, [])

  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const supportsWebSocket = useMemo(() => 'WebSocket' in window && window.WebSocket.CLOSING === 2, [])
  const socketRef = useRef<WebSocket>(undefined)

  const [isFirstTimeWebSocket, setIsFirstTimeWebSocket] = useState(true)
  const [webSocketConnecting, setWebSocketConnecting] = useState(false)
  const [webSocketOpen, setWebSocketOpen] = useState(() => socketRef.current?.readyState === WebSocket.OPEN)

  useEffect(() => {
    // foreground tab of a non-minimized window
    let isVisible = document.visibilityState === 'visible'
    const getIsVisible = () => isVisible

    const controller = new AbortController()
    const retrier = createRetrier(getIsVisible)

    const connect = () => {
      if (!supportsWebSocket || !online) {
        return
      }

      setWebSocketConnecting(true)
      console.log("ws connecting")
      const socket = new WebSocket("/ws")
      socket.onerror = (event) => {
        console.log("ws errored", event)
        // onclose will be called
      }
      socket.onopen = () => {
        console.log("ws opened")
        setIsFirstTimeWebSocket(false)
        setWebSocketConnecting(false)
        setWebSocketOpen(true)
        retrier.reset()
      }
      socket.onclose = () => {
        console.log("ws closed")
        setIsFirstTimeWebSocket(false)
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

    const login = () => {
      if (!online) {
        return
      }

      setLoggingIn(true)
      console.log("logging in")
      fetch('api/login', {
        method: 'post',
        signal: controller.signal
      }).then((response) => {
        if (response.status == 200) {
          console.log("logged in")
          setLoggingIn(false)
          setLoggedIn(true)
          setIsFirstTimeLogin(false)
          retrier.setLoggedIn(new Date())
          connect()
          return
        }
        console.log("login failed")
        setLoggingIn(false)
        setLoggedIn(false)
        setIsFirstTimeLogin(false)
        retrier.retryLogin()
      }).catch(() => {
        if (!controller.signal.aborted) {
          console.log("login errored")
          setLoggingIn(false)
          setLoggedIn(false)
          setIsFirstTimeLogin(false)
          retrier.retryLogin()
        }
      })
    }

    retrier.setRetryLogin(login)
    retrier.setRetryWebSocketConnect(connect)
    login()

    window.addEventListener("visibilitychange", () => {
      isVisible = document.visibilityState === 'visible'
      if (isVisible) {
        retrier.flushPendingActions()
      }
    }, { signal: controller.signal })

    return () => {
      controller.abort()
      retrier.abort()
      socketRef.current?.close()
    }
  }, [supportsWebSocket, online])

  const status = getStatus({
    online,
    isFirstTimeLogin,
    loggingIn,
    loggedIn,
    isFirstTimeWebSocket,
    webSocketConnecting,
    webSocketOpen
  })

  return (
    <>
      <h1>@michaelyinopen/connection</h1>
      <p>
        Make an HTTPS request and upgrade to a Secure Web Socket connection.
      </p>
      {status === OnlineStatus.Offline && <OfflineIcon />}
      {(status === OnlineStatus.Connecting || status === OnlineStatus.Retrying) && <LoadingIcon />}
      {status === OnlineStatus.Online && <OnlineIcon />}
      <p>
        {status}
      </p>
    </>
  )
}

export default App
