import { createClient } from '@supabase/supabase-js';

// Karya (Source)
const karyaUrl = "https://pmrowiyvuqnxgzmlbfzx.supabase.co";
const karyaKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcm93aXl2dXFueGd6bWxiZnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODc5MjUsImV4cCI6MjA5OTE2MzkyNX0.biXbpbXH7WF5qkYtCMC-KBQfey5fQzusaKTQ875jrmQ";
const karyaDb = createClient(karyaUrl, karyaKey);

// BEM (Destination)
const bemUrl = "https://dfeokmrfwgrufruieunh.supabase.co";
const bemKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZW9rbXJmd2dydWZydWlldW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDkwNTUsImV4cCI6MjEwNDUyNTA1NX0.Bfm-H1nXJpWm5mrpy6ibJsuXDPdKGuwN0rKJA4Mfvfk";
const bemDb = createClient(bemUrl, bemKey);

async function run() {
  console.log("Menarik data kabinet dari Karya...");
  const { data: kabinetData, error: fetchError } = await karyaDb
    .from('kabinet_profiles')
    .select('*');
    
  if (fetchError) {
    console.error("Gagal menarik data:", fetchError);
    return;
  }
  
  if (!kabinetData || kabinetData.length === 0) {
    console.log("Tidak ada data kabinet di Karya.");
    return;
  }
  
  console.log(`Ditemukan ${kabinetData.length} data kabinet. Memasukkan ke BEM...`);
  
  const { data: insertedData, error: insertError } = await bemDb
    .from('kabinet_profiles')
    .upsert(kabinetData, { onConflict: 'id' });
    
  if (insertError) {
    console.error("Gagal memasukkan data ke BEM. Pesan error:", insertError.message);
  } else {
    console.log("✅ Berhasil migrasi data kabinet dari Karya ke BEM!");
  }
}

run();
