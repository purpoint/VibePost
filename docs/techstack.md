# VibePost --- Technology Stack

## 1. Stack Overview

VibePost uses a traditional MERN-style architecture with React on the
frontend and Node/Express/MongoDB on the backend.

``` text
Frontend
React + Vite
    │
    │ REST API
    ▼
Backend
Node.js + Express
    │
    │ Mongoose
    ▼
Database
MongoDB Atlas

Images
Cloudinary

Frontend Hosting
Vercel / Netlify

Backend Hosting
Render
```

------------------------------------------------------------------------

# 2. Frontend

## React.js

React is responsible for:

-   rendering the UI
-   component reuse
-   feed state
-   form state
-   authentication state
-   interaction updates
-   responsive application interface

Use functional components and hooks.

Avoid unnecessary class components.

------------------------------------------------------------------------

## Vite

Use Vite to create the React project.

Benefits:

-   fast development server
-   simple configuration
-   fast production builds
-   easy deployment to Vercel/Netlify

------------------------------------------------------------------------

## React Router

Use React Router for:

``` text
/
 /login
 /signup
 /feed
```

Potential protected routes:

``` text
/feed
```

Redirect unauthenticated users to `/login` when necessary.

------------------------------------------------------------------------

## Axios

Use Axios for backend communication.

Centralize API configuration:

``` text
src/services/api.js
```

The API base URL should come from:

``` text
VITE_API_URL
```

Never hardcode the production API URL throughout components.

------------------------------------------------------------------------

## React Context

Use React Context for authentication.

Example:

``` text
AuthContext
├── user
├── token
├── isAuthenticated
├── login()
├── signup()
└── logout()
```

Do not introduce Redux for this application unless the state genuinely
becomes complex.

------------------------------------------------------------------------

# 3. Styling

## Primary Choice: Basic CSS / CSS Modules

The assignment explicitly allows basic CSS.

Use:

``` text
CSS
CSS Modules
CSS variables
```

This gives complete control over the dark VibePost visual system.

### Important

**Do NOT use TailwindCSS.**

Do not install it and do not add Tailwind configuration.

------------------------------------------------------------------------

## Icon Library

A lightweight icon library such as Lucide React is recommended.

Useful icons:

``` text
Search
Image
Smile
Heart
MessageCircle
Send
MoreHorizontal
User
LogOut
X
ChevronLeft
ChevronRight
```

Use icons consistently.

------------------------------------------------------------------------

# 4. Backend

## Node.js

Node.js provides the server runtime.

Responsibilities:

-   API execution
-   authentication
-   request processing
-   database communication
-   image handling
-   error handling

------------------------------------------------------------------------

## Express.js

Express handles:

-   routing
-   middleware
-   controllers
-   authentication middleware
-   API responses
-   error handling

Recommended structure:

``` text
routes
  ↓
middleware
  ↓
controllers
  ↓
services
  ↓
models
  ↓
MongoDB
```

For a small assignment, services can remain lightweight.

------------------------------------------------------------------------

# 5. MongoDB

MongoDB is the required database.

Use MongoDB Atlas for production.

The project must have exactly:

``` text
users
posts
```

Do not create:

``` text
likes
comments
followers
notifications
sessions
```

as separate MongoDB collections.

------------------------------------------------------------------------

# 6. Mongoose

Mongoose provides:

-   schemas
-   models
-   validation
-   database querying
-   indexes
-   middleware where useful

Models:

``` text
User
Post
```

------------------------------------------------------------------------

# 7. Authentication

## bcrypt/bcryptjs

Passwords must be hashed before storage.

Never store:

``` text
password: "mypassword123"
```

Store:

``` text
passwordHash: "<bcrypt hash>"
```

------------------------------------------------------------------------

## JWT

Use JSON Web Tokens for authentication.

Token payload should contain only necessary identity information, for
example:

``` json
{
  "userId": "..."
}
```

Do not put: - password - password hash - unnecessary sensitive data

inside the token.

------------------------------------------------------------------------

# 8. Image Storage

## Recommended: Cloudinary

Do not store uploaded image binaries directly inside MongoDB for this
assignment.

Store the externally hosted image URL in the post:

``` js
{
  imageUrl: "https://..."
}
```

Advantages:

-   MongoDB documents stay smaller
-   Render filesystem limitations are avoided
-   images persist after deployment restarts
-   easier CDN delivery

------------------------------------------------------------------------

# 9. API Architecture

Recommended REST API:

## Authentication

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

## Engagement

``` text
POST /api/posts/:id/like
GET  /api/posts/:id/comments
POST /api/posts/:id/comments
```

The like endpoint should toggle the current user's state.

------------------------------------------------------------------------

# 10. Validation

Validate both frontend and backend.

Frontend validation improves UX.

Backend validation provides actual security and correctness.

Validate:

### User

``` text
name
username
email
password
```

### Post

``` text
text OR image
```

### Comment

``` text
non-empty text
reasonable length
```

Never rely exclusively on frontend validation.

------------------------------------------------------------------------

# 11. Security Middleware

Recommended Express middleware:

``` text
cors
express.json
helmet
```

Also use:

-   JWT middleware
-   validation middleware
-   centralized error handler

Rate limiting can be added if time allows, but it is not necessary to
over-engineer the assignment.

------------------------------------------------------------------------

# 12. Environment Configuration

## Backend `.env`

``` text
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Frontend `.env`

``` text
VITE_API_URL=http://localhost:5000/api
```

Production frontend:

``` text
VITE_API_URL=https://your-render-backend.onrender.com/api
```

Never commit real `.env` files.

Commit only:

``` text
.env.example
```

------------------------------------------------------------------------

# 13. Development Dependencies

Possible backend packages:

``` text
express
mongoose
cors
dotenv
jsonwebtoken
bcryptjs
helmet
multer
cloudinary
```

Possible frontend packages:

``` text
react
react-dom
react-router-dom
axios
lucide-react
```

Only install packages that are actually used.

Avoid dependency bloat.

------------------------------------------------------------------------

# 14. Testing Tools

During development, use:

-   browser DevTools
-   Postman or Thunder Client
-   MongoDB Atlas UI
-   React DevTools
-   Lighthouse where useful

Test API endpoints independently before debugging the UI.

------------------------------------------------------------------------

# 15. Deployment

## Frontend

Recommended:

``` text
Vercel
```

Alternative:

``` text
Netlify
```

Build:

``` text
npm run build
```

------------------------------------------------------------------------

## Backend

Recommended:

``` text
Render
```

The backend must listen on the port supplied by the hosting environment:

``` js
const PORT = process.env.PORT || 5000;
```

------------------------------------------------------------------------

## Database

Use:

``` text
MongoDB Atlas
```

Configure:

-   database user
-   secure password
-   network access
-   connection string
-   production environment variable

------------------------------------------------------------------------

# 16. Why This Stack

This stack directly satisfies the assignment:

  Requirement        Choice
  ------------------ ---------------
  Frontend           React.js
  Backend            Node.js
  API                Express.js
  Database           MongoDB
  Database ODM       Mongoose
  Authentication     JWT
  Password hashing   bcryptjs
  Styling            Basic CSS
  Images             Cloudinary
  Frontend hosting   Vercel
  Backend hosting    Render
  Database hosting   MongoDB Atlas

------------------------------------------------------------------------

# 17. What NOT to Use

Do not use:

``` text
TailwindCSS
Firebase as the primary database
Supabase as the primary database
PostgreSQL
MySQL
Separate likes collection
Separate comments collection
Redux without a real need
Microservices
GraphQL
Over-engineered event systems
```

The goal is to satisfy the exact assignment cleanly.

------------------------------------------------------------------------

# 18. Engineering Principles

Use:

-   RESTful APIs
-   modular components
-   reusable functions
-   environment variables
-   proper validation
-   centralized errors
-   meaningful names
-   small commits
-   responsive CSS
-   accessible controls

Avoid:

-   giant React components
-   giant Express route files
-   duplicated API logic
-   hardcoded secrets
-   hardcoded production URLs
-   unnecessary abstractions
-   unnecessary libraries

------------------------------------------------------------------------

# 19. Final Stack Decision

The final VibePost stack should be:

``` text
┌──────────────────────────────────┐
│           VibePost UI             │
│       React + Vite + CSS          │
└────────────────┬─────────────────┘
                 │
                 │ Axios / REST
                 ▼
┌──────────────────────────────────┐
│       Node.js + Express           │
│   JWT + bcrypt + validation       │
└────────────────┬─────────────────┘
                 │
                 │ Mongoose
                 ▼
┌──────────────────────────────────┐
│          MongoDB Atlas            │
│       users + posts only          │
└──────────────────────────────────┘
                 │
                 ▼
            Cloudinary
          (post images)
```

This stack is simple enough to finish quickly, strong enough for an
internship evaluation, and directly aligned with the 3W assignment
requirements.
