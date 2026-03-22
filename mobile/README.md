# Workout Tracker — Mobile App

React Native / Expo app for the Workout Tracker platform.

## Prerequisites

- **Node.js 18+** (the legacy global `expo-cli` is deprecated on Node 17+; this
  project uses the **local** Expo CLI bundled in `node_modules` — no global
  install required)
- Backend running (see `../fitness_coach_app/README.md`)
- [Expo Go](https://expo.dev/client) installed on your phone **or** an Android /
  iOS simulator

## Quick start

```bash
# 1. Install dependencies (uses local Expo CLI — no global expo-cli needed)
cd mobile
npm install          # or: yarn install

# 2. Configure the API URL for your device (see "Network connectivity" below)
cp .env.example .env
# Edit .env and set EXPO_PUBLIC_API_URL to your computer's LAN IP

# 3. Start the development server
npx expo start       # shows a QR code — scan with Expo Go on your phone
```

All Expo commands use `npx expo <command>` (local CLI).  Never install the
deprecated global `expo-cli` package.

## Network connectivity on a physical device

> **"Can't connect to server"**

`localhost` on a phone refers to the phone itself, not your computer.  You must
use your **computer's LAN IP address** on the same Wi-Fi network.

1. Find your LAN IP:
   - macOS / Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig | findstr "IPv4"`

2. Edit `mobile/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.42:8000
   ```
   Replace `192.168.1.42` with your actual LAN IP.

3. Restart the Expo dev server:
   ```bash
   npx expo start
   ```

The `EXPO_PUBLIC_` prefix makes the value available at runtime in the app via
`process.env.EXPO_PUBLIC_API_URL`.  This is the modern approach (Expo SDK 49+);
no extra config is required.

## Available scripts

| Command | Description |
|---|---|
| `npx expo start` | Start Metro bundler (QR code for Expo Go) |
| `npx expo start --android` | Open on Android emulator / connected device |
| `npx expo start --ios` | Open on iOS simulator (macOS only) |
| `npx expo start --web` | Open in browser |

## Project structure

```
mobile/
├── App.tsx                  Entry point
├── app.json                 Expo configuration
├── package.json             Local expo package (not global expo-cli)
├── tsconfig.json
├── babel.config.js
├── .env.example             Copy to .env — set EXPO_PUBLIC_API_URL
└── src/
    ├── api/
    │   └── client.ts        API helpers (reads EXPO_PUBLIC_API_URL)
    ├── navigation/
    │   └── AppNavigator.tsx Stack navigator
    └── screens/
        └── HomeScreen.tsx   Home screen + server health indicator
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL. **Must be set to your LAN IP when testing on a physical device.** |
