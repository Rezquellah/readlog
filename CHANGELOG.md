# CHANGELOG

## 2026-03-01 - Supabase Sync + UI Stability

### Fixed
- Resolved Add/Edit Book cover preview layout bug:
  - fixed-size preview area (`132x176`)
  - large images no longer expand modal layout
  - modal body now scrolls with `max-h-[80vh]`
  - sticky footer keeps primary actions reachable
  - added remove-cover action and upload/remove toasts

### Added
- Supabase cross-device persistence.
- Email/password auth with new routes:
  - `/login`
  - `/signup`
- Middleware route protection (unauthenticated users redirected to `/login`).
- Header/sidebar user menu with logout.
- Supabase repository layer:
  - `book-repo`
  - `chapter-repo`
  - `note-repo`
  - `vocab-repo`
- Supabase Storage cover uploads (`readlog-covers`).
- `robots.txt` metadata route.
- Supabase SQL schema + RLS policies in `supabase/schema.sql`.
- `.env.example` for required public Supabase variables.

### Changed
- Reading data context now loads/syncs data with Supabase.
- Settings copy updated from local IndexedDB wording to synced Supabase wording.
- App metadata updated to ReadLog branding.

## 2026-03-01 - Momentum and Goals Update

### Added
- Reading date fields on books: `startDate`, `targetFinishDate`, `finishedDate`.
- Add/Edit Book date inputs with helper text and quick date actions:
  - Start today
  - Goal in 7 days
  - Goal in 14 days
  - Goal in 30 days
- Book detail goal card with:
  - start and target dates
  - days remaining / overdue state
  - suggested chapters-per-day pace
- `Mark as Finished` action in book detail.
- Dashboard momentum widgets:
  - goals this week (7/14 day toggle)
  - today next-step recommendation
  - streak card (current and best)
- Global `Quick Add` modal in app header with tabs:
  - Quick Vocab
  - Quick Learning
  - Quick Note
- Weekly Review page (`/weekly-review`) with markdown export.
- Activity-day tracking in IndexedDB for streak computation.
- Settings toggle for milestone celebrations.
- Milestone toasts:
  - first vocabulary item for a book
  - 25/50/75/100 progress milestones

### Changed
- Dexie schema upgraded to v3.
- `books` index now includes `targetFinishDate` for goal sorting/filtering.
- Backup payload version updated to `2`.
- Backup/restore now includes activity log day entries and new book date fields.
- Library filters/sort now support:
  - filter: has goal date
  - sort: goal date (soonest first)
- Demo seed data updated for new schema fields.

### Fixed
- Automatic date-safe normalization when status changes to `FINISHED`.
- Consistent persistence defaults for `celebrationsEnabled` and activity log data.

### Tests
- Updated storage tests for schema v3 and backup v2 payload structure.

## 2026-03-01 - Enhancement Release

### Added
- Dashboard home route (`/`) with summary cards, continue-reading list, and quick actions.
- ReadLog SVG logo + wordmark in app shell (clickable to dashboard).
- Book edit flow using shared add/edit form dialog.
- Edit entry points on book cards and book detail header.
- Toast notifications for save/update/delete operations.
- Error boundaries (global route error + component boundary for editor area).
- IndexedDB storage with Dexie schema versioning and migration support.
- Backup/restore JSON flow in Settings (includes media blobs).
- Optional cloud-sync toggle in Settings (opt-in, offline-first remains default).
- Storage unit tests (Vitest + fake-indexeddb).

### Changed
- Replaced localStorage-first persistence with Dexie/IndexedDB persistence.
- Extended reading data model with:
  - app settings
  - media blob records for uploaded note images and book covers
- Added localStorage -> IndexedDB migration bridge for existing users.
- Improved shell navigation with Home section and better mobile/desktop consistency.
- Improved empty/loading states and persistence status feedback.

### Fixed
- No-readd required for book edits (full CRUD now supported).
- Safer chapter value handling when total chapters decrease below current chapter.

### Tooling
- Added `npm run test` script.
- Added `vitest.config.ts` and storage test suite.
