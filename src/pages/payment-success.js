import { applySubscription } from '../services/subscription.js'
import { crumbs, pageTemplate } from './layout.js'
import { verifyPayment } from './subscribe-monthly.js'

export const meta = {
  path: '/payment-success',
  title: '결제 완료 | 영재 사주운',
  description: '영재 사주운 프리미엄 결제 확인',
}

export function render() {
  return pageTemplate({
    kicker: 'Payment',
    title: '결제 확인',
    lead: 'Toss에서 돌아온 결제를 서버에서 승인하는 중입니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { href: '/pricing', label: '프리미엄' }, { label: '결제' }]),
    body: `<p class="login-status" data-pay-result>결제 승인 중입니다. 창을 닫지 마세요.</p>`,
  })
}

export function bind(root) {
  const el = root.querySelector('[data-pay-result]')
  const q = new URLSearchParams(location.search)
  const paymentKey = q.get('paymentKey')
  const orderId = q.get('orderId')
  const amount = q.get('amount')
  const plan = q.get('plan') || (String(orderId || '').includes('_lifetime_') ? 'lifetime' : 'monthly')

  if (!paymentKey || !orderId || !amount) {
    if (el) {
      el.classList.add('is-error')
      el.innerHTML = '결제 정보가 없습니다. <a href="/pricing">요금제로 돌아가기</a>'
    }
    return
  }

  verifyPayment({ paymentKey, orderId, amount, plan })
    .then((data) => {
      applySubscription(data.plan, { startedAt: data.startedAt, endsAt: data.endsAt })
      if (el) {
        el.innerHTML = `결제가 완료되었습니다. 프리미엄이 활성화됐습니다. <a href="/">홈으로</a> · <a href="/pricing">구독 상태</a>`
      }
    })
    .catch((err) => {
      if (el) {
        el.classList.add('is-error')
        el.innerHTML = `${err.message || '결제 확인에 실패했습니다.'} <a href="/pricing">다시 시도</a>`
      }
    })
}
