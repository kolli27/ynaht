import { useState } from 'react';
import { Clock, Plus, Check, X, PartyPopper } from 'lucide-react';
import { EveningNudge, SuggestedActivity } from '../../types';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes } from '../../utils/time';
import Button from '../ui/Button';

interface EveningNudgeCardProps {
  nudge: EveningNudge;
}

export default function EveningNudgeCard({ nudge }: EveningNudgeCardProps) {
  const { addActivity } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [addedActivities, setAddedActivities] = useState<Set<string>>(new Set());

  if (dismissed) return null;

  const handleAddActivity = (suggestion: SuggestedActivity) => {
    addActivity({
      name: suggestion.name,
      categoryId: suggestion.categoryId,
      plannedMinutes: suggestion.suggestedMinutes,
    });
    setAddedActivities(prev => new Set(prev).add(suggestion.name));
  };

  const handleAddAll = () => {
    nudge.suggestedActivities.forEach(suggestion => {
      if (!addedActivities.has(suggestion.name)) {
        handleAddActivity(suggestion);
      }
    });
  };

  // Calculate total suggested time
  const totalSuggestedTime = nudge.suggestedActivities.reduce(
    (sum, s) => sum + s.suggestedMinutes,
    0
  );
  const remainingAfterSuggestions = nudge.remainingMinutes - totalSuggestedTime;

  // On track - show celebration
  if (nudge.type === 'on-track') {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-bold text-green-800">You're crushing it this week!</p>
              <p className="text-sm text-green-600 mt-1">
                All weekly goals on track. You have {minutesToHoursMinutes(nudge.remainingMinutes)} of free time - enjoy!
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-green-400 hover:text-green-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Chill Out
          </Button>
        </div>
      </div>
    );
  }

  // Behind schedule with suggestions
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            Time Available: {minutesToHoursMinutes(nudge.remainingMinutes)} until bedtime
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-blue-400 hover:text-blue-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-blue-700 mb-3">{nudge.message}</p>

      {/* Suggestions */}
      {nudge.suggestedActivities.length > 0 && (
        <div className="border-t border-blue-200 pt-3">
          <p className="text-sm text-blue-700 mb-3">
            <span className="font-medium">&#128161; You have time to add:</span>
          </p>
          <div className="space-y-2">
            {nudge.suggestedActivities.map(suggestion => {
              const isAdded = addedActivities.has(suggestion.name);
              return (
                <div
                  key={suggestion.name}
                  className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
                >
                  <div>
                    <span className="font-medium text-gray-900">{suggestion.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({suggestion.suggestedMinutes}m)
                    </span>
                    <p className="text-xs text-gray-500">{suggestion.reason}</p>
                  </div>
                  {isAdded ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" /> Added
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddActivity(suggestion)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {totalSuggestedTime > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              Total: {minutesToHoursMinutes(totalSuggestedTime)} suggested
              {remainingAfterSuggestions > 0 && (
                <> - still leaves {minutesToHoursMinutes(remainingAfterSuggestions)} free</>
              )}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            {nudge.suggestedActivities.length > 1 &&
             addedActivities.size < nudge.suggestedActivities.length && (
              <Button size="sm" onClick={handleAddAll}>
                Add All
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Enjoy Free Time
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
