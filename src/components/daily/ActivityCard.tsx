import { useState, useEffect } from 'react';
import { Edit2, Trash2, ChevronUp, ChevronDown, Clock, Play, Check, Pause, ArrowRight } from 'lucide-react';
import { Activity } from '../../types';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes } from '../../utils/time';
import CategoryBadge from '../ui/CategoryBadge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ActivityForm from './ActivityForm';

interface ActivityCardProps {
  activity: Activity;
  isFirst: boolean;
  isLast: boolean;
  showActualInput?: boolean;
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getVarianceColor(planned: number, actual: number): string {
  const variance = actual - planned;
  const percentVariance = planned > 0 ? (variance / planned) * 100 : 0;
  if (variance <= 0) return 'green';
  if (percentVariance <= 20) return 'yellow';
  return 'red';
}

export default function ActivityCard({ activity, isFirst, isLast, showActualInput = false }: ActivityCardProps) {
  const {
    deleteActivity,
    moveActivity,
    updateActivity,
    completeActivity,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    moveToBacklog,
  } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [localActual, setLocalActual] = useState<string>(
    activity.actualMinutes?.toString() || ''
  );
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Get timer state from activity
  const timer = activity.timer;
  const isTimerRunning = timer?.isRunning || false;
  const isPaused = timer && !timer.isRunning && timer.accumulatedSeconds > 0;

  // Timer effect - update display every second when running
  useEffect(() => {
    let interval: number | undefined;

    if (timer?.isRunning && timer.startedAt) {
      const updateTimer = () => {
        const currentElapsed = Math.floor((Date.now() - timer.startedAt!) / 1000);
        setTimerSeconds(timer.accumulatedSeconds + currentElapsed);
      };
      updateTimer();
      interval = window.setInterval(updateTimer, 1000);
    } else if (timer?.accumulatedSeconds) {
      // When paused, show accumulated time
      setTimerSeconds(timer.accumulatedSeconds);
    } else {
      setTimerSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer?.isRunning, timer?.startedAt, timer?.accumulatedSeconds]);

  const hasActual = activity.actualMinutes !== undefined;
  const isCompleted = activity.completed || false;
  const varianceColor = hasActual ? getVarianceColor(activity.plannedMinutes, activity.actualMinutes!) : null;
  const variance = hasActual ? activity.actualMinutes! - activity.plannedMinutes : 0;

  const handleActualBlur = () => {
    const value = parseInt(localActual);
    if (!isNaN(value) && value >= 0) {
      completeActivity(activity.id, value);
    }
  };

  const handleToggleComplete = () => {
    if (isCompleted) {
      // Uncomplete - remove actualMinutes and completed flag
      updateActivity({
        ...activity,
        completed: false,
        actualMinutes: undefined,
      });
    } else {
      // Complete with planned time as default
      completeActivity(activity.id, activity.actualMinutes ?? activity.plannedMinutes);
    }
  };

  const handleStartTimer = () => {
    startTimer(activity.id);
  };

  const handlePauseTimer = () => {
    pauseTimer(activity.id);
  };

  const handleResumeTimer = () => {
    resumeTimer(activity.id);
  };

  const handleStopTimer = () => {
    // Calculate total elapsed minutes
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    stopTimer(activity.id, elapsedMinutes);
    setLocalActual(elapsedMinutes.toString());
  };

  const handleMoveToBacklog = () => {
    moveToBacklog(activity.id);
  };

  // Dynamic border color based on variance
  const borderClass = hasActual
    ? varianceColor === 'green'
      ? 'border-l-4 border-l-green-500'
      : varianceColor === 'yellow'
      ? 'border-l-4 border-l-yellow-500'
      : 'border-l-4 border-l-red-500'
    : '';

  return (
    <>
      <div className={`card p-4 ${borderClass} ${isCompleted ? 'bg-gray-50' : ''}`}>
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            {isCompleted && <Check className="w-3 h-3" />}
          </button>

          {/* Reorder buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => moveActivity(activity.id, 'up')}
              disabled={isFirst}
              className={`p-1 rounded hover:bg-gray-100 ${isFirst ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => moveActivity(activity.id, 'down')}
              disabled={isLast}
              className={`p-1 rounded hover:bg-gray-100 ${isLast ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium truncate ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                {activity.name}
              </h4>
              <CategoryBadge categoryId={activity.categoryId} size="sm" />
              {isCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Done</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Planned: {minutesToHoursMinutes(activity.plannedMinutes)}</span>
              </div>

              {hasActual && (
                <>
                  <span className="text-gray-400">|</span>
                  <span>Actual: {minutesToHoursMinutes(activity.actualMinutes!)}</span>
                  <span className={`font-medium ${
                    varianceColor === 'green' ? 'text-green-600' :
                    varianceColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    ({variance > 0 ? '+' : ''}{minutesToHoursMinutes(variance)})
                  </span>
                </>
              )}

              {/* Timer display */}
              {(isTimerRunning || isPaused) && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className={`font-mono font-medium ${
                    isTimerRunning ? 'text-primary-600 animate-pulse' : 'text-yellow-600'
                  }`}>
                    {formatTimer(timerSeconds)}
                    {isPaused && ' (paused)'}
                  </span>
                </>
              )}
            </div>

            {activity.notes && (
              <p className={`mt-2 text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>{activity.notes}</p>
            )}

            {/* Actual time input (for reconcile mode) */}
            {showActualInput && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="text-sm font-medium text-gray-700">Actual time:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={localActual}
                      onChange={(e) => setLocalActual(e.target.value)}
                      onBlur={handleActualBlur}
                      placeholder={activity.plannedMinutes.toString()}
                      min={0}
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="text-sm text-gray-500">min</span>
                  </div>
                  <button
                    onClick={() => {
                      setLocalActual(activity.plannedMinutes.toString());
                      completeActivity(activity.id, activity.plannedMinutes);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium"
                  >
                    Same as planned
                  </button>
                  {hasActual && (
                    <span className={`ml-auto text-sm font-medium ${
                      varianceColor === 'green' ? 'text-green-600' :
                      varianceColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {variance === 0 ? 'On time!' : variance > 0 ? `+${variance}min over` : `${Math.abs(variance)}min under`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Timer buttons - show when not completed and not in reconcile mode */}
            {!isCompleted && !showActualInput && (
              <>
                {isTimerRunning ? (
                  <>
                    <button
                      onClick={handlePauseTimer}
                      className="p-2 rounded-lg text-yellow-500 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                      title="Pause timer"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleStopTimer}
                      className="p-2 rounded-lg text-green-500 bg-green-50 hover:bg-green-100 transition-colors"
                      title="Complete with timer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </>
                ) : isPaused ? (
                  <>
                    <button
                      onClick={handleResumeTimer}
                      className="p-2 rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors"
                      title="Resume timer"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleStopTimer}
                      className="p-2 rounded-lg text-green-500 bg-green-50 hover:bg-green-100 transition-colors"
                      title="Complete with timer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="p-2 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                    title="Start timer"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            {/* Move to backlog */}
            {!isCompleted && (
              <button
                onClick={handleMoveToBacklog}
                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Move to backlog"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Activity"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button type="submit" form="edit-activity-form">Save Changes</Button>
          </>
        }
      >
        <form id="edit-activity-form" onSubmit={(e) => { e.preventDefault(); setShowEdit(false); }}>
          <ActivityForm activity={activity} onClose={() => setShowEdit(false)} isModal />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Activity"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteActivity(activity.id);
                setShowDelete(false);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete "{activity.name}"? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
