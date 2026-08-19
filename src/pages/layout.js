import { GUIDE_LINKS, SITE } from './site.js'

export function crumbs(items) {
  return `<nav class="crumbs" aria-label="현재 위치">${items.map((it, i) => {
    const last = i === items.length - 1
    const sep = last ? '' : '<span class="sep" aria-hidden="true">›</span>'
    return last
      ? `<span class="current">${it.label}</span>`
      : `<a href="${it.href}">${it.label}</a>${sep}`
  }).join('')}</nav>`
}

export function relatedGuides(currentHref) {
  const links = GUIDE_LINKS.filter((l) => l.href !== currentHref)
  return `
    <nav class="card page-related" aria-label="관련 가이드">
      <h2>관련 가이드</h2>
      <div class="related-grid">
        ${links.map((l) => `<a href="${l.href}">${l.label}</a>`).join('')}
      </div>
      <a class="btn-ghost related-cta" href="/">운세 분석하러 가기</a>
    </nav>`
}

export function pageTemplate({ kicker, title, lead, crumbsHtml, body, related }) {
  return `
    <article class="page">
      <div class="page-actions">
        <button type="button" class="back-btn" data-back>← 뒤로</button>
        <a href="/">홈으로</a>
      </div>
      ${crumbsHtml}
      <header class="card page-hero">
        <p class="eyebrow">${kicker}</p>
        <h1>${title}</h1>
        ${lead ? `<p class="page-lead">${lead}</p>` : ''}
      </header>
      <div class="card page-body prose">${body}</div>
      ${related || ''}
    </article>`
}

export function infoBox(html, kind = '') {
  return `<aside class="info-callout ${kind}">${html}</aside>`
}

export function mailtoNote() {
  return `<p>문의: <a href="mailto:${SITE.email}">${SITE.email}</a></p>`
}
