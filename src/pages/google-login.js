import '../styles/login.css'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { authErrorMessage, continueWithoutLogin, getCurrentUser, saveProfile, signOut } from '../lib/auth.js'
import { getFirebaseAuth, NAVER_CLIENT_ID } from '../lib/firebase.js'
import { signInWithKakao, kakaoConfigured } from './kakao-login.js'
import { signInWithNaver } from './naver-login.js'
import { SITE } from './site.js'

const EMAIL_KEY = 'saju-saved-email'

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
          ${kakaoConfigured() ? `<button type="button" class="btn-kakao" data-kakao>카카오로 계속하기</button>` : ''}
          ${NAVER_CLIENT_ID ? `<button type="button" class="btn-naver" data-naver>네이버로 계속하기</button>` : ''}
          ${!kakaoConfigured() && !NAVER_CLIENT_ID ? `<p class="login-save-hint">카카오·네이버는 영재 사주운 전용 앱을 연결한 뒤 열립니다. 지금은 이메일로 가입·로그인하면 됩니다.</p>` : ''}
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
    const here = `${location.pathname}${location.search}`
    if (next !== '/' && next !== here) location.assign(next)
    else if (next === '/' && location.pathname !== '/') location.assign('/')
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
