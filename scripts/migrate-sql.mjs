import { createClient } from '@supabase/supabase-js';

const karyaUrl = "https://pmrowiyvuqnxgzmlbfzx.supabase.co";
const karyaKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcm93aXl2dXFueGd6bWxiZnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODc5MjUsImV4cCI6MjA5OTE2MzkyNX0.biXbpbXH7WF5qkYtCMC-KBQfey5fQzusaKTQ875jrmQ";
const karyaDb = createClient(karyaUrl, karyaKey);

async function run() {
  const { data, error } = await karyaDb.from('kabinet_profiles').select('*');
  if (data && data.length > 0) {
    const row = data[0];
    const sql = `
INSERT INTO kabinet_profiles (id, periode, nama_kabinet, visi, misi, logo_url, is_active, created_at, updated_at) 
VALUES (
  '${row.id}', 
  '${row.periode}', 
  '${row.nama_kabinet}', 
  '${row.visi.replace(/'/g, "''")}', 
  '${row.misi.replace(/'/g, "''")}', 
  ${row.logo_url ? `'${row.logo_url}'` : 'NULL'}, 
  ${row.is_active}, 
  '${row.created_at}', 
  '${row.updated_at}'
);
`;
    console.log(sql);
  }
}
run();
