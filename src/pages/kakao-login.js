import { signInWithCustomToken, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getCurrentUser, goSajuHomeAfterLogin, postJson, setProviderHint, signOut } from '../lib/auth.js'
import { getFirebaseAuth, KAKAO_REST_API_KEY } from '../lib/firebase.js'

const STATE_KEY = 'saju_kakao_oauth_state'

export function kakaoRedirectUri() {
  return `${location.origin}/auth/kakao/callback`
}

export function kakaoConfigured() {
  return Boolean(KAKAO_REST_API_KEY)
}

function randomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signInWithKakao() {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('Kakao 앱 키가 아직 설정되지 않았습니다. Kakao Developers에서 REST API 키와 Redirect URI를 등록해 주세요.')
  }
  const state = randomState()
  sessionStorage.setItem(STATE_KEY, state)
  const params = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: kakaoRedirectUri(),
    response_type: 'code',
    state,
  })
  location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
  return new Promise(() => {})
}

export async function exchangeKakaoCode(code) {
  const { customToken } = await postJson('/api/social-auth', {
    provider: 'kakao',
    code,
    redirectUri: kakaoRedirectUri(),
  })
  await setPersistence(getFirebaseAuth(), browserLocalPersistence)
  setProviderHint('kakao')
  const cred = await signInWithCustomToken(getFirebaseAuth(), customToken)
  try {
    const { saveProfile } = await import('../lib/auth.js')
    await saveProfile(cred.user)
  } catch { /* 프로필 저장 실패해도 로그인은 유지 */ }
  return cred.user
}

export { getCurrentUser, signOut }

export const meta = {
  path: '/auth/kakao/callback',
  title: 'Kakao 로그인 | 영재 사주운',
  description: 'Kakao 로그인 콜백',
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
      type: 'saju-kakao-oauth',
      provider: 'kakao',
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
    try { sessionStorage.setItem('saju-oauth-error', '카카오 로그인 검증에 실패했습니다. 다시 시도해 주세요.') } catch { /* ignore */ }
    goSajuHomeAfterLogin()
    return
  }
  exchangeKakaoCode(code)
    .then(() => goSajuHomeAfterLogin())
    .catch((err) => {
      try { sessionStorage.setItem('saju-oauth-error', err.message || '카카오 로그인에 실패했습니다.') } catch { /* ignore */ }
      goSajuHomeAfterLogin()
    })
}
