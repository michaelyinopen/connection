const listOfBackoffMs = [
  0,      // immediately
  1000,   // 1s
  2000,   // 2s
  5000,   // 5s
  10000,  // 10s
  20000,  // 20s
  30000,  // 30s
  60000,  // 1 minute
]

// if login failed: retry with backoff up to 1 minute

// when web socket error/ disconnect
// then, retry web socket immediately
// then, if logged in longer than 1 hour ago, retry login immediately
// then, retry web socket with backoff

const minDateTime = new Date('0001-01-01T00:00:00Z')
const loginFreshMs = 3600000 // 1 hour

export function createRetrier() {
  let loginFunction: (() => void) | undefined = undefined
  let webSocketConnectFunction: (() => void) | undefined = undefined

  let loginBackoffIndex = 0
  let webSocketConnectBackoffIndex = 0
  let loggedInDateTime = minDateTime

  let loginTimeoutId: NodeJS.Timeout
  let webSocketConnectTimeoutId: NodeJS.Timeout

  let aborted = false

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
    if (!loginFunction || aborted) {
      return
    }
    loginTimeoutId = setTimeout(loginFunction, listOfBackoffMs[loginBackoffIndex])
    loginBackoffIndex = loginBackoffIndex >= listOfBackoffMs.length - 1 ? loginBackoffIndex : loginBackoffIndex + 1
  }

  function retryWebSocketConnect() {
    if (!loginFunction || !webSocketConnectFunction || aborted) {
      return
    }

    // first, retry websocket connection immediately
    if (webSocketConnectBackoffIndex === 0) {
      webSocketConnectTimeoutId = setTimeout(webSocketConnectFunction, 0)
      webSocketConnectBackoffIndex = 1
      return
    }

    // then, retry login if the the last login was long ago
    const loginStale = new Date().getTime() - loggedInDateTime.getTime() > loginFreshMs
    if (webSocketConnectBackoffIndex === 1 && loginBackoffIndex === 0 && loginStale) {
      loginTimeoutId = setTimeout(loginFunction, 0)
      loginBackoffIndex = 1
      return
    }

    // retry websocket connection with backoff
    webSocketConnectTimeoutId = setTimeout(webSocketConnectFunction, listOfBackoffMs[webSocketConnectBackoffIndex])
    webSocketConnectBackoffIndex = webSocketConnectBackoffIndex >= listOfBackoffMs.length - 1 ? webSocketConnectBackoffIndex : webSocketConnectBackoffIndex + 1
  }

  function reset() {
    loginBackoffIndex = 0
    webSocketConnectBackoffIndex = 0
  }

  function abort() {
    clearTimeout(loginTimeoutId)
    clearTimeout(webSocketConnectTimeoutId)
    aborted = true
  }

  return {
    setRetryLogin,
    setRetryWebSocketConnect,
    setLoggedIn,
    retryLogin,
    retryWebSocketConnect,
    reset,
    abort,
  }
}
