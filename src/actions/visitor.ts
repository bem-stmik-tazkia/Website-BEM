"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function recordSiteVisitor(sessionId: string, path: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    
    await supabase.from("site_visitors").insert([
      { session_id: sessionId, path, user_agent: userAgent }
    ]);
  } catch (error) {
    console.error("Error recording visitor:", error);
  }
}
