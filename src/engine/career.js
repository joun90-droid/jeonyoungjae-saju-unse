import { scoreLevel } from './calculator.js'

function clamp(n) {
  return Math.max(12, Math.min(92, Math.round(n)))
}

/** @type {{ title: string, tags: string[], element: string[], reason: string }[]} */
const JOB_POOL = [
  { title: '공무원·공공기관', tags: ['power', 'resource'], element: ['earth', 'metal'], reason: '관성·인성 — 안정·규율·봉사직' },
  { title: '대기업·관리직', tags: ['power'], element: ['metal', 'earth'], reason: '관성 — 조직·책임·승진 구조' },
  { title: '법률·법무', tags: ['power', 'output'], element: ['metal'], reason: '관성+식상 — 논리·말·규범' },
  { title: '회계·세무·재무', tags: ['wealth', 'power'], element: ['metal', 'earth'], reason: '재성+관성 — 숫자·규정·자산' },
  { title: '금융·투자·은행', tags: ['wealth'], element: ['metal', 'water'], reason: '재성 — 자금·거래·리스크' },
  { title: '영업·무역·유통', tags: ['wealth', 'self'], element: ['water', 'fire'], reason: '재성+비겁 — 관계·매출·협상' },
  { title: '창업·자영업', tags: ['self', 'wealth'], element: ['fire', 'tree'], reason: '비겁+재성 — 독립·수익 직결' },
  { title: 'IT·개발·데이터', tags: ['output', 'resource'], element: ['metal', 'water'], reason: '식상+인성 — 기술·분석·생산' },
  { title: '디자인·영상·콘텐츠', tags: ['output'], element: ['fire', 'tree'], reason: '식상 — 표현·창작·브랜드' },
  { title: '교육·강사·학원', tags: ['output', 'resource'], element: ['tree', 'fire'], reason: '식상+인성 — 전달·성장·자격' },
  { title: '연구·R&D·학술', tags: ['resource'], element: ['water', 'tree'], reason: '인성 — 깊이·전문·논문' },
  { title: '의료·보건·상담', tags: ['resource', 'power'], element: ['water', 'earth'], reason: '인성+관성 — 돌봄·면허·책임' },
  { title: '마케팅·PR·광고', tags: ['output', 'wealth'], element: ['fire'], reason: '식상+재성 — 설득·트렌드·성과' },
  { title: '건설·부동산·시공', tags: ['wealth', 'power'], element: ['earth'], reason: '재성+토 — 실물·현장·자산' },
  { title: '물류·무역·해외', tags: ['wealth'], element: ['water'], reason: '재성+수 — 유통·변동·글로벌' },
  { title: '요식·서비스·호스피탈리티', tags: ['output', 'wealth'], element: ['fire', 'earth'], reason: '식상+재성 — 대면·경험·매출' },
  { title: '프리랜서·1인 기업', tags: ['self', 'output'], element: ['tree', 'fire'], reason: '비겁+식상 — 자유·포트폴리오' },
  { title: '스포츠·피트니스·코칭', tags: ['self', 'output'], element: ['fire', 'tree'], reason: '비겁+식상 — 체력·경쟁·리드' },
  { title: '공예·수공예·전문기술', tags: ['output', 'self'], element: ['metal', 'earth'], reason: '식상+비겁 — 장인·실무' },
  { title: '인사·HR·조직문화', tags: ['power', 'resource'], element: ['earth', 'water'], reason: '관성+인성 — 사람·제도' },
]

const TYPE_LABELS = {
  power: '관성(正官)형 — 조직·규율·명예',
  wealth: '재성(財星)형 — 실무·거래·수익',
  output: '식상(食傷)형 — 표현·기술·창작',
  resource: '인성(印星)형 — 학습·전문·자격',
  self: '비겁(比劫)형 — 독립·경쟁·자업',
}

function dominantSipsin(stats) {
  const entries = [
    ['power', stats.sipsinCount.power],
    ['wealth', stats.sipsinCount.wealth],
    ['output', stats.sipsinCount.output],
    ['resource', stats.sipsinCount.resource],
    ['self', stats.sipsinCount.self],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][1] > 0 ? entries[0][0] : 'output'
}

function scoreJob(job, chart) {
  const { stats, meta, daewoon } = chart
  const dom = dominantSipsin(stats)
  let s = 42

  for (const tag of job.tags) {
    s += (stats.sipsinCount[tag] || 0) * 9
    if (tag === dom) s += 12
  }
  for (const el of job.element) {
    if (el === meta.dayElement) s += 8
    if ((stats.elementCount[el] || 0) >= 2) s += 4
  }

  const cur = daewoon.current
  if (cur) {
    const ss = cur.stemSipsin + cur.branchSipsin
    if (/正官|正印|정관|정인/.test(ss) && job.tags.includes('power')) s += 6
    if (/正財|偏財|정재|편재/.test(ss) && job.tags.includes('wealth')) s += 6
    if (/食神|傷官|식신|상관/.test(ss) && job.tags.includes('output')) s += 6
  }

  if (job.tags.includes('self') && stats.sipsinCount.self >= 3) s += 5
  if (job.tags.includes('power') && stats.sipsinCount.self >= 3) s -= 4

  return clamp(s)
}

function workStyle(stats, meta) {
  const dom = dominantSipsin(stats)
  const styles = {
    power: '조직 내 책임·승진·안정 루트',
    wealth: '성과·매출·실무 중심',
    output: '기술·표현·프로젝트 중심',
    resource: '자격·연구·전문성 축적',
    self: '독립·창업·프리랜스',
  }
  return `${meta.dayElementKo} 일간 + ${TYPE_LABELS[dom].split('—')[0].trim()} → ${styles[dom]}`
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function analyzeCareer(chart) {
  const { stats, meta, daewoon } = chart
  const dom = dominantSipsin(stats)

  let score = 44
  score += stats.sipsinCount.power * 6
  score += stats.sipsinCount.output * 7
  score += stats.sipsinCount.wealth * 6
  score += stats.sipsinCount.resource * 7
  score -= stats.sipsinCount.self >= 3 ? 6 : 0
  if (daewoon.current && /正官|食神|正財|정관|식신|정재/.test(`${daewoon.current.stemSipsin}${daewoon.current.branchSipsin}`)) {
    score += 8
  }
  score = clamp(score)

  const ranked = JOB_POOL.map((job) => ({
    ...job,
    match: scoreJob(job, chart),
    level: scoreLevel(scoreJob(job, chart)),
  }))
    .sort((a, b) => b.match - a.match)

  const top = ranked.slice(0, 6)
  const caution = ranked.slice(-3).reverse()

  const monthPillar = chart.saju.pillars[2]
  const monthHint = monthPillar
    ? `월주 ${monthPillar.pillar.ganzi}(${monthPillar.stemSipsin}) — 사회·직업 성향의 바탕`
    : ''

  return {
    score,
    level: scoreLevel(score),
    headline: score >= 58 ? '직업 적성 뚜렷' : '다면적 적성',
    summary: `${TYPE_LABELS[dom]}. ${workStyle(stats, meta)}. 현재 대운 ${daewoon.current?.ganzi || '—'}과 맞는 분야를 우선 검토하세요.`,
    details: [
      { k: '핵심 직업 유형', v: TYPE_LABELS[dom] },
      { k: '일하는 스타일', v: workStyle(stats, meta) },
      { k: '월주 직업 힌트', v: monthHint || '—' },
      { k: '현재 대운', v: daewoon.current ? `${daewoon.current.ganzi} (${daewoon.current.stemSipsin})` : '—' },
    ],
    tips: [
      `1순위 추천: ${top[0]?.title || '—'}`,
      stats.sipsinCount.self >= 2 ? '동업·지인 사업보다 역할·계약을 명확히.' : '자격·포트폴리오를 꾸준히 쌓으세요.',
      '직업 선택은 사주+적성+시장을 함께 보세요.',
    ],
    jobs: top,
    caution: caution.map((j) => ({ title: j.title, reason: '결이 덜 맞을 수 있음 — ' + j.reason.split('—')[1]?.trim() })),
    dominantType: dom,
  }
}
