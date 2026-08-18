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
        <a class="auth-btn auth-up" href="/login">로그인</a>
      </div>`
  }
  const premium = status !== 'free'
  const photo = user.photoURL
    ? `<img class="auth-avatar" src="${escapeHtml(user.photoURL)}" alt="">`
    : `<span class="auth-avatar auth-avatar-fallback">${escapeHtml((user.name || '?').slice(0, 1))}</span>`
  return `
    <div class="auth-inner">
      <details class="auth-menu">
        <summary>${photo}<span>${escapeHtml(user.name)}</span></summary>
        <div class="auth-dropdown">
          <p><strong>${escapeHtml(user.name)}</strong></p>
          <p class="privacy">${escapeHtml(user.email || '')}</p>
          <p>구독: ${statusLabel(status)}</p>
          <button type="button" class="btn-ghost" data-sign-out>로그아웃</button>
        </div>
      </details>
      ${premium
        ? `<span class="auth-badge">구독 중 ✓</span>`
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
}
