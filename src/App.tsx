import { useState, useEffect, useCallback } from 'react';
import MainLayout from './components/layout/MainLayout';
import DayPlanner from './components/daily/DayPlanner';
import GoalsDashboard from './components/goals/GoalsDashboard';
import HistoryView from './components/history/HistoryView';
import SettingsPage from './components/settings/SettingsPage';
import KeyboardShortcutsModal from './components/ui/KeyboardShortcutsModal';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import { useApp } from './context/AppContext';

type View = 'planner' | 'goals' | 'history' | 'settings';

export default function App() {
  const { state, updateSettings } = useApp();
  const [activeView, setActiveView] = useState<View>('planner');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Check if onboarding is needed
  const needsOnboarding = !state.settings.hasCompletedOnboarding;

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // These shortcuts work even when not typing
    if (!isTyping) {
      switch (e.key) {
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;
        case '1':
          e.preventDefault();
          setActiveView('planner');
          break;
        case '2':
          e.preventDefault();
          setActiveView('goals');
          break;
        case '3':
          e.preventDefault();
          setActiveView('history');
          break;
        case '4':
          e.preventDefault();
          setActiveView('settings');
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCompleteOnboarding = () => {
    updateSettings({ hasCompletedOnboarding: true });
  };

  // Show onboarding for new users
  if (needsOnboarding) {
    return <OnboardingFlow onComplete={handleCompleteOnboarding} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'planner':
        return <DayPlanner />;
      case 'goals':
        return <GoalsDashboard />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DayPlanner />;
    }
  };

  return (
    <>
      <MainLayout
        activeView={activeView}
        onViewChange={(view) => setActiveView(view as View)}
        onShowShortcuts={() => setShowShortcuts(true)}
      >
        {renderView()}
      </MainLayout>

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
