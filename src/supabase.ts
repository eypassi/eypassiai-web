import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://krrhegbikgusqubxcxbr.supabase.co";
const fallbackAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycmhlZ2Jpa2d1c3F1YnhjeGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5Mjk2NDAsImV4cCI6MjA5MzUwNTY0MH0.6ayoS5WpC29Iy3BB7ouloHL7x2usRTs-jIP6Q2ZtjUk";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function publicObjectUrl(bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
