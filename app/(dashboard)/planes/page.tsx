import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { deletePlan } from './actions';

async function getPlans(boxId: string) {
  const { data } = await supabaseAdmin
    .from('membership_plans')
    .select('id, name, classes_per_period, price_cents, currency, period, active, subscriptions(id, status)')
    .eq('box_id', boxId)
    .order('price_cents', { ascending: true });

  return data ?? [];
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function PlansPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const plans = await getPlans(session.boxId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">
            Planes y pagos
          </h1>
          <p className="text-secondary text-sm">
            Membresías activas y suscriptores por plan
          </p>
        </div>
        {perms.plans.create && (
          <Link
            href="/planes/nuevo"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Nuevo plan
          </Link>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Plan</th>
            <th>Clases</th>
            <th>Precio</th>
            <th>Periodo</th>
            <th>Suscriptores activos</th>
            <th>Estado</th>
            {(perms.plans.edit || perms.plans.delete) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {plans.map((p: any) => {
            const activeSubs = (p.subscriptions ?? []).filter(
              (s: any) => s.status === 'active',
            ).length;

            return (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="text-secondary">
                  {p.classes_per_period ? `${p.classes_per_period}/mes` : 'Ilimitado'}
                </td>
                <td>{formatPrice(p.price_cents, p.currency)}</td>
                <td className="text-secondary capitalize">{p.period}</td>
                <td>{activeSubs}</td>
                <td>
                  <span
                    className={`pill ${
                      p.active ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'
                    }`}
                  >
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {(perms.plans.edit || perms.plans.delete) && (
                  <td>
                    <div className="flex gap-3 justify-end">
                      {perms.plans.edit && (
                        <Link
                          href={`/planes/${p.id}/editar`}
                          className="text-xs text-secondary hover:text-primary"
                        >
                          Editar
                        </Link>
                      )}
                      {perms.plans.delete && (
                        <form action={deletePlan.bind(null, p.id)}>
                          <button type="submit" className="text-xs text-accent hover:opacity-80">
                            Borrar
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
          {plans.length === 0 && (
            <tr>
              <td colSpan={7} className="text-secondary text-center py-10">
                No hay planes de membresía creados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
