import { SITE } from './site.js'
import { crumbs, pageTemplate } from './layout.js'

export const Contact = {
  title: '연락처',
  path: '/contact',
  content: `
    <div class="policy-page">
      <section>
        <h2>문의하기</h2>
        <p>앱 사용 중 문제가 생기거나 의견이 있으시면 아래 이메일 또는 폼으로 연락해 주세요.</p>
      </section>
      <aside class="info-callout">
        <p><strong>📧 ${SITE.email}</strong></p>
        <p>일반적으로 24시간 이내에 회신드립니다.</p>
      </aside>
      <section>
        <h2>문의 내용</h2>
        <p>다음과 같은 내용으로 문의할 수 있습니다:</p>
        <ul>
          <li>앱 버그 또는 오류 보고</li>
          <li>기능 개선 제안</li>
          <li>개인정보 관련 요청</li>
          <li>기타 일반 문의</li>
        </ul>
      </section>
      <section>
        <h2>메일 보내기</h2>
        <form class="contact-form" id="contactForm">
          <label>이름
            <input type="text" name="name" maxlength="80" required placeholder="이름 또는 닉네임">
          </label>
          <label>회신 이메일
            <input type="email" name="email" required placeholder="you@example.com">
          </label>
          <label>제목
            <input type="text" name="subject" maxlength="120" required placeholder="문의 제목">
          </label>
          <label>내용
            <textarea name="message" rows="7" required placeholder="오류 화면, 개선 아이디어, 협업 제안 등을 적어 주세요."></textarea>
          </label>
          <button type="submit" class="btn-primary">이메일 앱으로 보내기</button>
          <p class="privacy">메일 앱이 열리면 내용을 확인한 뒤 전송해 주세요. 생년월일시·주민번호 등 민감정보는 적지 마세요.</p>
        </form>
        <p id="contactFallback" class="contact-fallback" hidden></p>
      </section>
      <section>
        <h2>응답 시간</h2>
        <p>평일 기준 24시간 이내에 성실하게 답변하도록 노력합니다. 사주 개별 상담·투자 자문은 제공하지 않습니다.</p>
      </section>
      <p class="page-date">최종 수정: ${SITE.effectiveDate}</p>
    </div>
  `,
}

export const meta = {
  path: Contact.path,
  title: `${Contact.title} | 영재 사주운`,
  description: `영재 사주운 연락처. 오류 제보·개선 제안은 ${SITE.email} 으로 보내 주세요.`,
}

export function render() {
  return pageTemplate({
    kicker: 'Contact',
    title: Contact.title,
    lead: `${SITE.name}에 대한 제안, 오류 제보, 협업 문의는 아래 이메일 또는 폼으로 보내 주세요.`,
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: Contact.title }]),
    body: Contact.content,
  })
}

export function bind(root) {
  const form = root.querySelector('#contactForm')
  const fallback = root.querySelector('#contactFallback')
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(form)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const subject = String(data.get('subject') || '').trim()
    const message = String(data.get('message') || '').trim()
    const body = `보낸 사람: ${name}\n회신: ${email}\n\n${message}`
    const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(`[${SITE.name}] ${subject}`)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
    if (fallback) {
      fallback.hidden = false
      fallback.innerHTML = `메일 앱이 열리지 않으면 <a href="mailto:${SITE.email}">${SITE.email}</a>로 직접 보내 주세요.`
    }
  })
}
