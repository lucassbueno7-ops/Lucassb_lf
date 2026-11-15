/** Dates are local-calendar 'YYYY-MM-DD' strings. Arithmetic runs in UTC to be DST-safe. */

const DAY_MS = 86_400_000

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUTC(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(date: string, n: number): string {
  return fromUTC(toUTC(date) + n * DAY_MS)
}

/** Whole days from `lastDate` to `today`; null when there is no previous date. */
export function daysSince(lastDate: string | null, today: string): number | null {
  if (!lastDate) return null
  return Math.round((toUTC(today) - toUTC(lastDate)) / DAY_MS)
}

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export function weekdayOf(date: string): number {
  const js = new Date(toUTC(date)).getUTCDay() // 0 = Sunday
  return js === 0 ? 7 : js
}

/** Monday of the ISO week containing `date`. */
export function weekStart(date: string): string {
  return addDays(date, 1 - weekdayOf(date))
}

export interface ScheduledDay {
  id: string
  name: string
  weekdays: number[]
}

export function plannedDaysForDate<T extends ScheduledDay>(days: T[], date: string): T[] {
  const wd = weekdayOf(date)
  return days.filter((d) => d.weekdays.includes(wd))
}

export interface WeeklyAttendance {
  planned: number
  done: number
  missed: number
  extra: number
}

/**
 * Attendance for the current ISO week (Mon..Sun) up to and including `today`.
 * planned: scheduled weekdays up to today; done: distinct logged dates on a scheduled weekday;
 * extra: distinct logged dates on unscheduled weekdays; missed: scheduled days strictly before
 * today with no log.
 */
export function weeklyAttendance(logDates: string[], plannedWeekdays: number[], today: string): WeeklyAttendance {
  const start = weekStart(today)
  const todayWd = weekdayOf(today)
  const scheduled = new Set(plannedWeekdays)
  const logged = new Set(logDates.filter((d) => d >= start && d <= today))

  let planned = 0
  let done = 0
  let missed = 0
  for (let wd = 1; wd <= todayWd; wd++) {
    if (!scheduled.has(wd)) continue
    planned++
    if (logged.has(addDays(start, wd - 1))) done++
    else if (wd < todayWd) missed++
  }
  let extra = 0
  for (const d of logged) if (!scheduled.has(weekdayOf(d))) extra++
  return { planned, done, missed, extra }
}

export interface CalendarEntry<T extends ScheduledDay = ScheduledDay> {
  date: string
  weekday: number
  days: T[]
}

/** Seven entries Mon..Sun for the week containing `today`, with the days scheduled on each. */
export function weekCalendar<T extends ScheduledDay>(today: string, days: T[]): CalendarEntry<T>[] {
  const start = weekStart(today)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, weekday: i + 1, days: plannedDaysForDate(days, date) }
  })
}

/** True when a client with scheduled days has gone `threshold`+ days without logging (or never logged). */
export function needsAttention(daysWithoutLogging: number | null, hasSchedule: boolean, threshold = 3): boolean {
  if (!hasSchedule) return false
  return daysWithoutLogging === null || daysWithoutLogging >= threshold
}

export interface AttendanceSummary {
  lastDate: string | null
  daysSince: number | null
  week: WeeklyAttendance
  needsAttention: boolean
}

export function attendanceSummary(logDates: string[], days: ScheduledDay[], today: string): AttendanceSummary {
  const lastDate = logDates.reduce<string | null>((max, d) => (max === null || d > max ? d : max), null)
  const since = daysSince(lastDate, today)
  const weekdays = days.flatMap((d) => d.weekdays)
  return {
    lastDate,
    daysSince: since,
    week: weeklyAttendance(logDates, weekdays, today),
    needsAttention: needsAttention(since, weekdays.length > 0),
  }
}

export type DayStatus = 'done' | 'missed' | 'pending' | 'upcoming' | 'extra' | 'rest'

/** Calendar status of one date for a client, given whether it was scheduled and whether it was logged. */
export function dayStatus(date: string, today: string, scheduled: boolean, logged: boolean): DayStatus {
  if (!scheduled) return logged ? 'extra' : 'rest'
  if (logged) return 'done'
  if (date < today) return 'missed'
  return date === today ? 'pending' : 'upcoming'
}
