const listOfBackoffMs = [
  0,      // immediately
  1000,   // 1s
  2000,   // 2s
  5000,   // 5s
  10000,  // 10s
  20000,  // 20s
  30000,  // 30s
  60000,  // 1 minute
  120000, // 2 minute
  300000, // 5 minute
]

// login fail: try above, and then every 5 minute

// websocket error/ disconnect
// retry websocket immediately
// retry login immediately, if logged in longer than 1 hour ago
// retry websocket with backoff

const minDateTime = new Date('0001-01-01T00:00:00Z')
const loginFreshMs = 3600000 // 1 hour

export function createRetryer() {
  let loginFunction: (() => void) | undefined = undefined
  let webSocketConnectFunction: (() => void) | undefined = undefined

  let loginBackoffIndex = 0
  let webSocketConnectBackoffIndex = 0
  let loggedInDateTime = minDateTime

  function setRetryLogin(value: () => void) {
    loginFunction = value
  }

  function setRetryWebSocketConnect(value: () => void) {
    webSocketConnectFunction = value
  }

  function setLoggedIn(dateTime: Date) {
    loggedInDateTime = dateTime
    loginBackoffIndex = 0
  }

  function retryLogin() {
    if (!loginFunction) {
      return
    }
    setTimeout(loginFunction, listOfBackoffMs[loginBackoffIndex])
    loginBackoffIndex = loginBackoffIndex >= listOfBackoffMs.length - 1 ? loginBackoffIndex : loginBackoffIndex + 1
  }

  function retryWebSocketConnect() {
    if (!loginFunction || !webSocketConnectFunction) {
      return
    }

    // first, retry websocket connection immediately
    if (webSocketConnectBackoffIndex === 0) {
      setTimeout(webSocketConnectFunction, 0)
      webSocketConnectBackoffIndex = 1
      return
    }

    // then, retry login if the the last login was long ago
    const loginStale = new Date().getTime() - loggedInDateTime.getTime() > loginFreshMs
    if (webSocketConnectBackoffIndex === 1 && loginBackoffIndex === 0 && loginStale) {
      setTimeout(loginFunction, 0)
      loginBackoffIndex = 1
      return
    }

    setTimeout(webSocketConnectFunction, listOfBackoffMs[webSocketConnectBackoffIndex])
    webSocketConnectBackoffIndex = webSocketConnectBackoffIndex >= listOfBackoffMs.length - 1 ? webSocketConnectBackoffIndex : webSocketConnectBackoffIndex + 1
  }

  function reset() {
    loginBackoffIndex = 0
    webSocketConnectBackoffIndex = 0
    loggedInDateTime = minDateTime
  }

  return {
    setRetryLogin,
    setRetryWebSocketConnection: setRetryWebSocketConnect,
    setLoggedInTimestamp: setLoggedIn,
    retryLogin,
    retryWebSocketConnection: retryWebSocketConnect,
    reset,
  }
}
