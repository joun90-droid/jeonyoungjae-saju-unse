import { signInWithCustomToken, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getCurrentUser, goSajuHomeAfterLogin, postJson, setProviderHint, signOut } from '../lib/auth.js'
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
  const redirectUri = naverRedirectUri()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NAVER_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
  })
  location.assign(`https://nid.naver.com/oauth2.0/authorize?${params.toString()}`)
  return new Promise(() => {})
}

export async function exchangeNaverCode(code, state) {
  const { customToken } = await postJson('/api/social-auth', {
    provider: 'naver',
    code,
    state: state || '',
    redirectUri: naverRedirectUri(),
  })
  await setPersistence(getFirebaseAuth(), browserLocalPersistence)
  setProviderHint('naver')
  const cred = await signInWithCustomToken(getFirebaseAuth(), customToken)
  try {
    const { saveProfile } = await import('../lib/auth.js')
    await saveProfile(cred.user)
  } catch { /* 프로필 저장 실패해도 로그인은 유지 */ }
  return cred.user
}

export { getCurrentUser, signOut }

export const meta = {
  path: '/auth/naver/callback',
  title: 'Naver 로그인 | 영재 사주운',
  description: 'Naver 로그인 콜백',
}

export function render() {
  return ''
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
    window.close()
    return
  }

  if (error || !code) {
    goSajuHomeAfterLogin()
    return
  }
  const expected = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  if (expected && state !== expected) {
    try { sessionStorage.setItem('saju-oauth-error', '네이버 로그인 검증에 실패했습니다. 다시 시도해 주세요.') } catch { /* ignore */ }
    goSajuHomeAfterLogin()
    return
  }
  exchangeNaverCode(code, state)
    .then(() => goSajuHomeAfterLogin())
    .catch((err) => {
      try { sessionStorage.setItem('saju-oauth-error', err.message || '네이버 로그인에 실패했습니다.') } catch { /* ignore */ }
      goSajuHomeAfterLogin()
    })
}
