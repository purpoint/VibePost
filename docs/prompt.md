# VibePost --- Master Build Prompt

## Project Identity

**Project Name:** VibePost\
**Tagline:** Share. Connect. Engage.

VibePost is a mini full-stack social post application built for the 3W
Full Stack Internship Round 1 assignment.

The application should feel like a polished, lightweight social feed
inspired by the Social page of the TaskPlanet app shown in the provided
reference screenshots. It must NOT be a TaskPlanet clone. Recreate the
visual language and interaction patterns while implementing only the
features required by the assignment.

------------------------------------------------------------------------

## Primary Objective

Build and deploy a production-ready mini social platform where users
can:

1.  Create an account using email and password.
2.  Log in securely.
3.  Create posts containing:
    -   text only,
    -   image only,
    -   or text + image.
4.  View a public feed containing posts from all users.
5.  Like and unlike posts.
6.  Comment on posts.
7.  See total likes and comments immediately after an action.
8.  Store the usernames of users who liked or commented.
9.  Use a responsive UI inspired by the supplied TaskPlanet Social
    screenshots.

------------------------------------------------------------------------

## Mandatory Technology

### Frontend

-   React.js
-   Vite
-   React Router
-   Axios
-   CSS Modules or well-organized regular CSS
-   Lucide React or another lightweight icon library if needed

### Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT authentication
-   bcrypt/bcryptjs for password hashing
-   Multer only if needed for image handling

### Database

-   MongoDB Atlas
-   Exactly two application collections:
    -   `users`
    -   `posts`

Do NOT create separate collections for: - likes - comments - followers -
sessions - notifications

Likes and comments must be embedded inside post documents.

### Deployment

-   Frontend: Vercel or Netlify
-   Backend: Render
-   Database: MongoDB Atlas
-   Images: use an external image-storage service such as Cloudinary if
    image uploads are implemented.

### Important Restriction

**DO NOT USE TAILWIND CSS.**

Use basic CSS, CSS Modules, MUI, or React Bootstrap. Prefer custom CSS
for maximum visual control.

------------------------------------------------------------------------

# Product Requirements

## 1. Authentication

### Signup

Fields: - name - username - email - password

Validation: - all required - valid email - username unique - email
unique - minimum reasonable password length - password must never be
returned from API responses

On successful signup: - hash password - create user - optionally issue
JWT - redirect to feed/login depending on chosen flow

### Login

Fields: - email - password

On success: - return JWT - return safe user information - persist
authentication on frontend - redirect to `/feed`

Protected actions: - creating a post - liking/unliking - commenting -
logout

The public feed may remain visible without login, but interactions must
require authentication.

------------------------------------------------------------------------

# 2. Create Post

A post must contain at least one of: - text - image

Reject completely empty posts.

Examples:

Valid: - text only - image only - text + image

Invalid: - empty text + no image

The UI should make image selection obvious.

After posting: - clear the composer - show the new post immediately at
the top - do not require a full page refresh

------------------------------------------------------------------------

# 3. Public Feed

Display posts from all users.

Each post should show:

-   user avatar
-   display name
-   `@username`
-   relative timestamp
-   post text if available
-   post image if available
-   like count
-   comment count
-   like button
-   comment button

Optional visual controls: - follow button - three-dot menu

These are UI-inspired elements and should only be functional if
implemented cleanly. Do not add unnecessary backend complexity for them.

------------------------------------------------------------------------

# 4. Likes

A logged-in user can: - like a post - unlike a post

A user must not be able to create duplicate likes.

Store usernames inside the post document.

Recommended structure:

``` js
likes: [
  {
    userId: ObjectId,
    username: String
  }
]
```

The UI should immediately update: - liked/unliked state - total count

Prefer a reliable server update followed by local state synchronization.
Optimistic UI is allowed if rollback is handled correctly.

------------------------------------------------------------------------

# 5. Comments

Logged-in users can comment on posts.

Each comment should store: - user ID - username - comment text -
createdAt

Recommended structure:

``` js
comments: [
  {
    userId: ObjectId,
    username: String,
    text: String,
    createdAt: Date
  }
]
```

Show: - comment count on post - comments in a modal, drawer, expandable
section, or dedicated panel

After commenting: - immediately update the comment count - immediately
show the new comment

------------------------------------------------------------------------

# UI REQUIREMENTS

The visual target is the supplied TaskPlanet Social screenshots.

## Overall Theme

Use: - deep navy / near-black background - slightly lighter navy cards -
electric blue primary accent - white/off-white primary text - muted gray
secondary text - subtle borders - restrained shadows/glows - gold/yellow
only for small highlights where appropriate

Do not make the application visually identical to TaskPlanet. VibePost
needs its own branding.

------------------------------------------------------------------------

## Desktop Layout

Use a centered responsive content area.

Suggested structure:

``` text
┌─────────────────────────────────────────────┐
│ VibePost                         Avatar      │
│ Share. Connect. Engage.                    │
├─────────────────────────────────────────────┤
│ Search users, posts...                      │
├─────────────────────────────────────────────┤
│ Create Post                                 │
│ What's on your mind?                        │
│                                             │
│ [image] [emoji]              [Post]         │
├─────────────────────────────────────────────┤
│ All Posts | For You | Most Liked | Comments │
├─────────────────────────────────────────────┤
│ Post Card                                   │
│                                             │
│ Post Card                                   │
│                                             │
│ Post Card                                   │
└─────────────────────────────────────────────┘
```

Desktop can use a two-column layout if it improves the design, but the
primary feed must remain visually dominant.

------------------------------------------------------------------------

## Mobile Layout

Mobile is extremely important because the reference application is
mobile-first.

Recommended:

``` text
┌───────────────────────┐
│ VibePost        Avatar │
│                       │
│ Search...             │
│                       │
│ Create Post           │
│ What's on your mind?  │
│                       │
│ All Posts →           │
│                       │
│ ┌───────────────────┐ │
│ │ Post              │ │
│ │                   │ │
│ │ Image             │ │
│ │                   │ │
│ │ ♡ 12  💬 4        │ │
│ └───────────────────┘ │
│                       │
│ Home  Feed  Profile   │
└───────────────────────┘
```

Use responsive breakpoints rather than maintaining separate mobile and
desktop applications.

------------------------------------------------------------------------

# Component Expectations

Create reusable components such as:

``` text
App
├── Navbar
├── SearchBar
├── CreatePost
├── FeedFilters
├── Feed
│   └── PostCard
│       ├── PostHeader
│       ├── PostContent
│       ├── PostImage
│       └── PostActions
├── CommentModal
├── Login
├── Signup
├── ProtectedRoute
└── Profile/Menu
```

Keep components focused. Do not put the entire application inside one
React component.

------------------------------------------------------------------------

# Backend API

Recommended endpoints:

## Auth

``` text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

## Posts

``` text
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
DELETE /api/posts/:id
```

## Likes

``` text
POST /api/posts/:id/like
```

The endpoint should toggle like/unlike.

## Comments

``` text
GET  /api/posts/:id/comments
POST /api/posts/:id/comments
```

If comments are embedded in posts, `GET /api/posts/:id` can also return
them.

------------------------------------------------------------------------

# Feed Pagination

Pagination is recommended because it is explicitly mentioned as a bonus.

Use:

``` text
GET /api/posts?page=1&limit=10&sort=latest
```

Supported sort values:

``` text
latest
liked
commented
```

Response should contain:

``` json
{
  "posts": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalPosts": 50,
    "hasNextPage": true
  }
}
```

Use MongoDB `skip/limit` or cursor pagination. For this assignment,
clean `page/limit` pagination is acceptable.

------------------------------------------------------------------------

# Search

Search can support: - username - post text

Example:

``` text
GET /api/posts?search=hello
```

Debounce the frontend search input.

------------------------------------------------------------------------

# Security

Implement basic production-safe practices:

-   hash passwords
-   JWT authentication
-   never expose password hashes
-   validate request bodies
-   sanitize/validate image inputs
-   enforce authorization on protected operations
-   do not trust user IDs sent from the frontend
-   use environment variables
-   configure CORS correctly
-   never commit `.env`
-   add `.env.example`

Never log: - passwords - JWT secrets - MongoDB credentials - Cloudinary
secrets

------------------------------------------------------------------------

# Error Handling

Backend should return consistent errors:

``` json
{
  "success": false,
  "message": "Post text or image is required"
}
```

Frontend should show user-friendly messages.

Handle: - invalid login - duplicate email - duplicate username - empty
post - oversized image - failed upload - unauthorized action -
deleted/nonexistent post - server/network failure

------------------------------------------------------------------------

# Environment Variables

Backend:

``` text
PORT=
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Frontend:

``` text
VITE_API_URL=
```

Never hardcode secrets.

------------------------------------------------------------------------

# Development Principles

1.  Build the minimum required functionality first.
2.  Keep the architecture simple.
3.  Do not add unnecessary features.
4.  Prioritize a polished UI over feature bloat.
5.  Keep frontend and backend separate.
6.  Keep API responses predictable.
7.  Use reusable React components.
8.  Use meaningful names.
9.  Add comments only where they improve understanding.
10. Keep commits small and meaningful.
11. Test every feature locally before deployment.
12. Verify the deployed frontend against the deployed backend.

------------------------------------------------------------------------

# Definition of Done

The project is complete only when:

-   [ ] Signup works
-   [ ] Login works
-   [ ] JWT authentication works
-   [ ] User data is stored in MongoDB
-   [ ] Text-only post works
-   [ ] Image-only post works
-   [ ] Text + image post works
-   [ ] Empty post is rejected
-   [ ] Public feed works
-   [ ] Pagination works
-   [ ] Like works
-   [ ] Unlike works
-   [ ] Duplicate likes are prevented
-   [ ] Comment works
-   [ ] Comment count updates immediately
-   [ ] Like count updates immediately
-   [ ] Usernames of likers are stored
-   [ ] Usernames of commenters are stored
-   [ ] Exactly two MongoDB collections are used
-   [ ] Responsive UI works
-   [ ] No TailwindCSS is used
-   [ ] Frontend deployed
-   [ ] Backend deployed
-   [ ] MongoDB Atlas connected
-   [ ] Environment variables configured
-   [ ] GitHub repository is public
-   [ ] README explains setup and deployment
-   [ ] Submission form is completed before the deadline

Build VibePost as a polished internship submission, not merely a demo.
