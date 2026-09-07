import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { deleteExpense } from './actions';
import Link from 'next/link';

function monthStart(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function getFinance(boxId: string) {
  const from = monthStart(5); // últimos 6 meses incluyendo el actual

  const [paymentsRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from('payments')
      .select('amount_cents, paid_at, status, profiles(full_name)')
      .eq('box_id', boxId)
      .eq('status', 'paid')
      .gte('paid_at', from.toISOString())
      .order('paid_at', { ascending: false }),
    supabaseAdmin
      .from('expenses')
      .select('id, amount_cents, expense_date, description, expense_categories(name)')
      .eq('box_id', boxId)
      .gte('expense_date', from.toISOString().slice(0, 10))
      .order('expense_date', { ascending: false }),
  ]);

  const payments = paymentsRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // Agrupar por mes (YYYY-MM) para el resumen de 6 meses
  const months: { key: string; label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = monthStart(i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-CO', { month: 'short' });
    months.push({ key, label, income: 0, expense: 0 });
  }
  const byKey = Object.fromEntries(months.map((m) => [m.key, m]));

  for (const p of payments) {
    const d = new Date(p.paid_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (byKey[key]) byKey[key].income += p.amount_cents;
  }
  for (const e of expenses) {
    const d = new Date(e.expense_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (byKey[key]) byKey[key].expense += e.amount_cents;
  }

  return { months, payments: payments.slice(0, 15), expenses: expenses.slice(0, 15) };
}

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function FinancePage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);
  const { months, payments, expenses } = await getFinance(session.boxId);

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);
  const maxValue = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Finanzas</h1>
          <p className="text-secondary text-sm">
            Ingresos por pagos de planes y gastos del box — últimos 6 meses
          </p>
        </div>
        {perms.expenses.create && (
          <Link
            href="/finanzas/gastos/nuevo"
            className="bg-accent text-primary text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Registrar gasto
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-px bg-border border border-border mb-10">
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium text-success">
            {formatCOP(totalIncome)}
          </div>
          <div className="text-secondary text-sm mt-1">Ingresos (6 meses)</div>
        </div>
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium text-accent">
            {formatCOP(totalExpense)}
          </div>
          <div className="text-secondary text-sm mt-1">Gastos (6 meses)</div>
        </div>
        <div className="bg-bg px-5 py-6">
          <div className="font-display text-2xl font-medium">
            {formatCOP(totalIncome - totalExpense)}
          </div>
          <div className="text-secondary text-sm mt-1">Balance neto</div>
        </div>
      </div>

      {/* Barras simples ingresos vs gastos por mes */}
      <div className="mb-10">
        <div className="flex items-end gap-4 h-40 border-b border-border pb-2">
          {months.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  className="w-3 bg-success rounded-t"
                  style={{ height: `${(m.income / maxValue) * 100}%` }}
                  title={`Ingresos: ${formatCOP(m.income)}`}
                />
                <div
                  className="w-3 bg-accent rounded-t"
                  style={{ height: `${(m.expense / maxValue) * 100}%` }}
                  title={`Gastos: ${formatCOP(m.expense)}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          {months.map((m) => (
            <div key={m.key} className="flex-1 text-center text-xs text-secondary capitalize">
              {m.label}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm bg-success inline-block" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Gastos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-sm font-medium mb-3">Pagos recientes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.profiles?.full_name ?? '—'}</td>
                  <td className="text-success">{formatCOP(p.amount_cents)}</td>
                  <td className="text-secondary">
                    {new Date(p.paid_at).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-secondary text-center py-8">
                    Sin pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="font-display text-sm font-medium mb-3">Gastos recientes</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
                {(perms.expenses.edit || perms.expenses.delete) && <th></th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id}>
                  <td>
                    {e.description}
                    {e.expense_categories?.name && (
                      <span className="text-secondary"> · {e.expense_categories.name}</span>
                    )}
                  </td>
                  <td className="text-accent">{formatCOP(e.amount_cents)}</td>
                  <td className="text-secondary">
                    {new Date(e.expense_date).toLocaleDateString('es-CO')}
                  </td>
                  {(perms.expenses.edit || perms.expenses.delete) && (
                    <td>
                      <div className="flex gap-3 justify-end">
                        {perms.expenses.edit && (
                          <Link
                            href={`/finanzas/gastos/${e.id}/editar`}
                            className="text-xs text-secondary hover:text-primary"
                          >
                            Editar
                          </Link>
                        )}
                        {perms.expenses.delete && (
                          <form action={deleteExpense.bind(null, e.id)}>
                            <button type="submit" className="text-xs text-accent hover:opacity-80">
                              Borrar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-secondary text-center py-8">
                    Sin gastos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
