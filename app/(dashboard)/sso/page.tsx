import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { createSsoDomain, toggleRequireMfa, updateIpAllowlist } from './actions';

export default async function SsoPage() {
  const session = await requireStaffSession();
  if (session.role !== 'owner') redirect('/');

  const [domainsRes, boxRes] = await Promise.all([
    supabaseAdmin.from('sso_domains').select('id, email_domain, provider_name, enforce, active').eq('box_id', session.boxId),
    supabaseAdmin.from('boxes').select('require_mfa_for_staff, allowed_ip_ranges').eq('id', session.boxId).single(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">SSO y seguridad</h1>
        <p className="text-secondary text-sm">
          Inicio de sesión corporativo (SAML) y autenticación en dos pasos para el staff
        </p>
      </div>

      <div className="mb-10 border border-border rounded p-4 max-w-lg">
        <h2 className="text-sm text-primary mb-2">Antes de configurar un dominio</h2>
        <p className="text-secondary text-xs mb-2">
          El proveedor SAML se crea desde la API de administración de Supabase Auth
          (<code>supabase.auth.admin.createSsoProvider</code>), no desde este panel —
          ahí obtienes el <code>sso_provider_id</code> que pegas abajo. Esta pantalla
          solo mapea "este dominio de correo usa este proveedor", para que el login
          sepa a quién redirigir antes de pedir contraseña.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="font-display text-sm font-medium mb-3">Dominios SSO</h2>
        <table className="data-table mb-4">
          <thead>
            <tr>
              <th>Dominio</th>
              <th>Proveedor</th>
              <th>Obligatorio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(domainsRes.data ?? []).map((d: any) => (
              <tr key={d.id}>
                <td>@{d.email_domain}</td>
                <td className="text-secondary">{d.provider_name}</td>
                <td className="text-secondary">{d.enforce ? 'Sí — sin contraseña' : 'No — opcional'}</td>
                <td>
                  <span className={`pill ${d.active ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'}`}>
                    {d.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {(domainsRes.data ?? []).length === 0 && (
              <tr><td colSpan={4} className="text-secondary text-center py-8">Sin dominios SSO configurados — todos usan email y contraseña</td></tr>
            )}
          </tbody>
        </table>

        <form action={createSsoDomain} className="max-w-md flex flex-col gap-3 border border-border rounded p-4">
          <input name="email_domain" required placeholder="empresa.com (sin @)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
          <input name="provider_name" placeholder="Nombre del proveedor (ej. Okta)" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
          <input name="sso_provider_id" required placeholder="sso_provider_id de Supabase" className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary" />
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input type="checkbox" name="enforce" defaultChecked className="accent-accent" />
            Obligatorio (bloquea login con contraseña para este dominio)
          </label>
          <button type="submit" className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start">
            Agregar dominio
          </button>
        </form>
      </div>

      <div>
        <h2 className="font-display text-sm font-medium mb-3">Autenticación en dos pasos (MFA)</h2>
        <form action={toggleRequireMfa} className="flex items-center gap-3">
          <input type="checkbox" name="require_mfa" defaultChecked={boxRes.data?.require_mfa_for_staff} className="accent-accent w-4 h-4" />
          <span className="text-sm text-secondary">
            Exigir MFA (TOTP) a todo coach/admin/owner de este box antes de entrar al panel
          </span>
          <button type="submit" className="bg-accent text-primary text-sm px-3 py-1.5 rounded hover:opacity-90 transition-opacity">
            Guardar
          </button>
        </form>
        <p className="text-secondary text-xs mt-2 max-w-lg">
          La inscripción real del segundo factor la maneja Supabase Auth
          (<code>supabase.auth.mfa.enroll</code>) — con esta casilla activada, el
          panel exige que el usuario ya tenga un factor verificado antes de dejarlo
          pasar de <code>/login</code>.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-sm font-medium mb-3">Restricción por IP</h2>
        <form action={updateIpAllowlist} className="max-w-md flex flex-col gap-3">
          <textarea
            name="ranges"
            rows={4}
            placeholder={'190.85.0.0/16\n201.10.20.0/24'}
            defaultValue={(boxRes.data?.allowed_ip_ranges as string[] | null)?.join('\n') ?? ''}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-primary font-mono"
          />
          <p className="text-secondary text-xs">
            Un rango CIDR por línea. Vacío = sin restricción, cualquiera puede
            entrar al panel desde cualquier IP.
          </p>
          <button type="submit" className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity self-start">
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
