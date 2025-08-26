export const onlineStatus = {
  Offline: 'Offline',
  Connecting: 'Connecting',
  Retrying: 'Retrying',
  Online: 'Online'
} as const

export type OnlineStatus = typeof onlineStatus[keyof typeof onlineStatus]

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
    return onlineStatus.Offline
  }

  if (loggingIn && isFirstTimeLogin) {
    return onlineStatus.Connecting
  }

  if (loggingIn && !isFirstTimeLogin) {
    return onlineStatus.Retrying
  }

  // not logging in
  if (!loggedIn) {
    return onlineStatus.Offline
  }

  // logged in
  if (webSocketConnecting && isFirstTimeWebSocket) {
    return onlineStatus.Connecting
  }

  if (webSocketConnecting && !isFirstTimeWebSocket) {
    return onlineStatus.Retrying
  }

  // not web socket connecting
  if (webSocketOpen) {
    return onlineStatus.Online
  }

  return onlineStatus.Offline
}
