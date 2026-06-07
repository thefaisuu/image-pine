// Storage keys
const PREFS_KEY = 'imagetools-prefs';
const HISTORY_KEY = 'imagetools-history';

// Safe check for browser environment (SSR support)
const isClient = typeof window !== 'undefined';

/**
 * Saves a preference key-value pair inside the 'imagetools-prefs' object.
 * @param {string} key 
 * @param {any} value 
 */
export function savePreference(key, value) {
  if (!isClient) return;
  try {
    const prefs = getPreference() || {};
    prefs[key] = value;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Error saving preference to localStorage:', error);
  }
}

/**
 * Retrieves a preference value by key, or the entire preference object if key is omitted.
 * @param {string} [key] 
 * @returns {any}
 */
export function getPreference(key) {
  if (!isClient) return key ? null : {};
  try {
    const item = localStorage.getItem(PREFS_KEY);
    const prefs = item ? JSON.parse(item) : {};
    return key ? (prefs[key] !== undefined ? prefs[key] : null) : prefs;
  } catch (error) {
    console.error('Error getting preference from localStorage:', error);
    return key ? null : {};
  }
}

/**
 * Saves a new entry to the tool usage history list.
 * @param {string} toolName 
 * @param {string} fileName 
 */
export function saveHistory(toolName, fileName) {
  if (!isClient) return;
  try {
    const history = getHistory();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      toolName,
      fileName,
    };
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100))); // Keep last 100 entries
  } catch (error) {
    console.error('Error saving history to localStorage:', error);
  }
}

/**
 * Retrieves the list of historical tool usage entries.
 * @returns {Array<{id: string, timestamp: string, toolName: string, fileName: string}>}
 */
export function getHistory() {
  if (!isClient) return [];
  try {
    const item = localStorage.getItem(HISTORY_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error getting history from localStorage:', error);
    return [];
  }
}

/**
 * Clears all history records from localStorage.
 */
export function clearHistory() {
  if (!isClient) return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history from localStorage:', error);
  }
}
