import { getRiverHeight, getForecast, getHistoricalTideData } from "@/app/actions/riverHeight";
import { getWeather } from "@/app/actions/weather";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
    const [initialData, initialForecast, initialHistoricalData, weatherData] = await Promise.all([
        getRiverHeight(),
        getForecast(),
        getHistoricalTideData(),
        getWeather()
    ]);

    return (
        <Dashboard
            initialRiverData={initialData}
            initialForecast={initialForecast}
            initialHistoricalData={initialHistoricalData}
            initialWeatherData={weatherData}
        />
    );
}
