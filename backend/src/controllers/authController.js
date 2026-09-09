import { registerUser, authenticateUser } from '../services/authService.js';
import { validateSignupInput, validateLoginInput } from '../utils/validators.js';
import { generateToken } from '../utils/generateToken.js';

/**
 * POST /api/auth/signup
 */
export async function signup(req, res) {
  const input = validateSignupInput(req.body);
  const user = await registerUser(input);

  res.status(201).json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      token: generateToken(user._id),
    },
  });
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  const input = validateLoginInput(req.body);
  const user = await authenticateUser(input);

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      token: generateToken(user._id),
    },
  });
}

/**
 * GET /api/auth/me — rehydrates the session on page refresh.
 */
export async function me(req, res) {
  res.json({
    success: true,
    data: { user: req.user.toPublicJSON() },
  });
}
