import axios from 'axios';
import { getStoredToken } from '../utils/tokenStorage.js';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Called when the API reports that the current token is no longer valid.
 * AuthContext registers a handler so an expired session logs the user out
 * everywhere at once, without this module importing React.
 */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Turns every failure into an Error with a message worth showing a user, and
 * unwraps the `{ success, data }` envelope so callers receive just the payload.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error('Unable to reach the server. Please check your connection.')
      );
    }

    const { status, data } = error.response;
    const message = data?.message || 'Something went wrong. Please try again.';

    // A 401 from the login/signup endpoints means "wrong credentials", not
    // "your session expired" — only the latter should log the user out.
    const isCredentialCheck = /\/auth\/(login|signup)$/.test(error.config?.url ?? '');

    if (status === 401 && !isCredentialCheck && onUnauthorized) {
      onUnauthorized(message);
    }

    const normalised = new Error(message);
    normalised.status = status;
    return Promise.reject(normalised);
  }
);

const unwrap = (response) => response.data.data;

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
};
