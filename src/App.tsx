import { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import DayPlanner from './components/daily/DayPlanner';
import GoalsDashboard from './components/goals/GoalsDashboard';
import HistoryView from './components/history/HistoryView';

type View = 'planner' | 'goals' | 'history';

export default function App() {
  const [activeView, setActiveView] = useState<View>('planner');

  const renderView = () => {
    switch (activeView) {
      case 'planner':
        return <DayPlanner />;
      case 'goals':
        return <GoalsDashboard />;
      case 'history':
        return <HistoryView />;
      default:
        return <DayPlanner />;
    }
  };

  return (
    <MainLayout activeView={activeView} onViewChange={(view) => setActiveView(view as View)}>
      {renderView()}
    </MainLayout>
  );
}
