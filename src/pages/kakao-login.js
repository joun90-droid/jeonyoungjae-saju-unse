import { signInWithCustomToken } from 'firebase/auth'
import { getCurrentUser, postJson, signOut } from '../lib/auth.js'
import { getFirebaseAuth, KAKAO_REST_API_KEY } from '../lib/firebase.js'
import { crumbs, pageTemplate } from './layout.js'

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
  const url = `https://kauth.kakao.com/oauth/authorize?${params}`
  const popup = window.open(url, 'saju_kakao_login', 'width=480,height=640')
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
      if (data.type !== 'saju-kakao-oauth') return
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
    throw new Error('카카오 로그인 검증에 실패했습니다. 다시 시도해 주세요.')
  }
  return exchangeKakaoCode(code.code)
}

export async function exchangeKakaoCode(code) {
  const { customToken } = await postJson('/api/social-auth', {
    provider: 'kakao',
    code,
    redirectUri: kakaoRedirectUri(),
  })
  const cred = await signInWithCustomToken(getFirebaseAuth(), customToken)
  const { saveProfile } = await import('../lib/auth.js')
  await saveProfile(cred.user)
  return cred.user
}

export { getCurrentUser, signOut }

export const meta = {
  path: '/auth/kakao/callback',
  title: 'Kakao 로그인 | 영재 사주운',
  description: 'Kakao 로그인 콜백',
}

export function render() {
  const params = new URLSearchParams(location.search)
  const err = params.get('error_description') || params.get('error')
  return pageTemplate({
    kicker: 'Kakao',
    title: 'Kakao 로그인',
    lead: err ? '로그인을 완료하지 못했습니다.' : '로그인 처리를 마무리하는 중입니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { href: '/login', label: '로그인' }, { label: 'Kakao' }]),
    body: `<p class="login-status ${err ? 'is-error' : ''}" data-kakao-status>${err ? `카카오: ${err}` : '잠시만 기다려 주세요…'}</p>`,
  })
}

export function bind(root) {
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

  if (error || !code) return
  exchangeKakaoCode(code)
    .then(() => { location.replace('/') })
    .catch((err) => {
      const el = root?.querySelector('[data-kakao-status]')
      if (el) {
        el.classList.add('is-error')
        el.textContent = err.message || '카카오 로그인에 실패했습니다.'
      }
    })
}
