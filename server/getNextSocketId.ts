let socketId = 0

export function getNextSocketId() {
  socketId = socketId + 1
  return socketId
}
