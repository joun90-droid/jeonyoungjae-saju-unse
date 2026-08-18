import { computeChart } from '../engine/calculator.js'
import { ARCANA, interpretSpread, shuffleThree } from '../engine/tarot.js'
import { birthFieldsHtml, bindBirthFields, readBirthFields } from '../lib/birth-fields.js'
import { loadBirth, patchState, saveBirth } from '../lib/store.js'
import { checkSubscription, lockHtml } from '../lib/subscription.js'
import { shareContent, shareFeedback } from '../lib/share.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/tarot',
  title: '타로 × 사주 | 영재 사주운',
  description: '메이저 아르카나 22장과 사주 일간을 맞춰 읽는 무료 타로. 외부 AI API 없이 해석합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Tarot',
    title: '타로 + 사주',
    lead: '22장 중 3장을 고르거나 자동 배치합니다. 해석은 사주 엔진과 카드 데이터만 사용합니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '타로' }]),
    body: '<div id="tarotRoot"></div>',
  })
}

export function bind(root) {
  const el = root.querySelector('#tarotRoot')
  if (!el) return
  if (!loadBirth()) {
    el.innerHTML = `<form id="tarotBirth">${birthFieldsHtml('t', null)}<button class="btn-primary" type="submit">사주 저장 후 카드 보기</button></form>`
    bindBirthFields(el)
    el.querySelector('#tarotBirth')?.addEventListener('submit', (e) => {
      e.preventDefault()
      saveBirth(readBirthFields(el))
      bind(root)
    })
    return
  }
  mountPick(el, [])
}

function mountPick(el, picked) {
  const rest = ARCANA.filter((c) => !picked.some((p) => p.id === c.id))
  el.innerHTML = `
    <p class="guess-sub">${picked.length}/3 선택 · 또는 자동 배치</p>
    <div class="tarot-hand">
      ${picked.map((c) => `<div class="tarot-card on"><strong>${c.ko}</strong><small>${c.name}</small></div>`).join('')}
    </div>
    <div class="tarot-deck">
      ${rest.map((c) => `<button type="button" class="tarot-card" data-id="${c.id}" ${picked.length >= 3 ? 'disabled' : ''}>${c.ko}</button>`).join('')}
    </div>
    <div class="guess-actions">
      <button type="button" class="btn-secondary" id="tarotAuto">3장 자동</button>
      <button type="button" class="btn-ghost" id="tarotReset">다시</button>
    </div>
  `
  el.querySelectorAll('.tarot-card[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = ARCANA.find((c) => c.id === Number(btn.dataset.id))
      const next = [...picked, card]
      if (next.length >= 3) mountResult(el, next)
      else mountPick(el, next)
    })
  })
  el.querySelector('#tarotAuto')?.addEventListener('click', () => {
    const chart = computeChart(loadBirth())
    mountResult(el, shuffleThree(chart, String(Date.now())))
  })
  el.querySelector('#tarotReset')?.addEventListener('click', () => mountPick(el, []))
}

function mountResult(el, cards) {
  const chart = computeChart(loadBirth())
  const read = interpretSpread(cards, chart)
  patchState({ tarot: { ids: cards.map((c) => c.id), at: Date.now() } })
  el.innerHTML = `
    <p class="one-liner">${read.short}</p>
    <div class="tarot-hand">
      ${read.perCard.map((c) => `
        <article class="tarot-card on wide">
          <small>${c.pos}</small>
          <strong>${c.ko}</strong>
          <p>${c.hint}</p>
        </article>`).join('')}
    </div>
    ${lockHtml(`
      ${read.perCard.map((c) => `<p class="detail-text"><strong>${c.ko}</strong> — ${c.text}</p>`).join('')}
      <p class="detail-text">${read.detail}</p>
    `, '카드별 상세는 프리미엄')}
    <div class="guess-actions">
      <button type="button" class="btn-secondary" id="tarotShare">공유</button>
      <button type="button" class="btn-ghost" id="tarotAgain">다시 뽑기</button>
    </div>
    <p class="privacy">타로는 오락·참고용입니다. 2주마다 새로 뽑아 보세요.</p>
  `
  el.querySelectorAll('[data-open-paywall]').forEach((b) => {
    b.addEventListener('click', () => checkSubscription('타로 상세 해석은 프리미엄입니다.'))
  })
  el.querySelector('#tarotAgain')?.addEventListener('click', () => mountPick(el, []))
  el.querySelector('#tarotShare')?.addEventListener('click', async () => {
    const mode = await shareContent({
      title: `타로: ${cards.map((c) => c.ko).join(' · ')} | 영재 사주운`,
      text: read.short,
      url: `${location.origin}/tarot`,
    })
    const msg = shareFeedback(mode)
    if (msg) alert(msg)
  })
}
