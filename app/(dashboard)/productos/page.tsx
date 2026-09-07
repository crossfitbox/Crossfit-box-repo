import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { getPermissions } from '@/lib/permissions';
import { NewProductForm, ProductRowActions } from './product-forms';

function formatCOP(cents: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cents / 100);
}

export default async function ProductsPage() {
  const session = await requireStaffSession();
  const perms = await getPermissions(session);

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, sku, price_cents, stock, active')
    .eq('box_id', session.boxId)
    .order('name');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-medium mb-1">Productos e inventario</h1>
          <p className="text-secondary text-sm">Suplementos, ropa, accesorios — con stock en tiempo real</p>
        </div>
        {perms.settings.edit && <NewProductForm />}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Stock</th>
            {perms.settings.edit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {(products ?? []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td className="text-secondary">{p.sku ?? '—'}</td>
              <td>{formatCOP(p.price_cents)}</td>
              <td>
                <span className={`pill ${p.stock <= 3 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                  {p.stock}
                </span>
              </td>
              {perms.settings.edit && (
                <td>
                  <ProductRowActions productId={p.id} />
                </td>
              )}
            </tr>
          ))}
          {(products ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="text-secondary text-center py-10">
                Sin productos registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
