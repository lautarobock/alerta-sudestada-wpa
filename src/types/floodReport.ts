export type FloodState = 'no-water' | 'low-flood' | 'high-flood' | 'evacuation';

export interface FloodReport {
  _id?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  state: FloodState;
  estimatedLevelCm?: number;
  reporterName?: string;
  reporterEmail?: string;
  tideHeight?: number; // Tide height (in meters) nearest to the reported timestamp
  tideHeightTimestamp?: Date; // Timestamp of the tide reading
  createdAt: Date;
}

export interface FloodReportInput {
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string; // ISO string
  state: FloodState;
  estimatedLevelCm?: number;
  reporterName?: string;
  reporterEmail?: string;
}

