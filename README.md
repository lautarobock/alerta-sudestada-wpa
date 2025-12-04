# Alerta Sudestada - River Height Monitor PWA

A Progressive Web App (PWA) for monitoring river height with real-time flood alerts.

## Features

- 🌊 Real-time river height monitoring
- 🚨 Flood alert system with multiple threshold levels
- 📱 Progressive Web App - installable on mobile and desktop
- 🔄 Auto-refresh every 30 seconds
- 📊 Visual gauge showing current river level
- 🎨 Modern, responsive UI

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

## PWA Icons

To complete the PWA setup, you need to add icon files:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

You can generate these icons using any image editor or online tool. The icons should represent the app (e.g., a river/wave icon).

## API

The app includes a mock API endpoint at `/api/river-height` that simulates river height data. In production, replace this with a real API endpoint that fetches actual river height data.

### API Response Format:
```json
{
  "height": 2.15,
  "unit": "m",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "location": "Río de la Plata - Puerto Buenos Aires",
  "status": "normal"
}
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
- next-pwa (Progressive Web App support)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
