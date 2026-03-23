# VPulz Mobile (Expo)

This directory contains the React Native mobile app scaffold for VPulz.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo dev server:
   ```bash
   npm run start
   ```

## Environment

Create a `.env` file in this folder with:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
```

The app also accepts `EXPO_PUBLIC_SUPABASE_ANON_KEY` as a fallback.

## Structure

- `src/app/navigation/` - stack + tab navigation setup
- `src/features/` - feature modules (`home`, `workout`, `progress`, `profile`)
- `src/shared/components/` - reusable UI primitives
- `src/shared/theme/` - design tokens
- `src/shared/animations/` - shared interaction wrappers
