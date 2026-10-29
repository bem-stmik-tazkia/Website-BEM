"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function recordSiteVisitor(sessionId: string, path: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    
    await supabase.rpc('record_site_visitor', {
      p_session_id: sessionId || 'unknown',
      p_path: path || '/',
      p_user_agent: userAgent || 'Unknown'
    });
  } catch (error) {
    console.error("Error recording visitor:", error);
  }
}
