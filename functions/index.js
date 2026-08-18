const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const express = require('express')
const cors = require('cors')

initializeApp()

const TOSS_SECRET_KEY = defineSecret('TOSS_SECRET_KEY')
const KAKAO_REST_API_KEY = defineSecret('KAKAO_REST_API_KEY')
const KAKAO_CLIENT_SECRET = defineSecret('KAKAO_CLIENT_SECRET')
const NAVER_CLIENT_ID = defineSecret('NAVER_CLIENT_ID')
const NAVER_CLIENT_SECRET = defineSecret('NAVER_CLIENT_SECRET')

const MONTHLY = 4900
const LIFETIME = 29900
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

const app = express()
app.use(cors({ origin: ALLOWED, credentials: true }))
app.use(express.json())

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
  if (!snap.exists) return res.json({ plan: 'free' })
  const data = snap.data()
  const endsAt = data.endsAt || null
  const expired = data.plan === 'premium_monthly' && endsAt && Date.now() > new Date(endsAt).getTime()
  res.json({
    plan: expired ? 'free' : (data.plan || 'free'),
    startedAt: data.startedAt || null,
    endsAt,
  })
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
  const { provider, code, redirectUri } = req.body || {}
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
      const clientId = secretValue(KAKAO_REST_API_KEY)
      if (!clientId) return res.status(500).json({ error: '카카오 로그인이 아직 설정되지 않았습니다.' })
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
        return res.status(401).json({ error: '카카오 인증에 실패했습니다. Redirect URI를 Kakao Developers에 등록했는지 확인해 주세요.' })
      }

      const meRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      })
      const me = await meRes.json()
      if (!meRes.ok || !me.id) {
        return res.status(401).json({ error: '카카오 사용자 정보를 가져오지 못했습니다.' })
      }
      uid = `saju:kakao:${me.id}`
      displayName = me.kakao_account?.profile?.nickname || undefined
      email = me.kakao_account?.email || undefined
      photoURL = me.kakao_account?.profile?.profile_image_url || undefined
    } else {
      const clientId = secretValue(NAVER_CLIENT_ID)
      const clientSecret = secretValue(NAVER_CLIENT_SECRET)
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: '네이버 로그인이 아직 설정되지 않았습니다.' })
      }
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      })
      const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?${params}`)
      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok || tokenJson.error || !tokenJson.access_token) {
        logger.error('Naver 토큰 교환 실패', tokenJson)
        return res.status(401).json({ error: '네이버 인증에 실패했습니다. Callback URL을 Naver Developers에 등록했는지 확인해 주세요.' })
      }
      const meRes = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      })
      const me = await meRes.json()
      if (me.resultcode !== '00' || !me.response?.id) {
        return res.status(401).json({ error: '네이버 사용자 정보를 가져오지 못했습니다.' })
      }
      uid = `saju:naver:${me.response.id}`
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
    const customToken = await getAuth().createCustomToken(uid, { provider, app: 'saju-unse' })
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

  const safeUid = String(decoded.uid).replace(/[^A-Za-z0-9_-]/g, '_')
  if (!String(orderId).startsWith(`saju_${safeUid}_`)) {
    return res.status(403).json({ error: '본인의 주문이 아닙니다.' })
  }

  const planKey = planFromOrder(orderId, requestedPlan)
  const expected = planKey === 'lifetime' ? LIFETIME : MONTHLY
  if (Number(amount) !== expected) {
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
    if (planKey === 'lifetime') end.setFullYear(end.getFullYear() + 99)
    else end.setDate(end.getDate() + 30)
    const endsAt = end.toISOString()
    const plan = planKey === 'lifetime' ? 'premium_lifetime' : 'premium_monthly'

    await getFirestore().collection('saju_subscriptions').doc(decoded.uid).set({
      plan,
      status: 'active',
      orderId,
      amount: Number(amount),
      paymentKey,
      method: tossJson.method || null,
      startedAt,
      endsAt,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    res.json({ ok: true, plan, startedAt, endsAt })
  } catch (err) {
    logger.error('toss/confirm 오류', err)
    res.status(500).json({ error: '결제 승인 처리 중 오류가 발생했습니다.' })
  }
})

app.use((req, res) => res.status(404).json({ error: 'not found' }))

exports.sajuApi = onRequest(
  {
    region: 'asia-northeast3',
    secrets: [TOSS_SECRET_KEY, KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET],
  },
  app,
)
