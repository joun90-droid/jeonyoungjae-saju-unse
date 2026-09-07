/**
 * 엔진 덤프 — 한 사람의 계산 결과를 한 덩어리로 직렬화한다.
 *
 * 화면·서술·프리미엄 리포트가 각자 재계산하지 않도록,
 * 명리(사주) 심층 분석 + 라이프 웨이브 + 자미두수를 하나의 객체로 모은다.
 * JSON.stringify 해서 저장하거나 서버로 넘겨도 그대로 복원된다.
 */

import { computeChart } from './calculator.js'
import { analyzeZiwei } from './ziwei.js'

export const ENGINE_DUMP_SCHEMA = 'saju_unse_engine_dump_v1'

/**
 * @param {import('@orrery/core/types').BirthInput} input
 * @param {{ ziwei?: boolean, waveRows?: boolean, transitYear?: number }} [opts]
 */
export function buildEngineDump(input, opts = {}) {
  const chart = computeChart(input)
  const { deep, lifeWave, meta, daewoon, stats } = chart

  const dump = {
    schema: ENGINE_DUMP_SCHEMA,
    generatedAt: new Date().toISOString(),
    birth: {
      year: input.year, month: input.month, day: input.day,
      hour: input.hour, minute: input.minute,
      gender: input.gender,
      timezone: input.timezone || 'Asia/Seoul',
      unknownTime: !!input.unknownTime,
      age: meta.age,
    },
    mingli: {
      pillars: deep.pillars,
      dayMaster: deep.dayMaster,
      elementSpread: deep.elementSpread,
      interactions: deep.interactions,
      unseong: deep.unseong,
      unseongTable: deep.unseongTable,
      gongmang: deep.gongmang,
      shinsal: deep.shinsal,
      stats,
      daeun: {
        direction: lifeWave.daeunDirection,
        startAge: lifeWave.daeunStartAge,
        current: daewoon.current ? daewoon.current.ganzi : null,
        pillars: lifeWave.daeun,
      },
      currentSeun: lifeWave.currentSeun,
    },
    lifeWave: {
      span: lifeWave.span,
      best: lifeWave.best,
      worst: lifeWave.worst,
      next10: lifeWave.next10,
      // 90년치 전체는 용량이 커서 명시적으로 요청할 때만 담는다
      rows: opts.waveRows === false ? undefined : lifeWave.rows,
    },
  }

  if (opts.ziwei !== false) {
    try {
      dump.ziwei = analyzeZiwei(input, { year: opts.transitYear })
    } catch (err) {
      dump.ziwei = { error: String(err?.message || err) }
    }
  }

  return dump
}

/**
 * 덤프에서 사람이 읽는 핵심 줄만 뽑는다 (요약 카드·공유 텍스트용).
 * @param {ReturnType<typeof buildEngineDump>} dump
 */
export function summarizeDump(dump) {
  const dm = dump.mingli.dayMaster
  const lines = [
    `일간 ${dm.stem}(${dm.elementKo}) · ${dm.strengthKo} ${dm.strengthScore}점 · ${dm.gyeokguk}`,
    `용신 ${dm.yongsinKo} / 기신 ${dm.gisinKo}${dm.johuElement ? ` · 조후는 ${dm.johuNote.split(':').pop().trim()}` : ''}`,
    dump.mingli.interactions.length
      ? `원국 상호작용: ${dump.mingli.interactions.map((i) => i.label).join(', ')}`
      : '원국에 뚜렷한 합충형파해가 없습니다',
    dump.mingli.currentSeun
      ? `${dump.mingli.currentSeun.year}년 ${dump.mingli.currentSeun.ganzi}(${dump.mingli.currentSeun.tenGod}) 지수 ${dump.mingli.currentSeun.score100}`
      : '',
  ]
  if (dump.ziwei && !dump.ziwei.error) {
    lines.push(`자미두수: ${dump.ziwei.bureau.label} · 명궁 ${dump.ziwei.mingPalaceBranch} · 화기 ${dump.ziwei.huaJiStar || '—'}(${dump.ziwei.huaJiPalace || '—'})`)
  }
  if (dm.ambiguity?.isAmbiguous) lines.push(dm.ambiguity.plainHint)
  return lines.filter(Boolean)
}
