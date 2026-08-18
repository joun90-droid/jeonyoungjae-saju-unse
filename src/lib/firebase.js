import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const env = import.meta.env || {}

// 호스팅은 같은 Firebase 프로젝트를 쓰더라도 Auth UID·OAuth 콜백은 사주앱 전용입니다.
// Kakao/Naver 키는 SyncPulse 앱과 공유하지 마세요.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyATcIxi_lC6CiHHAoh6CNg1342ogb0pVP8',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'vaulted-acolyte-387217.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'vaulted-acolyte-387217',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'vaulted-acolyte-387217.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '920803156020',
  appId: env.VITE_FIREBASE_APP_ID || '1:920803156020:web:7ff430ee2a41f68e3faa61',
}

const app = getApps().find((item) => item.name === 'saju-unse') || initializeApp(firebaseConfig, 'saju-unse')

export function getFirebaseApp() {
  return app
}

export function getFirebaseAuth() {
  return getAuth(app)
}

export const SITE_ORIGIN = 'https://jeonyoungjae-saju-unse.web.app'
export const KAKAO_REST_API_KEY = env.VITE_KAKAO_REST_API_KEY || ''
export const NAVER_CLIENT_ID = env.VITE_NAVER_CLIENT_ID || ''
export const TOSS_CLIENT_KEY = env.VITE_TOSS_CLIENT_KEY || ''
