// Timer state for pause/resume functionality
export interface TimerState {
  isRunning: boolean;
  startedAt?: number; // Unix timestamp when timer started/resumed
  accumulatedSeconds: number; // Total seconds accumulated from previous sessions
  pausedAt?: number; // Unix timestamp when paused
}

export interface Activity {
  id: string;
  name: string;
  plannedMinutes: number;
  actualMinutes?: number;
  categoryId: string;
  daySessionId: string; // Links to DaySession instead of date
  order: number;
  notes?: string;
  completed?: boolean;
  timer?: TimerState;
  // Backlog tracking
  postponedCount?: number;
  originalDaySessionId?: string; // If moved from another day
}

// Wake-to-sleep day session (replaces date-based DayPlan)
export interface DaySession {
  id: string;
  // Wake-to-sleep times (can span midnight)
  wakeTime: string; // ISO datetime when user woke up
  plannedSleepTime: string; // ISO datetime when user plans to sleep
  actualSleepTime?: string; // ISO datetime when user actually went to sleep
  // Status
  isActive: boolean; // Is this the current active day?
  isSetupComplete: boolean; // Has user completed morning setup?
  isReconciled: boolean; // Has user completed end-of-day reconciliation?
  // Activities for this day session
  activities: Activity[];
  // Metadata
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface Goal {
  id: string;
  name: string;
  categoryId?: string;
  targetType: 'count' | 'duration';
  targetValue: number; // count or minutes
  frequency: 'daily' | 'weekly' | 'monthly';
  activityPattern: string; // name pattern to match
  createdAt: string;
  isActive: boolean;
}

export type GoalStatus = 'behind' | 'on-track' | 'ahead' | 'complete';

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  targetValue: number;
  percentage: number;
  status: GoalStatus;
  remaining: number; // What's left to reach target
  averageDuration?: number; // Average duration for this activity
}

export interface BacklogItem {
  id: string;
  activityName: string;
  categoryId: string;
  plannedMinutes: number;
  postponedCount: number;
  originalDaySessionId: string;
  addedToBacklogAt: string; // ISO datetime
  weekOf: string; // ISO date of week start (for weekly backlog grouping)
}

export interface HistoricalActivity {
  name: string;
  averageMinutes: number;
  occurrences: number;
  categoryId: string;
  lastUsed: string;
  averageVariance?: number; // avg(actual - planned)
}

export interface Settings {
  defaultWakeTime: string; // HH:mm format
  defaultSleepTime: string; // HH:mm format
  weekStartsOn: 0 | 1; // Sunday or Monday
  productivityBuffer: number; // Percentage (e.g., 15 for 15%)
  lastExportedAt?: string; // ISO datetime of last export
  hasCompletedOnboarding: boolean;
}

export interface AppState {
  daySessions: Record<string, DaySession>; // keyed by session ID
  currentSessionId: string | null; // ID of active day session
  goals: Goal[];
  backlog: BacklogItem[];
  settings: Settings;
}

export type ViewMode = 'plan' | 'reconcile' | 'triage';

// Morning/Evening nudge types
export interface MorningNudge {
  type: 'goal-status';
  goalProgress: GoalProgress[];
  suggestions: SuggestedActivity[];
  dayOfWeek: string;
}

export interface EveningNudge {
  type: 'free-time' | 'behind-schedule' | 'on-track';
  remainingMinutes: number;
  behindGoals: GoalProgress[];
  suggestedActivities: SuggestedActivity[];
  message: string;
}

export interface SuggestedActivity {
  name: string;
  categoryId: string;
  suggestedMinutes: number;
  reason: string; // "Based on weekly goal" or "From backlog"
  goalId?: string;
  backlogItemId?: string;
}

export interface TriageOption {
  type: 'extend' | 'move' | 'shorten' | 'skip';
  activityId?: string;
  newValue?: number; // For extend (new sleep time) or shorten (new duration)
}

export interface TriageState {
  isActive: boolean;
  currentTime: string;
  plannedSleepTime: string;
  remainingMinutes: number;
  incompleteActivities: Activity[];
  totalIncompleteMinutes: number;
}
