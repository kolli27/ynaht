import { useState } from 'react';
import { Goal } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants/categories';
import { useApp } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface GoalFormProps {
  goal?: Goal;
  onClose: () => void;
}

export default function GoalForm({ goal, onClose }: GoalFormProps) {
  const { addGoal, updateGoal } = useApp();

  const [name, setName] = useState(goal?.name || '');
  const [activityPattern, setActivityPattern] = useState(goal?.activityPattern || '');
  const [targetType, setTargetType] = useState<'count' | 'duration'>(goal?.targetType || 'count');
  const [targetValue, setTargetValue] = useState(goal?.targetValue || 3);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(goal?.frequency || 'weekly');
  const [categoryId, setCategoryId] = useState(goal?.categoryId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activityPattern.trim()) return;

    const goalData = {
      name: name.trim(),
      activityPattern: activityPattern.trim(),
      targetType,
      targetValue: targetType === 'duration' ? targetValue * 60 : targetValue, // Convert hours to minutes
      frequency,
      categoryId: categoryId || undefined,
    };

    if (goal) {
      updateGoal({ ...goal, ...goalData });
    } else {
      addGoal(goalData);
    }

    onClose();
  };

  const categoryOptions = [
    { value: '', label: 'Any category' },
    ...DEFAULT_CATEGORIES.map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Goal Name"
        placeholder="e.g., Yoga 3x per week"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="Activity Pattern"
        placeholder="e.g., Yoga, Reading, Exercise"
        value={activityPattern}
        onChange={(e) => setActivityPattern(e.target.value)}
        required
      />
      <p className="text-xs text-gray-500 -mt-2">
        Activities containing this text will count toward this goal
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Target Type"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as 'count' | 'duration')}
          options={[
            { value: 'count', label: 'Number of times' },
            { value: 'duration', label: 'Total hours' },
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target {targetType === 'count' ? 'Count' : 'Hours'}
          </label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
            min={1}
            max={targetType === 'count' ? 50 : 100}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <Select
        label="Frequency"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
      />

      <Select
        label="Category Filter (optional)"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim() || !activityPattern.trim()}>
          {goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}
