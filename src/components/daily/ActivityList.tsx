import { useApp } from '../../context/AppContext';
import { CheckCircle, ListTodo, Sparkles } from 'lucide-react';
import ActivityCard from './ActivityCard';

interface ActivityListProps {
  showActualInput?: boolean;
}

export default function ActivityList({ showActualInput = false }: ActivityListProps) {
  const { currentSession } = useApp();

  if (!currentSession) {
    return (
      <div className="card p-8 text-center animate-fadeIn">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ListTodo className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium mb-1">No day session active</p>
        <p className="text-sm text-gray-400">Start your day to add activities</p>
      </div>
    );
  }

  const sortedActivities = [...currentSession.activities].sort((a, b) => a.order - b.order);

  // Separate completed and pending activities
  const pendingActivities = sortedActivities.filter(a => !a.completed);
  const completedActivities = sortedActivities.filter(a => a.completed);

  const completedCount = completedActivities.length;
  const totalCount = sortedActivities.length;

  if (sortedActivities.length === 0) {
    return (
      <div className="card p-8 text-center animate-fadeIn">
        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ListTodo className="w-6 h-6 text-primary-400" />
        </div>
        <p className="text-gray-600 font-medium mb-1">No activities planned yet</p>
        <p className="text-sm text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">/</kbd> to quickly add your first activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress summary */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className={`w-4 h-4 ${completedCount === totalCount ? 'text-green-500' : 'text-gray-400'}`} />
            <span>
              {completedCount} of {totalCount} completed
            </span>
          </div>
          {completedCount > 0 && completedCount < totalCount && (
            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
          {completedCount === totalCount && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1 animate-fadeIn">
              <Sparkles className="w-4 h-4" />
              All done!
            </span>
          )}
        </div>
      )}

      {/* Pending activities */}
      {pendingActivities.map((activity, index) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          isFirst={index === 0}
          isLast={index === pendingActivities.length - 1 && completedActivities.length === 0}
          showActualInput={showActualInput}
        />
      ))}

      {/* Completed section */}
      {completedActivities.length > 0 && (
        <>
          {pendingActivities.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase">Completed</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}
          {completedActivities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isFirst={pendingActivities.length === 0 && index === 0}
              isLast={index === completedActivities.length - 1}
              showActualInput={showActualInput}
            />
          ))}
        </>
      )}
    </div>
  );
}
