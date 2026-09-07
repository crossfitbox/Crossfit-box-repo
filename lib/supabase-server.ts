import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Cliente Supabase para Server Components / Server Actions, usando la
 * ANON key + cookies de sesión del usuario autenticado (no el service
 * role). Se usa exclusivamente para saber QUIÉN es el usuario logueado
 * y verificar su rol — las consultas de datos del panel siguen yendo
 * por `supabase-admin.ts` (service role) una vez confirmado que tiene
 * permiso de staff.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // set() puede fallar en un Server Component puro (no en
            // Server Action/Route Handler) — el middleware se encarga
            // de refrescar la cookie en ese caso.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // ver nota arriba
          }
        },
      },
    },
  );
}
