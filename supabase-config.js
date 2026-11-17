/*
  WESTBRIDGE GLOBAL — Supabase connection
  Replace both values with your own Supabase project values.
  Use the publishable/anon key ONLY. Never put a service_role/secret key in browser files.
*/
window.WESTBRIDGE_SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
window.WESTBRIDGE_SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

window.wbSupabase = null;
window.wbConfigReady = false;

(function () {
  const valid = window.WESTBRIDGE_SUPABASE_URL.startsWith("https://") &&
    !window.WESTBRIDGE_SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
    window.WESTBRIDGE_SUPABASE_ANON_KEY &&
    !window.WESTBRIDGE_SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  if (valid && window.supabase?.createClient) {
    window.wbSupabase = window.supabase.createClient(
      window.WESTBRIDGE_SUPABASE_URL,
      window.WESTBRIDGE_SUPABASE_ANON_KEY
    );
    window.wbConfigReady = true;
  }
})();