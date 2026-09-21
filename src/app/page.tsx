import { getRiverHeight, getForecast, getHistoricalTideData, getTideReadingsMinMax } from "@/app/actions/riverHeight";
import { getWeather } from "@/app/actions/weather";
import { getWindForecast } from "@/app/actions/windForecast";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
    const [initialData, initialForecast, initialHistoricalData, weatherData, initialMinMax, initialWindForecast] = await Promise.all([
        getRiverHeight(),
        getForecast(),
        getHistoricalTideData(),
        getWeather(),
        getTideReadingsMinMax(),
        getWindForecast(),
    ]);

    return (
        <Dashboard
            initialRiverData={initialData}
            initialForecast={initialForecast}
            initialHistoricalData={initialHistoricalData}
            initialWeatherData={weatherData}
            initialTideReadingsMinMax={initialMinMax}
            initialWindForecast={initialWindForecast}
        />
    );
}
