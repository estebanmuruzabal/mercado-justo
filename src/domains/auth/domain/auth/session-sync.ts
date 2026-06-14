export const AUTH_SESSION_SYNC_EVENT = 'mercado-justo:auth-session-sync'

/** Notify client listeners (e.g. header) to re-read Supabase session from cookies. */
export function broadcastAuthSessionSync() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_SYNC_EVENT))
}
