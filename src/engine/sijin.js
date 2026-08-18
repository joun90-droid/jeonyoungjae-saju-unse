/** 12시진 — 전통 시(時) 구간 */
export const SIJIN = [
  { id: 'ja', branch: '子', label: '자시', range: '23:00~01:00', hour: 0, minute: 30, traits: ['내향', '지적', '밤형', '직관'] },
  { id: 'chuk', branch: '丑', label: '축시', range: '01:00~03:00', hour: 2, minute: 0, traits: ['인내', '고집', '묵묵', '현실'] },
  { id: 'in', branch: '寅', label: '인시', range: '03:00~05:00', hour: 4, minute: 0, traits: ['리더', '새벽활동', '도전', '추진'] },
  { id: 'myo', branch: '卯', label: '묘시', range: '05:00~07:00', hour: 6, minute: 0, traits: ['온화', '예민', '감성', '아침형'] },
  { id: 'jin', branch: '辰', label: '진시', range: '07:00~09:00', hour: 8, minute: 0, traits: ['야망', '변화', '사교', '아침활발'] },
  { id: 'sa', branch: '巳', label: '사시', range: '09:00~11:00', hour: 10, minute: 0, traits: ['날카로움', '분석', '표현', '오전집중'] },
  { id: 'o', branch: '午', label: '오시', range: '11:00~13:00', hour: 12, minute: 0, traits: ['열정', '외향', '경쟁', '정오에너지'] },
  { id: 'mi', branch: '未', label: '미시', range: '13:00~15:00', hour: 14, minute: 0, traits: ['배려', '온순', '협력', '오후여유'] },
  { id: 'sin', branch: '申', label: '신시', range: '15:00~17:00', hour: 16, minute: 0, traits: ['재치', '변화무쌍', '수완', '오후활동'] },
  { id: 'yu', branch: '酉', label: '유시', range: '17:00~19:00', hour: 18, minute: 0, traits: ['완벽주의', '미적', '정리', '저녁형'] },
  { id: 'sul', branch: '戌', label: '술시', range: '19:00~21:00', hour: 20, minute: 0, traits: ['책임', '충성', '보호', '밤활동'] },
  { id: 'hae', branch: '亥', label: '해시', range: '21:00~23:00', hour: 22, minute: 0, traits: ['포용', '직관', '공감', '밤올빼미'] },
]

export function findSijinByHour(hour) {
  if (hour >= 23 || hour < 1) return SIJIN[0]
  if (hour < 3) return SIJIN[1]
  if (hour < 5) return SIJIN[2]
  if (hour < 7) return SIJIN[3]
  if (hour < 9) return SIJIN[4]
  if (hour < 11) return SIJIN[5]
  if (hour < 13) return SIJIN[6]
  if (hour < 15) return SIJIN[7]
  if (hour < 17) return SIJIN[8]
  if (hour < 19) return SIJIN[9]
  if (hour < 21) return SIJIN[10]
  return SIJIN[11]
}
