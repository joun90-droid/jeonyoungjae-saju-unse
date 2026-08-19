import { signInWithCustomToken } from 'firebase/auth'
import { getCurrentUser, goSajuHomeAfterLogin, postJson, signOut } from '../lib/auth.js'
import { getFirebaseAuth, NAVER_CLIENT_ID } from '../lib/firebase.js'

const STATE_KEY = 'saju_naver_oauth_state'

export function naverRedirectUri() {
  return `${location.origin}/auth/naver/callback`
}

function randomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signInWithNaver() {
  if (!NAVER_CLIENT_ID) {
    throw new Error('Naver 앱 키가 아직 설정되지 않았습니다. Naver Developers에서 Client ID와 Callback URL을 등록해 주세요.')
  }
  const state = randomState()
  sessionStorage.setItem(STATE_KEY, state)
  const params = new URLSearchParams({
    client_id: NAVER_CLIENT_ID,
    redirect_uri: naverRedirectUri(),
    response_type: 'code',
    state,
  })
  const url = `https://nid.naver.com/oauth2.0/authorize?${params}`
  const popup = window.open(url, 'saju_naver_login', 'width=480,height=640')
  if (!popup) {
    location.assign(url)
    return new Promise(() => {})
  }

  const code = await new Promise((resolve, reject) => {
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup()
        reject(new Error('로그인 창이 닫혔습니다.'))
      }
    }, 400)
    function cleanup() {
      window.clearInterval(timer)
      window.removeEventListener('message', onMessage)
    }
    function onMessage(event) {
      if (event.origin !== location.origin) return
      const data = event.data || {}
      if (data.type !== 'saju-naver-oauth') return
      cleanup()
      popup.close()
      if (data.error) reject(new Error(data.error))
      else resolve({ code: data.code, state: data.state })
    }
    window.addEventListener('message', onMessage)
  })

  const expected = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  if (!code.code || code.state !== expected) {
    throw new Error('네이버 로그인 검증에 실패했습니다. 다시 시도해 주세요.')
  }
  return exchangeNaverCode(code.code)
}

export async function exchangeNaverCode(code) {
  const { customToken } = await postJson('/api/social-auth', {
    provider: 'naver',
    code,
    redirectUri: naverRedirectUri(),
  })
  const cred = await signInWithCustomToken(getFirebaseAuth(), customToken)
  const { saveProfile } = await import('../lib/auth.js')
  await saveProfile(cred.user)
  return cred.user
}

export { getCurrentUser, signOut }

export const meta = {
  path: '/auth/naver/callback',
  title: 'Naver 로그인 | 영재 사주운',
  description: 'Naver 로그인 콜백',
}

export function render() {
  const params = new URLSearchParams(location.search)
  const err = params.get('error_description') || params.get('error')
  return `<p class="login-status ${err ? 'is-error' : ''}" data-naver-status>${err ? `네이버: ${err}` : '로그인되었습니다. 사주로 이동합니다…'}</p>`
}

export function bind() {
  const params = new URLSearchParams(location.search)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error_description') || params.get('error')

  if (window.opener && window.opener !== window) {
    window.opener.postMessage({
      type: 'saju-naver-oauth',
      provider: 'naver',
      code,
      state,
      error: error || '',
    }, location.origin)
    window.setTimeout(() => window.close(), 120)
    window.setTimeout(() => goSajuHomeAfterLogin(), 400)
    return
  }

  if (error || !code) {
    goSajuHomeAfterLogin()
    return
  }
  exchangeNaverCode(code)
    .then(() => goSajuHomeAfterLogin())
    .catch((err) => {
      try { sessionStorage.setItem('saju-oauth-error', err.message || '네이버 로그인에 실패했습니다.') } catch { /* ignore */ }
      goSajuHomeAfterLogin()
    })
}
