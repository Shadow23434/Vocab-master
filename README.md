# VocabMaster

🚀 _A React + TypeScript vocabulary learning application with flashcards, quizzes, CSV import, progress tracking, and built-in TOEIC vocabulary collections._

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)

## Table of Contents

- [The Goals of This Project](#the-goals-of-this-project)
- [Plan](#plan)
- [Technologies - Libraries](#technologies---libraries)
- [Core Features](#core-features)
- [Structure of Project](#structure-of-project)
- [Data Source System](#data-source-system)
- [How to Run](#how-to-run)
- [CSV Import Format](#csv-import-format)
- [Deployment](#deployment)
- [Support](#support)
- [Contribution](#contribution)
- [License](#license)

### The Goals of This Project
[](#the-goals-of-this-project)

❇️ **Vocabulary Learning:** Provide an easy-to-use web app for learning vocabulary through flashcards and quizzes.

❇️ **Multiple Data Sources:** Support built-in vocabulary, TOEIC topic collections, and user-imported CSV datasets.

❇️ **Progress Tracking:** Store quiz scores and flashcard completion progress locally in the browser.

❇️ **Simple Data Management:** Let users import, rename, clear, and manage vocabulary collections without a backend.

❇️ **Modern Frontend Stack:** Build a fast single-page application using React, TypeScript, Vite, and Tailwind CSS.

❇️ **Deployable SPA:** Configure the app for Vercel deployment with client-side routing support.

### Plan
[](#plan)

| Feature | Status |
| --- | --- |
| React + TypeScript frontend | Completed ✔️ |
| Flashcard learning mode | Completed ✔️ |
| Quiz learning mode | Completed ✔️ |
| Built-in vocabulary collection | Completed ✔️ |
| TOEIC topic-based collection | Completed ✔️ |
| CSV vocabulary import | Completed ✔️ |
| Multiple vocabulary data sources | Completed ✔️ |
| localStorage persistence | Completed ✔️ |
| Progress import/export | Completed ✔️ |
| Dark mode | Completed ✔️ |
| SPA routing on Vercel | Completed ✔️ |

### Technologies - Libraries
[](#technologies---libraries)

✔️ **React 19** - UI library for building component-based interfaces.

✔️ **TypeScript** - Adds static typing for safer and more maintainable code.

✔️ **Vite 6** - Fast frontend build tool and development server.

✔️ **React Router DOM 7** - Handles client-side routing between dashboard, setup, quiz, and flashcard pages.

✔️ **Tailwind CSS 4** - Utility-first CSS framework used for styling and responsive UI.

✔️ **Lucide React** - Icon library used across the interface.

✔️ **Sonner** - Toast notification library for user feedback.

✔️ **Canvas Confetti** - Adds celebration effects for completed learning flows.

✔️ **Vercel Analytics** - Provides analytics integration for the deployed application.

✔️ **localStorage** - Persists vocabulary sources, progress, and UI preferences in the browser.

### Core Features
[](#core-features)

- **Dashboard:** Central hub for selecting learning mode, browsing vocabulary, and managing data.
- **Flashcard Mode:** Learn words through card-based practice and track completion percentage.
- **Quiz Mode:** Test vocabulary knowledge with multiple-choice questions and score tracking.
- **Setup Flow:** Choose vocabulary sets, chunk sizes, and shuffle options before starting a session.
- **Session Guard:** Validates quiz and flashcard routes to prevent invalid or stale sessions.
- **Library Mode:** Browse available vocabulary items and collections.
- **Data Mode:** Import CSV vocabulary, manage data sources, and clear custom data.
- **Dark Mode:** Toggle light/dark theme with preference persisted in localStorage.
- **Progress Persistence:** Save quiz and flashcard progress automatically in the browser.
- **Progress Import/Export:** Export and restore learning progress between sessions or devices.

### Structure of Project
[](#structure-of-project)

```text
src/
├── App.tsx                         # Root component, app state, routing, persistence
├── main.tsx                        # React entry point
├── components/
│   └── SessionGuard.tsx            # Validates and resolves learning session routes
├── data/
│   ├── normalize.json              # Default vocabulary data
│   ├── topics-local.json           # Built-in TOEIC topic vocabulary data
│   └── metadata.json               # Vocabulary metadata
├── hooks/
│   └── useDarkMode.ts              # Dark mode preference hook
├── pages/
│   ├── Dashboard/                  # Main dashboard and tab components
│   ├── FlashcardMode/              # Flashcard learning page
│   ├── QuizMode/                   # Quiz learning page
│   ├── Setup/                      # Session setup page
│   └── NotFound.tsx                # Fallback route
├── types/
│   └── index.ts                    # Shared TypeScript interfaces
└── utils/
    ├── csvParser.ts                # CSV vocabulary parser
    ├── dataLoader.ts               # Topic data transformer
    ├── exportUtils.ts              # Progress export/import helpers
    └── styleUtils.ts               # Styling utilities
```

The application keeps the main state in `App.tsx`, including vocabulary data sources, active learning sessions, dark mode state, and progress data. Data is persisted in `localStorage`, so the app can work as a frontend-only SPA without a backend service.

### Data Source System
[](#data-source-system)

VocabMaster supports three main data source types:

- **Default Source:** The user's main vocabulary collection, initialized from `normalize.json`.
- **Topic Sources:** Built-in TOEIC vocabulary topics loaded from `topics-local.json`.
- **User-Created Sources:** Custom vocabulary collections created through CSV import.

Progress is stored separately for each learning set:

```ts
{
  quiz: { [setId: string]: number },
  flashcard: { [setId: string]: number }
}
```

### How to Run
[](#how-to-run)

```bash
> ### Install dependencies
npm install

> ### Start development server
npm run dev

> ### Build for production
npm run build

> ### Preview production build
npm run preview
```

The development server runs with Vite. By default, the project is configured to run locally on port `3000`.

### CSV Import Format
[](#csv-import-format)

The CSV import feature expects the following columns:

```csv
word,type,phonetic,meaning,example,exampleMeaning
```

Example:

```csv
abandon,verb,/əˈbændən/,từ bỏ,He abandoned the old plan.,Anh ấy đã từ bỏ kế hoạch cũ.
```

### Deployment
[](#deployment)

The project is configured for deployment as a single-page application on Vercel.

`vercel.json` rewrites all routes to `index.html`, allowing React Router routes such as `/setup/quiz`, `/quiz/:setId`, and `/flashcards/:setId` to work after refresh.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Support
[](#support)

⭐ If you find this project useful, consider giving it a star or using it as a reference for building frontend learning applications.

### Contribution
[](#contribution)

Contributions are welcome. You can improve the UI, add new learning modes, expand vocabulary datasets, or enhance import/export functionality.

### License
[](#license)

This project is available under the MIT License.
