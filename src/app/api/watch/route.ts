import { NextResponse } from "next/server";
import { getForecast, getRiverHeight } from "@/app/actions/riverHeight";
import { buildWatchPayload } from "@/lib/watchPayload";
import { getDefaultThresholds } from "@/lib/thresholdsServer";

export const dynamic = "force-dynamic";

/** CDN keeps this response so the watch and open tabs share one origin read. */
const CDN_CACHE_SECONDS = 300;

/**
 * Compact public payload for the Garmin widget.
 * Status uses the global default thresholds. No login.
 */
export async function GET() {
    try {
        const [river, forecast, thresholds] = await Promise.all([
            getRiverHeight(),
            getForecast(),
            getDefaultThresholds(),
        ]);

        const payload = river
            ? buildWatchPayload(river, forecast, thresholds)
            : null;

        if (!payload) {
            return NextResponse.json(
                { error: "no-data" },
                { status: 503, headers: { "Cache-Control": "no-store" } }
            );
        }

        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "public, max-age=0, must-revalidate",
                "Vercel-CDN-Cache-Control": `public, s-maxage=${CDN_CACHE_SECONDS}`,
            },
        });
    } catch (error) {
        console.error("Watch payload failed:", error);
        return NextResponse.json(
            { error: "no-data" },
            { status: 503, headers: { "Cache-Control": "no-store" } }
        );
    }
}
