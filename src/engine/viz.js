import { ELEMENT_KO, scoreLevel } from './calculator.js'
import { analyzeTimeline } from './fortune.js'
import { monthlyWave } from './life-wave.js'

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
  const scored = chart.lifeWave?.daeun || []
  return (chart.daewoon.all || []).map((dw, i) => {
    // 라이프 웨이브가 용신·기신까지 반영해 매긴 점수를 그대로 쓴다
    const deep = scored[i]
    const s = deep ? clamp(50 + deep.score * 0.9) : legacyDaewoonScore(dw)
    return {
      age: dw.age,
      end: dw.age + 9,
      ganzi: dw.ganzi,
      tenGod: deep?.tenGod || dw.stemSipsin,
      score: s,
      current: age >= dw.age && age <= dw.age + 9,
    }
  })
}

/** 심층 엔진이 없는 옛 호출 경로용 폴백 */
function legacyDaewoonScore(dw) {
  let s = 48
  const ss = `${dw.stemSipsin}/${dw.branchSipsin}`
  if (/正財|偏財|정재|편재/.test(ss)) s += 12
  if (/正官|正印|정관|정인/.test(ss)) s += 8
  if (/劫財|傷官|겁재|상관/.test(ss)) s -= 7
  if (dw.isGongmang) s -= 6
  return clamp(s)
}

export function monthlyTrend(chart, year) {
  const y = year || new Date().getFullYear()
  if (chart.deep) {
    // 절기 기준 월주를 실제로 뽑아 용신·기신으로 채점한다
    return monthlyWave(chart, y).map((m) => ({
      month: m.month,
      ganzi: m.ganzi,
      tenGod: m.tenGod,
      score: m.score,
      level: scoreLevel(m.score),
      highlight: m.score >= 70,
      flags: m.flags,
    }))
  }
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
  const rows = chart.lifeWave?.rows || []
  const start = chart.lifeWave?.currentSeun?.year || new Date().getFullYear()
  if (rows.length) {
    // 진짜 세운 간지와 점수 — 예전처럼 대운 점수를 그대로 늘어놓지 않는다
    return rows
      .filter((r) => r.year >= start && r.year < start + years)
      .map((r) => ({ year: r.year, age: r.age, score: r.score100, ganzi: r.seun, tenGod: r.tenGod, flags: r.flags }))
  }
  const age = chart.meta.age
  const line = daewoonTimeline(chart)
  return Array.from({ length: years }, (_, i) => {
    const year = start + i
    const a = age + i
    const dw = [...line].reverse().find((d) => a >= d.age) || line[0]
    return { year, age: a, score: dw?.score || 50, ganzi: dw?.ganzi || '—' }
  })
}

/**
 * 라이프 웨이브를 꺾은선으로 그릴 좌표로 바꾼다.
 * @param {ReturnType<import('./calculator.js').computeChart>} chart
 * @param {{ from?: number, to?: number }} [range] 기본: 현재 기준 -10 ~ +20년
 */
export function lifeWaveSeries(chart, range = {}) {
  const rows = chart.lifeWave?.rows || []
  if (!rows.length) return []
  const now = chart.lifeWave.currentSeun?.year || new Date().getFullYear()
  const from = range.from ?? now - 10
  const to = range.to ?? now + 20
  return rows
    .filter((r) => r.year >= from && r.year <= to)
    .map((r) => ({
      year: r.year,
      age: r.age,
      ganzi: r.seun,
      score: r.score100,
      total: r.total,
      volatility: r.volatility,
      isCurrent: r.isCurrent,
      level: scoreLevel(r.score100),
      flags: r.flags,
    }))
}

export function monthAdvice(m) {
  if (m.score >= 70) return '노출·신청·발표처럼 밖으로 내는 일이 잘 붙습니다. 과신만 주의하세요.'
  if (m.score >= 50) return '루틴 유지. 큰 계약은 가능하나 하루 더 읽고 결정하세요.'
  return '확장보다 정리. 수면·현금·관계를 지키는 달이 이득입니다.'
}
