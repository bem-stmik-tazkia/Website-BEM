import { createClient } from "@/utils/supabase/server";
import KaryaProjek from "./KaryaProjek";

export default async function KaryaProjekServer() {
  const supabase = await createClient();
  const { data: topKaryaData } = await supabase
    .from("karya")
    .select("*")
    .eq("status", "approved")
    .order("likes", { ascending: false })
    .order("views", { ascending: false })
    .limit(3);

  return <KaryaProjek karyaList={topKaryaData || []} />;
}
