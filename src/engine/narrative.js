const ELEMENT_KO = {
  tree: '목(木)', fire: '화(火)', earth: '토(土)', metal: '금(金)', water: '수(水)',
}

const SIPSIN_KO = {
  wealth: '재성(財星)',
  power: '관성(官星)',
  output: '식상(食傷)',
  resource: '인성(印星)',
  self: '비겁(比劫)',
}

function pillarLine(p, label) {
  if (!p) return ''
  return `${label} ${p.pillar.ganzi} — 천간 ${p.stemSipsin}, 지지 ${p.branchSipsin}, 12운성 ${p.unseong}`
}

function dominantElement(stats) {
  return Object.entries(stats.elementCount).sort((a, b) => b[1] - a[1])[0]
}

function dominantSipsin(stats) {
  const entries = Object.entries(stats.sipsinCount).filter(([k]) => k !== 'other')
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]
}

function sipsinNarrative(stats) {
  const parts = []
  if (stats.sipsinCount.wealth >= 2) parts.push('재성이 두드러져 돈·거래·실무 결과에 민감하게 반응하는 타입입니다.')
  if (stats.sipsinCount.power >= 2) parts.push('관성이 강해 조직·규율·명예·책임과의 인연이 깊습니다.')
  if (stats.sipsinCount.output >= 2) parts.push('식상이 많아 표현·기술·기획·콘텐츠 쪽 에너지가 살아 있습니다.')
  if (stats.sipsinCount.resource >= 2) parts.push('인성이 받쳐 주어 학습·자격·멘토·정신적 안정이 운을 키웁니다.')
  if (stats.sipsinCount.self >= 2) parts.push('비겁이 강해 독립·경쟁·고집·지출이 동시에 올 수 있습니다.')
  return parts.length ? parts.join(' ') : '십신 분포가 고르거나 특정 한쪽으로 과도하게 치우치지 않아, 환경과 선택에 따라 운의 색이 달라지는 편입니다.'
}

function dwNarrative(dw) {
  if (!dw) return '현재 대운 정보가 없어 일·월주 중심으로 흐름을 읽습니다.'
  const ss = `${dw.stemSipsin}/${dw.branchSipsin}`
  let t = `${dw.ganzi} 대운(${dw.age}~${dw.age + 9}세)은 `
  if (/正財|偏財|정재|편재/.test(ss)) t += '재물·거래·성과급·사업 수익 테마가 강조됩니다.'
  else if (/正官|七殺|정관|편관/.test(ss)) t += '직장·승진·시험·명예·책임 테마가 강조됩니다.'
  else if (/食神|傷官|식신|상관/.test(ss)) t += '표현·이직·창업·기술·말·콘텐츠 테마가 강조됩니다.'
  else if (/正印|偏印|정인|편인/.test(ss)) t += '학습·자격·전환·휴식·정신적 성장 테마가 강조됩니다.'
  else if (/比肩|劫財|비견|겁재/.test(ss)) t += '경쟁·동업·지출·자아·협력·분쟁 테마가 강조됩니다.'
  else t += '일간과의 관계 속에서 새로운 과제를 배우는 시기입니다.'
  if (dw.isGongmang) t += ' 공망(空亡) 기운이 있어 큰 계약·투자·인연은 한 번 더 점검하는 것이 좋습니다.'
  return t
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildOverviewNarrative(chart) {
  const { meta, stats, saju, daewoon } = chart
  const [domEl, domCnt] = dominantElement(stats)
  const [domSip, sipCnt] = dominantSipsin(stats)
  const pillars = saju.pillars

  return [
    `${meta.age}세 ${meta.gender === 'M' ? '남성' : '여성'} 명식, 일간 ${meta.dayStem}(${meta.dayElementKo})을 중심으로 사주를 읽으면 ${meta.dayStem}의 성질이 삶 전반의 '나'를 정의합니다. ${ELEMENT_KO[domEl] || domEl} 기운이 ${domCnt}회 등장해 전체 결이 ${domCnt >= 3 ? '이 오행 쪽으로 기울어' : '비교적 분산되어'} 있습니다.`,
    sipsinNarrative(stats),
    `두드러지는 십신은 ${SIPSIN_KO[domSip] || domSip}(${sipCnt}개)입니다. ${pillarLine(pillars[2], '월주')} — 사회·직업·부모·청년기 환경의 바탕이 됩니다. ${pillarLine(pillars[3], '년주')} — 조상·유년기·대외 이미지와 연결됩니다.`,
    dwNarrative(daewoon.current),
    `${meta.currentYear}년은 현재 대운과 겹치는 해이므로, 올해 선택(이직·투자·연애·이사·창업)은 향후 2~3년의 기준점이 됩니다. 사주는 가능성과 성향을 읽는 도구이며, 최종 결정은 본인의 현실 조건과 함께 하세요.`,
  ]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildTimelineNarrative(chart, sectionId) {
  const { meta, daewoon, stats } = chart
  const { past, current, future } = daewoon

  if (sectionId === 'past') {
    const paras = [
      `【과거 흐름 상세】 ${meta.dayStem} 일간은 지나온 대운 속에서 자신의 강점과 약점을 학습해 왔습니다. ${sipsinNarrative(stats)}`,
    ]
    if (past.length) {
      past.forEach((d) => {
        paras.push(
          `${d.age}~${d.age + 9}세 ${d.ganzi} 대운: 천간 ${d.stemSipsin}, 지지 ${d.branchSipsin}. 이 시기에는 ${/正財|偏財|정재|편재/.test(d.stemSipsin + d.branchSipsin) ? '돈·일·거래·실무' : /正官|七殺|정관|편관/.test(d.stemSipsin + d.branchSipsin) ? '학교·직장·규율·시험' : /食神|傷官|식신|상관/.test(d.stemSipsin + d.branchSipsin) ? '표현·연애·창작·변화' : '내면·가족·자아'} 이슈가 두드러졌을 수 있습니다.`
        )
      })
    } else {
      paras.push('과거 대운 데이터가 제한적이지만, 년·월주를 보면 초년·청년기에 성장과 시행착오가 교차했을 가능성이 큽니다.')
    }
    paras.push('과거는 "왜 지금의 패턴이 생겼는지"를 이해하는 거울입니다. 후회보다 경험을 정리해 두면 현재 대운에서 같은 실수를 줄일 수 있습니다.')
    return paras
  }

  if (sectionId === 'present') {
    const paras = [
      `【현재·${meta.currentYear}년 상세】 지금 ${meta.age}세, ${current ? `${current.ganzi} 대운 ${current.age}~${current.age + 9}세 구간` : '대운 전환 인근'}에 있습니다.`,
      dwNarrative(current),
    ]
    const [domEl, domCnt] = dominantElement(stats)
    paras.push(
      `올해 오행은 ${ELEMENT_KO[domEl] || domEl}(${domCnt})이 강조됩니다. ${meta.currentYear}년 상반기는 기존 루틴을 정리하고, 하반기는 대운 ${current?.stemSipsin || '기운'} 성향에 맞는 선택( ${stats.sipsinCount.wealth >= 2 ? '수입·거래·실무' : stats.sipsinCount.output >= 2 ? '프로젝트·표현·기술' : stats.sipsinCount.power >= 2 ? '승진·자격·책임' : '자기관리·건강·관계'} )을 밀어붙이기 좋습니다.`
    )
    if (stats.sipsinCount.self >= 2) {
      paras.push('비겁이 강한 해에는 경쟁·지출·고집이 동시에 올 수 있습니다. "내가 맞다"보다 "결과가 어떻게 나오는지"를 먼저 보세요.')
    }
    paras.push('중요 결정은 감정 peak·밤늦은 시간보다, 하루 숙성 후 내리는 것이 유리합니다.')
    return paras
  }

  // future
  const paras = [
    `【미래 전망 상세】 ${meta.dayStem} 일간의 다음 10~20년 흐름은 대운 전환점에서 갈립니다.`,
  ]
  if (future.length) {
    future.forEach((d, i) => {
      paras.push(
        `${i === 0 ? '가장 가까운' : '그다음'} 전환: ${d.age}세부터 ${d.ganzi} 대운(${d.stemSipsin}/${d.branchSipsin}). ${/劫財|傷官|겁재|상관/.test(d.stemSipsin + d.branchSipsin) ? '변화·확장·이동·투자는 신중히, 기반 다지기와 병행하세요.' : /正財|正印|정재|정인/.test(d.stemSipsin + d.branchSipsin) ? '저축·자격·안정적 포지션·장기 계획에 유리한 흐름입니다.' : '새로운 목표를 세우되, 무리한 올인은 피하세요.'}`
      )
    })
  } else {
    paras.push('다음 대운 정보가 제한적입니다. 현재 패턴을 1~2년 더 다듬은 뒤 전환을 준비하세요.')
  }
  paras.push(`${(future[0]?.age || meta.age + 5)}세 전후로 재무·주거·관계·커리어 중 하나는 반드시 정리되는 경우가 많습니다. 미리 6~12개월 전부터 준비할수록 선택지가 넓어집니다.`)
  return paras
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildWealthNarrative(chart) {
  const { meta, stats, daewoon } = chart
  return [
    `【재물운 상세】 ${meta.dayElementKo} 일간 ${meta.dayStem}에게 재성은 "내가 통제·획득하는 재물"을 뜻합니다. 현재 재성 ${stats.sipsinCount.wealth}개, 식상 ${stats.sipsinCount.output}개, 비겁 ${stats.sipsinCount.self}개 조합입니다.`,
    stats.sipsinCount.wealth >= 2
      ? '재성이 복수면 수입원이 여러 갈래이거나, 들어온 돈이 곧 나가는 구조일 수 있습니다. 통장·카드·현금흐름을 월 1회 점검하세요.'
      : stats.sipsinCount.output >= 2
        ? '식상형 재물은 기술·프로젝트·성과·콘텐츠로 돈이 붙습니다. 포트폴리오·실적·단가 협상이 중요합니다.'
        : '재성이 적으면 한 줄기 수입(급여·사업)에 의존하기 쉽습니다. 부수입·자격·저축 습관으로 방어력을 키우세요.',
    dwNarrative(daewoon.current),
    stats.sipsinCount.self >= 2
      ? '비겁이 강하면 동업·보증·대출·경쟁 지출에 주의하세요. "친한 지인"일수록 계약·조건을 글로 남기세요.'
      : '비겁이 약하면 혼자 결정·저축·분산에 유리합니다. 자동이체·ETF·비상금 3~6개월분을 우선 확보하세요.',
    `유리한 시기: ${daewoon.future[0] ? `${daewoon.future[0].age}대 ${daewoon.future[0].ganzi} 대운` : '현재 대운 중후반'}. 재물운은 사주만으로 확정되지 않으며, 장부·세금·리스크 관리가 실제 결과를 만듭니다.`,
  ]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildLoveNarrative(chart) {
  const { meta, stats, daewoon } = chart
  const isM = meta.gender === 'M'
  return [
    `【연애운 상세】 ${isM ? '남명' : '여명'}에서 ${isM ? '재성(妻財)은 배우자·연인·이성·실질적 관계' : '관성(夫星)은 배우자·진지한 상대·책임 있는 인연'}을, 식상은 매력·표현·대화·썸을 상징합니다.`,
    stats.sipsinCount.power >= 2
      ? '관성이 강하면 진지한 만남·책임·결혼·장기 관계 쪽으로 흐르기 쉽습니다. 가벼운 연애보다 신뢰·가치관 일치가 중요합니다.'
      : stats.sipsinCount.output >= 2
        ? '식상이 강하면 말·매력·SNS·취미·콘텐츠로 인연이 붙습니다. 표현은 풍부하나 깊이 유지에 신경 쓰세요.'
        : '인연 기운이 고르거나 약하면 천천히 신뢰를 쌓는 안정형입니다. 서두르기보다 관찰·대화가 유리합니다.',
    stats.sipsinCount.self >= 2
      ? '비겁이 강하면 고집·비교·질투·독선이 관계를 해칠 수 있습니다. "내 방식"과 "상대 방식"의 중간지점을 찾으세요.'
      : '자아 기운이 과하지 않아 상대 의견을 수용하기 쉬운 편입니다. 다만 기대치·속도 차이는 여전히 조율이 필요합니다.',
    dwNarrative(daewoon.current),
    '궁합·결혼·동거는 상대 사주·나이·가치관·재정까지 함께 봐야 정확합니다. 연애운은 "어떤 인연이 붙기 쉬운지"를 읽는 참고 자료입니다.',
  ]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildInvestNarrative(chart) {
  const { meta, stats, daewoon } = chart
  const cur = daewoon.current
  const ss = cur ? cur.stemSipsin + cur.branchSipsin : ''
  return [
    `【투자·손익 상세】 ${meta.dayStem} 일간의 투자 성향은 십신과 대운이 함께 결정합니다. 재성 ${stats.sipsinCount.wealth}·인성 ${stats.sipsinCount.resource}·비겁 ${stats.sipsinCount.self}개.`,
    /劫財|傷官|겁재|상관/.test(ss)
      ? '현재 대운은 단기 변동·급등급락·FOMO·레버리지 유혹이 클 수 있습니다. 원금 보존·분산·현금 비중을 높이세요.'
      : /正財|正印|정재|정인/.test(ss)
        ? '현재 대운은 적립·배당·채권·ETF·장기 분산에 비교적 유리한 흐름입니다. 무리한 투기보다 꾸준함이 이득입니다.'
        : '현재 대운은 혼조입니다. 한 종목·한 코인·지인 추천 올인은 피하고, 분기별 리밸런싱을 권합니다.',
    stats.sipsinCount.self >= 2
      ? '비겁이 강하면 "한 방" 심리·과신·손실 확대 패턴이 나오기 쉽습니다. 투자금은 잃어도 생활에 지장 없는 금액만.'
      : '자아 기운이 과하지 않아 규칙 기반 투자(적립·ETF·리밸런싱)를 지키기 수월합니다.',
    `단기(1년): ${stats.sipsinCount.self >= 2 || /劫財|傷官/.test(ss) ? '보합~소폭 변동, 급매매 자제' : '분산·적립 시 소폭 + 가능'}. 중기(3~5년): ${stats.sipsinCount.resource >= 2 ? '학습·자격·저축 병행 시 원금+α' : '장기 분산 시 누적 수익 기대'}.`,
    '투자 조언은 참고용이며, 손익 책임은 본인에게 있습니다. 세금·수수료·환율·유동성을 반드시 포함해 판단하세요.',
  ]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart */
export function buildCareerNarrative(chart) {
  const { meta, stats, daewoon } = chart
  const mp = chart.saju.pillars[2]
  const [domSip] = dominantSipsin(stats)
  return [
    `【직업·적성 상세】 월주 ${mp?.pillar.ganzi || '—'}(${mp?.stemSipsin || '—'})는 사회·직업·청년기 환경의 바탕입니다. ${SIPSIN_KO[domSip] || domSip} 기운이 직업 선택의 큰 축입니다.`,
    stats.sipsinCount.power >= 2
      ? '관성형: 공무원·대기업·법·의료·관리직·조직 내 승진 루트가 잘 맞을 수 있습니다.'
      : stats.sipsinCount.wealth >= 2
        ? '재성형: 영업·무역·금융·자영업·실무·매출 직결 직군이 잘 맞을 수 있습니다.'
        : stats.sipsinCount.output >= 2
          ? '식상형: IT·디자인·콘텐츠·교육·기획·마케팅·기술 창출 직군이 잘 맞을 수 있습니다.'
          : stats.sipsinCount.resource >= 2
            ? '인성형: 연구·학술·상담·의료·자격 기반 전문직이 잘 맞을 수 있습니다.'
            : '비겁·혼합형: 창업·프리랜스·코칭·독립 프로젝트 여력을 검토해 보세요.',
    dwNarrative(daewoon.current),
    `이직·전환 유리 시기: ${daewoon.future[0] ? `${daewoon.future[0].age}세 전후 ${daewoon.future[0].ganzi} 대운` : '현재 대운 후반'}. 준비는 6~12개월 전부터(포트폴리오·자격·네트워크).`,
    '직업 추천은 적성 참고용입니다. 시장·경력·경제 조건·본인 흥미를 함께 고려하세요.',
  ]
}

/** @param {ReturnType<import('./calculator.js').computeChart>} chart — 매운맛 전용 추가 */
export function buildSpicyExtras(chart) {
  const { meta, stats, saju } = chart
  const pillars = saju.pillars
  const month = meta.currentYear
  return {
    yearly: [
      `${month}년 연간 키워드: ${stats.sipsinCount.wealth >= 2 ? '현금흐름·거래·성과' : stats.sipsinCount.power >= 2 ? '책임·승진·규율' : stats.sipsinCount.output >= 2 ? '표현·프로젝트·기술' : '자기정비·학습·관계'}.`,
      `${month}년 상반기: 기존 습관·부채·관계 정리. 하반기: 대운 기운에 맞는 한 가지(수입·자격·이직·투자)를 집중.`,
      `${month + 1}년 전망: 대운·십신 흐름상 ${stats.sipsinCount.self >= 2 ? '경쟁·지출·고집 관리' : '저축·분산·네트워크'}가 핵심.`,
    ],
    pillars: [
      pillarLine(pillars[0], '시주(말년·실행·자녀):'),
      pillarLine(pillars[1], '일주(나·배우자궁):'),
      pillarLine(pillars[2], '월주(사회·직업):'),
      pillarLine(pillars[3], '년주(유년·조상):'),
    ],
    elementBalance: Object.entries(stats.elementCount)
      .map(([k, v]) => `${ELEMENT_KO[k] || k} ${v}개`)
      .join(' · '),
  }
}

/** @param {string[]} paragraphs @param {'mild'|'medium'|'spicy'} level */
export function sliceNarrative(paragraphs, level) {
  if (level === 'mild') return paragraphs.slice(0, 2)
  if (level === 'medium') return paragraphs
  return paragraphs
}

/** @param {string[]} paragraphs @param {'medium'|'spicy'} level */
export function appendLevelParagraphs(paragraphs, level, extra) {
  if (level === 'spicy' && extra?.yearly) {
    return [...paragraphs, '—', ...extra.yearly]
  }
  return paragraphs
}
