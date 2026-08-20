import { getCurrentUser } from '../lib/auth.js'
import { openLogin } from './google-login.js'

export const MONTHLY_AMOUNT = 4900

// 카카오페이 정기결제는 Toss처럼 팝업 SDK를 쓰지 않고, 결제 준비(ready) 후
// 카카오페이 페이지로 전체 리다이렉트합니다. 승인은 /payment-success에서 처리합니다.
export async function handleKakaoPayMonthlyPayment() {
  const user = getCurrentUser()
  if (!user) {
    openLogin({ next: '/pricing?pay=monthly' })
    return
  }
  const { postJson } = await import('../lib/auth.js')
  const data = await postJson('/api/kakaopay/ready', {}, { auth: true })
  if (!data?.redirectUrl) {
    throw new Error('카카오페이 결제창을 열지 못했습니다.')
  }
  location.assign(data.redirectUrl)
}

export async function verifyKakaoPayPayment({ orderId, pgToken }) {
  const { postJson } = await import('../lib/auth.js')
  return postJson('/api/kakaopay/approve', { orderId, pgToken }, { auth: true })
}
