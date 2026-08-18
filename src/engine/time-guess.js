import { computeChart } from './calculator.js'
import { SIJIN } from './sijin.js'

/**
 * @typedef {{ id: string, text: string, options: { id: string, label: string, weights: Record<string, number> }[] }} GuessQuestion
 */

/** @type {GuessQuestion[]} */
export const TIME_GUESS_QUESTIONS = [
  {
    id: 'wake',
    text: '평소 기상 시간·아침 컨디션은?',
    options: [
      { id: 'early', label: '6시 전에 일어나도 개운하다', weights: { myo: 3, jin: 3, in: 2, sa: 1 } },
      { id: 'normal', label: '7~8시쯤이 적당하다', weights: { jin: 2, sa: 2, mi: 1, o: 1 } },
      { id: 'late', label: '늦잠이 잦고 오전이 느리다', weights: { o: 2, sin: 2, mi: 2, yu: 1 } },
      { id: 'night', label: '밤·새벽에 더 집중된다', weights: { ja: 3, hae: 3, sul: 2, chuk: 2 } },
    ],
  },
  {
    id: 'energy',
    text: '하루 중 에너지가 가장 높은 시간대는?',
    options: [
      { id: 'dawn', label: '새벽~이른 아침', weights: { in: 3, myo: 3, chuk: 1 } },
      { id: 'am', label: '오전 9~11시', weights: { sa: 3, jin: 2, o: 1 } },
      { id: 'noon', label: '점심 전후', weights: { o: 3, mi: 2, sa: 1 } },
      { id: 'pm', label: '오후 3~6시', weights: { sin: 3, yu: 2, mi: 1 } },
      { id: 'night', label: '저녁~밤', weights: { sul: 3, hae: 3, ja: 2, yu: 1 } },
    ],
  },
  {
    id: 'personality',
    text: '주변에서 자주 듣는 내 성격 묘사는?',
    options: [
      { id: 'leader', label: '추진력·리더형', weights: { in: 3, o: 2, jin: 2 } },
      { id: 'gentle', label: '온화·배려형', weights: { myo: 3, mi: 3, hae: 2 } },
      { id: 'sharp', label: '냉철·분석형', weights: { sa: 3, yu: 2, chuk: 2 } },
      { id: 'social', label: '수완·재치·사교형', weights: { sin: 3, jin: 2, o: 1 } },
      { id: 'inner', label: '내향·사색형', weights: { ja: 3, chuk: 2, hae: 2 } },
    ],
  },
  {
    id: 'sleep',
    text: '잠들기 쉬운 시간대는?',
    options: [
      { id: 'early', label: '9~10시면 졸린다', weights: { myo: 2, jin: 2, in: 2, chuk: 1 } },
      { id: 'mid', label: '11~12시 전후', weights: { sa: 2, o: 2, mi: 1, sul: 1 } },
      { id: 'late', label: '1시 넘어야 잠이 온다', weights: { ja: 3, hae: 3, sul: 2 } },
      { id: 'owl', label: '새벽 2~4시에도 깨어 있다', weights: { chuk: 3, in: 2, ja: 2 } },
    ],
  },
  {
    id: 'birth_hint',
    text: '출생 당시 들었던 이야기(추정 포함)는?',
    options: [
      { id: 'dawn', label: '새벽·이른 아침 태어났다', weights: { in: 4, myo: 3, chuk: 2 } },
      { id: 'day', label: '낮·점심 무렵', weights: { o: 4, sa: 3, mi: 2 } },
      { id: 'evening', label: '저녁·해질 무렵', weights: { yu: 4, sul: 3, sin: 2 } },
      { id: 'night', label: '밤·늦은 시간', weights: { hae: 4, ja: 3, sul: 2 } },
      { id: 'unknown', label: '전혀 모른다', weights: {} },
    ],
  },
  {
    id: 'face',
    text: '얼굴·체형 인상(관상 느낌)은?',
    options: [
      { id: 'round', label: '둥글고 부드러운 인상', weights: { myo: 2, mi: 2, hae: 2, o: 1 } },
      { id: 'sharp', label: '각지고 또렷한 인상', weights: { sa: 2, yu: 3, in: 2 } },
      { id: 'strong', label: '강하고 단단한 인상', weights: { in: 2, chuk: 2, sul: 2, o: 2 } },
      { id: 'slim', label: '날씬하고 지적인 인상', weights: { sin: 2, ja: 2, sa: 2, jin: 1 } },
    ],
  },
  {
    id: 'work',
    text: '일·공부할 때 집중이 잘 되는 시간은?',
    options: [
      { id: 'morning', label: '오전', weights: { jin: 2, sa: 3, myo: 2 } },
      { id: 'afternoon', label: '오후', weights: { sin: 3, mi: 2, yu: 1 } },
      { id: 'evening', label: '저녁', weights: { yu: 2, sul: 3, hae: 2 } },
      { id: 'late', label: '밤·새벽', weights: { ja: 3, chuk: 2, hae: 2, in: 1 } },
    ],
  },
  {
    id: 'social',
    text: '모임·약속을 즐기는 시간대는?',
    options: [
      { id: 'lunch', label: '점심·브런치 모임', weights: { o: 3, mi: 2, sa: 1 } },
      { id: 'afternoon', label: '오후 카페·산책', weights: { sin: 3, mi: 2, yu: 1 } },
      { id: 'dinner', label: '저녁 식사·술자리', weights: { sul: 3, yu: 2, hae: 2 } },
      { id: 'late', label: '늦은 밤·심야 대화', weights: { ja: 3, hae: 3, chuk: 1 } },
      { id: 'none', label: '혼자 쉬는 편', weights: { chuk: 2, ja: 2, myo: 1 } },
    ],
  },
  {
    id: 'childhood',
    text: '어릴 때 활동성·성격은?',
    options: [
      { id: 'active', label: '뛰어다니고 활발했다', weights: { in: 2, o: 3, jin: 2, sin: 1 } },
      { id: 'calm', label: '조용하고 책·그림을 좋아했다', weights: { myo: 2, ja: 2, chuk: 2, sa: 1 } },
      { id: 'stubborn', label: '고집 있고 끈기 있었다', weights: { chuk: 3, sul: 2, yu: 1 } },
      { id: 'curious', label: '호기심 많고 말이 많았다', weights: { sin: 2, sa: 2, hae: 2, jin: 1 } },
    ],
  },
  {
    id: 'season_feel',
    text: '태어난 계절·날씨 기억(또는 느낌)은?',
    options: [
      { id: 'cold', label: '추웠거나 겨울 느낌', weights: { ja: 2, chuk: 2, in: 1, hae: 1 } },
      { id: 'warm', label: '따뜻하거나 봄·여름', weights: { myo: 2, o: 2, mi: 2, sa: 1 } },
      { id: 'clear', label: '맑고 선선했다', weights: { jin: 2, yu: 2, sin: 1 } },
      { id: 'unknown', label: '모르겠다', weights: {} },
    ],
  },
]

/**
 * @param {Record<string, string>} answers questionId -> optionId
 * @param {{ year: number, month: number, day: number, gender: string }} birth
 */
export function guessBirthTime(answers, birth) {
  const scores = Object.fromEntries(SIJIN.map((s) => [s.id, 0]))

  for (const q of TIME_GUESS_QUESTIONS) {
    const optId = answers[q.id]
    if (!optId) continue
    const opt = q.options.find((o) => o.id === optId)
    if (!opt?.weights) continue
    for (const [sijinId, w] of Object.entries(opt.weights)) {
      scores[sijinId] = (scores[sijinId] || 0) + w
    }
  }

  // 시주와 일주 조화도 보정
  const baseInput = { ...birth, timezone: 'Asia/Seoul', unknownTime: false }
  for (const s of SIJIN) {
    try {
      const chart = computeChart({ ...baseInput, hour: s.hour, minute: s.minute })
      const hourPillar = chart.saju.pillars[0]
      if (!hourPillar) continue
      const branch = hourPillar.pillar.branch
      if (branch === s.branch) scores[s.id] += 2
      const ss = `${hourPillar.stemSipsin}/${hourPillar.branchSipsin}`
      if (/正財|偏財|정재|편재/.test(ss) && answers.personality === 'leader') scores[s.id] += 1
      if (/正印|偏印|정인|편인/.test(ss) && answers.personality === 'inner') scores[s.id] += 1
      if (/食神|傷官|식신|상관/.test(ss) && answers.personality === 'sharp') scores[s.id] += 1
    } catch {
      /* skip invalid combo */
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1
  const ranked = SIJIN.map((s) => ({
    ...s,
    score: scores[s.id] || 0,
    confidence: Math.round(((scores[s.id] || 0) / total) * 100),
  }))
    .sort((a, b) => b.score - a.score)

  const top = ranked[0]
  const reason = buildGuessReason(answers, top, ranked.slice(1, 3))

  return {
    best: top,
    candidates: ranked.slice(0, 5),
    reason,
    answers,
  }
}

function buildGuessReason(answers, best, runners) {
  const parts = []
  if (answers.wake === 'night' || answers.energy === 'night') {
    parts.push('밤형·야행성 패턴이 ' + best.label + '(' + best.range + ')와 맞닿습니다.')
  }
  if (answers.wake === 'early' || answers.energy === 'dawn') {
    parts.push('이른 기상·새벽 에너지가 ' + best.label + ' 특성과 부합합니다.')
  }
  if (answers.birth_hint && answers.birth_hint !== 'unknown') {
    parts.push('출생 당시 들었던 이야기와 시진 후보가 겹칩니다.')
  }
  if (answers.personality) {
    parts.push('성격 묘사("' + labelFor('personality', answers.personality) + '")가 ' + best.traits.slice(0, 2).join('·') + ' 기운과 연결됩니다.')
  }
  if (runners.length) {
    parts.push('차순위: ' + runners.map((r) => `${r.label} ${r.confidence}%`).join(', ') + '.')
  }
  return parts.length ? parts.join(' ') : best.label + '(' + best.range + ')가 응답 패턴과 가장 잘 맞습니다.'
}

function labelFor(qId, optId) {
  const q = TIME_GUESS_QUESTIONS.find((x) => x.id === qId)
  return q?.options.find((o) => o.id === optId)?.label || optId
}

export function getQuestionCount() {
  return TIME_GUESS_QUESTIONS.length
}
