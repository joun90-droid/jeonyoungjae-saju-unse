import { getCurrentUser } from '../lib/auth.js'
import { getSubscriptionStatus, statusLabel } from '../services/subscription.js'
import { crumbs, pageTemplate } from './layout.js'
import { handleLifetimePayment, handleMonthlyPayment, loginUrlForPlan } from './subscribe-monthly.js'

export const meta = {
  path: '/pricing',
  title: '프리미엄 | 영재 사주운',
  description: '영재 사주운 프리미엄. 월간 ₩4,900 · 평생 ₩29,900. Google/Kakao 로그인 후 Toss로 결제합니다.',
}

export function render() {
  const user = getCurrentUser()
  const status = getSubscriptionStatus()
  const monthlyOn = status === 'premium_monthly'
  const lifeOn = status === 'premium_lifetime'
  return pageTemplate({
    kicker: 'Premium',
    title: '영재 사주운 프리미엄',
    lead: '무료로 기본 분석을 보고, 상세 해석·장기 만세력은 프리미엄에서 엽니다. 결제는 Toss Payments 테스트/실결제 키로 처리됩니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '프리미엄' }]),
    body: `
      <p class="privacy">현재: <strong>${user ? user.name : '미로그인'}</strong> · ${statusLabel(status)}</p>
      <div class="price-grid">
        <article class="price-card">
          <p class="eyebrow">FREE</p>
          <h3>무료</h3>
          <p class="price-num">₩0</p>
          <ul>
            <li>기본 사주 분석</li>
            <li>한 줄 운세</li>
            <li>광고 포함</li>
          </ul>
          <a class="btn-ghost" href="/" data-free-continue>계속 사용하기</a>
        </article>
        <article class="price-card featured">
          <p class="eyebrow">PREMIUM MONTHLY</p>
          <h3>프리미엄 월간</h3>
          <p class="price-num">₩4,900<span>/month</span></p>
          <ul>
            <li>모든 기본 기능</li>
            <li>상세 운세 해석 (500자+)</li>
            <li>만세력 5년 예측</li>
            <li>광고 제거</li>
            <li>알림 커스텀</li>
          </ul>
          <button type="button" class="btn-primary" data-pay="monthly" ${monthlyOn || lifeOn ? 'disabled' : ''}>
            ${monthlyOn ? '구독 중' : '월간 구독하기'}
          </button>
          <p class="privacy">Google / Kakao 로그인 필수</p>
        </article>
        <article class="price-card">
          <p class="eyebrow">PREMIUM LIFETIME</p>
          <h3>프리미엄 평생</h3>
          <p class="price-num">₩29,900<span>한 번만</span></p>
          <ul>
            <li>PREMIUM의 모든 기능</li>
            <li>추가 비용 없음</li>
            <li>업데이트 평생 포함</li>
          </ul>
          <button type="button" class="btn-secondary btn-block" data-pay="lifetime" ${lifeOn ? 'disabled' : ''}>
            ${lifeOn ? '구독 중 ✓' : '평생 구독하기'}
          </button>
          <p class="privacy">Google / Kakao 로그인 필수</p>
        </article>
      </div>
      <p class="login-status is-error" data-pay-status hidden></p>
    `,
  })
}

export function bind(root) {
  const status = root.querySelector('[data-pay-status]')
  const show = (msg) => {
    if (!status) return
    status.hidden = !msg
    status.textContent = msg || ''
  }

  const pay = new URLSearchParams(location.search).get('pay')
  if (pay === 'monthly' || pay === 'lifetime') {
    if (getCurrentUser()) {
      const run = pay === 'lifetime' ? handleLifetimePayment : handleMonthlyPayment
      run().catch((err) => show(err.message))
    }
  }

  root.querySelectorAll('[data-pay]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.pay
      if (!getCurrentUser()) {
        location.assign(loginUrlForPlan(plan))
        return
      }
      show('')
      try {
        if (plan === 'lifetime') await handleLifetimePayment()
        else await handleMonthlyPayment()
      } catch (err) {
        show(err.message || '결제창을 열지 못했습니다.')
      }
    })
  })
}
