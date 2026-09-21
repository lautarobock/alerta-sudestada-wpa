export interface WindForecastSlot {
  dt: Date;
  speed: number;
  deg: number;
  gust?: number;
  insertedAt: Date;
  notifiedAt: Date | null;
}
