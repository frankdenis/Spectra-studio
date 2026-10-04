export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean)

export const isAdminUser = (user) => Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))
