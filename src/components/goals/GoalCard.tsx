import { useState } from 'react';
import { Edit2, Trash2, Target, Plus } from 'lucide-react';
import { Goal } from '../../types';
import { useApp } from '../../context/AppContext';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import GoalForm from './GoalForm';

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const { goalProgress, deleteGoal, addActivity } = useApp();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Find progress for this goal from context
  const progress = goalProgress.find(gp => gp.goal.id === goal.id);

  // Handle case where progress isn't found (shouldn't happen but defensive)
  if (!progress) {
    return null;
  }

  const formatTarget = () => {
    if (goal.targetType === 'count') {
      return `${progress.currentValue}/${goal.targetValue} times`;
    }
    return `${Math.round(progress.currentValue / 60 * 10) / 10}/${Math.round(goal.targetValue / 60)} hours`;
  };

  const handleAddToToday = () => {
    addActivity({
      name: goal.activityPattern,
      categoryId: goal.categoryId || 'personal',
      plannedMinutes: progress.averageDuration || 30,
    });
  };

  const frequencyLabel = {
    daily: 'Today',
    weekly: 'This week',
    monthly: 'This month',
  }[goal.frequency];

  const progressColor = progress.status === 'complete' || progress.status === 'ahead'
    ? 'green'
    : progress.status === 'on-track'
    ? 'primary'
    : 'yellow';

  const statusBadge = {
    'behind': { color: 'bg-yellow-100 text-yellow-700', text: 'Behind' },
    'on-track': { color: 'bg-blue-100 text-blue-700', text: 'On Track' },
    'ahead': { color: 'bg-green-100 text-green-700', text: 'Ahead' },
    'complete': { color: 'bg-green-100 text-green-700', text: 'Complete!' },
  }[progress.status];

  return (
    <>
      <div className="card p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className={`w-5 h-5 ${progress.status === 'complete' ? 'text-green-500' : 'text-gray-400'}`} />
            <h3 className="font-medium text-gray-900">{goal.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.text}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{frequencyLabel}</span>
            <span className="font-medium text-gray-900">{formatTarget()}</span>
          </div>
          <ProgressBar value={progress.percentage} color={progressColor} />
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            Tracking: "{goal.activityPattern}"
          </p>
          {progress.status !== 'complete' && (
            <Button size="sm" variant="ghost" onClick={handleAddToToday}>
              <Plus className="w-3 h-3 mr-1" /> Add to Today
            </Button>
          )}
        </div>

        {progress.status === 'complete' && (
          <div className="mt-2 py-1 px-2 bg-green-50 rounded text-sm text-green-700 text-center">
            Goal achieved!
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Goal"
      >
        <GoalForm goal={goal} onClose={() => setShowEdit(false)} />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Goal"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteGoal(goal.id);
                setShowDelete(false);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete "{goal.name}"? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
