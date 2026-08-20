import { getCurrentUser } from '../lib/auth.js'
import {
  cancelSubscription,
  fetchSubscriptionDetail,
  getSubscriptionStatus,
  reactivateSubscription,
  requestRefund,
} from '../services/subscription.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/account',
  title: '구독 관리 | 영재 사주운',
  description: '영재 사주운 구독 상태 확인, 결제 정보, 구독 취소·재개를 한곳에서 관리합니다.',
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]))
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function daysLeft(iso) {
  if (!iso) return null
  const end = new Date(iso).getTime()
  if (Number.isNaN(end)) return null
  return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)))
}

export function render() {
  const user = getCurrentUser()
  if (!user) {
    return pageTemplate({
      kicker: 'Account',
      title: '구독 관리',
      lead: '로그인하면 현재 플랜, 만료일, 결제 정보를 확인하고 구독을 직접 관리할 수 있습니다.',
      crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '구독 관리' }]),
      body: `
        <p class="privacy">아직 로그인하지 않았어요.</p>
        <button type="button" class="btn-primary" data-open-login>로그인하러 가기</button>
      `,
    })
  }
  return pageTemplate({
    kicker: 'Account',
    title: '구독 관리',
    lead: '현재 플랜과 만료일, 결제 정보를 확인하고 구독을 관리하세요.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '구독 관리' }]),
    body: `
      <div class="account-profile">
        ${user.photoURL
          ? `<img class="auth-avatar account-avatar" src="${escapeHtml(user.photoURL)}" alt="">`
          : `<span class="auth-avatar auth-avatar-fallback account-avatar">${escapeHtml((user.name || '?').slice(0, 1))}</span>`}
        <div>
          <p class="account-name">${escapeHtml(user.name)}</p>
          <p class="account-email">${escapeHtml(user.email || '')}</p>
        </div>
      </div>
      <div class="sub-status-card" data-sub-card>
        <p class="privacy">구독 정보를 불러오는 중…</p>
      </div>
      <p class="login-status" data-sub-msg hidden></p>
    `,
  })
}

function pillHtml(kind, label) {
  return `<span class="status-pill status-${kind}">${label}</span>`
}

function cardHtml(detail) {
  const plan = detail?.plan || getSubscriptionStatus()
  const status = detail?.status || 'active'
  const endsAt = detail?.endsAt || null
  const left = daysLeft(endsAt)

  if (plan === 'free' || plan === 'premium_free') {
    const expiredNote = endsAt && status === 'expired'
      ? `<p class="sub-note">이전 구독이 ${formatDate(endsAt)}에 만료되었습니다.</p>`
      : ''
    return `
      <div class="sub-status-head">
        <div>
          <p class="sub-plan-name">무료 플랜</p>
          ${pillHtml('free', '무료 이용 중')}
        </div>
      </div>
      <p class="sub-desc">상세 운세 해석, 만세력 장기 흐름, 광고 제거 등은 프리미엄에서 열립니다.</p>
      ${expiredNote}
      <div class="account-actions">
        <a class="btn-primary btn-upgrade" href="/pricing">
          <span>프리미엄 업그레이드</span>
          <svg class="btn-upgrade-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </div>`
  }

  if (plan === 'premium_lifetime') {
    return `
      <div class="sub-status-head">
        <div>
          <p class="sub-plan-name">프리미엄 평생</p>
          ${pillHtml('lifetime', '평생 이용 중')}
        </div>
      </div>
      <p class="sub-desc">추가 결제 없이 모든 프리미엄 기능을 계속 이용할 수 있어요.</p>
      <p class="sub-note">평생 구독은 자동 결제가 없어 별도로 취소할 필요가 없습니다. 환불이 필요하면 <a href="/contact">문의하기</a>로 연락해 주세요.</p>`
  }

  // premium_monthly
  const canceled = status === 'canceled'
  const isKakaoPay = (detail?.provider || 'toss') === 'kakaopay'
  const refundEligible = Boolean(detail?.refundEligible)
  const paymentLine = detail?.amount
    ? `<p class="sub-note">최근 결제: ₩${Number(detail.amount).toLocaleString('ko-KR')}${detail.method ? ` · ${escapeHtml(detail.method)}` : ''}</p>`
    : ''
  const activeDesc = isKakaoPay
    ? `카카오페이 정기결제로 ${formatDate(endsAt)}에 자동 갱신됩니다.`
    : `이 구독은 자동으로 다시 결제되지 않아요. ${formatDate(endsAt)}까지 이용 가능하며, 계속 쓰려면 만료 전 다시 구독해 주세요.`
  const refundNote = refundEligible
    ? `<p class="sub-note">아직 프리미엄 기능을 이용하지 않으셨네요. 결제일로부터 7일 이내이면 아래에서 바로 환불받을 수 있어요.</p>`
    : ''
  return `
    <div class="sub-status-head">
      <div>
        <p class="sub-plan-name">프리미엄 월간</p>
        ${canceled ? pillHtml('canceled', '취소 예정') : pillHtml('active', '구독 중')}
      </div>
    </div>
    <p class="sub-desc">
      ${canceled
        ? `${formatDate(endsAt)}까지 프리미엄 혜택을 계속 이용할 수 있고, 이후 자동 갱신 없이 무료 플랜으로 전환됩니다.`
        : activeDesc}
      ${left != null ? ` (약 ${left}일 남음)` : ''}
    </p>
    ${paymentLine}
    ${refundNote}
    <div class="account-actions" data-sub-actions>
      ${canceled
        ? `<button type="button" class="btn-secondary" data-reactivate>구독 재개</button>`
        : `<button type="button" class="btn-ghost is-danger" data-cancel>${isKakaoPay ? '자동 갱신 취소' : '구독 취소'}</button>`}
      ${refundEligible ? `<button type="button" class="btn-ghost" data-refund>7일 이내 미사용 환불</button>` : ''}
    </div>`
}

function confirmRefundHtml() {
  return `
    <p class="sub-note is-warn">환불하면 프리미엄 이용이 즉시 종료되고 결제 금액이 결제 수단으로 환불됩니다. 계속할까요?</p>
    <div class="account-actions" data-sub-actions>
      <button type="button" class="btn-primary" data-refund-confirm>예, 환불합니다</button>
      <button type="button" class="btn-ghost" data-refund-abort>아니요, 유지할게요</button>
    </div>`
}

function confirmCancelHtml() {
  return `
    <p class="sub-note is-warn">정말 취소하시겠어요? 취소해도 만료일까지는 프리미엄을 계속 이용할 수 있어요.</p>
    <div class="account-actions" data-sub-actions>
      <button type="button" class="btn-primary" data-cancel-confirm>예, 취소합니다</button>
      <button type="button" class="btn-ghost" data-cancel-abort>아니요, 유지할게요</button>
    </div>`
}

export function bind(root) {
  const user = getCurrentUser()
  if (!user) return

  const card = root.querySelector('[data-sub-card]')
  const msg = root.querySelector('[data-sub-msg]')
  if (!card) return

  let detail = null

  const showMsg = (text, isError = false) => {
    if (!msg) return
    msg.hidden = !text
    msg.textContent = text || ''
    msg.classList.toggle('is-error', isError)
  }

  const paint = () => {
    card.innerHTML = cardHtml(detail)
    bindCardActions()
  }

  function bindCardActions() {
    card.querySelector('[data-cancel]')?.addEventListener('click', () => {
      card.insertAdjacentHTML('beforeend', confirmCancelHtml())
      card.querySelector('[data-cancel-abort]')?.addEventListener('click', paint)
      card.querySelector('[data-cancel-confirm]')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget
        btn.disabled = true
        btn.textContent = '처리 중…'
        try {
          await cancelSubscription()
          detail = await fetchSubscriptionDetail()
          showMsg('구독이 취소되었습니다. 만료일까지는 계속 이용할 수 있어요.')
          paint()
        } catch (err) {
          showMsg(err.message || '취소 중 오류가 발생했습니다.', true)
          paint()
        }
      })
    })
    card.querySelector('[data-reactivate]')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget
      btn.disabled = true
      btn.textContent = '처리 중…'
      try {
        await reactivateSubscription()
        detail = await fetchSubscriptionDetail()
        showMsg('구독이 다시 활성화되었습니다.')
        paint()
      } catch (err) {
        showMsg(err.message || '재활성화 중 오류가 발생했습니다.', true)
        paint()
      }
    })
    card.querySelector('[data-refund]')?.addEventListener('click', () => {
      card.insertAdjacentHTML('beforeend', confirmRefundHtml())
      card.querySelector('[data-refund-abort]')?.addEventListener('click', paint)
      card.querySelector('[data-refund-confirm]')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget
        btn.disabled = true
        btn.textContent = '처리 중…'
        try {
          await requestRefund()
          detail = await fetchSubscriptionDetail()
          showMsg('환불이 완료되었습니다.')
          paint()
        } catch (err) {
          showMsg(err.message || '환불 처리 중 오류가 발생했습니다.', true)
          paint()
        }
      })
    })
  }

  fetchSubscriptionDetail()
    .then((data) => {
      detail = data
      paint()
    })
    .catch(() => {
      card.innerHTML = `<p class="privacy">구독 정보를 불러오지 못했습니다. <button type="button" class="btn-ghost" data-retry>다시 시도</button></p>`
      card.querySelector('[data-retry]')?.addEventListener('click', () => bind(root))
    })
}
