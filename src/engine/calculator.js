import { calculateSaju } from '@orrery/core/saju'
import { STEM_INFO } from '@orrery/core/constants'

const ELEMENT_KO = {
  tree: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

const SIPSIN_WEALTH = new Set(['正財', '偏財', '정재', '편재'])
const SIPSIN_POWER = new Set(['正官', '偏官', '정관', '편관', '七殺'])
const SIPSIN_OUTPUT = new Set(['食神', '傷官', '식신', '상관'])
const SIPSIN_SELF = new Set(['比肩', '劫財', '비견', '겁재'])
const SIPSIN_RESOURCE = new Set(['正印', '偏印', '정인', '편인'])

/** @param {import('@orrery/core/types').BirthInput} input */
export function computeChart(input) {
  const saju = calculateSaju(input)
  const dayStem = saju.pillars[1].pillar.stem
  const dayElement = STEM_INFO[dayStem]?.element || 'earth'
  const gender = input.gender
  const age = getAge(input.year, input.month, input.day)
  const daewoon = saju.daewoon || []
  const currentDw = findCurrentDaewoon(daewoon, age)
  const pastDw = daewoon.filter((d) => d.age + 9 < age).slice(-2)
  const futureDw = daewoon.filter((d) => d.age > age).slice(0, 2)

  const sipsinCount = countSipsin(saju.pillars)
  const elementCount = countElements(saju.pillars)

  return {
    saju,
    meta: {
      gender,
      age,
      dayStem,
      dayElement,
      dayElementKo: ELEMENT_KO[dayElement] || dayElement,
      pillarsLabel: ['시주', '일주', '월주', '년주'],
      currentYear: new Date().getFullYear(),
    },
    daewoon: { all: daewoon, current: currentDw, past: pastDw, future: futureDw },
    stats: { sipsinCount, elementCount },
  }
}

function getAge(y, m, d) {
  const today = new Date()
  let age = today.getFullYear() - y
  const md = (today.getMonth() + 1) * 100 + today.getDate()
  if (md < m * 100 + d) age -= 1
  return Math.max(0, age)
}

function findCurrentDaewoon(list, age) {
  if (!list?.length) return null
  let cur = list[0]
  for (const dw of list) {
    if (age >= dw.age) cur = dw
  }
  return cur
}

function countSipsin(pillars) {
  const c = { wealth: 0, power: 0, output: 0, self: 0, resource: 0, other: 0 }
  for (const p of pillars) {
    for (const s of [p.stemSipsin, p.branchSipsin]) {
      if (s === '本元' || s === '?') continue
      if (SIPSIN_WEALTH.has(s)) c.wealth++
      else if (SIPSIN_POWER.has(s)) c.power++
      else if (SIPSIN_OUTPUT.has(s)) c.output++
      else if (SIPSIN_SELF.has(s)) c.self++
      else if (SIPSIN_RESOURCE.has(s)) c.resource++
      else c.other++
    }
  }
  return c
}

function countElements(pillars) {
  const c = { tree: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const p of pillars) {
    const stemEl = STEM_INFO[p.pillar.stem]?.element
    const branchEl = branchElement(p.pillar.branch)
    if (stemEl) c[stemEl]++
    if (branchEl) c[branchEl]++
  }
  return c
}

function branchElement(branch) {
  const map = {
    '子': 'water', '丑': 'earth', '寅': 'tree', '卯': 'tree',
    '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
    '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water',
  }
  return map[branch]
}

export function scoreLevel(n) {
  if (n >= 75) return { label: '매우 좋음', cls: 'great' }
  if (n >= 58) return { label: '좋음', cls: 'good' }
  if (n >= 42) return { label: '보통', cls: 'mid' }
  if (n >= 28) return { label: '주의', cls: 'warn' }
  return { label: '약함', cls: 'low' }
}

export { ELEMENT_KO, SIPSIN_WEALTH }
