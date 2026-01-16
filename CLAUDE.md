# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YNAHT (You Need A Hour Tracker) is a React + TypeScript time-tracking application for planning daily activities using a **wake-to-sleep** model (not midnight-to-midnight). Users define their day from when they wake up until when they sleep, with activities tracked within that session.

## Development Commands

```bash
npm run dev        # Start dev server on port 5173
npm run build      # TypeScript check + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

### Wake-to-Sleep Day Model
- A "day" = wake time → planned sleep time (can span past midnight)
- Users set their wake/sleep times via MorningSetup when opening the app
- `DaySession` replaces the old date-based model
- Sessions have `wakeTime` and `plannedSleepTime` as ISO datetime strings

### State Management
- Centralized state in `src/context/AppContext.tsx` using React Context + useReducer
- State persists to localStorage with key `ynaht_appState_v2` (prefix: `ynaht_`)
- Key context values:
  - `currentSession` - active day session (replaces old `currentDayPlan`)
  - `needsMorningSetup` - true when user needs to start a new day
  - `goalProgress` - array of GoalProgress objects (use this instead of calling getGoalProgress())
  - `morningNudge` / `eveningNudge` - contextual suggestions based on goals
  - `triageState` - active when approaching bedtime with incomplete activities
  - `thisWeeksBacklog` - postponed activities for the current week

### Core Data Models (src/types/index.ts)
- **DaySession**: Wake-to-sleep period with `wakeTime`, `plannedSleepTime`, `activities[]`, `isSetupComplete`, `isReconciled`
- **Activity**: Task with `plannedMinutes`/`actualMinutes`, `timer` state (supports pause/resume), `categoryId`, `completed`
- **TimerState**: `isRunning`, `startedAt`, `accumulatedSeconds`, `pausedAt` for pause/resume
- **Goal**: Weekly/daily/monthly targets using `activityPattern` for name matching
- **GoalProgress**: Computed progress with `status` ('behind', 'on-track', 'ahead', 'complete')
- **BacklogItem**: Postponed activities with `postponedCount` tracked by week

### Component Organization
```
src/components/
├── layout/     # MainLayout, Header, Sidebar
├── daily/
│   ├── DayPlanner.tsx       # Main view, shows MorningSetup if needed
│   ├── MorningSetup.tsx     # Wake/sleep time input for new day
│   ├── MorningNudgeCard.tsx # Goal suggestions at start of day
│   ├── EveningNudgeCard.tsx # Free time suggestions
│   ├── TriageModeCard.tsx   # Bedtime activity decisions
│   ├── ActivityForm.tsx     # Add/edit activities
│   ├── ActivityCard.tsx     # Individual activity with timer controls
│   ├── ActivityList.tsx     # List of activities
│   └── TimeBudgetBar.tsx    # Time allocation visualization
├── goals/      # GoalsDashboard, GoalForm, GoalCard
└── history/    # HistoryView (includes Backlog tab), WeeklySummary
└── ui/         # Button, Input, Select, Modal, ProgressBar, TimeInput
```

### Key Design Patterns
- **Morning Setup Flow**: `DayPlanner` checks `needsMorningSetup` and renders `MorningSetup` if true
- **Timer Pause/Resume**: Activities have `timer` object with `startTimer`, `pauseTimer`, `resumeTimer`, `stopTimer` actions
- **Goal Tracking**: `goalProgress` array in context provides pre-computed progress; components find their goal's progress from this array
- **Backlog System**: Activities moved via `moveToBacklog()`, restored via `addFromBacklog()`. View in History tab.
- **Triage Mode**: Activates when `remainingMinutes < 30` with incomplete activities

### Utilities
- `src/utils/time.ts` - Date/time formatting using date-fns
- `src/utils/storage.ts` - localStorage helpers with `ynaht_` prefix
- `src/utils/export.ts` - Export to JSON/CSV (uses `daySessions` not `dayPlans`)
- `src/constants/categories.ts` - Default activity categories

### Styling
- Tailwind CSS with custom primary color palette (blue)
- Custom component classes in `src/index.css`: `.btn`, `.btn-primary`, `.input`, `.card`, `.badge`

### Important Context Methods
```typescript
// Starting a day
startNewDay(wakeTime: string, plannedSleepTime: string)
completeMorningSetup()

// Activities
addActivity(activity)
updateActivity(activity)
deleteActivity(activityId)
completeActivity(activityId, actualMinutes?)
moveToBacklog(activityId)

// Timer
startTimer(activityId)
pauseTimer(activityId)
resumeTimer(activityId)
stopTimer(activityId, actualMinutes)

// Goals
addGoal(goal)
updateGoal(goal)
deleteGoal(goalId)

// Backlog
addFromBacklog(backlogItemId)
removeFromBacklog(backlogItemId)

// Day management
updateSleepTime(sleepTime)
endDay()
```
