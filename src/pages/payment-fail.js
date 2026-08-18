import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/payment-fail',
  title: '결제 실패 | 영재 사주운',
  description: '영재 사주운 결제 실패 안내',
}

export function render() {
  const q = new URLSearchParams(location.search)
  const code = q.get('code') || ''
  const message = q.get('message') || '결제가 완료되지 않았습니다.'
  return pageTemplate({
    kicker: 'Payment',
    title: '결제 실패',
    lead: '결제를 다시 시도하거나 무료로 계속 이용할 수 있습니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { href: '/pricing', label: '프리미엄' }, { label: '실패' }]),
    body: `
      <p class="login-status is-error">${message}${code ? ` (${code})` : ''}</p>
      <div class="guess-actions">
        <a class="btn-primary" href="/pricing">다시 시도</a>
        <a class="btn-ghost" href="/">홈으로</a>
      </div>
    `,
  })
}
