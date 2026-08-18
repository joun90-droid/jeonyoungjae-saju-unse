export const ARCANA = [
  { id: 0, name: 'The Fool', ko: '바보', hint: '시작·모험' },
  { id: 1, name: 'The Magician', ko: '마법사', hint: '의지·능력' },
  { id: 2, name: 'The High Priestess', ko: '여사제', hint: '직관·침묵' },
  { id: 3, name: 'The Empress', ko: '여황제', hint: '풍요·돌봄' },
  { id: 4, name: 'The Emperor', ko: '황제', hint: '질서·권위' },
  { id: 5, name: 'The Hierophant', ko: '교황', hint: '전통·배움' },
  { id: 6, name: 'The Lovers', ko: '연인', hint: '선택·관계' },
  { id: 7, name: 'The Chariot', ko: '전차', hint: '추진·승리' },
  { id: 8, name: 'Strength', ko: '힘', hint: '절제·용기' },
  { id: 9, name: 'The Hermit', ko: '은둔자', hint: '성찰·혼자' },
  { id: 10, name: 'Wheel of Fortune', ko: '운명의 수레바퀴', hint: '전환·타이밍' },
  { id: 11, name: 'Justice', ko: '정의', hint: '균형·인과' },
  { id: 12, name: 'The Hanged Man', ko: '매달린 사람', hint: '관점·유예' },
  { id: 13, name: 'Death', ko: '죽음', hint: '끝과 시작' },
  { id: 14, name: 'Temperance', ko: '절제', hint: '혼합·치유' },
  { id: 15, name: 'The Devil', ko: '악마', hint: '집착·유혹' },
  { id: 16, name: 'The Tower', ko: '탑', hint: '붕괴·각성' },
  { id: 17, name: 'The Star', ko: '별', hint: '희망·회복' },
  { id: 18, name: 'The Moon', ko: '달', hint: '불안·이미지' },
  { id: 19, name: 'The Sun', ko: '태양', hint: '명료·활력' },
  { id: 20, name: 'Judgement', ko: '심판', hint: '부름·재정비' },
  { id: 21, name: 'The World', ko: '세계', hint: '완성·순환' },
]

const EL_BIAS = {
  tree: [0, 1, 7, 17],
  fire: [1, 6, 19, 16],
  earth: [3, 4, 14, 21],
  metal: [8, 11, 5, 20],
  water: [2, 9, 18, 12],
}

function hash(str) {
  let h = 2166136261
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function shuffleThree(chart, salt = '') {
  const el = chart?.meta?.dayElement || 'earth'
  const seed = hash(`${el}|${chart?.meta?.dayStem || ''}|${salt}|${new Date().toDateString()}`)
  const pool = [...ARCANA]
  const picked = []
  let s = seed
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s
  }
  const prefer = EL_BIAS[el] || []
  for (const id of prefer) {
    const i = pool.findIndex((c) => c.id === id)
    if (i >= 0 && picked.length < 1) picked.push(pool.splice(i, 1)[0])
  }
  while (picked.length < 3 && pool.length) {
    const i = next() % pool.length
    picked.push(pool.splice(i, 1)[0])
  }
  return picked
}

export function interpretSpread(cards, chart) {
  const el = chart?.meta?.dayElementKo || '오행'
  const stem = chart?.meta?.dayStem || ''
  const names = cards.map((c) => `${c.ko}(${c.name})`).join(', ')
  const short = `${el} 일간과 ${cards[0].ko}·${cards[1].ko}·${cards[2].ko}의 조합입니다.`
  let detail = `${stem} ${el} 원국 위에 메이저 아르카나 세 장이 놓였습니다. ${names}. `
  detail += `첫 장은 지금의 능력·태도(${cards[0].hint}), 둘째는 관계·선택의 핵심(${cards[1].hint}), 셋째는 흐름의 방향(${cards[2].hint})으로 읽습니다. `
  detail += '타로는 점괘가 아니라 질문의 거울입니다. 사주의 대운이 기후라면 카드는 오늘의 날씨입니다. '
  detail += 'Death·Tower는 재앙이 아니라 낡은 역할의 종료를, Sun·Star는 과신이 아니라 회복의 허가로 보세요. '
  detail += '연애 카드가 나와도 상대의 동의 없는 추측은 하지 마세요. 직업·돈은 카드보다 계약과 장부가 정확합니다. '
  while (detail.length < 520) {
    detail += `${cards.map((c) => c.ko).join('·')}의 힌트(${cards.map((c) => c.hint).join(', ')})를 오늘 할 일 한 줄로 번역하세요. `
  }
  const perCard = cards.map((c, i) => {
    const pos = ['현재의 나', '관계·선택', '흐름'][i]
    let t = `${pos}: ${c.ko} — ${c.hint}. ${el}과 만나면 ${c.hint}를 생활의 한 습관으로 바꾸는 과제가 됩니다.`
    while (t.length < 220) t += ' 단정하지 말고 질문으로 남기세요.'
    return { ...c, pos, text: t }
  })
  return { short, detail, perCard }
}
