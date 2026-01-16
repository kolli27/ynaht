import { format, parse, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE, MMMM d, yyyy');
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d');
}

export function parseTime(timeString: string): Date {
  return parse(timeString, 'HH:mm', new Date());
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatTimeDisplay(date: Date): string {
  return format(date, 'h:mm a');
}

export function getAvailableMinutes(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return differenceInMinutes(end, start);
}

export function minutesToHoursMinutes(minutes: number): string {
  const hrs = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '';

  if (hrs === 0) return `${sign}${mins}m`;
  if (mins === 0) return `${sign}${hrs}h`;
  return `${sign}${hrs}h ${mins}m`;
}

export function minutesToDecimalHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

export function getWeekDates(date: Date | string, weekStartsOn: 0 | 1 = 1): { start: Date; end: Date } {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfWeek(d, { weekStartsOn }),
    end: endOfWeek(d, { weekStartsOn }),
  };
}

export function getMonthDates(date: Date | string): { start: Date; end: Date } {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfMonth(d),
    end: endOfMonth(d),
  };
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function isDateInRange(date: string, start: Date, end: Date): boolean {
  return isWithinInterval(parseISO(date), { start, end });
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getVarianceColor(planned: number, actual: number): 'green' | 'yellow' | 'red' {
  const variance = actual - planned;
  const percentVariance = planned > 0 ? (variance / planned) * 100 : 0;

  if (percentVariance <= 0) return 'green'; // Under or on budget
  if (percentVariance <= 20) return 'yellow'; // Slight overrun
  return 'red'; // Significant overrun
}

export function getVarianceText(planned: number, actual: number): string {
  const variance = actual - planned;
  if (variance === 0) return 'On track';
  if (variance > 0) return `+${minutesToHoursMinutes(variance)} over`;
  return `${minutesToHoursMinutes(Math.abs(variance))} under`;
}
