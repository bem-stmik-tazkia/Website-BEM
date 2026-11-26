import "server-only";
import { getServiceRoleClient } from "@/lib/auth";
import { AgendaItem, AgendaKegiatan } from "@/types/agenda";
import { aggregateAgendaItemsAndCounts } from "@/lib/registration-validation";

/**
 * Enriches agenda rows with their `agenda_items` (positions / competitions)
 * and live accepted/rejected counts from `volunteer_applications`.
 * Uses service role client for aggregate counts only (never leaks PII).
 */
export async function enrichAgendasWithItemsAndCounts<T extends Partial<AgendaKegiatan>>(
  agendas: T[]
): Promise<T[]> {
  if (!agendas || agendas.length === 0) return agendas;

  const agendaIds = Array.from(
    new Set(agendas.map((a) => a.id).filter((id): id is string => Boolean(id)))
  );
  if (agendaIds.length === 0) return agendas;

  let serviceClient;
  try {
    serviceClient = getServiceRoleClient();
  } catch {
    return agendas;
  }

  const [itemsRes, rpcAppsRes] = await Promise.all([
    serviceClient
      .from("agenda_items")
      .select("id, agenda_id, name, description, quota, participant_type, rulebook_url, extra_fields, sort_order, created_at, updated_at")
      .in("agenda_id", agendaIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    serviceClient.rpc("get_agenda_application_counts", { p_agenda_ids: agendaIds }),
  ]);

  let apps: Array<{ agenda_id: string; item_id?: string | null; status?: string | null; row_count?: number }> = [];
  if (!rpcAppsRes.error && Array.isArray(rpcAppsRes.data)) {
    apps = rpcAppsRes.data as Array<{
      agenda_id: string;
      item_id?: string | null;
      status?: string | null;
      row_count?: number;
    }>;
  } else {
    const rawAppsRes = await serviceClient
      .from("volunteer_applications")
      .select("agenda_id, item_id, status")
      .in("agenda_id", agendaIds);
    apps = !rawAppsRes.error && Array.isArray(rawAppsRes.data)
      ? (rawAppsRes.data as Array<{ agenda_id: string; item_id?: string | null; status?: string | null }>)
      : [];
  }

  const items = !itemsRes.error && Array.isArray(itemsRes.data)
    ? (itemsRes.data as AgendaItem[])
    : [];

  return aggregateAgendaItemsAndCounts(agendas, items, apps);
}
