import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/** Convierte una IP v4 a entero de 32 bits para comparar contra un CIDR. */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  try {
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch {
    return false;
  }
}

/**
 * Refresca el token de sesión de Supabase en cada request (necesario
 * porque los Server Components no pueden escribir cookies por sí
 * solos). También aplica la restricción de IP del box activo, si el
 * owner la configuró — se hace aquí porque el middleware es lo único
 * que corre ANTES de renderizar cualquier página protegida.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Restricción de IP: solo aplica a rutas del panel (no a /login, no
  // a la API pública que ya tiene su propia autenticación por key).
  if (user && !request.nextUrl.pathname.startsWith('/api/')) {
    const activeBoxId = request.cookies.get('active_box_id')?.value;
    if (activeBoxId) {
      const adminClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data: box } = await adminClient
        .from('boxes')
        .select('allowed_ip_ranges')
        .eq('id', activeBoxId)
        .maybeSingle();

      const ranges = box?.allowed_ip_ranges as string[] | null;
      if (ranges && ranges.length > 0) {
        const requestIp =
          request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? request.ip ?? '';
        const allowed = ranges.some((cidr) => ipInCidr(requestIp, cidr));
        if (!allowed) {
          return NextResponse.json(
            { error: 'Acceso bloqueado — tu IP no está en el rango permitido para este box' },
            { status: 403 },
          );
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
