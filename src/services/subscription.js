const SUB_KEY = 'subscription'
const SUB_DATE = 'subscriptionDate'
const SUB_ENDS = 'subscriptionEndsAt'
const PREMIUM_FLAG = 'isPremium'

export function getSubscription() {
  try {
    return localStorage.getItem(SUB_KEY) || 'free'
  } catch {
    return 'free'
  }
}

export function getSubscriptionEndDate() {
  const raw = localStorage.getItem(SUB_ENDS) || ''
  if (raw) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return d
  }
  const start = localStorage.getItem(SUB_DATE)
  if (!start) return null
  const d = new Date(start)
  if (Number.isNaN(d.getTime())) return null
  if (getSubscription() === 'lifetime' || getSubscription() === 'premium_lifetime') {
    d.setFullYear(d.getFullYear() + 99)
    return d
  }
  d.setDate(d.getDate() + 30)
  return d
}

export function isSubscriptionExpired() {
  const plan = getSubscription()
  if (plan === 'lifetime' || plan === 'premium_lifetime') return false
  if (plan !== 'premium' && plan !== 'premium_monthly') return true
  const end = getSubscriptionEndDate()
  if (!end) return true
  return Date.now() > end.getTime()
}

export function applySubscription(plan, { startedAt, endsAt } = {}) {
  const normalized = plan === 'premium_lifetime' || plan === 'lifetime'
    ? 'lifetime'
    : plan === 'premium_monthly' || plan === 'premium'
      ? 'premium'
      : 'free'
  const start = startedAt || new Date().toISOString()
  let end = endsAt
  if (!end && normalized === 'premium') {
    const d = new Date(start)
    d.setDate(d.getDate() + 30)
    end = d.toISOString()
  }
  if (!end && normalized === 'lifetime') {
    const d = new Date(start)
    d.setFullYear(d.getFullYear() + 99)
    end = d.toISOString()
  }
  localStorage.setItem(SUB_KEY, normalized)
  localStorage.setItem(SUB_DATE, start)
  if (end) localStorage.setItem(SUB_ENDS, end)
  else localStorage.removeItem(SUB_ENDS)
  localStorage.setItem(PREMIUM_FLAG, normalized === 'free' ? '' : '1')
}

export function setSubscription(type) {
  applySubscription(type)
}

export function isPremiumValid() {
  const plan = getSubscription()
  if (plan === 'lifetime' || plan === 'premium_lifetime') return true
  if (plan === 'premium' || plan === 'premium_monthly') return !isSubscriptionExpired()
  return false
}

export function isPremium() {
  return isPremiumValid()
}

/** @returns {'free' | 'premium_monthly' | 'premium_lifetime'} */
export function getSubscriptionStatus() {
  if (!isPremium()) return 'free'
  const plan = getSubscription()
  if (plan === 'lifetime' || plan === 'premium_lifetime') return 'premium_lifetime'
  return 'premium_monthly'
}

export function checkSubscription() {
  return getSubscriptionStatus()
}

export function statusLabel(status = getSubscriptionStatus()) {
  if (status === 'premium_lifetime') return '평생 구독 중'
  if (status === 'premium_monthly') return '월간 구독 중'
  return '무료'
}

export async function refreshSubscriptionFromServer() {
  const { getIdToken } = await import('../lib/auth.js')
  const token = await getIdToken()
  if (!token) return getSubscriptionStatus()
  const res = await fetch('/api/subscription', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return getSubscriptionStatus()
  const data = await res.json()
  applySubscription(data.plan || 'free', {
    startedAt: data.startedAt,
    endsAt: data.endsAt,
  })
  return getSubscriptionStatus()
}

export function showLoginPaywall(message = '상세 해석은 로그인 후 이용 가능합니다.') {
  let el = document.getElementById('paywall')
  if (!el) {
    el = document.createElement('div')
    el.id = 'paywall'
    el.className = 'paywall'
    document.body.appendChild(el)
  }
  el.hidden = false
  el.innerHTML = `
    <div class="paywall-card card">
      <p class="eyebrow">Login</p>
      <h2>로그인이 필요합니다</h2>
      <p class="page-lead">${message}</p>
      <div class="guess-actions">
        <a class="btn-secondary" href="/login">로그인하러 가기</a>
        <button type="button" class="btn-ghost" data-paywall-close>닫기</button>
      </div>
    </div>`
  el.querySelector('[data-paywall-close]')?.addEventListener('click', () => {
    el.hidden = true
  })
  el.addEventListener('click', (e) => {
    if (e.target === el) el.hidden = true
  })
  return false
}

export function showPaywall(message = '상세 분석은 프리미엄이 필요합니다.') {
  let loggedIn = false
  try {
    loggedIn = localStorage.getItem('isLoggedIn') === 'true' || Boolean(localStorage.getItem('saju-auth-user'))
  } catch { /* ignore */ }
  if (!loggedIn) {
    return showLoginPaywall('상세 해석은 로그인 후 이용 가능합니다.')
  }
  let el = document.getElementById('paywall')
  if (!el) {
    el = document.createElement('div')
    el.id = 'paywall'
    el.className = 'paywall'
    document.body.appendChild(el)
  }
  el.hidden = false
  el.innerHTML = `
    <div class="paywall-card card">
      <p class="eyebrow">Premium</p>
      <h2>프리미엄 구독이 필요합니다</h2>
      <p class="page-lead">${message}</p>
      <ul class="paywall-perks">
        <li>오늘의 운세 500자 상세 · 이력 무제한</li>
        <li>궁합·심리·타로·MBTI 상세 해석</li>
        <li>만세력 5~10년 흐름</li>
        <li>알림 시간 커스텀 · 광고 없는 화면</li>
      </ul>
      <p class="price-line"><strong>₩4,900</strong>/월 · 평생 <strong>₩29,900</strong></p>
      <div class="guess-actions">
        <a class="btn-secondary" href="/pricing">구독하기</a>
        <button type="button" class="btn-ghost" data-paywall-close>닫기</button>
      </div>
    </div>`
  el.querySelector('[data-paywall-close]')?.addEventListener('click', () => {
    el.hidden = true
  })
  el.addEventListener('click', (e) => {
    if (e.target === el) el.hidden = true
  })
  return false
}

export function handlePaywall(featureName = '상세 운세 해석') {
  return showPaywall(`${featureName}은 프리미엄 구독이 필요합니다.`)
}

export function requirePremium(message) {
  let loggedIn = false
  try {
    loggedIn = localStorage.getItem('isLoggedIn') === 'true' || Boolean(localStorage.getItem('saju-auth-user'))
  } catch { /* ignore */ }
  if (!loggedIn) {
    showLoginPaywall(message || '상세 해석은 로그인 후 이용 가능합니다.')
    return false
  }
  if (isPremium()) return true
  showPaywall(message)
  return false
}

export function lockHtml(inner, teaser = '프리미엄에서 이어서 볼 수 있습니다.') {
  if (isPremium()) return inner
  return `
    <div class="premium-lock">
      <div class="premium-lock-body">${inner}</div>
      <div class="premium-lock-mask">
        <p>${teaser}</p>
        <button type="button" class="btn-secondary" data-open-paywall>상세 해석 잠금 해제</button>
      </div>
    </div>`
}
