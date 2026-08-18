export function birthFieldsHtml(prefix, birth) {
  const b = birth || { year: 1990, month: 5, day: 15, hour: 14, minute: 30, gender: 'M' }
  return `
    <div class="mini-birth" data-prefix="${prefix}">
      <div class="row dates">
        <label>생년월일 (양력)
          <div class="date-grid">
            <input type="number" data-f="year" min="1930" max="2026" value="${b.year}" required>
            <input type="number" data-f="month" min="1" max="12" value="${b.month}" required>
            <input type="number" data-f="day" min="1" max="31" value="${b.day}" required>
          </div>
        </label>
      </div>
      <div class="row time-row">
        <label class="time-label">시간
          <div class="time-grid">
            <input type="number" data-f="hour" min="0" max="23" value="${b.hour ?? 12}">
            <span>:</span>
            <input type="number" data-f="minute" min="0" max="59" value="${b.minute ?? 0}">
          </div>
        </label>
      </div>
      <div class="row gender-row">
        <span class="label">성별</span>
        <div class="seg">
          <button type="button" class="seg-btn ${b.gender === 'M' ? 'active' : ''}" data-g="M">남</button>
          <button type="button" class="seg-btn ${b.gender === 'F' ? 'active' : ''}" data-g="F">여</button>
        </div>
      </div>
    </div>`
}

export function bindBirthFields(root) {
  root.querySelectorAll('.seg-btn[data-g]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.mini-birth')
      wrap.querySelectorAll('.seg-btn[data-g]').forEach((b) => b.classList.toggle('active', b === btn))
    })
  })
}

export function readBirthFields(root) {
  const wrap = root.querySelector('.mini-birth') || root
  const num = (name, fallback) => {
    const el = wrap.querySelector(`[data-f="${name}"]`)
    return Number(el?.value || fallback)
  }
  const gender = wrap.querySelector('.seg-btn[data-g].active')?.dataset.g || 'M'
  return {
    year: num('year', 1990),
    month: num('month', 5),
    day: num('day', 15),
    hour: num('hour', 12),
    minute: num('minute', 0),
    gender,
    timezone: 'Asia/Seoul',
    unknownTime: false,
  }
}
