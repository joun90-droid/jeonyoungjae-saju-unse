import { SITE } from './site.js'
import { crumbs, pageTemplate } from './layout.js'

export const AboutUs = {
  title: '소개',
  path: '/about-us',
  content: `
    <div class="policy-page">
      <section>
        <h2>이 앱은 무엇인가요?</h2>
        <p>영재 사주운은 동양의 오래된 사주 철학을 현대적으로 해석한 웹앱입니다. 생년월일을 입력하면 천간지지, 오행, 대운 등을 기반으로 현재의 운세를 분석해 드립니다.</p>
      </section>
      <section>
        <h2>기술적 특징</h2>
        <p>본 앱은 다음과 같은 기술로 구현되었습니다:</p>
        <ul>
          <li>Vite + Vanilla JS (빠른 로딩)</li>
          <li>브라우저 기반 사주 계산 (출생 정보는 서버로 보내지 않음)</li>
          <li>선택적 Google/Kakao 로그인 (구독·결제용)</li>
          <li>Firebase Hosting · Authentication</li>
          <li>오픈소스 라이브러리 활용</li>
        </ul>
      </section>
      <section>
        <h2>개발자 소개</h2>
        <p><strong>영재 (Jeon Young Jae)</strong></p>
        <p>풀스택 개발자로서 다양한 웹 애플리케이션을 개발해 왔습니다. 동양 철학과 기술의 결합에 관심이 있으며, 사용자 경험을 중시하는 개발을 지향합니다.</p>
        <p>📧 연락처: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
      </section>
      <section>
        <h2>문의 및 피드백</h2>
        <p>앱에 대한 의견이나 개선사항을 제안하고 싶으시다면 <a href="/contact">연락처</a> 또는 위의 이메일로 연락해 주세요. 성실하게 답변하겠습니다.</p>
      </section>
      <p class="page-date">© 2026 영재 사주운. All rights reserved.</p>
    </div>
  `,
}

export const meta = {
  path: AboutUs.path,
  title: `${AboutUs.title} | 영재 사주운`,
  description: '영재 사주운 소개. 브라우저에서 사주를 계산하는 웹앱과 개발자 전영재 연락처를 안내합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'About',
    title: '영재 사주운 소개',
    lead: '생년월일시로 사주팔자와 운세 흐름을 정리하는 웹 서비스입니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: AboutUs.title }]),
    body: AboutUs.content,
  })
}
