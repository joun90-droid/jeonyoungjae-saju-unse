import { getCurrentUser } from '../lib/auth.js'
import { TOSS_CLIENT_KEY } from '../lib/firebase.js'
import { SITE } from './site.js'
import { openLogin } from './google-login.js'

export const MONTHLY_AMOUNT = 4900

// Toss orderId는 영문/숫자/-/_ 조합, 6~64자만 허용합니다. 카카오·네이버 로그인은
// uid가 길어서(특히 네이버는 40자 안팎) 그대로 넣으면 64자를 넘길 수 있어 앞부분만 씁니다.
export function generateOrderId(uid, plan) {
  const safe = String(uid || 'guest').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32)
  return `saju_${safe}_${plan}_${Date.now()}`
}

export function loginUrlForPlan(plan) {
  return `/?pay=${encodeURIComponent(plan)}`
}

async function startTossPay({ amount, orderName, plan }) {
  const user = getCurrentUser()
  if (!user) {
    openLogin({ next: `/pricing?pay=${plan}` })
    return
  }
  if (!TOSS_CLIENT_KEY) {
    throw new Error('Toss 결제 키가 아직 설정되지 않았습니다.')
  }
  const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
  const payment = tossPayments.payment({
    customerKey: String(user.uid).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 50),
  })
  const origin = location.origin
  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: amount },
    orderId: generateOrderId(user.uid, plan),
    orderName,
    customerEmail: user.email || undefined,
    customerName: user.name || SITE.operator,
    successUrl: `${origin}/payment-success?plan=${plan}`,
    failUrl: `${origin}/payment-fail`,
  })
}

export async function handleMonthlyPayment() {
  return startTossPay({
    amount: MONTHLY_AMOUNT,
    orderName: '영재 사주운 프리미엄 월간 (1개월)',
    plan: 'monthly',
  })
}

export async function verifyPayment({ paymentKey, orderId, amount, plan }) {
  const { postJson } = await import('../lib/auth.js')
  return postJson('/api/toss/confirm', { paymentKey, orderId, amount: Number(amount), plan }, { auth: true })
}
