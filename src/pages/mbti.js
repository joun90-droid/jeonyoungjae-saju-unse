import { computeChart } from '../engine/calculator.js'
import { analyzeMbti } from '../engine/mbti.js'
import { birthFieldsHtml, bindBirthFields, readBirthFields } from '../lib/birth-fields.js'
import { loadBirth, patchState, saveBirth } from '../lib/store.js'
import { checkSubscription, lockHtml } from '../lib/subscription.js'
import { shareContent, shareFeedback } from '../lib/share.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/mbti',
  title: 'MBTI × 사주 | 영재 사주운',
  description: '16유형 MBTI와 사주 일간을 겹쳐 2026 병오년 조언을 정리합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'MBTI',
    title: 'MBTI + 사주',
    lead: '네 축을 고르면 사주 일간·올해 세운과 맞춰 봅니다. 외부 검사 API는 쓰지 않습니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: 'MBTI' }]),
    body: '<div id="mbtiRoot"></div>',
  })
}

export function bind(root) {
  const el = root.querySelector('#mbtiRoot')
  if (!el) return
  if (!loadBirth()) {
    el.innerHTML = `<form id="mbtiBirth">${birthFieldsHtml('m', null)}<button class="btn-primary" type="submit">사주 저장</button></form>`
    bindBirthFields(el)
    el.querySelector('#mbtiBirth')?.addEventListener('submit', (e) => {
      e.preventDefault()
      saveBirth(readBirthFields(el))
      bind(root)
    })
    return
  }
  el.innerHTML = `
    <form id="mbtiForm" class="mbti-form">
      ${axis('EI', '에너지', ['E', '외향'], ['I', '내향'])}
      ${axis('SN', '인식', ['S', '감각'], ['N', '직관'])}
      ${axis('TF', '판단', ['T', '사고'], ['F', '감정'])}
      ${axis('JP', '생활', ['J', '판단'], ['P', '인식'])}
      <button class="btn-primary" type="submit">사주와 조합하기</button>
    </form>
    <div id="mbtiOut"></div>
  `
  el.querySelectorAll('.seg-btn[data-v]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.mbti-axis')
      row.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn))
    })
  })
  el.querySelector('#mbtiForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const letters = {}
    el.querySelectorAll('.mbti-axis').forEach((row) => {
      letters[row.dataset.axis] = row.querySelector('.seg-btn.active')?.dataset.v
    })
    if (Object.keys(letters).length < 4) {
      alert('네 축을 모두 선택해 주세요.')
      return
    }
    const chart = computeChart(loadBirth())
    const result = analyzeMbti(letters, chart)
    patchState({ mbti: { letters, code: result.code, at: Date.now() } })
    const out = el.querySelector('#mbtiOut')
    out.innerHTML = `
      <h2>${result.code}</h2>
      <p class="one-liner">${result.short}</p>
      <ul>${result.axes.map((a) => `<li>${a}</li>`).join('')}</ul>
      ${lockHtml(`<p class="detail-text">${result.detail}</p>`, '연애·직업·건강 상세는 프리미엄')}
      <button type="button" class="btn-secondary" id="mbtiShare">공유</button>
    `
    out.querySelectorAll('[data-open-paywall]').forEach((b) => {
      b.addEventListener('click', () => checkSubscription('MBTI 상세 분석은 프리미엄입니다.'))
    })
    out.querySelector('#mbtiShare')?.addEventListener('click', async () => {
      const mode = await shareContent({
        title: `${result.code} × 사주 | 영재 사주운`,
        text: result.short,
        url: `${location.origin}/mbti`,
      })
      const msg = shareFeedback(mode)
      if (msg) alert(msg)
    })
  })
}

function axis(key, label, a, b) {
  return `
    <div class="mbti-axis row gender-row" data-axis="${key}">
      <span class="label">${label}</span>
      <div class="seg">
        <button type="button" class="seg-btn" data-v="${a[0]}">${a[0]} ${a[1]}</button>
        <button type="button" class="seg-btn" data-v="${b[0]}">${b[0]} ${b[1]}</button>
      </div>
    </div>`
}
