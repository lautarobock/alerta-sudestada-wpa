export interface AnalyticsEvent {
  sessionId: string;
  path: string;
  timestamp: Date;
  userAgent?: string;
  referrer?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
}

