/**
 * 심층 명리 엔진 (深層 命理)
 *
 * @orrery/core 의 원천 데이터(사주 4주 · 대운)를 받아
 * 실제 해석에 쓰는 판단값을 계산한다.
 *
 *  - 지장간 3층(여기/중기/본기) 분해와 십신 라벨
 *  - 신강/신약 점수 (득령 + 득지(통근) + 득세) 및 근거 분해
 *  - 억부 용신 / 기신, 조후 보정, 두 처방의 충돌 여부
 *  - 격국 (월지 투간 우선, 잡기 폴백)
 *  - 외격(종격) 후보 판정
 *  - 합/충/형/파/해/원진 상호작용
 *  - 12운성 테이블, 공망(일주·년주), 주요 신살
 *  - 위 결과가 확정적인지(모호성) 자기 진단
 */

import {
  BAEKHO_PILLARS,
  BRANCH_BREAKS,
  BRANCH_CLASHES,
  BRANCH_COMBINES_6,
  BRANCH_HARMS,
  BRANCH_PUNISHMENTS,
  BRANCH_SELF_PUNISHMENTS,
  DIRECTIONAL_COMPOSES,
  DIRECTIONAL_COMPOSE_ELEMENTS,
  EARTH,
  EARTH_KR,
  GOEGANG_PILLARS,
  HALF_COMPOSES,
  HGANJI,
  JIJANGGAN,
  METEORS_12,
  METEOR_LOOKUP,
  SKY,
  SKY_KR,
  STEM_CLASHES,
  STEM_COMBINES,
  STEM_INFO,
  TRIPLE_COMPOSES,
  TRIPLE_COMPOSE_ELEMENTS,
} from '@orrery/core/constants'

// ── 설치된 @orrery/core 0.1.0 에 없는 표는 여기서 보완한다 ────────────────

/** 순중공망(旬中空亡) — 인덱스 = trunc(60갑자 인덱스 / 10) */
const GONGMANG_TABLE = [
  ['戌', '亥'], ['申', '酉'], ['午', '未'], ['辰', '巳'], ['寅', '卯'], ['子', '丑'],
]
/** 원진(怨嗔) */
const WONJIN_PAIRS = ['子,未', '丑,午', '寅,酉', '卯,申', '辰,亥', '巳,戌']
/** 귀문관살(鬼門關殺) */
const GWIMUN_PAIRS = ['子,酉', '丑,午', '寅,未', '卯,申', '辰,亥', '巳,戌']
/** 천을귀인 — 일간 기준 */
const CHEONUL_MAP = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '辛': ['午', '寅'],
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],
}
/** 도화살 — 지지 삼합 기준 */
const DOHWA_MAP = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '申': '酉', '子': '酉', '辰': '酉',
  '巳': '午', '酉': '午', '丑': '午',
  '亥': '子', '卯': '子', '未': '子',
}
/** 문창귀인 — 일간 기준 */
const MUNCHANG_MAP = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
}
/** 역마 — 지지 삼합 기준 */
const YEOKMA_MAP = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳',
}
/** 홍염살 — 일주 기준 */
const HONGYEOM_PILLARS = new Set(['甲午', '丙寅', '丁未', '戊辰', '庚戌', '辛酉', '壬子'])

// ── 오행 기초 ─────────────────────────────────────────────────────────────

const ELEMENTS = ['tree', 'fire', 'earth', 'metal', 'water']
const ELEMENT_KO = { tree: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)' }
/** 상생 (生) */
const GENERATES = { tree: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'tree' }
/** 상극 (剋) */
const OVERCOMES = { tree: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'tree' }

const generatedBy = (el) => ELEMENTS.find((e) => GENERATES[e] === el)
const overcomeBy = (el) => ELEMENTS.find((e) => OVERCOMES[e] === el)

/** 십신 카테고리 — 일간 오행 기준 */
function tenGodCategory(dayElement, element) {
  if (element === dayElement) return 'self'                  // 비겁
  if (GENERATES[element] === dayElement) return 'resource'   // 인성
  if (GENERATES[dayElement] === element) return 'output'     // 식상
  if (OVERCOMES[dayElement] === element) return 'wealth'     // 재성
  return 'power'                                             // 관성
}

const CATEGORY_KO = {
  self: '비겁(比劫)', resource: '인성(印星)', output: '식상(食傷)',
  wealth: '재성(財星)', power: '관성(官星)',
}

/** 일간을 돕는 카테고리(생조) 여부 */
const isSupport = (cat) => cat === 'self' || cat === 'resource'

/** 십신 한글 이름 — 음양 동일 여부까지 반영 */
function tenGodName(dayStem, stem) {
  const day = STEM_INFO[dayStem]
  const other = STEM_INFO[stem]
  if (!day || !other) return ''
  const cat = tenGodCategory(day.element, other.element)
  const same = day.yinyang === other.yinyang
  if (cat === 'self') return same ? '비견' : '겁재'
  if (cat === 'resource') return same ? '편인' : '정인'
  if (cat === 'output') return same ? '식신' : '상관'
  if (cat === 'wealth') return same ? '편재' : '정재'
  return same ? '칠살' : '정관'
}

// ── 한자 ↔ 한글 ───────────────────────────────────────────────────────────

const stemKo = (s) => SKY_KR[SKY.indexOf(s)] || s
const branchKo = (b) => EARTH_KR[EARTH.indexOf(b)] || b
const ganziKo = (g) => (g && g.length === 2 ? stemKo(g[0]) + branchKo(g[1]) : g)

/** 지장간 문자열('乙癸戊')을 여기/중기/본기로 분해. 왕지는 중기가 비어 있다. */
function splitJijanggan(branch) {
  const raw = (JIJANGGAN[branch] || '').split('')
  const [yeogi, junggi, bongi] = raw
  const keep = (c) => (c && c !== ' ' ? c : null)
  return { yeogi: keep(yeogi), junggi: keep(junggi), bongi: keep(bongi) }
}

/** 12운성 (일간 → 임의 지지) */
function unseongOf(dayStem, branch) {
  const idx = METEOR_LOOKUP[stemKo(dayStem) + branchKo(branch)]
  return idx == null ? '' : METEORS_12[idx].hangul
}

/** 정렬 무관 지지 쌍 조회 */
function pairLookup(table, a, b) {
  const hit = table[a + ',' + b]
  return hit === undefined ? table[b + ',' + a] : hit
}
function pairInList(list, a, b) {
  return list.includes(a + ',' + b) || list.includes(b + ',' + a)
}

// ── 통근/신강약 계산 상수 ─────────────────────────────────────────────────

/** 지장간 층별 통근 가중치 */
const LAYER_WEIGHT = { bongi: 10, junggi: 6, yeogi: 3 }
const LAYER_KO = { yeogi: '여기', junggi: '중기', bongi: '본기' }
/** 한 주(柱)에서 얻을 수 있는 통근 점수 상한 — 한 지지가 과대평가되지 않게 막는다 */
const ROOT_CAP = 12
/** 월지 본기가 일간을 생조할 때의 득령 점수 */
const DEUKRYEONG_FULL = 30
/** 월지 본기는 아니지만 중기·여기가 생조할 때 */
const DEUKRYEONG_PARTIAL = 12
/** 년·월·시 천간 하나가 일간을 생조할 때의 득세 점수 */
const SE_PER_STEM = 4
/** 신강/신약 분기 점수 */
const STRENGTH_THRESHOLD = 15

/** pillars 배열은 [시, 일, 월, 년] 순서다 */
const PILLAR_KO = ['시', '일', '월', '년']

/**
 * 심층 분석 진입점.
 * @param {import('@orrery/core/types').SajuResult} saju calculateSaju 결과
 */
export function analyzeDeep(saju) {
  const p = saju.pillars
  const day = p[1], month = p[2], year = p[3]
  const dayStem = day.pillar.stem
  const dayElement = STEM_INFO[dayStem]?.element || 'earth'

  const elementSpread = buildElementSpread(p)
  const strength = buildStrength(p, dayStem, dayElement)
  const yongsin = buildYongsin({ strength, dayElement, elementSpread, monthBranch: month.pillar.branch })
  const gyeokguk = buildGyeokguk(p, dayStem)
  const outer = buildOuterPattern({ strength, elementSpread, dayElement })
  const ambiguity = buildAmbiguity({ strength, yongsin, outer })

  return {
    pillars: buildPillars(p, dayStem),
    interactions: buildInteractions(p),
    unseong: p.map((d, i) => ({
      pillar: PILLAR_KO[i] + '주',
      branch: branchKo(d.pillar.branch),
      stage: unseongOf(dayStem, d.pillar.branch),
      jijanggan: koLayers(splitJijanggan(d.pillar.branch)),
    })),
    unseongTable: buildUnseongTable(dayStem),
    gongmang: {
      day: gongmangOf(day.pillar.ganzi, 'day'),
      year: gongmangOf(year.pillar.ganzi, 'year'),
      hitPillars: gongmangHits(p, day.pillar.ganzi),
    },
    shinsal: buildShinsal(p, dayStem),
    elementSpread,
    dayMaster: {
      stem: stemKo(dayStem),
      element: dayElement,
      elementKo: ELEMENT_KO[dayElement],
      ...strength,
      yongsin: yongsin.yongsin,
      yongsinKo: ELEMENT_KO[yongsin.yongsin],
      gisin: yongsin.gisin,
      gisinKo: ELEMENT_KO[yongsin.gisin],
      yongsinReason: yongsin.reasons,
      johuNote: yongsin.johuNote,
      johuElement: yongsin.johuElement,
      gyeokguk: gyeokguk.name,
      gyeokgukStatus: gyeokguk.status,
      gyeokgukReason: gyeokguk.reasons,
      outerPatternStatus: outer.status,
      outerPatternName: outer.name,
      outerPatternReason: outer.reasons,
      ambiguity,
    },
    // 하위 모듈(life-wave · 서술)이 같은 계산을 반복하지 않도록 미리 꺼내 둔다
    context: {
      dayStem,
      dayElement,
      yongsin: yongsin.yongsin,
      gisin: yongsin.gisin,
      johuElement: yongsin.johuElement,
      isStrong: strength.strength === 'strong',
      natalBranches: p.map((d) => d.pillar.branch),
      natalStems: p.map((d) => d.pillar.stem),
    },
  }
}

// ── 4주 상세 ──────────────────────────────────────────────────────────────

function koLayers(layers) {
  return {
    yeogi: layers.yeogi ? stemKo(layers.yeogi) : null,
    junggi: layers.junggi ? stemKo(layers.junggi) : null,
    bongi: layers.bongi ? stemKo(layers.bongi) : null,
  }
}

function buildPillars(p, dayStem) {
  const names = ['hour', 'day', 'month', 'year']
  const labels = ['시주', '일주', '월주', '년주']
  // 년 → 월 → 일 → 시 순서로 되돌려 사람이 읽는 순서와 맞춘다
  return [3, 2, 1, 0].map((i) => {
    const d = p[i]
    const branch = d.pillar.branch
    const layers = splitJijanggan(branch)
    return {
      pillar: names[i],
      label: labels[i],
      ganzi: ganziKo(d.pillar.ganzi),
      ganziHanja: d.pillar.ganzi,
      stem: stemKo(d.pillar.stem),
      branch: branchKo(branch),
      stemTenGod: i === 1 ? 'day_master' : tenGodName(dayStem, d.pillar.stem),
      branchTenGod: layers.bongi ? tenGodName(dayStem, layers.bongi) : '',
      jijanggan: [layers.yeogi, layers.junggi, layers.bongi].filter(Boolean).map(stemKo),
      jijangganLayers: koLayers(layers),
      unseong: unseongOf(dayStem, branch),
      sinsal: d.sinsal,
    }
  })
}

// ── 오행 분포 (천간 10, 지장간은 층 가중치) ───────────────────────────────

function buildElementSpread(p) {
  const raw = { tree: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const d of p) {
    const stemEl = STEM_INFO[d.pillar.stem]?.element
    if (stemEl) raw[stemEl] += 10
    const layers = splitJijanggan(d.pillar.branch)
    for (const layer of ['yeogi', 'junggi', 'bongi']) {
      const stem = layers[layer]
      if (!stem) continue
      const el = STEM_INFO[stem]?.element
      if (el) raw[el] += LAYER_WEIGHT[layer]
    }
  }
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1
  const scaled = {}
  const percent = {}
  for (const el of ELEMENTS) {
    scaled[el] = Math.round(raw[el] / 10 * 10) / 10   // "글자 수" 감각의 스케일
    percent[el] = Math.round(raw[el] / total * 1000) / 10
  }
  const sorted = [...ELEMENTS].sort((a, b) => raw[b] - raw[a])
  return { raw, scaled, percent, strongest: sorted[0], weakest: sorted[sorted.length - 1], sorted }
}

// ── 신강약 ────────────────────────────────────────────────────────────────

function buildStrength(p, dayStem, dayElement) {
  // 득령 — 월지가 일간을 돕는가
  const monthBranch = p[2].pillar.branch
  const monthLayers = splitJijanggan(monthBranch)
  let deukryeong = 0
  let deukryeongNote = ''
  const bongiEl = monthLayers.bongi ? STEM_INFO[monthLayers.bongi]?.element : null
  if (bongiEl && isSupport(tenGodCategory(dayElement, bongiEl))) {
    deukryeong = DEUKRYEONG_FULL
    const how = tenGodCategory(dayElement, bongiEl) === 'self' ? '방조' : '생조'
    deukryeongNote = `득령: 월지 ${branchKo(monthBranch)} 본기 ${stemKo(monthLayers.bongi)}가 일간을 ${how}`
  } else {
    const helper = [monthLayers.junggi, monthLayers.yeogi].find((s) => {
      const el = s ? STEM_INFO[s]?.element : null
      return el && isSupport(tenGodCategory(dayElement, el))
    })
    if (helper) {
      deukryeong = DEUKRYEONG_PARTIAL
      deukryeongNote = `부분 득령: 월지 ${branchKo(monthBranch)}의 지장간 ${stemKo(helper)}만 일간을 돕습니다`
    } else {
      deukryeongNote = `실령: 월지 ${branchKo(monthBranch)}가 일간을 돕지 않습니다`
    }
  }

  // 득지 — 월지를 뺀 나머지 지지에서의 통근
  const rootDetail = []
  let deukji = 0
  for (const i of [3, 1, 0]) {          // 년, 일, 시
    const branch = p[i].pillar.branch
    const layers = splitJijanggan(branch)
    const layerRows = []
    let sum = 0
    for (const layer of ['bongi', 'junggi', 'yeogi']) {
      const stem = layers[layer]
      if (!stem) continue
      const el = STEM_INFO[stem]?.element
      const cat = el ? tenGodCategory(dayElement, el) : null
      const support = cat ? isSupport(cat) : false
      const weight = support ? LAYER_WEIGHT[layer] : 0
      sum += weight
      layerRows.push({ layer, layerKo: LAYER_KO[layer], stem: stemKo(stem), weight, role: support ? 'support' : 'drain' })
    }
    const capped = Math.min(sum, ROOT_CAP)
    if (capped > 0) {
      deukji += capped
      rootDetail.push({
        pillar: PILLAR_KO[i], branch: branchKo(branch),
        score: capped, capped: sum > ROOT_CAP, layers: layerRows,
      })
    }
  }

  // 득세 — 일간을 뺀 천간이 일간 편인가
  let deukse = 0
  const seDetail = []
  for (const i of [3, 2, 0]) {          // 년, 월, 시
    const stem = p[i].pillar.stem
    const el = STEM_INFO[stem]?.element
    if (!el) continue
    if (isSupport(tenGodCategory(dayElement, el))) {
      deukse += SE_PER_STEM
      seDetail.push(`${PILLAR_KO[i]}간 ${stemKo(stem)}(${tenGodName(dayStem, stem)})`)
    }
  }

  const score = deukryeong + deukji + deukse
  const margin = score - STRENGTH_THRESHOLD
  const strength = margin >= 0 ? 'strong' : 'weak'
  const band = Math.abs(margin) >= 20 ? `firm_${strength}`
    : Math.abs(margin) >= 8 ? `moderate_${strength}`
    : 'near_neutral'

  return {
    strength,
    strengthKo: strength === 'strong' ? '신강' : '신약',
    strengthScore: score,
    strengthThreshold: STRENGTH_THRESHOLD,
    strengthMargin: margin,
    strengthBand: band,
    breakdown: { deukryeong, deukryeongNote, deukji, rootDetail, deukse, seDetail },
    breakdownText: [
      `신강약 점수 ${score} = 득령 ${deukryeong} + 득지 ${deukji}(통근 가중) + 득세 ${deukse} · 임계 ${STRENGTH_THRESHOLD}`,
      deukryeongNote,
      rootDetail.length
        ? `통근 상세: ${rootDetail.map((r) => `${r.pillar}${r.branch} +${r.score}${r.capped ? '(상한)' : ''}`).join(' · ')}`
        : '통근 없음 — 지지에 뿌리가 약합니다',
      seDetail.length ? `득세: ${seDetail.join(' · ')}` : '득세 없음 — 주변 천간의 지원이 없습니다',
    ],
  }
}

// ── 용신 / 기신 / 조후 ────────────────────────────────────────────────────

const SEASON_BY_BRANCH = {
  '寅': 'spring', '卯': 'spring', '辰': 'spring',
  '巳': 'summer', '午': 'summer', '未': 'summer',
  '申': 'autumn', '酉': 'autumn', '戌': 'autumn',
  '亥': 'winter', '子': 'winter', '丑': 'winter',
}
const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }

function buildYongsin({ strength, dayElement, elementSpread, monthBranch }) {
  const strong = strength.strength === 'strong'
  // 신강이면 설기·극제(식상·재성·관성), 신약이면 생조(인성·비겁)를 후보로 둔다
  const cats = strong ? ['output', 'wealth', 'power'] : ['resource', 'self']
  const elementForCat = {
    output: GENERATES[dayElement],
    wealth: OVERCOMES[dayElement],
    power: overcomeBy(dayElement),
    resource: generatedBy(dayElement),
    self: dayElement,
  }
  const candidates = cats.map((cat) => ({
    cat, element: elementForCat[cat], weight: elementSpread.raw[elementForCat[cat]],
  }))

  // 신강: 가장 희소한 오행을 끌어와 균형을 잡는다 / 신약: 가장 든든한 생조를 쓴다
  const sorted = [...candidates].sort((a, b) => (strong ? a.weight - b.weight : b.weight - a.weight))
  const pick = sorted[0]
  const runnerUp = sorted[1]
  const gap = runnerUp ? Math.abs(pick.weight - runnerUp.weight) : 99
  const nearTie = gap <= 4

  // 조후 — 억부와 별개로 계절의 한난조습을 본다
  const season = SEASON_BY_BRANCH[monthBranch] || 'spring'
  const cold = elementSpread.raw.water + elementSpread.raw.metal
  const hot = elementSpread.raw.fire + elementSpread.raw.tree
  let johuElement = null
  let johuNote = ''
  if (season === 'winter' || (season === 'spring' && cold >= hot)) {
    johuElement = 'fire'
    johuNote = `조후: ${SEASON_KO[season]}생인데 한습(수·금 ${cold} ≥ 화·목 ${hot})해서 화(火)로 데워 주는 편이 이롭습니다`
  } else if (season === 'summer' || (season === 'autumn' && hot > cold)) {
    johuElement = 'water'
    johuNote = `조후: ${SEASON_KO[season]}생인데 조열(화·목 ${hot} > 수·금 ${cold})해서 수(水)로 식혀 주는 편이 이롭습니다`
  } else {
    johuNote = `조후: ${SEASON_KO[season]}생이고 한난이 크게 치우치지 않아 억부 처방을 그대로 씁니다`
  }
  const johuConflict = !!johuElement && johuElement !== pick.element

  const gisin = overcomeBy(pick.element)

  const reasons = [
    `억부법: ${strong ? '신강' : '신약'}이라 ${cats.map((c) => CATEGORY_KO[c]).join('·')} 중 분포가 가장 ${strong ? '약한' : '든든한'} 오행을 용신으로 잡습니다`,
    `용신 후보: ${candidates.map((c) => `${ELEMENT_KO[c.element]} ${Math.round(c.weight / 10 * 10) / 10}`).join(' · ')} → 선정 ${ELEMENT_KO[pick.element]}`,
    ...strength.breakdownText,
    johuNote + (johuConflict ? ` (억부 용신 ${ELEMENT_KO[pick.element]}과 처방이 다릅니다)` : ''),
    `기신: ${ELEMENT_KO[gisin]} — 용신 ${ELEMENT_KO[pick.element]}을 극하는 오행`,
  ]

  return {
    yongsin: pick.element,
    gisin,
    candidates: candidates.map((c) => c.element),
    nearTie,
    johuElement,
    johuNote,
    johuConflict,
    reasons,
  }
}

// ── 격국 ──────────────────────────────────────────────────────────────────

/** 잡기(雜氣) — 진술축미 */
const JAPGI = new Set(['辰', '戌', '丑', '未'])
/** 왕지(旺支) — 자오묘유 */
const WANGJI = new Set(['子', '午', '卯', '酉'])

function buildGyeokguk(p, dayStem) {
  const monthBranch = p[2].pillar.branch
  const layers = splitJijanggan(monthBranch)
  const outerStems = [p[3].pillar.stem, p[2].pillar.stem, p[0].pillar.stem]  // 년·월·시 천간
  const reasons = []

  // 왕지는 본기 하나로만 격을 세운다
  const order = WANGJI.has(monthBranch) ? ['bongi'] : ['bongi', 'junggi', 'yeogi']

  for (const layer of order) {
    const stem = layers[layer]
    if (!stem || !outerStems.includes(stem)) continue
    const name = gyeokNameFor(dayStem, stem, monthBranch)
    reasons.push(`월지 ${branchKo(monthBranch)}의 ${LAYER_KO[layer]} ${stemKo(stem)}가 천간에 투간 → ${name}`)
    // 잡기월의 본기 아닌 투간은 격이 다소 무릅니다
    const soft = JAPGI.has(monthBranch) && layer !== 'bongi'
    if (soft) reasons.push(`다만 잡기월(${branchKo(monthBranch)})의 ${LAYER_KO[layer]} 투간이라 격의 힘은 본기 투간보다 약합니다`)
    return { name, status: 'confirmed', soft, reasons }
  }

  // 투간이 없으면 본기 십신으로 임시 판정한다
  const fallbackStem = layers.bongi || layers.junggi || layers.yeogi
  const name = gyeokNameFor(dayStem, fallbackStem, monthBranch)
  const hidden = [layers.yeogi, layers.junggi, layers.bongi].filter(Boolean).map(stemKo).join('·')
  reasons.push(
    `월지 ${branchKo(monthBranch)}의 지장간 ${hidden}이 모두 미투간`,
    `${JAPGI.has(monthBranch) ? '잡기 폴백' : '본기 기준'}으로 ${name} 임시 판정 — 대운 투간에 따라 바뀔 수 있습니다`,
  )
  return { name, status: 'provisional', reasons }
}

function gyeokNameFor(dayStem, stem, monthBranch) {
  if (!stem) return '판정 불가'
  const tg = tenGodName(dayStem, stem)
  // 비견/겁재는 격으로 세우지 않고 건록·양인으로 부른다
  if (tg === '비견') return '건록격'
  if (tg === '겁재') return WANGJI.has(monthBranch) ? '양인격' : '월겁격'
  return tg + '격'
}

// ── 외격(종격) 후보 ───────────────────────────────────────────────────────

function buildOuterPattern({ strength, elementSpread, dayElement }) {
  const support = elementSpread.raw[dayElement] + elementSpread.raw[generatedBy(dayElement)]
  const drains = {
    '종아격': elementSpread.raw[GENERATES[dayElement]],
    '종재격': elementSpread.raw[OVERCOMES[dayElement]],
    '종살격': elementSpread.raw[overcomeBy(dayElement)],
  }
  const ranked = Object.entries(drains).sort((a, b) => b[1] - a[1])
  const [topName, topWeight] = ranked[0]
  const secondWeight = ranked[1][1]
  const s1 = (n) => Math.round(n / 10 * 10) / 10

  const reasons = [
    `외격 검토: 생조(인성·비겁) ${s1(support)} · 편왕 후보 ${topName} ${s1(topWeight)}(2위 ${s1(secondWeight)}) · 강약점수 ${strength.strengthScore}`,
  ]

  // 종격은 일간이 뿌리를 거의 잃고 한쪽 기운이 압도할 때만 성립한다
  const rootless = strength.strengthScore <= 8
  const dominant = topWeight >= support * 2.5 && topWeight > secondWeight * 1.5
  if (rootless && dominant) {
    reasons.push(`일간이 뿌리를 잃고 ${topName} 기운이 압도 → 외격 성립`)
    return { status: 'candidate', name: topName, reasons }
  }
  reasons.push(rootless
    ? '일간은 약하지만 한쪽으로 완전히 쏠리지 않아 정격으로 봅니다'
    : '일간이 뿌리를 유지하고 있어 정격으로 봅니다')
  return { status: 'none', name: null, reasons }
}

// ── 모호성 자기 진단 ──────────────────────────────────────────────────────

function buildAmbiguity({ strength, yongsin, outer }) {
  const nearNeutral = strength.strengthBand === 'near_neutral'
  const outerCandidate = outer.status === 'candidate'
  const isAmbiguous = nearNeutral || yongsin.nearTie || yongsin.johuConflict || outerCandidate

  const hints = []
  if (nearNeutral) hints.push('신강·신약이 임계선에 붙어 있어요.')
  if (yongsin.nearTie) hints.push('용신 후보 둘의 무게가 거의 같아요.')
  if (yongsin.johuConflict) hints.push('계절 균형(조후)과 억부 처방이 서로 달라요.')
  if (outerCandidate) hints.push('정격과 외격 어느 쪽으로도 읽힐 수 있어요.')

  return {
    isAmbiguous,
    strengthBand: strength.strengthBand,
    strengthMargin: strength.strengthMargin,
    yongsinCandidates: yongsin.candidates,
    yongsinNearTie: yongsin.nearTie,
    johuConflict: yongsin.johuConflict,
    outerCandidate,
    plainHint: isAmbiguous
      ? `이 사주는 한쪽으로 확정하기 어려운 면이 있어요. ${hints.join(' ')} 생활 습관·성격 발현은 A/B 두 패턴으로 대조해 읽는 게 맞아요.`
      : '판단 근거가 한 방향으로 모여서 해석이 비교적 확정적입니다.',
  }
}

// ── 상호작용 (합·충·형·파·해·원진) ────────────────────────────────────────

export function buildInteractions(p) {
  const out = []
  const branches = p.map((d) => d.pillar.branch)
  const stems = p.map((d) => d.pillar.stem)

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const a = branches[i], b = branches[j]
      const where = `${PILLAR_KO[i]}·${PILLAR_KO[j]}`

      const combo6 = pairLookup(BRANCH_COMBINES_6, a, b)
      if (combo6) out.push(mk('육합', a, b, where, `${ELEMENT_KO[combo6[1]]}으로 합 — 묶이고 안정됨`, 'good'))
      const half = pairLookup(HALF_COMPOSES, a, b)
      if (half) out.push(mk('반합', a, b, where, `${ELEMENT_KO[half[1]]} 반합 — 기운이 한쪽으로 모임`, 'good'))
      if (pairLookup(BRANCH_CLASHES, a, b)) out.push(mk('충', a, b, where, '충돌·이동·변동', 'stress'))
      const pun = pairLookup(BRANCH_PUNISHMENTS, a, b)
      if (pun) out.push(mk('형', a, b, where, `${pun[1]}의 형 — 마찰·구설·수술`, 'stress'))
      if (pairLookup(BRANCH_BREAKS, a, b)) out.push(mk('파', a, b, where, '깨짐·중단', 'stress'))
      if (pairLookup(BRANCH_HARMS, a, b)) out.push(mk('해', a, b, where, '해코지·소모', 'stress'))
      if (pairInList(WONJIN_PAIRS, a, b)) out.push(mk('원진', a, b, where, '까닭 없는 미움·거리감', 'stress'))
      if (pairInList(GWIMUN_PAIRS, a, b)) out.push(mk('귀문', a, b, where, '예민·집착·불면', 'stress'))

      const sc = pairLookup(STEM_COMBINES, stems[i], stems[j])
      if (sc) out.push(mk('천간합', stems[i], stems[j], where, `${ELEMENT_KO[sc[1]]}으로 합`, 'good', true))
      if (pairLookup(STEM_CLASHES, stems[i], stems[j])) out.push(mk('천간충', stems[i], stems[j], where, '뜻이 부딪힘', 'stress', true))
    }
  }

  // 자형 — 같은 글자가 겹칠 때
  const seen = {}
  for (const b of branches) seen[b] = (seen[b] || 0) + 1
  for (const [b, n] of Object.entries(seen)) {
    if (n >= 2 && BRANCH_SELF_PUNISHMENTS.has(b)) {
      out.push({ type: '자형', label: `${branchKo(b)}자형`, where: '중복', note: '스스로를 소모하는 형', tone: 'stress' })
    }
  }

  // 삼합 / 방합 — 세 글자가 모두 있을 때만
  for (const trio of TRIPLE_COMPOSES) {
    if (trio.every((b) => branches.includes(b))) {
      const el = TRIPLE_COMPOSE_ELEMENTS[trio.join(',')]
      out.push({ type: '삼합', label: trio.map(branchKo).join('') + '삼합', where: '전체', note: `${ELEMENT_KO[el]} 국(局) 형성`, tone: 'good' })
    }
  }
  for (const trio of DIRECTIONAL_COMPOSES) {
    if (trio.every((b) => branches.includes(b))) {
      const el = DIRECTIONAL_COMPOSE_ELEMENTS[trio.join(',')]
      out.push({ type: '방합', label: trio.map(branchKo).join('') + '방합', where: '전체', note: `${ELEMENT_KO[el]} 방국 형성`, tone: 'good' })
    }
  }
  return out
}

function mk(type, a, b, where, note, tone, isStem = false) {
  const ko = isStem ? stemKo : branchKo
  return { type, label: `${ko(a)}${ko(b)}${type}`, where, note, tone }
}

// ── 12운성 테이블 · 공망 · 신살 ───────────────────────────────────────────

function buildUnseongTable(dayStem) {
  const table = {}
  for (const b of EARTH) table[branchKo(b)] = unseongOf(dayStem, b)
  return table
}

function gongmangOf(ganzi, scope) {
  const idx = HGANJI.indexOf(ganzi)
  if (idx < 0) return null
  const branches = GONGMANG_TABLE[Math.trunc(idx / 10)]
  return { scope, branches: branches.map(branchKo), branchesHanja: branches }
}

function gongmangHits(p, dayGanzi) {
  const g = gongmangOf(dayGanzi, 'day')
  if (!g) return []
  return p
    .map((d, i) => ({ i, branch: d.pillar.branch }))
    .filter((x) => g.branchesHanja.includes(x.branch))
    .map((x) => `${PILLAR_KO[x.i]}주(${branchKo(x.branch)})`)
}

function buildShinsal(p, dayStem) {
  const out = []
  const branches = p.map((d) => d.pillar.branch)
  const dayBranch = p[1].pillar.branch
  const yearBranch = p[3].pillar.branch
  const dayGanzi = p[1].pillar.ganzi

  const add = (id, label, branch, basis) => out.push({ id, label, branch: branchKo(branch), basis })

  for (const b of CHEONUL_MAP[dayStem] || []) {
    const i = branches.indexOf(b)
    if (i >= 0) add('cheoneul_gwiin', '천을귀인', b, `일간 ${stemKo(dayStem)} → ${PILLAR_KO[i]}주`)
  }
  const munchang = MUNCHANG_MAP[dayStem]
  if (munchang && branches.includes(munchang)) {
    add('munchang_gwiin', '문창귀인', munchang, `일간 ${stemKo(dayStem)} → ${PILLAR_KO[branches.indexOf(munchang)]}주`)
  }
  for (const base of [dayBranch, yearBranch]) {
    const label = base === dayBranch ? '일지' : '년지'
    const dohwa = DOHWA_MAP[base]
    if (dohwa && branches.includes(dohwa)) add('dohwa', '도화살', dohwa, `${label} ${branchKo(base)} 기준`)
    const yeokma = YEOKMA_MAP[base]
    if (yeokma && branches.includes(yeokma)) add('yeokma', '역마살', yeokma, `${label} ${branchKo(base)} 기준`)
  }
  if (BAEKHO_PILLARS.has(dayGanzi)) add('baekho', '백호살', dayBranch, `일주 ${ganziKo(dayGanzi)}`)
  if (GOEGANG_PILLARS.has(dayGanzi)) add('goegang', '괴강살', dayBranch, `일주 ${ganziKo(dayGanzi)}`)
  if (HONGYEOM_PILLARS.has(dayGanzi)) add('hongyeom', '홍염살', dayBranch, `일주 ${ganziKo(dayGanzi)}`)

  // 같은 지지에 같은 살이 두 번 잡히는 경우 정리
  const uniq = new Map()
  for (const s of out) uniq.set(`${s.id}:${s.branch}`, s)
  return [...uniq.values()]
}

export {
  ELEMENT_KO,
  ELEMENTS,
  GENERATES,
  OVERCOMES,
  CATEGORY_KO,
  WONJIN_PAIRS,
  generatedBy,
  overcomeBy,
  tenGodCategory,
  tenGodName,
  stemKo,
  branchKo,
  ganziKo,
  splitJijanggan,
  unseongOf,
  pairLookup,
  pairInList,
}
