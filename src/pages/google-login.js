import '../styles/login.css'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { authErrorMessage, continueWithoutLogin, getCurrentUser, saveProfile, signOut } from '../lib/auth.js'
import { getFirebaseAuth } from '../lib/firebase.js'
import { SITE } from './site.js'

const EMAIL_KEY = 'saju-saved-email'
const REMEMBER_KEY = 'saju-remember-login'

export async function signInWithGoogle() {
  const cred = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
  await saveProfile(cred.user)
  return cred.user
}

export const meta = {
  path: '/login',
  title: '로그인 | 영재 사주운',
  description: 'Google, Kakao, Naver 또는 이메일로 영재 사주운에 로그인합니다.',
}

export function loginNext() {
  const next = new URLSearchParams(location.search).get('next') || '/'
  return next.startsWith('/') ? next : '/'
}

function isSignupMode() {
  return location.pathname === '/signup' || new URLSearchParams(location.search).get('mode') === 'signup'
}

function modeUrl(signup) {
  const q = new URLSearchParams(location.search)
  q.delete('mode')
  const qs = q.toString()
  const path = signup ? '/signup' : '/login'
  return qs ? `${path}?${qs}` : path
}

function savedEmail() {
  try { return localStorage.getItem(EMAIL_KEY) || '' } catch { return '' }
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
}

export function render() {
  const email = savedEmail()
  const signup = isSignupMode()
  return `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-logo" aria-hidden="true">🔮</div>
        <p class="login-kicker">K-사주</p>
        <h1 class="login-brand">영재 사주운</h1>
        <p class="login-sub">당신의 운을 알아보세요</p>
        <div class="login-divider"></div>
        <form class="login-form" data-email-form>
          <label class="login-label" for="loginEmail">📧 이메일 주소</label>
          <input class="login-input" id="loginEmail" name="email" type="email" autocomplete="email" required placeholder="you@example.com" value="${escapeAttr(email)}">
          <label class="login-label" for="loginPassword">비밀번호</label>
          <input class="login-input" id="loginPassword" name="password" type="password" autocomplete="current-password" minlength="6" placeholder="6자 이상">
          <button type="submit" class="login-btn login-btn-email" data-email-submit>${signup ? '회원가입' : '이메일로 로그인'}</button>
        </form>
        <div class="login-social">
          <button type="button" class="login-btn login-btn-google" data-google-login>🔐 Google로 로그인</button>
          <button type="button" class="login-btn login-btn-kakao" data-kakao-login>🎨 Kakao로 로그인</button>
          <button type="button" class="login-btn login-btn-naver" data-naver-login>🔗 Naver로 로그인</button>
        </div>
        <div class="login-checks">
          <label><input type="checkbox" data-remember checked> 자동 로그인 유지</label>
          <label><input type="checkbox" data-save-email ${email ? 'checked' : ''}> 정보 저장</label>
        </div>
        <div class="login-help">
          <button type="button" data-find-id>아이디 찾기</button>
          <span>|</span>
          <button type="button" data-find-pw>비밀번호 찾기</button>
        </div>
        <p class="login-signup">
          ${signup
            ? '이미 계정이 있으신가요? <button type="button" data-toggle-mode>로그인</button>'
            : '처음이신가요? <button type="button" data-toggle-mode>회원가입</button>'}
        </p>
        <p class="login-status" data-login-status hidden></p>
        <div class="divider"><span>또는</span></div>
        <button type="button" class="continue-without-login" data-guest-continue>로그인 없이 계속 사용하기</button>
        <div class="login-legal">
          <a href="/privacy-policy">개인정보</a>
          <a href="/terms-of-service">약관</a>
          <a href="/">홈</a>
          <a href="mailto:${SITE.email}">${SITE.email}</a>
        </div>
      </div>
    </div>`
}

async function applySessionOptions(root) {
  const remember = root.querySelector('[data-remember]')?.checked !== false
  const save = root.querySelector('[data-save-email]')?.checked
  const email = root.querySelector('#loginEmail')?.value?.trim() || ''
  try { localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0') } catch { /* ignore */ }
  try {
    if (save && email) localStorage.setItem(EMAIL_KEY, email)
    else if (!save) localStorage.removeItem(EMAIL_KEY)
  } catch { /* ignore */ }
  await setPersistence(
    getFirebaseAuth(),
    remember ? browserLocalPersistence : browserSessionPersistence,
  )
}

export function bindLoginButtons(root) {
  const status = root.querySelector('[data-login-status]')
  const submitBtn = root.querySelector('[data-email-submit]')
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
    location.assign(loginNext())
  }

  root.querySelector('[data-toggle-mode]')?.addEventListener('click', () => {
    location.assign(modeUrl(!isSignupMode()))
  })

  root.querySelector('[data-find-id]')?.addEventListener('click', () => {
    setStatus('아이디는 가입하신 이메일 주소입니다. 비밀번호 찾기를 이용해 주세요.', 'ok')
  })

  root.querySelector('[data-find-pw]')?.addEventListener('click', async () => {
    const email = root.querySelector('#loginEmail')?.value?.trim()
    if (!email) {
      setStatus('비밀번호를 재설정할 이메일을 먼저 입력해 주세요.', 'error')
      return
    }
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email)
      setStatus('재설정 메일을 보냈습니다. 메일함을 확인해 주세요.', 'ok')
    } catch (err) {
      setStatus(authErrorMessage(err), 'error')
    }
  })

  root.querySelector('[data-email-form]')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = root.querySelector('#loginEmail')?.value?.trim()
    const password = root.querySelector('#loginPassword')?.value || ''
    const signup = isSignupMode()
    if (!email || !password) {
      setStatus('이메일과 비밀번호를 입력해 주세요.', 'error')
      return
    }
    busy(submitBtn, true)
    try {
      await applySessionOptions(root)
      if (signup) await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      else await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err), 'error')
      busy(submitBtn, false)
    }
  })

  const social = async (btn, fn, label) => {
    setStatus(`${label} 창을 여는 중…`)
    busy(btn, true)
    try {
      await applySessionOptions(root)
      await fn()
      await done()
    } catch (err) {
      setStatus(authErrorMessage(err), 'error')
      busy(btn, false)
    }
  }

  root.querySelector('[data-google-login]')?.addEventListener('click', () => {
    social(root.querySelector('[data-google-login]'), signInWithGoogle, 'Google')
  })
  root.querySelector('[data-kakao-login]')?.addEventListener('click', () => {
    social(root.querySelector('[data-kakao-login]'), async () => {
      const { signInWithKakao } = await import('./kakao-login.js')
      await signInWithKakao()
    }, 'Kakao')
  })
  root.querySelector('[data-naver-login]')?.addEventListener('click', () => {
    social(root.querySelector('[data-naver-login]'), async () => {
      const { signInWithNaver } = await import('./naver-login.js')
      await signInWithNaver()
    }, 'Naver')
  })

  root.querySelector('[data-guest-continue]')?.addEventListener('click', () => {
    continueWithoutLogin()
  })
}

export function bind(root) {
  bindLoginButtons(root)
}

export { getCurrentUser, signOut }
