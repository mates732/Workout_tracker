# Workout Tracker — Mobile App

A React Native (Expo) mobile application for the Workout Tracker platform.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later  
- [Expo Go](https://expo.dev/client) installed on your iOS or Android device

> **Note:** This app uses the **local** Expo CLI (`expo` listed as a
> `dependency` in `package.json`).  You do **not** need to install the
> deprecated global `expo-cli` package.

## Quick start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Configure the API URL (see Connectivity section below)
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL

# 3. Start the dev server
npm start
# or for a specific platform:
npm run android
npm run ios
```

Scan the QR code that appears in your terminal with the **Expo Go** app on
your phone.

## Connectivity — running on a physical device

When testing on a physical device the app cannot reach `localhost` because
`localhost` resolves to the phone itself, not your development machine.

**Steps to fix:**

1. Make sure both your phone and your computer are connected to the
   **same Wi-Fi network**.
2. Find the LAN IP address of your computer:
   - **macOS / Linux:** `ipconfig getifaddr en0` or `ip route get 1 | awk '{print $7}'`
   - **Windows:** `ipconfig` → look for "IPv4 Address"
3. Edit `mobile/.env` and set:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
   ```
   Replace `192.168.x.x` with your machine's actual LAN IP.
4. Restart the Expo dev server (`npm start`).

## Backend

The backend server must be running before you open the app.  
From the project root:

```bash
# Using Docker Compose
docker-compose -f fitness_coach_app/docker-compose.yml up --build

# Or directly (Python)
cd fitness_coach_app/backend
pip install -r requirements.txt
uvicorn src.core.app:app --reload --host 0.0.0.0 --port 8000
```

## Project structure

```
mobile/
├── App.tsx                  # Root component
├── app.json                 # Expo app configuration
├── package.json             # Dependencies (local expo, no global expo-cli)
├── tsconfig.json
├── babel.config.js
├── .env.example             # Copy to .env and set your API URL
└── src/
    ├── navigation/          # React Navigation stack/tab definitions
    ├── screens/             # App screens
    │   ├── HomeScreen.tsx
    │   ├── WorkoutListScreen.tsx
    │   ├── WorkoutDetailScreen.tsx
    │   ├── LogWorkoutScreen.tsx
    │   └── WorkoutHistoryScreen.tsx
    ├── services/
    │   └── api.ts           # Fetch wrapper — reads EXPO_PUBLIC_API_URL
    └── types/
        └── index.ts         # TypeScript domain types
```
