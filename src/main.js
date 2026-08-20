import { computeChart } from './engine/calculator.js'
import { startRouter } from './router.js'
import { saveBirth, loadBirth } from './lib/store.js'
import { maybeNotifyToday } from './lib/notify.js'
import { consumeGuestNotice, consumePendingSocialAuth, initAuth } from './lib/auth.js'
import { mountAuthBar, renderAuthBar } from './components/Navigation.js'
import { mountLogin } from './pages/google-login.js'

import { analyzeOverall } from './engine/fortune.js'

import { applyDetailLevel, chartDigestBlock, detailBlockExtra, overviewBlock } from './engine/detail.js'

import { TIME_GUESS_QUESTIONS, guessBirthTime } from './engine/time-guess.js'

import { findSijinByHour } from './engine/sijin.js'



let gender = 'M'

let detailLevel = 'medium'

let report = null

let activeTab = 'timeline'

let guessAnswers = {}

let guessStep = 0

let guessResult = null

let guessedTimeMeta = null



function init() {
  initAuth()
  mountAuthBar()
  mountLogin()
  const bar = document.getElementById('authBar')
  try {
    if (bar && sessionStorage.getItem('saju-oauth-pending')) {
      bar.innerHTML = '<div class="auth-inner"><span class="auth-badge">로그인 처리 중</span></div>'
    }
  } catch { /* ignore */ }
  consumePendingSocialAuth().then(() => renderAuthBar())
  startRouter()
  maybeNotifyToday()
  const notice = document.getElementById('guestNotice')
  if (notice) {
    let loggedIn = false
    try { loggedIn = localStorage.getItem('isLoggedIn') === 'true' } catch { /* ignore */ }
    if (!loggedIn && (consumeGuestNotice() || !sessionStorage.getItem('saju-guest-seen'))) {
      notice.hidden = false
      sessionStorage.setItem('saju-guest-seen', '1')
      notice.querySelector('[data-dismiss-guest]')?.addEventListener('click', () => {
        notice.hidden = true
      })
    }
  }

  const form = document.getElementById('birthForm')

  const results = document.getElementById('results')

  const pillarCard = document.getElementById('pillarCard')

  const panel = document.getElementById('panel')

  const tabs = document.getElementById('tabs')

  const unknownTimeEl = document.getElementById('unknownTime')

  const timeGuessSection = document.getElementById('timeGuessSection')



  if (!form || !results || !pillarCard || !panel || !tabs || !unknownTimeEl) {

    console.error('saju-unse: required DOM nodes missing')

    return

  }

  const saved = loadBirth()
  if (saved) {
    const set = (id, v) => { const n = document.getElementById(id); if (n && v != null) n.value = v }
    set('year', saved.year)
    set('month', saved.month)
    set('day', saved.day)
    set('hour', saved.hour)
    set('minute', saved.minute)
    if (saved.gender) {
      gender = saved.gender
      document.querySelectorAll('.seg-btn[data-gender]').forEach((b) => b.classList.toggle('active', b.dataset.gender === gender))
    }
  }

  document.querySelectorAll('.seg-btn[data-gender]').forEach((btn) => {

    btn.addEventListener('click', () => {

      gender = btn.dataset.gender

      document.querySelectorAll('.seg-btn[data-gender]').forEach((b) => b.classList.toggle('active', b === btn))

    })

  })



  const DETAIL_LEVELS = ['mild', 'medium', 'spicy']
  const detailSlider = document.getElementById('detailSlider')
  const detailTicks = Array.from(document.querySelectorAll('.depth-tick'))

  function setDetailLevel(idx, { silent = false } = {}) {
    idx = Math.max(0, Math.min(2, idx))
    detailLevel = DETAIL_LEVELS[idx]
    if (detailSlider) {
      detailSlider.value = String(idx)
      detailSlider.style.setProperty('--fill', `${(idx / 2) * 100}%`)
    }
    detailTicks.forEach((t, i) => t.classList.toggle('active', i === idx))
    if (!silent && report) renderPanel(panel)
  }

  detailSlider?.addEventListener('input', () => setDetailLevel(Number(detailSlider.value)))
  detailTicks.forEach((t, i) => t.addEventListener('click', () => setDetailLevel(i)))



  unknownTimeEl.addEventListener('change', (e) => {

    const on = e.target.checked

    document.getElementById('hour').disabled = on

    document.getElementById('minute').disabled = on

    document.getElementById('timeInputs').classList.toggle('dimmed', on)

    if (timeGuessSection) timeGuessSection.hidden = !on

    if (on) resetGuessWizard()

  })



  tabs.addEventListener('click', (e) => {

    const btn = e.target.closest('.tab')

    if (!btn || !report) return

    activeTab = btn.dataset.tab

    tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === btn))

    renderPanel(panel)

  })



  bindGuessWizard(form)



  form.addEventListener('submit', (e) => {

    e.preventDefault()

    const base = getBirthBase()

    if (!isValidCalendarDate(base.year, base.month, base.day)) {

      alert(`${base.year}년 ${base.month}월 ${base.day}일은 실제로 존재하지 않는 날짜예요. 생년월일을 다시 확인해 주세요.`)

      return

    }

    const unknownTime = unknownTimeEl.checked

    if (unknownTime && !guessResult) {

      timeGuessSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      alert('시간을 모르시면 아래 질문에 답해 시진을 추정해 주세요.')

      return

    }

    runAnalysis({ results, pillarCard, panel, tabs })

  })

}



function bindGuessWizard(form) {

  const prevBtn = document.getElementById('guessPrev')

  const nextBtn = document.getElementById('guessNext')

  const finishBtn = document.getElementById('guessFinish')



  prevBtn?.addEventListener('click', () => {

    if (guessStep > 0) {

      guessStep -= 1

      renderGuessQuestion()

    }

  })



  nextBtn?.addEventListener('click', () => {

    const q = TIME_GUESS_QUESTIONS[guessStep]

    if (!guessAnswers[q.id]) {

      alert('답을 선택해 주세요.')

      return

    }

    if (guessStep < TIME_GUESS_QUESTIONS.length - 1) {

      guessStep += 1

      renderGuessQuestion()

    }

  })



  finishBtn?.addEventListener('click', () => {

    const q = TIME_GUESS_QUESTIONS[guessStep]

    if (!guessAnswers[q.id]) {

      alert('마지막 질문에 답해 주세요.')

      return

    }

    finishGuess(form)

  })



  document.getElementById('guessRetry')?.addEventListener('click', () => resetGuessWizard())



  document.getElementById('guessApply')?.addEventListener('click', () => {
    if (!guessResult) return
    form.requestSubmit()
  })

}



function resetGuessWizard() {

  guessAnswers = {}

  guessStep = 0

  guessResult = null

  guessedTimeMeta = null

  document.getElementById('guessResult')?.setAttribute('hidden', '')

  document.getElementById('guessQuiz')?.removeAttribute('hidden')

  renderGuessQuestion()

}



function renderGuessQuestion() {

  const q = TIME_GUESS_QUESTIONS[guessStep]

  const el = document.getElementById('guessQuestion')

  const opts = document.getElementById('guessOptions')

  const prog = document.getElementById('guessProgress')

  const prevBtn = document.getElementById('guessPrev')

  const nextBtn = document.getElementById('guessNext')

  const finishBtn = document.getElementById('guessFinish')



  if (!q || !el || !opts) return



  el.textContent = q.text

  prog.textContent = `${guessStep + 1} / ${TIME_GUESS_QUESTIONS.length}`

  prog.style.setProperty('--pct', `${((guessStep + 1) / TIME_GUESS_QUESTIONS.length) * 100}%`)



  opts.innerHTML = q.options.map((o) => `

    <button type="button" class="guess-opt ${guessAnswers[q.id] === o.id ? 'active' : ''}" data-q="${q.id}" data-opt="${o.id}">${o.label}</button>

  `).join('')



  opts.querySelectorAll('.guess-opt').forEach((btn) => {

    btn.addEventListener('click', () => {

      guessAnswers[btn.dataset.q] = btn.dataset.opt

      opts.querySelectorAll('.guess-opt').forEach((b) => b.classList.toggle('active', b === btn))

    })

  })



  prevBtn.hidden = guessStep === 0

  nextBtn.hidden = guessStep === TIME_GUESS_QUESTIONS.length - 1

  finishBtn.hidden = guessStep !== TIME_GUESS_QUESTIONS.length - 1

}



function finishGuess(form) {

  const birth = getBirthBase()

  guessResult = guessBirthTime(guessAnswers, birth)

  guessedTimeMeta = {

    label: guessResult.best.label,

    range: guessResult.best.range,

    confidence: guessResult.best.confidence,

    branch: guessResult.best.branch,

  }



  document.getElementById('guessQuiz')?.setAttribute('hidden', '')

  const resultEl = document.getElementById('guessResult')

  resultEl?.removeAttribute('hidden')



  const list = document.getElementById('guessCandidates')

  if (list) {

    list.innerHTML = guessResult.candidates.slice(0, 5).map((c, i) => `

      <button type="button" class="candidate ${i === 0 ? 'top' : ''}" data-hour="${c.hour}" data-minute="${c.minute}" data-label="${c.label}">

        <span class="rank">${i + 1}</span>

        <span class="cand-main"><strong>${c.label}</strong> ${c.range}</span>

        <span class="cand-pct">${c.confidence}%</span>

      </button>

    `).join('')



    list.querySelectorAll('.candidate').forEach((btn) => {

      btn.addEventListener('click', () => {

        list.querySelectorAll('.candidate').forEach((b) => b.classList.remove('top'))

        btn.classList.add('top')

        guessedTimeMeta = {

          label: btn.dataset.label,

          range: findSijinByHour(Number(btn.dataset.hour)).range,

          confidence: guessResult.candidates.find((x) => x.label === btn.dataset.label)?.confidence || 0,

          branch: findSijinByHour(Number(btn.dataset.hour)).branch,

        }

        applyGuessedTime({ hour: Number(btn.dataset.hour), minute: Number(btn.dataset.minute), label: btn.dataset.label, confidence: guessedTimeMeta.confidence })

      })

    })

  }



  document.getElementById('guessReason').textContent = guessResult.reason

  applyGuessedTime(guessResult.best)

  resultEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })

}



function applyGuessedTime(sijin) {

  document.getElementById('hour').value = sijin.hour

  document.getElementById('minute').value = sijin.minute

  guessedTimeMeta = {

    label: sijin.label,

    range: sijin.range,

    confidence: sijin.confidence,

    branch: sijin.branch,

  }

}



function isValidCalendarDate(year, month, day) {
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

function getBirthBase() {

  return {

    year: Number(document.getElementById('year').value),

    month: Number(document.getElementById('month').value),

    day: Number(document.getElementById('day').value),

    gender,

  }

}



function runAnalysis({ results, pillarCard, panel, tabs }) {
  const hour = Number(document.getElementById('hour').value)
  const minute = Number(document.getElementById('minute').value)

  const input = {
    ...getBirthBase(),
    hour,
    minute,
    unknownTime: false,
    timezone: 'Asia/Seoul',
  }



  try {

    const chart = computeChart(input)

    if (guessedTimeMeta) chart.meta.guessedTime = guessedTimeMeta

    saveBirth(input)



    report = analyzeOverall(chart)

    report = applyDetailLevel(report, chart, detailLevel)

    report.chart = chart

    renderPillars(pillarCard)

    activeTab = 'timeline'

    tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === 'timeline'))

    renderPanel(panel)

    results.hidden = false

    results.removeAttribute('hidden')

    results.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (err) {

    console.error(err)

    alert('계산 오류: ' + (err.message || err))

  }

}



if (document.readyState === 'loading') {

  document.addEventListener('DOMContentLoaded', init)

} else {

  init()

}



function renderPillars(pillarCard) {

  const chart = report.chart

  const { saju, meta, daewoon } = chart

  const { overall } = report

  const labels = meta.pillarsLabel

  const timeBadge = meta.guessedTime

    ? `<p class="guess-badge">추정 ${meta.guessedTime.label} (${meta.guessedTime.range}) · 신뢰 ${meta.guessedTime.confidence}%</p>`

    : ''

  const detailBadge = `<span class="detail-badge">${detailLevel === 'spicy' ? '완벽' : detailLevel === 'medium' ? '통찰' : '한눈에'}</span>`



  const rows = saju.pillars.map((p, i) => `

    <div class="pillar-col">

      <span class="pl">${labels[i]}</span>

      <strong class="pg">${p.pillar.ganzi}</strong>

      <span class="ps">${p.stemSipsin} / ${p.branchSipsin}</span>

    </div>`).join('')



  pillarCard.innerHTML = `

    <div class="pillar-head">

      <div>

        <p class="eyebrow">사주팔자 · ${meta.dayElementKo} 일간 ${meta.dayStem} ${detailBadge}</p>

        <h2>종합 ${overall.score}점 <span class="badge ${overall.level.cls}">${overall.level.label}</span></h2>

      </div>

      <p class="age">${meta.age}세 · ${meta.gender === 'M' ? '남' : '여'}</p>

    </div>

    ${timeBadge}

    <div class="pillar-grid">${rows}</div>

    <p class="dw-line">현재 대운: ${daewoon.current ? `${daewoon.current.ganzi} (${daewoon.current.age}~${daewoon.current.age + 9}세)` : '—'}</p>

  `

}



function renderPanel(panel) {

  if (!report || !panel) return

  const { timeline, wealth, love, invest, career, chartDigest, overview } = report



  let html = ''

  if (overview?.length) {
    html += overviewBlock(overview, detailLevel)
  }

  if (chartDigest && (detailLevel === 'spicy' || detailLevel === 'medium')) {

    html += chartDigestBlock(chartDigest)

  }



  if (activeTab === 'timeline') {

    html += timeline.map((t) => fortuneBlock(t, detailLevel)).join('')

    panel.innerHTML = html

    return

  }

  if (activeTab === 'wealth') {

    html += detailBlock(wealth, detailLevel)

    panel.innerHTML = html

    return

  }

  if (activeTab === 'love') {

    html += detailBlock(love, detailLevel)

    panel.innerHTML = html

    return

  }

  if (activeTab === 'invest') {

    html += detailBlock(invest, detailLevel)

    if (invest.scenarios) {

      html += `<div class="card sub"><h3>손익 시나리오</h3><div class="scenario-grid">${invest.scenarios.map((s) => `

        <div class="scenario"><strong>${s.label}</strong><p>${s.pnl}</p><small>리스크: ${s.risk}</small></div>`).join('')}</div></div>`

    }

    if (detailLevel === 'spicy') {

      html += `<div class="card sub disclaimer"><p>투자 손익은 사주가 아니라 시장·리스크·분산·현금흐름으로 결정됩니다. 위 내용은 성향 참고용입니다.</p></div>`

    }

    panel.innerHTML = html

    return

  }

  if (activeTab === 'career') {

    html += careerBlock(career, detailLevel)

    panel.innerHTML = html

  }

}



function fortuneBlock(t, level) {

  const tips = level === 'mild' ? t.tips.slice(0, 3) : t.tips

  return `

    <article class="card fortune ${level}">

      <header>

        <h3>${t.title}</h3>

        <span class="score ${t.level.cls}">${t.score} · ${t.level.label}</span>

      </header>

      <p class="period">${t.period}</p>

      <p class="summary">${t.summary}</p>

      ${detailBlockExtra(t, level)}

      <ul class="tip-list">${tips.map((tip) => `<li>${tip}</li>`).join('')}</ul>

    </article>`

}



function detailBlock(data, level) {

  const tips = level === 'mild' ? data.tips.slice(0, 3) : data.tips

  return `

    <article class="card fortune detail ${level}">

      <header>

        <h3>${data.headline}</h3>

        <span class="score ${data.level.cls}">${data.score} · ${data.level.label}</span>

      </header>

      <p class="summary">${data.summary}</p>

      ${detailBlockExtra(data, level)}

      <dl class="kv">${data.details.map((d) => `<div><dt>${d.k}</dt><dd>${d.v}</dd></div>`).join('')}</dl>

      <ul class="tip-list">${tips.map((t) => `<li>${t}</li>`).join('')}</ul>

    </article>`

}

function careerBlock(career, level) {
  const tips = level === 'mild' ? career.tips.slice(0, 2) : career.tips
  const jobCount = level === 'mild' ? 3 : level === 'medium' ? 5 : 6
  const jobs = career.jobs.slice(0, jobCount)

  let html = `
    <article class="card fortune detail ${level}">
      <header>
        <h3>${career.headline}</h3>
        <span class="score ${career.level.cls}">${career.score} · ${career.level.label}</span>
      </header>
      <p class="summary">${career.summary}</p>
      ${detailBlockExtra(career, level)}
      <dl class="kv">${career.details.map((d) => `<div><dt>${d.k}</dt><dd>${d.v}</dd></div>`).join('')}</dl>
      <h4 class="job-heading">추천 직업 · 적성 ${jobCount}선</h4>
      <div class="job-grid">${jobs.map((j, i) => `
        <div class="job-card ${i === 0 ? 'top' : ''}">
          <header>
            <h4>${i + 1}. ${j.title}</h4>
            <span class="job-match">${j.match}%</span>
          </header>
          <p class="job-reason">${j.reason}</p>
        </div>`).join('')}
      </div>
      <ul>${tips.map((t) => `<li>${t}</li>`).join('')}</ul>
    </article>`

  if (level !== 'mild' && career.caution?.length) {
    html += `
      <div class="card sub caution-list">
        <h4>상대적으로 결이 덜 맞을 수 있는 분야</h4>
        <ul>${career.caution.map((c) => `<li><strong>${c.title}</strong> — ${c.reason}</li>`).join('')}</ul>
      </div>`
  }

  if (level === 'spicy') {
    html += `<div class="card sub disclaimer"><p>직업 추천은 사주 성향 참고용입니다. 실제 선택은 적성·시장·경력·경제적 조건을 함께 고려하세요.</p></div>`
  }

  return html
}


