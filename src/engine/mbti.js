const LETTERS = {
  E: '외향', I: '내향', S: '감각', N: '직관', T: '사고', F: '감정', J: '판단', P: '인식',
}

const TYPE_BLURB = {
  ISTJ: '책임·전통·실무를 지키는 유형',
  ISFJ: '돌봄·성실·안정으로 사람을 지키는 유형',
  INFJ: '의미·통찰·장기 비전을 품는 유형',
  INTJ: '전략·독립·설계로 길을 내는 유형',
  ISTP: '문제 해결과 도구에 강한 유형',
  ISFP: '가치와 감각으로 사는 유형',
  INFP: '이상과 진정성을 지키는 유형',
  INTP: '분석과 아이디어의 유형',
  ESTP: '현장·순발력·실행의 유형',
  ESFP: '분위기와 경험의 유형',
  ENFP: '가능성과 사람의 유형',
  ENTP: '토론과 변주의 유형',
  ESTJ: '조직·규칙·성과의 유형',
  ESFJ: '조화와 돌봄의 사회형',
  ENFJ: '사람과 방향을 잇는 유형',
  ENTJ: '목표와 리더십의 유형',
}

const EL_FIT = {
  tree: { good: ['ENFP', 'ENTP', 'INFP', 'ENFJ'], hard: ['ISTJ', 'ESTJ'] },
  fire: { good: ['ESFP', 'ENFP', 'ESTP', 'ENTJ'], hard: ['INTP', 'ISTJ'] },
  earth: { good: ['ISFJ', 'ESFJ', 'ISTJ', 'ESTJ'], hard: ['ENTP', 'ENFP'] },
  metal: { good: ['INTJ', 'ISTJ', 'ESTJ', 'ENTJ'], hard: ['ESFP', 'ENFP'] },
  water: { good: ['INFJ', 'INTP', 'ISFP', 'INFP'], hard: ['ESTJ', 'ENTJ'] },
}

export function mbtiCode(letters) {
  return `${letters.EI}${letters.SN}${letters.TF}${letters.JP}`
}

export function analyzeMbti(letters, chart) {
  const code = mbtiCode(letters)
  const blurb = TYPE_BLURB[code] || '네 글자의 조합'
  const el = chart?.meta?.dayElement || 'earth'
  const elKo = chart?.meta?.dayElementKo || '오행'
  const fit = EL_FIT[el] || EL_FIT.earth
  const year = 2026
  const clash = fit.hard.includes(code)
  const boost = fit.good.includes(code)
  const short = `${code}(${blurb}) × ${elKo} 일간. 2026 병오년은 화의 속도가 큰 해입니다.`
  let detail = `${code}는 ${blurb}입니다. 사주 일간은 ${elKo}. `
  detail += clash
    ? `이 조합은 2026년 병오(말)의 빠른 화 기운과 마찰이 나기 쉽습니다. 원칙(${code.includes('J') ? '계획' : '즉흥'})만 고집하면 기회가 지나가거나, 반대로 속도만 쫓으면 실수가 납니다. `
    : boost
      ? `일간의 결과 MBTI 장점이 같은 방향을 봅니다. 병오년의 노출·추진을 쓰되, 수면과 마감만 지키면 됩니다. `
      : `충돌도 과한 일치도 아닙니다. 올해는 화의 속도(말의 해)를 ${code}의 기본 리듬에 한 칸만 섞어 보세요. `
  detail += '연애에서는 T는 사실, F는 감정을 먼저 말해야 싸움이 줄어듭니다. 직업에서는 J는 마감, P는 탐험 시간을 캘린더에 분리하세요. '
  detail += '건강은 내향(I)일수록 사람 일정 뒤에 회복 블록을 넣으세요. '
  while (detail.length < 520) {
    detail += 'MBTI와 사주는 서로 다른 언어입니다. 하나를 다른 하나로 이기려 하지 마세요. 결과는 참고용입니다. '
  }
  const axes = [
    `${letters.EI === 'E' ? 'E 외향' : 'I 내향'} — ${letters.EI === 'E' ? '밖에서 충전' : '혼자 충전'}`,
    `${letters.SN === 'S' ? 'S 감각' : 'N 직관'} — ${letters.SN === 'S' ? '사실·경험' : '가능성·패턴'}`,
    `${letters.TF === 'T' ? 'T 사고' : 'F 감정'} — ${letters.TF === 'T' ? '논리·기준' : '가치·조화'}`,
    `${letters.JP === 'J' ? 'J 판단' : 'P 인식'} — ${letters.JP === 'J' ? '결정·계획' : '개방·조정'}`,
  ]
  return { code, blurb, short, detail, axes, clash, boost, letters: LETTERS }
}

export { LETTERS, TYPE_BLURB }
