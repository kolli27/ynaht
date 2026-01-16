import { useState, useEffect } from 'react';

interface TimeInputProps {
  value: number; // minutes
  onChange: (minutes: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  showHours?: boolean;
}

export default function TimeInput({
  value,
  onChange,
  label,
  min = 0,
  max = 1440, // 24 hours
  step = 5,
  showHours = true,
}: TimeInputProps) {
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60);

  useEffect(() => {
    setHours(Math.floor(value / 60));
    setMinutes(value % 60);
  }, [value]);

  const handleHoursChange = (newHours: number) => {
    const totalMinutes = Math.max(min, Math.min(max, newHours * 60 + minutes));
    onChange(totalMinutes);
  };

  const handleMinutesChange = (newMinutes: number) => {
    const totalMinutes = Math.max(min, Math.min(max, hours * 60 + newMinutes));
    onChange(totalMinutes);
  };

  const incrementBy = (amount: number) => {
    const newValue = Math.max(min, Math.min(max, value + amount));
    onChange(newValue);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {showHours && (
          <>
            <div className="flex items-center">
              <input
                type="number"
                value={hours}
                onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
                min={0}
                max={23}
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <span className="ml-1 text-sm text-gray-600">h</span>
            </div>
          </>
        )}
        <div className="flex items-center">
          <input
            type="number"
            value={minutes}
            onChange={(e) => handleMinutesChange(parseInt(e.target.value) || 0)}
            min={0}
            max={59}
            step={step}
            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <span className="ml-1 text-sm text-gray-600">m</span>
        </div>

        <div className="flex gap-1 ml-2">
          <button
            type="button"
            onClick={() => incrementBy(-step)}
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            -{step}m
          </button>
          <button
            type="button"
            onClick={() => incrementBy(step)}
            className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            +{step}m
          </button>
        </div>
      </div>
    </div>
  );
}
