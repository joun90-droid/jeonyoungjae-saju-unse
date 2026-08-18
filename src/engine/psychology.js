export const QUESTIONS = [
  { q: '요즘 당신의 기분은?', opts: [
    { id: 'fire', label: '① 행복함 · 에너지가 오른다' },
    { id: 'metal', label: '② 차분함 · 정리하고 싶다' },
    { id: 'tree', label: '③ 불안함 · 시작이 조급하다' },
    { id: 'water', label: '④ 답답함 · 생각이 많다' },
  ] },
  { q: '지금 가장 중요한 것은?', opts: [
    { id: 'fire', label: '① 사람 관계' },
    { id: 'metal', label: '② 돈과 안정' },
    { id: 'tree', label: '③ 성장과 도전' },
    { id: 'water', label: '④ 평온과 휴식' },
  ] },
  { q: '스트레스를 풀 때?', opts: [
    { id: 'fire', label: '① 사람을 만나 이야기한다' },
    { id: 'earth', label: '② 집·일정을 정리한다' },
    { id: 'tree', label: '③ 걷거나 몸을 움직인다' },
    { id: 'water', label: '④ 혼자 콘텐츠를 본다' },
  ] },
  { q: '주말에 끌리는 계획은?', opts: [
    { id: 'fire', label: '① 모임·공연' },
    { id: 'earth', label: '② 가족과 집밥' },
    { id: 'metal', label: '③ 할 일 체크리스트' },
    { id: 'tree', label: '④ 새로운 장소' },
  ] },
  { q: '갈등 상황에서 당신은?', opts: [
    { id: 'fire', label: '① 바로 말한다' },
    { id: 'earth', label: '② 일단 참고 중재한다' },
    { id: 'metal', label: '③ 논리로 정리한다' },
    { id: 'water', label: '④ 거리를 둔다' },
  ] },
  { q: '일을 고를 때 기준은?', opts: [
    { id: 'tree', label: '① 성장 가능성' },
    { id: 'fire', label: '② 인정과 재미' },
    { id: 'earth', label: '③ 안정과 신뢰' },
    { id: 'metal', label: '④ 전문성과 연봉' },
  ] },
  { q: '돈이 생기면 먼저?', opts: [
    { id: 'fire', label: '① 경험에 쓴다' },
    { id: 'earth', label: '② 비상금을 채운다' },
    { id: 'metal', label: '③ 목표 저축·투자' },
    { id: 'water', label: '④ 일단 보류한다' },
  ] },
  { q: '연락이 없을 때?', opts: [
    { id: 'fire', label: '① 먼저 보낸다' },
    { id: 'tree', label: '② 기다리다 조급해진다' },
    { id: 'earth', label: '③ 상대 사정을 본다' },
    { id: 'water', label: '④ 혼자 해석이 길어진다' },
  ] },
  { q: '공부·성장 방식은?', opts: [
    { id: 'tree', label: '① 새 분야를 기웃거린다' },
    { id: 'fire', label: '② 사람 앞에서 배운다' },
    { id: 'metal', label: '③ 자격·커리큘럼' },
    { id: 'water', label: '④ 깊게 파고든다' },
  ] },
  { q: '방이 지저분하면?', opts: [
    { id: 'earth', label: '① 바로 치운다' },
    { id: 'metal', label: '② 구역을 나눠 처리' },
    { id: 'fire', label: '③ 손님이 오면 한다' },
    { id: 'water', label: '④ 눈에 안 보이면 넘어간다' },
  ] },
  { q: '칭찬받을 때 속마음은?', opts: [
    { id: 'fire', label: '① 더 잘하고 싶다' },
    { id: 'earth', label: '② 민망하지만 고맙다' },
    { id: 'metal', label: '③ 사실인지 점검한다' },
    { id: 'tree', label: '④ 다음 목표가 떠오른다' },
  ] },
  { q: '결정을 미루는 이유는?', opts: [
    { id: 'water', label: '① 정보가 부족해서' },
    { id: 'earth', label: '② 남을 신경 써서' },
    { id: 'metal', label: '③ 완벽한 답을 원해서' },
    { id: 'tree', label: '④ 더 좋은 옵션이 있을까 봐' },
  ] },
  { q: '에너지가 떨어질 때?', opts: [
    { id: 'fire', label: '① 햇빛·사람을 찾는다' },
    { id: 'earth', label: '② 규칙적인 식사를 한다' },
    { id: 'water', label: '③ 잠을 잔다' },
    { id: 'tree', label: '④ 바깥바람을 쐬다' },
  ] },
  { q: '팀에서 자연스러운 역할은?', opts: [
    { id: 'fire', label: '① 분위기 메이커' },
    { id: 'earth', label: '② 일정·케어' },
    { id: 'metal', label: '③ 품질·마감' },
    { id: 'tree', label: '④ 아이디어 발제' },
  ] },
  { q: '한 달 뒤 나에게 하고 싶은 말은?', opts: [
    { id: 'tree', label: '① 시작하길 잘했다' },
    { id: 'fire', label: '② 마음을 전했구나' },
    { id: 'earth', label: '③ 루틴을 지켰구나' },
    { id: 'metal', label: '④ 약속을 지켰구나' },
  ] },
]

export const ELEMENT_KO = {
  tree: '목(木)',
  fire: '화(火)',
  earth: '토(土)',
  metal: '금(金)',
  water: '수(水)',
}

export const ELEMENT_NAME = {
  tree: '성장형',
  fire: '발산형',
  earth: '안정형',
  metal: '결단형',
  water: '흐름형',
}

export function scorePsychology(answers) {
  const counts = { tree: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  for (const a of answers) {
    if (counts[a] != null) counts[a] += 1
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const [top, topN] = ranked[0]
  const total = answers.length || 1
  return { counts, top, topN, total, pct: Math.round((topN / total) * 100) }
}

export function psychologyNarrative(result, chart) {
  const ko = ELEMENT_KO[result.top]
  const name = ELEMENT_NAME[result.top]
  const sajuEl = chart?.meta?.dayElement
  const sajuKo = chart?.meta?.dayElementKo || '원국'
  const same = sajuEl && sajuEl === result.top
  const short = `현재 심리 유형은 ${ko} ${name}입니다. 선택 ${result.pct}%가 이 결로 모였습니다.`
  const detail = `지금 마음의 무게추는 ${ko}입니다. ${name}은 최근 선택·기분에서 반복된 패턴입니다. ${
    same
      ? `사주 일간도 ${sajuKo}라, 기질과 현재 기분이 같은 방향을 보고 있습니다. 장점이 과해지지 않게 반대 리듬(수면·마감·침묵 중 하나)을 하루 한 칸만 넣으세요.`
      : `사주 일간은 ${sajuKo}인데 현재 기분은 ${ko} 쪽입니다. 두 결이 다를 때는 “내가 변했다”기보다 계절이 바뀐 것에 가깝습니다. 일간의 습관(장기 목표)과 오늘의 기분(단기 욕구)을 한 문장씩 나눠 적으면 충돌이 줄어듭니다.`
  } 목은 시작, 화는 표현, 토는 루틴, 금은 마감, 수는 휴식입니다. 강한 쪽을 미신으로 키우지 말고, 약한 쪽을 일정표에 한 줄 더하세요. 이 테스트는 성격 검사가 아니라 최근 선택의 거울입니다. 결과는 참고·오락용이며 의료·상담을 대체하지 않습니다.`
  let d = detail
  while (d.length < 520) {
    d += ' 같은 문항을 한 달 뒤 다시 풀면, 대운이 아니라 생활 리듬이 답을 바꿉니다.'
  }
  return { short, detail: d, typeLabel: `${ko} ${name}` }
}
