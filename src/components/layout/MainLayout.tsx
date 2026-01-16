import { ReactNode, useState } from 'react';
import { Menu, X, LayoutDashboard, Target, History, Settings } from 'lucide-react';
import Header from './Header';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  onShowShortcuts?: () => void;
}

export default function MainLayout({ children, activeView, onViewChange, onShowShortcuts }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavItems = [
    { id: 'planner', label: 'Daily', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleMobileNavChange = (view: string) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header>
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </Header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar activeView={activeView} onViewChange={onViewChange} onShowShortcuts={onShowShortcuts} />
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <nav className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-slideInRight">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Menu</h2>
              </div>
              <div className="p-4 space-y-1">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNavChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeView === item.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white border-t border-gray-200 px-2 py-1 safe-area-bottom">
        <div className="flex justify-around">
          {mobileNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeView === item.id
                  ? 'text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
