# Swing Trading Analytics Web App - Architecture

This repository is structured for a multi-phase development process where different features are developed independently. 
The foundation is built using Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

## Folder Structure

- `/app`: Next.js App Router definitions and global layouts.
- `/components`: Shared, generic UI components (e.g., buttons, modals). No feature-specific logic here.
- `/features/dhan`: Dhan integration logic (Phase 1A).
- `/features/screener`: Screener engine and related UI (Phase 1B).
- `/features/charts`: Chart grid and visualization tools (Phase 1C).
- `/features/watchlist`: Watchlist management (Phase 1D).
- `/features/journal`: Trading journal management (Phase 1D).
- `/lib/supabase`: Client and server Supabase clients and configuration.
- `/lib/types`: Shared TypeScript types defining core contracts across features.
- `/scripts`: One-off and maintenance scripts (e.g., database seeding).
- `/tests`: Unit and integration tests, mirroring the `/features` structure.
- `/supabase/migrations`: Supabase SQL migration files containing the schema definitions.

## Shared TypeScript Contracts

Located in `/lib/types/index.ts`, these types define the core shapes that all features must use. They must not be redefined elsewhere:
- `PriceBar`
- `Symbol`
- `WatchlistItem`
- `ScreenerRule`
- `JournalEntry`

## Branches and Ownership

Future phases will be executed on the following branches, taking ownership of their respective feature folders:
- `feature/dhan-integration`: Owns `/features/dhan`
- `feature/screener-engine`: Owns `/features/screener`
- `feature/chart-grid`: Owns `/features/charts`
- `feature/watchlist-journal`: Owns `/features/watchlist` and `/features/journal`
