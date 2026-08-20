import { SITE } from './site.js'
import { crumbs, pageTemplate } from './layout.js'

export const PrivacyPolicy = {
  title: '개인정보처리방침',
  path: '/privacy-policy',
  content: `
    <div class="policy-page">
      <section>
        <h2>1. 개인정보 수집 범위</h2>
        <p>본 앱(영재 사주운)은 사주 계산을 위해 생년월일과 성별 정보를 브라우저에서만 사용합니다. 이 값은 서버에 저장되지 않습니다.</p>
        <p>Google, Kakao 또는 Naver로 로그인하면 이메일, 이름, 프로필 사진이 계정 식별을 위해 Firebase Authentication에 저장됩니다. 결제를 하면 주문번호·금액·구독 기간이 서버에 기록됩니다. 문의 폼을 이용하면 이름·이메일·문의 내용이 접수됩니다.</p>
      </section>
      <section>
        <h2>2. 데이터 처리 방식 및 보유 기간</h2>
        <p>사주 계산은 브라우저의 로컬 환경에서만 처리되며, 생년월일·성별은 서버로 전송되지 않습니다. 로그인·결제 정보는 Firebase(Authentication/Functions)와 카카오페이를 통해 처리됩니다.</p>
        <p>회원 정보(이메일·이름·프로필 사진)는 탈퇴 또는 계정 삭제 요청 시까지 보유하며, 요청 즉시 지체 없이 파기합니다. 결제·구독 기록은 전자상거래법 등 관계 법령에 따른 보존 의무 기간(대금결제 및 재화 등의 공급에 관한 기록: 5년) 동안 보관 후 파기합니다. 문의 내용은 처리 완료 후 1년간 보관 후 파기합니다.</p>
      </section>
      <section>
        <h2>3. 광고 및 분석 (Google AdSense)</h2>
        <p>본 앱은 Google AdSense를 통해 광고를 게시합니다. Google은 사용자의 방문 기록과 관심사를 바탕으로 맞춤형 광고를 제공할 수 있습니다. Google의 광고 정책은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보 보호 정책</a> 및 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">광고에 사용되는 정보</a>에서 확인하실 수 있습니다.</p>
        <p>맞춤 광고는 <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 끌 수 있습니다.</p>
      </section>
      <section>
        <h2>4. 쿠키 사용</h2>
        <p>본 앱은 사용자 경험 개선과 광고 게재를 위해 쿠키를 사용할 수 있습니다. 언제든지 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.</p>
      </section>
      <section>
        <h2>5. 사용자 권리</h2>
        <p>사용자는 언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있습니다. 요청은 <a href="mailto:${SITE.email}">${SITE.email}</a>으로 문의해 주세요. 로그아웃은 화면 상단 프로필 메뉴에서 할 수 있습니다.</p>
      </section>
      <section>
        <h2>6. 결제 정보</h2>
        <p>유료 구독(월간 정기결제)은 카카오페이를 통해 처리됩니다. 카드·계좌 등 결제수단 정보는 본 앱 서버에 저장되지 않으며, 매달 자동 청구를 위한 정기결제 식별값(sid)만 서버에 보관됩니다. 결제에는 카카오페이의 결제 정책이 적용됩니다.</p>
      </section>
      <section>
        <h2>7. 정책 변경</h2>
        <p>본 개인정보처리방침은 예고 없이 변경될 수 있습니다. 변경사항이 있으면 본 페이지에 공지됩니다.</p>
      </section>
      <section>
        <h2>8. 사업자 정보</h2>
        <ul>
          <li>상호: ${SITE.businessName} (대표: ${SITE.operator})</li>
          <li>사업자등록번호: ${SITE.businessRegNo}</li>
          <li>사업장 주소: ${SITE.address}</li>
          <li>연락처: ${SITE.phone} · <a href="mailto:${SITE.email}">${SITE.email}</a></li>
        </ul>
      </section>
      <p class="page-date">최종 수정: ${SITE.effectiveDate}</p>
    </div>
  `,
}

export const meta = {
  path: PrivacyPolicy.path,
  title: `${PrivacyPolicy.title} | 영재 사주운`,
  description: '영재 사주운 개인정보처리방침. 생년월일은 브라우저에서만 계산되며, 수집 항목·보유 기간, Google AdSense 광고·쿠키 사용을 안내합니다.',
}

export function render() {
  return pageTemplate({
    kicker: 'Privacy',
    title: PrivacyPolicy.title,
    lead: '사주 입력값은 서버에 저장하지 않습니다. 광고·쿠키 사용을 안내합니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: PrivacyPolicy.title }]),
    body: PrivacyPolicy.content,
  })
}
