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

  // Let the browser set multipart/form-data itself: it has to append the
  // boundary, which the JSON default would overwrite.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
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

export const postsApi = {
  list: ({ page = 1, limit = 10, sort = 'latest', search = '' } = {}) =>
    api.get('/posts', { params: { page, limit, sort, ...(search ? { search } : {}) } }).then(unwrap),

  get: (id) => api.get(`/posts/${id}`).then(unwrap),

  /**
   * Creates a post. Sent as multipart so an image file can ride along; the
   * backend accepts the same shape with or without one.
   */
  create: ({ text = '', imageFile = null }) => {
    const form = new FormData();
    if (text) form.append('text', text);
    if (imageFile) form.append('image', imageFile);
    return api.post('/posts', form).then(unwrap);
  },

  remove: (id) => api.delete(`/posts/${id}`).then(unwrap),

  toggleLike: (id) => api.post(`/posts/${id}/like`).then(unwrap),

  listComments: (id) => api.get(`/posts/${id}/comments`).then(unwrap),

  addComment: (id, text) => api.post(`/posts/${id}/comments`, { text }).then(unwrap),
};

export const authApi = {
  signup: (payload) => api.post('/auth/signup', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
};
