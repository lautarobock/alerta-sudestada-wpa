import type { AnalyticsEvent } from '@/types/analytics';

// Check if we're running on localhost
function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local')
  );
}

// Generate or retrieve a session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'analytics_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    // Generate a simple anonymous session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// Get simplified user agent (just browser name, not full string)
function getBrowserInfo(): string {
  if (typeof window === 'undefined') return '';
  
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('edg')) return 'edge';
  return 'other';
}

// Track a page view
export async function trackPageView(path: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }
  
  try {
    const event: AnalyticsEvent = {
      sessionId: getSessionId(),
      path,
      timestamp: new Date(),
      userAgent: getBrowserInfo(),
      referrer: document.referrer || undefined,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
    };

    // Send to API endpoint
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics tracking failed:', error);
  }
}

// Track a custom event (optional, for future use)
export async function trackEvent(eventName: string, data?: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }
  
  try {
    const event: AnalyticsEvent = {
      sessionId: getSessionId(),
      path: window.location.pathname,
      timestamp: new Date(),
      userAgent: getBrowserInfo(),
      referrer: document.referrer || undefined,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language,
      ...data,
    };

    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...event, eventName }),
    });
  } catch (error) {
    console.debug('Analytics tracking failed:', error);
  }
}

