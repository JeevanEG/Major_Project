# SkillForge AI — Frontend

A production-ready React dashboard for AI-powered learning roadmap generation.

## 📁 Project Structure

```
skillforge/
├── public/
│   └── index.html
├── src/
│   ├── App.js                    # Root router (landing vs dashboard)
│   ├── index.js
│   ├── context/
│   │   └── AppContext.js         # Global state (user, roadmap, navigation)
│   ├── utils/
│   │   └── claudeApi.js          # Claude API calls (roadmap gen, skill gap)
│   ├── components/
│   │   ├── AppLayout.js          # Sidebar + Navbar wrapper
│   │   ├── Sidebar.js            # Fixed left sidebar with nav
│   │   ├── Navbar.js             # Top bar with greeting + logout
│   │   ├── ProgressBar.js        # Reusable progress bar
│   │   ├── Badge.js              # Gap / status badges
│   │   ├── Tag.js                # Topic pill tags
│   │   ├── StarRating.js         # 1-5 star rating display
│   │   ├── CourseCard.js         # Course card with progress + CTA
│   │   ├── SkillRow.js           # Skill gap table row
│   │   └── TimelinePhase.js      # Roadmap timeline phase card
│   ├── pages/
│   │   ├── LandingPage.js        # Job role input + AI roadmap generation
│   │   ├── DashboardPage.js      # Stats overview + in-progress courses
│   │   ├── RoadmapPage.js        # Vertical timeline of all phases
│   │   ├── CoursesPage.js        # Course grid with tabs
│   │   ├── SkillGapPage.js       # Skill gap table + comparison bars
│   │   └── ProfilePage.js        # Edit profile + skills
│   └── styles/
│       ├── global.css            # CSS variables, resets, animations
│       ├── layout.css            # Sidebar, navbar, page layout
│       ├── components.css        # Shared component styles
│       ├── landing.css           # Landing page styles
│       └── pages.css             # Page-specific styles
└── package.json
```

## 🚀 Setup & Run

```bash
npm install
npm start
```

App opens at http://localhost:3000

## 🔑 API Key Configuration

The app calls Claude's API directly from the browser (for demo/dev purposes).  
For production, proxy the API through your backend to keep the key secure.

The API key is handled automatically when running inside Claude.ai artifacts.  
For standalone use, add your key to `src/utils/claudeApi.js`:

```js
headers: {
  'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
  ...
}
```

## 🎯 Features

- **Landing Page** — Enter job role or paste JD, pick experience level, add current skills
- **AI Roadmap Generation** — Claude generates a structured multi-phase learning roadmap
- **Dashboard** — Stats overview, in-progress courses, phase summary
- **My Roadmap** — Vertical timeline with phase cards, topics, status badges
- **Courses** — Filterable course grid with progress tracking
- **Skill Gap Analysis** — Star ratings, comparison bars, recommended courses
- **Profile** — Edit name, role, experience, skills

## 🎨 Design System

- **Primary**: `#6c63ff` (purple gradient)
- **Success**: `#10b981` (green)
- **Background**: `#f4f5fa`
- **Fonts**: Plus Jakarta Sans (display) + DM Sans (body)
- **Border radius**: 8–24px
- **No external UI libraries** — pure React + CSS
