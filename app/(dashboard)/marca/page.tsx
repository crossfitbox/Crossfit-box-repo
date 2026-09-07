import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireBrandSession } from '@/lib/require-brand';

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function BrandPage() {
  const session = await requireBrandSession();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: boxes } = await supabaseAdmin
    .from('boxes')
    .select('id, name, status')
    .eq('brand_id', session.brandId);

  const boxIds = (boxes ?? []).map((b) => b.id);

  const [membersRes, paymentsRes, royaltyRes] = await Promise.all([
    supabaseAdmin.from('box_members').select('box_id').in('box_id', boxIds).eq('role', 'athlete').eq('status', 'active'),
    supabaseAdmin.from('payments').select('box_id, amount_cents').in('box_id', boxIds).eq('status', 'paid').gte('paid_at', thirtyDaysAgo),
    supabaseAdmin
      .from('royalty_agreements')
      .select('box_id, royalty_percent, royalty_charges(royalty_owed_cents, status)')
      .in('box_id', boxIds),
  ]);

  const membersByBox = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    membersByBox.set(m.box_id, (membersByBox.get(m.box_id) ?? 0) + 1);
  }
  const revenueByBox = new Map<string, number>();
  for (const p of paymentsRes.data ?? []) {
    revenueByBox.set(p.box_id, (revenueByBox.get(p.box_id) ?? 0) + p.amount_cents);
  }

  const totalMembers = [...membersByBox.values()].reduce((s, v) => s + v, 0);
  const totalRevenue = [...revenueByBox.values()].reduce((s, v) => s + v, 0);
  const totalRoyaltiesOwed = (royaltyRes.data ?? []).reduce((s: number, r: any) => {
    const pending = (r.royalty_charges ?? []).filter((c: any) => c.status === 'pending');
    return s + pending.reduce((s2: number, c: any) => s2 + c.royalty_owed_cents, 0);
  }, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-medium mb-1">{session.brandName}</h1>
        <p className="text-secondary text-sm">
          {(boxes ?? []).length} {(boxes ?? []).length === 1 ? 'box' : 'boxes'} — vista consolidada
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border border border-border mb-10">
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium">{totalMembers}</div>
          <div className="text-secondary text-sm mt-1">Miembros activos (toda la marca)</div>
        </div>
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium">{formatCOP(totalRevenue)}</div>
          <div className="text-secondary text-sm mt-1">Ingresos consolidados (30 días)</div>
        </div>
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium text-warning">{formatCOP(totalRoyaltiesOwed)}</div>
          <div className="text-secondary text-sm mt-1">Regalías pendientes</div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Box</th>
            <th>Estado</th>
            <th>Miembros</th>
            <th>Ingresos (30 días)</th>
            <th>% Regalía</th>
          </tr>
        </thead>
        <tbody>
          {(boxes ?? []).map((b) => {
            const agreement = (royaltyRes.data ?? []).find((r: any) => r.box_id === b.id) as any;
            return (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>
                  <span className={`pill ${b.status === 'active' ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'}`}>
                    {b.status}
                  </span>
                </td>
                <td>{membersByBox.get(b.id) ?? 0}</td>
                <td>{formatCOP(revenueByBox.get(b.id) ?? 0)}</td>
                <td className="text-secondary">{agreement ? `${agreement.royalty_percent}%` : '—'}</td>
              </tr>
            );
          })}
          {(boxes ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                Sin boxes asociados a esta marca todavía
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
