import { useState, useEffect, useRef } from 'react';
import { Plus, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { minutesToHoursMinutes } from '../../utils/time';
import { Activity, HistoricalActivity } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TimeInput from '../ui/TimeInput';
import CategoryBadge from '../ui/CategoryBadge';

interface ActivityFormProps {
  activity?: Activity;
  onClose?: () => void;
  isModal?: boolean;
}

// Calculate insights from historical data
function getActivityInsight(historical: HistoricalActivity): string | null {
  if (historical.occurrences < 3) return null;

  // Use pre-calculated average variance from historical data
  const avgVariance = historical.averageVariance || 0;

  if (avgVariance > 10) {
    return `Usually takes ${avgVariance}min longer than planned`;
  } else if (avgVariance < -10) {
    return `Usually finishes ${Math.abs(avgVariance)}min early`;
  } else if (Math.abs(avgVariance) <= 5 && historical.occurrences >= 3) {
    return `Your estimates are accurate (avg variance: ${avgVariance}min)`;
  }

  return null;
}

export default function ActivityForm({ activity, onClose, isModal = false }: ActivityFormProps) {
  const { addActivity, updateActivity, getSuggestionForActivity, historicalActivities, remainingMinutes } = useApp();
  const [name, setName] = useState(activity?.name || '');
  const [plannedMinutes, setPlannedMinutes] = useState(activity?.plannedMinutes || 30);
  const [categoryId, setCategoryId] = useState(activity?.categoryId || 'work');
  const [notes, setNotes] = useState(activity?.notes || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const suggestion = getSuggestionForActivity(name);
  const suggestionInsight = suggestion ? getActivityInsight(suggestion) : null;

  // Frequently used activities (sorted by occurrences)
  const frequentActivities = historicalActivities
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 6);

  // Filter suggestions based on input
  const filteredSuggestions = name.length >= 2
    ? historicalActivities
        .filter(h => h.name.toLowerCase().includes(name.toLowerCase()))
        .slice(0, 5)
    : [];

  useEffect(() => {
    if (!isModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModal]);

  // Keyboard shortcut: "/" to focus the form
  useEffect(() => {
    if (isModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activity) {
      updateActivity({
        ...activity,
        name: name.trim(),
        plannedMinutes,
        categoryId,
        notes,
      });
    } else {
      addActivity({
        name: name.trim(),
        plannedMinutes,
        categoryId,
        notes,
      });
    }

    // Reset form
    setName('');
    setPlannedMinutes(30);
    setCategoryId('work');
    setNotes('');
    setShowSuggestions(false);

    if (onClose) onClose();
  };

  const applySuggestion = (suggested: HistoricalActivity) => {
    setName(suggested.name);
    setPlannedMinutes(suggested.averageMinutes);
    setCategoryId(suggested.categoryId);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const quickAddActivity = (suggested: HistoricalActivity) => {
    addActivity({
      name: suggested.name,
      plannedMinutes: suggested.averageMinutes,
      categoryId: suggested.categoryId,
    });
  };

  const categoryOptions = DEFAULT_CATEGORIES.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const formContent = (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Activity Name with Autocomplete */}
      <div className="relative">
        <Input
          ref={inputRef}
          label={isModal ? "Activity" : "Activity (press / to focus)"}
          placeholder="What are you planning to do?"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setShowSuggestions(e.target.value.length >= 2);
          }}
          onFocus={() => setShowSuggestions(name.length >= 2)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {filteredSuggestions.map((s) => {
              const insight = getActivityInsight(s);
              return (
                <button
                  key={s.name}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  onMouseDown={() => applySuggestion(s)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">{s.name}</span>
                    <span className="text-sm text-gray-500">~{minutesToHoursMinutes(s.averageMinutes)}</span>
                  </div>
                  {insight && (
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {insight}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-0.5">
                    Based on {s.occurrences} past {s.occurrences === 1 ? 'entry' : 'entries'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Suggestion hint with insight */}
      {suggestion && name.toLowerCase() === suggestion.name.toLowerCase() && (
        <div className="p-3 bg-blue-50 rounded-lg space-y-2">
          <div className="flex items-start gap-2 text-sm text-blue-700">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Based on {suggestion.occurrences} past {suggestion.occurrences === 1 ? 'entry' : 'entries'}:</span>
              <span className="ml-1">"{suggestion.name}" typically takes you {minutesToHoursMinutes(suggestion.averageMinutes)}</span>
              {suggestion.averageMinutes !== plannedMinutes && (
                <button
                  type="button"
                  className="ml-2 text-blue-800 underline font-medium"
                  onClick={() => setPlannedMinutes(suggestion.averageMinutes)}
                >
                  Use this duration
                </button>
              )}
            </div>
          </div>
          {suggestionInsight && (
            <div className="flex items-center gap-2 text-xs text-blue-600 pl-6">
              <TrendingUp className="w-3 h-3" />
              {suggestionInsight}
            </div>
          )}
        </div>
      )}

      {/* Duration and Category */}
      <div className="grid grid-cols-2 gap-4">
        <TimeInput
          label="Duration"
          value={plannedMinutes}
          onChange={setPlannedMinutes}
          min={5}
          max={480}
        />
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categoryOptions}
        />
      </div>

      {/* Quick duration buttons */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Quick durations</label>
        <div className="flex flex-wrap gap-2">
          {[15, 30, 45, 60, 90, 120].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setPlannedMinutes(mins)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                plannedMinutes === mins
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {minutesToHoursMinutes(mins)}
            </button>
          ))}
        </div>
      </div>

      {/* Notes (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes..."
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Submit */}
      {!isModal && (
        <Button type="submit" disabled={!name.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      )}

      {/* Remaining time warning */}
      {remainingMinutes < plannedMinutes && remainingMinutes > 0 && (
        <p className="text-sm text-yellow-600">
          Only {minutesToHoursMinutes(remainingMinutes)} remaining in your budget
        </p>
      )}
      {remainingMinutes <= 0 && (
        <p className="text-sm text-red-600">
          Your day is fully budgeted. Adding this will put you over budget.
        </p>
      )}
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="space-y-4 mb-4">
      {/* Frequently Used Activities - Quick Add */}
      {frequentActivities.length > 0 && !name && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-gray-700">Quick Add</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {frequentActivities.map((fa) => (
              <button
                key={fa.name}
                type="button"
                onClick={() => quickAddActivity(fa)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200"
              >
                <CategoryBadge categoryId={fa.categoryId} size="sm" />
                <span className="text-gray-700">{fa.name}</span>
                <span className="text-gray-400">{minutesToHoursMinutes(fa.averageMinutes)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Add Activity</h3>
          <span className="text-xs text-gray-400">Press / to focus</span>
        </div>
        {formContent}
      </div>
    </div>
  );
}
