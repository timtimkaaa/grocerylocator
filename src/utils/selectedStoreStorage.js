import { SELECTED_STORE_STORAGE_PREFIX } from '../constants.js'

function getSelectedStoreStorageKey(userId) {
  return `${SELECTED_STORE_STORAGE_PREFIX}:${userId || 'default'}`
}

export function readStoredSelectedStoreId(userId) {
  try {
    return window.localStorage.getItem(getSelectedStoreStorageKey(userId)) || ''
  } catch {
    return ''
  }
}

export function writeStoredSelectedStoreId(userId, storeId) {
  try {
    window.localStorage.setItem(getSelectedStoreStorageKey(userId), storeId)
  } catch {
    // Local storage may be unavailable in private or restricted contexts.
  }
}

export function clearStoredSelectedStoreId(userId) {
  try {
    window.localStorage.removeItem(getSelectedStoreStorageKey(userId))
  } catch {
    // Local storage may be unavailable in private or restricted contexts.
  }
}
