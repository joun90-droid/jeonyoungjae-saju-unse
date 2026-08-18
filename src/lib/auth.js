import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { getFirebaseAuth } from './firebase.js'
import { refreshSubscriptionFromServer } from '../services/subscription.js'

const USER_KEY = 'saju-auth-user'
const TOKEN_KEY = 'saju-auth-token'
const LOGIN_FLAG = 'isLoggedIn'
const GUEST_NOTICE = 'saju-guest-notice'

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
  localStorage.setItem(LOGIN_FLAG, 'true')
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

export function isLoggedIn() {
  if (getFirebaseAuth().currentUser) return true
  try {
    if (localStorage.getItem(LOGIN_FLAG) === 'true') return true
    return Boolean(getCachedUser())
  } catch {
    return false
  }
}

export function continueWithoutLogin() {
  localStorage.setItem(LOGIN_FLAG, 'false')
  localStorage.setItem(GUEST_NOTICE, '1')
  if (location.pathname !== '/' || location.search) location.assign('/')
}

export function consumeGuestNotice() {
  try {
    if (localStorage.getItem(GUEST_NOTICE) !== '1') return false
    localStorage.removeItem(GUEST_NOTICE)
    return true
  } catch {
    return false
  }
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
  try { localStorage.setItem(LOGIN_FLAG, 'false') } catch { /* ignore */ }
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
    return '이 로그인 방법이 Firebase Authentication에서 아직 켜져 있지 않습니다.'
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return '이메일 또는 비밀번호가 올바르지 않습니다.'
  }
  if (code === 'auth/email-already-in-use') return '이미 가입된 이메일입니다. 로그인해 주세요.'
  if (code === 'auth/weak-password') return '비밀번호는 6자 이상이어야 합니다.'
  if (code === 'auth/invalid-email') return '이메일 형식을 확인해 주세요.'
  if (code === 'auth/too-many-requests') return '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.'
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
