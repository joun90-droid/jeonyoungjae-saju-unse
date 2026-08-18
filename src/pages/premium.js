import { setSubscription, isPremium, getSubscription } from '../lib/subscription.js'
import { crumbs, infoBox, pageTemplate } from './layout.js'

export const meta = {
  path: '/premium',
  title: '프리미엄 | 영재 사주운',
  description: '영재 사주운 프리미엄. 상세 운세·이력·만세력 장기 흐름. 결제는 준비 중입니다.',
}

export function render() {
  const sub = getSubscription()
  const on = isPremium()
  return pageTemplate({
    kicker: 'Premium',
    title: '구독',
    lead: '무료로 점수와 한 줄을 보고, 상세는 프리미엄에서 엽니다. 결제(Stripe/Portone)는 연동 예정입니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '프리미엄' }]),
    body: `
      <p class="privacy">현재 상태: <strong>${on ? (sub === 'lifetime' ? '평생' : '월간 체험') : '무료'}</strong></p>
      <div class="price-grid">
        <article class="price-card">
          <h3>Free</h3>
          <p class="price-num">₩0</p>
          <ul>
            <li>사주 기본 분석</li>
            <li>오늘의 운세 한 줄 · 하루 1회</li>
            <li>심리·궁합 점수</li>
            <li>광고 가능</li>
          </ul>
        </article>
        <article class="price-card featured">
          <h3>Premium</h3>
          <p class="price-num">₩4,900<span>/월</span></p>
          <ul>
            <li>상세 해석 500자+</li>
            <li>운세 이력 무제한</li>
            <li>만세력 5~10년</li>
            <li>타로·MBTI 상세</li>
            <li>알림 시각 커스텀</li>
          </ul>
          <button type="button" class="btn-primary" data-plan="premium" ${on && sub === 'premium' ? 'disabled' : ''}>월간 선택</button>
        </article>
        <article class="price-card">
          <h3>Lifetime</h3>
          <p class="price-num">₩29,900</p>
          <ul>
            <li>Premium 전부</li>
            <li>한 번 결제 예정</li>
          </ul>
          <button type="button" class="btn-secondary" data-plan="lifetime" ${sub === 'lifetime' ? 'disabled' : ''}>평생 선택</button>
        </article>
      </div>
      ${infoBox('<p>실제 카드 결제는 아직 없습니다. 아래 버튼은 이 기기에서 상세 화면을 미리 보기 위한 로컬 체험입니다. 광고·심사 시 유료 사칭이 되지 않도록, 결제 연동 전에는 수익이 발생하지 않습니다.</p>', 'warn')}
      <p class="privacy">체험을 끄려면 무료로 되돌리기를 누르세요.</p>
      <button type="button" class="btn-ghost" data-plan="free">무료로 되돌리기</button>
    `,
  })
}

export function bind(root) {
  root.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan
      if (plan === 'free') {
        setSubscription('free')
        alert('무료로 전환했습니다.')
      } else {
        setSubscription(plan)
        alert(plan === 'lifetime' ? '평생 체험이 이 기기에 켜졌습니다. 결제는 아직입니다.' : '월간 체험이 30일간 이 기기에 켜졌습니다. 결제는 아직입니다.')
      }
      location.reload()
    })
  })
}
