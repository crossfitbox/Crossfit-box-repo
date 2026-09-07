import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewDiscountForm, RedeemDiscountForm } from './discount-forms';

function formatValue(type: string, value: number) {
  return type === 'percentage'
    ? `${value}%`
    : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value / 100);
}

export default async function DiscountsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const [discountsRes, plansRes, membersRes] = await Promise.all([
    supabaseAdmin
      .from('discounts')
      .select('id, code, type, value, stackable, valid_until, active, membership_plans(name), discount_redemptions(id)')
      .eq('box_id', session.boxId)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('membership_plans').select('id, name').eq('box_id', session.boxId),
    supabaseAdmin
      .from('box_members')
      .select('profile_id, profiles(full_name)')
      .eq('box_id', session.boxId)
      .eq('status', 'active'),
  ]);

  const members = (membersRes.data ?? []).map((m: any) => ({
    profileId: m.profile_id,
    name: m.profiles?.full_name ?? '—',
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Descuentos y promociones</h1>
          <p className="text-secondary text-sm">
            El precio histórico de cada plan ya vendido nunca cambia — el descuento
            se aplica en el momento de la compra/renovación
          </p>
        </div>
        {perms.settings.edit && <NewDiscountForm plans={plansRes.data ?? []} />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Valor</th>
            <th>Plan</th>
            <th>Acumulable</th>
            <th>Usos</th>
            <th>Vence</th>
            {perms.settings.edit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {(discountsRes.data ?? []).map((d: any) => (
            <tr key={d.id}>
              <td>{d.code ?? <span className="text-secondary">Manual</span>}</td>
              <td>{formatValue(d.type, d.value)}</td>
              <td className="text-secondary">{d.membership_plans?.name ?? 'Cualquiera'}</td>
              <td className="text-secondary">{d.stackable ? 'Sí' : 'No'}</td>
              <td className="text-secondary">{(d.discount_redemptions ?? []).length}</td>
              <td className="text-secondary">
                {d.valid_until ? new Date(d.valid_until).toLocaleDateString('es-CO') : '—'}
              </td>
              {perms.settings.edit && (
                <td>
                  <RedeemDiscountForm discountId={d.id} members={members} />
                </td>
              )}
            </tr>
          ))}
          {(discountsRes.data ?? []).length === 0 && (
            <tr>
              <td colSpan={7} className="text-secondary text-center py-10">
                Sin descuentos creados todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
