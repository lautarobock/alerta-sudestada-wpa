# Development Cache Management Guide

When working with multiple PWA projects on the same port, you may encounter cache conflicts. This guide explains how to avoid and resolve these issues.

## Quick Solutions

### Option 1: Use Different Ports (Recommended)
This project is configured to run on port **3001** by default to avoid conflicts with other projects on port 3000.

```bash
npm run dev          # Runs on port 3001
npm run dev:3000     # Runs on port 3000 (if needed)
npm run dev:clear    # Runs on port 3001 with cache disabled
```

### Option 2: Clear Cache Manually

#### In Browser DevTools:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** → **Clear site data**
4. Or manually:
   - **Service Workers**: Unregister all
   - **Cache Storage**: Delete all caches
   - **Local Storage**: Clear (optional)

#### Using URL Parameter:
Add `?clear-cache=true` to your URL to automatically clear cache on page load:
```
http://localhost:3001?clear-cache=true
```

### Option 3: Use Incognito/Private Mode
Open the app in an incognito/private browser window to avoid cache conflicts entirely.

## Automatic Cache Clearing

The app automatically detects when you switch between different projects and clears the cache. This is handled by the `ClearPWACacheOnMount` component.

## Manual Cache Clearing (Programmatic)

If you need to clear cache programmatically, you can use:

```typescript
import { clearPWACache } from "@/utils/clearPWACache";

// Clear all PWA cache
await clearPWACache();
```

## Service Worker Management

### Check Registered Service Workers:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log("Registered service workers:", registrations);
});
```

### Unregister All Service Workers:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## Troubleshooting

### Issue: Old service worker still active
**Solution**: 
1. Close all tabs with the app
2. Clear browser cache
3. Restart dev server
4. Open app in new tab

### Issue: Manifest conflicts
**Solution**: 
- Each project should have a unique `short_name` in manifest.json
- Use different ports for different projects

### Issue: Cache not clearing
**Solution**:
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Use `?clear-cache=true` URL parameter
3. Clear browser cache manually via DevTools

## Best Practices

1. **Use different ports** for different PWA projects
2. **Use incognito mode** when testing multiple projects
3. **Clear cache** when switching between projects
4. **Check service workers** in DevTools Application tab
5. **Restart dev server** if cache issues persist

## Development vs Production

- **Development**: PWA is disabled, no service worker registered
- **Production**: PWA is enabled, service worker is active

This means cache conflicts should only occur if you're testing production builds or if you manually register service workers in development.
