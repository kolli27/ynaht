import { DaySession, Goal, Activity } from '../types';
import { formatDisplayDate, minutesToHoursMinutes } from './time';
import { parseISO, format } from 'date-fns';

export function exportToJSON(data: { daySessions: Record<string, DaySession>; goals: Goal[] }): string {
  return JSON.stringify(data, null, 2);
}

export function exportSessionToCSV(session: DaySession): string {
  const headers = ['Activity', 'Category', 'Planned (min)', 'Actual (min)', 'Variance', 'Notes'];
  const rows: string[][] = [headers];

  session.activities.forEach((activity: Activity) => {
    const variance = activity.actualMinutes !== undefined
      ? activity.actualMinutes - activity.plannedMinutes
      : '';

    rows.push([
      activity.name,
      activity.categoryId,
      activity.plannedMinutes.toString(),
      activity.actualMinutes?.toString() || '',
      variance.toString(),
      activity.notes || '',
    ]);
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function exportAllSessionsToCSV(daySessions: Record<string, DaySession>): string {
  const headers = ['Date', 'Wake Time', 'Sleep Time', 'Activity', 'Category', 'Planned (min)', 'Actual (min)', 'Variance'];
  const rows: string[][] = [headers];

  Object.values(daySessions)
    .sort((a, b) => a.wakeTime.localeCompare(b.wakeTime))
    .forEach((session: DaySession) => {
      const date = format(parseISO(session.wakeTime), 'yyyy-MM-dd');
      const wakeTime = format(parseISO(session.wakeTime), 'HH:mm');
      const sleepTime = format(parseISO(session.plannedSleepTime), 'HH:mm');

      session.activities.forEach((activity: Activity) => {
        const variance = activity.actualMinutes !== undefined
          ? activity.actualMinutes - activity.plannedMinutes
          : '';

        rows.push([
          date,
          wakeTime,
          sleepTime,
          activity.name,
          activity.categoryId,
          activity.plannedMinutes.toString(),
          activity.actualMinutes?.toString() || '',
          variance.toString(),
        ]);
      });
    });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDataAsJSON(data: { daySessions: Record<string, DaySession>; goals: Goal[] }): void {
  const json = exportToJSON(data);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `ynaht-export-${date}.json`, 'application/json');
}

export function exportDataAsCSV(daySessions: Record<string, DaySession>): void {
  const csv = exportAllSessionsToCSV(daySessions);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `ynaht-export-${date}.csv`, 'text/csv');
}

export function generateSessionSummary(session: DaySession): string {
  const totalPlanned = session.activities.reduce((sum: number, a: Activity) => sum + a.plannedMinutes, 0);
  const totalActual = session.activities.reduce((sum: number, a: Activity) => sum + (a.actualMinutes || 0), 0);

  const date = format(parseISO(session.wakeTime), 'yyyy-MM-dd');
  const wakeTime = format(parseISO(session.wakeTime), 'h:mm a');
  const sleepTime = format(parseISO(session.plannedSleepTime), 'h:mm a');

  let summary = `Daily Summary - ${formatDisplayDate(date)}\n`;
  summary += `${'='.repeat(50)}\n\n`;
  summary += `Day: ${wakeTime} - ${sleepTime}\n`;
  summary += `Total Planned: ${minutesToHoursMinutes(totalPlanned)}\n`;

  if (session.isReconciled) {
    summary += `Total Actual: ${minutesToHoursMinutes(totalActual)}\n`;
    summary += `Variance: ${minutesToHoursMinutes(totalActual - totalPlanned)}\n`;
  }

  summary += `\nActivities:\n${'-'.repeat(30)}\n`;

  session.activities.forEach((activity: Activity) => {
    summary += `- ${activity.name} [${activity.categoryId}]: ${minutesToHoursMinutes(activity.plannedMinutes)}`;
    if (activity.actualMinutes !== undefined) {
      summary += ` (actual: ${minutesToHoursMinutes(activity.actualMinutes)})`;
    }
    summary += '\n';
  });

  return summary;
}
