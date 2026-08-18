import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { authErrorMessage, getCurrentUser, saveProfile, signOut } from '../lib/auth.js'
import { getFirebaseAuth } from '../lib/firebase.js'
import { crumbs, pageTemplate } from './layout.js'

export async function signInWithGoogle() {
  const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
  await saveProfile(cred.user)
  return cred.user
}

export const meta = {
  path: '/login',
  title: '로그인 | 영재 사주운',
  description: 'Google 또는 Kakao로 영재 사주운에 로그인합니다. 프리미엄 구독 시 로그인이 필요합니다.',
}

export function loginNext() {
  const next = new URLSearchParams(location.search).get('next') || '/'
  return next.startsWith('/') ? next : '/'
}

export function renderLogin(bodyExtra = '') {
  return pageTemplate({
    kicker: 'Login',
    title: '로그인',
    lead: '프리미엄 구독·결제 내역을 계정에 연결하려면 로그인해 주세요. 사주 계산은 여전히 이 기기에서만 이뤄집니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '로그인' }]),
    body: `
      <div class="login-actions">
        <button type="button" class="btn-google" data-google-login>Google 로그인</button>
        <button type="button" class="btn-kakao" data-kakao-login>Kakao 로그인</button>
        <p class="login-status" data-login-status hidden></p>
        <p class="privacy">로그인하면 <a href="/terms-of-service">이용약관</a> 및 <a href="/privacy-policy">개인정보처리방침</a>에 동의합니다.</p>
      </div>
      ${bodyExtra}
    `,
  })
}

export function render() {
  return renderLogin()
}

export function bindLoginButtons(root) {
  const status = root.querySelector('[data-login-status]')
  const setStatus = (msg, isError = false) => {
    if (!status) return
    status.hidden = !msg
    status.textContent = msg
    status.classList.toggle('is-error', isError)
  }

  root.querySelector('[data-google-login]')?.addEventListener('click', async () => {
    setStatus('Google 로그인 창을 여는 중…')
    try {
      await signInWithGoogle()
      location.assign(loginNext())
    } catch (err) {
      setStatus(authErrorMessage(err), true)
    }
  })

  root.querySelector('[data-kakao-login]')?.addEventListener('click', async () => {
    setStatus('Kakao 로그인 창을 여는 중…')
    try {
      const { signInWithKakao } = await import('./kakao-login.js')
      await signInWithKakao()
      location.assign(loginNext())
    } catch (err) {
      setStatus(authErrorMessage(err), true)
    }
  })
}

export function bind(root) {
  bindLoginButtons(root)
}

export { getCurrentUser, signOut }
