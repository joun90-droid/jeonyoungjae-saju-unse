import { BUSINESS, businessLine } from '../config/business.js'
import { FOOTER_GROUPS } from '../pages/site.js'

const group = ({ title, links }) => `
  <div class="footer-group">
    <h2 class="footer-group-title">${title}</h2>
    <ul>
      ${links.map((l) => `<li><a href="${l.href}">${l.label}</a></li>`).join('')}
    </ul>
  </div>`

export function footerHtml() {
  return `
    <nav class="footer-groups" aria-label="사이트 메뉴">
      ${FOOTER_GROUPS.map(group).join('')}
    </nav>
    <div class="footer-bottom">
      <p>본 서비스는 오락·참고용이며, 투자·의료·법률 조언이 아닙니다.</p>
      <p class="footer-biz">${businessLine()}</p>
      <p>문의: <a class="footer-mail" href="mailto:${BUSINESS.email}">${BUSINESS.email}</a></p>
      <p>© 영재 사주운</p>
    </div>`
}

export function mountFooter(root = document.getElementById('siteFooter')) {
  if (!root) return
  root.innerHTML = footerHtml()
}
