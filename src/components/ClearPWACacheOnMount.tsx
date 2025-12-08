"use client";

import { useEffect } from "react";
import { clearPWACacheOnDev } from "@/utils/clearPWACache";

/**
 * Component that clears PWA cache on mount in development mode
 * This helps avoid conflicts when switching between different PWA projects
 */
export function ClearPWACacheOnMount() {
  useEffect(() => {
    clearPWACacheOnDev();
  }, []);

  return null;
}
