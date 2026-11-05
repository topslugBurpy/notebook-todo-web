import { format, subDays } from 'date-fns'

// Task dates are calendar days in the device's timezone, never UTC.
export const localDateStr = (date: Date = new Date()) => format(date, 'yyyy-MM-dd')

export const daysAgoStr = (days: number) => localDateStr(subDays(new Date(), days))
