import { useState } from 'react';
import { Lightbulb, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes, minutesToDecimalHours } from '../../utils/time';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../../constants/categories';
import { format, parseISO, setHours, setMinutes, addDays } from 'date-fns';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';

export default function TimeBudgetBar() {
  const { currentSession, totalAvailableMinutes, allocatedMinutes, remainingMinutes, freeMinutes, updateSleepTime } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);

  // Get current wake/sleep times
  const wakeTime = currentSession ? parseISO(currentSession.wakeTime) : new Date();
  const sleepTime = currentSession ? parseISO(currentSession.plannedSleepTime) : new Date();

  const [editSleepTime, setEditSleepTime] = useState(format(sleepTime, 'HH:mm'));
  const [spansNextDay, setSpansNextDay] = useState(sleepTime.getDate() !== wakeTime.getDate());

  // Group activities by category
  const activities = currentSession?.activities || [];
  const timeByCategory = activities.reduce((acc, activity) => {
    acc[activity.categoryId] = (acc[activity.categoryId] || 0) + activity.plannedMinutes;
    return acc;
  }, {} as Record<string, number>);

  const isOverBudget = remainingMinutes < 0;
  const freeTimeHours = freeMinutes / 60;
  const hasHealthyBuffer = freeTimeHours >= 1 && freeTimeHours <= 3;

  const handleSaveTimes = () => {
    // Parse the sleep time and create proper ISO date
    const [sh, sm] = editSleepTime.split(':').map(Number);
    let newSleepDate = setMinutes(setHours(new Date(wakeTime), sh), sm);

    // If spans next day or sleep time is before wake time
    if (spansNextDay || sh * 60 + sm < wakeTime.getHours() * 60 + wakeTime.getMinutes()) {
      newSleepDate = addDays(newSleepDate, 1);
    }

    updateSleepTime(newSleepDate.toISOString());
    setShowEditModal(false);
  };

  const openEditModal = () => {
    setEditSleepTime(format(sleepTime, 'HH:mm'));
    setSpansNextDay(sleepTime.getDate() !== wakeTime.getDate());
    setShowEditModal(true);
  };

  if (!currentSession) return null;

  return (
    <div className="card p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Time Budget</h2>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{format(wakeTime, 'h:mm a')}</span>
              <span>→</span>
              <span>{format(sleepTime, 'h:mm a')}</span>
              <span className="text-gray-400">({minutesToHoursMinutes(totalAvailableMinutes)} available)</span>
              <button
                onClick={openEditModal}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors ml-1"
                title="Edit bedtime"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className={`text-right ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
          <div className="text-2xl font-bold">
            {isOverBudget ? '-' : ''}{minutesToHoursMinutes(Math.abs(freeMinutes))}
          </div>
          <div className="text-sm text-gray-500">
            {isOverBudget ? 'over budget' : 'free time'}
          </div>
        </div>
      </div>

      {/* Visual Budget Bar */}
      <div className="mb-4">
        <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
          {Object.entries(timeByCategory)
            .sort(([a], [b]) => {
              // Sort by category order
              const orderA = DEFAULT_CATEGORIES.findIndex(c => c.id === a);
              const orderB = DEFAULT_CATEGORIES.findIndex(c => c.id === b);
              return orderA - orderB;
            })
            .map(([categoryId, minutes]) => {
              const percentage = (minutes / totalAvailableMinutes) * 100;
              const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
              const colors = CATEGORY_COLORS[category?.color || 'gray'];

              return (
                <div
                  key={categoryId}
                  className={`${colors.bar} flex items-center justify-center transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                  title={`${category?.name || categoryId}: ${minutesToHoursMinutes(minutes)}`}
                >
                  {percentage > 10 && (
                    <span className="text-xs text-white font-medium truncate px-1">
                      {category?.name}
                    </span>
                  )}
                </div>
              );
            })}
          {/* Free Time space */}
          {freeMinutes > 0 && (
            <div
              className="bg-green-100 flex items-center justify-center"
              style={{ width: `${(freeMinutes / totalAvailableMinutes) * 100}%` }}
            >
              <span className="text-xs text-green-700 font-medium">Free Time</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">{minutesToDecimalHours(totalAvailableMinutes)}h</div>
          <div className="text-xs text-gray-500">Total Day</div>
        </div>
        <div className="p-2 bg-primary-50 rounded-lg">
          <div className="text-lg font-semibold text-primary-700">{minutesToDecimalHours(allocatedMinutes)}h</div>
          <div className="text-xs text-gray-500">Planned</div>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-semibold text-blue-700">{minutesToDecimalHours(remainingMinutes)}h</div>
          <div className="text-xs text-gray-500">Until Sleep</div>
        </div>
        <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className={`text-lg font-semibold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
            {isOverBudget ? '-' : ''}{minutesToDecimalHours(Math.abs(freeMinutes))}h
          </div>
          <div className="text-xs text-gray-500">{isOverBudget ? 'Over' : 'Free'}</div>
        </div>
      </div>

      {/* Free Time Philosophy Message */}
      {hasHealthyBuffer && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Great job leaving buffer time! 1-2 hours of free time helps with flexibility and unexpected tasks.</span>
        </div>
      )}
      {freeMinutes > 0 && freeTimeHours < 1 && allocatedMinutes > 0 && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Consider leaving 1-2 hours unscheduled for flexibility and buffer time.</span>
        </div>
      )}

      {/* Edit Sleep Time Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Extend or Change Bedtime"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleSaveTimes}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Woke up at <strong>{format(wakeTime, 'h:mm a')}</strong>. Adjust your planned bedtime below.
          </p>
          <Input
            label="Planned Bedtime"
            type="time"
            value={editSleepTime}
            onChange={(e) => setEditSleepTime(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={spansNextDay}
              onChange={(e) => setSpansNextDay(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Sleep time is after midnight (next day)
          </label>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(() => {
                const [sh, sm] = editSleepTime.split(':').map(Number);
                let sleepMins = sh * 60 + sm;
                const wakeMins = wakeTime.getHours() * 60 + wakeTime.getMinutes();
                if (spansNextDay || sleepMins < wakeMins) {
                  sleepMins += 24 * 60;
                }
                return minutesToHoursMinutes(sleepMins - wakeMins);
              })()}
            </div>
            <div className="text-sm text-gray-500">Total Day Length</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
