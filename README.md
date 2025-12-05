# Alerta Sudestada - River Height Monitor PWA

A Progressive Web App (PWA) for monitoring river height with real-time flood alerts.

## Features

- 🌊 Real-time river height monitoring
- 🚨 Flood alert system with multiple threshold levels
- 📱 Progressive Web App - installable on mobile and desktop
- 🔄 Auto-refresh every 30 seconds (when app is in foreground)
- 🔔 Push notifications for critical alerts (when app is in background)
- 📡 Background sync support for periodic updates
- 📊 Visual gauge showing current river level
- 🎨 Modern, responsive UI

### Background Behavior

The app is designed to work efficiently in both foreground and background:

- **Foreground**: Updates every 30 seconds automatically
- **Background**: 
  - Uses Periodic Background Sync API (when supported) to check for updates periodically
  - Sends push notifications when river height reaches alert or critical levels
  - Automatically fetches latest data when app returns to foreground
- **Notifications**: Users receive alerts when the river height status changes to "Alert" or "Critical"

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## PWA Installation

### On Mobile:
1. Open the app in your mobile browser
2. Tap the menu (three dots) and select "Add to Home Screen" or "Install App"
3. The app will be installed as a standalone application

### On Desktop:
1. Look for the install icon in your browser's address bar
2. Click it to install the app
3. The app will open in its own window

### Background Monitoring & Notifications

After installing the app, you'll be prompted to allow notifications. Granting permission enables:
- **Background monitoring**: The app can check for river height updates even when closed
- **Critical alerts**: You'll receive notifications when the river reaches alert or critical levels
- **Automatic updates**: When you reopen the app, it will immediately fetch the latest data

**Note**: Background sync capabilities vary by browser and platform:
- **Chrome/Edge**: Full support for Periodic Background Sync
- **Firefox**: Limited background sync support
- **Safari (iOS)**: Limited background capabilities, but notifications work

## PWA Icons

To complete the PWA setup, you need to add icon files:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

You can generate these icons using any image editor or online tool. The icons should represent the app (e.g., a river/wave icon).

## MongoDB Setup

The app uses MongoDB to store and retrieve river height data. Follow these steps to set up your database:

### 1. Create a `.env.local` file

Create a `.env.local` file in the root directory with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

For local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/alerta-sudestada
```

### 2. Database Collection Structure

The app expects a collection named `tides` with documents in the following format:

```json
{
  "moment": "2024-01-01T12:00:00.000Z",
  "reading": 2.15,
  "astronomical": 2.10
}
```

Where:
- `moment`: Date - The timestamp of the reading
- `reading`: number - The actual measured height (in meters)
- `astronomical`: number - The expected/astronomical height (in meters)

The app will automatically:
- Fetch the most recent reading (sorted by `moment` descending)
- Use the `reading` field for the displayed height value
- Calculate the alert status based on the reading height
- Display the data with appropriate visual indicators

### 3. Database Configuration

You can customize the database name in `src/app/actions/riverHeight.ts`:

```typescript
const db = client.db('your-database-name'); // Change if needed
```

### Alert Thresholds:
- **Normal**: < 2.5m
- **Warning**: ≥ 2.5m
- **Alert**: ≥ 3.0m
- **Critical**: ≥ 3.5m

## Building for Production

```bash
npm run build
npm start
```

## Technologies

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- MongoDB
- next-pwa (Progressive Web App support)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
