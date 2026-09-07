# Box Admin

Panel web para dueños/coaches de un box: clases, WODs, miembros y
planes de membresía. Consume el mismo esquema Supabase que la app
Flutter (`schema_crossfit_app.sql`), pero con acceso vía service role
key en el servidor — no pasa por las políticas RLS pensadas para
atletas, porque el admin necesita ver todo el box.

## Stack

- Next.js 14 (App Router, Server Components)
- Tailwind CSS
- Supabase (mismo proyecto/esquema que la app móvil)

## Cómo correr

```bash
npm install
cp .env.local.example .env.local   # completa con tus credenciales
npm run dev
```

Abre http://localhost:3000

## Estructura

```
app/
  layout.tsx           -> shell raíz (solo fuentes/estilos, sin sidebar)
  login/page.tsx        -> login (fuera del grupo protegido)
  (dashboard)/
    layout.tsx           -> exige sesión + rol staff, muestra sidebar
    page.tsx              -> dashboard (resumen del día)
    clases/page.tsx        -> horario y ocupación de clases
    wods/page.tsx            -> WODs publicados y participación
    miembros/page.tsx         -> atletas, coaches y staff
    planes/page.tsx            -> planes de membresía y suscriptores
    finanzas/page.tsx           -> ingresos vs gastos
    retencion/page.tsx           -> señales de riesgo de cancelación
    prospectos/page.tsx           -> CRM / pipeline de leads
components/
  sidebar.tsx           -> navegación lateral
  logout-button.tsx      -> cierre de sesión
lib/
  supabase-admin.ts     -> cliente con service role (bypassa RLS, solo servidor)
  supabase-server.ts     -> cliente con anon key + cookies (Server Components)
  supabase-browser.ts     -> cliente con anon key (login, en el navegador)
  require-staff.ts         -> exige sesión + rol coach/admin/owner o redirige a /login
middleware.ts            -> refresca la cookie de sesión en cada request
```

## Cómo funciona la protección

1. `middleware.ts` refresca el token de sesión en cada request (patrón
   estándar de Supabase SSR con Next.js).
2. `app/(dashboard)/layout.tsx` envuelve TODAS las páginas del panel y
   llama a `requireStaffSession()` antes de renderizar nada.
3. `requireStaffSession()` verifica dos cosas: que haya un usuario
   autenticado, y que ese usuario tenga una fila en `box_members` con
   rol `coach`, `admin` u `owner` y `status = active`. Si falla
   cualquiera de las dos, redirige a `/login`.
4. `/login` vive fuera del grupo `(dashboard)`, así que no pasa por el
   chequeo — es la única página pública del panel.

Cada coach/admin/owner necesita un usuario en Supabase Auth (créalo
desde el dashboard de Supabase o con `supabase.auth.admin.createUser`)
con el mismo `id` que su fila en `profiles`.


## Pendiente antes de producción

- [x] Autenticación real del admin (Supabase Auth + verificación de rol)
- [ ] Selector de box activo cuando el mismo admin gestiona más de un
      tenant (multi-box para cadenas) — hoy toma el primer box del
      usuario
- [ ] Formularios de creación/edición (los botones "Nueva clase",
      "Publicar WOD", etc. son placeholders sin funcionalidad todavía)
- [ ] Paginación en las tablas (ahora mismo limitadas a 30-100 filas)
- [ ] Página de gestión de usuarios admin (invitar coaches, asignar
      roles) — hoy los usuarios se crean manualmente en Supabase Auth
