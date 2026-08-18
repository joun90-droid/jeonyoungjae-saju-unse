import { scoreLevel } from './calculator.js'
import { analyzeCareer } from './career.js'

function clamp(n) {
  return Math.max(12, Math.min(92, Math.round(n)))
}

function dwText(dw) {
  if (!dw) return '—'
  return `${dw.ganzi}(${dw.stemSipsin}/${dw.branchSipsin}) · ${dw.age}세~`
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeTimeline(chart) {
  const { meta, daewoon, stats } = chart
  const { past, current, future } = daewoon

  const pastScore = past.length
    ? avgDaewoonScore(past, stats) - 5
    : 45
  const presentScore = current
    ? daewoonScore(current, stats) + elementSupportBonus(chart)
    : 50
  const futureScore = future.length
    ? avgDaewoonScore(future, stats) + 3
    : 52

  const sections = [
    {
      id: 'past',
      title: '과거 흐름',
      period: past.map((d) => `${d.age}~${d.age + 9}세`).join(' · ') || '대운 정보 부족',
      score: clamp(pastScore),
      summary: pastSummary(past, stats, meta),
      tips: pastTips(),
    },
    {
      id: 'present',
      title: '현재 (올해·현재 대운)',
      period: current
        ? `${current.age}~${current.age + 9}세 (현재 ${meta.age}세)`
        : `${meta.currentYear}년`,
      score: clamp(presentScore),
      summary: presentSummary(current, stats, meta),
      tips: presentTips(current, meta),
    },
    {
      id: 'future',
      title: '미래 전망',
      period: future.map((d) => `${d.age}~${d.age + 9}세`).join(' · ') || '다음 대운 준비',
      score: clamp(futureScore),
      summary: futureSummary(future, stats, meta),
      tips: futureTips(future),
    },
  ]

  return sections.map((s) => ({ ...s, level: scoreLevel(s.score) }))
}

function daewoonScore(dw, stats) {
  let s = 48
  const ss = `${dw.stemSipsin}/${dw.branchSipsin}`
  if (/正財|偏財|정재|편재/.test(ss)) s += 14
  if (/正官|正印|정관|정인/.test(ss)) s += 10
  if (/劫財|傷官|겁재|상관/.test(ss)) s -= 8
  if (/七殺|편관/.test(ss)) s += 4
  if (dw.isGongmang) s -= 6
  if (stats.sipsinCount.self > 3) s -= 4
  return s
}

function avgDaewoonScore(list, stats) {
  if (!list.length) return 48
  return list.reduce((a, d) => a + daewoonScore(d, stats), 0) / list.length
}

function elementSupportBonus(chart) {
  const el = chart.meta.dayElement
  const c = chart.stats.elementCount
  const total = Object.values(c).reduce((a, b) => a + b, 0) || 1
  const ratio = c[el] / total
  if (ratio >= 0.35) return 6
  if (ratio <= 0.12) return -5
  return 0
}

function pastSummary(past, stats, meta) {
  if (!past.length) {
    return `과거 대운 데이터가 제한적이지만, ${meta.dayElementKo} 일간 ${meta.dayStem} 기준으로 초·청년기에 성장과 시행착오·귀감이 교차했을 가능성이 큽니다.`
  }
  const last = past[past.length - 1]
  const wealth = /正財|偏財|정재|편재/.test(`${last.stemSipsin}${last.branchSipsin}`)
  const parts = [`지난 ${past.map((p) => `${p.age}~${p.age + 9}세 ${p.ganzi}`).join(', ')} 구간을 거쳤습니다.`]
  if (wealth && stats.sipsinCount.wealth >= 2) {
    parts.push(`특히 ${last.age}대 전후로 재물·실무·거래 운이 붙었을 수 있습니다.`)
  } else if (/正官|七殺|정관|편관/.test(`${last.stemSipsin}${last.branchSipsin}`)) {
    parts.push('학업·직장·규율·시험과의 인연이 강했을 수 있습니다.')
  }
  parts.push('이 시기의 경험이 지금의 습관·가치관을 만들었습니다.')
  return parts.join(' ')
}

function presentSummary(cur, stats, meta) {
  if (!cur) return `현재 ${meta.age}세, ${meta.dayElementKo} 일간 ${meta.dayStem} 기준으로 자기 색깔과 방향을 찾는 구간입니다. ${meta.currentYear}년은 작은 선택도 향후 2~3년에 영향을 줄 수 있습니다.`
  let t = `현재 ${cur.ganzi} 대운(${cur.age}~${cur.age + 9}세) 한가운데 ${meta.age}세입니다. `
  if (stats.sipsinCount.wealth >= 2) t += '재성 기운으로 수입·거래·성과·지출 이슈가 두드러질 수 있습니다. '
  if (stats.sipsinCount.self >= 2) t += '비겁이 강해 경쟁·동업·지출·고집이 동시에 올 수 있습니다. '
  if (stats.sipsinCount.power >= 2) t += '관성이 받쳐 주어 직장·책임·승진·시험과의 인연이 있습니다. '
  t += `올해(${meta.currentYear})는 ${cur.stemSipsin} 성향의 선택이 결과를 좌우합니다.`
  return t
}

function futureSummary(future, stats, meta) {
  if (!future.length) return '다음 대운 전환 전까지는 현재 패턴을 다듬고, 재무·관계·커리어 중 하나를 정리하는 것이 유리합니다.'
  const next = future[0]
  const investHint = /劫財|傷官|겁재|상관/.test(`${next.stemSipsin}${next.branchSipsin}`)
    ? '투자·확장·이동은 신중히, 기반 다지기와 병행하세요.'
    : /正財|正印|정재|정인/.test(`${next.stemSipsin}${next.branchSipsin}`)
      ? '저축·자격·장기 포지션·안정적 선택에 유리한 대운으로 볼 수 있습니다.'
      : '새 목표를 세우되 무리한 올인은 피하세요.'
  return `${next.age}세부터 ${next.ganzi} 대운(${next.stemSipsin}/${next.branchSipsin})으로 전환됩니다. ${investHint} ${meta.dayStem} 일간은 ${next.age}세 전후 6~12개월이 준비의 골든타임입니다.`
}

function pastTips() {
  return ['과거 패턴은 참고용입니다.', '지나간 대운은 경험 자산으로 정리하세요.']
}

function presentTips(cur, meta) {
  const tips = [`${meta.currentYear}년 하반기는 무리한 레버리지보다 현금흐름 점검.`]
  if (cur?.isGongmang) tips.push('공망 대운 — 큰 계약·투자는 재검토 권장.')
  return tips
}

function futureTips(future) {
  if (!future.length) return ['다음 대운 시작 1~2년 전부터 재무·관계 정리.']
  return [`${future[0].age}세 전후 목표·자산 구조를 미리 설계하세요.`]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeWealth(chart) {
  const { stats, daewoon, meta, saju } = chart
  let score = 42 + stats.sipsinCount.wealth * 9 - stats.sipsinCount.self * 4 + stats.sipsinCount.resource * 5
  if (daewoon.current && /正財|偏財|정재|편재/.test(`${daewoon.current.stemSipsin}${daewoon.current.branchSipsin}`)) {
    score += 12
  }
  if (saju.specialSals?.dohwa?.length) score += 3
  score = clamp(score)

  const incomeStyle = stats.sipsinCount.wealth >= 2
    ? '복수 수입원·거래·실무 수익형'
    : stats.sipsinCount.output >= 2
      ? '기술·콘텐츠·프로젝트형'
      : '안정적 급여·저축 축적형'

  return {
    score,
    level: scoreLevel(score),
    headline: score >= 58 ? '재물운이 붙는 편' : '재물은 관리형',
    summary: `${meta.dayElementKo} 일간, 재성 ${stats.sipsinCount.wealth}개. 현재 대운 ${dwText(daewoon.current)}. ${incomeStyle}.`,
    details: [
      { k: '수입 스타일', v: incomeStyle },
      { k: '유리한 시기', v: daewoon.future[0] ? `${daewoon.future[0].age}대 ${daewoon.future[0].ganzi}` : '현재 대운 중후반' },
      { k: '주의', v: stats.sipsinCount.self >= 2 ? '경쟁·동업·보증' : '과소비·충동 지출' },
    ],
    tips: ['월 고정 저축·비상금 먼저.', '사주는 참고, 실제 재무는 장부로 관리.'],
  }
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeLove(chart) {
  const { stats, meta, saju, daewoon } = chart
  const isMale = meta.gender === 'M'
  let score = 46
  if (isMale) score += stats.sipsinCount.wealth * 8 + stats.sipsinCount.power * 4
  else score += stats.sipsinCount.power * 9 + stats.sipsinCount.output * 4
  if (saju.specialSals?.dohwa?.length) score += 10
  if (stats.sipsinCount.self >= 3) score -= 8
  if (daewoon.current && /正官|七殺|正財|정관|편관|정재/.test(`${daewoon.current.stemSipsin}${daewoon.current.branchSipsin}`)) {
    score += 8
  }
  score = clamp(score)

  const style = saju.specialSals?.dohwa?.length
    ? '매력·인기형'
    : stats.sipsinCount.power >= 2
      ? '진지한 관계형'
      : '천천히 신뢰 쌓는 안정형'

  return {
    score,
    level: scoreLevel(score),
    headline: score >= 58 ? '인연운 활발' : '깊은 관계형',
    summary: `${isMale ? '남성' : '여성'} 명식, ${style}.`,
    details: [
      { k: '연애 스타일', v: style },
      { k: '현재 대운', v: dwText(daewoon.current) },
      { k: '주의', v: stats.sipsinCount.self >= 2 ? '고집·독선' : '기대치 과다' },
    ],
    tips: ['상대와 재정·가치관을 미리 맞춰보세요.', '궁합은 상대 사주와 함께 보면 더 정확합니다.'],
  }
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeInvest(chart) {
  const { stats, daewoon, meta } = chart
  let score = 40
  const cur = daewoon.current
  const curSs = cur ? `${cur.stemSipsin}${cur.branchSipsin}` : ''

  if (/正財|正印|정재|정인/.test(curSs)) score += 14
  if (/偏財|편재/.test(curSs)) score += 8
  if (/劫財|傷官|七殺|겁재|상관|편관/.test(curSs)) score -= 6
  if (stats.sipsinCount.self >= 2) score -= 10
  if (stats.sipsinCount.resource >= 2) score += 8
  score = clamp(score)

  const pnlOutlook = score >= 58
    ? '중장기 분산 투자 시 손익 밸런스 유리'
    : score >= 42
      ? '단기 매매보다 적립·ETF가 유리'
      : '원금 보존 우선, 고위험 자제'

  const lossRisk = stats.sipsinCount.self >= 2 || /劫財|傷官/.test(curSs)
    ? '높음 — 레버리지·한 종목 집중 금지'
    : '중간 — 리밸런싱 주기 준수'

  return {
    score,
    level: scoreLevel(score),
    headline: score >= 55 ? '투자 여력 있음' : '보수적 접근 권장',
    summary: pnlOutlook,
    details: [
      { k: '손익 전망', v: pnlOutlook },
      { k: '손실 리스크', v: lossRisk },
      { k: '현재 대운', v: dwText(cur) },
    ],
    tips: ['투자금은 잃어도 생활에 지장 없는 금액만.', '사주 투자 조언은 참고용, 손익 책임은 본인.'],
    scenarios: [
      { label: '단기 (1년)', pnl: score >= 55 ? '소폭 + 가능' : '보합~소폭 변동', risk: lossRisk },
      { label: '중기 (3~5년)', pnl: score >= 50 ? '누적 수익 기대' : '원금 보존+α', risk: '중간' },
    ],
  }
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeOverall(chart) {
  const timeline = analyzeTimeline(chart)
  const wealth = analyzeWealth(chart)
  const love = analyzeLove(chart)
  const invest = analyzeInvest(chart)
  const career = analyzeCareer(chart)
  const avg = Math.round((wealth.score + love.score + invest.score + career.score + timeline[1].score) / 5)
  return { timeline, wealth, love, invest, career, overall: { score: avg, level: scoreLevel(avg) } }
}
