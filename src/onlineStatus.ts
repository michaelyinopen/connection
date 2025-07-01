
export type OnlineStatus = 'Offline' | 'Connecting' | 'Retrying' | 'Online'
export const OnlineStatus = {
  Offline: 'Offline',
  Connecting: 'Connecting',
  Retrying: 'Retrying',
  Online: 'Online'
} as const

export function getStatus({
  online,
  isFirstTimeLogin,
  loggingIn,
  loggedIn,
  isFirstTimeWebSocket,
  webSocketConnecting,
  webSocketOpen
}: { [key in string]: boolean }): OnlineStatus {
  if (!online) {
    return OnlineStatus.Offline
  }

  if (loggingIn && isFirstTimeLogin) {
    return OnlineStatus.Connecting
  }

  if (loggingIn && !isFirstTimeLogin) {
    return OnlineStatus.Retrying
  }

  // not logging in
  if (!loggedIn) {
    return OnlineStatus.Offline
  }

  // logged in
  if (webSocketConnecting && isFirstTimeWebSocket) {
    return OnlineStatus.Connecting
  }

  if (webSocketConnecting && !isFirstTimeWebSocket) {
    return OnlineStatus.Retrying
  }

  // not web socket connecting
  if (webSocketOpen) {
    return OnlineStatus.Online
  }

  return OnlineStatus.Offline
}
