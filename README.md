# Alerta Sudestada - River Height Monitor PWA

A Progressive Web App (PWA) for monitoring river height with real-time flood alerts.

## Features

- 🌊 Real-time river height monitoring
- 🚨 Flood alert system with multiple threshold levels
- 📱 Progressive Web App - installable on mobile and desktop
- 🔄 Auto-refresh every 30 seconds (when app is in foreground)
- 🔔 Server Web Push alerts based on tide forecast (not current reading)
- 👤 Optional accounts to sync custom thresholds across devices
- 📊 Visual gauge showing current river level
- 🎨 Modern, responsive UI

### Notifications (Web Push)

Push notifications are sent **from the server** when the latest **forecast** exceeds alert thresholds. The external data writer should call the check endpoint after each update (~every 10 minutes).

- **Anonymous users**: global default thresholds (2.5 / 3.0 / 3.5 m)
- **Registered users**: custom thresholds stored in MongoDB, synced on all devices where they log in
- Each device has its own push subscription; one notification per forecast update per subscription

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

After installing the app, allow notifications when prompted. The browser registers a Web Push subscription with the server.

## PWA Icons

To complete the PWA setup, you need to add icon files:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

You can generate these icons using any image editor or online tool. The icons should represent the app (e.g., a river/wave icon).

## MongoDB Setup

The app uses MongoDB to store and retrieve river height data. Follow these steps to set up your database:

### 1. Create a `.env.local` file

Create a `.env.local` file in the root directory with your MongoDB connection string:

Copy `.env.example` to `.env.local` and fill in values:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
AUTH_SECRET=your-long-random-secret
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
PUSH_WEBHOOK_SECRET=shared-secret-with-data-writer
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
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

## Push webhook (external data writer)

After writing forecast data to MongoDB, call:

```http
POST https://<your-host>/api/push/check
Authorization: Bearer <PUSH_WEBHOOK_SECRET>
Content-Type: application/json
```

Response example:

```json
{
  "success": true,
  "forecastMoment": "2026-03-12T12:00:00.000Z",
  "subscriptionsChecked": 5,
  "notificationsSent": 2,
  "skipped": 3,
  "errors": 0,
  "notified": true
}
```

The endpoint is idempotent per subscription and forecast `moment`: it only sends when the forecast is new for that device and at least one predicted value exceeds that subscriber's alert/critical thresholds.

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
