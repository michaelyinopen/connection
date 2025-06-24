let userId = 0

export function getNextUserId(){
  // maybe database?
  userId = userId + 1
  return userId
}
