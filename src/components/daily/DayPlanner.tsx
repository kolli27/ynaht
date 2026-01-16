import { CheckCircle, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes } from '../../utils/time';
import TimeBudgetBar from './TimeBudgetBar';
import ActivityForm from './ActivityForm';
import ActivityList from './ActivityList';
import MorningSetup from './MorningSetup';
import MorningNudgeCard from './MorningNudgeCard';
import EveningNudgeCard from './EveningNudgeCard';
import TriageModeCard from './TriageModeCard';
import Button from '../ui/Button';

export default function DayPlanner() {
  const {
    viewMode,
    setViewMode,
    currentSession,
    endDay,
    needsMorningSetup,
    morningNudge,
    eveningNudge,
    triageState,
  } = useApp();

  // Show morning setup if no active session
  if (needsMorningSetup) {
    return <MorningSetup />;
  }

  // Safety check - should have session after setup
  if (!currentSession) {
    return <MorningSetup />;
  }

  const activities = currentSession.activities;
  const allHaveActuals = activities.length > 0 &&
    activities.every(a => a.actualMinutes !== undefined);

  // Calculate running totals for reconcile mode
  const activitiesWithActual = activities.filter(a => a.actualMinutes !== undefined);
  const totalPlanned = activities.reduce((sum, a) => sum + a.plannedMinutes, 0);
  const totalActual = activities.reduce((sum, a) => sum + (a.actualMinutes ?? 0), 0);
  const totalVariance = totalActual - totalPlanned;
  const recordedCount = activitiesWithActual.length;
  const totalCount = activities.length;

  const handleReconcile = () => {
    endDay();
    setViewMode('plan');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daily Planner</h1>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('plan')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'plan'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            Plan
          </button>
          <button
            onClick={() => setViewMode('reconcile')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'reconcile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Reconcile
          </button>
        </div>
      </div>

      {/* Morning Nudge - show at start of day when behind on goals */}
      {viewMode === 'plan' && morningNudge && morningNudge.suggestions.length > 0 && (
        <MorningNudgeCard nudge={morningNudge} />
      )}

      {/* Evening Nudge - show when free time exists and behind on goals */}
      {viewMode === 'plan' && eveningNudge && (
        <EveningNudgeCard nudge={eveningNudge} />
      )}

      {/* Triage Mode - show when approaching bedtime with incomplete activities */}
      {triageState && triageState.isActive && (
        <TriageModeCard triageState={triageState} />
      )}

      {/* Time Budget */}
      <TimeBudgetBar />

      {viewMode === 'plan' ? (
        <>
          {/* Add Activity Form */}
          <ActivityForm />

          {/* Activity List */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Today's Activities ({activities.length})
            </h3>
            <ActivityList />
          </div>
        </>
      ) : (
        <>
          {/* Reconcile Mode Header */}
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Track Actual Time</h3>
                <p className="text-sm text-gray-500">
                  Enter the actual time you spent on each activity
                </p>
              </div>
              {currentSession.isReconciled && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Reconciled
                </span>
              )}
            </div>

            {/* Running Total Variance Card */}
            {totalCount > 0 && (
              <div className={`p-4 rounded-lg ${
                totalVariance > 0 ? 'bg-red-50' : totalVariance < 0 ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {recordedCount}/{totalCount}
                    </div>
                    <div className="text-xs text-gray-500">Recorded</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-700">
                      {minutesToHoursMinutes(totalPlanned)}
                    </div>
                    <div className="text-xs text-gray-500">Planned</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary-600">
                      {minutesToHoursMinutes(totalActual)}
                    </div>
                    <div className="text-xs text-gray-500">Actual</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${
                      totalVariance > 0 ? 'text-red-600' : totalVariance < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {totalVariance > 0 ? '+' : ''}{minutesToHoursMinutes(totalVariance)}
                    </div>
                    <div className="text-xs text-gray-500">Variance</div>
                  </div>
                </div>

                {/* Insight message */}
                {recordedCount === totalCount && totalCount > 0 && (
                  <div className={`mt-3 pt-3 border-t ${
                    totalVariance > 0 ? 'border-red-200' : 'border-green-200'
                  }`}>
                    <div className={`flex items-center gap-2 text-sm ${
                      totalVariance > 0 ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {totalVariance > 30 ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span>You went {minutesToHoursMinutes(totalVariance)} over budget today. Consider adjusting future estimates.</span>
                        </>
                      ) : totalVariance < -30 ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>Great job! You finished {minutesToHoursMinutes(Math.abs(totalVariance))} under budget.</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Excellent estimation! Your day was within {minutesToHoursMinutes(Math.abs(totalVariance))} of your plan.</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reconcile button */}
            {!currentSession.isReconciled && totalCount > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {allHaveActuals
                    ? 'All activities have actual times recorded'
                    : `${totalCount - recordedCount} activities still need actual times`}
                </div>
                <Button
                  onClick={handleReconcile}
                  disabled={!allHaveActuals}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Day Complete
                </Button>
              </div>
            )}
          </div>

          {/* Activity List with actual time inputs */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Activities to Reconcile</h3>
              <span className="text-xs text-gray-500">
                Enter actual time for each activity below
              </span>
            </div>
            <ActivityList showActualInput />
          </div>

          {/* Summary */}
          {allHaveActuals && currentSession.isReconciled && (
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Daily Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(totalPlanned / 60 * 10) / 10}h
                  </div>
                  <div className="text-sm text-gray-500">Planned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">
                    {Math.round(totalActual / 60 * 10) / 10}h
                  </div>
                  <div className="text-sm text-gray-500">Actual</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalVariance > 0 ? '+' : ''}{Math.round(totalVariance / 60 * 10) / 10}h
                  </div>
                  <div className="text-sm text-gray-500">{totalVariance > 0 ? 'Over' : 'Under'}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
