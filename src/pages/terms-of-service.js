import { SITE } from './site.js'
import { crumbs, pageTemplate } from './layout.js'

export const TermsOfService = {
  title: '이용약관',
  path: '/terms-of-service',
  content: `
    <div class="policy-page">
      <section>
        <h2>1. 서비스 개요</h2>
        <p>본 서비스(영재 사주운)는 사주를 기반으로 한 재미있는 운세 분석 도구입니다. 본 서비스는 오락 및 참고용이며, 투자, 의료, 법률 조언이 아닙니다.</p>
      </section>
      <section>
        <h2>2. 이용 조건</h2>
        <p>사용자는 본 서비스를 법률을 위반하지 않는 범위 내에서만 사용할 수 있습니다. 불법적인 목적으로의 사용은 금지됩니다.</p>
      </section>
      <section>
        <h2>3. 면책 조항</h2>
        <p>본 앱은 사주 분석 결과에 대한 정확성을 보장하지 않습니다. 사용자가 본 서비스의 결과를 바탕으로 한 의사결정에 대해 본 개발자는 책임을 지지 않습니다.</p>
      </section>
      <section>
        <h2>4. 지적재산권</h2>
        <p>본 앱의 모든 콘텐츠, 디자인, 로직은 영재(개발자)에게 속하며, 무단 복제, 배포는 금지됩니다.</p>
      </section>
      <section>
        <h2>5. 서비스 변경/중단</h2>
        <p>개발자는 예고 없이 서비스를 변경하거나 중단할 권리가 있습니다.</p>
      </section>
      <section>
        <h2>6. 기타</h2>
        <p>본 약관은 한국 법률에 따라 해석되며, 분쟁은 소재지 관할 법원에서 처리됩니다. 문의: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
      </section>
      <p class="page-date">최종 수정: ${SITE.effectiveDate}</p>
    </div>
  `,
}

export const meta = {
  path: TermsOfService.path,
  title: `${TermsOfService.title} | 영재 사주운`,
  description: '영재 사주운 이용약관. 오락·참고용 서비스이며 투자·의료·법률 조언이 아닙니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Terms',
    title: TermsOfService.title,
    lead: '서비스를 이용하면 본 약관에 동의한 것으로 봅니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: TermsOfService.title }]),
    body: TermsOfService.content,
  })
}
