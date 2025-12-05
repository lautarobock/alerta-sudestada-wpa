import { getRiverHeight } from "@/app/actions/riverHeight";
import RiverHeightDisplay from "@/components/RiverHeightDisplay";
import FloodAlerts from "@/components/FloodAlerts";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default async function Home() {
  const initialData = await getRiverHeight();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌊 Alerta Sudestada
          </h1>
          <p className="text-lg text-gray-600">
            Monitoreo en tiempo real de la altura del río con alertas de inundación
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          <RiverHeightDisplay initialData={initialData} />
          <FloodAlerts />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>Actualización automática cada 30 segundos</p>
          <p className="mt-2">Instala esta app en tu dispositivo para recibir notificaciones</p>
        </footer>
      </main>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
