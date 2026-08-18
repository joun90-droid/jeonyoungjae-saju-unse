export async function shareContent({ title, text, url }) {
  const shareUrl = url || location.href
  const payload = { title, text, url: shareUrl }
  if (window.Kakao?.Share?.sendDefault) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: text,
          imageUrl: `${location.origin}/icon-512.png`,
          link: { webUrl: shareUrl, mobileWebUrl: shareUrl },
        },
      })
      return 'kakao'
    } catch {
      /* fall through */
    }
  }
  if (navigator.share) {
    try {
      await navigator.share(payload)
      return 'native'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancel'
    }
  }
  try {
    await navigator.clipboard.writeText(`${title}\n${text}\n${shareUrl}`)
    return 'copy'
  } catch {
    return 'fail'
  }
}

export function shareFeedback(mode) {
  if (mode === 'copy') return '링크와 문구를 복사했습니다.'
  if (mode === 'fail') return '공유에 실패했습니다. 주소를 직접 복사해 주세요.'
  if (mode === 'cancel') return ''
  return '공유했습니다.'
}
