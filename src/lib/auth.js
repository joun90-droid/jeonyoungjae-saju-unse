import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { getFirebaseAuth } from './firebase.js'
import { refreshSubscriptionFromServer } from '../services/subscription.js'

const USER_KEY = 'saju-auth-user'
const TOKEN_KEY = 'saju-auth-token'

const listeners = new Set()

function cacheUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  const profile = {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || user.email || '사용자',
    photoURL: user.photoURL || '',
    provider: user.providerData?.[0]?.providerId || 'firebase',
  }
  localStorage.setItem(USER_KEY, JSON.stringify(profile))
  return profile
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getCurrentUser() {
  const live = getFirebaseAuth().currentUser
  if (live) return cacheUser(live)
  return getCachedUser()
}

export async function getIdToken() {
  const user = getFirebaseAuth().currentUser
  if (!user) return ''
  const token = await user.getIdToken()
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch { /* quota */ }
  return token
}

export function subscribeAuth(fn) {
  listeners.add(fn)
  fn(getCurrentUser())
  return () => listeners.delete(fn)
}

function emit(profile) {
  listeners.forEach((fn) => {
    try { fn(profile) } catch { /* ignore */ }
  })
}

export async function waitForUser() {
  const auth = getFirebaseAuth()
  if (auth.currentUser) return cacheUser(auth.currentUser)
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub()
      resolve(cacheUser(user))
    })
  })
}

export async function initAuth() {
  const auth = getFirebaseAuth()
  onAuthStateChanged(auth, async (user) => {
    const profile = cacheUser(user)
    if (user) {
      try { await user.getIdToken().then((t) => localStorage.setItem(TOKEN_KEY, t)) } catch { /* ignore */ }
      await refreshSubscriptionFromServer().catch(() => {})
    }
    emit(profile)
  })
  return waitForUser()
}

export async function signOut() {
  await firebaseSignOut(getFirebaseAuth())
  cacheUser(null)
  emit(null)
}

export function authErrorMessage(err) {
  const code = err?.code || ''
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '로그인이 취소되었습니다.'
  }
  if (code === 'auth/popup-blocked') return '팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.'
  if (code === 'auth/unauthorized-domain') {
    return '이 도메인이 Firebase 인증에 아직 등록되지 않았습니다. 콘솔에서 Authorized domains에 추가해 주세요.'
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google 로그인이 Firebase Authentication에서 아직 켜져 있지 않습니다.'
  }
  return err?.message || '로그인에 실패했습니다.'
}

export async function postJson(path, body, { auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = await getIdToken()
    if (!token) throw new Error('로그인이 필요합니다.')
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : '{}',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`)
  return data
}

export async function getJson(path) {
  const token = await getIdToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(path, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`)
  return data
}

export async function saveProfile(user = getFirebaseAuth().currentUser) {
  if (!user) return
  try {
    await postJson('/api/profile', {
      email: user.email || '',
      name: user.displayName || '',
      photoURL: user.photoURL || '',
      provider: user.providerData?.[0]?.providerId || 'firebase',
    }, { auth: true })
  } catch {
    /* 함수 미배포 시에도 로그인은 유지 */
  }
}
