import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de servidor con service role key: se usa SOLO en Server
 * Components / Route Handlers de Next.js, nunca en el bundle del
 * navegador. Esto le da al panel admin acceso completo a todos los
 * boxes, ignorando las políticas RLS que sí aplican en la app móvil
 * de atletas.
 *
 * En producción, restringe esto aún más: valida en cada página que
 * el usuario autenticado (vía Supabase Auth + tu propia sesión admin)
 * tiene rol "owner" o "admin" en box_members antes de mostrar datos.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);
