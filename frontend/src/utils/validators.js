/**
 * Client-side validation. Mirrors the backend rules to give instant feedback —
 * the server remains the authority, this only improves the experience.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validateLoginForm({ email, password }) {
  const errors = {};

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address';

  if (!password) errors.password = 'Password is required';

  return errors;
}

export function validateSignupForm({ name, username, email, password }) {
  const errors = {};

  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Name is required';
  else if (trimmedName.length < 2 || trimmedName.length > 50)
    errors.name = 'Name must be between 2 and 50 characters';

  const normalisedUsername = username.trim().toLowerCase();
  if (!normalisedUsername) errors.username = 'Username is required';
  else if (normalisedUsername.length < 3 || normalisedUsername.length > 20)
    errors.username = 'Username must be between 3 and 20 characters';
  else if (!USERNAME_PATTERN.test(normalisedUsername))
    errors.username = 'Use only letters, numbers and underscores';

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;

  return errors;
}
