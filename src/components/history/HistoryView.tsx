import { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Clock, ChevronLeft, ChevronRight, Archive, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatShortDate, formatDisplayDate, minutesToHoursMinutes, getWeekDates, getMonthDates, isDateInRange } from '../../utils/time';
import { parseISO, format, addWeeks, subWeeks, addMonths, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import CategoryBadge from '../ui/CategoryBadge';
import Button from '../ui/Button';

type ViewPeriod = 'week' | 'month';
type ViewTab = 'history' | 'backlog';

export default function HistoryView() {
  const { state, thisWeeksBacklog, addFromBacklog, removeFromBacklog } = useApp();
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');
  const [viewTab, setViewTab] = useState<ViewTab>('history');
  const [currentPeriodStart, setCurrentPeriodStart] = useState(() => {
    const { start } = getWeekDates(new Date(), state.settings.weekStartsOn);
    return start;
  });

  const periodDates = useMemo(() => {
    if (viewPeriod === 'week') {
      return getWeekDates(currentPeriodStart, state.settings.weekStartsOn);
    }
    return getMonthDates(currentPeriodStart);
  }, [currentPeriodStart, viewPeriod, state.settings.weekStartsOn]);

  const daysInPeriod = useMemo(() => {
    return eachDayOfInterval({ start: periodDates.start, end: periodDates.end });
  }, [periodDates]);

  // Get sessions that fall within the period (based on wakeTime)
  const periodSessions = useMemo(() => {
    return Object.values(state.daySessions)
      .filter(session => {
        const sessionDate = parseISO(session.wakeTime);
        return isDateInRange(format(sessionDate, 'yyyy-MM-dd'), periodDates.start, periodDates.end);
      })
      .sort((a, b) => a.wakeTime.localeCompare(b.wakeTime));
  }, [state.daySessions, periodDates]);

  const periodStats = useMemo(() => {
    let totalPlanned = 0;
    let totalActual = 0;
    let activitiesCount = 0;
    const categoryTime: Record<string, number> = {};

    periodSessions.forEach(session => {
      session.activities.forEach(activity => {
        totalPlanned += activity.plannedMinutes;
        totalActual += activity.actualMinutes ?? activity.plannedMinutes;
        activitiesCount++;

        categoryTime[activity.categoryId] = (categoryTime[activity.categoryId] || 0) +
          (activity.actualMinutes ?? activity.plannedMinutes);
      });
    });

    return {
      totalPlanned,
      totalActual,
      activitiesCount,
      categoryTime,
      daysWithSessions: periodSessions.length,
    };
  }, [periodSessions]);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewPeriod === 'week') {
      setCurrentPeriodStart(direction === 'prev' ? subWeeks(currentPeriodStart, 1) : addWeeks(currentPeriodStart, 1));
    } else {
      setCurrentPeriodStart(direction === 'prev' ? subMonths(currentPeriodStart, 1) : addMonths(currentPeriodStart, 1));
    }
  };

  // Get session for a specific day
  const getSessionForDay = (day: Date) => {
    return periodSessions.find(session => {
      const sessionDate = parseISO(session.wakeTime);
      return isSameDay(sessionDate, day);
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">History & Backlog</h1>
          <p className="text-gray-500">Review past days and manage postponed activities</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            History
          </button>
          <button
            onClick={() => setViewTab('backlog')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewTab === 'backlog'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Archive className="w-4 h-4 inline mr-1" />
            Backlog
            {thisWeeksBacklog.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                {thisWeeksBacklog.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {viewTab === 'backlog' ? (
        // Backlog View
        <div>
          <div className="card p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">This Week's Backlog</h2>
            <p className="text-sm text-gray-500 mb-4">
              Activities you've postponed this week. Add them back to today's plan or remove them.
            </p>

            {thisWeeksBacklog.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No postponed activities this week</p>
                <p className="text-sm text-gray-400 mt-1">When you move activities to tomorrow, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {thisWeeksBacklog.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.activityName}</span>
                        <CategoryBadge categoryId={item.categoryId} size="sm" />
                        {item.postponedCount > 1 && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                            Postponed {item.postponedCount}x
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {minutesToHoursMinutes(item.plannedMinutes)} planned
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => addFromBacklog(item.id)}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Add to Today
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromBacklog(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backlog Patterns */}
          {thisWeeksBacklog.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Patterns</h3>
              <div className="space-y-2 text-sm">
                {thisWeeksBacklog
                  .filter(item => item.postponedCount > 1)
                  .map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-yellow-700">
                      <span>&#9888;</span>
                      <span>
                        You've postponed <strong>{item.activityName}</strong> {item.postponedCount} times this week
                      </span>
                    </div>
                  ))}
                {thisWeeksBacklog.every(item => item.postponedCount === 1) && (
                  <p className="text-gray-500">No repeated postponements yet this week.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // History View
        <>
          {/* Period Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewPeriod('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewPeriod === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewPeriod('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewPeriod === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Period Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900">
              {viewPeriod === 'week'
                ? `${formatShortDate(periodDates.start)} - ${formatShortDate(periodDates.end)}`
                : format(currentPeriodStart, 'MMMM yyyy')}
            </h2>
            <Button variant="ghost" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{periodStats.daysWithSessions}</div>
              <div className="text-sm text-gray-500">Days Tracked</div>
            </div>
            <div className="card p-4 text-center">
              <Clock className="w-6 h-6 text-primary-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(periodStats.totalActual / 60 * 10) / 10}h
              </div>
              <div className="text-sm text-gray-500">Total Time</div>
            </div>
            <div className="card p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{periodStats.activitiesCount}</div>
              <div className="text-sm text-gray-500">Activities</div>
            </div>
            <div className="card p-4 text-center">
              <div className={`text-2xl font-bold ${periodStats.totalActual > periodStats.totalPlanned ? 'text-red-600' : 'text-green-600'}`}>
                {periodStats.totalPlanned > 0
                  ? `${Math.round((periodStats.totalActual / periodStats.totalPlanned) * 100)}%`
                  : '-'}
              </div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
          </div>

          {/* Time by Category */}
          {Object.keys(periodStats.categoryTime).length > 0 && (
            <div className="card p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Time by Category</h3>
              <div className="space-y-3">
                {Object.entries(periodStats.categoryTime)
                  .sort(([, a], [, b]) => b - a)
                  .map(([categoryId, minutes]) => {
                    const percentage = (minutes / periodStats.totalActual) * 100;
                    return (
                      <div key={categoryId} className="flex items-center gap-3">
                        <CategoryBadge categoryId={categoryId} />
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-16 text-right">
                          {minutesToHoursMinutes(minutes)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Day Grid */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Overview</h3>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {daysInPeriod.map(day => {
                const session = getSessionForDay(day);
                const isToday = isSameDay(day, new Date());
                const hasSession = session && session.activities.length > 0;
                const totalMinutes = session?.activities.reduce(
                  (sum, a) => sum + (a.actualMinutes ?? a.plannedMinutes),
                  0
                ) || 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      p-2 rounded-lg text-center
                      ${isToday ? 'ring-2 ring-primary-500' : ''}
                      ${hasSession ? 'bg-primary-50' : 'bg-gray-50'}
                    `}
                  >
                    <div className={`text-sm font-medium ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </div>
                    {hasSession && (
                      <div className="text-xs text-primary-600 mt-1">
                        {minutesToHoursMinutes(totalMinutes)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Sessions List */}
          {periodSessions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Session Details</h3>
              <div className="space-y-2">
                {periodSessions.slice().reverse().map(session => {
                  const wakeDate = parseISO(session.wakeTime);
                  const totalMinutes = session.activities.reduce(
                    (sum, a) => sum + (a.actualMinutes ?? a.plannedMinutes),
                    0
                  );
                  return (
                    <div
                      key={session.id}
                      className="card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDisplayDate(format(wakeDate, 'yyyy-MM-dd'))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.activities.length} activities
                            {session.isReconciled && ' \u2022 Reconciled'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {minutesToHoursMinutes(totalMinutes)}
                          </div>
                          <div className="flex gap-1">
                            {Object.keys(
                              session.activities.reduce((acc, a) => ({ ...acc, [a.categoryId]: true }), {})
                            ).slice(0, 3).map(catId => (
                              <CategoryBadge key={catId} categoryId={catId} size="sm" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {periodSessions.length === 0 && (
            <div className="card p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data for this period</h3>
              <p className="text-gray-500">Start tracking your time to see history here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
