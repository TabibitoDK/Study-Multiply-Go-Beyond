const isStorageAvailable = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const safeRead = key => {
  if (!isStorageAvailable()) {
    return []
  }
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.warn(`Failed to read ${key} from storage`, error)
    return []
  }
}

const safeWrite = (key, value) => {
  if (!isStorageAvailable()) {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to write ${key} to storage`, error)
  }
}

const FRIENDS_KEY = 'guest_followed_profiles'
const GROUPS_KEY = 'guest_joined_groups'

export const loadGuestFriends = () => safeRead(FRIENDS_KEY)
export const saveGuestFriends = friends => safeWrite(FRIENDS_KEY, friends)

export const loadGuestGroups = () => safeRead(GROUPS_KEY)
export const saveGuestGroups = groups => safeWrite(GROUPS_KEY, groups)

export default {
  loadGuestFriends,
  saveGuestFriends,
  loadGuestGroups,
  saveGuestGroups,
}
