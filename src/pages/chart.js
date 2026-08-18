import { computeChart } from '../engine/calculator.js'
import { daewoonTimeline, elementBars, futureYears, monthAdvice, monthlyTrend } from '../engine/viz.js'
import { birthFieldsHtml, bindBirthFields, readBirthFields } from '../lib/birth-fields.js'
import { loadBirth, saveBirth } from '../lib/store.js'
import { checkSubscription, lockHtml } from '../lib/subscription.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/chart',
  title: '만세력 시각화 | 영재 사주운',
  description: '사주 오행 분포, 대운 타임라인, 월별 운세 추이를 차트로 봅니다. Chart.js 없이 SVG로 그립니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Chart',
    title: '만세력 시각화',
    lead: '오행 막대, 대운 흐름, 올해 월별 추이. 외부 차트 API 없이 그립니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { href: '/guide', label: '가이드' }, { label: '만세력' }]),
    body: '<div id="chartRoot"></div>',
  })
}

export function bind(root) {
  const el = root.querySelector('#chartRoot')
  if (!el) return
  const birth = loadBirth()
  if (!birth) {
    el.innerHTML = `<form id="chartBirth">${birthFieldsHtml('c', null)}<button class="btn-primary" type="submit">차트로 보기</button></form>`
    bindBirthFields(el)
    el.querySelector('#chartBirth')?.addEventListener('submit', (e) => {
      e.preventDefault()
      saveBirth(readBirthFields(el))
      bind(root)
    })
    return
  }
  const chart = computeChart(birth)
  const bars = elementBars(chart)
  const line = daewoonTimeline(chart)
  const months = monthlyTrend(chart, 2026)
  const maxLine = Math.max(1, ...line.map((d) => d.score))
  const future = futureYears(chart, 10)

  el.innerHTML = `
    <p class="privacy">${chart.meta.dayElementKo} 일간 ${chart.meta.dayStem} · ${chart.meta.age}세</p>
    <h3>오행 분포</h3>
    <div class="bar-list">
      ${bars.map((b) => `<button type="button" class="bar-row as-btn" data-tip="${b.label} ${b.value}칸"><span>${b.label}</span><div class="meter-bar"><i style="width:${b.pct}%"></i></div><em>${b.value}</em></button>`).join('')}
    </div>
    <h3>대운 타임라인</h3>
    <div class="line-chart" role="img" aria-label="대운 점수">
      ${line.map((d) => `
        <div class="line-col ${d.current ? 'now' : ''}" data-tip="${d.age}세 ${d.ganzi} · ${d.score}점">
          <div class="line-stem" style="height:${(d.score / maxLine) * 120}px"></div>
          <span>${d.age}</span>
        </div>`).join('')}
    </div>
    <p class="privacy">노란 칸이 현재 나이 구간입니다. 막대를 누르면 설명이 나옵니다.</p>
    <h3>2026년 월별 추이</h3>
    <div class="month-grid">
      ${months.map((m) => `
        <button type="button" class="month-cell ${m.highlight ? 'hot' : ''} ${m.score < 40 ? 'cold' : ''}" data-tip="${m.month}월 ${m.score}점 — ${monthAdvice(m)}">
          <strong>${m.month}월</strong>
          <span>${m.score}</span>
        </button>`).join('')}
    </div>
    <p id="chartTip" class="info-callout" hidden></p>
    <h3>5~10년 흐름</h3>
    ${lockHtml(`
      <ul class="year-list">${future.map((y) => `<li><strong>${y.year}</strong> (${y.age}세) ${y.ganzi} · ${y.score}점</li>`).join('')}</ul>
      <p class="privacy">가장 높은 해는 참고용입니다. 실제 선택은 건강·현금·계약이 우선입니다.</p>
    `, '5·10년 예측은 프리미엄')}
  `
  const tip = el.querySelector('#chartTip')
  el.querySelectorAll('[data-tip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      tip.hidden = false
      tip.textContent = btn.dataset.tip
    })
  })
  el.querySelectorAll('[data-open-paywall]').forEach((b) => {
    b.addEventListener('click', () => checkSubscription('5~10년 흐름은 프리미엄입니다.'))
  })
}
