import { ELEMENT_KO, scoreLevel } from './calculator.js'
import { analyzeTimeline } from './fortune.js'

const ORDER = ['tree', 'fire', 'earth', 'metal', 'water']

function clamp(n) {
  return Math.max(8, Math.min(96, Math.round(n)))
}

function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function elementBars(chart) {
  const c = chart.stats.elementCount
  const max = Math.max(1, ...ORDER.map((k) => c[k] || 0))
  return ORDER.map((k) => ({
    key: k,
    label: ELEMENT_KO[k],
    value: c[k] || 0,
    pct: Math.round(((c[k] || 0) / max) * 100),
  }))
}

export function daewoonTimeline(chart) {
  const age = chart.meta.age
  return (chart.daewoon.all || []).map((dw) => {
    let s = 48
    const ss = `${dw.stemSipsin}/${dw.branchSipsin}`
    if (/正財|偏財|정재|편재/.test(ss)) s += 12
    if (/正官|正印|정관|정인/.test(ss)) s += 8
    if (/劫財|傷官|겁재|상관/.test(ss)) s -= 7
    if (dw.isGongmang) s -= 6
    s = clamp(s)
    return {
      age: dw.age,
      end: dw.age + 9,
      ganzi: dw.ganzi,
      score: s,
      current: age >= dw.age && age <= dw.age + 9,
    }
  })
}

export function monthlyTrend(chart, year) {
  const y = year || new Date().getFullYear()
  const base = analyzeTimeline(chart)[1]?.score || 50
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const h = hash(`${y}-${month}|${chart.meta.dayStem}|${chart.meta.dayElement}`)
    const wobble = ((h % 21) - 10)
    const score = clamp(base + wobble - (month === 6 ? 8 : 0) + (month === 11 ? 7 : 0) + (month === 3 ? 5 : 0))
    return { month, score, level: scoreLevel(score), highlight: score >= 70 }
  })
}

export function futureYears(chart, years = 5) {
  const start = new Date().getFullYear()
  const age = chart.meta.age
  const line = daewoonTimeline(chart)
  return Array.from({ length: years }, (_, i) => {
    const year = start + i
    const a = age + i
    const dw = [...line].reverse().find((d) => a >= d.age) || line[0]
    return { year, age: a, score: dw?.score || 50, ganzi: dw?.ganzi || '—' }
  })
}

export function monthAdvice(m) {
  if (m.score >= 70) return '노출·신청·발표처럼 밖으로 내는 일이 잘 붙습니다. 과신만 주의하세요.'
  if (m.score >= 50) return '루틴 유지. 큰 계약은 가능하나 하루 더 읽고 결정하세요.'
  return '확장보다 정리. 수면·현금·관계를 지키는 달이 이득입니다.'
}
