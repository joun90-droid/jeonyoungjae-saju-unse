import { SITE } from './site.js'

export const AboutUs = {
  title: '운영자 소개',
  path: '/about-us',
}

export const meta = {
  path: AboutUs.path,
  title: '운영자 소개 | 영재 사주운',
  description: '영재 사주운 운영자 전영재 소개. 사주팔자와 오행으로 오늘의 흐름을 읽고, 출생 정보는 브라우저에서만 계산합니다.',
}

export function render() {
  return `
    <article class="operator-page">
      <nav class="crumbs" aria-label="현재 위치">
        <a href="/">홈</a><span class="sep" aria-hidden="true">›</span><span class="current">운영자 소개</span>
      </nav>
      <header class="operator-hero">
        <p class="eyebrow">About · 운영자 소개</p>
        <h1>사주팔자로 오늘의 흐름을 읽습니다</h1>
        <p class="page-lead">태어난 순간의 천간·지지를 지도처럼 펼쳐, 지금 서 있는 자리와 다가올 시기를 차분히 풀어 드립니다.</p>
      </header>
      <div class="operator-body prose">
        <p>안녕하세요. <strong>영재 사주운</strong>을 운영하는 <strong>${SITE.operator}</strong>입니다.</p>
        <p>사주는 점괘로 인생을 확정하는 도구가 아니라, <strong>오행의 균형과 대운의 방향</strong>을 읽는 오래된 언어입니다. 재물·연애·직업·타이밍을 한 번에 단정하지 않고, 지금 흐름이 어디에 무게가 실리는지부터 보여 드리려 합니다.</p>
        <p>만세력·일진·궁합은 브라우저에서 바로 계산합니다. <strong>생년월일시는 서버로 올리지 않습니다.</strong> 로그인과 구독은 기록을 남기고 싶을 때만 쓰면 되고, 게스트로도 기본 운세는 볼 수 있습니다.</p>
        <p>미신으로 겁을 주거나, 비싼 상담을 떠미는 서비스는 만들지 않겠습니다. 궁금한 띠·오행·궁합은 가이드에 풀어 두었고, 더 깊은 해석이 필요하면 문의로 남겨 주세요.</p>
        <p class="operator-sign">— ${SITE.operator}<br>영재 사주운 · 운영자</p>
      </div>
      <aside class="operator-box">
        문의·제안: <a href="/contact">문의하기 페이지</a> · <a href="mailto:${SITE.email}">${SITE.email}</a>
      </aside>
      <div class="operator-actions">
        <a class="btn-primary" href="/">홈으로</a>
        <a class="btn-ghost" href="/contact">문의하기</a>
      </div>
    </article>`
}
