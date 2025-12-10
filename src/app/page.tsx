import { getRiverHeight, getForecast, getHistoricalTideData } from "@/app/actions/riverHeight";
import { getWeather } from "@/app/actions/weather";
import RiverHeightDisplay from "@/components/RiverHeightDisplay";
import WeatherCard from "@/components/WeatherCard";
import FloodAlerts from "@/components/FloodAlerts";
import AlertLevelsModal from "@/components/AlertLevelsModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import FloodReportForm from "@/components/FloodReportForm";

export default async function Home() {
    const [initialData, initialForecast, initialHistoricalData, weatherData] = await Promise.all([
        getRiverHeight(),
        getForecast(),
        getHistoricalTideData(),
        getWeather()
    ]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <img src="/icon-source.png" alt="Wave icon" className="w-10 h-10 inline-block" />
                        Alerta Sudestada
                    </h1>
                    <p className="text-lg text-gray-600">
                        Monitoreo en tiempo real de la altura del río con alertas de inundación
                    </p>
                </header>

                {/* Main Content */}
                <div className="space-y-8">
                    <RiverHeightDisplay
                        initialData={initialData}
                        initialForecast={initialForecast}
                        initialHistoricalData={initialHistoricalData}
                    />
                    <WeatherCard data={weatherData} />
                    <FloodAlerts />
                    <FloodReportForm />

                    <div className="w-full max-w-2xl mx-auto">
                        <a style={{ marginLeft: 'auto', marginRight: 'auto', width: '192px', display: 'block' }} href='https://cafecito.app/brew-o-matic' rel='noopener' target='_blank'><img srcSet='https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x' src='https://cdn.cafecito.app/imgs/buttons/button_6.png' alt='Invitame un café en cafecito.app' /></a>
                    </div>

                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Actualización automática cada 30 segundos</p>
                    <p className="mt-2">Instala esta app en tu dispositivo para recibir notificaciones</p>
                </footer>
            </main>

            {/* Alert Levels Modal */}
            <AlertLevelsModal />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />


        </div>
    );
}
