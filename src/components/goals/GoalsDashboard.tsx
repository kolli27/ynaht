import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function GoalsDashboard() {
  const { state, goalProgress } = useApp();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  const filteredGoals = filter === 'all'
    ? state.goals
    : state.goals.filter(g => g.frequency === filter);

  const goalsByFrequency = {
    daily: state.goals.filter(g => g.frequency === 'daily'),
    weekly: state.goals.filter(g => g.frequency === 'weekly'),
    monthly: state.goals.filter(g => g.frequency === 'monthly'),
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500">Track your recurring time commitments</p>
        </div>
        <Button onClick={() => setShowAddGoal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg inline-flex">
        {(['all', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
          <button
            key={freq}
            onClick={() => setFilter(freq)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              filter === freq
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {freq}
            {freq !== 'all' && (
              <span className="ml-1 text-gray-400">({goalsByFrequency[freq].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="card p-12 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-4">
            Set recurring goals to track habits like exercise, reading, or learning.
          </p>
          <Button onClick={() => setShowAddGoal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {state.goals.length > 0 && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{state.goals.length}</div>
            <div className="text-sm text-gray-500">Total Goals</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {goalProgress.filter(gp => gp.status === 'complete').length}
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {goalProgress.filter(gp => gp.status === 'on-track' || gp.status === 'ahead').length}
            </div>
            <div className="text-sm text-gray-500">On Track</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {goalProgress.filter(gp => gp.status === 'behind').length}
            </div>
            <div className="text-sm text-gray-500">Behind</div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        title="Create New Goal"
      >
        <GoalForm onClose={() => setShowAddGoal(false)} />
      </Modal>
    </div>
  );
}
