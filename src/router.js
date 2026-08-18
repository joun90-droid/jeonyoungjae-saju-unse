import { meta as aboutMeta, render as renderAbout } from './pages/about.js'
import { bind as bindChart, meta as chartMeta, render as renderChart } from './pages/chart.js'
import { bind as bindContact, meta as contactMeta, render as renderContact } from './pages/contact.js'
import { bind as bindCompat, meta as compatibilityMeta, render as renderCompatibility } from './pages/compatibility.js'
import { bind as bindDaily, meta as dailyMeta, render as renderDaily } from './pages/daily-fortune.js'
import { meta as faqMeta, render as renderFaq } from './pages/faq.js'
import { meta as fiveMeta, render as renderFive } from './pages/five-elements.js'
import { bind as bindGoogleLogin, meta as loginMeta, render as renderLogin } from './pages/google-login.js'
import { meta as guideMeta, render as renderGuide } from './pages/guide-index.js'
import { bind as bindKakaoCb, meta as kakaoMeta, render as renderKakaoCb } from './pages/kakao-login.js'
import { crumbs, pageTemplate } from './pages/layout.js'
import { bind as bindMbti, meta as mbtiMeta, render as renderMbti } from './pages/mbti.js'
import { bind as bindNaverCb, meta as naverMeta, render as renderNaverCb } from './pages/naver-login.js'
import { meta as failMeta, render as renderFail } from './pages/payment-fail.js'
import { bind as bindPayOk, meta as payOkMeta, render as renderPayOk } from './pages/payment-success.js'
import { bind as bindPremium, meta as premiumMeta, render as renderPremium } from './pages/premium.js'
import { bind as bindPricing, meta as pricingMeta, render as renderPricing } from './pages/pricing.js'
import { meta as privacyMeta, render as renderPrivacy } from './pages/privacy.js'
import { bind as bindPsy, meta as psyMeta, render as renderPsy } from './pages/psychology-test.js'
import { SITE } from './pages/site.js'
import { bind as bindTarot, meta as tarotMeta, render as renderTarot } from './pages/tarot.js'
import { meta as termsMeta, render as renderTerms } from './pages/terms.js'
import { meta as zodiacMeta, render as renderZodiac } from './pages/zodiac-signs.js'

const HOME_META = {
  path: '/',
  title: '영재 사주운 | 재물·연애·투자·직업·시기별 운세',
  description: '사주팔자 기반 과거·현재·미래, 재물운, 연애운, 투자 손익 참고, 직업 적성 분석. 출생 정보는 브라우저에서만 계산됩니다.',
}

const POLICY_PAGE = { type: 'page' }
const ROUTES = {
  '/': { type: 'home', ...HOME_META },
  '/privacy': { ...POLICY_PAGE, ...privacyMeta, render: renderPrivacy },
  '/privacy-policy': { ...POLICY_PAGE, ...privacyMeta, render: renderPrivacy },
  '/terms': { ...POLICY_PAGE, ...termsMeta, render: renderTerms },
  '/terms-of-service': { ...POLICY_PAGE, ...termsMeta, render: renderTerms },
  '/about': { ...POLICY_PAGE, ...aboutMeta, render: renderAbout },
  '/about-us': { ...POLICY_PAGE, ...aboutMeta, render: renderAbout },
  '/contact': { type: 'page', ...contactMeta, render: renderContact, bind: bindContact },
  '/guide': { type: 'page', ...guideMeta, render: renderGuide },
  '/five-elements': { type: 'page', ...fiveMeta, render: renderFive },
  '/zodiac-signs': { type: 'page', ...zodiacMeta, render: renderZodiac },
  '/compatibility': { type: 'page', ...compatibilityMeta, render: renderCompatibility, bind: bindCompat },
  '/faq': { type: 'page', ...faqMeta, render: renderFaq },
  '/daily-fortune': { type: 'page', ...dailyMeta, render: renderDaily, bind: bindDaily },
  '/psychology-test': { type: 'page', ...psyMeta, render: renderPsy, bind: bindPsy },
  '/chart': { type: 'page', ...chartMeta, render: renderChart, bind: bindChart },
  '/tarot': { type: 'page', ...tarotMeta, render: renderTarot, bind: bindTarot },
  '/mbti': { type: 'page', ...mbtiMeta, render: renderMbti, bind: bindMbti },
  '/premium': { type: 'page', ...premiumMeta, render: renderPremium, bind: bindPremium },
  '/pricing': { type: 'page', ...pricingMeta, render: renderPricing, bind: bindPricing },
  '/login': { type: 'page', ...loginMeta, render: renderLogin, bind: bindGoogleLogin },
  '/signup': { type: 'page', ...loginMeta, title: '회원가입 | 영재 사주운', render: renderLogin, bind: bindGoogleLogin },
  '/auth/kakao/callback': { type: 'page', ...kakaoMeta, render: renderKakaoCb, bind: bindKakaoCb },
  '/auth/naver/callback': { type: 'page', ...naverMeta, render: renderNaverCb, bind: bindNaverCb },
  '/payment-success': { type: 'page', ...payOkMeta, render: renderPayOk, bind: bindPayOk },
  '/payment-fail': { type: 'page', ...failMeta, render: renderFail },
}

export function normalizePath(pathname) {
  let path = pathname || '/'
  if (path.endsWith('/index.html')) path = path.slice(0, -11) || '/'
  if (path.length > 1) path = path.replace(/\/+$/, '')
  return path || '/'
}

function notFound() {
  return pageTemplate({
    kicker: '404',
    title: '페이지를 찾을 수 없습니다',
    lead: '주소가 바뀌었거나 잘못 입력된 것 같습니다.',
    crumbsHtml: crumbs([
      { href: '/', label: '홈' },
      { label: '없음' },
    ]),
    body: `
      <p>홈에서 사주를 분석하거나, 가이드에서 오행·띠·궁합을 읽어 보세요.</p>
      <p><a href="/">홈으로</a> · <a href="/guide">사주 가이드</a> · <a href="/faq">FAQ</a></p>
    `,
  })
}

function setCanonical(path) {
  const href = `${SITE.origin}${path === '/' ? '/' : path}`
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
  return href
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function updateHead(route, path) {
  const title = route.title || HOME_META.title
  const description = route.description || HOME_META.description
  const url = setCanonical(path)
  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
}

function navMatch(path) {
  if (path === '/') return '/'
  if (path === '/daily-fortune') return '/daily-fortune'
  if (path === '/compatibility' || path === '/psychology-test' || path === '/chart' || path === '/tarot' || path === '/mbti') {
    return '/compatibility'
  }
  if (path === '/faq') return '/faq'
  if (path === '/privacy' || path === '/privacy-policy') return '/privacy-policy'
  if (path === '/terms' || path === '/terms-of-service') return '/terms-of-service'
  if (path === '/about' || path === '/about-us') return '/about-us'
  if (path === '/contact') return '/contact'
  if (path === '/premium' || path === '/pricing' || path === '/login' || path === '/signup' || path === '/payment-success' || path === '/payment-fail') {
    return '/pricing'
  }
  return '/guide'
}

function updateNav(path) {
  const key = navMatch(path)
  document.querySelectorAll('.site-nav a, .legal-nav a').forEach((a) => {
    const href = a.getAttribute('href')
    a.classList.toggle('active', href === key)
  })
}

function renderRoute() {
  const homeView = document.getElementById('homeView')
  const pageView = document.getElementById('pageView')
  if (!homeView || !pageView) return

  const path = normalizePath(location.pathname)
  document.body.classList.toggle('is-login', path === '/login' || path === '/signup')
  const route = ROUTES[path]
  const isHome = !route || route.type === 'home'

  if (isHome && route) {
    homeView.hidden = false
    pageView.hidden = true
    pageView.innerHTML = ''
    updateHead(route, '/')
    updateNav('/')
    window.scrollTo(0, 0)
    return
  }

  if (isHome && !route) {
    homeView.hidden = true
    pageView.hidden = false
    pageView.innerHTML = notFound()
    updateHead({
      title: '페이지 없음 | 영재 사주운',
      description: '요청하신 페이지를 찾을 수 없습니다.',
    }, path)
    updateNav(path)
    window.scrollTo(0, 0)
    return
  }

  homeView.hidden = true
  pageView.hidden = false
  pageView.innerHTML = route.render()
  route.bind?.(pageView)
  updateHead(route, path)
  updateNav(path)
  window.scrollTo(0, 0)
}

function isInternalNav(anchor) {
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false
  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false
  try {
    const url = new URL(anchor.href, location.origin)
    return url.origin === location.origin
  } catch {
    return false
  }
}

export function startRouter() {
  document.addEventListener('click', (e) => {
    const back = e.target.closest('[data-back]')
    if (back) {
      e.preventDefault()
      try {
        const ref = document.referrer
        if (ref && new URL(ref).origin === location.origin && history.length > 1) {
          history.back()
          return
        }
      } catch { /* fall through */ }
      history.pushState({}, '', '/')
      renderRoute()
      return
    }
    const a = e.target.closest('a[href]')
    if (!isInternalNav(a)) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const url = new URL(a.href, location.origin)
    const next = normalizePath(url.pathname)
    const cur = normalizePath(location.pathname)
    if (next === cur && url.search === location.search && !url.hash) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    history.pushState({}, '', `${next}${url.search}`)
    renderRoute()
  })

  window.addEventListener('popstate', renderRoute)
  renderRoute()
}
