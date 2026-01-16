import { Category, Settings } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  { id: 'personal', name: 'Personal', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  { id: 'health', name: 'Health', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { id: 'meals', name: 'Meals', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  { id: 'commute', name: 'Commute', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  { id: 'projects', name: 'Projects', color: 'teal', bgColor: 'bg-teal-100', textColor: 'text-teal-700' },
  { id: 'learning', name: 'Learning', color: 'indigo', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700' },
  { id: 'rest', name: 'Rest', color: 'pink', bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
];

export const DEFAULT_SETTINGS: Settings = {
  defaultWakeTime: '07:00',
  defaultSleepTime: '23:00',
  weekStartsOn: 1, // Monday
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
  green: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-500' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', bar: 'bg-gray-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', bar: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', bar: 'bg-pink-500' },
};

// Day of week names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
