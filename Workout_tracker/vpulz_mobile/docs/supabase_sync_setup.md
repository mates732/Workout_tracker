# Supabase auth + offline-first sync setup

## 1) Configure Expo env
Set these in your Expo environment:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2) Create table and policies
Run SQL from:

- `database/supabase_user_sync_state.sql`

This creates `public.user_sync_state` with row-level security and stores:

- `user_data_json`
- `workouts_json`
- `sets_json`
- `settings_json`
- `tracker_json`

## 3) Auth APIs wired in app
`src/shared/auth/AuthContext.tsx` now supports:

- `signIn(email, password)`
- `register(email, password)`
- `signOut()`

## 4) Offline-first sync behavior
- Local state is always saved first (`AsyncStorage`).
- Cloud sync happens after local save.
- Failed cloud writes are queued locally and flushed on login/session restore.
- Login merge is conflict-safe:
  - merges local + cloud tracker snapshot
  - persists merged snapshot locally
  - pushes merged snapshot back to Supabase

## 5) Validation: new device restore
1. Device A: sign in, create workout data/sets, update profile settings.
2. Confirm local save works even offline.
3. Reconnect network; ensure app can sync.
4. Device B (new install): sign in with same account.
5. Verify workout history, set-related draft/queue data, and user settings/profile are present.

Expected result: no data loss and data appears after login on new device.
