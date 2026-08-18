import { computeChart } from '../engine/calculator.js'
import { QUESTIONS, psychologyNarrative, scorePsychology } from '../engine/psychology.js'
import { shareContent, shareFeedback } from '../lib/share.js'
import { loadBirth, patchState } from '../lib/store.js'
import { checkSubscription, lockHtml } from '../lib/subscription.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/psychology-test',
  title: '사주 심리테스트 | 영재 사주운',
  description: '15문항으로 보는 오행 심리 성향. 사주 일간과 비교해 현재 마음의 결을 정리합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Psychology',
    title: '사주 심리테스트',
    lead: '15문항, 3~5분. 답을 오행에 매핑해 현재 심리와 사주 일간을 비교합니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '심리테스트' }]),
    body: '<div id="psyRoot"></div>',
  })
}

export function bind(root) {
  const el = root.querySelector('#psyRoot')
  if (!el) return
  mountQuiz(el, 0, [])
}

function mountQuiz(el, step, answers) {
  if (step >= QUESTIONS.length) {
    mountResult(el, answers)
    return
  }
  const q = QUESTIONS[step]
  const pct = Math.round(((step + 1) / QUESTIONS.length) * 100)
  el.innerHTML = `
    <div class="guess-progress-wrap"><div class="guess-progress-bar" style="width:${pct}%"></div></div>
    <p class="guess-sub">${step + 1} / ${QUESTIONS.length}</p>
    <p class="guess-q">${q.q}</p>
    <div class="guess-options">
      ${q.opts.map((o) => `<button type="button" class="guess-opt" data-el="${o.id}">${o.label}</button>`).join('')}
    </div>
    ${step > 0 ? '<button type="button" class="btn-ghost" id="psyPrev">이전</button>' : ''}
  `
  el.querySelectorAll('.guess-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = answers.slice(0, step)
      next[step] = btn.dataset.el
      mountQuiz(el, step + 1, next)
    })
  })
  el.querySelector('#psyPrev')?.addEventListener('click', () => mountQuiz(el, step - 1, answers))
}

function mountResult(el, answers) {
  const scored = scorePsychology(answers)
  const chart = loadBirth() ? computeChart(loadBirth()) : null
  const narr = psychologyNarrative(scored, chart)
  patchState({ psychology: { answers, top: scored.top, at: Date.now() } })
  const bars = Object.entries(scored.counts).map(([k, n]) => {
    const label = { tree: '목', fire: '화', earth: '토', metal: '금', water: '수' }[k]
    const pct = Math.round((n / scored.total) * 100)
    return `<div class="bar-row"><span>${label}</span><div class="meter-bar"><i style="width:${pct}%"></i></div><em>${n}</em></div>`
  }).join('')

  el.innerHTML = `
    <p class="eyebrow">결과</p>
    <h2>당신의 심리 유형: ${narr.typeLabel}</h2>
    <p class="one-liner">${narr.short}</p>
    ${chart ? `<p class="privacy">사주 일간 ${chart.meta.dayElementKo}와 비교했습니다.</p>` : '<p class="privacy">홈에서 사주를 저장하면 일간과 비교됩니다.</p>'}
    <div class="bar-list">${bars}</div>
    ${lockHtml(`<p class="detail-text">${narr.detail}</p>`, '상세 조언은 프리미엄')}
    <div class="guess-actions">
      <button type="button" class="btn-secondary" id="psyShare">결과 공유</button>
      <button type="button" class="btn-ghost" id="psyRetry">다시 하기</button>
      <a class="btn-ghost" href="/daily-fortune">오늘의 운세</a>
    </div>
  `
  el.querySelectorAll('[data-open-paywall]').forEach((b) => {
    b.addEventListener('click', () => checkSubscription('심리테스트 상세 분석은 프리미엄입니다.'))
  })
  el.querySelector('#psyRetry')?.addEventListener('click', () => mountQuiz(el, 0, []))
  el.querySelector('#psyShare')?.addEventListener('click', async () => {
    const mode = await shareContent({
      title: `심리 유형: ${narr.typeLabel} | 영재 사주운`,
      text: narr.short,
      url: `${location.origin}/psychology-test`,
    })
    const msg = shareFeedback(mode)
    if (msg) alert(msg)
  })
}
