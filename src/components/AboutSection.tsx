"use client";

import { OverlayModal } from "@/components/OverlayModal";

const PROFILE = {
    name: "Lautaro Agustín Cozzani Rodriguez",
    role: "Principal Engineer y Software Architect",
    location: "Buenos Aires, Argentina",
    email: "cozzani.lautaro@gmail.com",
};

const LINKS = [
    {
        href: "https://github.com/lautarobock",
        label: "GitHub",
        detail: "github.com/lautarobock",
    },
    {
        href: "https://www.lautaro.ar",
        label: "CV",
        detail: "lautaro.ar",
    },
];

const SOURCES = [
    {
        name: "Servicio de Hidrografía Naval",
        href: "https://www.hidro.gov.ar",
        detail: "Altura del río y pronóstico de mareas de la estación San Fernando.",
    },
    {
        name: "OpenWeatherMap",
        href: "https://openweathermap.org",
        detail: "Clima actual y pronóstico de viento para la misma zona.",
    },
];

export default function AboutSection({ onClose }: { onClose: () => void }) {
    return (
        <OverlayModal title="Acerca de" onClose={onClose}>
            <p className="text-lg font-semibold text-gray-900">{PROFILE.name}</p>
            <p className="text-gray-600">{PROFILE.role}</p>
            <p className="text-sm text-gray-500 mt-1">{PROFILE.location}</p>
            <a
                href={`mailto:${PROFILE.email}`}
                className="inline-block mt-2 text-sm text-blue-700 hover:text-blue-900 hover:underline"
            >
                {PROFILE.email}
            </a>
            <p className="text-gray-700 mt-4">
                Alerta Sudestada es un proyecto personal para seguir la altura del río en San Fernando y avisar cuando hay riesgo de sudestada o crecida.
            </p>

            <ul className="mt-5 space-y-2">
                {LINKS.map((link) => (
                    <li key={link.href}>
                        <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-900 hover:bg-blue-100 transition-colors"
                        >
                            <span>
                                <span className="block font-medium">{link.label}</span>
                                <span className="block text-sm text-blue-700">{link.detail}</span>
                            </span>
                            <span aria-hidden="true" className="text-blue-500">↗</span>
                        </a>
                    </li>
                ))}
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Fuentes de datos</h3>
            <ul className="space-y-3">
                {SOURCES.map((source) => (
                    <li key={source.href} className="text-gray-700">
                        <a
                            href={source.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-800 hover:text-blue-950 hover:underline"
                        >
                            {source.name}
                        </a>
                        <p className="text-sm text-gray-600 mt-0.5">{source.detail}</p>
                    </li>
                ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-blue-100 text-center">
                <p className="text-sm text-gray-600 mb-3">
                    Si te resulta útil, podés invitarme un café.
                </p>
                <a
                    className="mx-auto block w-48"
                    href="https://cafecito.app/brew-o-matic"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <img
                        srcSet="https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x"
                        src="https://cdn.cafecito.app/imgs/buttons/button_6.png"
                        alt="Invitame un café en cafecito.app"
                    />
                </a>
            </div>
        </OverlayModal>
    );
}
