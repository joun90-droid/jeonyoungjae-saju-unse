/**
 * 자미두수 (紫微斗數) 요약
 *
 * @orrery/core 의 명반을 사이트에서 바로 쓰는 형태로 정리한다.
 *  - 12궁을 인덱스가 붙은 배열로 펴고 주성/보성/살성을 분리
 *  - 생년 사화(四化)와 유년 사화의 착지 궁
 *  - 재백궁·복덕궁 같은 관심 궁의 삼방사정(三方四正)
 *  - 화기(化忌)가 재물·복덕 궁에 떨어졌는지 여부
 */

import { LUCKY_STAR_NAMES, MAIN_STAR_NAMES, SHA_STAR_NAMES, SI_HUA_TABLE, DI_ZHI, EARTH_KR } from '@orrery/core/constants'
import { calculateLiunian, createChart, getDaxianList } from '@orrery/core/ziwei'

/** 궁 이름 — 코어의 짧은 이름 → 사이트 표기 */
const PALACE_KO = {
  '命宮': '명궁', '兄弟': '형제궁', '夫妻': '부처궁', '子女': '자녀궁',
  '財帛': '재백궁', '疾厄': '질액궁', '遷移': '천이궁', '交友': '노복궁',
  '官祿': '관록궁', '田宅': '전택궁', '福德': '복덕궁', '父母': '부모궁',
}
/** 궁이 다루는 주제 — 해석문에 그대로 쓴다 */
const PALACE_TOPIC = {
  '命宮': '타고난 기질과 인생의 기본 방향',
  '兄弟': '형제·동료·가까운 협력자',
  '夫妻': '배우자·연애·동업 관계',
  '子女': '자녀·아랫사람·창작물',
  '財帛': '돈이 들어오고 나가는 방식',
  '疾厄': '건강·체질·스트레스가 쌓이는 자리',
  '遷移': '이동·해외·바깥에서의 평판',
  '交友': '친구·인맥·사람으로 인한 득실',
  '官祿': '직업·직장·사회적 성취',
  '田宅': '집·부동산·가정 환경',
  '福德': '정신적 만족·취향·복의 그릇',
  '父母': '부모·윗사람·문서와 보증',
}
const PALACE_ORDER = Object.keys(PALACE_KO)

const SIHUA_KO = { '化祿': '화록', '化權': '화권', '化科': '화과', '化忌': '화기' }
const SIHUA_MEANING = {
  '化祿': '재물·기회가 붙는 자리',
  '化權': '권한·주도권이 생기는 자리',
  '化科': '이름·평판이 나는 자리',
  '化忌': '집착·소모·시비가 생기는 자리',
}

const branchKo = (zhi) => EARTH_KR[DI_ZHI.indexOf(zhi)] || zhi

/**
 * @param {import('@orrery/core/types').BirthInput} input
 * @param {{ year?: number }} [opts] 유년을 볼 연도 (기본: 올해)
 */
export function analyzeZiwei(input, opts = {}) {
  const chart = createChart(
    input.year, input.month, input.day,
    input.hour ?? 12, input.minute ?? 0,
    input.gender !== 'F',
    input.timezone, input.longitude,
  )

  const palaces = PALACE_ORDER.map((key, index) => {
    const p = chart.palaces[key]
    if (!p) return null
    const stars = p.stars || []
    return {
      index,
      key,
      name: PALACE_KO[key],
      topic: PALACE_TOPIC[key],
      branch: branchKo(p.zhi),
      branchHanja: p.zhi,
      stem: p.gan,
      ganzi: p.ganZhi,
      isBodyPalace: p.isShenGong,
      majorStars: stars.filter((s) => MAIN_STAR_NAMES.has(s.name)).map(starOf),
      luckyStars: stars.filter((s) => LUCKY_STAR_NAMES.has(s.name)).map(starOf),
      shaStars: stars.filter((s) => SHA_STAR_NAMES.has(s.name)).map(starOf),
      otherStars: stars
        .filter((s) => !MAIN_STAR_NAMES.has(s.name) && !LUCKY_STAR_NAMES.has(s.name) && !SHA_STAR_NAMES.has(s.name))
        .map(starOf),
      transforms: Object.fromEntries(
        stars.filter((s) => s.siHua).map((s) => [SIHUA_KO[s.siHua] || s.siHua, s.name]),
      ),
    }
  }).filter(Boolean)

  const byKey = Object.fromEntries(palaces.map((p) => [p.key, p]))
  const financeIndex = PALACE_ORDER.indexOf('財帛')
  const fortuneIndex = PALACE_ORDER.indexOf('福德')

  // 생년 사화 — 년간 기준
  const natalSihua = (SI_HUA_TABLE[chart.yearGan] || []).map((star, i) => {
    const kind = ['化祿', '化權', '化科', '化忌'][i]
    const palace = palaces.find((p) => [...p.majorStars, ...p.luckyStars, ...p.shaStars, ...p.otherStars].some((s) => s.name === star))
    return {
      star,
      transform: SIHUA_KO[kind],
      meaning: SIHUA_MEANING[kind],
      palace: palace ? palace.name : null,
      palaceIndex: palace ? palace.index : null,
    }
  })

  // 유년 사화 — 그 해 천간 기준
  const year = opts.year || new Date().getFullYear()
  let liunian = null
  try {
    liunian = calculateLiunian(chart, year)
  } catch {
    liunian = null
  }
  const transitSihua = liunian
    ? Object.entries(liunian.siHua).map(([star, kind]) => ({
        star,
        transform: SIHUA_KO[kind] || kind,
        meaning: SIHUA_MEANING[kind],
        palace: PALACE_KO[liunian.siHuaPalaces[kind]] || null,
        palaceKey: liunian.siHuaPalaces[kind] || null,
      }))
    : []

  const huaJi = natalSihua.find((s) => s.transform === '화기') || null
  const transitHuaJi = transitSihua.find((s) => s.transform === '화기') || null

  return {
    lunar: { year: chart.lunarYear, month: chart.lunarMonth, day: chart.lunarDay, isLeap: chart.isLeapMonth },
    yearGanzi: chart.yearGan + chart.yearZhi,
    mingPalaceBranch: branchKo(chart.mingGongZhi),
    bodyPalaceBranch: branchKo(chart.shenGongZhi),
    bureau: { label: chart.wuXingJu.name, number: chart.wuXingJu.number },
    palaces,
    financeIndex,
    fortuneIndex,
    financePalace: byKey['財帛'] || null,
    fortunePalace: byKey['福德'] || null,
    // 재물·복덕 궁은 삼방사정까지 같이 봐야 뜻이 산다
    financeTriad: triad(palaces, financeIndex),
    fortuneTriad: triad(palaces, fortuneIndex),
    natalSihua,
    huaJiStar: huaJi ? huaJi.star : null,
    huaJiPalace: huaJi ? huaJi.palace : null,
    huaJiInFinance: !!huaJi && huaJi.palaceIndex === financeIndex,
    huaJiInFortune: !!huaJi && huaJi.palaceIndex === fortuneIndex,
    transit: liunian && {
      year,
      ganzi: liunian.gan + liunian.zhi,
      sihua: transitSihua,
      huaJiStar: transitHuaJi ? transitHuaJi.star : null,
      huaJiPalace: transitHuaJi ? transitHuaJi.palace : null,
      huaJiInFinance: transitHuaJi ? transitHuaJi.palaceKey === '財帛' : false,
      huaJiInFortune: transitHuaJi ? transitHuaJi.palaceKey === '福德' : false,
      daxianPalace: PALACE_KO[liunian.daxianPalaceName] || liunian.daxianPalaceName,
      daxianAgeStart: liunian.daxianAgeStart,
      daxianAgeEnd: liunian.daxianAgeEnd,
    },
    daxian: safeDaxian(chart),
  }
}

function starOf(s) {
  return { name: s.name, brightness: s.brightness || '', sihua: SIHUA_KO[s.siHua] || '' }
}

/** 삼방사정 — 본궁 + 대궁(+6) + 삼합궁(+4, +8) */
function triad(palaces, index) {
  return [0, 4, 6, 8]
    .map((offset) => palaces[(index + offset) % 12])
    .filter(Boolean)
    .map((p) => ({ name: p.name, branch: p.branch, majorStars: p.majorStars.map((s) => s.name), shaStars: p.shaStars.map((s) => s.name) }))
}

function safeDaxian(chart) {
  try {
    return getDaxianList(chart).map((d) => ({ ...d, palace: PALACE_KO[d.palaceName] || d.palaceName }))
  } catch {
    return []
  }
}

export { PALACE_KO, PALACE_TOPIC, SIHUA_KO, SIHUA_MEANING }
