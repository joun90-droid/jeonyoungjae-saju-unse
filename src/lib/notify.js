import { dateKey, getState, patchState } from './store.js'
import { isPremium } from './subscription.js'

export async function enableNotifications() {
  if (!('Notification' in window)) {
    alert('이 브라우저는 알림을 지원하지 않습니다.')
    return false
  }
  const perm = await Notification.requestPermission()
  const on = perm === 'granted'
  patchState({ notificationEnabled: on })
  return on
}

export function setNotifyHour(hour) {
  patchState({ notificationHour: Number(hour) || 6 })
}

export function maybeNotifyToday() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const s = getState()
  if (!s.notificationEnabled) return
  const hour = new Date().getHours()
  const target = isPremium() ? (s.notificationHour || 6) : 6
  if (hour < target) return
  const today = dateKey()
  if (s.lastNotifyDate === today) return
  try {
    new Notification('영재 사주운', { body: '오늘의 운세가 준비됐습니다!', tag: 'daily-fortune' })
    patchState({ lastNotifyDate: today })
  } catch {
    /* ignore */
  }
}
