import { NextResponse } from "next/server";
import { getForecast, getRiverHeight } from "@/app/actions/riverHeight";

export const dynamic = "force-dynamic";

/** CDN keeps this response so open tabs share one origin read. */
const CDN_CACHE_SECONDS = 300;

/**
 * Height + tide forecast only. Public (default thresholds); the client
 * reapplies the signed-in user's thresholds.
 */
export async function GET() {
    try {
        const [river, forecast] = await Promise.all([
            getRiverHeight(),
            getForecast(),
        ]);

        return NextResponse.json(
            { river, forecast },
            {
                headers: {
                    "Cache-Control": "public, max-age=0, must-revalidate",
                    "Vercel-CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}`,
                },
            }
        );
    } catch (error) {
        console.error("Live dashboard fetch failed:", error);
        return NextResponse.json(
            { error: "No se pudieron leer los datos" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}
