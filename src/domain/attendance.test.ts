import { describe, expect, it } from 'vitest'
import {
  attendanceSummary,
  dayStatus,
  daysSince,
  needsAttention,
  plannedDaysForDate,
  weekCalendar,
  weekdayOf,
  weeklyAttendance,
} from './attendance'

// 2026-11-09 is a Monday, 2026-11-15 a Sunday.
describe('daysSince', () => {
  it('returns null when there is no previous date', () => {
    expect(daysSince(null, '2026-11-14')).toBeNull()
  })
  it('counts whole days between dates', () => {
    expect(daysSince('2026-11-14', '2026-11-14')).toBe(0)
    expect(daysSince('2026-11-11', '2026-11-14')).toBe(3)
  })
  it('is not affected by month boundaries or DST changes', () => {
    expect(daysSince('2026-10-30', '2026-11-02')).toBe(3)
    expect(daysSince('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysSince('2026-10-24', '2026-11-01')).toBe(8)
  })
})

describe('weekdayOf', () => {
  it('returns ISO weekday: Monday=1 ... Sunday=7', () => {
    expect(weekdayOf('2026-11-09')).toBe(1)
    expect(weekdayOf('2026-11-14')).toBe(6)
    expect(weekdayOf('2026-11-15')).toBe(7)
  })
})

const days = [
  { id: 'a', name: 'Día A', weekdays: [1, 4] },
  { id: 'b', name: 'Día B', weekdays: [3] },
  { id: 'c', name: 'Día C', weekdays: [] },
]

describe('plannedDaysForDate', () => {
  it('returns the routine days scheduled for the date weekday', () => {
    expect(plannedDaysForDate(days, '2026-11-09').map((d) => d.id)).toEqual(['a'])
    expect(plannedDaysForDate(days, '2026-11-11').map((d) => d.id)).toEqual(['b'])
  })
  it('returns an empty array on rest days', () => {
    expect(plannedDaysForDate(days, '2026-11-10')).toEqual([])
  })
  it('can return several days when they share a weekday', () => {
    const shared = [...days, { id: 'd', name: 'Día D', weekdays: [1] }]
    expect(plannedDaysForDate(shared, '2026-11-09').map((d) => d.id)).toEqual(['a', 'd'])
  })
})

describe('weeklyAttendance', () => {
  // today = Friday 2026-11-13; week is 2026-11-09 .. 2026-11-15
  const today = '2026-11-13'

  it('counts planned days up to and including today', () => {
    expect(weeklyAttendance([], [1, 3, 5, 6], today).planned).toBe(3)
  })
  it('counts missed as scheduled days strictly before today with no log', () => {
    const r = weeklyAttendance(['2026-11-09'], [1, 3, 5], today)
    expect(r).toEqual({ planned: 3, done: 1, missed: 1, extra: 0 })
  })
  it('does not count today as missed when nothing was logged yet', () => {
    const r = weeklyAttendance([], [5], today)
    expect(r).toEqual({ planned: 1, done: 0, missed: 0, extra: 0 })
  })
  it('counts distinct log dates only once', () => {
    const r = weeklyAttendance(['2026-11-09', '2026-11-09', '2026-11-09'], [1], today)
    expect(r.done).toBe(1)
  })
  it('counts unscheduled training days as extra', () => {
    const r = weeklyAttendance(['2026-11-10'], [1], today)
    expect(r).toEqual({ planned: 1, done: 0, missed: 1, extra: 1 })
  })
  it('ignores logs outside the current week', () => {
    const r = weeklyAttendance(['2026-11-08', '2026-11-16'], [1], today)
    expect(r).toEqual({ planned: 1, done: 0, missed: 1, extra: 0 })
  })
  it('treats Sunday as the last day of the week', () => {
    const r = weeklyAttendance(['2026-11-09'], [1, 7], '2026-11-15')
    expect(r).toEqual({ planned: 2, done: 1, missed: 0, extra: 0 })
  })
  it('handles a day with no schedule', () => {
    expect(weeklyAttendance(['2026-11-09'], [], today)).toEqual({ planned: 0, done: 0, missed: 0, extra: 1 })
  })
  it('deduplicates repeated planned weekdays', () => {
    expect(weeklyAttendance([], [1, 1, 3], today).planned).toBe(2)
  })
})

describe('weekCalendar', () => {
  it('returns Monday to Sunday of the week containing today', () => {
    const cal = weekCalendar('2026-11-14', days)
    expect(cal).toHaveLength(7)
    expect(cal.map((c) => c.date)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
    expect(cal.map((c) => c.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('attaches the scheduled routine days to each date', () => {
    const cal = weekCalendar('2026-11-14', days)
    expect(cal[0].days.map((d) => d.id)).toEqual(['a'])
    expect(cal[1].days).toEqual([])
    expect(cal[2].days.map((d) => d.id)).toEqual(['b'])
    expect(cal[3].days.map((d) => d.id)).toEqual(['a'])
  })
  it('crosses month boundaries', () => {
    const cal = weekCalendar('2026-12-02', [])
    expect(cal[0].date).toBe('2026-11-30')
    expect(cal[6].date).toBe('2026-12-06')
  })
})

describe('needsAttention', () => {
  it('flags 3+ days without logging when days are scheduled', () => {
    expect(needsAttention(3, true)).toBe(true)
    expect(needsAttention(10, true)).toBe(true)
  })
  it('does not flag fewer than 3 days', () => {
    expect(needsAttention(2, true)).toBe(false)
    expect(needsAttention(0, true)).toBe(false)
  })
  it('flags a client who never logged when days are scheduled', () => {
    expect(needsAttention(null, true)).toBe(true)
  })
  it('never flags when nothing is scheduled', () => {
    expect(needsAttention(null, false)).toBe(false)
    expect(needsAttention(30, false)).toBe(false)
  })
})

describe('attendanceSummary', () => {
  const routineDays = [
    { id: 'a', name: 'A', weekdays: [1, 3, 5] },
    { id: 'b', name: 'B', weekdays: [] },
  ]
  it('combines last date, days since, weekly attendance and the alert flag', () => {
    const s = attendanceSummary(['2026-11-02', '2026-11-09', '2026-11-09'], routineDays, '2026-11-13')
    expect(s.lastDate).toBe('2026-11-09')
    expect(s.daysSince).toBe(4)
    expect(s.week).toEqual({ planned: 3, done: 1, missed: 1, extra: 0 })
    expect(s.needsAttention).toBe(true)
  })
  it('handles no logs and no schedule', () => {
    const s = attendanceSummary([], [], '2026-11-13')
    expect(s).toEqual({
      lastDate: null,
      daysSince: null,
      week: { planned: 0, done: 0, missed: 0, extra: 0 },
      needsAttention: false,
    })
  })
})

describe('dayStatus', () => {
  const today = '2026-11-12'
  it('is done when a scheduled day was logged', () => {
    expect(dayStatus('2026-11-09', today, true, true)).toBe('done')
    expect(dayStatus(today, today, true, true)).toBe('done')
  })
  it('is missed for a past scheduled day without logs', () => {
    expect(dayStatus('2026-11-09', today, true, false)).toBe('missed')
  })
  it('is pending for today when scheduled and not logged yet', () => {
    expect(dayStatus(today, today, true, false)).toBe('pending')
  })
  it('is upcoming for future scheduled days', () => {
    expect(dayStatus('2026-11-13', today, true, false)).toBe('upcoming')
  })
  it('is extra for logged days that were not scheduled', () => {
    expect(dayStatus('2026-11-10', today, false, true)).toBe('extra')
  })
  it('is rest when nothing is scheduled or logged', () => {
    expect(dayStatus('2026-11-10', today, false, false)).toBe('rest')
    expect(dayStatus('2026-11-14', today, false, false)).toBe('rest')
  })
})
