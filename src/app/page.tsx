import { loadDashboard } from "@/app/actions/dashboard";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
    const {
        river: initialData,
        forecast: initialForecast,
        historical: initialHistoricalData,
        weather: weatherData,
        minMax: initialMinMax,
        wind: initialWindForecast,
    } = await loadDashboard();

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
