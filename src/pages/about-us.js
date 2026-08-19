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
      <nav class="path-trail" aria-label="현재 위치">
        <a href="/">홈</a>
        <span class="path-gap">/</span>
        <span>운영자 소개</span>
      </nav>
      <p class="display-kicker">운영자 소개</p>
      <h1 class="display-title">사주팔자로<br>오늘의 흐름을 읽습니다</h1>
      <p class="display-lead">태어난 순간의 천간·지지를 지도처럼 펼쳐, 지금 서 있는 자리와 다가올 시기를 풀어 드립니다.</p>
      <div class="longform">
        <p>안녕하세요. 영재 사주운을 운영하는 ${SITE.operator}입니다.</p>
        <p>사주는 점괘로 인생을 확정하는 도구가 아니라, 오행의 균형과 대운의 방향을 읽는 오래된 언어입니다. 재물·연애·직업·타이밍을 한 번에 단정하지 않고, 지금 흐름이 어디에 무게가 실리는지부터 보여 드리려 합니다.</p>
        <p>만세력·일진·궁합은 브라우저에서 바로 계산합니다. 생년월일시는 서버로 올리지 않습니다. 로그인과 구독은 기록을 남기고 싶을 때만 쓰면 되고, 게스트로도 기본 운세는 볼 수 있습니다.</p>
        <p>미신으로 겁을 주거나, 비싼 상담을 떠미는 서비스는 만들지 않겠습니다. 궁금한 띠·오행·궁합은 가이드에 풀어 두었고, 더 깊은 해석이 필요하면 편지로 남겨 주세요.</p>
      </div>
      <p class="sign-off">
        <span>${SITE.operator}</span>
        영재 사주운 운영자
      </p>
      <p class="contact-line">
        문의 · 제안
        <a href="/contact">문의 페이지</a>
        <a href="mailto:${SITE.email}">${SITE.email}</a>
      </p>
      <p class="trail-links">
        <a class="trail-home" href="/">홈으로</a>
        <a class="trail-mail" href="/contact">문의하기</a>
      </p>
    </article>`
}
