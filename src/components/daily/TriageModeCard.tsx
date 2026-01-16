import { useState } from 'react';
import { AlertTriangle, ArrowRight, Trash2, Scissors, Moon } from 'lucide-react';
import { TriageState, Activity } from '../../types';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes } from '../../utils/time';
import { format, parseISO, addMinutes } from 'date-fns';
import Button from '../ui/Button';

interface TriageModeCardProps {
  triageState: TriageState;
}

type TriageAction = 'extend' | 'move' | 'shorten' | 'skip';

interface ActivityDecision {
  activityId: string;
  action: TriageAction;
  newDuration?: number;
}

export default function TriageModeCard({ triageState }: TriageModeCardProps) {
  const { updateSleepTime, moveToBacklog, updateActivity, completeActivity } = useApp();
  const [decisions, setDecisions] = useState<Map<string, ActivityDecision>>(new Map());
  const [showExtendOptions, setShowExtendOptions] = useState(false);
  const [customExtendMinutes, setCustomExtendMinutes] = useState(60);

  const currentTime = new Date();
  const plannedSleep = parseISO(triageState.plannedSleepTime);

  const handleExtendBedtime = (extraMinutes: number) => {
    const newSleepTime = addMinutes(plannedSleep, extraMinutes);
    updateSleepTime(newSleepTime.toISOString());
    setShowExtendOptions(false);
  };

  const handleMoveToTomorrow = (activity: Activity) => {
    moveToBacklog(activity.id);
    setDecisions(prev => {
      const next = new Map(prev);
      next.set(activity.id, { activityId: activity.id, action: 'move' });
      return next;
    });
  };

  const handleShorten = (activity: Activity, newDuration: number) => {
    updateActivity({ ...activity, plannedMinutes: newDuration });
    setDecisions(prev => {
      const next = new Map(prev);
      next.set(activity.id, { activityId: activity.id, action: 'shorten', newDuration });
      return next;
    });
  };

  const handleSkip = (activity: Activity) => {
    // Mark as completed with 0 actual minutes (skipped)
    completeActivity(activity.id, 0);
    setDecisions(prev => {
      const next = new Map(prev);
      next.set(activity.id, { activityId: activity.id, action: 'skip' });
      return next;
    });
  };

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <span className="font-bold text-red-800">Time Crisis</span>
      </div>

      {/* Time Info */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="p-2 bg-white rounded">
          <div className="text-sm text-gray-500">Current Time</div>
          <div className="font-bold text-gray-900">{format(currentTime, 'h:mm a')}</div>
        </div>
        <div className="p-2 bg-white rounded">
          <div className="text-sm text-gray-500">Planned Bedtime</div>
          <div className="font-bold text-gray-900">{format(plannedSleep, 'h:mm a')}</div>
        </div>
        <div className="p-2 bg-white rounded">
          <div className="text-sm text-gray-500">Time Left</div>
          <div className="font-bold text-red-600">{minutesToHoursMinutes(triageState.remainingMinutes)}</div>
        </div>
      </div>

      {/* Problem Summary */}
      <div className="p-3 bg-white rounded mb-4">
        <p className="text-sm text-gray-700">
          <span className="font-medium text-red-700">
            {triageState.incompleteActivities.length} activities
          </span>{' '}
          totaling{' '}
          <span className="font-medium text-red-700">
            {minutesToHoursMinutes(triageState.totalIncompleteMinutes)}
          </span>{' '}
          remain, but you only have{' '}
          <span className="font-medium">{minutesToHoursMinutes(triageState.remainingMinutes)}</span>{' '}
          until bedtime.
        </p>
      </div>

      {/* Quick Options */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Options:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExtendOptions(!showExtendOptions)}
          >
            <Moon className="w-4 h-4 mr-1" />
            Extend Bedtime
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              triageState.incompleteActivities.forEach(a => handleMoveToTomorrow(a));
            }}
          >
            <ArrowRight className="w-4 h-4 mr-1" />
            Move All to Tomorrow
          </Button>
        </div>
      </div>

      {/* Extend Options */}
      {showExtendOptions && (
        <div className="p-3 bg-white rounded mb-4 space-y-2">
          <p className="text-sm text-gray-600">Extend bedtime by:</p>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 90, 120].map(mins => (
              <Button
                key={mins}
                size="sm"
                variant="ghost"
                onClick={() => handleExtendBedtime(mins)}
              >
                +{mins}m
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              value={customExtendMinutes}
              onChange={(e) => setCustomExtendMinutes(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border rounded text-sm"
              min={15}
              step={15}
            />
            <span className="text-sm text-gray-500">min</span>
            <Button size="sm" onClick={() => handleExtendBedtime(customExtendMinutes)}>
              Apply
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            New bedtime: {format(addMinutes(plannedSleep, customExtendMinutes), 'h:mm a')}
          </p>
        </div>
      )}

      {/* Individual Activity Decisions */}
      <div className="border-t border-red-200 pt-3">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Or handle each activity:
        </p>
        <div className="space-y-2">
          {triageState.incompleteActivities.map(activity => {
            const decision = decisions.get(activity.id);
            if (decision) {
              return (
                <div
                  key={activity.id}
                  className="p-2 bg-gray-100 rounded text-sm text-gray-500 line-through"
                >
                  {activity.name} - {decision.action === 'move' ? 'Moved to tomorrow' :
                                     decision.action === 'skip' ? 'Skipped' :
                                     decision.action === 'shorten' ? `Shortened to ${decision.newDuration}m` : ''}
                </div>
              );
            }

            return (
              <div
                key={activity.id}
                className="p-3 bg-white rounded border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{activity.name}</span>
                  <span className="text-sm text-gray-500">
                    {minutesToHoursMinutes(activity.plannedMinutes)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleShorten(activity, Math.round(activity.plannedMinutes / 2))}
                  >
                    <Scissors className="w-3 h-3 mr-1" />
                    Shorten to {Math.round(activity.plannedMinutes / 2)}m
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMoveToTomorrow(activity)}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Tomorrow
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleSkip(activity)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Skip
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
