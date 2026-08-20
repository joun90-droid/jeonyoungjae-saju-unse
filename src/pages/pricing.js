import { getCurrentUser } from '../lib/auth.js'
import { getSubscriptionStatus, statusLabel } from '../services/subscription.js'
import { crumbs, pageTemplate } from './layout.js'
import { handleKakaoPayMonthlyPayment } from './subscribe-kakaopay.js'
import { openLogin } from './google-login.js'
import { SITE } from './site.js'

export const meta = {
  path: '/pricing',
  title: '프리미엄 | 영재 사주운',
  description: '영재 사주운 프리미엄. 월간 ₩4,900. 로그인 후 카카오페이로 결제합니다.',
}

export function render() {
  const user = getCurrentUser()
  const status = getSubscriptionStatus()
  const monthlyOn = status === 'premium_monthly'
  const lifeOn = status === 'premium_lifetime'
  return pageTemplate({
    kicker: 'Premium',
    title: '영재 사주운 프리미엄',
    lead: '무료로 기본 분석을 보고, 상세 해석·장기 만세력은 프리미엄에서 엽니다. 결제는 카카오페이 정기결제로 처리됩니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '프리미엄' }]),
    body: `
      <p class="privacy">현재: <strong>${user ? user.name : '미로그인'}</strong> · ${statusLabel(status)}${user ? ' · <a href="/account">구독 관리</a>' : ''}</p>
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
            ${lifeOn ? '평생 이용 중' : monthlyOn ? '구독 중' : '카카오페이로 구독하기'}
          </button>
          <p class="privacy">로그인 후 카카오페이로 결제</p>
        </article>
      </div>
      <p class="login-status is-error" data-pay-status hidden></p>
      <aside class="info-callout">
        <p><strong>서비스 제공기간</strong>: 최초 결제일로부터 30일마다 카카오페이 정기결제로 자동 갱신됩니다.</p>
        <p><strong>취소·환불</strong>: 결제 후 7일 이내 미이용 시 전액 환불되며, 이용 개시 후에는 관련 법률에 따라 청약철회가 제한될 수 있습니다. 자동 갱신은 <a href="/account">구독 관리</a>에서 다음 결제일 전에 언제든 취소할 수 있고, 취소해도 이미 결제된 기간까지는 계속 이용할 수 있습니다. 자세한 조건은 <a href="/terms-of-service">이용약관</a>을 확인해 주세요.</p>
        <p>문의·이의신청: <a href="mailto:${SITE.email}">${SITE.email}</a> · ${SITE.phone}</p>
      </aside>
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
  if (pay === 'monthly') {
    if (getCurrentUser()) {
      handleKakaoPayMonthlyPayment().catch((err) => show(err.message))
    }
  }

  root.querySelectorAll('[data-pay]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const plan = btn.dataset.pay
      if (!getCurrentUser()) {
        openLogin({ next: `/pricing?pay=${plan}` })
        return
      }
      show('')
      try {
        await handleKakaoPayMonthlyPayment()
      } catch (err) {
        show(err.message || '결제창을 열지 못했습니다.')
      }
    })
  })
}
