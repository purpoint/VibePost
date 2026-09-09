# VibePost --- UI/UX Design Specification

## 1. Design Direction

VibePost should be visually inspired by the supplied TaskPlanet Social
screenshots.

The goal is:

> **TaskPlanet-inspired visual language + VibePost's own branding +
> simpler assignment-focused functionality.**

Do not copy TaskPlanet branding, logos, wallet/points systems,
leaderboard functionality, promotion systems, or other unrelated
features.

The UI should look like a real social application rather than a basic
internship CRUD page.

------------------------------------------------------------------------

# 2. Brand

## Name

**VibePost**

## Tagline

**Share. Connect. Engage.**

## Brand personality

-   modern
-   social
-   energetic
-   clean
-   slightly futuristic
-   approachable

------------------------------------------------------------------------

# 3. Color System

Use a dark-first visual system.

Suggested CSS variables:

``` css
:root {
  --background: #070d1a;
  --surface: #0d1424;
  --surface-raised: #121a2c;
  --border: #202b42;

  --primary: #1683ff;
  --primary-soft: rgba(22, 131, 255, 0.14);

  --text-primary: #f5f7fb;
  --text-secondary: #a5adbd;
  --text-muted: #6f788b;

  --success: #39d98a;
  --danger: #ff5b67;
  --highlight: #f4c84e;
}
```

These are starting values. Tune them visually during implementation.

Do not use excessive gradients.

------------------------------------------------------------------------

# 4. Typography

Use a clean sans-serif font.

Preferred:

``` text
Inter
system-ui
-apple-system
BlinkMacSystemFont
Segoe UI
sans-serif
```

Hierarchy:

``` text
VibePost heading      28–36px
Section heading       20–24px
Post username         15–17px
Body text             15–17px
Metadata              12–14px
Button text           14–16px
```

Body text should remain highly readable.

------------------------------------------------------------------------

# 5. Header

The reference screenshots have a strong top header.

VibePost should adapt that into:

``` text
┌────────────────────────────────────┐
│ VibePost                     ◯     │
│ Share. Connect. Engage.            │
└────────────────────────────────────┘
```

Desktop can place the tagline inline or below the title.

Mobile:

``` text
VibePost                         ◯
Share. Connect. Engage.
```

Possible controls: - theme toggle - profile/avatar menu - logout

Do not reproduce TaskPlanet's points/wallet UI.

------------------------------------------------------------------------

# 6. Search Bar

Inspired by the reference screenshot.

Design:

``` text
┌─────────────────────────────────────────┐
│ 🔍  Search users, posts...              │
└─────────────────────────────────────────┘
```

Characteristics:

-   rounded corners
-   dark surface
-   subtle border
-   blue focus border
-   search icon
-   comfortable height
-   full width on mobile

Focus state should clearly communicate interaction.

------------------------------------------------------------------------

# 7. Create Post Card

This is one of the most important UI sections.

Design:

``` text
┌─────────────────────────────────────────────┐
│ Create Post                                 │
│                                             │
│ What's on your mind?                        │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│  🖼   😊                         [ Post ]    │
└─────────────────────────────────────────────┘
```

Requirements:

-   large writing area
-   image attachment button
-   optional emoji button
-   selected-image preview
-   remove-image action
-   Post button
-   disabled state while submitting
-   loading state

Do not make the composer unnecessarily complicated.

------------------------------------------------------------------------

# 8. Feed Filters

Use horizontal pill/chip buttons.

Example:

``` text
[ All Posts ] [ For You ] [ Most Liked ] [ Most Commented ]
```

Active:

-   blue outline
-   subtle blue glow/background

Inactive:

-   dark surface
-   muted text
-   subtle border

On mobile, allow horizontal scrolling rather than wrapping into a large
multi-row block.

------------------------------------------------------------------------

# 9. Post Card

Post cards should be the visual centerpiece.

Suggested structure:

``` text
┌─────────────────────────────────────────────┐
│ ◯  Manan Patel                 Follow   ⋯   │
│    @manan · 5 min ago                       │
│                                             │
│ Building something cool today 🚀            │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │              POST IMAGE                 │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│    ♡ 24              💬 8                    │
└─────────────────────────────────────────────┘
```

Use rounded cards.

Recommended:

``` text
border-radius: 18px;
```

Do not overuse shadows.

------------------------------------------------------------------------

# 10. Post Header

Include:

-   avatar
-   name
-   username
-   relative time
-   optional Follow button
-   menu button

Example:

``` text
[avatar]  Manan Patel                    Follow ⋯
          @manan · 5 minutes ago
```

Avatar should be circular.

Fallback avatar should be generated using initials if no image exists.

------------------------------------------------------------------------

# 11. Post Content

Text should:

-   wrap naturally
-   preserve readable line height
-   not overflow
-   support long content

Recommended:

``` css
line-height: 1.55;
```

Long posts can be collapsed with a "Read more" interaction if necessary,
but this is optional.

------------------------------------------------------------------------

# 12. Images

Images should:

-   maintain aspect ratio
-   have rounded corners
-   never overflow the card
-   use `object-fit: cover` where appropriate
-   show a loading state if needed

For large images, use:

``` text
max-width: 100%;
```

On mobile, images should use the full available card width.

------------------------------------------------------------------------

# 13. Engagement Footer

Inspired directly by the reference screenshot's footer.

Example:

``` text
────────────────────────────────────────────

      ♡ 24              💬 8
```

Buttons should be easy to tap.

Like state:

``` text
unliked → muted icon
liked   → primary/highlighted icon
```

Counts should update immediately.

------------------------------------------------------------------------

# 14. Comment UI

Recommended approach:

### Desktop

Use a modal or right-side panel.

### Mobile

Use a bottom-sheet-style modal or full-width modal.

Example:

``` text
┌─────────────────────────────┐
│ Comments                 ✕  │
├─────────────────────────────┤
│ ◯ Rahul                     │
│   Nice post!                │
│                             │
│ ◯ Priya                     │
│   Looks great 🔥            │
│                             │
├─────────────────────────────┤
│ Write a comment...    Send  │
└─────────────────────────────┘
```

The newest comment should appear immediately after submission.

------------------------------------------------------------------------

# 15. Authentication Screens

Login:

``` text
┌──────────────────────────────┐
│          VibePost             │
│   Share. Connect. Engage.     │
│                              │
│ Email                        │
│ [________________________]   │
│                              │
│ Password                     │
│ [________________________]   │
│                              │
│ [        Login        ]      │
│                              │
│ Don't have an account?       │
│ Sign up                      │
└──────────────────────────────┘
```

Signup:

``` text
Name
Username
Email
Password

[ Create Account ]

Already have an account?
Login
```

Keep authentication screens minimal.

------------------------------------------------------------------------

# 16. Responsive Design

## Mobile: \< 768px

-   one-column feed
-   full-width cards
-   horizontal filter scrolling
-   compact header
-   bottom navigation is optional
-   composer stacks naturally
-   comments use bottom sheet/modal
-   buttons remain touch-friendly

## Tablet: 768--1024px

-   centered feed
-   moderate card width
-   larger horizontal spacing

## Desktop: \> 1024px

-   centered feed with max width
-   optional sidebar only if it adds value
-   generous whitespace
-   hover interactions

Recommended feed max width:

``` text
680–760px
```

Do not make posts excessively wide.

------------------------------------------------------------------------

# 17. Responsive Spacing

Use a consistent spacing scale:

``` text
4px
8px
12px
16px
20px
24px
32px
40px
```

Typical:

``` text
Page padding: 16–24px
Card padding: 18–22px
Card gap: 16px
Section gap: 20–28px
```

------------------------------------------------------------------------

# 18. Interaction Design

All important actions should have visible feedback.

### Like

``` text
click
→ icon changes
→ count changes
```

### Comment

``` text
click
→ comments open
→ submit
→ comment appears
→ count changes
```

### Post

``` text
submit
→ button loading
→ post appears at top
→ composer resets
```

### Image

``` text
select
→ preview
→ remove option
```

------------------------------------------------------------------------

# 19. Loading States

Never leave large areas blank during API requests.

Use:

-   skeleton cards
-   spinner
-   button loading indicator

Example skeleton:

``` text
◯  ███████████
   ███████

████████████████████
████████████████
```

------------------------------------------------------------------------

# 20. Empty States

No posts:

``` text
No posts yet

Be the first person to share something on VibePost.
```

No search results:

``` text
No posts found

Try another search term.
```

------------------------------------------------------------------------

# 21. Error States

Use compact inline messages or toast notifications.

Examples:

``` text
Unable to create post.
Please try again.
```

``` text
Your session has expired.
Please log in again.
```

Avoid browser `alert()` for normal UI errors.

------------------------------------------------------------------------

# 22. Accessibility

Must include:

-   semantic buttons
-   accessible labels
-   keyboard navigation
-   visible focus states
-   sufficient text contrast
-   alt text for uploaded images
-   `aria-label` for icon-only buttons

Do not make icons the only indication of an action where the meaning is
ambiguous.

------------------------------------------------------------------------

# 23. Animation

Use subtle animations only.

Good:

``` text
150–250ms
```

Examples:

-   button hover
-   card hover
-   like transition
-   modal entrance
-   image preview

Avoid: - excessive bouncing - distracting page animations - slow
transitions

------------------------------------------------------------------------

# 24. Visual Inspiration Mapping

TaskPlanet reference → VibePost adaptation:

``` text
TaskPlanet dark background
        ↓
VibePost dark navy background

TaskPlanet blue active controls
        ↓
VibePost blue primary accent

TaskPlanet rounded feed cards
        ↓
VibePost rounded post cards

TaskPlanet create-post composer
        ↓
VibePost simplified composer

TaskPlanet engagement footer
        ↓
VibePost like/comment footer

TaskPlanet mobile-first feed
        ↓
VibePost responsive mobile-first feed
```

Do NOT copy:

``` text
TaskPlanet logo
TaskPlanet name
points
wallet
leaderboard
promotions
CPA Lead
rank badges
TaskPlanet-specific navigation
```

------------------------------------------------------------------------

# 25. Final UI Quality Standard

When opening VibePost, the first impression should be:

> "This looks like a real social product."

Not:

> "This looks like a college CRUD assignment."

Prioritize: 1. spacing 2. typography 3. post card quality 4. responsive
behavior 5. interaction feedback 6. consistent colors 7. clean
empty/loading/error states
