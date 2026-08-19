import '../styles/login.css'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { authErrorMessage, continueWithoutLogin, getCurrentUser, goSajuHomeAfterLogin, saveProfile, setProviderHint, signOut } from '../lib/auth.js'
import { getFirebaseAuth, NAVER_CLIENT_ID } from '../lib/firebase.js'
import { signInWithKakao, kakaoConfigured } from './kakao-login.js'
import { signInWithNaver } from './naver-login.js'
import { SITE } from './site.js'

const EMAIL_KEY = 'saju-saved-email'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(getFirebaseAuth(), provider)
  return cred.user
}

export const meta = {
  path: '/login',
  title: '로그인 | 영재 사주운',
  description: '이메일 또는 소셜로 영재 사주운에 로그인합니다. 기본 사주 분석은 로그인 없이 이용할 수 있습니다.',
}

let uiMode = 'login'
let afterLogin = '/'

export function loginNext() {
  return afterLogin.startsWith('/') ? afterLogin : '/'
}

function savedEmail() {
  try { return localStorage.getItem(EMAIL_KEY) || '' } catch { return '' }
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
}

function overlayEl() {
  return document.getElementById('loginOverlay')
}

export function closeLogin() {
  const root = overlayEl()
  if (root) {
    root.hidden = true
    root.innerHTML = ''
  }
  document.body.classList.remove('is-login-open')
}

function titleForMode() {
  if (uiMode === 'signup') return '이메일 가입'
  if (uiMode === 'reset') return '비밀번호 찾기'
  return '로그인'
}

export function render() {
  const email = savedEmail()
  return `
    <div class="login-screen login-screen-modal">
      <div class="login-card">
        <button type="button" class="login-close" data-login-close aria-label="닫기">닫기</button>
        <h1 class="login-brand">${titleForMode()}</h1>
        <div class="login-tabs" role="tablist">
          <button type="button" data-mode="login" class="${uiMode === 'login' ? 'is-on' : ''}">로그인</button>
          <button type="button" data-mode="signup" class="${uiMode === 'signup' ? 'is-on' : ''}">이메일 가입</button>
          <button type="button" data-mode="reset" class="${uiMode === 'reset' ? 'is-on' : ''}">비밀번호 찾기</button>
        </div>
        ${uiMode === 'reset' ? `
        <form class="login-form" data-reset-form>
          <p class="login-sub">가입한 메일로 재설정 안내를 보냅니다.</p>
          <input class="login-input" id="loginEmail" name="email" type="email" autocomplete="email" required placeholder="이메일" value="${escapeAttr(email)}">
          <button type="submit" class="login-submit" data-reset-submit>재설정 메일 보내기</button>
        </form>
        ` : `
        <form class="login-form" data-email-form>
          ${uiMode === 'signup' ? `<input class="login-input" id="loginName" name="name" type="text" autocomplete="nickname" maxlength="40" placeholder="이름 (선택)">` : ''}
          <input class="login-input" id="loginEmail" name="email" type="email" autocomplete="email" required placeholder="이메일" value="${escapeAttr(email)}">
          <div class="login-pw-wrap">
            <input class="login-input" id="loginPassword" name="password" type="password" autocomplete="${uiMode === 'signup' ? 'new-password' : 'current-password'}" minlength="6" required placeholder="비밀번호 (6자 이상)">
            <button type="button" class="login-pw-toggle" data-toggle-pw="loginPassword" aria-label="비밀번호 보기">보기</button>
          </div>
          ${uiMode === 'signup' ? `
          <div class="login-pw-wrap">
            <input class="login-input" id="loginPassword2" name="password2" type="password" autocomplete="new-password" minlength="6" required placeholder="비밀번호 확인">
            <button type="button" class="login-pw-toggle" data-toggle-pw="loginPassword2" aria-label="비밀번호 보기">보기</button>
          </div>` : ''}
          <button type="submit" class="login-submit" data-email-submit>${uiMode === 'signup' ? '가입하기' : '로그인'}</button>
        </form>
        `}
        <div class="login-or">소셜</div>
        <div class="login-social">
          <button type="button" class="btn-google" data-google>
            <span class="social-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#4285F4" d="M19.6 10.23c0-.71-.06-1.39-.18-2.05H10v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.32 2.99-7.35z"/><path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H1.06v2.59A10 10 0 0 0 10 20z"/><path fill="#FBBC05" d="M4.41 11.92a6 6 0 0 1 0-3.84V5.49H1.06a10 10 0 0 0 0 9.02z"/><path fill="#EA4335" d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0a10 10 0 0 0-8.94 5.49l3.35 2.59C5.2 5.72 7.4 3.98 10 3.98z"/></svg>
            </span>
            <span>Google로 계속하기</span>
          </button>
          ${kakaoConfigured() ? `<button type="button" class="btn-kakao" data-kakao>
            <span class="social-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="18" height="18"><path fill="#191600" d="M10 1.5C4.75 1.5.5 4.86.5 9c0 2.62 1.72 4.92 4.32 6.25-.19.68-.7 2.5-.8 2.9-.13.48.18.48.37.35.15-.1 2.4-1.63 3.38-2.3.72.1 1.47.16 2.23.16 5.25 0 9.5-3.36 9.5-7.5s-4.25-7.5-9.5-7.5z"/></svg>
            </span>
            <span>카카오로 계속하기</span>
          </button>` : ''}
          ${NAVER_CLIENT_ID ? `<button type="button" class="btn-naver" data-naver>
            <span class="social-icon social-icon-naver" aria-hidden="true">N</span>
            <span>네이버로 계속하기</span>
          </button>` : ''}
        </div>
        <p class="login-save-hint">처음이면 이메일 가입. 카카오·네이버로 쓰던 계정은 소셜로 이어 주세요.</p>
        <p class="login-status" data-login-status hidden></p>
        <button type="button" class="continue-without-login" data-guest-continue>닫고 운세 보기</button>
        <div class="login-legal">
          <a href="/privacy-policy">개인정보</a>
          <a href="/terms-of-service">약관</a>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
        </div>
      </div>
    </div>`
}

async function applySessionOptions(root) {
  await setPersistence(getFirebaseAuth(), browserLocalPersistence)
  // 카카오/네이버는 리다이렉트 콜백에서 다시 힌트를 남기므로, 여기서 지워도 안전합니다.
  setProviderHint('')
  const email = root.querySelector('#loginEmail')?.value?.trim() || ''
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email)
  } catch { /* ignore */ }
}

export function bindLoginButtons(root) {
  const status = root.querySelector('[data-login-status]')
  const submitBtn = root.querySelector('[data-email-submit]') || root.querySelector('[data-reset-submit]')
  const setStatus = (msg, kind = '') => {
    if (!status) return
    status.hidden = !msg
    status.textContent = msg
    status.classList.toggle('is-error', kind === 'error')
    status.classList.toggle('is-ok', kind === 'ok')
  }
  const busy = (btn, on) => {
    if (!btn) return
    btn.disabled = on
    if (on) btn.dataset.label = btn.innerHTML
    btn.innerHTML = on ? '<span class="login-spinner"></span>처리 중…' : (btn.dataset.label || btn.innerHTML)
  }
  const done = async () => {
    await saveProfile()
    const next = loginNext()
    closeLogin()
    if (next && next !== '/' && !next.startsWith('/#') && next !== `${location.pathname}${location.search}`) {
      location.assign(next)
      return
    }
    goSajuHomeAfterLogin()
  }

  root.querySelector('[data-login-close]')?.addEventListener('click', closeLogin)

  root.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLogin({ mode: btn.getAttribute('data-mode'), next: afterLogin })
    })
  })

  root.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = root.querySelector(`#${btn.getAttribute('data-toggle-pw')}`)
      if (!input) return
      const show = input.type === 'password'
      input.type = show ? 'text' : 'password'
      btn.textContent = show ? '숨김' : '보기'
      btn.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기')
    })
  })

  root.querySelector('[data-reset-form]')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = root.querySelector('#loginEmail')?.value?.trim()
    if (!email) {
      setStatus('비밀번호를 재설정할 이메일을 입력해 주세요.', 'error')
      return
    }
    busy(submitBtn, true)
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email)
      setStatus('재설정 메일을 보냈습니다. 메일함을 확인해 주세요.', 'ok')
    } catch (err) {
      setStatus(authErrorMessage(err), 'error')
    } finally {
      busy(submitBtn, false)
    }
  })

  root.querySelector('[data-email-form]')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = root.querySelector('#loginEmail')?.value?.trim()
    const password = root.querySelector('#loginPassword')?.value || ''
    const name = root.querySelector('#loginName')?.value?.trim() || ''
    const password2 = root.querySelector('#loginPassword2')?.value || ''
    if (!email || !password) {
      setStatus('이메일과 비밀번호를 입력해 주세요.', 'error')
      return
    }
    if (uiMode === 'signup' && password.length < 6) {
      setStatus('비밀번호는 6자 이상이어야 합니다.', 'error')
      return
    }
    if (uiMode === 'signup' && password !== password2) {
      setStatus('비밀번호 확인이 같지 않습니다.', 'error')
      return
    }
    busy(submitBtn, true)
    try {
      await applySessionOptions(root)
      const auth = getFirebaseAuth()
      if (uiMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err), 'error')
      busy(submitBtn, false)
    }
  })

  root.querySelector('[data-google]')?.addEventListener('click', async () => {
    setStatus('')
    try {
      await applySessionOptions(root)
      await signInWithGoogle()
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err) || err.message, 'error')
    }
  })

  root.querySelector('[data-kakao]')?.addEventListener('click', async () => {
    setStatus('')
    try {
      await applySessionOptions(root)
      await signInWithKakao()
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err) || err.message, 'error')
    }
  })

  root.querySelector('[data-naver]')?.addEventListener('click', async () => {
    setStatus('')
    try {
      await applySessionOptions(root)
      await signInWithNaver()
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err) || err.message, 'error')
    }
  })

  root.querySelector('[data-guest-continue]')?.addEventListener('click', () => {
    closeLogin()
    continueWithoutLogin()
  })
}

export function openLogin({ signup = false, reset = false, mode = '', next = '/' } = {}) {
  if (mode === 'signup' || mode === 'reset' || mode === 'login') uiMode = mode
  else if (reset) uiMode = 'reset'
  else if (signup) uiMode = 'signup'
  else uiMode = 'login'
  afterLogin = next && next.startsWith('/') ? next : '/'
  const paywall = document.getElementById('paywall')
  if (paywall) paywall.hidden = true
  let root = overlayEl()
  if (!root) {
    root = document.createElement('div')
    root.id = 'loginOverlay'
    root.className = 'login-overlay'
    root.hidden = true
    document.body.appendChild(root)
    root.addEventListener('click', (e) => {
      if (e.target === root) closeLogin()
    })
  }
  root.innerHTML = render()
  root.hidden = false
  document.body.classList.add('is-login-open')
  bindLoginButtons(root)
  root.querySelector('#loginEmail')?.focus()
}

export function mountLogin() {
  try {
    const oauthErr = sessionStorage.getItem('saju-oauth-error')
    if (oauthErr) {
      sessionStorage.removeItem('saju-oauth-error')
      openLogin({ next: '/#birthForm' })
      const status = overlayEl()?.querySelector('[data-login-status]')
      if (status) {
        status.hidden = false
        status.textContent = oauthErr
        status.classList.add('is-error')
      }
    }
  } catch { /* ignore */ }
  if (!overlayEl()) {
    const root = document.createElement('div')
    root.id = 'loginOverlay'
    root.className = 'login-overlay'
    root.hidden = true
    document.body.appendChild(root)
    root.addEventListener('click', (e) => {
      if (e.target === root) closeLogin()
    })
  }
  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open-login]')
    if (!open) return
    e.preventDefault()
    openLogin({
      signup: open.hasAttribute('data-signup'),
      next: open.getAttribute('data-login-next') || '/',
    })
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayEl() && !overlayEl().hidden) closeLogin()
  })
}

export function bind(root) {
  bindLoginButtons(root)
}

export { getCurrentUser, signOut }
