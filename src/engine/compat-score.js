import { ELEMENT_KO, scoreLevel } from './calculator.js'
import { analyzeLove, analyzeWealth } from './fortune.js'
import { analyzeCareer } from './career.js'

const SHENG = { tree: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'tree' }
const KE = { tree: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'tree' }

function clamp(n) {
  return Math.max(12, Math.min(96, Math.round(n)))
}

function elementHarmony(a, b) {
  if (a === b) return 8
  if (SHENG[a] === b || SHENG[b] === a) return 18
  if (KE[a] === b || KE[b] === a) return -8
  return 4
}

function distScore(ca, cb) {
  const keys = ['tree', 'fire', 'earth', 'metal', 'water']
  let dot = 0
  let na = 0
  let nb = 0
  for (const k of keys) {
    const x = ca[k] || 0
    const y = cb[k] || 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  const sim = dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
  return clamp(40 + sim * 50)
}

export function analyzeCompatibility(me, you) {
  const loveA = analyzeLove(me)
  const loveB = analyzeLove(you)
  const wealthA = analyzeWealth(me)
  const wealthB = analyzeWealth(you)
  const jobA = analyzeCareer(me)
  const jobB = analyzeCareer(you)
  const el = elementHarmony(me.meta.dayElement, you.meta.dayElement)

  const emotion = clamp((loveA.score + loveB.score) / 2 + el / 2)
  const personality = distScore(me.stats.elementCount, you.stats.elementCount)
  const fortune = clamp((jobA.score + jobB.score) / 2 + (me.daewoon.current && you.daewoon.current ? 6 : 0))
  const wealth = clamp(70 - Math.abs(wealthA.score - wealthB.score) * 0.7 + Math.min(wealthA.score, wealthB.score) * 0.15)
  const marriage = clamp((emotion + fortune) / 2 + (loveA.score >= 50 && loveB.score >= 50 ? 8 : 0))
  const avg = Math.round((emotion + personality + fortune + wealth + marriage) / 5)

  const cats = [
    { id: 'emotion', title: '감정 궁합', score: emotion, text: emotion >= 70 ? '마음이 잘 통하는 편입니다' : emotion >= 50 ? '온도 차이만 조율하면 됩니다' : '표현 방식을 먼저 맞추세요' },
    { id: 'personality', title: '성격 궁합', score: personality, text: personality >= 70 ? '생활 결이 비슷한 편입니다' : personality >= 50 ? '다르면서도 균형이 있습니다' : '루틴·속도 합의가 필요합니다' },
    { id: 'fortune', title: '운세 궁합', score: fortune, text: fortune >= 70 ? '흐름이 비슷한 시기를 지납니다' : fortune >= 50 ? '한 사람이 바쁠 때 다른 사람이 버팁니다' : '일정 충돌이 잦을 수 있습니다' },
    { id: 'wealth', title: '재물운 궁합', score: wealth, text: wealth >= 70 ? '돈 감각이 잘 맞습니다' : wealth >= 50 ? '가치관 차이를 숫자로 나누세요' : '지출·저축 규칙을 문서로' },
    { id: 'marriage', title: '결혼운 궁합', score: marriage, text: marriage >= 70 ? '함께 가는 힘이 있습니다' : marriage >= 50 ? '속도만 맞추면 됩니다' : '결혼은 명리보다 합의가 먼저입니다' },
  ].map((c) => ({ ...c, level: scoreLevel(c.score) }))

  const cautions = [
    me.meta.dayElement === you.meta.dayElement ? '같은 오행이라 장점도 약점도 겹칩니다.' : '서로 다른 오행 — 번역(설명)이 필요합니다.',
    Math.abs(wealthA.score - wealthB.score) > 18 ? '돈 이야기에서 자존심 싸움이 나기 쉽습니다.' : '재정은 공동 장부가 갈등을 줄입니다.',
    KE[me.meta.dayElement] === you.meta.dayElement || KE[you.meta.dayElement] === me.meta.dayElement
      ? '상극 일간 — 잔소리가 사랑이 되지 않게 요청만 말하세요.'
      : '상생이든 중립이든 존중이 먼저입니다.',
    '폭력·통제는 궁합으로 정당화할 수 없습니다.',
  ]

  const tips = [
    '주 1회 일정·돈·감정을 15분만 이야기하세요.',
    '상대 사주는 동의 없이 공유하지 마세요.',
    `일간 ${ELEMENT_KO[me.meta.dayElement]} × ${ELEMENT_KO[you.meta.dayElement]} — 서로를 고치기보다 역할을 나누세요.`,
  ]

  const nextDw = me.daewoon.future[0]
  const marriageHint = nextDw
    ? `${nextDw.age}세 전후(${nextDw.ganzi})가 관계의 숙제를 키우는 구간일 수 있습니다. 결혼 시기를 예언하지 않습니다.`
    : '대운 전환 전후 1년은 큰 약속을 급하게 하지 마세요.'

  let detail = `${me.meta.dayElementKo} 일간과 ${you.meta.dayElementKo} 일간의 합입니다. 총점 ${avg}점은 합격선이 아니라 숙제의 지도입니다. 감정 ${emotion}·성격 ${personality}·운세 ${fortune}·재물 ${wealth}·결혼 ${marriage}. `
  detail += cautions.join(' ')
  detail += ' 잘 맞는 항목은 자만의 재료가 되고, 낮은 항목은 대화 주제가 됩니다. 동업이라면 지분과 현금흐름을 문서화하세요. '
  while (detail.length < 520) detail += '결과는 참고·오락용이며 이별·결혼을 결정하는 근거가 아닙니다. '

  return {
    avg,
    level: scoreLevel(avg),
    cats,
    cautions,
    tips,
    marriageHint,
    detail,
    labels: {
      me: `${me.meta.dayStem} ${me.meta.dayElementKo}`,
      you: `${you.meta.dayStem} ${you.meta.dayElementKo}`,
    },
  }
}
