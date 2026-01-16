const USER_ID_KEY = 'ynaht_userId';

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get or create a user ID
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = generateUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

// Get user ID if it exists (for checking if user has used app before)
export function getExistingUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

// Clear user ID (useful for testing or reset)
export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}
