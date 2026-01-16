import { useState } from 'react';
import { Sun, Moon, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format, setHours, setMinutes, addDays } from 'date-fns';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function MorningSetup() {
  const { state, startNewDay, completeMorningSetup } = useApp();
  const now = new Date();

  // Default wake time to now, rounded to nearest 15 min
  const roundedNow = new Date(now);
  roundedNow.setMinutes(Math.round(now.getMinutes() / 15) * 15, 0, 0);

  const [wakeTime, setWakeTime] = useState(format(roundedNow, 'HH:mm'));
  const [sleepTime, setSleepTime] = useState(state.settings.defaultSleepTime || '23:00');
  const [spansNextDay, setSpansNextDay] = useState(false);

  // Calculate total hours available
  const calculateHours = () => {
    const [wh, wm] = wakeTime.split(':').map(Number);
    const [sh, sm] = sleepTime.split(':').map(Number);

    const wakeMinutes = wh * 60 + wm;
    let sleepMinutes = sh * 60 + sm;

    // If sleep time is before wake time, it spans to next day
    if (sleepMinutes <= wakeMinutes || spansNextDay) {
      sleepMinutes += 24 * 60;
    }

    return (sleepMinutes - wakeMinutes) / 60;
  };

  const hours = calculateHours();

  const handleStartDay = () => {
    const today = new Date();
    const [wh, wm] = wakeTime.split(':').map(Number);
    const [sh, sm] = sleepTime.split(':').map(Number);

    // Create wake datetime (today at wake time)
    const wakeDateTime = setMinutes(setHours(today, wh), wm);

    // Create sleep datetime
    let sleepDateTime = setMinutes(setHours(today, sh), sm);

    // If sleep is before wake or user selected spans next day, add a day
    if (sh * 60 + sm <= wh * 60 + wm || spansNextDay) {
      sleepDateTime = addDays(sleepDateTime, 1);
    }

    startNewDay(wakeDateTime.toISOString(), sleepDateTime.toISOString());
    completeMorningSetup();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6">
        <div className="text-center mb-6">
          <Sun className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Good Morning!</h1>
          <p className="text-gray-500 mt-1">Let's set up your day</p>
        </div>

        <div className="space-y-6">
          {/* Wake Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              When did you wake up?
            </label>
            <Input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>

          {/* Sleep Time */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              When do you plan to sleep?
            </label>
            <Input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
            />
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={spansNextDay}
                onChange={(e) => setSpansNextDay(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Sleep time is after midnight (next day)
            </label>
          </div>

          {/* Hours Available */}
          <div className="p-4 bg-primary-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-primary-700">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Day Length</span>
            </div>
            <div className="text-3xl font-bold text-primary-900 mt-1">
              {hours.toFixed(1)} hours
            </div>
            <p className="text-sm text-primary-600 mt-1">
              {wakeTime} → {sleepTime}{spansNextDay || hours > 16 ? ' (next day)' : ''}
            </p>
          </div>

          {/* Warning if day is very long */}
          {hours > 18 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              That's a long day! Consider getting some rest.
            </div>
          )}

          {/* Start Button */}
          <Button onClick={handleStartDay} className="w-full">
            Start Planning My Day
          </Button>
        </div>
      </div>
    </div>
  );
}
