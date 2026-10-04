// Admin authorization is enforced by the Supabase profiles.role value and RLS.
// The browser only uses this helper as a UI hint; server/database policies remain authoritative.
export const isAdminUser = (user, profile) => Boolean(profile?.role === 'admin' || user?.app_metadata?.role === 'admin')
