import { analyzeCareer } from './career.js'
import { ELEMENT_KO, scoreLevel } from './calculator.js'
import { analyzeLove, analyzeWealth } from './fortune.js'

function clamp(n) {
  return Math.max(8, Math.min(96, Math.round(n)))
}

function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

function rng(seed) {
  let s = seed || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

const SHORT = {
  love: [
    '마음이 먼저 열리는 하루',
    '말보다 배려가 통하는 날',
    '관계의 온도를 낮춰 보세요',
    '가벼운 연락이 약이 됩니다',
    '혼자만의 시간도 연애운',
  ],
  wealth: [
    '작은 지출을 기록하세요',
    '들어오는 돈보다 새는 구멍',
    '기회는 있으나 올인은 금물',
    '저축 한 줄이 재물운입니다',
    '거래·계약은 한 번 더 읽기',
  ],
  job: [
    '실무 한 건이 눈에 띕니다',
    '보고·정리가 점수를 만듭니다',
    '이직 생각은 메모만 하세요',
    '동료와 보조를 맞추는 날',
    '집중 타임을 두 시간 확보',
  ],
  hope: [
    '작은 소원이 가까워집니다',
    '기대는 행동과 짝을 지으세요',
    '오늘은 씨앗을 심는 날',
    '바람이 방향을 알려 줍니다',
    '과한 기대는 한 스푼만',
  ],
}

function pick(list, n) {
  return list[Math.abs(n) % list.length]
}

function jitter(rand, base, spread = 10) {
  return clamp(base + Math.round((rand() - 0.5) * spread * 2))
}

function longText(kind, chart, date, score) {
  const { meta, daewoon, stats } = chart
  const dw = daewoon.current ? `${daewoon.current.ganzi} 대운` : '현재 흐름'
  const el = meta.dayElementKo
  const tone = score >= 70 ? '기운이 잘 쓰이는' : score >= 45 ? '조율이 필요한' : '힘을 아껴 쓰는'
  const map = {
    love: `오늘은 ${el} 일간 기준으로 애정·관계의 ${tone} 날입니다. ${dw} 위에서 세운이 ${date}의 분위기를 만듭니다. 점수 ${score}점은 만남이 보장된다는 뜻이 아니라, 표현과 경계의 온도를 가리킵니다. 상대에게 서운함을 쌓기보다 한 줄로 요청을 말해 보세요. 연락이 없어도 자존을 숫자로 재지 말고, 일정과 잠을 먼저 지키면 관계 점수가 실제로 오릅니다. 재성·관성이 강한 원국은 현실 조건(돈·시간) 이야기가 갈등의 핵심이 되기 쉽습니다. 오늘은 큰 약속보다 작은 배려가 더 잘 통합니다. 결과는 참고용이며 연애·결혼을 결정하는 근거가 아닙니다.`,
    wealth: `재물운 ${score}점은 ${el} 일간의 재성 ${stats.sipsinCount.wealth}개와 ${dw}가 겹친 오늘의 결입니다. ${tone} 흐름이라 큰돈보다 새는 구멍을 막는 쪽이 이득입니다. 충동 결제, 보증, 출처 없는 정보는 점수가 높아도 피하세요. 들어오는 돈은 장부에 한 줄, 나가는 돈은 상한을 정하면 사주보다 강한 처방이 됩니다. 투자 탭의 손익과 달리 오늘은 생활 현금 흐름에 가깝습니다. 계약서는 하루 미뤄 다시 읽어도 늦지 않습니다. 본 해석은 오락·참고용이며 투자 권유가 아닙니다.`,
    job: `직업운 ${score}점은 관성·식상·인성의 배치와 ${dw}가 ${date}에 만든 현장 분위기입니다. ${el} 일간은 ${tone} 하루를 맞기 쉽습니다. 이직·사표를 오늘 단정하지 말고, 한 건의 마감과 한 번의 정리를 점수로 바꾸세요. 눈에 띄고 싶다면 말 수보다 결과물 한 장이 낫습니다. 갈등이 있으면 감정 전에 사실과 요청을 나눠 적으세요. 추천 직업은 적성 힌트일 뿐 면허·시장·생활비가 우선입니다.`,
    hope: `소망운 ${score}점은 기대와 실행의 간격입니다. ${el} 일간, ${dw}. 바람이 크면 오늘 할 수 있는 한 줄로 쪼개세요. 점수가 높아도 행동이 없으면 세운은 공회전합니다. 점수가 낮아도 습관 하나가 다음 주를 바꿉니다. 건강·시험·관계는 명리보다 일정과 몸이 먼저입니다. 소원은 비밀로 품되, 실행은 공개된 캘린더에 두세요. 결과는 참고용입니다.`,
  }
  let t = map[kind]
  while (t.length < 520) t += ` ${meta.dayStem} 일간의 결을 과하게 단정하지 말고, 오늘 하루의 수면·식사·약속을 지키는 것이 가장 정확한 보완입니다.`
  return t
}

export function buildDailyFortune(chart, date) {
  const seed = hash(`${date}|${chart.meta.dayStem}|${chart.meta.age}|${chart.meta.gender}`)
  const rand = rng(seed)
  const love = analyzeLove(chart)
  const wealth = analyzeWealth(chart)
  const job = analyzeCareer(chart)
  const hopeBase = Math.round((love.score + job.score + (chart.stats.sipsinCount.resource + chart.stats.sipsinCount.output) * 6) / 2.4)

  const pack = (key, base) => {
    const score = jitter(rand, base, 11)
    const text = pick(SHORT[key], seed + key.length + score)
    return {
      score,
      text,
      level: scoreLevel(score),
      detail: longText(key, chart, date, score),
    }
  }

  return {
    date,
    love: pack('love', love.score),
    wealth: pack('wealth', wealth.score),
    job: pack('job', job.score),
    hope: pack('hope', hopeBase),
  }
}

export { ELEMENT_KO }
