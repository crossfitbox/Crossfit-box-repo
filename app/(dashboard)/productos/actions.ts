'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireStaffSession } from '@/lib/require-staff';
import { can } from '@/lib/permissions';

export async function createProduct(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para crear productos');
  }

  await supabaseAdmin.from('products').insert({
    box_id: session.boxId,
    name: formData.get('name'),
    sku: formData.get('sku') || null,
    cost_cents: Math.round(Number(formData.get('cost') || 0) * 100),
    price_cents: Math.round(Number(formData.get('price')) * 100),
    stock: Number(formData.get('stock') || 0),
  });

  revalidatePath('/productos');
}

/** Venta rápida: registra la venta y descuenta stock (vía trigger). */
export async function registerSale(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para registrar ventas');
  }

  const productId = formData.get('product_id') as string;
  const quantity = Number(formData.get('quantity'));

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('price_cents')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Producto no encontrado');

  const { data: sale } = await supabaseAdmin
    .from('sales')
    .insert({
      box_id: session.boxId,
      profile_id: formData.get('profile_id') || null,
      total_cents: product.price_cents * quantity,
      sold_by: session.userId,
    })
    .select('id')
    .single();

  await supabaseAdmin.from('sale_items').insert({
    sale_id: sale!.id,
    product_id: productId,
    quantity,
    unit_price_cents: product.price_cents,
  });

  revalidatePath('/productos');
}

export async function restockProduct(formData: FormData) {
  const session = await requireStaffSession();
  if (!(await can(session, 'settings', 'edit'))) {
    throw new Error('No tienes permiso para ajustar inventario');
  }

  const productId = formData.get('product_id') as string;
  const quantity = Number(formData.get('quantity'));

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  await supabaseAdmin
    .from('products')
    .update({ stock: (product?.stock ?? 0) + quantity })
    .eq('id', productId);

  revalidatePath('/productos');
}
