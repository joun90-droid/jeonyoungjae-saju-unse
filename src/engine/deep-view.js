/**
 * 심층 명식 화면 — deep.js / life-wave.js 결과를 카드 HTML로 그린다.
 * 사이트의 기존 카드 클래스(.card.fortune, .kv, .narrative)를 그대로 쓴다.
 */

import { scoreLevel } from './calculator.js'
import { lifeWaveSeries } from './viz.js'
import { analyzeZiwei } from './ziwei.js'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** 사주 여덟 글자를 십신·지장간·12운성까지 붙여 표로 */
export function pillarTableBlock(chart) {
  const rows = chart.deep?.pillars
  if (!rows?.length) return ''
  return `
    <article class="card fortune detail">
      <header><h3>사주 여덟 글자 정밀 판독</h3></header>
      <div class="deep-table-wrap">
        <table class="deep-table">
          <thead><tr><th>주</th><th>간지</th><th>천간 십신</th><th>지지 십신</th><th>지장간(여기·중기·본기)</th><th>12운성</th></tr></thead>
          <tbody>
            ${rows.map((p) => `
              <tr${p.pillar === 'day' ? ' class="is-day"' : ''}>
                <td>${esc(p.label)}</td>
                <td><strong>${esc(p.ganzi)}</strong></td>
                <td>${esc(p.stemTenGod === 'day_master' ? '일간(나)' : p.stemTenGod)}</td>
                <td>${esc(p.branchTenGod)}</td>
                <td>${esc(p.jijanggan.join(' · '))}</td>
                <td>${esc(p.unseong)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </article>`
}

/** 신강약 · 용신 · 격국 — 판단의 근거를 전부 펼쳐 보여 준다 */
export function dayMasterBlock(chart, level = 'medium') {
  const dm = chart.deep?.dayMaster
  if (!dm) return ''
  const b = dm.breakdown
  const lv = scoreLevel(Math.max(5, Math.min(95, dm.strengthScore)))

  const reasons = level === 'mild' ? dm.yongsinReason.slice(0, 2) : dm.yongsinReason
  const rootRows = b.rootDetail.map((r) => `
    <div><dt>${esc(r.pillar)}지 ${esc(r.branch)}</dt><dd>+${r.score}${r.capped ? ' (상한 적용)' : ''} — ${r.layers.map((l) => `${esc(l.layerKo)} ${esc(l.stem)}${l.weight ? ` +${l.weight}` : ' 0'}`).join(', ')}</dd></div>`).join('')

  return `
    <article class="card fortune detail">
      <header>
        <h3>일간 ${esc(dm.stem)}(${esc(dm.elementKo)}) — ${esc(dm.strengthKo)}</h3>
        <span class="score ${lv.cls}">${dm.strengthScore}점</span>
      </header>
      <p class="summary">${esc(dm.gyeokguk)}${dm.gyeokgukStatus === 'provisional' ? ' (임시 판정)' : ''} · 용신 ${esc(dm.yongsinKo)} · 기신 ${esc(dm.gisinKo)}</p>
      <dl class="kv">
        <div><dt>득령</dt><dd>${b.deukryeong}점 — ${esc(b.deukryeongNote)}</dd></div>
        <div><dt>득지(통근)</dt><dd>${b.deukji}점</dd></div>
        ${rootRows}
        <div><dt>득세</dt><dd>${b.deukse}점${b.seDetail.length ? ` — ${esc(b.seDetail.join(', '))}` : ' — 주변 천간의 지원 없음'}</dd></div>
        <div><dt>격국</dt><dd>${esc(dm.gyeokguk)} — ${esc(dm.gyeokgukReason.join(' / '))}</dd></div>
        ${dm.outerPatternStatus === 'candidate' ? `<div><dt>외격</dt><dd>${esc(dm.outerPatternName)} 성립 가능</dd></div>` : ''}
      </dl>
      <div class="narrative">${reasons.map((r) => `<p>${esc(r)}</p>`).join('')}</div>
      ${dm.ambiguity?.isAmbiguous ? `<div class="deep-dive"><p>${esc(dm.ambiguity.plainHint)}</p></div>` : ''}
    </article>`
}

/** 원국의 합충형파해 · 신살 · 공망 */
export function interactionBlock(chart) {
  const deep = chart.deep
  if (!deep) return ''
  const items = deep.interactions
  const shinsal = deep.shinsal
  const gm = deep.gongmang

  return `
    <article class="card fortune detail">
      <header><h3>원국의 관계 · 신살 · 공망</h3></header>
      ${items.length ? `<ul class="tag-list">${items.map((i) => `
        <li class="tag ${i.tone === 'good' ? 'tag-good' : 'tag-warn'}">
          <strong>${esc(i.label)}</strong> <span>${esc(i.where)}</span> — ${esc(i.note)}
        </li>`).join('')}</ul>`
        : '<p class="summary">뚜렷한 합·충·형·파·해가 없습니다. 그만큼 외부 사건보다 본인 선택이 흐름을 좌우합니다.</p>'}
      <dl class="kv">
        ${shinsal.length ? `<div><dt>신살</dt><dd>${shinsal.map((s) => `${esc(s.label)}(${esc(s.branch)}) — ${esc(s.basis)}`).join(' · ')}</dd></div>` : ''}
        ${gm?.day ? `<div><dt>일주 공망</dt><dd>${esc(gm.day.branches.join('·'))}${gm.hitPillars.length ? ` — 원국에서 ${esc(gm.hitPillars.join(', '))}가 공망에 듭니다` : ' — 원국에 걸리는 자리는 없습니다'}</dd></div>` : ''}
        ${gm?.year ? `<div><dt>년주 공망</dt><dd>${esc(gm.year.branches.join('·'))}</dd></div>` : ''}
      </dl>
    </article>`
}

/** 연도별 파동 — 꺾은선 + 표 */
export function lifeWaveBlock(chart, level = 'medium') {
  const wave = chart.lifeWave
  if (!wave?.rows?.length) return ''
  const span = level === 'mild' ? { from: wave.currentSeun?.year - 3, to: wave.currentSeun?.year + 7 } : {}
  const series = lifeWaveSeries(chart, span)
  if (!series.length) return ''

  const W = 720, H = 180, PAD = 24
  const step = series.length > 1 ? (W - PAD * 2) / (series.length - 1) : 0
  const y = (score) => PAD + (H - PAD * 2) * (1 - score / 100)
  const pts = series.map((s, i) => `${(PAD + i * step).toFixed(1)},${y(s.score).toFixed(1)}`).join(' ')

  const cur = wave.currentSeun
  const rows = level === 'mild' ? series.slice(0, 6) : series

  return `
    <article class="card fortune detail">
      <header>
        <h3>연도별 운의 파동</h3>
        ${cur ? `<span class="score ${scoreLevel(cur.score100).cls}">${cur.year} ${esc(cur.ganzi)} ${cur.score100}</span>` : ''}
      </header>
      <p class="summary">용신 ${esc(chart.deep.dayMaster.yongsinKo)}·기신 ${esc(chart.deep.dayMaster.gisinKo)}와 원국 지지의 충·형·합을 해마다 계산한 곡선입니다. 50이 평년입니다.</p>
      <div class="wave-wrap">
        <svg class="wave-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="연도별 운세 지수 추이">
          <line x1="${PAD}" y1="${y(50)}" x2="${W - PAD}" y2="${y(50)}" class="wave-base"/>
          <polyline points="${pts}" class="wave-line"/>
          ${series.map((s, i) => `<circle cx="${(PAD + i * step).toFixed(1)}" cy="${y(s.score).toFixed(1)}" r="${s.isCurrent ? 5 : 2.5}" class="wave-dot ${s.isCurrent ? 'is-now' : ''}"><title>${s.year} ${esc(s.ganzi)} · ${s.score}</title></circle>`).join('')}
        </svg>
      </div>
      <div class="deep-table-wrap">
        <table class="deep-table">
          <thead><tr><th>연도</th><th>나이</th><th>세운</th><th>지수</th><th>특이사항</th></tr></thead>
          <tbody>
            ${rows.map((s) => `
              <tr${s.isCurrent ? ' class="is-day"' : ''}>
                <td>${s.year}</td><td>${s.age}세</td><td>${esc(s.ganzi)}</td>
                <td><span class="score ${s.level.cls}">${s.score}</span></td>
                <td>${esc(flagText(s.flags, s.volatility))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${wave.best && wave.worst ? `<dl class="kv">
        <div><dt>가장 강한 해</dt><dd>${wave.best.year}년 ${esc(wave.best.seun)} (${wave.best.age}세)</dd></div>
        <div><dt>가장 눌리는 해</dt><dd>${wave.worst.year}년 ${esc(wave.worst.seun)} (${wave.worst.age}세)</dd></div>
      </dl>` : ''}
    </article>`
}

const FLAG_KO = {
  'daeunSeunChung': '대운·세운 충',
  'stress.chung': '충',
  'stress.xing': '형',
  'stress.pa': '파',
  'stress.hai': '해',
  'stress.wonjin': '원진',
  'stress.stemChung': '천간충',
  'stress.gongmang': '공망',
  'liuhe': '육합',
  'banhe': '반합',
  'stemHap': '천간합',
}

function flagText(flags, volatility) {
  const names = (flags || []).map((f) => FLAG_KO[f]).filter(Boolean)
  if (volatility) names.push(`변동성 ${volatility}`)
  return names.length ? names.join(' · ') : '평온'
}

/** 화기가 떨어진 궁이 무엇을 다루는 자리인지 */
function huaJiTopic(ziwei) {
  const p = ziwei.palaces?.find((x) => x.name === ziwei.huaJiPalace)
  return p ? p.topic : ''
}

/** 자미두수 요약 (덤프에 자미두수가 있을 때만) */
export function ziweiBlock(ziwei) {
  if (!ziwei || ziwei.error) return ''
  const fin = ziwei.financePalace
  const fort = ziwei.fortunePalace
  const starLine = (p) => p ? [...p.majorStars, ...p.luckyStars, ...p.shaStars].map((s) => s.name + (s.sihua ? `(${s.sihua})` : '')).join(' ') || '주성 없음(공궁)' : '—'

  return `
    <article class="card fortune detail">
      <header><h3>자미두수 명반 요약</h3></header>
      <p class="summary">${esc(ziwei.bureau.label)} · 명궁 ${esc(ziwei.mingPalaceBranch)} · 신궁 ${esc(ziwei.bodyPalaceBranch)}</p>
      <dl class="kv">
        <div><dt>재백궁</dt><dd>${esc(starLine(fin))}</dd></div>
        <div><dt>복덕궁</dt><dd>${esc(starLine(fort))}</dd></div>
        <div><dt>생년 사화</dt><dd>${ziwei.natalSihua.map((s) => `${esc(s.star)} ${esc(s.transform)} → ${esc(s.palace || '—')}`).join(' · ')}</dd></div>
        ${ziwei.transit ? `<div><dt>${ziwei.transit.year} 유년 사화</dt><dd>${ziwei.transit.sihua.map((s) => `${esc(s.star)} ${esc(s.transform)} → ${esc(s.palace || '—')}`).join(' · ')}</dd></div>` : ''}
        <div><dt>화기 주의</dt><dd>${esc(ziwei.huaJiStar || '—')} → ${esc(ziwei.huaJiPalace || '—')}${huaJiTopic(ziwei) ? ` — ${esc(huaJiTopic(ziwei))} 쪽에서 집착·소모가 생기기 쉽습니다` : ''}</dd></div>
      </dl>
    </article>`
}

/**
 * 심층 탭 전체.
 * 자미두수는 이 탭을 열 때만 계산한다 — 다른 화면까지 느려지지 않게.
 */
export function deepPanelHtml(chart, level = 'medium', ziwei = undefined) {
  const zw = ziwei === undefined ? safeZiwei(chart) : ziwei
  return [
    dayMasterBlock(chart, level),
    pillarTableBlock(chart),
    interactionBlock(chart),
    lifeWaveBlock(chart, level),
    ziweiBlock(zw),
  ].join('')
}

function safeZiwei(chart) {
  const input = chart.saju?.input
  if (!input || input.unknownTime) return null
  try {
    return analyzeZiwei(input, { year: chart.lifeWave?.currentSeun?.year })
  } catch {
    return null
  }
}
