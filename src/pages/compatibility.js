import { computeChart } from '../engine/calculator.js'
import { analyzeCompatibility } from '../engine/compat-score.js'
import { birthFieldsHtml, bindBirthFields, readBirthFields } from '../lib/birth-fields.js'
import { loadBirth } from '../lib/store.js'
import { shareContent, shareFeedback } from '../lib/share.js'
import { checkSubscription, lockHtml } from '../lib/subscription.js'
import { crumbs, infoBox, pageTemplate, relatedGuides } from './layout.js'

export const meta = {
  path: '/compatibility',
  title: '사주 궁합 | 영재 사주운',
  description: '나와 상대 사주로 감정·성격·운세·재물·결혼 궁합 점수를 계산합니다. 띠 궁합 가이드도 함께 제공합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Compatibility',
    title: '사주로 보는 궁합',
    lead: '두 사람의 생년월일시로 다섯 가지 궁합 점수를 냅니다. 아래 가이드는 점수 읽는 법입니다.',
    crumbsHtml: crumbs([
      { href: '/', label: '홈' },
      { href: '/guide', label: '가이드' },
      { label: '궁합' },
    ]),
    related: relatedGuides('/compatibility'),
    body: `
      <div id="compatTool"></div>
      <h2>띠 궁합만으로 부족한 이유</h2>
      <p>흔히 말하는 띠 궁합은 두 사람의 년지가 삼합인지, 충인지 정도를 본 짧은 규칙입니다. 친구 사이 농담으로는 충분하지만, 연애·결혼·사업 파트너를 그 한 줄로 결정하기는 어렵습니다. 같은 해 생이라도 월·일·시가 다르면 일간과 일지가 달라지고, 관계에서 실제로 부딪히는 지점은 대부분 일주(나와 가까운 사람)와 관·식·재의 균형입니다.</p>
      <p>삼합(예: 해묘미, 인오술)은 함께 있을 때 특정 오행이 커져 분위기가 잘 맞는다는 해석이 많고, 육충은 속도·가치관이 어긋나 이동과 논쟁이 잦다는 해석이 많습니다. 충이어도 서로의 부족을 채워 주는 상생이면 성장 커플이 되고, 합이어도 같은 오행만 과하면 서로 비슷한 약점을 키우기도 합니다. 길흉의 낙인보다 “어떤 충돌이 반복되는가”를 보는 편이 실용적입니다.</p>

      <h2>일간과 오행 보완</h2>
      <p>관계가 편해지는 패턴 중 하나는 오행이 서로를 생(生)해 주는 경우입니다. 목이 강한 사람에게 약한 화가 있으면 표현이 살아나고, 금이 날 선 사람에게 적절한 화가 있으면 말이 부드러워집니다. 반대로 양쪽이 같은 극 관계만 반복하면, 일상에서 잔소리와 반발이 기본값이 되기 쉽습니다. <a href="/five-elements">오행 가이드</a>의 상생·상극을 두 사람의 일간에 대입해 보면, 싸움의 주제가 의외로 단순해 보일 때가 있습니다.</p>
      <p>연애운 탭은 한 사람의 원국이 관계를 다루는 방식—표현(식상), 책임·시선(관성), 현실 과제(재성)—을 보여 줍니다. 두 사람 모두 분석을 돌려 일간과 현재 대운을 비교하면, “내가 지금 예민한 해인가, 상대가 바쁜 대운인가”를 구별하는 데 도움이 됩니다. 상대를 바꾸기보다 시기의 결을 읽고 약속을 조정하는 쪽이 갈등 비용을 줄입니다.</p>

      <h2>궁합을 현명하게 쓰는 경계</h2>
      <p>궁합은 폭력·불신·중독을 정당화하는 도구가 될 수 없습니다. “사주가 안 맞아서”라는 말은 대화를 닫을 때 가장 많이 쓰입니다. 건강하지 않은 관계는 명리보다 안전이 우선입니다. 또한 사업 동업 궁합도 성격 보완만으로 성립하지 않습니다. 지분, 현금 흐름, 의사결정 규칙이 문서에 있어야 합니다.</p>
      <p>이 페이지 위쪽 계산기는 두 사주를 한 화면에서 겹쳐 점수를 냅니다. 일간·대운·재성 차이를 다섯 항목으로 나눈 참고값이며 결혼·이별·동업을 결정하는 근거가 아닙니다. 띠 관계의 큰 그림은 <a href="/zodiac-signs">12띠 해설</a>을 참고하시면 됩니다.</p>
      <p>가족 궁합도 연애와 결이 다릅니다. 부모·자녀는 선택 관계가 아니므로 “안 맞음”을 단정하기보다, 의사결정 방식(빠른 화 vs 느린 토)의 차이를 일정과 돈의 규칙으로 번역하는 편이 낫습니다. 형제·친구는 비겁이 비슷하면 의리가 강하지만 같은 자리를 두고 다툴 수 있어, 역할을 나누면 관계가 오래 갑니다. 직장 상사·동료와의 궁합은 관성·식상의 온도 차이로 나타나기 쉽습니다. 보고 방식을 문서와 구두 중 무엇으로 맞출지 합의하는 것이 명리 처방보다 즉시 효과가 있습니다. 동업은 일간 궁합보다 손익 분배 조항이 먼저입니다.</p>
      <p>합이 잘 되는 해에 결혼을 서두르는 것도, 충이 있는 해에 이별을 단정하는 것도 같은 조급함입니다. 대운이 바뀌는 해에는 감정 기복이 커질 수 있으니, 법적·금전적 결정은 잠시 숨을 고르는 기간을 두는 것이 좋습니다. 폭력·금전 갈취·연락 두절이 반복되면 사주가 아니라 안전 문제입니다. 필요하면 주변과 전문 기관의 도움을 먼저 받으십시오. 연애운 점수가 높은 해에도 상대의 동의·경계·경제 조건을 건너뛰면 관계가 빚이 됩니다. 점수는 온도계이지 허가증이 아닙니다. 궁합 이야기를 상대 동의 없이 퍼뜨리거나, 점수로 관계를 압박하는 것은 명리의 쓰임이 아닙니다. 상대의 사주는 그 사람의 개인정보에 가깝습니다.</p>
      ${infoBox('<p>궁합 글은 관계 패턴을 이해하기 위한 가이드입니다. 특정 상대와의 성사·파국을 예언하거나 보장하지 않습니다.</p>', 'warn')}
    `,
  })
}

export function bind(root) {
  const el = root.querySelector('#compatTool')
  if (!el) return
  const me = loadBirth()
  el.innerHTML = `
    <form id="compatForm" class="compat-form">
      <div class="compat-col">
        <h3>나</h3>
        ${birthFieldsHtml('me', me)}
      </div>
      <div class="compat-col">
        <h3>상대</h3>
        ${birthFieldsHtml('you', null)}
      </div>
      <button type="submit" class="btn-primary">궁합 보기</button>
    </form>
    <div id="compatOut"></div>
  `
  el.querySelectorAll('.mini-birth').forEach((wrap) => bindBirthFields(wrap))
  el.querySelector('#compatForm')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const cols = el.querySelectorAll('.compat-col')
    const a = readBirthFields(cols[0])
    const b = readBirthFields(cols[1])
    let result
    try {
      result = analyzeCompatibility(computeChart(a), computeChart(b))
    } catch (err) {
      alert('계산 오류: ' + (err.message || err))
      return
    }
    const out = el.querySelector('#compatOut')
    out.innerHTML = `
      <header class="compat-total">
        <h3>총점 ${result.avg}점</h3>
        <span class="score ${result.level.cls}">${result.level.label}</span>
        <p>${result.labels.me} × ${result.labels.you}</p>
      </header>
      <div class="gauge-list">
        ${result.cats.map((c) => `
          <div class="gauge">
            <div class="gauge-head"><strong>${c.title}</strong><span class="score ${c.level.cls}">${c.score}</span></div>
            <div class="meter-bar"><i style="width:${c.score}%"></i></div>
            <p>${c.text}</p>
          </div>`).join('')}
      </div>
      <h4>주의할 점</h4>
      <ul>${result.cautions.map((t) => `<li>${t}</li>`).join('')}</ul>
      <h4>관계 유지 조언</h4>
      <ul>${result.tips.map((t) => `<li>${t}</li>`).join('')}</ul>
      ${lockHtml(`
        <p class="detail-text">${result.detail}</p>
        <p class="detail-text"><strong>시기 참고</strong> — ${result.marriageHint}</p>
      `, '상세·시기 참고는 프리미엄')}
      <button type="button" class="btn-secondary" id="compatShare">카톡·링크로 공유</button>
      <p class="privacy">상대 생년월일은 동의 없이 공유하지 마세요.</p>
    `
    out.querySelectorAll('[data-open-paywall]').forEach((btn) => {
      btn.addEventListener('click', () => checkSubscription('궁합 상세·시기 참고는 프리미엄입니다.'))
    })
    out.querySelector('#compatShare')?.addEventListener('click', async () => {
      const mode = await shareContent({
        title: `우리 궁합 ${result.avg}점 | 영재 사주운`,
        text: result.cats.map((c) => `${c.title} ${c.score}`).join(' · '),
        url: `${location.origin}/compatibility`,
      })
      const msg = shareFeedback(mode)
      if (msg) alert(msg)
    })
    out.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

