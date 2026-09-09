# VibePost --- System Architecture

## 1. Architecture Goal

VibePost follows a simple three-tier architecture:

``` text
React Frontend
      │
      │ HTTPS / REST API
      ▼
Node.js + Express Backend
      │
      │ Mongoose
      ▼
MongoDB Atlas
```

Image files should be stored outside MongoDB using an image-storage
provider such as Cloudinary.

``` text
React
  │
  ├── API requests ───────────────► Express
  │                                  │
  │                                  ├── Auth
  │                                  ├── Post logic
  │                                  ├── Like logic
  │                                  └── Comment logic
  │                                         │
  │                                         ▼
  │                                    MongoDB Atlas
  │
  └── Image upload ───────────────► Cloudinary
```

------------------------------------------------------------------------

# 2. Repository Structure

The GitHub repository should contain separate frontend and backend
folders.

``` text
vibepost/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   ├── SearchBar/
│   │   │   ├── CreatePost/
│   │   │   ├── FeedFilters/
│   │   │   ├── PostCard/
│   │   │   ├── CommentModal/
│   │   │   └── Loader/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Feed.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles/
│   │       └── globals.css
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── cloudinary.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── postController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── uploadMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Post.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   └── postRoutes.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── postService.js
│   │   ├── utils/
│   │   │   └── generateToken.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── README.md
├── .gitignore
└── docs/
    ├── prompt.md
    ├── architecture.md
    ├── milestone.md
    ├── design.md
    └── techstack.md
```

Do not create unnecessary folders if a simpler structure is cleaner.

------------------------------------------------------------------------

# 3. MongoDB Architecture

The assignment explicitly allows only two collections.

## Collection 1: users

Example:

``` js
{
  _id: ObjectId,
  name: "Manan Patel",
  username: "manan",
  email: "manan@example.com",
  passwordHash: "...",
  avatarUrl: "...",
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

``` text
email: unique
username: unique
```

------------------------------------------------------------------------

# 4. Collection 2: posts

Example:

``` js
{
  _id: ObjectId,

  author: {
    userId: ObjectId,
    username: "manan",
    name: "Manan Patel",
    avatarUrl: "..."
  },

  text: "Hello VibePost!",

  imageUrl: "...",

  likes: [
    {
      userId: ObjectId,
      username: "rahul"
    }
  ],

  comments: [
    {
      userId: ObjectId,
      username: "rahul",
      text: "Nice post!",
      createdAt: Date
    }
  ],

  createdAt: Date,
  updatedAt: Date
}
```

Counts should preferably be calculated:

``` js
likes.length
comments.length
```

Avoid separate `likeCount` and `commentCount` unless there is a strong
performance reason.

------------------------------------------------------------------------

# 5. Why Likes and Comments Are Embedded

The assignment restricts the project to two MongoDB collections.

Therefore:

``` text
users
posts
```

is the complete application database.

Likes and comments are embedded in `posts`.

This satisfies:

-   exactly two collections
-   usernames stored
-   easy retrieval
-   simple architecture
-   no unnecessary joins

------------------------------------------------------------------------

# 6. Denormalization

The post should store the author's public identity:

``` js
author: {
  userId,
  username,
  name,
  avatarUrl
}
```

Likewise likes and comments store usernames.

This is intentional denormalization.

Reason:

A feed request can retrieve the post and all visible user information
without requiring a separate user lookup for every like/comment.

If a user changes their username later, existing posts can either
preserve the original displayed username or a controlled migration
strategy can be implemented. For this assignment, preserving the
username at creation/action time is acceptable.

------------------------------------------------------------------------

# 7. Authentication Flow

``` text
Signup
  │
  ▼
Validate input
  │
  ▼
Hash password
  │
  ▼
Create user in MongoDB
  │
  ▼
JWT
  │
  ▼
Frontend stores auth state
```

Login:

``` text
Email + Password
       │
       ▼
Find user
       │
       ▼
Compare bcrypt hash
       │
       ▼
Generate JWT
       │
       ▼
Return safe user + token
```

Protected request:

``` text
Frontend
   │
   │ Authorization: Bearer <token>
   ▼
authMiddleware
   │
   ▼
Verify JWT
   │
   ▼
req.user
   │
   ▼
Controller
```

Never trust a `userId` supplied by the browser when determining the
current authenticated user.

------------------------------------------------------------------------

# 8. Post Creation Flow

``` text
User writes text
       +
Selects image
       │
       ▼
Frontend validates
       │
       ▼
POST /api/posts
       │
       ▼
JWT middleware
       │
       ▼
Upload image if present
       │
       ▼
Create post document
       │
       ▼
Return created post
       │
       ▼
Insert at top of React feed
```

------------------------------------------------------------------------

# 9. Like Flow

``` text
Click Like
   │
   ▼
POST /api/posts/:id/like
   │
   ▼
Authenticate user
   │
   ▼
Find post
   │
   ▼
Check userId in likes
   │
   ├── absent → add like
   │
   └── present → remove like
   │
   ▼
Return updated post/like state
   │
   ▼
Update React state
```

Use an atomic or carefully guarded update to avoid duplicate likes under
concurrent requests.

------------------------------------------------------------------------

# 10. Comment Flow

``` text
Enter comment
     │
     ▼
POST /api/posts/:id/comments
     │
     ▼
Authenticate
     │
     ▼
Validate comment
     │
     ▼
Push comment into post.comments
     │
     ▼
Return created comment
     │
     ▼
Update comments in UI
```

------------------------------------------------------------------------

# 11. Feed Flow

``` text
GET /api/posts?page=1&limit=10&sort=latest
             │
             ▼
       Parse query params
             │
             ▼
         MongoDB query
             │
             ▼
      Sort + pagination
             │
             ▼
       JSON response
             │
             ▼
        React Feed
```

Sorting:

``` text
latest     → createdAt descending
liked      → likes.length descending
commented  → comments.length descending
```

For search:

``` text
search username OR post text
```

------------------------------------------------------------------------

# 12. Frontend State Architecture

Keep global state small.

Recommended:

``` text
AuthContext
   ├── user
   ├── token
   ├── login()
   ├── signup()
   └── logout()
```

Feed state can remain local to the Feed page:

``` text
posts
loading
error
page
hasNextPage
sort
search
```

PostCard should receive post data and callbacks rather than directly
owning application-wide state.

------------------------------------------------------------------------

# 13. API Response Standard

Successful response:

``` json
{
  "success": true,
  "data": {}
}
```

Error response:

``` json
{
  "success": false,
  "message": "Something went wrong"
}
```

Paginated response:

``` json
{
  "success": true,
  "data": {
    "posts": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 4,
      "totalPosts": 38,
      "hasNextPage": true
    }
  }
}
```

Consistency makes the frontend easier to maintain.

------------------------------------------------------------------------

# 14. Deployment Architecture

``` text
                Internet
                   │
          ┌────────┴────────┐
          ▼                 ▼
       Vercel             Render
      React App          Express API
                            │
                            ▼
                      MongoDB Atlas
                            │
                            │
                       Cloudinary
                     (post images)
```

Environment variables are configured independently on Vercel and Render.

------------------------------------------------------------------------

# 15. CORS

Production frontend URL must be allowed by the backend.

Example concept:

``` text
CLIENT_URL=https://vibepost.vercel.app
```

Backend should allow the configured origin rather than using
unrestricted production CORS.

------------------------------------------------------------------------

# 16. Architectural Principles

-   Keep backend controllers thin.
-   Put reusable business logic in services when useful.
-   Keep database schemas in models.
-   Keep routes focused.
-   Keep authentication in middleware.
-   Keep React components reusable.
-   Do not mix API calls throughout random UI components.
-   Keep secrets outside source code.
-   Avoid premature abstractions.
-   Do not add microservices.
-   Do not introduce Redux unless the application actually needs it.

The architecture should demonstrate good engineering judgment without
becoming unnecessarily complicated.
