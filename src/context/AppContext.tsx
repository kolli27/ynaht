import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import {
  AppState, DaySession, Activity, Goal, Settings, ViewMode,
  HistoricalActivity, GoalProgress, GoalStatus, BacklogItem,
  MorningNudge, EveningNudge, SuggestedActivity, TriageState
} from '../types';
import { DEFAULT_SETTINGS } from '../constants/categories';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { differenceInMinutes, parseISO, startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

// Helper to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get remaining minutes until sleep
function getRemainingMinutes(plannedSleepTime: string): number {
  const now = new Date();
  const sleepTime = parseISO(plannedSleepTime);
  return Math.max(0, differenceInMinutes(sleepTime, now));
}

// Action types
type Action =
  | { type: 'START_NEW_DAY'; payload: { wakeTime: string; plannedSleepTime: string } }
  | { type: 'UPDATE_SLEEP_TIME'; payload: string }
  | { type: 'COMPLETE_MORNING_SETUP' }
  | { type: 'ADD_ACTIVITY'; payload: Omit<Activity, 'id' | 'order' | 'daySessionId'> }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'DELETE_ACTIVITY'; payload: string }
  | { type: 'COMPLETE_ACTIVITY'; payload: { activityId: string; actualMinutes?: number } }
  | { type: 'MOVE_ACTIVITY_TO_BACKLOG'; payload: string }
  | { type: 'REORDER_ACTIVITIES'; payload: Activity[] }
  | { type: 'START_TIMER'; payload: string }
  | { type: 'PAUSE_TIMER'; payload: string }
  | { type: 'RESUME_TIMER'; payload: string }
  | { type: 'STOP_TIMER'; payload: { activityId: string; actualMinutes: number } }
  | { type: 'ADD_GOAL'; payload: Omit<Goal, 'id' | 'createdAt' | 'isActive'> }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_FROM_BACKLOG'; payload: string }
  | { type: 'REMOVE_FROM_BACKLOG'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'END_DAY' }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode };

// Initial state
const initialState: AppState = {
  daySessions: {},
  currentSessionId: null,
  goals: [],
  backlog: [],
  settings: DEFAULT_SETTINGS,
};

// Reducer
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_NEW_DAY': {
      const { wakeTime, plannedSleepTime } = action.payload;
      const newSession: DaySession = {
        id: generateId(),
        wakeTime,
        plannedSleepTime,
        isActive: true,
        isSetupComplete: false,
        isReconciled: false,
        activities: [],
        createdAt: new Date().toISOString(),
      };

      // Deactivate any previous active session
      const updatedSessions = { ...state.daySessions };
      Object.keys(updatedSessions).forEach(id => {
        if (updatedSessions[id].isActive) {
          updatedSessions[id] = { ...updatedSessions[id], isActive: false };
        }
      });

      return {
        ...state,
        daySessions: { ...updatedSessions, [newSession.id]: newSession },
        currentSessionId: newSession.id,
      };
    }

    case 'UPDATE_SLEEP_TIME': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: { ...session, plannedSleepTime: action.payload },
        },
      };
    }

    case 'COMPLETE_MORNING_SETUP': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: { ...session, isSetupComplete: true },
        },
      };
    }

    case 'ADD_ACTIVITY': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      const newActivity: Activity = {
        ...action.payload,
        id: generateId(),
        daySessionId: state.currentSessionId,
        order: session.activities.length,
      };
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: [...session.activities, newActivity],
          },
        },
      };
    }

    case 'UPDATE_ACTIVITY': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a =>
              a.id === action.payload.id ? action.payload : a
            ),
          },
        },
      };
    }

    case 'DELETE_ACTIVITY': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      const filtered = session.activities.filter(a => a.id !== action.payload);
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: filtered.map((a, i) => ({ ...a, order: i })),
          },
        },
      };
    }

    case 'COMPLETE_ACTIVITY': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a =>
              a.id === action.payload.activityId
                ? {
                    ...a,
                    completed: true,
                    actualMinutes: action.payload.actualMinutes ?? a.plannedMinutes,
                    timer: undefined,
                  }
                : a
            ),
          },
        },
      };
    }

    case 'MOVE_ACTIVITY_TO_BACKLOG': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      const activity = session.activities.find(a => a.id === action.payload);
      if (!activity) return state;

      // Create backlog item
      const weekStart = startOfWeek(new Date(), { weekStartsOn: state.settings.weekStartsOn });
      const existingBacklog = state.backlog.find(
        b => b.activityName.toLowerCase() === activity.name.toLowerCase() &&
             b.weekOf === format(weekStart, 'yyyy-MM-dd')
      );

      let newBacklog: BacklogItem[];
      if (existingBacklog) {
        newBacklog = state.backlog.map(b =>
          b.id === existingBacklog.id
            ? { ...b, postponedCount: b.postponedCount + 1 }
            : b
        );
      } else {
        newBacklog = [...state.backlog, {
          id: generateId(),
          activityName: activity.name,
          categoryId: activity.categoryId,
          plannedMinutes: activity.plannedMinutes,
          postponedCount: 1,
          originalDaySessionId: state.currentSessionId,
          addedToBacklogAt: new Date().toISOString(),
          weekOf: format(weekStart, 'yyyy-MM-dd'),
        }];
      }

      // Remove from session
      const filtered = session.activities.filter(a => a.id !== action.payload);

      return {
        ...state,
        backlog: newBacklog,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: filtered.map((a, i) => ({ ...a, order: i })),
          },
        },
      };
    }

    case 'REORDER_ACTIVITIES': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: { ...session, activities: action.payload },
        },
      };
    }

    case 'START_TIMER': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a =>
              a.id === action.payload
                ? {
                    ...a,
                    timer: {
                      isRunning: true,
                      startedAt: Date.now(),
                      accumulatedSeconds: a.timer?.accumulatedSeconds || 0,
                    },
                  }
                : a
            ),
          },
        },
      };
    }

    case 'PAUSE_TIMER': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a => {
              if (a.id !== action.payload || !a.timer?.isRunning) return a;
              const elapsed = a.timer.startedAt
                ? Math.floor((Date.now() - a.timer.startedAt) / 1000)
                : 0;
              return {
                ...a,
                timer: {
                  isRunning: false,
                  accumulatedSeconds: a.timer.accumulatedSeconds + elapsed,
                  pausedAt: Date.now(),
                },
              };
            }),
          },
        },
      };
    }

    case 'RESUME_TIMER': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a =>
              a.id === action.payload && a.timer
                ? {
                    ...a,
                    timer: {
                      ...a.timer,
                      isRunning: true,
                      startedAt: Date.now(),
                      pausedAt: undefined,
                    },
                  }
                : a
            ),
          },
        },
      };
    }

    case 'STOP_TIMER': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: session.activities.map(a =>
              a.id === action.payload.activityId
                ? {
                    ...a,
                    actualMinutes: action.payload.actualMinutes,
                    completed: true,
                    timer: undefined,
                  }
                : a
            ),
          },
        },
      };
    }

    case 'ADD_GOAL': {
      const newGoal: Goal = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      return { ...state, goals: [...state.goals, newGoal] };
    }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g),
      };

    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };

    case 'ADD_FROM_BACKLOG': {
      if (!state.currentSessionId) return state;
      const backlogItem = state.backlog.find(b => b.id === action.payload);
      if (!backlogItem) return state;

      const session = state.daySessions[state.currentSessionId];
      const newActivity: Activity = {
        id: generateId(),
        name: backlogItem.activityName,
        categoryId: backlogItem.categoryId,
        plannedMinutes: backlogItem.plannedMinutes,
        daySessionId: state.currentSessionId,
        order: session.activities.length,
        postponedCount: backlogItem.postponedCount,
        originalDaySessionId: backlogItem.originalDaySessionId,
      };

      return {
        ...state,
        backlog: state.backlog.filter(b => b.id !== action.payload),
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            activities: [...session.activities, newActivity],
          },
        },
      };
    }

    case 'REMOVE_FROM_BACKLOG':
      return { ...state, backlog: state.backlog.filter(b => b.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'END_DAY': {
      if (!state.currentSessionId) return state;
      const session = state.daySessions[state.currentSessionId];
      return {
        ...state,
        daySessions: {
          ...state.daySessions,
          [state.currentSessionId]: {
            ...session,
            isActive: false,
            isReconciled: true,
            actualSleepTime: new Date().toISOString(),
          },
        },
        currentSessionId: null,
      };
    }

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  viewMode: ViewMode;
  currentSession: DaySession | null;
  needsMorningSetup: boolean;
  remainingMinutes: number;
  totalAvailableMinutes: number;
  allocatedMinutes: number;
  freeMinutes: number;
  historicalActivities: HistoricalActivity[];
  goalProgress: GoalProgress[];
  morningNudge: MorningNudge | null;
  eveningNudge: EveningNudge | null;
  triageState: TriageState | null;
  thisWeeksBacklog: BacklogItem[];

  // Actions
  setViewMode: (mode: ViewMode) => void;
  startNewDay: (wakeTime: string, plannedSleepTime: string) => void;
  updateSleepTime: (sleepTime: string) => void;
  completeMorningSetup: () => void;
  addActivity: (activity: Omit<Activity, 'id' | 'order' | 'daySessionId'>) => void;
  updateActivity: (activity: Activity) => void;
  deleteActivity: (activityId: string) => void;
  completeActivity: (activityId: string, actualMinutes?: number) => void;
  moveToBacklog: (activityId: string) => void;
  moveActivity: (activityId: string, direction: 'up' | 'down') => void;
  startTimer: (activityId: string) => void;
  pauseTimer: (activityId: string) => void;
  resumeTimer: (activityId: string) => void;
  stopTimer: (activityId: string, actualMinutes: number) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'isActive'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  addFromBacklog: (backlogItemId: string) => void;
  removeFromBacklog: (backlogItemId: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  endDay: () => void;
  getSuggestionForActivity: (name: string) => HistoricalActivity | null;
}

const AppContext = createContext<AppContextType | null>(null);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [viewMode, setViewModeState] = React.useState<ViewMode>('plan');

  // Load state from storage on mount
  useEffect(() => {
    const savedState = loadFromStorage<AppState | null>('appState_v2', null);
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', payload: savedState });
    }
  }, []);

  // Save state to storage on changes
  useEffect(() => {
    saveToStorage('appState_v2', state);
  }, [state]);

  // Get current session
  const currentSession = state.currentSessionId
    ? state.daySessions[state.currentSessionId]
    : null;

  // Check if morning setup is needed
  const needsMorningSetup = !currentSession || !currentSession.isSetupComplete;

  // Calculate time metrics
  const remainingMinutes = currentSession
    ? getRemainingMinutes(currentSession.plannedSleepTime)
    : 0;

  const totalAvailableMinutes = currentSession
    ? differenceInMinutes(
        parseISO(currentSession.plannedSleepTime),
        parseISO(currentSession.wakeTime)
      )
    : 0;

  const allocatedMinutes = currentSession
    ? currentSession.activities.reduce((sum, a) => sum + a.plannedMinutes, 0)
    : 0;

  const freeMinutes = remainingMinutes -
    (currentSession?.activities.filter(a => !a.completed).reduce((sum, a) => sum + a.plannedMinutes, 0) || 0);

  // Calculate historical activities
  const historicalActivities: HistoricalActivity[] = useMemo(() => {
    const activityMap = new Map<string, {
      total: number;
      count: number;
      categoryId: string;
      lastUsed: string;
      variances: number[];
    }>();

    Object.values(state.daySessions).forEach(session => {
      session.activities.forEach(activity => {
        const key = activity.name.toLowerCase();
        const existing = activityMap.get(key);
        const minutes = activity.actualMinutes ?? activity.plannedMinutes;
        const variance = activity.actualMinutes !== undefined
          ? activity.actualMinutes - activity.plannedMinutes
          : 0;

        if (existing) {
          activityMap.set(key, {
            total: existing.total + minutes,
            count: existing.count + 1,
            categoryId: activity.categoryId,
            lastUsed: session.createdAt > existing.lastUsed ? session.createdAt : existing.lastUsed,
            variances: [...existing.variances, variance],
          });
        } else {
          activityMap.set(key, {
            total: minutes,
            count: 1,
            categoryId: activity.categoryId,
            lastUsed: session.createdAt,
            variances: [variance],
          });
        }
      });
    });

    return Array.from(activityMap.entries()).map(([name, data]) => ({
      name,
      averageMinutes: Math.round(data.total / data.count),
      occurrences: data.count,
      categoryId: data.categoryId,
      lastUsed: data.lastUsed,
      averageVariance: data.variances.length > 0
        ? Math.round(data.variances.reduce((a, b) => a + b, 0) / data.variances.length)
        : undefined,
    }));
  }, [state.daySessions]);

  // Calculate goal progress
  const goalProgress: GoalProgress[] = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: state.settings.weekStartsOn });
    const weekEnd = endOfWeek(now, { weekStartsOn: state.settings.weekStartsOn });

    return state.goals.filter(g => g.isActive).map(goal => {
      let currentValue = 0;

      Object.values(state.daySessions).forEach(session => {
        const sessionDate = parseISO(session.wakeTime);
        if (!isWithinInterval(sessionDate, { start: weekStart, end: weekEnd })) return;

        session.activities.forEach(activity => {
          const matches = activity.name.toLowerCase().includes(goal.activityPattern.toLowerCase());
          if (matches && (activity.completed || activity.actualMinutes !== undefined)) {
            if (goal.targetType === 'count') {
              currentValue += 1;
            } else {
              currentValue += activity.actualMinutes ?? activity.plannedMinutes;
            }
          }
        });
      });

      const percentage = Math.min(100, (currentValue / goal.targetValue) * 100);
      const remaining = Math.max(0, goal.targetValue - currentValue);

      // Determine status based on day of week and progress
      const dayOfWeek = now.getDay();
      const daysIntoWeek = (dayOfWeek - state.settings.weekStartsOn + 7) % 7;
      const expectedProgress = ((daysIntoWeek + 1) / 7) * 100;

      let status: GoalStatus;
      if (percentage >= 100) {
        status = 'complete';
      } else if (percentage >= expectedProgress - 10) {
        status = percentage >= expectedProgress + 20 ? 'ahead' : 'on-track';
      } else {
        status = 'behind';
      }

      // Get average duration for this activity
      const historical = historicalActivities.find(
        h => h.name.toLowerCase().includes(goal.activityPattern.toLowerCase())
      );

      return {
        goal,
        currentValue,
        targetValue: goal.targetValue,
        percentage,
        status,
        remaining,
        averageDuration: historical?.averageMinutes,
      };
    });
  }, [state.goals, state.daySessions, state.settings.weekStartsOn, historicalActivities]);

  // Generate morning nudge
  const morningNudge: MorningNudge | null = useMemo(() => {
    if (!needsMorningSetup && currentSession?.isSetupComplete) return null;

    const behindGoals = goalProgress.filter(gp => gp.status === 'behind');
    const suggestions: SuggestedActivity[] = behindGoals.map(gp => ({
      name: gp.goal.activityPattern,
      categoryId: gp.goal.categoryId || 'personal',
      suggestedMinutes: gp.averageDuration || 30,
      reason: `Weekly goal: ${gp.currentValue}/${gp.targetValue} ${gp.goal.targetType === 'count' ? 'times' : 'min'}`,
      goalId: gp.goal.id,
    }));

    return {
      type: 'goal-status',
      goalProgress,
      suggestions,
      dayOfWeek: format(new Date(), 'EEEE'),
    };
  }, [needsMorningSetup, currentSession?.isSetupComplete, goalProgress]);

  // Generate evening nudge
  const eveningNudge: EveningNudge | null = useMemo(() => {
    if (!currentSession || !currentSession.isSetupComplete) return null;

    const effectiveFreeMinutes = freeMinutes;
    const behindGoals = goalProgress.filter(gp => gp.status === 'behind');

    if (effectiveFreeMinutes < 60) return null;

    if (behindGoals.length === 0) {
      return {
        type: 'on-track',
        remainingMinutes: effectiveFreeMinutes,
        behindGoals: [],
        suggestedActivities: [],
        message: "You're crushing it this week! All weekly goals on track.",
      };
    }

    const suggestions: SuggestedActivity[] = behindGoals
      .filter(gp => (gp.averageDuration || 30) <= effectiveFreeMinutes)
      .map(gp => ({
        name: gp.goal.activityPattern,
        categoryId: gp.goal.categoryId || 'personal',
        suggestedMinutes: Math.min(gp.averageDuration || 30, effectiveFreeMinutes),
        reason: `Need ${gp.remaining} more ${gp.goal.targetType === 'count' ? 'times' : 'min'} this week`,
        goalId: gp.goal.id,
      }));

    return {
      type: behindGoals.length > 0 ? 'behind-schedule' : 'free-time',
      remainingMinutes: effectiveFreeMinutes,
      behindGoals,
      suggestedActivities: suggestions,
      message: `You have ${Math.round(effectiveFreeMinutes / 60 * 10) / 10} hours of free time and ${behindGoals.length} goal(s) behind schedule.`,
    };
  }, [currentSession, freeMinutes, goalProgress]);

  // Generate triage state
  const triageState: TriageState | null = useMemo(() => {
    if (!currentSession || !currentSession.isSetupComplete) return null;

    const incompleteActivities = currentSession.activities.filter(a => !a.completed);
    const totalIncompleteMinutes = incompleteActivities.reduce((sum, a) => sum + a.plannedMinutes, 0);

    if (remainingMinutes > 30 || incompleteActivities.length === 0) return null;

    return {
      isActive: true,
      currentTime: new Date().toISOString(),
      plannedSleepTime: currentSession.plannedSleepTime,
      remainingMinutes,
      incompleteActivities,
      totalIncompleteMinutes,
    };
  }, [currentSession, remainingMinutes]);

  // Get this week's backlog
  const thisWeeksBacklog = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: state.settings.weekStartsOn });
    const weekOf = format(weekStart, 'yyyy-MM-dd');
    return state.backlog.filter(b => b.weekOf === weekOf);
  }, [state.backlog, state.settings.weekStartsOn]);

  // Actions
  const setViewMode = (mode: ViewMode) => setViewModeState(mode);

  const startNewDay = (wakeTime: string, plannedSleepTime: string) => {
    dispatch({ type: 'START_NEW_DAY', payload: { wakeTime, plannedSleepTime } });
  };

  const updateSleepTime = (sleepTime: string) => {
    dispatch({ type: 'UPDATE_SLEEP_TIME', payload: sleepTime });
  };

  const completeMorningSetup = () => {
    dispatch({ type: 'COMPLETE_MORNING_SETUP' });
  };

  const addActivity = (activity: Omit<Activity, 'id' | 'order' | 'daySessionId'>) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: activity });
  };

  const updateActivity = (activity: Activity) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: activity });
  };

  const deleteActivity = (activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: activityId });
  };

  const completeActivity = (activityId: string, actualMinutes?: number) => {
    dispatch({ type: 'COMPLETE_ACTIVITY', payload: { activityId, actualMinutes } });
  };

  const moveToBacklog = (activityId: string) => {
    dispatch({ type: 'MOVE_ACTIVITY_TO_BACKLOG', payload: activityId });
  };

  const moveActivity = (activityId: string, direction: 'up' | 'down') => {
    if (!currentSession) return;
    const activities = [...currentSession.activities];
    const index = activities.findIndex(a => a.id === activityId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activities.length) return;

    [activities[index], activities[newIndex]] = [activities[newIndex], activities[index]];
    const reordered = activities.map((a, i) => ({ ...a, order: i }));
    dispatch({ type: 'REORDER_ACTIVITIES', payload: reordered });
  };

  const startTimer = (activityId: string) => {
    dispatch({ type: 'START_TIMER', payload: activityId });
  };

  const pauseTimer = (activityId: string) => {
    dispatch({ type: 'PAUSE_TIMER', payload: activityId });
  };

  const resumeTimer = (activityId: string) => {
    dispatch({ type: 'RESUME_TIMER', payload: activityId });
  };

  const stopTimer = (activityId: string, actualMinutes: number) => {
    dispatch({ type: 'STOP_TIMER', payload: { activityId, actualMinutes } });
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt' | 'isActive'>) => {
    dispatch({ type: 'ADD_GOAL', payload: goal });
  };

  const updateGoal = (goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
  };

  const deleteGoal = (goalId: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: goalId });
  };

  const addFromBacklog = (backlogItemId: string) => {
    dispatch({ type: 'ADD_FROM_BACKLOG', payload: backlogItemId });
  };

  const removeFromBacklog = (backlogItemId: string) => {
    dispatch({ type: 'REMOVE_FROM_BACKLOG', payload: backlogItemId });
  };

  const updateSettings = (settings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const endDay = () => {
    dispatch({ type: 'END_DAY' });
  };

  const getSuggestionForActivity = (name: string): HistoricalActivity | null => {
    if (!name) return null;
    return historicalActivities.find(
      h => h.name.toLowerCase() === name.toLowerCase()
    ) || null;
  };

  const value: AppContextType = {
    state,
    viewMode,
    currentSession,
    needsMorningSetup,
    remainingMinutes,
    totalAvailableMinutes,
    allocatedMinutes,
    freeMinutes,
    historicalActivities,
    goalProgress,
    morningNudge,
    eveningNudge,
    triageState,
    thisWeeksBacklog,
    setViewMode,
    startNewDay,
    updateSleepTime,
    completeMorningSetup,
    addActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    moveToBacklog,
    moveActivity,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addGoal,
    updateGoal,
    deleteGoal,
    addFromBacklog,
    removeFromBacklog,
    updateSettings,
    endDay,
    getSuggestionForActivity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
