# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VocabMaster is a vocabulary learning application built with React 19, TypeScript, and Vite. It provides flashcard and quiz modes for learning vocabulary, with support for multiple data sources including a built-in TOEIC 600 word collection and user-imported CSV data.

## Development Commands

```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### State Management & Data Flow

The app uses React state with localStorage persistence. All state is managed in `App.tsx`:

- **Data Sources**: Multiple vocabulary collections stored as `DataSource[]`. Each source has an ID, name, items array, and creation timestamp.
- **Progress Tracking**: Separate progress objects for quiz scores and flashcard completion percentages, keyed by set ID.
- **Session State**: When starting a quiz/flashcard session, the selected items and set ID are stored in App state, then passed via routing.

### Data Source System

Three types of data sources coexist:

1. **Default source** (`id: 'default'`): User's main collection, initialized from `normalize.json`
2. **Topic sources** (`id: 'topic-*'`): Pre-built collections loaded from `topics-local.json` via `dataLoader.ts`. These are refreshed on every app load to ensure thumbnails and new content are always current.
3. **User-created sources** (`id: 'source-{timestamp}'`): Created via CSV import

The `loadTopics()` function in `dataLoader.ts` transforms the raw topic JSON structure into the `DataSource` format, flattening all topic words into a single "600 Essential Words For TOEIC" collection.

### Routing & Session Management

The app uses React Router with a session guard pattern:

- **Dashboard** (`/`): Main hub with three tabs (Play, Library, Data)
- **Setup pages** (`/setup/:mode`): Set selection interface before starting a session
- **Session pages** (`/flashcards/:setId`, `/quiz/:setId`): Protected by `SessionGuard` component

`SessionGuard` validates the `setId` parameter and resolves it to actual vocabulary items:
- Full source IDs (e.g., `default`, `topic-toeic-600`)
- Topic-based sets (e.g., `topic-set-business`)
- Chunk-based sets (e.g., `set-{startId}-{size}`)

If the set is invalid, it redirects to home. This prevents broken sessions from direct URL access or stale links.

### Progress Persistence

Progress is stored in localStorage as `vocabMasterProgress`:

```typescript
{
  quiz: { [setId: string]: number },      // 0-100 score
  flashcard: { [setId: string]: number }  // 0-100 completion %
}
```

The app includes migration logic in `App.tsx` to convert old boolean flashcard progress to numeric percentages.

### Styling & Theming

- Uses Tailwind CSS 4 (configured via CDN in `index.html`)
- Custom color palette: `quizizz-purple`, `quizizz-red`, `quizizz-blue`, `quizizz-green`, `quizizz-yellow`
- Dark mode support via `useDarkMode` hook (stores preference in localStorage)
- Path alias `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)

## Key Files

- `src/App.tsx`: Root component, manages all state and data persistence
- `src/components/SessionGuard.tsx`: Validates and resolves set IDs for quiz/flashcard sessions
- `src/utils/dataLoader.ts`: Loads and transforms topic-based vocabulary collections
- `src/utils/csvParser.ts`: Parses CSV files for vocabulary import
- `src/types/index.ts`: TypeScript interfaces for the entire app
- `src/data/topics-local.json`: Pre-built TOEIC vocabulary with images and topics

## Data Import

The app supports CSV import with the following expected columns:
- word, type, phonetic, meaning, example, exampleMeaning

Users can import into existing sources or create new ones. The import UI is in `Dashboard/components/DataMode.tsx`.

## Deployment

Deployed on Vercel with SPA routing configured in `vercel.json` (all routes rewrite to `/index.html`).