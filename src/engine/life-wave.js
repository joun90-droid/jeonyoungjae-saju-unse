/**
 * 라이프 웨이브 (세운 · 대운 파동)
 *
 * 용신/기신과 원국 지지를 기준으로 연도별 세운 점수와 대운 점수를 계산해
 * 태어난 해부터 90년치 흐름을 하나의 곡선으로 만든다.
 *
 * 점수 구성
 *   세운 = 천간 오행 호불호 + 지지 지장간 호불호 + 조후 가점 + 원국과의 합충형파해
 *   대운 = 같은 방식으로 계산한 대운 간지 점수 (10년간 고정)
 *   총점 = 세운 + 대운, 대운·세운이 충하면 변동성(volatility)을 따로 기록
 */

import { HGANJI, STEM_INFO, BRANCH_CLASHES, BRANCH_BREAKS, BRANCH_COMBINES_6, BRANCH_HARMS, BRANCH_PUNISHMENTS, HALF_COMPOSES, STEM_CLASHES, STEM_COMBINES } from '@orrery/core/constants'
import LunarJS from 'lunar-javascript'

import {
  GENERATES,
  WONJIN_PAIRS,
  branchKo,
  ganziKo,
  generatedBy,
  pairInList,
  pairLookup,
  splitJijanggan,
  stemKo,
  tenGodName,
  unseongOf,
} from './deep.js'

const { Solar } = LunarJS

/** 1984년 = 甲子년 */
const GANZI_EPOCH_YEAR = 1984
/** 파동을 뽑을 기간 */
const WAVE_SPAN_YEARS = 90

/** 오행 호불호 배점 */
const FAVOR = { yongsin: 12, yongsinSource: 6, gisin: -12, gisinSource: -6 }
/** 지장간 층별 반영 비율 — 본기가 지지를 대표한다 */
const BRANCH_LAYER_RATIO = { bongi: 1, junggi: 0.4, yeogi: 0.2 }

/** 원국 지지와의 관계 배점 */
const INTERACTION_SCORE = {
  chung: -8, xing: -5, pa: -3, hai: -3, wonjin: -4,
  liuhe: 5, banhe: 6, stemChung: -4, stemHap: 3, gongmang: -5,
}
const INTERACTION_KO = {
  chung: '충', xing: '형', pa: '파', hai: '해', wonjin: '원진',
  liuhe: '육합', banhe: '반합', stemChung: '천간충', stemHap: '천간합', gongmang: '공망',
}

/** 세운 간지 (입춘 기준 연도) */
export function ganziForYear(year) {
  const idx = ((year - GANZI_EPOCH_YEAR) % 60 + 60) % 60
  return HGANJI[idx]
}

/** 해당 연도의 입춘 시각 */
export function lichunOf(year) {
  try {
    const table = Solar.fromYmd(year, 2, 10).getLunar().getJieQiTable()
    const jq = table['立春']
    if (!jq) return null
    return new Date(jq.getYear(), jq.getMonth() - 1, jq.getDay(), jq.getHour(), jq.getMinute(), jq.getSecond())
  } catch {
    return null
  }
}

/** 입춘을 넘겼는지 따져 세운에 쓰이는 연도를 정한다 */
export function seunYearOf(date) {
  const y = date.getFullYear()
  const lichun = lichunOf(y)
  return lichun && date < lichun ? y - 1 : y
}

/**
 * @param {import('@orrery/core/types').SajuResult} saju
 * @param {ReturnType<import('./deep.js').analyzeDeep>} deep
 * @param {{ birthYear: number, age: number, today?: Date }} opts
 */
export function buildLifeWave(saju, deep, opts) {
  const today = opts.today || new Date()
  const ctx = deep.context
  const scoreOf = makeGanziScorer(ctx, deep)

  const daeun = buildDaeun(saju, deep, opts, scoreOf)
  const startYear = opts.birthYear
  const nowSeunYear = seunYearOf(today)
  // 90년치가 기본이지만, 고령 명식이라도 올해와 앞으로 10년은 반드시 들어가야 한다
  const endYear = Math.max(opts.birthYear + WAVE_SPAN_YEARS, nowSeunYear + 10)

  const rows = []
  for (let year = startYear; year <= endYear; year++) {
    const ganzi = ganziForYear(year)
    const age = year - opts.birthYear
    const dw = daeun.find((d) => age >= d.ageStart && age <= d.ageEnd) || null
    const seun = scoreOf(ganzi)
    const daeunScore = dw ? dw.score : 0

    // 대운 지지와 세운 지지가 충하면 그 해는 진폭이 커진다
    let volatility = 0
    const flags = [...seun.flags]
    if (dw && pairLookup(BRANCH_CLASHES, dw.branch, ganzi[1])) {
      volatility = seun.flags.includes('stress.chung') ? 30 : 18
      flags.unshift('daeunSeunChung')
    }

    rows.push({
      year,
      age,
      seun: ganziKo(ganzi),
      seunHanja: ganzi,
      daeunIndex: dw ? dw.index : null,
      daeunGanzi: dw ? dw.ganzi : null,
      seunScore: seun.score,
      daeunScore,
      total: seun.score + daeunScore,
      volatility,
      flags,
      notes: seun.notes,
      tenGod: tenGodName(ctx.dayStem, ganzi[0]),
      unseong: unseongOf(ctx.dayStem, ganzi[1]),
      score100: to100(seun.score + daeunScore),
      isCurrent: year === nowSeunYear,
    })
  }

  const currentRow = rows.find((r) => r.isCurrent) || null

  return {
    rows,
    daeun,
    // 대운 순행/역행 — 양년생 남자·음년생 여자는 순행
    daeunDirection: daeunDirection(saju, opts.gender),
    daeunStartAge: daeun[0] ? daeun[0].ageStart : null,
    span: { startYear, endYear },
    currentSeun: currentRow && {
      year: currentRow.year,
      ganzi: currentRow.seun,
      stem: stemKo(currentRow.seunHanja[0]),
      branch: branchKo(currentRow.seunHanja[1]),
      tenGod: currentRow.tenGod,
      score: currentRow.total,
      score100: currentRow.score100,
      flags: currentRow.flags,
      notes: currentRow.notes,
      // 세운은 입춘에 바뀐다 — 이번 구간의 시작과 다음 경계
      lichunAt: lichunOf(currentRow.year),
      nextLichunAt: lichunOf(currentRow.year + 1),
    },
    best: pickExtreme(rows, 1),
    worst: pickExtreme(rows, -1),
    // 앞으로 10년만 잘라 쓰는 화면이 많아 미리 뽑아 둔다
    next10: rows.filter((r) => r.year > nowSeunYear && r.year <= nowSeunYear + 10),
  }
}

/**
 * 계산된 차트로 간지 채점기를 만든다 (월운·일운 등 다른 주기에도 그대로 쓴다).
 * @param {ReturnType<import('./calculator.js').computeChart>} chart
 */
export function createGanziScorer(chart) {
  return makeGanziScorer(chart.deep.context, chart.deep)
}

/**
 * 절기 기준 월운 12개 — 세운과 같은 잣대로 채점한다.
 * @param {ReturnType<import('./calculator.js').computeChart>} chart
 * @param {number} year
 */
export function monthlyWave(chart, year) {
  const scoreOf = createGanziScorer(chart)
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    // 15일을 기준으로 잡아 절기 경계에 걸치지 않게 한다
    const lunar = Solar.fromYmd(year, month, 15).getLunar()
    const ganzi = lunar.getMonthInGanZhiExact()
    const m = scoreOf(ganzi)
    // 입춘 전 1월은 아직 지난해 세운이므로 절기 기준 년주를 그대로 쓴다
    const seun = scoreOf(lunar.getYearInGanZhiExact())
    // 그 해의 세운이 배경으로 깔리고, 월운이 그 위에서 흔들린다
    const total = Math.round(seun.score * 0.5 + m.score)
    return {
      month,
      ganzi: ganziKo(ganzi),
      ganziHanja: ganzi,
      seunGanzi: ganziKo(lunar.getYearInGanZhiExact()),
      tenGod: tenGodName(chart.deep.context.dayStem, ganzi[0]),
      monthScore: m.score,
      total,
      score: to100(total),
      flags: m.flags,
      notes: m.notes,
    }
  })
}

/** 원국·용신 정보를 묶어 간지 하나를 점수로 바꾸는 함수를 만든다 */
function makeGanziScorer(ctx, deep) {
  const gongmangBranches = deep.gongmang?.day?.branchesHanja || []
  const yongsinSource = generatedBy(ctx.yongsin)
  const gisinSource = generatedBy(ctx.gisin)

  const favorOf = (element) => {
    if (!element) return 0
    if (element === ctx.yongsin) return FAVOR.yongsin
    if (element === ctx.gisin) return FAVOR.gisin
    if (element === yongsinSource) return FAVOR.yongsinSource
    if (element === gisinSource) return FAVOR.gisinSource
    return 0
  }

  return function scoreGanzi(ganzi) {
    const stem = ganzi[0]
    const branch = ganzi[1]
    const flags = []
    const notes = []

    let score = favorOf(STEM_INFO[stem]?.element)

    // 지지는 지장간 층을 비중대로 반영한다
    const layers = splitJijanggan(branch)
    for (const layer of ['bongi', 'junggi', 'yeogi']) {
      const hidden = layers[layer]
      if (!hidden) continue
      score += favorOf(STEM_INFO[hidden]?.element) * BRANCH_LAYER_RATIO[layer]
    }

    // 조후가 필요한 사주는 그 오행이 오는 해에 숨통이 트인다
    if (ctx.johuElement) {
      const branchEl = layers.bongi ? STEM_INFO[layers.bongi]?.element : null
      if (STEM_INFO[stem]?.element === ctx.johuElement || branchEl === ctx.johuElement) {
        score += 4
        notes.push(`조후 오행이 들어와 균형이 잡히는 해`)
      }
    }

    // 원국 지지와의 관계
    ctx.natalBranches.forEach((nb, i) => {
      const where = PILLAR_KO[i] + '지'
      const hit = (key) => {
        score += INTERACTION_SCORE[key]
        // 도움이 되는 관계는 그대로, 부담이 되는 관계는 stress. 접두어를 붙인다
        const tag = INTERACTION_SCORE[key] > 0 ? key : 'stress.' + key
        if (!flags.includes(tag)) flags.push(tag)
        notes.push(`${where} ${branchKo(nb)} — ${branchKo(branch)} ${INTERACTION_KO[key]}`)
      }
      if (pairLookup(BRANCH_CLASHES, nb, branch)) hit('chung')
      if (pairLookup(BRANCH_PUNISHMENTS, nb, branch)) hit('xing')
      if (pairLookup(BRANCH_BREAKS, nb, branch)) hit('pa')
      if (pairLookup(BRANCH_HARMS, nb, branch)) hit('hai')
      if (pairInList(WONJIN_PAIRS, nb, branch)) hit('wonjin')
      if (pairLookup(BRANCH_COMBINES_6, nb, branch)) hit('liuhe')
      if (pairLookup(HALF_COMPOSES, nb, branch)) hit('banhe')
    })

    // 원국 천간과의 관계
    ctx.natalStems.forEach((ns, i) => {
      const where = PILLAR_KO[i] + '간'
      if (pairLookup(STEM_CLASHES, ns, stem)) {
        score += INTERACTION_SCORE.stemChung
        if (!flags.includes('stress.stemChung')) flags.push('stress.stemChung')
        notes.push(`${where} ${stemKo(ns)} — ${stemKo(stem)} 천간충`)
      }
      if (pairLookup(STEM_COMBINES, ns, stem)) {
        score += INTERACTION_SCORE.stemHap
        if (!flags.includes('stemHap')) flags.push('stemHap')
        notes.push(`${where} ${stemKo(ns)} — ${stemKo(stem)} 천간합`)
      }
    })

    // 일주 공망에 걸리는 지지
    if (gongmangBranches.includes(branch)) {
      score += INTERACTION_SCORE.gongmang
      flags.push('stress.gongmang')
      notes.push(`일주 공망 지지(${branchKo(branch)})에 해당`)
    }

    return { score: Math.round(score), flags, notes }
  }
}

const PILLAR_KO = ['시', '일', '월', '년']

/** 대운 목록에 점수와 십신을 붙인다 */
function buildDaeun(saju, deep, opts, scoreOf) {
  const ctx = deep.context
  const list = saju.daewoon || []
  return list.map((dw, i) => {
    const ganzi = dw.ganzi
    const scored = scoreOf(ganzi)
    const ageStart = dw.age
    const ageEnd = dw.age + 9
    return {
      index: i,
      ganzi,
      ganziKo: ganziKo(ganzi),
      stem: ganzi[0],
      branch: ganzi[1],
      stemKo: stemKo(ganzi[0]),
      branchKo: branchKo(ganzi[1]),
      ageStart,
      ageEnd,
      startYear: opts.birthYear + ageStart,
      tenGod: tenGodName(ctx.dayStem, ganzi[0]),
      unseong: unseongOf(ctx.dayStem, ganzi[1]),
      // 대운은 10년을 지배하므로 세운보다 완만하게 반영한다
      score: Math.round(scored.score * 0.8),
      flags: scored.flags,
      notes: scored.notes,
      isCurrent: opts.age >= ageStart && opts.age <= ageEnd,
    }
  })
}

/** 양년생 남자 · 음년생 여자는 순행, 나머지는 역행 */
function daeunDirection(saju, gender) {
  const yearStem = saju.pillars[3]?.pillar.stem
  const yang = STEM_INFO[yearStem]?.yinyang === '+'
  const male = gender !== 'F'
  return yang === male ? 'forward' : 'reverse'
}

/** 총점을 0~100 지수로 변환 (화면 게이지용) */
function to100(total) {
  return Math.max(5, Math.min(95, Math.round(50 + total * 0.9)))
}

function pickExtreme(rows, dir) {
  // 유년기는 본인 선택의 영역이 아니라 15세 이후만 후보로 본다
  const pool = rows.filter((r) => r.age >= 15)
  if (!pool.length) return null
  return pool.reduce((best, r) => (dir > 0 ? r.total > best.total : r.total < best.total) ? r : best, pool[0])
}
