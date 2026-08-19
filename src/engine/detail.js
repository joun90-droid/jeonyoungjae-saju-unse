/** @typedef {'mild' | 'medium' | 'spicy'} DetailLevel */

import {
  buildOverviewNarrative,
  buildTimelineNarrative,
  buildWealthNarrative,
  buildLoveNarrative,
  buildInvestNarrative,
  buildCareerNarrative,
  buildSpicyExtras,
  sliceNarrative,
} from './narrative.js'

export const DETAIL_LEVELS = {
  mild: { id: 'mild', label: '한눈에', desc: '핵심+짧은 상세' },
  medium: { id: 'medium', label: '통찰', desc: '풀어서 장문' },
  spicy: { id: 'spicy', label: '완벽', desc: '정밀·최장문' },
}

/**
 * @param {ReturnType<import('./fortune.js').analyzeOverall>} report
 * @param {ReturnType<import('./calculator.js').computeChart>} chart
 * @param {DetailLevel} level
 */
export function applyDetailLevel(report, chart, level) {
  const hourNote = chart.meta.guessedTime
    ? ` (시간 추정: ${chart.meta.guessedTime.label} ${chart.meta.guessedTime.confidence}% 신뢰)`
    : ''

  const overview = sliceNarrative(buildOverviewNarrative(chart), level === 'mild' ? 'mild' : 'medium')
  const spicyExtras = level === 'spicy' ? buildSpicyExtras(chart) : null

  const enrichTimeline = (t) => {
    const narrative = buildTimelineNarrative(chart, t.id)
    const sliced = level === 'mild' ? narrative.slice(0, 2) : level === 'medium' ? narrative : [...narrative, ...(spicyExtras?.yearly?.slice(0, 1) || [])]
    return {
      ...t,
      narrative: sliced,
      summary: t.summary,
      tips: expandTips(t.tips, level, 2),
      deepDive: level === 'spicy' ? spicyTimelineDeep(t.id, chart) : level === 'medium' ? mediumTimelineDeep(t.id, chart) : '',
    }
  }

  const enrichSection = (base, narrativeBuilder, mediumExtraFn, spicyExtraFn, spicyDetailsFn) => {
    const narrative = narrativeBuilder(chart)
    const sliced = level === 'mild' ? narrative.slice(0, 2) : level === 'medium' ? narrative : [...narrative, ...(spicyExtras?.yearly?.slice(1, 2) || [])]
    return {
      ...base,
      narrative: sliced,
      summary: base.summary,
      details: [
        ...base.details,
        ...(level === 'medium' ? mediumDetails(mediumExtraFn(chart)) : []),
        ...(level === 'spicy' ? spicyDetailsFn(chart) : []),
      ],
      tips: expandTips(base.tips, level, 3),
      deepDive: level === 'spicy' ? spicyExtraFn(chart) : level === 'medium' ? mediumExtraFn(chart) : '',
    }
  }

  const result = {
    ...report,
    overview,
    timeline: report.timeline.map(enrichTimeline),
    wealth: enrichSection(report.wealth, buildWealthNarrative, mediumWealth, spicyWealth, spicyWealthDetails),
    love: enrichSection(report.love, buildLoveNarrative, mediumLove, spicyLove, spicyLoveDetails),
    invest: enrichSection(report.invest, buildInvestNarrative, mediumInvest, spicyInvest, spicyInvestDetails),
    career: enrichSection(report.career, buildCareerNarrative, mediumCareer, spicyCareer, spicyCareerDetails),
    detailMeta: { level, hourNote },
  }

  if (level === 'spicy') {
    result.chartDigest = {
      title: '사주팔자 정밀 요약',
      body: (spicyExtras?.pillars || []).join('\n') + `\n\n오행: ${spicyExtras?.elementBalance || ''}\n\n` + buildOverviewNarrative(chart).join('\n\n'),
    }
    result.spicyExtras = spicyExtras
  }

  if (level === 'medium') {
    result.chartDigest = {
      title: '핵심 요약',
      body: buildOverviewNarrative(chart).slice(0, 3).join('\n\n'),
    }
  }

  return result
}

function expandTips(tips, level, baseCount) {
  if (level === 'mild') return tips.slice(0, baseCount)
  if (level === 'medium') return [...tips, '기록해 두고 분기별로 다시 읽어 보세요.', '감정이 격해질 때 큰 결정은 미루세요.']
  return [...tips, '기록해 두고 분기별로 다시 읽어 보세요.', '감정이 격해질 때 큰 결정은 미루세요.', '사주는 가능성이지 확정 예언이 아닙니다.', '건강·수면·루틴이 운도 받쳐 줍니다.']
}

function mediumDetails(text) {
  return typeof text === 'string' ? [{ k: '보충 해석', v: text }] : text
}

function mediumTimelineDeep(id, chart) {
  const { meta, daewoon } = chart
  if (id === 'present') return `${meta.currentYear}년 ${meta.age}세 — 현재 대운 ${daewoon.current?.ganzi || '—'}와 맞물려 선택의 결과가 2~3년간 이어집니다.`
  if (id === 'future') return `다음 대운 ${daewoon.future[0]?.ganzi || '—'} 전 6개월이 준비의 골든타임입니다.`
  return `과거 ${daewoon.past.map((d) => d.ganzi).join('→') || '흐름'}은 지금의 습관을 만든 배경입니다.`
}

function spicyTimelineDeep(id, chart) {
  const { meta, daewoon, stats } = chart
  if (id === 'past') {
    return `【과거 심층】 ${meta.dayStem} 일간 · ${daewoon.past.length ? daewoon.past.map((d) => `${d.age}~${d.age + 9}세 ${d.ganzi}(${d.stemSipsin}/${d.branchSipsin})`).join(', ') : '대운 미상'}. 재성${stats.sipsinCount.wealth}·관성${stats.sipsinCount.power}·식상${stats.sipsinCount.output}·인성${stats.sipsinCount.resource}·비겁${stats.sipsinCount.self}.`
  }
  if (id === 'present') {
    const cur = daewoon.current
    return `【현재 심층】 ${meta.currentYear}년 · ${cur ? `${cur.ganzi} ${cur.age}~${cur.age + 9}세` : '—'}. ${stats.sipsinCount.resource >= 2 ? '학습·자격' : stats.sipsinCount.output >= 2 ? '표현·기술' : stats.sipsinCount.wealth >= 2 ? '실무·현금' : '자립·고집'} 에너지 강조.`
  }
  return `【미래 심층】 ${daewoon.future.map((d) => `${d.age}세~ ${d.ganzi} ${d.stemSipsin}/${d.branchSipsin}`).join(' · ') || '준비 중'}.`
}

function mediumWealth(chart) {
  const { stats } = chart
  return `재성 ${stats.sipsinCount.wealth}·식상 ${stats.sipsinCount.output} — ${stats.sipsinCount.wealth >= 2 ? '복수 수입·지출 동시' : '한 줄기 수입 의존'} 구조 가능.`
}

function spicyWealth(chart) {
  return ` ${chart.meta.dayStem} 일간 재물: 비겁${chart.stats.sipsinCount.self}·인성${chart.stats.sipsinCount.resource} — ${chart.stats.sipsinCount.self >= 2 ? '동업·보증 주의' : '저축·분산 유리'}.`
}

function spicyWealthDetails(chart) {
  const cur = chart.daewoon.current
  return [
    { k: '오행 재물', v: elementWealthHint(chart.meta.dayElement) },
    { k: '대운 재물', v: cur ? `${cur.ganzi} ${cur.stemSipsin}/${cur.branchSipsin}` : '—' },
    { k: '10년 조언', v: chart.stats.sipsinCount.self >= 2 ? '현금·보증·동업 자제' : '적립·자동이체·비상금' },
    { k: '월별 습관', v: '매월 1일 수입·지출·투자 점검, 분기별 목표 수정' },
  ]
}

function mediumLove(chart) {
  return chart.meta.gender === 'M' ? '남명: 재성·관성이 연애·결혼 타이밍과 연결.' : '여명: 관성·식상이 인연의 질을 좌우.'
}

function spicyLove(chart) {
  const { stats } = chart
  return ` 비겁${stats.sipsinCount.self}·관성${stats.sipsinCount.power}·식상${stats.sipsinCount.output} — ${stats.sipsinCount.self >= 2 ? '고집·질투' : '기대치·속도'} 조율 필요.`
}

function spicyLoveDetails(chart) {
  return [
    { k: '인연 시기', v: chart.daewoon.future[0] ? `${chart.daewoon.future[0].age}대 ${chart.daewoon.future[0].ganzi}` : '현재 대운' },
    { k: '관계 리스크', v: chart.stats.sipsinCount.self >= 3 ? '자존심·비교' : '속도·가치관 차이' },
    { k: '대화 팁', v: '재정·미래 계획·가족관을 초반에 가볍게라도 맞춰 보기' },
  ]
}

function mediumInvest(chart) {
  return chart.stats.sipsinCount.self >= 2 ? '비겁 강함 — 레버리지·올인 자제.' : '인성·정재 — 장기·분산 유리.'
}

function spicyInvest(chart) {
  const ss = chart.daewoon.current ? chart.daewoon.current.stemSipsin + chart.daewoon.current.branchSipsin : ''
  return ` 대운 ${chart.daewoon.current?.ganzi || '—'}: ${/劫財|傷官|겁재|상관/.test(ss) ? '단기 변동·투기 주의' : /正財|正印|정재|정인/.test(ss) ? '적립·배당·원금보존' : '리밸런싱 필수'}.`
}

function spicyInvestDetails(chart) {
  return [
    { k: '적합 자산', v: chart.stats.sipsinCount.resource >= 2 ? '채권·예금·교육' : chart.stats.sipsinCount.output >= 2 ? '성장·IP·콘텐츠' : 'ETF·배당' },
    { k: '피할 패턴', v: 'FOMO·지인 올인·생활비 투입' },
    { k: '리밸런싱', v: '분기 1회, 손실 -15% 시 전략 재검토' },
  ]
}

function mediumCareer(chart) {
  const s = chart.stats.sipsinCount
  const dom = s.power >= s.wealth && s.power >= s.output ? '관성' : s.wealth >= s.output ? '재성' : s.output >= s.resource ? '식상' : '인성'
  return `월주·${dom} — 해당 계열 성과 용이.`
}

function spicyCareer(chart) {
  const mp = chart.saju.pillars[2]
  return ` ${chart.meta.dayStem}·${mp?.stemSipsin || '월간'} — 이직은 대운 전환 6~12개월 전 준비.`
}

function spicyCareerDetails(chart) {
  const f = chart.daewoon.future[0]
  return [
    { k: '전환 시기', v: f ? `${f.age}세 ${f.ganzi}` : '현재 대운 후반' },
    { k: '조직 vs 독립', v: chart.stats.sipsinCount.self >= 2 ? '독립·프리랜스' : '조직·승진' },
    { k: '역량 투자', v: chart.stats.sipsinCount.resource >= 2 ? '자격·학위' : '포트폴리오·실무' },
  ]
}

function elementWealthHint(el) {
  const map = { tree: '성장·교육', fire: '브랜드·마케팅', earth: '부동산·실물', metal: '금융·제조', water: '유통·정보' }
  return map[el] || '분산'
}

export function narrativeHtml(paragraphs) {
  if (!paragraphs?.length) return ''
  return `<div class="narrative">${paragraphs.map((p) => p === '—' ? '<hr class="narr-divider">' : `<p>${p}</p>`).join('')}</div>`
}

export function detailBlockExtra(data, level) {
  let html = narrativeHtml(data.narrative)
  if (level !== 'mild' && data.deepDive) {
    html += `<div class="deep-dive"><p>${data.deepDive}</p></div>`
  }
  return html
}

export function chartDigestBlock(digest) {
  if (!digest) return ''
  return `
    <article class="card fortune digest">
      <h3>📜 ${digest.title}</h3>
      <pre class="digest-body">${digest.body}</pre>
    </article>`
}

export function overviewBlock(overview, level) {
  if (!overview?.length) return ''
  const title = level === 'spicy' ? '종합 상세 해석' : '종합 해석'
  return `
    <article class="card fortune overview ${level}">
      <h3>📖 ${title}</h3>
      ${narrativeHtml(overview)}
    </article>`
}
