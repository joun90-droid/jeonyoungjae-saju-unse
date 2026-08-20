import { getCurrentUser, signOut, subscribeAuth } from '../lib/auth.js'
import { getSubscriptionStatus, statusLabel } from '../services/subscription.js'

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
}

export function authBarHtml(user = getCurrentUser()) {
  const status = getSubscriptionStatus()
  if (!user) {
    return `
      <div class="auth-inner">
        <span class="auth-badge auth-guest">게스트로 이용 중</span>
        <button type="button" class="auth-btn auth-up auth-login-cta" data-open-login>더 많은 기능을 사용하려면 로그인</button>
      </div>`
  }
  const premium = status !== 'free'
  const providerBadge = user.provider === 'kakao'
    ? `<span class="auth-provider-badge auth-provider-kakao" title="카카오로 로그인" aria-label="카카오로 로그인"><svg viewBox="0 0 24 24" width="9" height="9"><path fill="#191600" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.83 5.19 4.59 6.58-.2.73-.73 2.67-.84 3.08-.13.5.18.5.38.36.16-.11 2.53-1.72 3.56-2.42.75.11 1.53.17 2.31.17 5.52 0 10-3.48 10-7.77S17.52 3 12 3z"/></svg></span>`
    : user.provider === 'naver'
      ? `<span class="auth-provider-badge auth-provider-naver" title="네이버로 로그인" aria-label="네이버로 로그인">N</span>`
      : user.provider === 'google.com' || user.provider === 'google'
        ? `<span class="auth-provider-badge auth-provider-google" title="구글로 로그인" aria-label="구글로 로그인"><svg viewBox="0 0 20 20" width="10" height="10"><path fill="#4285F4" d="M19.6 10.23c0-.71-.06-1.39-.18-2.05H10v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.32 2.99-7.35z"/><path fill="#34A853" d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H1.06v2.59A10 10 0 0 0 10 20z"/><path fill="#FBBC05" d="M4.41 11.92a6 6 0 0 1 0-3.84V5.49H1.06a10 10 0 0 0 0 9.02z"/><path fill="#EA4335" d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0a10 10 0 0 0-8.94 5.49l3.35 2.59C5.2 5.72 7.4 3.98 10 3.98z"/></svg></span>`
        : ''
  const photo = user.photoURL
    ? `<span class="auth-avatar-wrap">${providerBadge}<img class="auth-avatar" src="${escapeHtml(user.photoURL)}" alt=""></span>`
    : `<span class="auth-avatar-wrap">${providerBadge}<span class="auth-avatar auth-avatar-fallback">${escapeHtml((user.name || '?').slice(0, 1))}</span></span>`
  return `
    <div class="auth-inner">
      <details class="auth-menu">
        <summary>${photo}<span>${escapeHtml(user.name)}</span></summary>
        <div class="auth-dropdown">
          <p><strong>${escapeHtml(user.name)}</strong></p>
          ${user.email && user.email !== user.name ? `<p class="privacy">${escapeHtml(user.email)}</p>` : ''}
          <a class="auth-dropdown-link" href="/account">
            <span>구독: ${statusLabel(status)}</span>
            <span class="auth-dropdown-arrow" aria-hidden="true">→</span>
          </a>
          <button type="button" class="btn-ghost" data-sign-out>로그아웃</button>
        </div>
      </details>
      ${premium
        ? `<span class="auth-badge">Premium</span>`
        : `<a class="auth-btn auth-up" href="/pricing">프리미엄 업그레이드</a>`}
    </div>`
}

export function bindAuthBar(root = document.getElementById('authBar')) {
  if (!root) return
  root.querySelector('[data-sign-out]')?.addEventListener('click', async () => {
    await signOut()
    location.assign('/')
  })
}

export function renderAuthBar(root = document.getElementById('authBar')) {
  if (!root) return
  root.innerHTML = authBarHtml()
  bindAuthBar(root)
}

export function mountAuthBar(root = document.getElementById('authBar')) {
  renderAuthBar(root)
  subscribeAuth(() => renderAuthBar(root))
  // <details>는 기본적으로 summary를 다시 눌러야 닫혀서, 바깥을 클릭해도 닫히도록 보강합니다.
  document.addEventListener('click', (e) => {
    const details = root?.querySelector('.auth-menu')
    if (!details || !details.open || details.contains(e.target)) return
    details.open = false
  })
}
