import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * One of the application's two collections.
 *
 * `passwordHash` is `select: false` so it is excluded from every query unless
 * explicitly requested, and the toJSON transform strips it as a second layer of
 * defence — the hash must never reach an API response.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      unique: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      match: [USERNAME_PATTERN, 'Username may only contain letters, numbers and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [EMAIL_PATTERN, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Hashes a plaintext password. Kept on the model so the cost factor lives in
 * exactly one place.
 */
userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
};

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/**
 * The public shape of a user, safe to send to any client.
 */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
