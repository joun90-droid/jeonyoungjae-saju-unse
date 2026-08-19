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
        <h2>6. 사업자 정보</h2>
        <ul>
          <li>상호: ${SITE.businessName} (대표: ${SITE.operator})</li>
          <li>사업자등록번호: ${SITE.businessRegNo}</li>
          <li>사업장 주소: ${SITE.address}</li>
          <li>연락처: ${SITE.phone} · <a href="mailto:${SITE.email}">${SITE.email}</a></li>
        </ul>
      </section>
      <section>
        <h2>7. 유료 서비스(구독) 이용조건</h2>
        <p>유료 서비스는 <strong>월간 프리미엄(₩4,900)</strong>과 <strong>평생 프리미엄(₩29,900)</strong> 두 가지이며, 결제 즉시 활성화됩니다.</p>
        <ul>
          <li><strong>서비스 제공기간</strong>: 월간 프리미엄은 결제일로부터 30일간, 평생 프리미엄은 기간 제한 없이 이용할 수 있습니다. 디지털 콘텐츠 특성상 별도의 배송은 없습니다.</li>
          <li><strong>결제 수단·시기</strong>: 결제는 카드·간편결제(Toss Payments, 카카오페이 등 지원 수단)로 1회 결제되며, <strong>자동으로 재결제되지 않습니다.</strong> 계속 이용하려면 만료 전 다시 결제해야 합니다.</li>
          <li><strong>정기결제 여부</strong>: 본 서비스는 정기 자동결제(구독 자동갱신) 방식을 사용하지 않습니다. "구독 취소"는 다음 결제를 막는 것이 아니라, 남은 이용 기간 뒤 프리미엄이 무료 플랜으로 전환되도록 표시하는 기능이며 <a href="/account">구독 관리</a>에서 언제든 취소·재개할 수 있습니다.</li>
          <li><strong>취소·환불 규정</strong>: 결제일로부터 7일 이내이고 프리미엄 콘텐츠를 실제로 이용하지 않은 경우 전액 환불됩니다. 프리미엄 콘텐츠를 1회 이상 열람하는 등 서비스 이용을 시작한 경우, 전자상거래 등에서의 소비자보호에 관한 법률에 따라 청약철회가 제한될 수 있습니다. 이미 지난 이용 기간에 대한 일할 환불은 제공하지 않습니다.</li>
          <li><strong>이의신청·문의</strong>: 결제·환불 관련 이의는 <a href="mailto:${SITE.email}">${SITE.email}</a> 또는 ${SITE.phone}로 접수해 주시면 영업일 기준 3일 이내 답변드립니다.</li>
        </ul>
      </section>
      <section>
        <h2>8. 기타</h2>
        <p>본 약관은 한국 법률에 따라 해석되며, 분쟁은 소재지 관할 법원에서 처리됩니다.</p>
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
