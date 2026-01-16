import { useState } from 'react';
import { TrendingUp, Plus, Check, X } from 'lucide-react';
import { MorningNudge, SuggestedActivity } from '../../types';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';

interface MorningNudgeCardProps {
  nudge: MorningNudge;
}

export default function MorningNudgeCard({ nudge }: MorningNudgeCardProps) {
  const { addActivity, goalProgress } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [addedActivities, setAddedActivities] = useState<Set<string>>(new Set());

  if (dismissed) return null;

  const behindGoals = goalProgress.filter(gp => gp.status === 'behind');
  const onTrackGoals = goalProgress.filter(gp => gp.status === 'on-track' || gp.status === 'ahead');
  const completeGoals = goalProgress.filter(gp => gp.status === 'complete');

  const handleAddActivity = (suggestion: SuggestedActivity) => {
    addActivity({
      name: suggestion.name,
      categoryId: suggestion.categoryId,
      plannedMinutes: suggestion.suggestedMinutes,
    });
    setAddedActivities(prev => new Set(prev).add(suggestion.name));
  };

  const handleAddAll = () => {
    nudge.suggestions.forEach(suggestion => {
      if (!addedActivities.has(suggestion.name)) {
        handleAddActivity(suggestion);
      }
    });
  };

  // If all goals are on track or complete, show celebration
  if (behindGoals.length === 0) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#10024;</span>
            <div>
              <p className="font-medium text-green-800">You're on track with your weekly goals!</p>
              <p className="text-sm text-green-600">
                {completeGoals.length} complete, {onTrackGoals.length} on track
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
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            Weekly Check-in ({nudge.dayOfWeek})
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-yellow-400 hover:text-yellow-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Goal Status */}
      <div className="space-y-2 mb-4">
        {goalProgress.map(gp => {
          const statusIcon = gp.status === 'complete' ? '&#9989;' :
                            gp.status === 'ahead' ? '&#9989;' :
                            gp.status === 'on-track' ? '&#9989;' : '&#9888;&#65039;';
          const statusText = gp.status === 'complete' ? 'Complete!' :
                            gp.status === 'ahead' ? 'Ahead' :
                            gp.status === 'on-track' ? 'On track' :
                            `Behind (need ${gp.remaining} more)`;
          const statusColor = gp.status === 'behind' ? 'text-yellow-700' : 'text-green-700';

          return (
            <div key={gp.goal.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{gp.goal.name}</span>
              <span className={statusColor}>
                <span dangerouslySetInnerHTML={{ __html: statusIcon }} />{' '}
                {gp.currentValue}/{gp.targetValue}{' '}
                {gp.goal.targetType === 'count' ? 'times' : 'min'} - {statusText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {nudge.suggestions.length > 0 && (
        <div className="border-t border-yellow-200 pt-3">
          <p className="text-sm text-yellow-700 mb-3">
            <span className="font-medium">&#128161; Suggestion:</span> Add these to catch up on goals
          </p>
          <div className="space-y-2">
            {nudge.suggestions.map(suggestion => {
              const isAdded = addedActivities.has(suggestion.name);
              return (
                <div
                  key={suggestion.name}
                  className="flex items-center justify-between p-2 bg-white rounded border border-yellow-100"
                >
                  <div>
                    <span className="font-medium text-gray-900">{suggestion.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({suggestion.suggestedMinutes}m)
                    </span>
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

          {/* Add All Button */}
          {nudge.suggestions.length > 1 && addedActivities.size < nudge.suggestions.length && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleAddAll}>
                Add All Suggestions
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                Plan My Own Day
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
