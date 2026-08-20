import { waitForUser } from '../lib/auth.js'
import { applySubscription } from '../services/subscription.js'
import { crumbs, pageTemplate } from './layout.js'
import { verifyKakaoPayPayment } from './subscribe-kakaopay.js'
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
    lead: '결제를 서버에서 승인하는 중입니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { href: '/pricing', label: '프리미엄' }, { label: '결제' }]),
    body: `<p class="login-status" data-pay-result>결제 승인 중입니다. 창을 닫지 마세요.</p>`,
  })
}

function showResult(el, html, isError = false) {
  if (!el) return
  el.classList.toggle('is-error', isError)
  el.innerHTML = html
}

export async function bind(root) {
  const el = root.querySelector('[data-pay-result]')
  const q = new URLSearchParams(location.search)

  // 카카오페이·Toss 모두 결제 승인 전에 인증이 필요해서, currentUser가 정해질 때까지 기다립니다.
  await waitForUser()

  if (q.get('method') === 'kakaopay') {
    const orderId = q.get('orderId')
    const pgToken = q.get('pg_token')
    if (!orderId || !pgToken) {
      showResult(el, '결제 정보가 없습니다. <a href="/pricing">요금제로 돌아가기</a>', true)
      return
    }
    try {
      const data = await verifyKakaoPayPayment({ orderId, pgToken })
      applySubscription(data.plan, { startedAt: data.startedAt, endsAt: data.endsAt })
      showResult(el, '결제가 완료되었습니다. 프리미엄이 활성화됐습니다. <a href="/">홈으로</a> · <a href="/pricing">구독 상태</a>')
    } catch (err) {
      showResult(el, `${err.message || '결제 확인에 실패했습니다.'} <a href="/pricing">다시 시도</a>`, true)
    }
    return
  }

  // --- 레거시 Toss 결제 확인. 결제 화면에서는 더 이상 Toss로 진입할 수 없지만,
  // 과거 Toss로 결제한 링크가 남아있을 경우를 대비해 로직은 남겨둡니다. ---
  const paymentKey = q.get('paymentKey')
  const orderId = q.get('orderId')
  const amount = q.get('amount')
  const plan = q.get('plan') || (String(orderId || '').includes('_lifetime_') ? 'lifetime' : 'monthly')

  if (!paymentKey || !orderId || !amount) {
    showResult(el, '결제 정보가 없습니다. <a href="/pricing">요금제로 돌아가기</a>', true)
    return
  }

  try {
    const data = await verifyPayment({ paymentKey, orderId, amount, plan })
    applySubscription(data.plan, { startedAt: data.startedAt, endsAt: data.endsAt })
    showResult(el, '결제가 완료되었습니다. 프리미엄이 활성화됐습니다. <a href="/">홈으로</a> · <a href="/pricing">구독 상태</a>')
  } catch (err) {
    showResult(el, `${err.message || '결제 확인에 실패했습니다.'} <a href="/pricing">다시 시도</a>`, true)
  }
}
