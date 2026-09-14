import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_URL = "https://sewnndspsnafutgfdhfy.supabase.co";
const FALLBACK_KEY = "sb_publishable_iBokwlTrXQraYVMSxK2lNQ__1FnsA2r";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

  return createBrowserClient(url, anonKey);
}
