const { onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const express = require('express')
const cors = require('cors')

initializeApp()

const TOSS_SECRET_KEY = defineSecret('TOSS_SECRET_KEY')
const KAKAOPAY_CID = defineSecret('KAKAOPAY_CID')
const KAKAOPAY_SECRET_KEY = defineSecret('KAKAOPAY_SECRET_KEY')
const KAKAO_REST_API_KEY = defineSecret('SAJU_KAKAO_REST_API_KEY')
const KAKAO_CLIENT_SECRET = defineSecret('SAJU_KAKAO_CLIENT_SECRET')
const NAVER_CLIENT_ID = defineSecret('SAJU_NAVER_CLIENT_ID')
const NAVER_CLIENT_SECRET = defineSecret('SAJU_NAVER_CLIENT_SECRET')
const RESEND_API_KEY = defineSecret('RESEND_API_KEY')

const CONTACT_TO = 'joun90@gmail.com'
const CONTACT_FROM = '영재 사주운 문의 <onboarding@resend.dev>'

const MONTHLY = 4900
// 결제 API 문서: https://developers.kakaopay.com (정기결제 CID는 카카오 별도 심사 필요)
const KAKAOPAY_HOST = 'https://open-api.kakaopay.com'
const ALLOWED = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://jeonyoungjae-saju-unse.web.app',
  'https://jeonyoungjae-saju-unse.firebaseapp.com',
]

function secretValue(param) {
  const v = (param.value() || '').trim()
  return v && v !== 'unset' ? v : ''
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ))
}

const OTHER_PRODUCT_KAKAO = 'a306f0ec0377e4d6c21746eed1c59af2'
const OTHER_PRODUCT_NAVER = 'dQGR7vaNyM47CAXcoDzt'

function sajuClientId(value, blocked) {
  const key = secretValue(value)
  if (!key || key === blocked) return ''
  return key
}

async function requireUser(req, res) {
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!idToken) {
    res.status(401).json({ error: '로그인이 필요합니다.' })
    return null
  }
  try {
    return await getAuth().verifyIdToken(idToken)
  } catch {
    res.status(401).json({ error: '로그인 세션이 유효하지 않습니다. 다시 로그인해 주세요.' })
    return null
  }
}

async function upsertAuthUser(uid, profile) {
  const auth = getAuth()
  try {
    await auth.updateUser(uid, profile)
    return
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
  }
  try {
    await auth.createUser({ uid, ...profile })
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const { email, ...rest } = profile
      await auth.createUser({ uid, ...rest })
      return
    }
    throw err
  }
}

function planFromOrder(orderId, requested) {
  if (requested === 'monthly' || requested === 'lifetime') return requested
  if (String(orderId).includes('_lifetime_')) return 'lifetime'
  return 'monthly'
}

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// 결제 후 7일 이내 + 프리미엄 기능을 한 번도 쓰지 않은 경우에만 자동 환불 대상입니다
// (이용약관 제6조 청약철회 조항과 동일한 기준).
function computeRefundEligible(data) {
  if (!data || data.plan !== 'premium_monthly') return false
  if (data.status === 'refunded') return false
  if (data.hasUsedPremium) return false
  if (!data.startedAt) return false
  const started = new Date(data.startedAt).getTime()
  if (Number.isNaN(started)) return false
  return Date.now() - started <= REFUND_WINDOW_MS
}

// 카카오페이 결제 API 호출 헬퍼. 실제 CID/시크릿키를 발급받으면 카카오페이 개발자 문서를
// 기준으로 요청/응답 필드를 다시 한번 대조해 주세요(문서 갱신 가능성이 있습니다).
async function kakaoPayRequest(path, body, secretKey) {
  const res = await fetch(`${KAKAOPAY_HOST}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `SECRET_KEY ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.extras?.method_result_message || json.msg || '카카오페이 요청에 실패했습니다.')
    err.detail = json
    throw err
  }
  return json
}

function kakaoPayOrderId(uid) {
  const safe = String(uid || 'guest').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40)
  return `saju_${safe}_monthly_${Date.now()}`
}

const app = express()
app.use(cors({ origin: ALLOWED, credentials: true }))
app.use(express.json())

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {}
  if (!name || !email || !message) {
    return res.status(400).json({ error: '이름·이메일·내용은 필수입니다.' })
  }

  const db = getFirestore()
  let stored = false
  try {
    await db.collection('saju_contact_messages').add({
      name: String(name).slice(0, 80),
      email: String(email).slice(0, 200),
      subject: String(subject || '').slice(0, 120),
      message: String(message).slice(0, 4000),
      createdAt: FieldValue.serverTimestamp(),
    })
    stored = true
  } catch (err) {
    logger.error('문의 Firestore 저장 실패', err)
  }

  let emailed = false
  const apiKey = secretValue(RESEND_API_KEY)
  if (apiKey) {
    const mailSubject = `[영재 사주운] ${subject || '문의'} — ${name}`
    const html = `
      <div style="font-family: -apple-system, 'Malgun Gothic', sans-serif; max-width: 480px; margin: 0 auto; color: #1c1c1c;">
        <h1 style="font-size: 18px; margin: 0 0 16px;">사주운 문의</h1>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 6px 0; color: #888; width: 90px;">이름</td><td style="padding: 6px 0;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">이메일</td><td style="padding: 6px 0;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">제목</td><td style="padding: 6px 0;">${escapeHtml(subject || '')}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 12px 14px; background: #f4f4f4; border-radius: 10px; white-space: pre-wrap; font-size: 14px;">${escapeHtml(message)}</div>
      </div>`
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: CONTACT_FROM, to: [CONTACT_TO], reply_to: email, subject: mailSubject, html }),
      })
      if (r.ok) {
        emailed = true
      } else {
        logger.error(`Resend 발송 실패 (${r.status}): ${await r.text()}`)
      }
    } catch (err) {
      logger.error('Resend 호출 오류', err)
    }
  } else {
    logger.warn('RESEND_API_KEY가 설정되지 않아 문의 메일을 보내지 못했습니다. Firestore에는 저장됨.')
  }

  if (!stored && !emailed) {
    return res.status(500).json({ error: '문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.' })
  }
  res.json({ ok: true, stored, emailed })
})

app.get('/api/profile', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const snap = await getFirestore().collection('saju_users').doc(decoded.uid).get()
  const data = snap.exists ? snap.data() : {}
  res.json({
    uid: decoded.uid,
    email: data.email || decoded.email || '',
    name: data.name || decoded.name || '',
    provider: data.provider || '',
    createdAt: data.createdAt || null,
    lastLoginAt: data.lastLoginAt || null,
  })
})

app.post('/api/profile', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const { email, name, photoURL, provider } = req.body || {}
  const ref = getFirestore().collection('saju_users').doc(decoded.uid)
  const prev = await ref.get()
  const payload = {
    email: String(email || decoded.email || '').slice(0, 200),
    name: String(name || decoded.name || '').slice(0, 80),
    photoURL: String(photoURL || '').slice(0, 500),
    provider: String(provider || 'password').slice(0, 40),
    lastLoginAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }
  if (!prev.exists) payload.createdAt = FieldValue.serverTimestamp()
  await ref.set(payload, { merge: true })
  res.json({ ok: true, uid: decoded.uid })
})

app.get('/api/subscription', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const snap = await getFirestore().collection('saju_subscriptions').doc(decoded.uid).get()
  if (!snap.exists) return res.json({ plan: 'free', status: 'none' })
  const data = snap.data()
  const endsAt = data.endsAt || null
  const expired = data.plan === 'premium_monthly' && endsAt && Date.now() > new Date(endsAt).getTime()
  res.json({
    plan: expired ? 'free' : (data.plan || 'free'),
    status: expired ? 'expired' : (data.status || 'active'),
    provider: data.provider || 'toss',
    startedAt: data.startedAt || null,
    endsAt,
    canceledAt: data.canceledAt ? data.canceledAt.toDate?.().toISOString() ?? data.canceledAt : null,
    amount: data.amount ?? null,
    method: data.method || null,
    orderId: data.orderId || null,
    hasUsedPremium: Boolean(data.hasUsedPremium),
    refundEligible: computeRefundEligible(data),
  })
})

app.post('/api/subscription/cancel', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const ref = getFirestore().collection('saju_subscriptions').doc(decoded.uid)
  const snap = await ref.get()
  if (!snap.exists) return res.status(400).json({ error: '취소할 구독이 없습니다.' })
  const data = snap.data()
  if (data.plan !== 'premium_monthly') {
    return res.status(400).json({ error: '평생 구독은 자동으로 갱신되지 않아 취소가 필요 없습니다. 환불 문의는 고객센터로 연락해 주세요.' })
  }
  const endsAt = data.endsAt || null
  if (endsAt && Date.now() > new Date(endsAt).getTime()) {
    return res.status(400).json({ error: '이미 만료된 구독입니다.' })
  }
  await ref.set({ status: 'canceled', canceledAt: FieldValue.serverTimestamp() }, { merge: true })
  res.json({ ok: true, plan: data.plan, status: 'canceled', endsAt })
})

app.post('/api/subscription/reactivate', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const ref = getFirestore().collection('saju_subscriptions').doc(decoded.uid)
  const snap = await ref.get()
  if (!snap.exists) return res.status(400).json({ error: '재활성화할 구독이 없습니다.' })
  const data = snap.data()
  const endsAt = data.endsAt || null
  if (data.plan !== 'premium_monthly' || !endsAt || Date.now() > new Date(endsAt).getTime()) {
    return res.status(400).json({ error: '재활성화할 수 없습니다. 기간이 이미 끝났다면 다시 구독해 주세요.' })
  }
  await ref.set({ status: 'active', canceledAt: FieldValue.delete() }, { merge: true })
  res.json({ ok: true, plan: data.plan, status: 'active', endsAt })
})

// 프리미엄 잠금 콘텐츠가 실제로 열람될 때 클라이언트가 호출합니다(services/subscription.js의
// lockHtml/requirePremium). 이후 7일 이내 자동환불 대상에서 제외하는 데 씁니다.
app.post('/api/subscription/mark-used', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const ref = getFirestore().collection('saju_subscriptions').doc(decoded.uid)
  const snap = await ref.get()
  if (!snap.exists) return res.json({ ok: true })
  const data = snap.data()
  if (data.plan === 'premium_monthly' && !data.hasUsedPremium) {
    await ref.set({ hasUsedPremium: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
  }
  res.json({ ok: true })
})

// 결제 후 7일 이내 + 미이용 시 자동환불. 이용약관 제6조 청약철회 조항을 그대로 구현합니다.
app.post('/api/subscription/refund', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return
  const ref = getFirestore().collection('saju_subscriptions').doc(decoded.uid)
  const snap = await ref.get()
  if (!snap.exists) return res.status(400).json({ error: '환불할 구독이 없습니다.' })
  const data = snap.data()
  if (!computeRefundEligible(data)) {
    const reason = data.hasUsedPremium
      ? '이미 프리미엄 기능을 이용하셔서 자동환불 대상이 아닙니다. 문의를 남겨 주세요.'
      : '결제일로부터 7일이 지났거나 환불 대상이 아닙니다. 문의를 남겨 주세요.'
    return res.status(400).json({ error: reason })
  }

  try {
    if (data.provider === 'kakaopay') {
      const cid = secretValue(KAKAOPAY_CID)
      const secretKey = secretValue(KAKAOPAY_SECRET_KEY)
      if (!cid || !secretKey || !data.tid) {
        return res.status(500).json({ error: '환불 처리에 필요한 결제 정보가 없습니다. 문의를 남겨 주세요.' })
      }
      await kakaoPayRequest('/online/v1/payment/cancel', {
        cid,
        tid: data.tid,
        cancel_amount: Number(data.amount) || MONTHLY,
        cancel_tax_free_amount: 0,
      }, secretKey)
      if (data.sid && !data.sidDeactivated) {
        try {
          await kakaoPayRequest('/online/v1/payment/manage/subscription/inactive', { cid, sid: data.sid }, secretKey)
        } catch (err) {
          logger.error(`환불 후 카카오페이 정기결제 비활성화 실패 uid=${decoded.uid}`, err.detail || err)
        }
      }
    } else {
      const secretKey = secretValue(TOSS_SECRET_KEY)
      if (!secretKey || !data.paymentKey) {
        return res.status(500).json({ error: '환불 처리에 필요한 결제 정보가 없습니다. 문의를 남겨 주세요.' })
      }
      const basicAuth = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
      const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${data.paymentKey}/cancel`, {
        method: 'POST',
        headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: '결제 후 7일 이내 미사용 환불' }),
      })
      const tossJson = await tossRes.json()
      if (!tossRes.ok) {
        logger.error('Toss 환불 실패', tossJson)
        return res.status(502).json({ error: tossJson.message || '환불 요청에 실패했습니다.' })
      }
    }

    const nowIso = new Date().toISOString()
    await ref.set({
      status: 'refunded',
      plan: 'free',
      endsAt: nowIso,
      sidDeactivated: true,
      refundedAt: nowIso,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    res.json({ ok: true, plan: 'free' })
  } catch (err) {
    logger.error(`환불 처리 오류 uid=${decoded.uid}`, err.detail || err)
    res.status(502).json({ error: err.message || '환불 처리 중 오류가 발생했습니다.' })
  }
})

function isSajuRedirect(redirectUri) {
  try {
    const url = new URL(redirectUri)
    if (!ALLOWED.includes(url.origin)) return false
    return url.pathname === '/auth/kakao/callback' || url.pathname === '/auth/naver/callback'
  } catch {
    return false
  }
}

app.post('/api/social-auth', async (req, res) => {
  const { provider, code, redirectUri, state } = req.body || {}
  if ((provider !== 'kakao' && provider !== 'naver') || !code || !redirectUri) {
    return res.status(400).json({ error: '잘못된 요청입니다.' })
  }
  if (!isSajuRedirect(redirectUri)) {
    return res.status(403).json({ error: '이 앱에서 허용하지 않는 로그인 경로입니다.' })
  }
  try {
    let uid
    let displayName
    let email
    let photoURL

    if (provider === 'kakao') {
      const clientId = sajuClientId(KAKAO_REST_API_KEY, OTHER_PRODUCT_KAKAO)
      if (!clientId) return res.status(500).json({ error: '카카오 로그인이 아직 설정되지 않았습니다. 영재 사주운 전용 Kakao 앱이 필요합니다.' })
      const clientSecret = secretValue(KAKAO_CLIENT_SECRET)
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code,
      })
      if (clientSecret) params.set('client_secret', clientSecret)

      const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      })
      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok) {
        logger.error('Kakao 토큰 교환 실패', tokenJson)
        const kakaoErr = String(tokenJson.error_description || tokenJson.error || '')
        const needsSecret = /secret|KOE101|KOE010|invalid_client/i.test(kakaoErr)
        return res.status(401).json({
          error: needsSecret
            ? '카카오 클라이언트 시크릿이 맞지 않습니다. 카카오 콘솔에서 클라이언트 시크릿 사용을 끄거나, 시크릿 값을 알려 주세요.'
            : (kakaoErr ? `카카오 인증 실패: ${kakaoErr}` : '카카오 인증에 실패했습니다. Redirect URI를 Kakao Developers에 등록했는지 확인해 주세요.'),
        })
      }

      const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      })
      const me = await meRes.json()
      if (!meRes.ok || !me.id) {
        return res.status(401).json({ error: '카카오 사용자 정보를 가져오지 못했습니다.' })
      }
      uid = `saju_kakao_${me.id}`
      displayName = me.kakao_account?.profile?.nickname || undefined
      email = me.kakao_account?.email || undefined
      photoURL = me.kakao_account?.profile?.profile_image_url || undefined
    } else {
      const clientId = sajuClientId(NAVER_CLIENT_ID, OTHER_PRODUCT_NAVER)
      const clientSecret = secretValue(NAVER_CLIENT_SECRET)
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: '네이버 로그인이 아직 설정되지 않았습니다. 영재 사주운 전용 Naver 앱이 필요합니다.' })
      }
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: String(redirectUri || '').trim(),
        code: String(code || '').trim(),
        state: String(state || '').trim(),
      })
      const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`)
      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok || tokenJson.error || !tokenJson.access_token) {
        logger.error('Naver 토큰 교환 실패', tokenJson)
        const naverErr = String(tokenJson.error_description || tokenJson.error || '')
        return res.status(401).json({
          error: naverErr ? `네이버 인증 실패: ${naverErr}` : '네이버 인증에 실패했습니다. Callback URL을 Naver Developers에 등록했는지 확인해 주세요.',
        })
      }
      const meRes = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      })
      const me = await meRes.json()
      if (me.resultcode !== '00' || !me.response?.id) {
        return res.status(401).json({ error: '네이버 사용자 정보를 가져오지 못했습니다.' })
      }
      uid = `saju_naver_${me.response.id}`
      displayName = me.response.name || me.response.nickname || undefined
      email = me.response.email || undefined
      photoURL = me.response.profile_image || undefined
    }

    await upsertAuthUser(uid, { displayName, email, photoURL })
    await getFirestore().collection('saju_users').doc(uid).set({
      email: email || '',
      name: displayName || '',
      photoURL: photoURL || '',
      provider,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    const customToken = await getAuth().createCustomToken(String(uid).slice(0, 128), { provider, app: 'saju-unse' })
    res.json({ customToken })
  } catch (err) {
    logger.error('social-auth 오류', err)
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' })
  }
})

app.post('/api/toss/confirm', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return

  const { paymentKey, orderId, amount, plan: requestedPlan } = req.body || {}
  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ error: '필수 결제 정보가 없습니다.' })
  }

  // 클라이언트의 generateOrderId와 동일한 32자 절삭 규칙(Toss orderId 64자 제한 대응)
  const safeUid = String(decoded.uid).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32)
  if (!String(orderId).startsWith(`saju_${safeUid}_`)) {
    return res.status(403).json({ error: '본인의 주문이 아닙니다.' })
  }

  const planKey = planFromOrder(orderId, requestedPlan)
  if (planKey === 'lifetime') {
    return res.status(400).json({ error: '평생 구독은 더 이상 제공되지 않습니다. 월간 구독을 이용해 주세요.' })
  }
  if (Number(amount) !== MONTHLY) {
    return res.status(400).json({ error: '결제 금액이 요금제와 맞지 않습니다.' })
  }

  const secretKey = secretValue(TOSS_SECRET_KEY)
  if (!secretKey) {
    return res.status(500).json({ error: '결제 설정이 아직 완료되지 않았습니다(TOSS_SECRET_KEY).' })
  }

  try {
    const basicAuth = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: { Authorization: basicAuth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
    const tossJson = await tossRes.json()
    if (!tossRes.ok) {
      logger.error('Toss 결제 승인 실패', tossJson)
      return res.status(402).json({ error: tossJson.message || '결제 승인에 실패했습니다.' })
    }

    const startedAt = new Date().toISOString()
    const end = new Date()
    end.setDate(end.getDate() + 30)
    const endsAt = end.toISOString()
    const plan = 'premium_monthly'

    await getFirestore().collection('saju_subscriptions').doc(decoded.uid).set({
      plan,
      status: 'active',
      orderId,
      amount: Number(amount),
      paymentKey,
      method: tossJson.method || null,
      startedAt,
      endsAt,
      hasUsedPremium: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    res.json({ ok: true, plan, startedAt, endsAt })
  } catch (err) {
    logger.error('toss/confirm 오류', err)
    res.status(500).json({ error: '결제 승인 처리 중 오류가 발생했습니다.' })
  }
})

// --- 카카오페이 정기결제 ---
// 최초 등록: ready → (카카오페이 앱/웹에서 인증) → approve(sid 발급) → saju_subscriptions에 저장.
// 이후 매달 자동 청구는 아래 chargeKakaoPaySubscriptions 스케줄 함수가 sid로 처리합니다.
app.post('/api/kakaopay/ready', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return

  const cid = secretValue(KAKAOPAY_CID)
  const secretKey = secretValue(KAKAOPAY_SECRET_KEY)
  if (!cid || !secretKey) {
    return res.status(500).json({ error: '카카오페이 결제가 아직 설정되지 않았습니다(KAKAOPAY_CID/KAKAOPAY_SECRET_KEY).' })
  }

  const orderId = kakaoPayOrderId(decoded.uid)
  const origin = ALLOWED.includes(req.get('origin')) ? req.get('origin') : ALLOWED[ALLOWED.length - 1]
  const isMobile = /android|iphone|ipad|mobile/i.test(req.get('user-agent') || '')

  try {
    const ready = await kakaoPayRequest('/online/v1/payment/ready', {
      cid,
      partner_order_id: orderId,
      partner_user_id: String(decoded.uid).slice(0, 100),
      item_name: '영재 사주운 프리미엄 월간 정기결제',
      quantity: 1,
      total_amount: MONTHLY,
      tax_free_amount: 0,
      approval_url: `${origin}/payment-success?method=kakaopay&orderId=${encodeURIComponent(orderId)}`,
      cancel_url: `${origin}/payment-fail?method=kakaopay&reason=cancel`,
      fail_url: `${origin}/payment-fail?method=kakaopay&reason=fail`,
    }, secretKey)

    await getFirestore().collection('saju_kakaopay_pending').doc(orderId).set({
      uid: decoded.uid,
      tid: ready.tid,
      cid,
      createdAt: FieldValue.serverTimestamp(),
    })

    res.json({
      orderId,
      redirectUrl: (isMobile ? ready.next_redirect_mobile_url : ready.next_redirect_pc_url) || ready.next_redirect_pc_url,
    })
  } catch (err) {
    logger.error('kakaopay/ready 오류', err.detail || err)
    res.status(502).json({ error: err.message || '카카오페이 결제 준비에 실패했습니다.' })
  }
})

app.post('/api/kakaopay/approve', async (req, res) => {
  const decoded = await requireUser(req, res)
  if (!decoded) return

  const { orderId, pgToken } = req.body || {}
  if (!orderId || !pgToken) {
    return res.status(400).json({ error: '결제 승인 정보가 없습니다.' })
  }

  const cid = secretValue(KAKAOPAY_CID)
  const secretKey = secretValue(KAKAOPAY_SECRET_KEY)
  if (!cid || !secretKey) {
    return res.status(500).json({ error: '카카오페이 결제가 아직 설정되지 않았습니다.' })
  }

  const pendingRef = getFirestore().collection('saju_kakaopay_pending').doc(orderId)
  const pendingSnap = await pendingRef.get()
  if (!pendingSnap.exists) {
    return res.status(400).json({ error: '결제 요청을 찾을 수 없습니다. 다시 시도해 주세요.' })
  }
  const pending = pendingSnap.data()
  if (pending.uid !== decoded.uid) {
    return res.status(403).json({ error: '본인의 주문이 아닙니다.' })
  }

  try {
    const approved = await kakaoPayRequest('/online/v1/payment/approve', {
      cid,
      tid: pending.tid,
      partner_order_id: orderId,
      partner_user_id: String(decoded.uid).slice(0, 100),
      pg_token: pgToken,
    }, secretKey)

    if (!approved.sid) {
      logger.error('kakaopay/approve: 응답에 sid가 없습니다(정기결제용 CID가 맞는지 확인 필요)', approved)
    }

    const startedAt = new Date().toISOString()
    const end = new Date()
    end.setDate(end.getDate() + 30)
    const endsAt = end.toISOString()

    await getFirestore().collection('saju_subscriptions').doc(decoded.uid).set({
      plan: 'premium_monthly',
      status: 'active',
      provider: 'kakaopay',
      sid: approved.sid || null,
      sidDeactivated: false,
      tid: pending.tid || null,
      orderId,
      amount: MONTHLY,
      method: 'kakaopay',
      startedAt,
      endsAt,
      nextChargeAt: endsAt,
      chargeFailCount: 0,
      hasUsedPremium: false,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    await pendingRef.delete()

    res.json({ ok: true, plan: 'premium_monthly', startedAt, endsAt })
  } catch (err) {
    logger.error('kakaopay/approve 오류', err.detail || err)
    res.status(502).json({ error: err.message || '카카오페이 결제 승인에 실패했습니다.' })
  }
})

app.use((req, res) => res.status(404).json({ error: 'not found' }))

exports.sajuApi = onRequest(
  {
    region: 'asia-northeast3',
    secrets: [
      TOSS_SECRET_KEY, KAKAOPAY_CID, KAKAOPAY_SECRET_KEY,
      KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, RESEND_API_KEY,
    ],
  },
  app,
)

// 카카오페이 정기결제 자동 청구. 매일 03:00(KST)에 결제 예정(nextChargeAt)이 지난
// 활성 구독을 sid로 재청구하고, 취소 후 이용 기간까지 끝난 구독은 카카오페이 쪽 정기결제도 정지시킵니다.
exports.chargeKakaoPaySubscriptions = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
    secrets: [KAKAOPAY_CID, KAKAOPAY_SECRET_KEY],
  },
  async () => {
    const cid = secretValue(KAKAOPAY_CID)
    const secretKey = secretValue(KAKAOPAY_SECRET_KEY)
    if (!cid || !secretKey) {
      logger.warn('KAKAOPAY_CID/KAKAOPAY_SECRET_KEY가 설정되지 않아 정기결제 청구를 건너뜁니다.')
      return
    }

    const db = getFirestore()
    const nowIso = new Date().toISOString()

    // provider/status만 동등 비교라 별도 복합 색인 없이 조회할 수 있고, 결제 예정일 비교는
    // 메모리에서 걸러냅니다(구독자 규모상 충분히 가벼운 방식입니다).
    const activeSnap = await db.collection('saju_subscriptions')
      .where('provider', '==', 'kakaopay')
      .where('status', '==', 'active')
      .get()

    for (const doc of activeSnap.docs) {
      const data = doc.data()
      if (!data.sid || !data.nextChargeAt || data.nextChargeAt > nowIso) continue

      const orderId = kakaoPayOrderId(doc.id)
      try {
        await kakaoPayRequest('/online/v1/payment/subscription', {
          cid,
          sid: data.sid,
          partner_order_id: orderId,
          partner_user_id: String(doc.id).slice(0, 100),
          item_name: '영재 사주운 프리미엄 월간 정기결제',
          quantity: 1,
          total_amount: MONTHLY,
          tax_free_amount: 0,
        }, secretKey)

        const end = new Date()
        end.setDate(end.getDate() + 30)
        await doc.ref.set({
          orderId,
          endsAt: end.toISOString(),
          nextChargeAt: end.toISOString(),
          lastChargedAt: new Date().toISOString(),
          chargeFailCount: 0,
          lastChargeError: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      } catch (err) {
        logger.error(`카카오페이 정기결제 청구 실패 uid=${doc.id}`, err.detail || err)
        const failCount = (data.chargeFailCount || 0) + 1
        await doc.ref.set({
          chargeFailCount: failCount,
          // 3회 연속 실패하면 자동 재시도를 멈춥니다. 만료일은 그대로 두므로
          // endsAt이 지나면 기존 만료 로직(getSubscriptionStatus)에 따라 자연히 무료로 전환됩니다.
          status: failCount >= 3 ? 'canceled' : 'active',
          lastChargeError: err.message || '결제 실패',
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      }
    }

    const canceledSnap = await db.collection('saju_subscriptions')
      .where('provider', '==', 'kakaopay')
      .where('status', '==', 'canceled')
      .get()

    for (const doc of canceledSnap.docs) {
      const data = doc.data()
      if (!data.sid || data.sidDeactivated || !data.endsAt || data.endsAt > nowIso) continue
      try {
        await kakaoPayRequest('/online/v1/payment/manage/subscription/inactive', { cid, sid: data.sid }, secretKey)
        await doc.ref.set({ sidDeactivated: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      } catch (err) {
        logger.error(`카카오페이 정기결제 비활성화 실패 uid=${doc.id}`, err.detail || err)
      }
    }
  },
)
