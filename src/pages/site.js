import { BUSINESS } from '../config/business.js'

// 사업자·연락처 값은 src/config/business.js 한 곳에서만 관리합니다.
export const SITE = {
  name: '영재 사주운',
  operator: BUSINESS.operator,
  email: BUSINESS.email,
  phone: BUSINESS.phone,
  businessName: BUSINESS.businessName,
  businessRegNo: BUSINESS.businessRegNo,
  address: BUSINESS.address,
  origin: 'https://jeonyoungjae-saju-unse.web.app',
  effectiveDate: '2026년 8월 18일',
}

// 푸터 링크 그룹 — 경로는 기존 그대로, 라벨만 짧게. 그룹당 최대 4개.
export const FOOTER_GROUPS = [
  {
    title: '서비스',
    links: [
      { href: '/daily-fortune', label: '오늘의 운세' },
      { href: '/compatibility', label: '궁합' },
      { href: '/chart', label: '만세력' },
      { href: '/tarot', label: '타로' },
    ],
  },
  {
    title: '알아보기',
    links: [
      { href: '/guide', label: '사주 가이드' },
      { href: '/five-elements', label: '오행' },
      { href: '/zodiac-signs', label: '12띠' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: '회사',
    links: [
      { href: '/about-us', label: '소개' },
      { href: '/contact', label: '연락처' },
      { href: '/privacy-policy', label: '개인정보처리방침' },
      { href: '/terms-of-service', label: '이용약관' },
    ],
  },
]
