/**
 * Persists the auth token so a page refresh does not log the user out.
 *
 * localStorage is readable by any script on the origin, which is an accepted
 * trade-off for this assignment; a production system would prefer an
 * httpOnly cookie. Access is wrapped because private-mode browsers can throw.
 */
const TOKEN_KEY = 'vibepost.token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable — the session simply will not survive a refresh.
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}
