import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getWeekDates, isDateInRange, minutesToHoursMinutes } from '../../utils/time';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { parseISO, format } from 'date-fns';

export default function WeeklySummary() {
  const { state } = useApp();

  const { start, end } = getWeekDates(new Date(), state.settings.weekStartsOn);

  const weekStats = useMemo(() => {
    let totalPlanned = 0;
    let totalActual = 0;
    const categoryTime: Record<string, number> = {};
    const dailyTotals: Record<string, number> = {};

    Object.values(state.daySessions).forEach(session => {
      const sessionDate = format(parseISO(session.wakeTime), 'yyyy-MM-dd');
      if (!isDateInRange(sessionDate, start, end)) return;

      let dayTotal = 0;
      session.activities.forEach(activity => {
        const time = activity.actualMinutes ?? activity.plannedMinutes;
        totalPlanned += activity.plannedMinutes;
        totalActual += activity.actualMinutes ?? 0;
        dayTotal += time;

        categoryTime[activity.categoryId] = (categoryTime[activity.categoryId] || 0) + time;
      });
      dailyTotals[sessionDate] = dayTotal;
    });

    return { totalPlanned, totalActual, categoryTime, dailyTotals };
  }, [state.daySessions, start, end]);

  const topCategories = Object.entries(weekStats.categoryTime)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {minutesToHoursMinutes(Object.values(weekStats.dailyTotals).reduce((a, b) => a + b, 0))}
          </div>
          <div className="text-sm text-gray-500">Total Tracked</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {Object.keys(weekStats.dailyTotals).length}
          </div>
          <div className="text-sm text-gray-500">Days Active</div>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Categories</h4>
          <div className="space-y-2">
            {topCategories.map(([categoryId, minutes]) => {
              const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
              return (
                <div key={categoryId} className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category?.bgColor} ${category?.textColor}`}>
                    {category?.name || categoryId}
                  </span>
                  <span className="text-sm text-gray-600">{minutesToHoursMinutes(minutes)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
