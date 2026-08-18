const SUB_KEY = 'subscription'
const SUB_DATE = 'subscriptionDate'
const PREMIUM_FLAG = 'isPremium'

export function getSubscription() {
  try {
    return localStorage.getItem(SUB_KEY) || 'free'
  } catch {
    return 'free'
  }
}

export function setSubscription(type) {
  localStorage.setItem(SUB_KEY, type)
  localStorage.setItem(SUB_DATE, new Date().toISOString())
  localStorage.setItem(PREMIUM_FLAG, type === 'premium' || type === 'lifetime' ? '1' : '')
}

export function isPremiumValid() {
  const subscription = getSubscription()
  if (subscription === 'lifetime') return true
  if (subscription === 'premium') {
    const raw = localStorage.getItem(SUB_DATE)
    if (!raw) return false
    const date = new Date(raw)
    return Date.now() - date.getTime() < 30 * 24 * 60 * 60 * 1000
  }
  return false
}

export function isPremium() {
  return isPremiumValid()
}

export function showPaywall(message = '상세 분석은 프리미엄이 필요합니다.') {
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
      <h2>프리미엄으로 자세히 보기</h2>
      <p class="page-lead">${message}</p>
      <ul class="paywall-perks">
        <li>오늘의 운세 500자 상세 · 이력 무제한</li>
        <li>궁합·심리·타로·MBTI 상세 해석</li>
        <li>만세력 5~10년 흐름</li>
        <li>알림 시간 커스텀 · 광고 없는 화면(연동 후)</li>
      </ul>
      <p class="price-line"><strong>₩4,900</strong>/월 · 평생 <strong>₩29,900</strong></p>
      <p class="privacy">Stripe/Portone 결제는 준비 중입니다. 지금은 무료 한 줄 해석을 이용하세요.</p>
      <div class="guess-actions">
        <a class="btn-secondary" href="/premium">요금제 보기</a>
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

export function checkSubscription(message) {
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
