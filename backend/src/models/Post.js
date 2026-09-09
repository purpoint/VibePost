import mongoose from 'mongoose';

/**
 * A like. Stored inside the post document rather than its own collection,
 * which is what keeps the application to exactly two collections. The username
 * is denormalised so the feed can show who liked a post without a lookup.
 */
const likeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
  },
  { _id: false }
);

/**
 * A comment, also embedded. Keeps its own _id so a single comment can be
 * addressed later.
 */
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [500, 'Comment must be at most 500 characters'],
  },
  createdAt: { type: Date, default: Date.now },
});

/**
 * The author's public identity at the time of posting.
 *
 * Deliberate denormalisation: a feed request returns everything needed to
 * render the post header without joining against the users collection.
 */
const authorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: authorSchema, required: true },
    text: {
      type: String,
      trim: true,
      maxlength: [1000, 'Post must be at most 1000 characters'],
      default: '',
    },
    imageUrl: { type: String, default: '' },
    likes: { type: [likeSchema], default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

/**
 * A post must carry text, an image, or both — never neither.
 * Enforced here as well as in the request validator so the rule holds no
 * matter how a document is created.
 */
postSchema.pre('validate', function requireContent(next) {
  if (!this.text?.trim() && !this.imageUrl?.trim()) {
    this.invalidate('text', 'Post text or image is required');
  }
  next();
});

// Counts are derived rather than stored, so they can never drift from the
// arrays they describe.
postSchema.virtual('likeCount').get(function likeCount() {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function commentCount() {
  return this.comments.length;
});

postSchema.index({ createdAt: -1 });
postSchema.index({ 'author.userId': 1, createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);
