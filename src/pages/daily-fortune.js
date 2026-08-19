import { computeChart } from '../engine/calculator.js'
import { buildDailyFortune } from '../engine/daily.js'
import { birthFieldsHtml, bindBirthFields, readBirthFields } from '../lib/birth-fields.js'
import { shareContent, shareFeedback } from '../lib/share.js'
import { enableNotifications, maybeNotifyToday, setNotifyHour } from '../lib/notify.js'
import {
  dateKey, getDailyFortune, getState, listDailyDates, loadBirth, patchState, saveBirth, saveDailyFortune,
} from '../lib/store.js'
import { checkSubscription, isPremium, lockHtml } from '../lib/subscription.js'
import { crumbs, pageTemplate } from './layout.js'

export const meta = {
  path: '/daily-fortune',
  title: '오늘의 운세 | 영재 사주운',
  description: '사주 기반 오늘의 애정운·재물운·직업운·소망운. 브라우저에서 매일 갱신됩니다.',
}

const KEYS = [
  { id: 'love', title: '애정운' },
  { id: 'wealth', title: '재물운' },
  { id: 'job', title: '직업운' },
  { id: 'hope', title: '소망운' },
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return dateKey(d)
}

function ensureFortune(date, birth) {
  const stamp = `${birth.year}-${birth.month}-${birth.day}-${birth.hour}-${birth.gender}`
  const cached = getDailyFortune(date)
  if (cached && cached.stamp === stamp) return cached
  const chart = computeChart(birth)
  const fortune = { ...buildDailyFortune(chart, date), stamp }
  saveDailyFortune(date, fortune)
  return fortune
}

export function render() {
  return pageTemplate({
    kicker: 'Daily',
    title: '오늘의 운세',
    lead: '애정·재물·직업·소망 네 가지. 하루 한 번 같은 사주면 같은 결과가 나옵니다. 서버로 보내지 않습니다.',
    crumbsHtml: crumbs([{ href: '/', label: '홈' }, { label: '오늘의 운세' }]),
    body: '<div id="dailyRoot"></div>',
  })
}

export function bind(root) {
  const el = root.querySelector('#dailyRoot')
  if (!el) return
  maybeNotifyToday()
  mount(el, dateKey())
}

function mount(el, date) {
  const birth = loadBirth()
  const state = getState()
  if (!birth) {
    el.innerHTML = `
      <p>먼저 출생 정보를 저장하면 매일 운세가 계산됩니다.</p>
      <form id="dailyBirth">${birthFieldsHtml('daily', null)}
        <button type="submit" class="btn-primary">저장하고 오늘 운세 보기</button>
      </form>`
    bindBirthFields(el)
    el.querySelector('#dailyBirth')?.addEventListener('submit', (e) => {
      e.preventDefault()
      saveBirth(readBirthFields(el))
      mount(el, date)
    })
    return
  }

  const fortune = ensureFortune(date, birth)
  const premium = isPremium()
  const today = dateKey()
  const ageLimit = premium ? 400 : 7
  const dates = new Set([...listDailyDates(), today])
  for (let i = 0; i < 35; i++) dates.add(daysAgo(i))
  const sorted = [...dates].sort().reverse()

  el.innerHTML = `
    <div class="tool-toolbar">
      <label>날짜
        <input type="date" id="dailyDate" value="${date}">
      </label>
      <button type="button" class="btn-ghost" id="btnShare">공유</button>
    </div>
    <div class="fortune-grid">
      ${KEYS.map((k) => {
        const item = fortune[k.id]
        return `
          <article class="fortune-mini">
            <header>
              <h3>${k.title}</h3>
              <span class="score ${item.level.cls}">${item.score}</span>
            </header>
            <p class="one-liner">${item.text}</p>
            ${lockHtml(`<p class="detail-text">${item.detail}</p>`, '한 줄은 무료 · 상세는 프리미엄')}
          </article>`
      }).join('')}
    </div>
    <h3 class="job-heading">최근 운세</h3>
    <div class="cal-grid">
      ${sorted.slice(0, 35).map((d) => {
        const ago = (new Date(today) - new Date(d)) / 86400000
        const locked = !premium && ago > ageLimit
        return `<button type="button" class="cal-day ${d === date ? 'active' : ''} ${locked ? 'locked' : ''}" data-date="${d}">${d.slice(5)}${locked ? ' 잠김' : ''}</button>`
      }).join('')}
    </div>
    <p class="privacy">${premium ? '이력이 이 기기에 저장됩니다.' : '무료는 최근 7일만 열립니다.'}</p>
    <div class="notify-box">
      <label class="check"><input type="checkbox" id="notifyOn" ${state.notificationEnabled ? 'checked' : ''}> 브라우저 알림 (방문 시, ${premium ? '설정 시각 이후' : '오전 6시 이후'})</label>
      ${premium ? `<label class="notify-hour">시각 <input type="number" id="notifyHour" min="0" max="23" value="${state.notificationHour || 6}"></label>` : '<p class="privacy">알림 시간 변경은 프리미엄입니다. 서버 푸시(FCM)는 비용·Blaze 플랜이 필요해 넣지 않았습니다.</p>'}
    </div>
    <p class="privacy">운세는 이 브라우저에만 저장됩니다. Firebase에 올리지 않습니다.</p>
  `

  el.querySelectorAll('[data-open-paywall]').forEach((b) => {
    b.addEventListener('click', () => checkSubscription('오늘의 운세 상세·이력 무제한은 프리미엄입니다.'))
  })
  el.querySelector('#dailyDate')?.addEventListener('change', (e) => {
    const v = e.target.value
    if (!v) return
    const ago = (new Date(today) - new Date(v)) / 86400000
    if (!premium && ago > 7) {
      checkSubscription('7일 이전 이력은 프리미엄입니다.')
      e.target.value = date
      return
    }
    mount(el, v)
  })
  el.querySelectorAll('.cal-day').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('locked')) {
        checkSubscription('7일 이전 이력은 프리미엄입니다.')
        return
      }
      mount(el, btn.dataset.date)
    })
  })
  el.querySelector('#btnShare')?.addEventListener('click', async () => {
    const t = KEYS.map((k) => `${k.title} ${fortune[k.id].score}점`).join(' · ')
    const mode = await shareContent({
      title: `오늘의 운세 ${date} | 영재 사주운`,
      text: t,
      url: `${location.origin}/daily-fortune`,
    })
    const msg = shareFeedback(mode)
    if (msg) alert(msg)
  })
  el.querySelector('#notifyOn')?.addEventListener('change', async (e) => {
    if (e.target.checked) {
      const ok = await enableNotifications()
      e.target.checked = ok
    } else {
      patchState({ notificationEnabled: false })
    }
  })
  el.querySelector('#notifyHour')?.addEventListener('change', (e) => setNotifyHour(e.target.value))
}
