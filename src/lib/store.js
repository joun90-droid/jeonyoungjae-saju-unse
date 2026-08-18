const KEY = 'saju-unse-v1'

function empty() {
  return {
    userId: '',
    birth: null,
    dailyFortune: {},
    dailyViews: {},
    notificationEnabled: false,
    notificationHour: 6,
    lastNotifyDate: '',
    psychology: null,
    tarot: null,
    mbti: null,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function getState() {
  const s = load()
  if (!s.userId) {
    s.userId = `u_${Math.random().toString(36).slice(2, 12)}`
    save(s)
  }
  return s
}

export function patchState(partial) {
  const next = { ...getState(), ...partial }
  save(next)
  return next
}

export function getUserId() {
  return getState().userId
}

export function saveBirth(birth) {
  return patchState({ birth })
}

export function loadBirth() {
  return getState().birth
}

export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function saveDailyFortune(date, fortune) {
  const s = getState()
  s.dailyFortune = { ...s.dailyFortune, [date]: fortune }
  s.dailyViews = { ...s.dailyViews, [date]: Date.now() }
  save(s)
  return fortune
}

export function getDailyFortune(date) {
  return getState().dailyFortune[date] || null
}

export function listDailyDates() {
  return Object.keys(getState().dailyFortune).sort()
}
