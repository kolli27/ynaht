import { useState } from 'react';
import { LayoutDashboard, Target, History, ChevronRight, Archive, Settings, Keyboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { minutesToHoursMinutes } from '../../utils/time';
import CategoryBadge from '../ui/CategoryBadge';
import ProgressBar from '../ui/ProgressBar';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onShowShortcuts?: () => void;
}

export default function Sidebar({ activeView, onViewChange, onShowShortcuts }: SidebarProps) {
  const { currentSession, allocatedMinutes, goalProgress, state, thisWeeksBacklog } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'planner', label: 'Daily Planner', icon: LayoutDashboard, shortcut: '1' },
    { id: 'goals', label: 'Goals', icon: Target, shortcut: '2' },
    { id: 'history', label: 'History', icon: History, shortcut: '3' },
    { id: 'settings', label: 'Settings', icon: Settings, shortcut: '4' },
  ];

  // Calculate time by category
  const activities = currentSession?.activities || [];
  const timeByCategory = activities.reduce((acc: Record<string, number>, activity) => {
    acc[activity.categoryId] = (acc[activity.categoryId] || 0) + activity.plannedMinutes;
    return acc;
  }, {});

  if (collapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <button
          onClick={() => setCollapsed(false)}
          className="p-4 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full p-4 flex justify-center hover:bg-gray-100 transition-colors ${
                activeView === item.id ? 'bg-primary-50 text-primary-600' : 'text-gray-600'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Navigation */}
      <nav className="p-4 border-b border-gray-200">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
              activeView === item.id
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1 text-left">{item.label}</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
              {item.shortcut}
            </kbd>
          </button>
        ))}
      </nav>

      {/* Time by Category */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Time by Category</h3>
        {allocatedMinutes === 0 ? (
          <p className="text-sm text-gray-400">No activities planned yet</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(timeByCategory)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([categoryId, minutes]) => (
                <div key={categoryId} className="flex items-center justify-between">
                  <CategoryBadge categoryId={categoryId} size="sm" />
                  <span className="text-sm text-gray-600">{minutesToHoursMinutes(minutes as number)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Goals Progress */}
      {state.goals.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Weekly Goals</h3>
          <div className="space-y-3">
            {goalProgress
              .filter((gp) => gp.goal.frequency === 'weekly')
              .slice(0, 3)
              .map((gp) => (
                <div key={gp.goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 truncate">{gp.goal.name}</span>
                    <span className="text-gray-500">
                      {gp.goal.targetType === 'count'
                        ? `${gp.currentValue}/${gp.targetValue}`
                        : `${Math.round(gp.currentValue / 60)}/${Math.round(gp.targetValue / 60)}h`}
                    </span>
                  </div>
                  <ProgressBar
                    value={gp.percentage}
                    size="sm"
                    color={gp.status === 'complete' ? 'green' : gp.status === 'on-track' ? 'primary' : 'yellow'}
                  />
                </div>
              ))}
            {goalProgress.filter((gp) => gp.goal.frequency === 'weekly').length === 0 && (
              <p className="text-sm text-gray-400">No weekly goals set</p>
            )}
          </div>
        </div>
      )}

      {/* Backlog Indicator */}
      {thisWeeksBacklog.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => onViewChange('history')}
            className="w-full flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 hover:bg-yellow-100 transition-colors"
          >
            <Archive className="w-4 h-4" />
            <span>{thisWeeksBacklog.length} item{thisWeeksBacklog.length > 1 ? 's' : ''} in backlog</span>
          </button>
        </div>
      )}

      {/* Spacer and Bottom Actions */}
      <div className="flex-1" />

      {/* Keyboard Shortcuts Button */}
      {onShowShortcuts && (
        <button
          onClick={onShowShortcuts}
          className="mx-4 mb-2 p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
        >
          <Keyboard className="w-4 h-4" />
          <span>Shortcuts</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">?</kbd>
        </button>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(true)}
        className="p-3 border-t border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Collapse
      </button>
    </aside>
  );
}
