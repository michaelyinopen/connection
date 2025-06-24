import { useEffect, useState } from 'react'
import './App.css'

let socket: WebSocket

fetch('api/login', {
  method: 'post'
}).then((response) => {
  if (response.status == 200) {
    socket = new WebSocket("/ws")
    socket.onopen = () => console.log("ws opened")
    socket.onerror = (event) => console.log("ws errored", event)
    socket.onclose = () => console.log("ws closed")

    socket.onmessage = e => {
      const message = JSON.parse(e.data)
      console.log("e", message)
    }
  }
})

function App() {
  const [online, setOnline] = useState(() => window.navigator.onLine)

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener("online", () => setOnline(true), { signal: controller.signal })
    window.addEventListener("offline", () => setOnline(false), { signal: controller.signal })

    return () => controller.abort()
  }, [])

  // const [supportsWebSocket] = useState(() => 'WebSocket' in window && window.WebSocket.CLOSING === 2)
  // const [webSocketOpen, setWebSocketOpen] = useState(() => socket?.readyState === socket.OPEN)

  // useEffect(() => {
  //   const controller = new AbortController()

  //   if()

  //   return () => controller.abort()
  // }, [])

  return (
    <>
      <h1>@michaelyinopen/connection</h1>
      <div>
        <p>
          Online: {online ? 'true' : 'false'}<br />
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
