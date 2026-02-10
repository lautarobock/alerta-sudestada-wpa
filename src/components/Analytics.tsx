"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { trackPageView } from "@/utils/analytics";

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view when pathname changes
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <VercelAnalytics />;
}

