"use server";

import { getWeather } from "@/app/actions/weather";
import { getWindForecast } from "@/app/actions/windForecast";
import {
    getForecast,
    getHistoricalTideData,
    getRiverHeight,
    getTideReadingsMinMax,
} from "@/app/actions/riverHeight";

/** One invocation for the full first paint. The open-tab poll does not use this. */
export async function loadDashboard() {
    const [river, forecast, historical, weather, minMax, wind] = await Promise.all([
        getRiverHeight(),
        getForecast(),
        getHistoricalTideData(),
        getWeather(),
        getTideReadingsMinMax(),
        getWindForecast(),
    ]);

    return { river, forecast, historical, weather, minMax, wind };
}
