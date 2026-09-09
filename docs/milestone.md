# VibePost --- Development Milestones

## Development Strategy

Build VibePost in small, verifiable milestones.

Every milestone should result in a working state.

**Important Git rule:** Make at least **2--3 meaningful commits per
milestone**. Do not make one giant commit containing the entire
milestone.

Recommended commit format:

``` text
feat: add authentication API
feat: build login and signup screens
fix: handle invalid login errors
```

------------------------------------------------------------------------

# Milestone 0 --- Project Planning & Repository Setup

## Goal

Create the repository and establish the frontend/backend foundation.

### Tasks

-   Create GitHub repository.
-   Create `frontend/`.
-   Create `backend/`.
-   Initialize React/Vite.
-   Initialize Node/Express.
-   Add `.gitignore`.
-   Add `.env.example` files.
-   Add basic README.
-   Install initial dependencies.
-   Create initial folder structure.

### Expected Structure

``` text
vibepost/
├── frontend/
├── backend/
├── docs/
├── README.md
└── .gitignore
```

### Verification

Both applications should start locally.

Frontend:

``` text
http://localhost:5173
```

Backend:

``` text
http://localhost:5000
```

### Suggested Commits

``` text
chore: initialize VibePost repository
chore: setup React frontend with Vite
chore: setup Express backend structure
```

------------------------------------------------------------------------

# Milestone 1 --- Database & Authentication Backend

## Goal

Build signup/login and connect MongoDB Atlas.

### Tasks

-   Create MongoDB Atlas database.
-   Create User model.
-   Add unique email.
-   Add unique username.
-   Add password hashing.
-   Create signup controller.
-   Create login controller.
-   Create JWT utility.
-   Create authentication middleware.
-   Add `/api/auth/me`.
-   Add validation.
-   Add centralized error handling.

### API

``` text
POST /api/auth/signup
POST /api/auth/login
GET /api/auth/me
```

### Verification

Test with Postman/Thunder Client:

-   signup user
-   duplicate email rejected
-   duplicate username rejected
-   login valid credentials
-   login invalid credentials rejected
-   protected endpoint rejects missing token
-   protected endpoint accepts valid token

### Suggested Commits

``` text
feat: connect backend to MongoDB Atlas
feat: implement user signup and password hashing
feat: implement JWT login and authentication middleware
```

------------------------------------------------------------------------

# Milestone 2 --- Authentication Frontend

## Goal

Connect the React application to authentication APIs.

### Tasks

-   Build Login page.
-   Build Signup page.
-   Build form validation.
-   Build AuthContext.
-   Configure Axios.
-   Attach JWT to protected requests.
-   Add protected route.
-   Add logout.
-   Persist authentication safely enough for the assignment.
-   Show useful validation errors.

### Pages

``` text
/login
/signup
/feed
```

### Verification

Complete:

``` text
Signup
  ↓
Login
  ↓
Feed
  ↓
Logout
  ↓
Login again
```

### Suggested Commits

``` text
feat: build signup and login screens
feat: add authentication context and protected routes
fix: handle authentication and form errors
```

------------------------------------------------------------------------

# Milestone 3 --- Post Backend

## Goal

Implement the core post API.

### Tasks

-   Create Post model.
-   Store author information.
-   Store text.
-   Store image URL.
-   Store embedded likes.
-   Store embedded comments.
-   Reject empty posts.
-   Add create post endpoint.
-   Add feed endpoint.
-   Add single post endpoint.
-   Add delete authorization.
-   Add pagination.
-   Add sorting.

### API

``` text
POST /api/posts
GET /api/posts
GET /api/posts/:id
DELETE /api/posts/:id
```

### Feed query

``` text
?page=1
&limit=10
&sort=latest
&search=hello
```

### Verification

Use API testing tools before building the UI.

### Suggested Commits

``` text
feat: add post schema with embedded likes and comments
feat: implement post creation and feed APIs
feat: add pagination sorting and post search
```

------------------------------------------------------------------------

# Milestone 4 --- Image Upload

## Goal

Allow image-only and image + text posts.

### Tasks

-   Configure Cloudinary or selected image host.
-   Add image upload middleware if necessary.
-   Validate file type.
-   Validate file size.
-   Upload image.
-   Store returned URL in post.
-   Handle upload failures.

### Verification

Test:

``` text
text only        ✓
image only       ✓
text + image     ✓
empty post       ✗
invalid image    ✗
```

### Suggested Commits

``` text
feat: configure image storage
feat: add image upload to post creation
fix: validate image type and upload errors
```

------------------------------------------------------------------------

# Milestone 5 --- Feed UI

## Goal

Build the main VibePost interface inspired by TaskPlanet Social.

### Tasks

-   Build Navbar/header.
-   Build search bar.
-   Build CreatePost card.
-   Build FeedFilters.
-   Build PostCard.
-   Build PostHeader.
-   Build PostContent.
-   Build PostActions.
-   Add loading skeleton/spinner.
-   Add empty-feed state.
-   Add error state.

### UI Requirements

Use:

-   dark navy background
-   blue accent
-   rounded cards
-   subtle borders
-   clean typography
-   responsive layout
-   compact action buttons

### Verification

Logged-in user can:

-   see feed
-   create text post
-   create image post
-   create text + image post
-   see post immediately

### Suggested Commits

``` text
feat: build VibePost feed layout
feat: add create post composer
feat: build responsive post cards and feed states
```

------------------------------------------------------------------------

# Milestone 6 --- Likes & Comments

## Goal

Complete social interactions.

### Tasks

-   Implement like/unlike endpoint.
-   Prevent duplicate likes.
-   Display like count.
-   Display liked state.
-   Build comment modal/drawer.
-   Add comment endpoint.
-   Display comments.
-   Display comment count.
-   Store usernames.
-   Update UI immediately.

### Verification

User A:

``` text
likes post → count increases
unlikes post → count decreases
comments → comment appears
```

User B:

``` text
sees updated counts
```

### Suggested Commits

``` text
feat: implement like and unlike interactions
feat: add comments API and comment UI
fix: synchronize engagement counts after actions
```

------------------------------------------------------------------------

# Milestone 7 --- Search, Sorting & Pagination UI

## Goal

Implement the bonus-quality feed controls.

### Tasks

-   All Posts
-   For You
-   Most Liked
-   Most Commented
-   Search
-   Pagination or Load More
-   Debounced search

### Suggested behavior

``` text
All Posts       → latest
For You         → simple personalized ordering if implemented
Most Liked      → likes descending
Most Commented  → comments descending
```

Do not invent a complicated recommendation algorithm. For this
assignment, `For You` can remain a lightweight client-side/user-aware
filter or be labeled clearly if it is not implemented.

### Suggested Commits

``` text
feat: add feed sorting filters
feat: implement paginated loading
feat: add debounced post search
```

------------------------------------------------------------------------

# Milestone 8 --- UI Polish & Responsive Design

## Goal

Make the project look like a serious internship submission.

### Tasks

-   Tune typography.
-   Improve spacing.
-   Add hover/focus states.
-   Improve mobile layout.
-   Improve image rendering.
-   Add transitions.
-   Improve buttons.
-   Improve empty/loading/error states.
-   Ensure keyboard accessibility.
-   Test multiple viewport widths.

### Visual checklist

``` text
Mobile      ✓
Tablet      ✓
Desktop     ✓
Dark theme  ✓
Readable    ✓
Responsive  ✓
```

### Suggested Commits

``` text
style: refine VibePost visual system
style: improve responsive mobile layout
fix: resolve accessibility and interaction states
```

------------------------------------------------------------------------

# Milestone 9 --- Testing & Security Review

## Goal

Verify end-to-end behavior.

### Authentication tests

-   signup
-   duplicate signup
-   login
-   wrong password
-   logout
-   expired/invalid token

### Post tests

-   text post
-   image post
-   text + image
-   empty post
-   pagination
-   search
-   sorting
-   unauthorized deletion

### Engagement tests

-   like
-   unlike
-   duplicate like
-   comment
-   empty comment
-   multiple comments

### Security

-   no secrets committed
-   passwords hashed
-   JWT secret protected
-   CORS configured
-   validation enabled
-   authorization checked

### Suggested Commits

``` text
test: verify authentication and post flows
test: verify likes comments and pagination
security: harden validation and production configuration
```

------------------------------------------------------------------------

# Milestone 10 --- Deployment

## Goal

Deploy the complete application.

### MongoDB Atlas

-   create production database
-   create database user
-   configure network access
-   verify connection

### Render

-   deploy backend
-   configure environment variables
-   configure start command
-   test API

### Vercel

-   deploy frontend
-   configure `VITE_API_URL`
-   verify API communication

### Verify

``` text
Vercel
   ↓
Render
   ↓
MongoDB Atlas
   +
Cloudinary
```

### Suggested Commits

``` text
chore: prepare production configuration
chore: add deployment documentation
fix: resolve production API and CORS configuration
```

------------------------------------------------------------------------

# Milestone 11 --- Final Submission

## Goal

Prepare the internship submission.

### Checklist

-   [ ] Public GitHub repository
-   [ ] Separate frontend/backend folders
-   [ ] Working deployed frontend
-   [ ] Working deployed backend
-   [ ] MongoDB Atlas working
-   [ ] Images working in production
-   [ ] README complete
-   [ ] Screenshots added
-   [ ] Tech stack documented
-   [ ] No secrets in repository
-   [ ] No TailwindCSS
-   [ ] Exactly two MongoDB collections
-   [ ] Assignment requirements checked
-   [ ] Google Form submitted

------------------------------------------------------------------------

# Recommended Order Under Time Pressure

If time is limited, prioritize:

``` text
1. Project setup
2. MongoDB
3. Signup/login
4. Create post
5. Feed
6. Likes
7. Comments
8. Image upload
9. Responsive UI polish
10. Deployment
11. README + submission
```

Do not spend hours implementing optional features before the required
features are stable.

------------------------------------------------------------------------

# Final Quality Gate

Before submission, perform the complete flow using a fresh account:

``` text
Open deployed app
      ↓
Create account
      ↓
Login
      ↓
Create text post
      ↓
Create image post
      ↓
Like another post
      ↓
Comment on another post
      ↓
Refresh
      ↓
Verify everything persists
      ↓
Logout
      ↓
Verify protected actions require login
```

Only submit after this flow works on the deployed application.
