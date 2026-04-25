import { createClient } from "@supabase/supabase-js";

// Lazy admin client — same pattern as supabase-storage.ts.
// Eager initialization throws at build time when SUPABASE_SERVICE_ROLE_KEY
// is not available as a Docker build arg; lazy init defers to request time.
let _adminInstance: ReturnType<typeof createClient> | undefined;

function getAdmin(): ReturnType<typeof createClient> {
  if (!_adminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "[Admin] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set at runtime"
      );
    }
    _adminInstance = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _adminInstance;
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getAdmin();
    const value = (client as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});
