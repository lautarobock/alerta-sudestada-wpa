export const ForecastType = {
    HIGH: 'high',
    LOW: 'low'
} as const;

export type ForecastType = 'high' | 'low';

export interface Forecast {
    date: Date;
    mode: ForecastType;
    value: number;
}

export interface ForecastData {
    moment: Date;
    values: Forecast[];
}
