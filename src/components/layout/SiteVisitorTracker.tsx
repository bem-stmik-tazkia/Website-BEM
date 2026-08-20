"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getDeviceId } from "@/utils/identity";

export default function SiteVisitorTracker() {
  const supabase = createClient();

  useEffect(() => {
    async function trackVisit() {
      try {
        const deviceId = getDeviceId();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Record site visitor permanently (1 unique visit per device/user)
        await supabase.rpc('track_site_visitor', {
          p_device_id: deviceId,
          p_user_id: userId
        });
      } catch (err) {
        // Silently catch network errors
      }
    }

    trackVisit();
  }, [supabase]);

  return null;
}
