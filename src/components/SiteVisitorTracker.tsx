"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordSiteVisitor } from "@/actions/visitor";

export default function SiteVisitorTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only track if not tracked in this active window session to prevent spamming on rapid navigation
    if (trackedPaths.current.has(pathname)) return;

    // Skip admin paths
    if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;

    const today = new Date().toISOString().split("T")[0];
    let sessionData = localStorage.getItem("site_session_data");
    let sessionId = "";
    
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed.date === today) {
          sessionId = parsed.id;
        }
      } catch (e) {}
    }

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("site_session_data", JSON.stringify({ date: today, id: sessionId }));
    }

    trackedPaths.current.add(pathname);
    
    // Call server action silently
    recordSiteVisitor(sessionId, pathname).catch(() => {});

  }, [pathname]);

  return null;
}
